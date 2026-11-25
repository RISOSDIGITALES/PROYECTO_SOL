"""25-nov-2026: el 17-nov, al completar link_url de 59 posts ya publicados con mark-published (ítem 637), G54 les
pisó fecha_publicada con la hora de ese momento. Hasta que G54 la restaure, nuestros informes no dependen de ella:
1) Analytics Semanal (EX9K1AZwKeouSJ9G), 🕒 Sugerencia de Horario: la hora sale de Meta (created_time en Facebook,
   timestamp en Instagram); si Meta no la da, la de G54.
2) Analytics Mensual (YI9EfJYcWJN4bbM9), 🔧 Preparar Datos Analytics: si la fecha programada es anterior a la de
   publicación, se cuenta la programada (un post se publica a su hora programada).
"""
import json, re, sys, pathlib, urllib.request

RAIZ = pathlib.Path(__file__).resolve().parents[2]
TOK = re.search(r'N8N_API_TOKEN=(\S+)', (RAIZ / '.secrets.local.md').read_text(encoding='utf-8')).group(1)


def api(m, p, body=None):
    r = urllib.request.Request('https://n8n.mdarthurdigital.com/api/v1/' + p,
                               data=json.dumps(body).encode() if body is not None else None,
                               headers={'X-N8N-API-KEY': TOK, 'Content-Type': 'application/json'}, method=m)
    return json.load(urllib.request.urlopen(r, timeout=60))


def reemplazar(txt, viejo, nuevo, nodo):
    if nuevo in txt:
        return txt
    if viejo not in txt:
        sys.exit(f'No encontré el texto a reemplazar en {nodo}: {viejo[:80]!r}')
    return txt.replace(viejo, nuevo, 1)


def guardar(w):
    body = {k: w[k] for k in ('name', 'nodes', 'connections')}
    body['settings'] = {k: v for k, v in (w.get('settings') or {}).items() if k in ('executionOrder', 'errorWorkflow', 'timezone', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'saveManualExecutions', 'saveExecutionProgress', 'executionTimeout', 'callerPolicy')}
    api('PUT', 'workflows/' + w['id'], body)


SEM = [
    ("fields: 'id,insights.metric(post_total_media_view_unique,",
     "fields: 'id,created_time,insights.metric(post_total_media_view_unique,"),
    ("      metricas[String(p.id)] = { alcance: val('post_total_media_view_unique'),",
     "      metricas[String(p.id)] = { ts: p.created_time || '', alcance: val('post_total_media_view_unique'),"),
    ("      metricas[String(md.id)] = { alcance: mv('reach'), interacciones: mv('total_interactions') };",
     "      metricas[String(md.id)] = { ts: md.timestamp || '', alcance: mv('reach'), interacciones: mv('total_interactions') };"),
    ("    posts.push({ platform: p.platform, fecha_publicada: p.fecha_publicada, alcance: m.alcance, interacciones: m.interacciones });",
     "    // 25-nov: la hora real la da Meta; G54 pisó fecha_publicada de 59 posts el 17-nov (ítem 637)\n"
     "    posts.push({ platform: p.platform, fecha_publicada: m.ts || p.fecha_publicada, alcance: m.alcance, interacciones: m.interacciones });"),
]

MEN_VIEJO = ("  if (!p.fecha_publicada) return false;\n"
             "  const t = Math.floor(new Date(p.fecha_publicada).getTime() / 1000);")
MEN_NUEVO = ("  if (!p.fecha_publicada) return false;\n"
             "  // 25-nov: G54 pisó fecha_publicada de 59 posts el 17-nov (ítem 637); un post sale a su hora programada,\n"
             "  // así que si la programada es anterior, cuenta esa.\n"
             "  const fp = new Date(p.fecha_publicada).getTime(), fg = p.fecha_programada ? new Date(p.fecha_programada).getTime() : NaN;\n"
             "  const t = Math.floor(((Number.isFinite(fg) && fg < fp) ? fg : fp) / 1000);")


def main():
    w = api('GET', 'workflows/EX9K1AZwKeouSJ9G')
    for n in w['nodes']:
        if 'Sugerencia' in n['name']:
            c = n['parameters']['jsCode']
            for v, nv in SEM:
                c = reemplazar(c, v, nv, n['name'])
            n['parameters']['jsCode'] = c
    guardar(w)
    print('Analytics Semanal ok')
    w = api('GET', 'workflows/YI9EfJYcWJN4bbM9')
    k = 0
    for n in w['nodes']:
        if n['name'] == '🔧 Preparar Datos Analytics':
            n['parameters']['jsCode'] = reemplazar(n['parameters']['jsCode'], MEN_VIEJO, MEN_NUEVO, n['name'])
            k += 1
    if not k:
        sys.exit('No encontré el nodo del informe mensual')
    guardar(w)
    print('Analytics Mensual ok')


if __name__ == '__main__':
    main()
