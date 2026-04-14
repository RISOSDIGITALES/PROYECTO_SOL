"""
Actualiza CE Blog Unified (38fO1D5uJpVUDMqm):
Configura los nodos de Instagram para usar el nuevo flujo:
  - Dominio: graph.instagram.com/v25.0  (en lugar de graph.facebook.com)
  - IG Business Account ID: 26563071519994138  (obtenido via /me con token IGAAX)
  - Token: IGAAX (Instagram Login token, válido ~60 días, renovable)

NOTA: El token IGAAX expira en ~60 días. Para renovarlo:
  GET https://graph.instagram.com/refresh_access_token
      ?grant_type=ig_refresh_token
      &access_token={IGAAX_TOKEN}
"""
import json, requests

N8N_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": N8N_TOKEN, "Content-Type": "application/json"}
WF_ID = "38fO1D5uJpVUDMqm"

# Token IGAAX obtenido desde Meta App → Casos de uso →
# "Administrar mensajes y contenido en Instagram" → Generar tokens de acceso
IGAAX_TOKEN = "IGAAXzay9JChhBZAGE4YW55cHR0WmExMU5TbGl4NlhRb1NmT01UcG0wSEdoN1JJem5tX0FONEhHdGFpMUljZAHdCaUJUaGVHbXA5a0hvR2pESElybExiamx1QUlubFBUdTBiY3J2Q0xLWDEycHhhdFJKMHdsSUdBR0ktdFhfSUVFcwZDZD"

# IG Business Account ID (obtenido via GET /me con token IGAAX en graph.instagram.com)
IG_ACCOUNT_ID = "26563071519994138"

IG_NODES = ["📸 Instagram: Crear Container", "✅ Instagram: Publicar Container"]

data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]

updated = []
for node in nodes:
    if node.get("name") not in IG_NODES:
        continue
    p = node["parameters"]
    # Update URL to graph.instagram.com
    old_url = p.get("url", "")
    new_url = old_url.replace("graph.facebook.com/v19.0", "graph.instagram.com/v25.0")
    # Normalize IG account ID (in case old ID was there)
    for old_id in ["17841446392201293", "INSTAGRAM_ACCOUNT_ID"]:
        new_url = new_url.replace(old_id, IG_ACCOUNT_ID)
    p["url"] = new_url
    # Update access_token
    for param in p.get("queryParameters", {}).get("parameters", []):
        if param.get("name") == "access_token":
            param["value"] = IGAAX_TOKEN
    updated.append(node.get("name"))

if not updated:
    print("⚠️  No se encontraron nodos de Instagram")
else:
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
        print(f"✅ Nodos de Instagram actualizados:")
        for name in updated:
            print(f"  → {name}")
        print(f"\n⚠️  RECORDATORIO: El token IGAAX expira en ~60 días (aprox. {__import__('datetime').date.today().replace(day=__import__('datetime').date.today().day) + __import__('datetime').timedelta(days=60)})")
        print("   Para renovar: GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=...")
    else:
        print("❌ ERROR:", json.dumps(result, indent=2)[:500])
