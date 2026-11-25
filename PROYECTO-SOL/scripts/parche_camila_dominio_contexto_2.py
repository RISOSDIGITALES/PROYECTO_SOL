"""Camila (fahn0L68z5czTocE), 25-nov-2026, ajustes tras la primera prueba de parche_camila_dominio_contexto.py:
1) Acepta el correo cuyo dominio son las iniciales del negocio (pamm.org = Pérez Art Museum Miami).
2) "Es de carga" se decide por la categoría y el nombre, no por cómo se buscó (una galería buscada como
   "fine art shipping" no es de carga).
3) A negocios que no son de carga ni industria no se les lista "embalaje industrial".
4) Suaviza promesas que el perfil no dice: "eliminates the risk", "ensuring/ensures smooth".
"""
import json, re, sys, pathlib, urllib.request

RAIZ = pathlib.Path(__file__).resolve().parents[2]
TOK = re.search(r'N8N_API_TOKEN=(\S+)', (RAIZ / '.secrets.local.md').read_text(encoding='utf-8')).group(1)
WID = 'fahn0L68z5czTocE'


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


INI_VIEJO = "    if (lleva(etiqueta(dom), toks)) return '';"
INI_NUEVO = ("    if (lleva(etiqueta(dom), toks)) return '';\n"
             "    const iniciales = sinAcentos(d.nombre).split(/[^a-z0-9]+/).filter(Boolean).map(x => x[0]).join('');\n"
             "    if (iniciales.length >= 3 && etiqueta(dom).startsWith(iniciales)) return '';")

CARGA_VIEJO = "const esCarga = (f) => /freight|cargo|logist|forward|shipping|export|import|carga|transport|aduana|customs/i.test([f.categoria, f.buscado_como, f.nombre].join(' '));"
CARGA_NUEVO = "const esCarga = (f) => /freight|cargo|logist|forward|export|import|carga|transport|aduana|customs|industr|manufact|fábrica|fabrica/i.test([f.categoria, f.nombre].join(' '));"

SERV_VIEJO = "    conIa = !!ia;"
SERV_NUEVO = ("    // 25-nov: a un negocio que no es de carga ni industria no se le lista embalaje industrial\n"
              "    if (!/freight|cargo|logist|forward|export|import|carga|transport|aduana|customs|industr|manufact|f[aá]brica/i.test([f.categoria, negocio].join(' '))) servicios = (servicios || []).filter(s => !/industri/i.test(s));\n"
              "    conIa = !!ia;")

PROM_VIEJO = ".replace(/garantizando/gi, 'ayudando a asegurar')"
PROM_NUEVO = (".replace(/\\beliminat(?:es|e|ing) the risk of\\b/gi, 'reduces the risk of').replace(/\\beliminat(?:es|e|ing) (?:any |all )?(?:delays|risks?)\\b/gi, 'helps avoid delays')"
              ".replace(/\\bensuring smooth customs clearance\\b/gi, 'helping with customs clearance').replace(/\\bensures smooth customs clearance\\b/gi, 'helps with customs clearance')"
              ".replace(/garantizando/gi, 'ayudando a asegurar')")


def main():
    w = api('GET', 'workflows/' + WID)
    for n in w['nodes']:
        if n['name'] == '🔍 Seleccionar Contactos':
            c = n['parameters']['jsCode']
            c = reemplazar(c, INI_VIEJO, INI_NUEVO, n['name'])
            c = reemplazar(c, CARGA_VIEJO, CARGA_NUEVO, n['name'])
            n['parameters']['jsCode'] = c
        elif n['name'] == '🔍 Filtrar y Armar Emails':
            c = n['parameters']['jsCode']
            c = reemplazar(c, SERV_VIEJO, SERV_NUEVO, n['name'])
            c = reemplazar(c, PROM_VIEJO, PROM_NUEVO, n['name'])
            n['parameters']['jsCode'] = c
    body = {k: w[k] for k in ('name', 'nodes', 'connections')}
    body['settings'] = {k: v for k, v in (w.get('settings') or {}).items() if k in ('executionOrder', 'errorWorkflow', 'timezone', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'saveManualExecutions', 'saveExecutionProgress', 'executionTimeout', 'callerPolicy')}
    api('PUT', 'workflows/' + WID, body)
    print('Camila ajustada')


if __name__ == '__main__':
    main()
