"""
RRSS Automation: añade selección de plataformas al email de aprobación.
Workflow: RRSS Automation - Crating Express (HqKUsOwwguIYQbsU)
Nodes modificados: enviar-email-aprobacion (message) y mk-apr (jsonBody).

Cambios:
  - Reemplaza el único botón "APROBAR Y PUBLICAR" por 3 opciones:
      ✅ Todas (FB + IG)
      📘 Solo Facebook
      📸 Solo Instagram
    Cada botón agrega ?facebook=true/false&instagram=true/false al webhook.
  - mk-apr ahora envía publish_facebook y publish_instagram a Make.com.
    Make.com debe leer esos flags para decidir en qué red publicar.
"""
import json, requests

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "HqKUsOwwguIYQbsU"

data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]

email_node = next(n for n in nodes if n["id"] == "enviar-email-aprobacion")
mk_node    = next(n for n in nodes if n["id"] == "mk-apr")

# ── Base URL expression (same for every approve button) ───────────────────────
base_url = (
    "'https://n8n.mdarthurdigital.com/webhook/aprobar-post"
    "?recordId=' + $('\U0001f4be Crear Registro en Airtable').item.json.records[0].id"
    " + '&temaId=' + $('\U0001f50d Parsear Versiones Ingl\u00e9s').item.json.tema_id"
    " + '&imageUrl=' + encodeURIComponent('https://docs.google.com/presentation/d/'"
    " + $('\U0001f4cb Slides: Copiar Template').item.json.id"
    " + '/export/png?id=' + $('\U0001f4cb Slides: Copiar Template').item.json.id"
    " + '&pageid=p1')"
)

reject_url = (
    "'https://n8n.mdarthurdigital.com/webhook/aprobar-post"
    "?recordId=' + $('\U0001f4be Crear Registro en Airtable').item.json.records[0].id"
    " + '&temaId=' + $('\U0001f50d Parsear Versiones Ingl\u00e9s').item.json.tema_id"
    " + '&action=rechazar'"
)

btn = "display:inline-block;border-radius:6px;text-decoration:none;font-size:15px;font-weight:bold;padding:12px 22px;margin:6px;"

new_buttons = (
    "  <div style='text-align: center; padding: 10px 0;'>\n"
    "    <h3 style='color: #1a1a2e; margin-bottom: 8px;'>\u00bfEn qu\u00e9 plataformas publicar?</h3>\n"
    "    <p style='color: #666; font-size: 13px; margin: 0 0 18px;'>Elige las plataformas y haz clic para aprobar:</p>\n\n"
    f"    <a href='{{{{ {base_url} + '&facebook=true&instagram=true&action=aprobar' }}}}'\n"
    f"       style='{btn}background:#28a745;color:white;'>\n"
    "      \u2705 Todas (FB + IG)\n"
    "    </a><br>\n\n"
    f"    <a href='{{{{ {base_url} + '&facebook=true&instagram=false&action=aprobar' }}}}'\n"
    f"       style='{btn}background:#1877F2;color:white;'>\n"
    "      \U0001f4d8 Solo Facebook\n"
    "    </a>\n\n"
    f"    <a href='{{{{ {base_url} + '&facebook=false&instagram=true&action=aprobar' }}}}'\n"
    f"       style='{btn}background:#E1306C;color:white;'>\n"
    "      \U0001f4f8 Solo Instagram\n"
    "    </a><br>\n\n"
    f"    <a href='{{{{ {reject_url} }}}}'\n"
    f"       style='{btn}background:#dc3545;color:white;margin-top:14px;'>\n"
    "      \u274c RECHAZAR\n"
    "    </a>\n"
    "  </div>"
)

# ── Replace the old single-button block ───────────────────────────────────────
msg = email_node["parameters"]["message"]
OLD_OPEN  = "  <div style='text-align: center;'>"
CLOSE_DIV = "  </div>"

idx_start = msg.find(OLD_OPEN)
idx_end   = msg.find(CLOSE_DIV, idx_start) + len(CLOSE_DIV)

if idx_start == -1:
    print("❌ Marcador de inicio no encontrado")
    raise SystemExit(1)

email_node["parameters"]["message"] = msg[:idx_start] + new_buttons + msg[idx_end:]
print("  → enviar-email-aprobacion: botones de selección de plataforma actualizados")

# ── Update mk-apr: pass platform flags to Make.com ────────────────────────────
mk_node["parameters"]["jsonBody"] = (
    "={\n"
    "  \"post_facebook_en\": {{ JSON.stringify($json.fields.Post_Facebook_EN) }},\n"
    "  \"post_instagram_en\": {{ JSON.stringify($json.fields.Post_Instagram_EN) }},\n"
    "  \"image_url\": {{ JSON.stringify($('\U0001f514 Webhook: Aprobar Post').item.json.query.imageUrl) }},\n"
    "  \"publish_facebook\": {{ JSON.stringify($('\U0001f514 Webhook: Aprobar Post').item.json.query.facebook || 'true') }},\n"
    "  \"publish_instagram\": {{ JSON.stringify($('\U0001f514 Webhook: Aprobar Post').item.json.query.instagram || 'true') }}\n"
    "}"
)
print("  → mk-apr: añadidos publish_facebook + publish_instagram flags")

# ── Push ──────────────────────────────────────────────────────────────────────
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
    print(f"\n✅ RRSS Automation - Crating Express actualizado OK")
else:
    print("❌ ERROR:", json.dumps(result, indent=2)[:500])
