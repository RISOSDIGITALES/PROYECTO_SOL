"""
Actualiza CE Email - Outreach Prospectos (bFjarbrGigp90UCL):
  Añade UN párrafo de urgencia natural al email tipo 1 únicamente.
  Ángulo: plazo de embarque real + capacidad limitada del taller.

  Los tipos 2, 3 y 4 NO se tocan.

Ejecución : python3 update_email_urgencia.py
Requiere   : pip install requests
Antes      : reemplaza N8N_TOKEN_HERE con tu token real de n8n.
Nota       : corre DESPUÉS de update_email_nicho.py (este script
             modifica el mismo nodo build-email).
"""
import json
import requests

TOKEN = "N8N_TOKEN_HERE"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "bFjarbrGigp90UCL"

print("[Email] Leyendo workflow...")
data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]
print(f"  Nodes: {len(nodes)} | {data['name']}")

# ════════════════════════════════════════════════════════════════════════════
# Párrafo de urgencia para tipo 1
# Se inserta justo antes del bloque de botones CTA
# ════════════════════════════════════════════════════════════════════════════
URGENCY_PARA = (
    "  <p>If you have a shipment coming up \u2014 even weeks out \u2014 "
    "now is the right time to reach out. "
    "Our Miami shop handles custom orders on a 48\u201372 hour turnaround, "
    "but capacity for oversized crates fills up fast. "
    "Early coordination means we can guarantee your timeline.</p>"
)

# ════════════════════════════════════════════════════════════════════════════
# The urgency block is injected into the existing build-email jsCode.
# Strategy: find the CTA div marker in tipo 1 and insert before it.
#
# Marker we look for (present in both update_email_nicho.py and the
# original create_email_outreach.py):
#   <div style="text-align:center;margin:28px 0;">
#     <a href="${quoteLink}"  ← this is the quote button
#
# We only inject inside the tipo===1 block, so we search for the
# first occurrence of that div AFTER the tipo===1 branch opens.
# ════════════════════════════════════════════════════════════════════════════
INJECT_BEFORE = '  <div style="text-align:center;margin:28px 0;">\n    <a href="${quoteLink}"'

build_node = None
for n in nodes:
    if n["id"] == "build-email":
        build_node = n
        break

if not build_node:
    print("  ⚠️  Nodo 'build-email' no encontrado.")
    print("     IDs disponibles:", [n["id"] for n in nodes])
    exit(1)

original_code = build_node["parameters"]["jsCode"]

# Safety: don't double-inject
if "48\u201372 hour turnaround" in original_code:
    print("  ~ Urgencia ya presente, sin cambios necesarios.")
else:
    # Find the insertion point — first occurrence of the CTA div
    # (which belongs to tipo===1 since it appears earliest in the code)
    idx = original_code.find(INJECT_BEFORE)
    if idx == -1:
        # Fallback: try without the second line
        INJECT_BEFORE_SHORT = '  <div style="text-align:center;margin:28px 0;">'
        idx = original_code.find(INJECT_BEFORE_SHORT)

    if idx == -1:
        print("  ⚠️  No se encontró el marcador de inserción.")
        print("     Revisa manualmente el nodo build-email en n8n.")
        exit(1)

    new_code = (
        original_code[:idx]
        + URGENCY_PARA + "\n"
        + original_code[idx:]
    )
    build_node["parameters"]["jsCode"] = new_code
    print("  ✓ Párrafo de urgencia añadido al email tipo 1")

    # ── Push ─────────────────────────────────────────────────────────────────
    payload = {
        "name":        data["name"],
        "nodes":       nodes,
        "connections": data["connections"],
        "settings":    data.get("settings", {}),
        "staticData":  data.get("staticData"),
    }
    r = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=payload)
    result = r.json()

    if "id" in result:
        print(f"\n  ✅ CE Email - Outreach actualizado OK")
        print(f"     Email tipo 1: +urgencia (48-72hr turnaround + capacidad limitada)")
    else:
        print("  ❌ ERROR:", json.dumps(result, indent=2)[:500])
