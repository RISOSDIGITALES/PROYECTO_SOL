"""
Actualiza CE Blog Unified (38fO1D5uJpVUDMqm):
Reemplaza el placeholder INSTAGRAM_ACCOUNT_ID con el ID real de la cuenta
de Instagram Business vinculada a la página Crating Express.

Instagram Account ID: 1675016563919384
"""
import json, requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "38fO1D5uJpVUDMqm"

INSTAGRAM_ACCOUNT_ID = "1675016563919384"

data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]

updated = []

for node in nodes:
    params_str = json.dumps(node.get("parameters", {}))
    if "INSTAGRAM_ACCOUNT_ID" in params_str:
        new_params_str = params_str.replace("INSTAGRAM_ACCOUNT_ID", INSTAGRAM_ACCOUNT_ID)
        node["parameters"] = json.loads(new_params_str)
        updated.append(node.get("name", node.get("id", "unknown")))

if not updated:
    print("⚠️  No se encontró ningún placeholder INSTAGRAM_ACCOUNT_ID")
else:
    for name in updated:
        print(f"  → {name}: INSTAGRAM_ACCOUNT_ID reemplazado con {INSTAGRAM_ACCOUNT_ID}")

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
        print(f"\n✅ CE Blog Unified actualizado OK — {len(updated)} nodo(s) modificados")
    else:
        print("❌ ERROR:", json.dumps(result, indent=2)[:500])
