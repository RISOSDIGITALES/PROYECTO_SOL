"""Camila (fahn0L68z5czTocE), 25-nov-2026, tercer ajuste (por código, sin depender de la IA):
1) La lista de servicios sale solo de products_services del perfil (la IA metía ventajas como "Same-day
   delivery"); a negocios que no son de carga ni industria, sin embalaje industrial ni ISPM-15.
2) Si hay contexto y le aplica al negocio pero la IA no lo nombró, se antepone al primer párrafo.
3) "ensures" se suaviza (el perfil no promete resultados) y se quita "exactly".
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


SERV_VIEJO = ("    if (!/freight|cargo|logist|forward|export|import|carga|transport|aduana|customs|industr|manufact|f[aá]brica/i.test([f.categoria, negocio].join(' '))) servicios = (servicios || []).filter(s => !/industri/i.test(s));\n"
              "    conIa = !!ia;")
SERV_NUEVO = r"""    // 25-nov: la lista sale solo de los productos del perfil (la IA metía ventajas como "Same-day delivery"),
    // y a un negocio que no es de carga ni industria no se le lista embalaje industrial ni ISPM-15.
    const esCargaF = /freight|cargo|logist|forward|export|import|carga|transport|aduana|customs|industr|manufact|f[aá]brica/i.test([f.categoria, negocio].join(' '));
    // Plazos, entregas y precios son ventajas, no servicios: no van en la lista.
    const esVentaja = (s) => /same.?day|deliver|entrega|mismo d|puntual|punctual|on.?time|fast|r[aá]pid|hidden|ocult|price|precio|pricing/i.test(s);
    servicios = (servicios || []).filter(s => !esVentaja(s)).filter(s => esCargaF || !/industri|ispm|export|certif/i.test(s));
    // 25-nov: si hay contexto, le aplica y la IA no lo nombró, se antepone al primer párrafo
    const ctx = String(params.contexto || '').trim();
    const ctxAplica = ctx && (!/\bart\b|arte|basel|galler|galer|museum|museo/i.test(ctx) || /\bart\b|arte|galler|galer|museum|museo|fine|exhib|collect/i.test([f.categoria, negocio].join(' ')));
    if (ctxAplica && parrafos.length && !parrafos.some(p => p.toLowerCase().includes(ctx.toLowerCase()))) {
      const p0 = parrafos[0];
      parrafos[0] = (idioma === 'en' ? 'With ' + ctx + ' around the corner, ' : 'Con ' + ctx + ' a la vuelta de la esquina, ') + p0.charAt(0).toLowerCase() + p0.slice(1);
    }
    conIa = !!ia;"""

PROM_VIEJO = ".replace(/garantizando/gi, 'ayudando a asegurar')"
PROM_NUEVO = (".replace(/\\bensures\\s+that\\s+/gi, 'helps make sure that ').replace(/\\bensures\\s+(you|your)\\b/gi, 'helps $1').replace(/\\bensures\\s+/gi, 'helps make sure ').replace(/\\s+exactly when\\b/gi, ' when')"
              ".replace(/garantizando/gi, 'ayudando a asegurar')")


def main():
    w = api('GET', 'workflows/' + WID)
    for n in w['nodes']:
        if n['name'] == '🔍 Filtrar y Armar Emails':
            c = n['parameters']['jsCode']
            c = reemplazar(c, SERV_VIEJO, SERV_NUEVO, n['name'])
            c = reemplazar(c, PROM_VIEJO, PROM_NUEVO, n['name'])
            n['parameters']['jsCode'] = c
    body = {k: w[k] for k in ('name', 'nodes', 'connections')}
    body['settings'] = {k: v for k, v in (w.get('settings') or {}).items() if k in ('executionOrder', 'errorWorkflow', 'timezone', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'saveManualExecutions', 'saveExecutionProgress', 'executionTimeout', 'callerPolicy')}
    api('PUT', 'workflows/' + WID, body)
    print('Camila ajustada (3)')


if __name__ == '__main__':
    main()
