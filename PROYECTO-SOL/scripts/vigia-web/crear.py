# Crea (o actualiza) el flujo "🛡️ Vigía Web — Monitor de sitios" en n8n.
import json, urllib.request, sys, os, uuid
sys.stdout.reconfigure(encoding='utf-8')
D = os.path.dirname(os.path.abspath(__file__))
sec = dict(l.split('=', 1) for l in open(r'C:/SOLANGE RESPALDOS/PROYECTO_SOL GIT RESPALDO/.secrets.local.md', encoding='utf-8').read().splitlines() if '=' in l and l[0].isupper())
H = {'X-N8N-API-KEY': sec['N8N_API_TOKEN'].strip(), 'Content-Type': 'application/json', 'User-Agent': 'diag'}
API = 'https://n8n.mdarthurdigital.com/api/v1/workflows'
CLAVE = sec['N8N_WEBHOOK_KEY'].strip()
js = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
def nodo(name, typ, ver, params, pos, **kw):
    n = {'id': str(uuid.uuid4()), 'name': name, 'type': typ, 'typeVersion': ver, 'position': pos, 'parameters': params}
    n.update(kw); return n
cond = lambda expr: {'conditions': {'options': {'caseSensitive': True, 'leftValue': '', 'typeValidation': 'loose'}, 'conditions': [{'id': str(uuid.uuid4()), 'leftValue': expr, 'rightValue': '', 'operator': {'type': 'boolean', 'operation': 'true', 'singleValue': True}}], 'combinator': 'and'}, 'options': {}}
auth = "={{ (() => { const h = $json.headers || {}; const last = String(h['x-forwarded-for'] || '').split(',').pop().trim(); const interna = /^(10\\.|127\\.|192\\.168\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.)/.test(last); const clave = String(h['x-webhook-key'] || ''); return interna || clave === '" + CLAVE + "'; })() }}"
nodes = [
    nodo('🔔 Webhook Vigía Web', 'n8n-nodes-base.webhook', 2, {'path': 'vigia-web', 'httpMethod': 'POST', 'responseMode': 'responseNode', 'options': {}}, [0, 0], webhookId=str(uuid.uuid4())),
    nodo('🔒 ¿Llamada autorizada? (vigia-web)', 'n8n-nodes-base.if', 2, cond(auth), [220, 0]),
    nodo('⛔ Responder 403 (no autorizado) (vigia-web)', 'n8n-nodes-base.respondToWebhook', 1.1, {'respondWith': 'json', 'responseBody': '{"ok": false, "error": "no autorizado"}', 'options': {'responseCode': 403}}, [440, 160]),
    nodo('🧭 Acción', 'n8n-nodes-base.code', 2, {'jsCode': js('accion.js')}, [440, 0]),
    nodo('🔀 ¿Revisar?', 'n8n-nodes-base.if', 2, cond('={{ $json.revisar }}'), [660, 0]),
    nodo('📤 Responder', 'n8n-nodes-base.respondToWebhook', 1.1, {'respondWith': 'json', 'responseBody': '={{ JSON.stringify($json) }}', 'options': {}}, [880, 160]),
    nodo('⏱️ Cada hora (rápido)', 'n8n-nodes-base.scheduleTrigger', 1.2, {'rule': {'interval': [{'field': 'hours', 'hoursInterval': 1, 'triggerAtMinute': 17}]}}, [440, 340]),
    nodo('⏰ Cada día (completo)', 'n8n-nodes-base.scheduleTrigger', 1.2, {'rule': {'interval': [{'field': 'days', 'triggerAtHour': 6, 'triggerAtMinute': 5}]}}, [440, 500]),
    nodo('🗂️ Sitios inscriptos', 'n8n-nodes-base.code', 2, {'jsCode': js('inscriptos.js')}, [660, 420]),
    nodo('🔎 Revisar sitios', 'n8n-nodes-base.code', 2, {'jsCode': js('revisar.js')}, [880, 0]),
    nodo('📨 Decidir avisos', 'n8n-nodes-base.code', 2, {'jsCode': js('avisos.js')}, [1100, 0]),
    nodo('🔀 ¿Enviar correo?', 'n8n-nodes-base.if', 2, cond('={{ $json.enviar }}'), [1320, 0]),
    nodo('✉️ Enviar aviso', 'n8n-nodes-base.gmail', 2.1, {'sendTo': '={{ $json.avisar }}', 'subject': '={{ $json.asunto }}', 'message': '={{ $json.html }}', 'options': {'contentType': 'html', 'appendAttribution': False}}, [1540, -100], credentials={'gmailOAuth2': {'id': 'TESHSjzjMCpCxBBk', 'name': 'Gmail account'}}, onError='continueRegularOutput'),
    nodo('🔀 ¿Vino del webhook?', 'n8n-nodes-base.if', 2, cond("={{ $('🧭 Acción').isExecuted }}"), [1760, 0], executeOnce=True),
    nodo('📤 Responder informe', 'n8n-nodes-base.respondToWebhook', 1.1, {'respondWith': 'json', 'responseBody': "={{ JSON.stringify((() => { const j = Object.assign({}, $('📨 Decidir avisos').first().json); delete j.html; return j; })()) }}", 'options': {}}, [1980, 0]),
]
C = lambda *dest: [[{'node': d, 'type': 'main', 'index': 0} for d in grupo] for grupo in dest]
connections = {
    '🔔 Webhook Vigía Web': {'main': C(['🔒 ¿Llamada autorizada? (vigia-web)'])},
    '🔒 ¿Llamada autorizada? (vigia-web)': {'main': C(['🧭 Acción'], ['⛔ Responder 403 (no autorizado) (vigia-web)'])},
    '🧭 Acción': {'main': C(['🔀 ¿Revisar?'])},
    '🔀 ¿Revisar?': {'main': C(['🔎 Revisar sitios'], ['📤 Responder'])},
    '⏱️ Cada hora (rápido)': {'main': C(['🗂️ Sitios inscriptos'])},
    '⏰ Cada día (completo)': {'main': C(['🗂️ Sitios inscriptos'])},
    '🗂️ Sitios inscriptos': {'main': C(['🔎 Revisar sitios'])},
    '🔎 Revisar sitios': {'main': C(['📨 Decidir avisos'])},
    '📨 Decidir avisos': {'main': C(['🔀 ¿Enviar correo?'])},
    '🔀 ¿Enviar correo?': {'main': C(['✉️ Enviar aviso'], ['🔀 ¿Vino del webhook?'])},
    '✉️ Enviar aviso': {'main': C(['🔀 ¿Vino del webhook?'])},
    '🔀 ¿Vino del webhook?': {'main': C(['📤 Responder informe'], [])},
}
body = {'name': '🛡️ Vigía Web — Monitor de sitios', 'nodes': nodes, 'connections': connections, 'settings': {'executionOrder': 'v1', 'timezone': 'America/New_York', 'executionTimeout': 900}}
wid = sys.argv[1] if len(sys.argv) > 1 else ''
if wid:
    r = urllib.request.urlopen(urllib.request.Request(API + '/' + wid, data=json.dumps(body).encode(), headers=H, method='PUT'))
else:
    r = urllib.request.urlopen(urllib.request.Request(API, data=json.dumps(body).encode(), headers=H, method='POST'))
w = json.loads(r.read()); print('id', w['id'])
try:
    a = urllib.request.urlopen(urllib.request.Request(API + '/' + w['id'] + '/activate', data=b'{}', headers=H, method='POST')); print('activo', json.loads(a.read()).get('active'))
except Exception as e: print('activar', e, getattr(e, 'read', lambda: b'')()[:300])
