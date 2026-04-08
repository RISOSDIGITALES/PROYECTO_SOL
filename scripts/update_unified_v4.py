import json, requests

N8N_TOKEN = "N8N_JWT_TOKEN_HERE"
WORKFLOW_ID = "38fO1D5uJpVUDMqm"

resp = requests.get(
    f"https://n8n.mdarthurdigital.com/api/v1/workflows/{WORKFLOW_ID}",
    headers={"X-N8N-API-KEY": N8N_TOKEN}
)
data = resp.json()
nodes = data['nodes']

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1 – Facebook: switch to /photos endpoint so it uses the Slides image
# ─────────────────────────────────────────────────────────────────────────────
# Facebook Graph API: POST /{page-id}/photos
#   url     = Slides thumbnail (contentUrl) — publicly accessible Google CDN URL
#   caption = generated facebook text (Groq already includes the article URL)
# NOTE: replace REEMPLAZAR_CON_PAGE_ACCESS_TOKEN when Meta access is granted
for n in nodes:
    if n['id'] == 'publish-facebook':
        n['parameters'] = {
            "method": "POST",
            "url": "https://graph.facebook.com/v19.0/1713965015486703/photos",
            "sendQuery": True,
            "queryParameters": {"parameters": [
                {
                    "name": "url",
                    "value": "={{ $('\U0001F4F8 Slides: Obtener Thumbnail').item.json.contentUrl }}"
                },
                {
                    "name": "caption",
                    "value": "={{ $('\U0001F50D Parsear Contenido').item.json.facebook }}"
                },
                {
                    "name": "access_token",
                    "value": "REEMPLAZAR_CON_PAGE_ACCESS_TOKEN"
                }
            ]},
            "options": {}
        }
        n['continueOnFail'] = True
        print("Fixed publish-facebook: now uses /photos endpoint with Slides thumbnail")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 2 – Instagram: rename step 1, add step 2 (publish container)
# ─────────────────────────────────────────────────────────────────────────────
# Instagram requires two API calls:
#   Step 1: POST /{ig-user-id}/media → creates a media container → returns { id }
#   Step 2: POST /{ig-user-id}/media_publish?creation_id={id} → publishes it
for n in nodes:
    if n['id'] == 'publish-instagram':
        n['name'] = "\U0001F4F8 Instagram: Crear Container \u26a0\ufe0f Pendiente Token"
        n['parameters'] = {
            "method": "POST",
            "url": "https://graph.facebook.com/v19.0/INSTAGRAM_ACCOUNT_ID/media",
            "sendQuery": True,
            "queryParameters": {"parameters": [
                {
                    "name": "caption",
                    "value": "={{ $('\U0001F50D Parsear Contenido').item.json.instagram }}"
                },
                {
                    "name": "image_url",
                    "value": "={{ $('\U0001F4F8 Slides: Obtener Thumbnail').item.json.contentUrl }}"
                },
                {
                    "name": "access_token",
                    "value": "REEMPLAZAR_CON_PAGE_ACCESS_TOKEN"
                }
            ]},
            "options": {}
        }
        n['continueOnFail'] = True
        print("Renamed instagram step 1: now clearly labeled as container creation")

# Add Instagram step 2 node
ig_publish_node = {
    "id": "instagram-publish",
    "name": "\u2705 Instagram: Publicar Container \u26a0\ufe0f Pendiente Token",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.2,
    "position": [3360, 620],
    "continueOnFail": True,
    "parameters": {
        "method": "POST",
        "url": "https://graph.facebook.com/v19.0/INSTAGRAM_ACCOUNT_ID/media_publish",
        "sendQuery": True,
        "queryParameters": {"parameters": [
            {
                "name": "creation_id",
                "value": "={{ $json.id }}"  # id returned by step 1
            },
            {
                "name": "access_token",
                "value": "REEMPLAZAR_CON_PAGE_ACCESS_TOKEN"
            }
        ]},
        "options": {}
    }
}
nodes.append(ig_publish_node)
print("Added instagram-publish (step 2: media_publish)")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 3 – Rebuild connections
# The Instagram publish step 2 connects AFTER step 1, then to Guardar Airtable
# Facebook also connects to Guardar Airtable
# ─────────────────────────────────────────────────────────────────────────────
connections = data['connections']

# Remove old Instagram → Guardar connection (step 1 now connects to step 2)
old_ig_name = "\U0001F4F8 Publicar en Instagram \u26a0\ufe0f Pendiente Token"
new_ig1_name = "\U0001F4F8 Instagram: Crear Container \u26a0\ufe0f Pendiente Token"
new_ig2_name = "\u2705 Instagram: Publicar Container \u26a0\ufe0f Pendiente Token"

# Remove old key if it exists
if old_ig_name in connections:
    del connections[old_ig_name]
    print(f"Removed old Instagram connection key")

# Add step 1 → step 2
connections[new_ig1_name] = {"main": [[{"node": new_ig2_name, "type": "main", "index": 0}]]}

# Add step 2 → Guardar Airtable
connections[new_ig2_name] = {"main": [[{"node": "\U0001F4BE Guardar en Airtable", "type": "main", "index": 0}]]}

# Update Slides thumbnail connections: both step 1 (Instagram) and Facebook come from thumbnail
thumbnail_name = "\U0001F4F8 Slides: Obtener Thumbnail"
connections[thumbnail_name] = {"main": [[
    {"node": "\U0001F4D8 Publicar en Facebook \u26a0\ufe0f Pendiente Token", "type": "main", "index": 0},
    {"node": new_ig1_name, "type": "main", "index": 0}
]]}
print("Updated connections: Thumbnail → Facebook + Instagram step 1 → step 2 → Save")

# ─────────────────────────────────────────────────────────────────────────────
# Push to n8n
# ─────────────────────────────────────────────────────────────────────────────
payload = {
    "name": data["name"],
    "nodes": nodes,
    "connections": connections,
    "settings": data.get("settings", {}),
    "staticData": data.get("staticData"),
}
resp = requests.put(
    f"https://n8n.mdarthurdigital.com/api/v1/workflows/{WORKFLOW_ID}",
    headers={"X-N8N-API-KEY": N8N_TOKEN, "Content-Type": "application/json"},
    json=payload
)
result = resp.json()
if "id" in result:
    print(f"\nSUCCESS! Workflow actualizado: {result['id']}")
    print(f"Nodes: {len(result.get('nodes',[]))}")
else:
    print("ERROR:", json.dumps(result, indent=2)[:600])
