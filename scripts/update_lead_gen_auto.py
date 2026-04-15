"""
Actualiza Lead Gen (rtyrpJJsXD2xHINU) para:
  1. Añadir Schedule Trigger (lunes 9am) — deja el manual como respaldo
  2. Insertar nodo 'Seleccionar Nicho' con rotación semanal de 8 nichos
  3. Actualizar el nodo HTTP de Google Places para usar el nicho actual
  4. Añadir columna 'nicho' al nodo de Google Sheets (append)

Ejecución: python3 update_lead_gen_auto.py
Requiere: pip install requests
Antes de correr: reemplaza N8N_TOKEN_HERE con tu token real de n8n.
"""
import json
import requests

TOKEN = "N8N_TOKEN_HERE"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "rtyrpJJsXD2xHINU"

print("[Lead Gen] Leyendo workflow actual...")
resp = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H)
data = resp.json()
nodes = data["nodes"]
conns = data["connections"]

print(f"  Nombre : {data['name']}")
print(f"  Nodes  : {len(nodes)}")
for n in nodes:
    print(f"    [{n['id']}] {n['name']} — {n['type'].split('.')[-1]}")

# ════════════════════════════════════════════════════════════════════════════
# 1.  Schedule Trigger (lunes 9am) — solo si no existe ya
# ════════════════════════════════════════════════════════════════════════════
has_schedule = any(n["type"] == "n8n-nodes-base.scheduleTrigger" for n in nodes)
manual_node  = next((n for n in nodes if n["type"] == "n8n-nodes-base.manualTrigger"), None)

if not has_schedule:
    schedule_node = {
        "id":   "schedule-lunes",
        "name": "\u23f0 Trigger Lunes 9am",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [
            (manual_node["position"][0] if manual_node else 0),
            (manual_node["position"][1] - 160 if manual_node else -160),
        ],
        "parameters": {
            "rule": {"interval": [{
                "field":           "weeks",
                "weeksInterval":   1,
                "triggerAtDay":    [1],
                "triggerAtHour":   9,
                "triggerAtMinute": 0
            }]}
        }
    }
    nodes.append(schedule_node)
    print("  + Añadido Schedule Trigger (lunes 9am)")
else:
    schedule_node = next(n for n in nodes if n["type"] == "n8n-nodes-base.scheduleTrigger")
    print("  ~ Schedule Trigger ya existe, se omite")

# ════════════════════════════════════════════════════════════════════════════
# 2.  Nodo 'Seleccionar Nicho' — rotación semanal con 8 nichos
# ════════════════════════════════════════════════════════════════════════════
NICHO_CODE = r"""
const NICHES = [
  { id: 'customs-brokers',    query: 'customs broker Miami',          label: 'Customs Brokers' },
  { id: 'freight-forwarders', query: 'freight forwarder Miami',       label: 'Freight Forwarders' },
  { id: 'importers-exporters',query: 'import export company Miami',   label: 'Import/Export Companies' },
  { id: 'industrial-equip',   query: 'industrial equipment dealer Miami', label: 'Industrial Equipment Dealers' },
  { id: 'art-galleries',      query: 'art gallery Miami',             label: 'Art Galleries' },
  { id: 'aerospace',          query: 'aerospace company Miami',       label: 'Aerospace Companies' },
  { id: 'medical-equipment',  query: 'medical equipment company Miami',label: 'Medical Equipment Companies' },
  { id: 'manufacturing',      query: 'manufacturing company Miami',   label: 'Manufacturing Companies' },
];

// Rotate by ISO week number so the same niche runs all week
const now = new Date();
const jan1 = new Date(now.getFullYear(), 0, 1);
const weekNum = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
const niche = NICHES[weekNum % NICHES.length];

console.log(`[Nicho] Semana ${weekNum} → ${niche.label}`);
return [{ json: niche }];
"""

has_nicho = any(n["id"] == "seleccionar-nicho" for n in nodes)
if not has_nicho:
    # Position: right after manual trigger
    base_x = (manual_node["position"][0] + 240) if manual_node else 240
    base_y = (manual_node["position"][1]) if manual_node else 300

    nicho_node = {
        "id":   "seleccionar-nicho",
        "name": "\U0001f3af Seleccionar Nicho",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [base_x, base_y],
        "parameters": {"jsCode": NICHO_CODE}
    }
    nodes.append(nicho_node)
    print("  + Añadido nodo Seleccionar Nicho")
else:
    # Update existing node code
    for n in nodes:
        if n["id"] == "seleccionar-nicho":
            n["parameters"]["jsCode"] = NICHO_CODE
    print("  ~ Seleccionar Nicho ya existe, código actualizado")

# ════════════════════════════════════════════════════════════════════════════
# 3.  Actualizar nodo Google Places para usar el nicho actual
#     Busca el primer HttpRequest cuya URL contenga 'maps.googleapis'
# ════════════════════════════════════════════════════════════════════════════
places_node = None
for n in nodes:
    url = ""
    params = n.get("parameters", {})
    if isinstance(params.get("url"), str):
        url = params["url"]
    elif isinstance(params.get("url"), dict):
        url = params["url"].get("value", "")
    if "maps.googleapis" in url or "places" in url.lower():
        places_node = n
        break

if places_node:
    params = places_node["parameters"]
    # Update the query/textQuery to use nicho
    # The API accepts either 'query' (old) or 'textQuery' (new Places API)
    for qparam in (params.get("queryParameters", {}).get("parameters", [])):
        if qparam.get("name") in ("query", "textQuery", "input"):
            qparam["value"] = "={{ $('\U0001f3af Seleccionar Nicho').item.json.query }}"
            print(f"  + Google Places: campo '{qparam['name']}' ahora usa nicho dinámico")
            break
    else:
        print("  ⚠️  Google Places: no se encontró el parámetro query/textQuery — revísalo manualmente")
else:
    print("  ⚠️  No se encontró nodo Google Places — revisalo manualmente")

# ════════════════════════════════════════════════════════════════════════════
# 4.  Añadir columna 'nicho' al Google Sheets append
# ════════════════════════════════════════════════════════════════════════════
append_node = None
for n in nodes:
    if (
        n["type"] == "n8n-nodes-base.googleSheets"
        and n.get("parameters", {}).get("operation") == "append"
    ):
        append_node = n
        break

if append_node:
    params = append_node["parameters"]
    cols   = params.get("columns", {})
    values = cols.get("value", {})
    schema = cols.get("schema", [])

    if "nicho" not in values:
        values["nicho"] = "={{ $('\U0001f3af Seleccionar Nicho').item.json.id }}"
        cols["value"] = values
        print("  + Sheets append: añadida columna 'nicho'")

    # Add nicho to schema if not present
    if not any(s.get("id") == "nicho" for s in schema):
        schema.append({
            "id": "nicho", "displayName": "nicho",
            "required": False, "defaultMatch": False,
            "display": True, "type": "string", "canBeUsedToMatch": False
        })
        cols["schema"] = schema
        print("  + Sheets append: nicho añadido al schema")
else:
    print("  ⚠️  No se encontró nodo Google Sheets append — revisalo manualmente")

# ════════════════════════════════════════════════════════════════════════════
# 5.  Conexiones: trigger → nicho → (primer nodo del flujo original)
# ════════════════════════════════════════════════════════════════════════════
# Detectar el primer nodo que recibe del manual trigger
first_node_name = None
if manual_node:
    manual_conns = conns.get(manual_node["name"], {}).get("main", [[]])
    if manual_conns and manual_conns[0]:
        first_node_name = manual_conns[0][0]["node"]

nicho_name = "\U0001f3af Seleccionar Nicho"

if first_node_name and first_node_name != nicho_name:
    # Schedule trigger → nicho → first_node
    conns[schedule_node["name"]] = {
        "main": [[{"node": nicho_name, "type": "main", "index": 0}]]
    }
    # Manual trigger → nicho → first_node (keep manual going through nicho too)
    conns[manual_node["name"]] = {
        "main": [[{"node": nicho_name, "type": "main", "index": 0}]]
    }
    # nicho → existing first_node
    conns[nicho_name] = {
        "main": [[{"node": first_node_name, "type": "main", "index": 0}]]
    }
    print(f"  + Conexiones: Triggers → Nicho → {first_node_name}")
else:
    # Nicho ya conectado, solo asegurar schedule → nicho
    conns[schedule_node["name"]] = {
        "main": [[{"node": nicho_name, "type": "main", "index": 0}]]
    }
    print("  ~ Conexiones del nicho ya configuradas")

# ════════════════════════════════════════════════════════════════════════════
# 6.  Push
# ════════════════════════════════════════════════════════════════════════════
payload = {
    "name":        data["name"],
    "nodes":       nodes,
    "connections": conns,
    "settings":    data.get("settings", {}),
    "staticData":  data.get("staticData"),
}
r = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=payload)
result = r.json()

if "id" in result:
    print(f"\n  ✅ Lead Gen actualizado OK (ID: {result['id']})")
    print(f"     Total nodes: {len(result.get('nodes', []))}")
else:
    print("  ❌ ERROR:", json.dumps(result, indent=2)[:500])
