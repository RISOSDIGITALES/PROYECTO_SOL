import json, requests

TOKEN = "N8N_JWT_TOKEN_HERE"
HEADERS = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}

def push(wf_id, data, label):
    payload = {
        "name": data["name"],
        "nodes": data["nodes"],
        "connections": data["connections"],
        "settings": data.get("settings", {}),
        "staticData": data.get("staticData"),
    }
    r = requests.put(f"https://n8n.mdarthurdigital.com/api/v1/workflows/{wf_id}", headers=HEADERS, json=payload)
    result = r.json()
    if "id" in result:
        print(f"✅ {label} actualizado")
    else:
        print(f"❌ {label} ERROR:", json.dumps(result)[:200])

# ─── 1. LinkedIn → viernes (day 5), 9am ────────────────────────────────────
with open('/tmp/wf_linkedin.json') as f:
    wf = json.load(f)

for n in wf['nodes']:
    if n.get('type') == 'n8n-nodes-base.scheduleTrigger':
        n['name'] = "⏰ Trigger Viernes 9am"
        n['parameters']['rule'] = {
            "interval": [{"field": "weeks", "triggerAtDay": [5], "triggerAtHour": 9, "triggerAtMinute": 0}]
        }
        print("LinkedIn trigger: martes+jueves → viernes")

push("Hh0HsBADMs1zUZSb", wf, "CE LinkedIn - Publicar Blog Semanal")

# ─── 2. Unified → martes (day 2), 9am  +  quitar LinkedIn del flujo ─────────
with open('/tmp/wf_unified.json') as f:
    wf = json.load(f)

for n in wf['nodes']:
    if n.get('type') == 'n8n-nodes-base.scheduleTrigger':
        n['name'] = "⏰ Trigger Martes 9am"
        n['parameters']['rule'] = {
            "interval": [{"field": "weeks", "triggerAtDay": [2], "triggerAtHour": 9, "triggerAtMinute": 0}]
        }
        print("Unified trigger: martes+jueves → solo martes")

# Desconectar LinkedIn del flujo principal:
# Parsear Contenido ya no envía a LinkedIn; Guardar Airtable tampoco recibe de LinkedIn
# LinkedIn queda como nodo huérfano (visible pero desconectado)
conns = wf['connections']

# Remove LinkedIn from Parsear Contenido's outputs
pc_name = "\U0001F50D Parsear Contenido"
if pc_name in conns:
    old_targets = conns[pc_name]['main'][0]
    new_targets = [t for t in old_targets if 'LinkedIn' not in t['node']]
    conns[pc_name]['main'] = [new_targets]
    print(f"Parsear Contenido: removido LinkedIn. Targets restantes: {[t['node'] for t in new_targets]}")

# Remove LinkedIn → Guardar Airtable connection
linkedin_node_name = "\U0001F4E2 Publicar en LinkedIn"
if linkedin_node_name in conns:
    del conns[linkedin_node_name]
    print("Desconectado: LinkedIn → Guardar Airtable")

push("38fO1D5uJpVUDMqm", wf, "CE Blog - Publicar en Todas las Redes")

# ─── 3. RRSS Automation → jueves (day 4), 9am ──────────────────────────────
with open('/tmp/wf_rrss.json') as f:
    wf = json.load(f)

for n in wf['nodes']:
    if n.get('type') == 'n8n-nodes-base.scheduleTrigger':
        n['name'] = "⏰ Trigger Jueves 9am"
        n['parameters']['rule'] = {
            "interval": [{"field": "weeks", "triggerAtDay": [4], "triggerAtHour": 9, "triggerAtMinute": 0}]
        }
        print("RRSS trigger: lunes → jueves")

push("HqKUsOwwguIYQbsU", wf, "RRSS Automation - Crating Express")
