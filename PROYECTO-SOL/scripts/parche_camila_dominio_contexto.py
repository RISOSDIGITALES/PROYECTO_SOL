"""Camila (fahn0L68z5czTocE), 25-nov-2026:
1) En primer contacto, descarta el correo que no es del negocio (dominio distinto de su web, o correo
   de proveedor gratuito / genérico que no lleva su nombre). Los descartados salen en el resumen.
2) Contexto (un evento o temporada): se menciona en general, sin afirmar que el negocio participa.
3) Una sola ventaja por correo, asignada por código y rotando, para que los correos no salgan iguales;
   ISPM-15 / exportación solo para negocios de carga o exportación.
4) Saludo con el nombre del negocio como título del correo.
Uso: python -I parche_camila_dominio_contexto.py  (lee N8N_API_TOKEN de .secrets.local.md)
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


FILTRO = r"""
// 25-nov: en primer contacto el correo tiene que ser del negocio. Prospección a veces trae el correo de otro
// (otra galería, la empresa que le hizo la web, un Gmail sin relación). Se descarta si el dominio no es el de su
// web, o si es un correo gratuito o de proveedor de internet que no lleva su nombre. Mejor no escribir que
// escribirle "a su galería" a otra empresa.
const descartados = [];
if (modo === 'outreach') {
  const LIBRES = /^(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|aol|icloud|me|mac|gate|bellsouth|comcast|att|sbcglobal|verizon|protonmail|proton|gmx|mail|zoho|earthlink|cox|optonline|juno)\./i;
  const VACIAS = ['fine','arts','art','the','and','gallery','galleries','galeria','museum','museo','miami','international','intl','freight','logistics','logistic','transport','transportation','foundation','group','corp','company','services','service','design','center','centre','studio','shipping','cargo','inc','llc','usa','florida','express','trading','import','imports','export','exports','solutions','systems'];
  const sinAcentos = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const tokens = (t) => sinAcentos(t).split(/[^a-z0-9]+/).filter(x => x.length >= 3 && !VACIAS.includes(x));
  const base = (h) => { const p = sinAcentos(h).replace(/^www\./, '').split('.').filter(Boolean); if (p.length > 2 && /^(com|org|net|edu|gov|co|ac)$/.test(p[p.length - 2]) && p[p.length - 1].length === 2) return p.slice(-3).join('.'); return p.slice(-2).join('.'); };
  const etiqueta = (h) => base(h).split('.')[0];
  const webDe = (d) => { const m = notas(d).match(/Sitio:\s*(https?:\/\/[^\s|]+)/); if (!m) return ''; try { return new URL(m[1].replace(/\.$/, '')).hostname; } catch (e) { return ''; } };
  const lleva = (texto, toks) => toks.some(t => sinAcentos(texto).replace(/[^a-z0-9]/g, '').includes(t));
  const revisar = (d) => {
    const correo = String(d.email || '').trim().toLowerCase();
    const at = correo.lastIndexOf('@'); if (at < 1) return 'correo mal formado';
    const local = correo.slice(0, at), dom = correo.slice(at + 1);
    const toks = tokens(d.nombre);
    const web = webDe(d);
    if (LIBRES.test(dom)) return lleva(local, toks) ? '' : 'correo gratuito o de proveedor de internet que no lleva el nombre del negocio';
    if (web && base(web) === base(dom)) return '';
    if (lleva(etiqueta(dom), toks)) return '';
    return web ? 'el dominio del correo (' + dom + ') no es el de su web (' + base(web) + ')' : 'el dominio del correo (' + dom + ') no lleva el nombre del negocio y no hay web para comprobarlo';
  };
  candidatos = candidatos.filter(d => { const m = revisar(d); if (m) descartados.push({ deal_id: d.id, nombre: d.nombre || '', email: d.email, motivo: m }); return !m; });
}
"""

SIN_LEADS_VIEJO = "const sinLeads = (motivo) => [{ json: { sinLeads: true, motivo, candidatos: [], quedan: 0, groq_body: MODELO_TRIVIAL } }];"
SIN_LEADS_NUEVO = "let descartados = [];\nconst sinLeads = (motivo) => [{ json: { sinLeads: true, motivo, candidatos: [], quedan: 0, descartados, groq_body: MODELO_TRIVIAL } }];"

REGLAS_VIEJAS_2B = "'2b) Usa una sola ventaja de la propuesta de valor, la que más le importe a ese tipo de negocio, y di por qué le sirve. No enumeres todo lo que hace la empresa.',"
REGLAS_NUEVAS_2B = ("'2b) Cada negocio trae \"ventaja\": usa SOLO esa ventaja de la empresa y explica en una frase por qué le sirve a ese tipo de negocio. Prohibido nombrar otras ventajas de la propuesta de valor en el mismo correo (nada de listas tipo \"custom designs, same-day delivery and ISPM-15\"). No empieces frases con \"Our emphasis on\", \"Our focus on\" ni \"Nuestro enfoque en\".',\n"
                    "  '2f) Exportación y normas fitosanitarias (ISPM-15) solo si el negocio es de carga, logística o exportación, o si su ficha lo dice. A galerías y museos no les hables de exportar salvo que la ventaja asignada sea esa.',")

REGLA_13_VIEJA = "'13) contexto: si el mensaje trae \"contexto\" (un evento o una temporada), menciónalo en una frase solo en los correos de negocios a los que de verdad les aplica, con las palabras de ese contexto y sin agregar fechas ni datos que no estén ahí. Si no viene o no aplica, no inventes ningún evento.',"
REGLA_13_NUEVA = ("'13) contexto: si el mensaje trae \"contexto\" (un evento o una temporada) y el negocio tiene \"usa_contexto\": true, el PRIMER párrafo lo nombra con esas mismas palabras, en general y sin afirmar que ese negocio participa (por ejemplo \"With Miami Art Week around the corner, galleries often…\"). Esto es una excepción permitida a la regla 2e. No agregues fechas ni datos que no estén en el contexto. Si \"usa_contexto\" es false o no hay contexto, no menciones ningún evento.',\n"
                  "  '14) El título del correo lo pone el sistema (un saludo con el nombre del negocio): no saludes en los párrafos.',")

FICHAS_VIEJO = "{ role: 'user', content: JSON.stringify(Object.assign({ empresa: perfil, negocios: slim.map(s => s.ficha) }, params.contexto ? { contexto: params.contexto } : {})) },"
FICHAS_NUEVO = "{ role: 'user', content: JSON.stringify(Object.assign({ empresa: perfil, negocios: fichasIA }, params.contexto ? { contexto: params.contexto } : {})) },"

VENTAJAS = r"""
// 25-nov: una ventaja por negocio, asignada por código y rotando entre las de la propuesta de valor, para que los
// correos no repitan la misma frase. Exportación / ISPM-15 solo para negocios de carga o exportación.
const ventajas = String(empresa.value_proposition || '').replace(/\.+$/, '').split(/,|\s+y\s+|\s+and\s+/i).map(s => s.trim()).filter(s => s.length > 3);
const esCarga = (f) => /freight|cargo|logist|forward|shipping|export|import|carga|transport|aduana|customs/i.test([f.categoria, f.buscado_como, f.nombre].join(' '));
const esExport = (v) => /ispm|export|fitosanit|certific/i.test(v);
const contextoAplica = (f) => {
  if (!params.contexto) return false;
  const c = String(params.contexto).toLowerCase();
  if (/\bart\b|arte|basel|gallery|galer|museum|museo/.test(c)) return /\bart\b|arte|galler|galer|museum|museo|fine|exhib|collect/i.test([f.categoria, f.buscado_como, f.nombre].join(' '));
  return true;
};
const fichasIA = slim.map((s, i) => {
  const f = s.ficha || {};
  const opciones = ventajas.filter(v => esCarga(f) || !esExport(v));
  const lista = opciones.length ? opciones : ventajas;
  return Object.assign({}, f, { ventaja: lista.length ? lista[i % lista.length] : '', usa_contexto: contextoAplica(f) });
});
"""

GROQ_VIEJO = "const groq_body = {\n  model: 'openai/gpt-oss-120b',\n  temperature: 0.5,"
GROQ_NUEVO = "const groq_body = {\n  model: 'openai/gpt-oss-120b',\n  temperature: 0.7,"

RET_SEL_VIEJO = "return [{ json: { sinLeads: false, candidatos: slim, quedan, groq_body } }];"
RET_SEL_NUEVO = "return [{ json: { sinLeads: false, candidatos: slim, quedan, descartados, groq_body } }];"
RET_BLOG_VIEJO = "return [{ json: { sinLeads: false, candidatos: slim, quedan, groq_body: MODELO_TRIVIAL } }];"
RET_BLOG_NUEVO = "return [{ json: { sinLeads: false, candidatos: slim, quedan, descartados, groq_body: MODELO_TRIVIAL } }];"

# Filtrar y Armar: saludo como título
TITULO_VIEJO = "      ({ idioma, asunto, titulo, parrafos, servicios } = ia);"
TITULO_NUEVO = ("      ({ idioma, asunto, titulo, parrafos, servicios } = ia);\n"
                "      // 25-nov: el título es un saludo con el nombre del negocio (antes, un rótulo tipo folleto)\n"
                "      if (negocio) titulo = (idioma === 'en' ? 'Hello, ' : 'Hola, ') + negocio;")

RESUMEN_VIEJO = "const extra = { quedan_para_la_proxima: quedan, redactados_con_ia: armados.filter(j => j.con_ia).length, reintentos: armados.filter(j => j.reintento).length };"
RESUMEN_NUEVO = ("let descartados = []; try { descartados = $('🔍 Seleccionar Contactos').first().json.descartados || []; } catch (e) {}\n"
                 "const extra = { quedan_para_la_proxima: quedan, redactados_con_ia: armados.filter(j => j.con_ia).length, reintentos: armados.filter(j => j.reintento).length, descartados_por_correo: descartados };")


def main():
    w = api('GET', 'workflows/' + WID)
    (pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path('.')).joinpath('respaldo-camila-antes-25nov.json').write_text(json.dumps(w, ensure_ascii=False), encoding='utf-8')
    for n in w['nodes']:
        if n['name'] == '🔍 Seleccionar Contactos':
            c = n['parameters']['jsCode']
            c = reemplazar(c, SIN_LEADS_VIEJO, SIN_LEADS_NUEVO, n['name'])
            ancla = "\nif (candidatos.length === 0) {"
            if 'const descartados = [];' not in c and 'LIBRES' not in c:
                c = c.replace(ancla, FILTRO.replace('const descartados = [];', 'descartados = [];') + ancla, 1)
            c = reemplazar(c, REGLAS_VIEJAS_2B, REGLAS_NUEVAS_2B, n['name'])
            c = reemplazar(c, REGLA_13_VIEJA, REGLA_13_NUEVA, n['name'])
            if 'const fichasIA' not in c:
                c = c.replace("\nconst perfil = {", VENTAJAS + "\nconst perfil = {", 1)
            c = reemplazar(c, FICHAS_VIEJO, FICHAS_NUEVO, n['name'])
            c = reemplazar(c, GROQ_VIEJO, GROQ_NUEVO, n['name'])
            c = reemplazar(c, RET_SEL_VIEJO, RET_SEL_NUEVO, n['name'])
            c = reemplazar(c, RET_BLOG_VIEJO, RET_BLOG_NUEVO, n['name'])
            n['parameters']['jsCode'] = c
        elif n['name'] == '🔍 Filtrar y Armar Emails':
            n['parameters']['jsCode'] = reemplazar(n['parameters']['jsCode'], TITULO_VIEJO, TITULO_NUEVO, n['name'])
        elif n['name'] == '📤 Armar Resumen':
            n['parameters']['jsCode'] = reemplazar(n['parameters']['jsCode'], RESUMEN_VIEJO, RESUMEN_NUEVO, n['name'])
    body = {k: w[k] for k in ('name', 'nodes', 'connections')}
    body['settings'] = {k: v for k, v in (w.get('settings') or {}).items() if k in ('executionOrder', 'errorWorkflow', 'timezone', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'saveManualExecutions', 'saveExecutionProgress', 'executionTimeout', 'callerPolicy')}
    api('PUT', 'workflows/' + WID, body)
    print('Camila actualizada')


if __name__ == '__main__':
    main()
