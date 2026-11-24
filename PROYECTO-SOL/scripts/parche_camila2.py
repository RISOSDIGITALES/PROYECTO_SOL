import json, urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8')
sec = dict(l.split('=', 1) for l in open(r'C:/SOLANGE RESPALDOS/PROYECTO_SOL GIT RESPALDO/.secrets.local.md', encoding='utf-8').read().splitlines() if '=' in l and l[0].isupper())
H = {'X-N8N-API-KEY': sec['N8N_API_TOKEN'].strip(), 'Content-Type': 'application/json', 'User-Agent': 'diag'}
U = 'https://n8n.mdarthurdigital.com/api/v1/workflows/fahn0L68z5czTocE'
w = json.loads(urllib.request.urlopen(urllib.request.Request(U, headers=H)).read())
sc = [n for n in w['nodes'] if n['name'] == '🔍 Seleccionar Contactos'][0]['parameters']
c = sc['jsCode']
a = "  '2c) Los párrafos NO repiten los servicios: esos van solo en la lista \"servicios\", que se muestra debajo del texto.',"
assert a in c
c = c.replace(a, "  '2c) Los párrafos NO nombran ningún servicio de la lista \"servicios\" (esa lista se muestra sola debajo del texto). Prohibido escribir \"we offer/we provide/ofrecemos\" seguido de la lista: el texto explica el porqué; la lista, el qué.',\n  '2d) No le digas al negocio lo que necesita (\"X needs/requires\", \"ustedes necesitan\"): describe lo que suele pasar en ese tipo de trabajo y ofrece ayuda. No uses \"garantizamos/guarantee\" ni promesas que el perfil no diga con esas palabras.',")
c = c.replace("  max_tokens: 7000,", "  max_tokens: 14000,")
sc['jsCode'] = c
body = {'name': w['name'], 'nodes': w['nodes'], 'connections': w['connections'], 'settings': {k: v for k, v in (w.get('settings') or {}).items() if k in ('executionOrder', 'saveManualExecutions', 'callerPolicy', 'errorWorkflow', 'timezone', 'saveExecutionProgress', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout')}}
print('PUT', urllib.request.urlopen(urllib.request.Request(U, data=json.dumps(body).encode(), headers=H, method='PUT')).status, "max_tokens: 14000" in c)
