import json, urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8')
sec = dict(l.split('=', 1) for l in open(r'C:/SOLANGE RESPALDOS/PROYECTO_SOL GIT RESPALDO/.secrets.local.md', encoding='utf-8').read().splitlines() if '=' in l and l[0].isupper())
H = {'X-N8N-API-KEY': sec['N8N_API_TOKEN'].strip(), 'Content-Type': 'application/json', 'User-Agent': 'diag'}
U = 'https://n8n.mdarthurdigital.com/api/v1/workflows/fahn0L68z5czTocE'
w = json.loads(urllib.request.urlopen(urllib.request.Request(U, headers=H)).read())
ar = [n for n in w['nodes'] if n['name'] == '🔍 Filtrar y Armar Emails'][0]['parameters']
c = ar['jsCode']
old = "  const parrafos = (Array.isArray(x.parrafos) ? x.parrafos : []).map(limpio).filter(Boolean);"
assert old in c
c = c.replace(old, """  // 24-nov: la IA a veces promete aunque la regla lo prohíbe; sin garantías que el perfil no dice
  const sinPromesas = (t) => t
    .replace(/\bguaranteeing\b/gi, 'helping ensure').replace(/\bguarantees\b/gi, 'helps ensure').replace(/\bguaranteed\b/gi, 'reliable').replace(/\bguarantee\b/gi, 'help ensure')
    .replace(/\bgarantizando\b/gi, 'ayudando a asegurar').replace(/\bgarantizamos\b/gi, 'buscamos asegurar').replace(/\bgarantiza\b/gi, 'ayuda a asegurar').replace(/\bgarantizad[oa]s?\b/gi, 'confiable');
  const parrafos = (Array.isArray(x.parrafos) ? x.parrafos : []).map(limpio).map(sinPromesas).filter(Boolean);""")
ar['jsCode'] = c
body = {'name': w['name'], 'nodes': w['nodes'], 'connections': w['connections'], 'settings': {k: v for k, v in (w.get('settings') or {}).items() if k in ('executionOrder', 'saveManualExecutions', 'callerPolicy', 'errorWorkflow', 'timezone', 'saveExecutionProgress', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout')}}
print('PUT', urllib.request.urlopen(urllib.request.Request(U, data=json.dumps(body).encode(), headers=H, method='PUT')).status)
