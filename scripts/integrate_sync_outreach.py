"""
Integra el sync de clientes directamente en CE Email - Outreach Prospectos.
Añade al inicio: lee clientes en paralelo con leads, detecta nuevos,
los agrega al sheet, y continúa con el flujo normal de outreach.
"""
import json, requests

TOKEN = "N8N_TOKEN_HERE"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "bFjarbrGigp90UCL"

LEADS_ID    = "1WRqv3s1vsTRSpfz6Bo27u3ff9kHDki_nDDMFt9yVj-8"
CLIENTS_ID  = "1pVwP9adnV1_2lbl5pzjhi0BsBjvr5yoPbxwV6P7sNQc"
CLIENTS_GID = "1789357450"
SHEETS_CRED = "QE2RlAxaMLoYefTD"

print("Leyendo workflow actual...")
data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]
print(f"  Nodes actuales: {len(nodes)} | {data['name']}")

# ── Code: detectar clientes nuevos desde el merge de leads + clientes ─────────
SYNC_CODE = r"""
const items = $input.all();

// Separar clientes de leads por sus columnas características
const clients = items.filter(i =>
  i.json['Cliente/ Notas'] !== undefined ||
  i.json['Cliente/Notas'] !== undefined
);
const leads = items.filter(i =>
  i.json['email'] !== undefined || i.json['nombre'] !== undefined
);

// Set de emails que ya existen en leads
const existing = new Set(
  leads
    .map(l => (l.json.email || '').toString().toLowerCase().trim())
    .filter(e => e.includes('@'))
);

const newClients = [];

for (const c of clients) {
  const nombre = (
    c.json['Cliente/ Notas'] || c.json['Cliente/Notas'] || ''
  ).toString().trim();
  if (!nombre) continue;

  // Puede tener múltiples correos separados por espacios o saltos
  const rawEmails = (c.json['Correos para Cobranza'] || '').toString().trim();
  if (!rawEmails) continue;

  const emails = rawEmails
    .split(/[\s,;\n]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'));
  if (emails.length === 0) continue;

  const email = emails[0];
  if (existing.has(email)) continue; // ya está en el sistema

  const direccion = (c.json['Direccion y Telefono'] || '').toString().trim();

  newClients.push({ json: {
    nombre,
    email,
    direccion,
    correo_enviado: '0',
    fecha_c1:       '',
    fecha_c2:       '',
    fecha_c3:       '',
    estado_email:   'reactivar'
  }});
}

if (newClients.length === 0) {
  return [{ json: { _sin_nuevos: true, count: 0 } }];
}

return newClients;
"""

# ── Schema para append al sheet de leads ──────────────────────────────────────
def sf(col_id, match=False):
    return {"id": col_id, "displayName": col_id, "required": False,
            "defaultMatch": match, "display": True, "type": "string",
            "canBeUsedToMatch": match}

LEADS_SCHEMA = [
    sf("nombre", True), sf("direccion"), sf("email"),
    sf("correo_enviado"), sf("fecha_c1"), sf("fecha_c2"),
    sf("fecha_c3"), sf("estado_email"),
]

# ── Nuevos nodos del sync ─────────────────────────────────────────────────────
new_nodes = [
    # Lee el sheet espejo de clientes (en paralelo con get-leads)
    {
        "id":   "get-clients",
        "name": "\U0001f4ca Obtener Clientes",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [240, 600],
        "credentials": {
            "googleSheetsOAuth2Api": {"id": SHEETS_CRED, "name": "Google Sheets account"}
        },
        "parameters": {
            "operation": "getAll",
            "documentId": {"__rl": True, "value": CLIENTS_ID,  "mode": "id"},
            "sheetName":  {"__rl": True, "value": f"gid={CLIENTS_GID}", "mode": "id"},
            "filtersUI":  {},
            "options":    {}
        }
    },
    # Merge: combina leads + clientes en un solo flujo
    {
        "id":   "merge-sync",
        "name": "\U0001f500 Merge Leads + Clientes",
        "type": "n8n-nodes-base.merge",
        "typeVersion": 3,
        "position": [720, 480],
        "parameters": {"mode": "append"}
    },
    # Code: detecta clientes nuevos
    {
        "id":   "sync-nuevos-code",
        "name": "\U0001f504 Sync: Detectar Nuevos Clientes",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [960, 480],
        "parameters": {"jsCode": SYNC_CODE}
    },
    # If: ¿hay clientes nuevos para agregar?
    {
        "id":   "if-hay-nuevos",
        "name": "\u2753 Hay Nuevos Clientes?",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.2,
        "position": [1200, 480],
        "parameters": {
            "conditions": {
                "options":    {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                "conditions": [{
                    "id":         "check-sin-nuevos",
                    "leftValue":  "={{ $json._sin_nuevos }}",
                    "rightValue": True,
                    "operator":   {"type": "boolean", "operation": "notEquals"}
                }],
                "combinator": "and"
            }
        }
    },
    # Append: agrega nuevos clientes al sheet de leads
    {
        "id":   "append-clientes",
        "name": "\u2795 Agregar Nuevos Clientes",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [1440, 380],
        "continueOnFail": True,
        "credentials": {
            "googleSheetsOAuth2Api": {"id": SHEETS_CRED, "name": "Google Sheets account"}
        },
        "parameters": {
            "operation": "append",
            "documentId": {"__rl": True, "value": LEADS_ID, "mode": "id"},
            "sheetName":  {"__rl": True, "value": "gid=0",  "mode": "id"},
            "columns": {
                "mappingMode": "defineBelow",
                "value": {
                    "nombre":         "={{ $json.nombre }}",
                    "direccion":      "={{ $json.direccion }}",
                    "email":          "={{ $json.email }}",
                    "correo_enviado": "={{ $json.correo_enviado }}",
                    "fecha_c1":       "={{ $json.fecha_c1 }}",
                    "fecha_c2":       "={{ $json.fecha_c2 }}",
                    "fecha_c3":       "={{ $json.fecha_c3 }}",
                    "estado_email":   "={{ $json.estado_email }}"
                },
                "matchingColumns": ["nombre"],
                "schema": LEADS_SCHEMA
            },
            "options": {}
        }
    },
    # Aggregate: colapsa los N items del append en 1 para no multiplicar leads
    {
        "id":   "aggregate-post-append",
        "name": "\U0001f4ca Agrupar Post-Append",
        "type": "n8n-nodes-base.aggregate",
        "typeVersion": 1,
        "position": [1680, 380],
        "parameters": {
            "aggregate": "aggregateAllItemData",
            "destinationFieldName": "clientes_nuevos",
            "options": {}
        }
    },
    # Lee leads frescos (ya con los nuevos clientes incluidos)
    {
        "id":   "get-leads-fresh",
        "name": "\U0001f4cb Leads Actualizados",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [1920, 480],
        "credentials": {
            "googleSheetsOAuth2Api": {"id": SHEETS_CRED, "name": "Google Sheets account"}
        },
        "parameters": {
            "operation": "getAll",
            "documentId": {"__rl": True, "value": LEADS_ID, "mode": "id"},
            "sheetName":  {"__rl": True, "value": "gid=0",  "mode": "id"},
            "filtersUI":  {},
            "options":    {}
        }
    },
]

# Agregar nuevos nodos al workflow
nodes.extend(new_nodes)
print(f"  Nuevos nodos añadidos: {[n['name'] for n in new_nodes]}")

# ── Reconstruir conexiones ────────────────────────────────────────────────────
conns = data["connections"]

# 1. get-latest-blog: ahora sale en paralelo hacia get-leads Y get-clients
blog_name = "\U0001f4f0 Obtener \u00daltimo Blog"
conns[blog_name] = {"main": [[
    {"node": "\U0001f4cb Obtener Leads",           "type": "main", "index": 0},
    {"node": "\U0001f4ca Obtener Clientes",        "type": "main", "index": 0},
]]}

# 2. get-leads: ahora va a merge-sync (input 0), no a clasificar-leads
leads_name = "\U0001f4cb Obtener Leads"
conns[leads_name] = {"main": [[
    {"node": "\U0001f500 Merge Leads + Clientes",  "type": "main", "index": 0},
]]}

# 3. get-clients: va a merge-sync (input 1)
conns["\U0001f4ca Obtener Clientes"] = {"main": [[
    {"node": "\U0001f500 Merge Leads + Clientes",  "type": "main", "index": 1},
]]}

# 4. merge → sync-code → if-hay-nuevos
conns["\U0001f500 Merge Leads + Clientes"]        = {"main": [[{"node": "\U0001f504 Sync: Detectar Nuevos Clientes", "type": "main", "index": 0}]]}
conns["\U0001f504 Sync: Detectar Nuevos Clientes"] = {"main": [[{"node": "\u2753 Hay Nuevos Clientes?",             "type": "main", "index": 0}]]}

# 5. if-hay-nuevos:
#    TRUE  (index 0) → append → aggregate → get-leads-fresh
#    FALSE (index 1) → get-leads-fresh directo
conns["\u2753 Hay Nuevos Clientes?"] = {"main": [
    [{"node": "\u2795 Agregar Nuevos Clientes",  "type": "main", "index": 0}],  # TRUE
    [{"node": "\U0001f4cb Leads Actualizados",   "type": "main", "index": 0}],  # FALSE
]}
conns["\u2795 Agregar Nuevos Clientes"]  = {"main": [[{"node": "\U0001f4ca Agrupar Post-Append",  "type": "main", "index": 0}]]}
conns["\U0001f4ca Agrupar Post-Append"]  = {"main": [[{"node": "\U0001f4cb Leads Actualizados",   "type": "main", "index": 0}]]}

# 6. get-leads-fresh → clasificar-leads (antes era get-leads → clasificar-leads)
conns["\U0001f4cb Leads Actualizados"] = {"main": [[{"node": "\U0001f50d Clasificar Leads", "type": "main", "index": 0}]]}

print("  Conexiones actualizadas")

# ── Push ─────────────────────────────────────────────────────────────────────
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
    print(f"\n✅ CE Email - Outreach Prospectos actualizado")
    print(f"   Total nodes: {len(result.get('nodes', []))}")
    print(f"   El sync de clientes ahora corre automáticamente cada miércoles.")
else:
    print("❌ ERROR:", json.dumps(result, indent=2)[:500])
