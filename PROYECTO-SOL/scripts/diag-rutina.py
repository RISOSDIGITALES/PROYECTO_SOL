import json, urllib.request, collections, sys, re, pathlib, datetime
sys.stdout.reconfigure(encoding='utf-8')  # Windows: los nombres de los flujos traen emojis
sec = dict(l.split('=', 1) for l in open(r'C:\SOLANGE RESPALDOS\PROYECTO_SOL GIT RESPALDO\.secrets.local.md', encoding='utf-8').read().splitlines() if '=' in l and l[0].isupper())
DESDE = sys.argv[1] if len(sys.argv) > 1 else '2026-10-24'
N8N = 'https://n8n.mdarthurdigital.com/api/v1'
G54 = 'https://apigrowth.mdarthurdigital.com/api/n8n'

def get(url, hdr):
    req = urllib.request.Request(url, headers={**hdr, 'User-Agent': 'diag'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

nh = {'X-N8N-API-KEY': sec['N8N_API_TOKEN'].strip()}
wf = get(N8N + '/workflows?limit=250', nh)['data']
names = {w['id']: w['name'] for w in wf}
print(f"workflows: {len(wf)} ({sum(w['active'] for w in wf)} activos)")

cnt, err, cur = collections.Counter(), [], None
while True:
    d = get(N8N + '/executions?limit=250' + (f'&cursor={cur}' if cur else ''), nh)
    stop = False
    for e in d['data']:
        if e['startedAt'] < DESDE:
            stop = True; break
        cnt[names.get(e['workflowId'], e['workflowId'])] += 1
        if e['status'] not in ('success', 'waiting', 'running'):
            err.append((e['startedAt'][:16], names.get(e['workflowId']), e['status'], e['id']))
    cur = d.get('nextCursor')
    if stop or not cur: break
print('ejecuciones desde', DESDE, dict(cnt))
print('con error:', err or 0)

# rrss/posts solo lista lo aprobado o programado, y rrss/ideas solo las aprobadas sin usar: vacío = nada en cola
for cid in (1, 6):  # 1 = Crating Express, 6 = Orison Managua (la 2 no existe)
    try:
        posts = get(f'{G54}/companies/{cid}/rrss/posts', {})
        posts = posts.get('data', posts) if isinstance(posts, dict) else posts
        prog = [(p['id'], p.get('plataforma') or p.get('platform'), p.get('fecha_programada') or p.get('scheduled_at')) for p in posts]
        ideas = get(f'{G54}/companies/{cid}/rrss/ideas', {})
        ideas = ideas.get('data', ideas) if isinstance(ideas, dict) else ideas
        print(f"empresa {cid}: posts en cola {prog or 'ninguno'} | ideas aprobadas sin usar {[i['id'] for i in ideas] or 'ninguna'}")
    except Exception as ex:
        print(f'empresa {cid}: error {ex}')

# Panel y documentación de G54: avisa si cambiaron contra la última copia guardada (y guarda la nueva)
RAIZ = pathlib.Path(__file__).resolve().parents[2]
try:
    html = urllib.request.urlopen(urllib.request.Request('https://growth.mdarthurdigital.com/admin', headers={'User-Agent': 'diag'}), timeout=30).read().decode()
    js = re.search(r'/assets/(index-[\w-]+\.js)', html).group(1)
    copia = RAIZ / '.panel-g54' / js  # fuera de git: es código del ingeniero
    if copia.exists():
        print('panel: sin cambios', js)
    else:
        copia.parent.mkdir(exist_ok=True)
        copia.write_bytes(urllib.request.urlopen(urllib.request.Request('https://growth.mdarthurdigital.com/assets/' + js, headers={'User-Agent': 'diag'}), timeout=60).read())
        previas = sorted((p for p in copia.parent.glob('index-*.js') if p != copia), key=lambda p: p.stat().st_mtime)
        print(f"panel: NUEVO {js} (copia guardada; anterior {previas[-1].name if previas else 'ninguna'})")
except Exception as ex:
    print('panel: error', ex)

DOCS = RAIZ / 'PROYECTO-SOL' / 'g54' / 'documentos' / 'docs-api-g54'
for nombre in ('api', 'rrss'):
    try:
        hoy = urllib.request.urlopen(urllib.request.Request(f'https://apigrowth.mdarthurdigital.com/docs/{nombre}', headers={'User-Agent': 'diag'}), timeout=30).read()
        ultima = sorted(DOCS.glob(f'docs-{nombre}-*.html'))[-1]
        if hoy == ultima.read_bytes():
            print(f'docs {nombre}: igual a {ultima.name}')
        else:
            nueva = DOCS / f'docs-{nombre}-{datetime.date.today()}.html'
            nueva.write_bytes(hoy)
            print(f'docs {nombre}: CAMBIÓ contra {ultima.name} (copia nueva en {nueva.name})')
    except Exception as ex:
        print(f'docs {nombre}: error', ex)
