"""
Actualiza CE Blog Unified (38fO1D5uJpVUDMqm):
Reemplaza el token de "Estrella Veloz" con el token permanente
de la página Crating Express - Miami's Crating Company.

Page ID: 1713965015486703
"""
import json, requests

N8N_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": N8N_TOKEN, "Content-Type": "application/json"}
WF_ID = "38fO1D5uJpVUDMqm"

# Token permanente de Crating Express (obtenido via /me/accounts con token de 60 días)
NEW_TOKEN = "EAALcI7uQ5DkBRCIHHSW9OOahDL4WhEFzf00tZAW1ZCJfTiMaijQOqx8jNoR9ZBkzxKZBcku5q9BCTcqLaxCaRsf2ogpQRlIrYwOuVZBKNkJbNyDqdVihJhrOtm04FvlJ1ywRZCF7aBzOAMrmvScZCM5yCc19AxAL4uP7yZC5DzfPNAZAmrDIQiaJe5cFotYEJrzxFUx5D"

# Token viejo (de Estrella Veloz) que estaba mal puesto
OLD_TOKEN = "EAALcI7uQ5DkBROyQLocd7OWWYsJmeo58FCXWnkEdutbPIU2qX5fA3fuZAWBeQ8xtvWQAmBxNJbmp4Y7iINspcipjjn44mxYhFnn1DKifjXOZBe8d1kGOjQt26w3LQIV4jcHkZAqZCbWAluR7HjCSYZABseILUDSZBwYZCnl9NJecZCNN2H8CqTvapKBD35RjYsmlLZAm2WDYLZCrafPsL6pzywEPKicqI5PWEKMnUQoegNoX7wCZBKTtk3YF5WrPVG7uZAWt7UERvig3fVvhFaZByedx4"

data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]

params_str = json.dumps(nodes)
if OLD_TOKEN not in params_str:
    print("⚠️  Token antiguo no encontrado — puede que ya haya sido actualizado")
    # Show what tokens are in access_token fields
    for n in nodes:
        p = n.get("parameters", {})
        for param in p.get("queryParameters", {}).get("parameters", []):
            if param.get("name") == "access_token":
                print(f"  Node '{n.get('name')}': token = {param['value'][:40]}...")
else:
    new_params_str = params_str.replace(OLD_TOKEN, NEW_TOKEN)
    nodes = json.loads(new_params_str)

    updated = []
    for n in nodes:
        p_str = json.dumps(n.get("parameters", {}))
        if NEW_TOKEN in p_str:
            updated.append(n.get("name", n.get("id")))

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
        print(f"✅ Token actualizado en {len(updated)} nodo(s):")
        for name in updated:
            print(f"  → {name}")
    else:
        print("❌ ERROR:", json.dumps(result, indent=2)[:500])
