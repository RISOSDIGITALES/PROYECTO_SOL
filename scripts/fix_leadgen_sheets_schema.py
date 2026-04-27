"""
Update Lead Gen Sheets node schema to include nicho, idioma, empresa columns.
Also add nicho to the Leads sheet schema in Email Outreach.
"""
import requests, sys

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE = "https://n8n.mdarthurdigital.com/api/v1"
H    = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}

new_fields = [
    {"id": "nicho",   "displayName": "nicho",   "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
    {"id": "idioma",  "displayName": "idioma",  "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
    {"id": "empresa", "displayName": "empresa", "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True, "removed": False},
]

for wf_id, node_id, wf_label in [
    ("rtyrpJJsXD2xHINU", "node-sheets", "Lead Generation"),
]:
    r = requests.get(f"{BASE}/workflows/{wf_id}", headers=H, timeout=30)
    r.raise_for_status()
    wf = r.json()

    for node in wf["nodes"]:
        if node["id"] == node_id:
            schema = node["parameters"]["columns"]["schema"]
            existing_ids = {s["id"] for s in schema}
            for field in new_fields:
                if field["id"] not in existing_ids:
                    schema.append(field)
                    print(f"✅ [{wf_label}] Added column: {field['id']}")
                else:
                    print(f"ℹ️  [{wf_label}] Column already exists: {field['id']}")
            break

    payload = {
        "name": wf["name"],
        "nodes": wf["nodes"],
        "connections": wf["connections"],
        "settings": wf.get("settings", {}),
        "staticData": wf.get("staticData"),
    }
    r2 = requests.put(f"{BASE}/workflows/{wf_id}", headers=H, json=payload, timeout=30)
    if r2.status_code == 200:
        print(f"✅ [{wf_label}] Sheets schema updated")
    else:
        print(f"❌ [{wf_label}] Error {r2.status_code}: {r2.text[:300]}")
        sys.exit(1)
