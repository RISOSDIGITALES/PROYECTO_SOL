# Camila (outreach): redacción más concreta y opción de contexto de campaña. Reglas genéricas para cualquier empresa de G54.
import json, urllib.request, sys, copy
sys.stdout.reconfigure(encoding='utf-8')
sec = dict(l.split('=', 1) for l in open(r'C:/SOLANGE RESPALDOS/PROYECTO_SOL GIT RESPALDO/.secrets.local.md', encoding='utf-8').read().splitlines() if '=' in l and l[0].isupper())
H = {'X-N8N-API-KEY': sec['N8N_API_TOKEN'].strip(), 'Content-Type': 'application/json', 'User-Agent': 'diag'}
U = 'https://n8n.mdarthurdigital.com/api/v1/workflows/fahn0L68z5czTocE'
w = json.loads(urllib.request.urlopen(urllib.request.Request(U, headers=H)).read())
N = {n['name']: n for n in w['nodes']}
# 1) parámetro opcional "contexto"
ep = N['🔧 Extraer Parámetros']['parameters']
old = "return [{ json: { company_id, modo, limite, dry_run, error: false } }];"
assert old in ep['jsCode']
ep['jsCode'] = ep['jsCode'].replace(old, "// contexto (24-nov): dato de campaña opcional que manda quien corre el flujo (un evento, una temporada); la IA\n// lo usa solo con los negocios a los que les aplica.\nconst contexto = typeof body.contexto === 'string' ? body.contexto.trim().slice(0, 300) : '';\nreturn [{ json: { company_id, modo, limite, dry_run, contexto, error: false } }];")
# 2) reglas de redacción
sc = N['🔍 Seleccionar Contactos']['parameters']
c = sc['jsCode']
reemplazos = [
 ("  '2) Di en una frase por qué ese tipo de negocio (mira su categoría y cómo se lo buscó) podría necesitar lo que ofrece la empresa. Si la relación no es clara, habla en general, sin inventar.',",
  "  '2) El primer párrafo dice, de forma concreta, para qué le sirve la empresa a ESE tipo de negocio: piensa en su trabajo real según su categoría y cómo se lo buscó (qué mueve, qué le preocupa, cuándo lo necesita). Nada de frases que servirían para cualquier negocio. Si la relación no es clara, habla en general, sin inventar.',\n  '2b) Usa una sola ventaja de la propuesta de valor, la que más le importe a ese tipo de negocio, y di por qué le sirve. No enumeres todo lo que hace la empresa.',\n  '2c) Los párrafos NO repiten los servicios: esos van solo en la lista \"servicios\", que se muestra debajo del texto.',"),
 ("  '7) parrafos: 2 o 3 párrafos de texto plano (sin HTML ni enlaces), entre 60 y 110 palabras en total. El último párrafo SIEMPRE invita a responder este correo para conversar o pedir más información.',",
  "  '7) parrafos: 2 o 3 párrafos de texto plano (sin HTML ni enlaces), entre 55 y 100 palabras en total. El último párrafo SIEMPRE termina con una pregunta concreta y fácil de contestar respondiendo este correo, ligada a su trabajo (por ejemplo, si tienen un envío próximo o qué necesitarían cotizar). Nada de \"contact us to discuss\" ni frases vacías.',\n  '7b) Revisa la gramática antes de responder: concordancia de sujeto y verbo, artículos y tiempos, en inglés y en español. Cada correo debe sonar escrito por una persona del rubro, no por una plantilla; varía cómo empiezan los correos entre un negocio y otro.',"),
 ("  '9) servicios: de 2 a 4 servicios del perfil que le sirvan a ese negocio, con nombres cortos traducidos por completo al idioma del correo (sin mezclar idiomas).',",
  "  '9) servicios: de 2 a 3 servicios del perfil que de verdad le sirvan a ese tipo de negocio, con nombres cortos traducidos por completo al idioma del correo (sin mezclar idiomas). Deja fuera los que no encajan con su categoría (por ejemplo, un servicio pensado para fábricas no va en el correo a una galería de arte).',"),
 ("  '6) asunto: máximo 60 caracteres, sin palabras de spam (gratis, urgente, oferta, free, urgent), que nombre al negocio o a su rubro.',",
  "  '6) asunto: máximo 60 caracteres, sin palabras de spam (gratis, urgente, oferta, free, urgent), que nombre al negocio o a su rubro y diga algo útil para ellos; no uses el mismo molde \"Negocio – servicio\" en todos.',"),
]
for a, b in reemplazos:
    assert a in c, a[:60]
    c = c.replace(a, b)
old = "  'Devuelve solo JSON:"
c = c.replace(old, "  '13) contexto: si el mensaje trae \"contexto\" (un evento o una temporada), menciónalo en una frase solo en los correos de negocios a los que de verdad les aplica, con las palabras de ese contexto y sin agregar fechas ni datos que no estén ahí. Si no viene o no aplica, no inventes ningún evento.',\n" + old, 1)
old = "    { role: 'user', content: JSON.stringify({ empresa: perfil, negocios: slim.map(s => s.ficha) }) },"
assert old in c
c = c.replace(old, "    { role: 'user', content: JSON.stringify(Object.assign({ empresa: perfil, negocios: slim.map(s => s.ficha) }, params.contexto ? { contexto: params.contexto } : {})) },")
c = c.replace("  temperature: 0.4,\n  reasoning_effort: 'low',", "  temperature: 0.5,\n  reasoning_effort: 'medium',")
sc['jsCode'] = c
body = {'name': w['name'], 'nodes': w['nodes'], 'connections': w['connections'], 'settings': {k: v for k, v in (w.get('settings') or {}).items() if k in ('executionOrder', 'saveManualExecutions', 'callerPolicy', 'errorWorkflow', 'timezone', 'saveExecutionProgress', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout')}}
r = urllib.request.urlopen(urllib.request.Request(U, data=json.dumps(body).encode(), headers=H, method='PUT'))
print('PUT', r.status)
