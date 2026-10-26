import json, urllib.request, collections, sys
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

for cid in (1, 2):
    try:
        posts = get(f'{G54}/companies/{cid}/rrss/posts', {})
        posts = posts.get('data', posts) if isinstance(posts, dict) else posts
        st = collections.Counter(p.get('status') for p in posts)
        prog = [(p['id'], p.get('plataforma') or p.get('platform'), p.get('fecha_programada') or p.get('scheduled_at')) for p in posts if p.get('status') in ('programado', 'aprobado')]
        ideas = get(f'{G54}/companies/{cid}/rrss/ideas', {})
        ideas = ideas.get('data', ideas) if isinstance(ideas, dict) else ideas
        nuevas = [i['id'] for i in ideas if (i.get('created_at') or '') >= DESDE]
        print(f'empresa {cid}: posts {dict(st)} | en cola {prog} | ideas nuevas {nuevas}')
    except Exception as ex:
        print(f'empresa {cid}: error {ex}')
