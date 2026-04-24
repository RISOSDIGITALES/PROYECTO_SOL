import json, requests, time

TOKEN    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE     = "https://n8n.mdarthurdigital.com/api/v1"
H        = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID    = "T9J845yE4sd8Dde5"
SERP_KEY = "1d34b94358d31e9d8043ae3f1ead005322b022b6b0fdcf1f2699d68c95a9c1b9"

# ── Updated calendar: tag Friday + 3rd-Thu SEO tasks with SERP_DATA ──────────
CALENDAR_CODE = r"""
const now   = new Date();
const day   = now.getDay();
const date  = now.getDate();
const month = now.getMonth();

function weekOfMonth(d, targetDay) {
  let count = 0;
  for (let i = 1; i <= d; i++) {
    const wd = new Date(now.getFullYear(), month, i).getDay();
    if (wd === targetDay) count++;
  }
  return count;
}

const isQuarterMonth = [0, 3, 6, 9].includes(month);
const isDecember     = month === 11;
const isSaturday     = day === 6;

const tasks = [];

if (day === 1) tasks.push({ tipo:'semanal', nombre:'Actualizaciones WordPress', descripcion:'Recordatorio de actualizaciones de WordPress core, plugins y temas. Incluir enlace al panel de administración y pasos claros de actualización.', data:null });
if (day === 3) tasks.push({ tipo:'semanal', nombre:'Seguridad y Backups (Sucuri)', descripcion:'Análisis de seguridad de cratingexpress.com usando Sucuri SiteCheck. Verificar malware, vulnerabilidades y estado de backups.', data:'SUCURI_DATA' });
if (day === 5) tasks.push({ tipo:'semanal', nombre:'Indexación y Posicionamiento SEO', descripcion:'Revisión del estado de indexación y posicionamiento de cratingexpress.com en Google. Analizar posición para keywords clave del sector.', data:'SERP_DATA' });

if (day === 4) {
  const week = weekOfMonth(date, 4);
  if (week === 1) tasks.push({ tipo:'mensual', nombre:'Optimización de Base de Datos', descripcion:'Instrucciones y mejores prácticas para optimización de base de datos WordPress. Incluir WP-Optimize y checklist de limpieza.', data:null });
  if (week === 2) tasks.push({ tipo:'mensual', nombre:'Auditoría de Velocidad (PageSpeed)', descripcion:'Análisis de rendimiento cratingexpress.com con datos reales de PageSpeed Insights. Documentar LCP, CLS, TBT y generar recomendaciones.', data:'PAGESPEED_DATA' });
  if (week === 3) tasks.push({ tipo:'mensual', nombre:'SEO y Métricas de Contenido', descripcion:'Revisión SEO de cratingexpress.com. Keywords: crating miami, wood crates miami, export packaging miami. Identificar posición actual y oportunidades.', data:'SERP_DATA' });
}

if (day === 2 && isQuarterMonth) {
  const week = weekOfMonth(date, 2);
  if (week === 2) tasks.push({ tipo:'trimestral', nombre:'UX y Compatibilidad de Navegadores', descripcion:'Checklist de pruebas UX para cratingexpress.com en múltiples dispositivos y navegadores. Incluir pruebas mobile-first.', data:null });
  if (week === 3) tasks.push({ tipo:'trimestral', nombre:'Prueba de Formularios y Pasarelas de Pago', descripcion:'Protocolo de prueba para formularios de contacto y pasarelas de pago. Escenarios paso a paso.', data:null });
}

if (day === 2 && isDecember) {
  const week = weekOfMonth(date, 2);
  if (week === 1) tasks.push({ tipo:'anual', nombre:'Renovación de Dominio y SSL', descripcion:'Checklist de renovación de dominio cratingexpress.com, certificados SSL y actualización de contraseñas críticas.', data:null });
  if (week === 3) tasks.push({ tipo:'anual', nombre:'Auditoría Estratégica SEO/AEO Completa', descripcion:'Auditoría anual SEO/AEO para Crating Express. Keywords, E-E-A-T, metadatos, estructura H1-H3, contenido 1000-1500 palabras.', data:'SERP_DATA' });
}

const fechaHoy = now.toLocaleDateString('es-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

return [{ json: {
  tasks,
  fechaHoy,
  hayTareas:     tasks.length > 0 || isSaturday,
  isSaturday,
  needsPageSpeed: tasks.some(t => t.data === 'PAGESPEED_DATA'),
  needsSucuri:    tasks.some(t => t.data === 'SUCURI_DATA'),
  needsSerp:      tasks.some(t => t.data === 'SERP_DATA')
} }];
"""

# ── Updated prompt builder: reads SerpAPI data ───────────────────────────────
PROMPT_CODE = r"""
const tareas = $('📅 Determinar Tareas de Hoy').first().json;
const tasks  = tareas.tasks;
const fecha  = tareas.fechaHoy;

let pageSpeedData = '';
let sucuriData    = 'Sucuri: Verificar manualmente en sitecheck.sucuri.net/results/cratingexpress.com';
let serpData      = '';

try {
  const ps   = $('🌐 PageSpeed: Obtener Datos').first().json;
  const cats = ps.lighthouseResult?.categories || {};
  const perf = Math.round((cats.performance?.score || 0) * 100);
  const seo  = Math.round((cats.seo?.score || 0) * 100);
  const acc  = Math.round((cats.accessibility?.score || 0) * 100);
  const lcp  = ps.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue || 'N/A';
  const cls  = ps.lighthouseResult?.audits?.['cumulative-layout-shift']?.displayValue || 'N/A';
  const tbt  = ps.lighthouseResult?.audits?.['total-blocking-time']?.displayValue || 'N/A';
  pageSpeedData = `PageSpeed Insights (Mobile) — Performance: ${perf}/100 | SEO: ${seo}/100 | Accessibility: ${acc}/100 | LCP: ${lcp} | CLS: ${cls} | TBT: ${tbt}`;
} catch(e) {}

try {
  const sc    = $('🔒 Sucuri: Verificar Seguridad').first().json;
  const clean = sc.system?.scan?.site_clean;
  sucuriData  = `Sucuri SiteCheck: ${clean ? '✅ Sitio limpio, sin malware detectado' : '⚠️ Revisar manualmente en sitecheck.sucuri.net'}`;
} catch(e) {}

try {
  const sr = $('🔍 SerpAPI: Posicionamiento SEO').first().json;

  // Keyword 1: crating miami
  const r1 = sr.keyword1 || {};
  const pos1 = r1.cePosition ? `posición #${r1.cePosition}` : 'no aparece en top 10';
  const top1 = (r1.topResults || []).slice(0,3).map((x,i) => `  ${i+1}. ${x.title} (${x.link})`).join('\n');

  // Keyword 2: wood crates miami
  const r2 = sr.keyword2 || {};
  const pos2 = r2.cePosition ? `posición #${r2.cePosition}` : 'no aparece en top 10';
  const top2 = (r2.topResults || []).slice(0,3).map((x,i) => `  ${i+1}. ${x.title} (${x.link})`).join('\n');

  // Site index count
  const indexed = sr.indexedPages || 'N/A';

  serpData = `SerpAPI — Resultados Google Miami:\n` +
    `• "crating miami": Crating Express ${pos1}\n  Top resultados:\n${top1}\n` +
    `• "wood crates miami": Crating Express ${pos2}\n  Top resultados:\n${top2}\n` +
    `• Páginas indexadas (site:cratingexpress.com): ${indexed}`;
} catch(e) {}

const taskDescriptions = tasks.map(t => {
  let desc = `## ${t.tipo.toUpperCase()}: ${t.nombre}\n${t.descripcion}`;
  if (t.data === 'PAGESPEED_DATA' && pageSpeedData) desc += `\n\nDATOS REALES: ${pageSpeedData}`;
  if (t.data === 'SUCURI_DATA') desc += `\n\nDATOS REALES: ${sucuriData}`;
  if (t.data === 'SERP_DATA' && serpData) desc += `\n\nDATOS REALES:\n${serpData}`;
  return desc;
}).join('\n\n---\n\n');

const systemPrompt = `Eres el Maintenance Manager de Crating Express, empresa de embalaje de madera y crating personalizado en Miami, FL. Web: cratingexpress.com. Genera reportes profesionales, directos y orientados a resultados. Usa "Crating Express" completo siempre, usa "disponer" en lugar de "ofrecer".`;

const userPrompt = `Fecha: ${fecha}

Ejecuta y genera el reporte para estas tareas de mantenimiento:

${taskDescriptions}

Responde SOLO con JSON válido:
{
  "subject": "Reporte de Tarea: Crating Express - ${fecha}",
  "resumen_texto": "resumen en texto plano de máximo 3 líneas con los hallazgos clave",
  "body_html": "HTML completo del reporte con secciones: Hallazgos → Recomendaciones → Próximos Pasos"
}`;

return [{ json: { systemPrompt, userPrompt, fecha, tasks: tasks.map(t => t.nombre) } }];
"""

# ── Fetch workflow ────────────────────────────────────────────────────────────
r = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H)
wf = json.loads(r.text)
ALLOWED = {"name", "nodes", "connections", "settings", "staticData"}
wf = {k: v for k, v in wf.items() if k in ALLOWED}

# ── Update calendar and prompt nodes ─────────────────────────────────────────
for n in wf['nodes']:
    if n['name'] == '📅 Determinar Tareas de Hoy':
        n['parameters']['jsCode'] = CALENDAR_CODE
    if n['name'] == '📝 Preparar Prompt Groq':
        n['parameters']['jsCode'] = PROMPT_CODE

# ── Add SerpAPI node ─────────────────────────────────────────────────────────
SERP_CODE = f"""
const tareas = $('📅 Determinar Tareas de Hoy').first().json;
if (!tareas.needsSerp) return [{{ json: {{ skipped: true }} }}];

const KEY = '{SERP_KEY}';

async function search(q) {{
  const url = `https://serpapi.com/search.json?q=${{encodeURIComponent(q)}}&location=Miami,Florida,United States&hl=en&gl=us&num=10&api_key=${{KEY}}`;
  const res = await fetch(url);
  const data = await res.json();
  const results = (data.organic_results || []).map((r, i) => ({{
    position: i + 1,
    title: r.title || '',
    link: r.link || '',
    snippet: r.snippet || ''
  }}));
  const cePosition = results.find(r => r.link.includes('cratingexpress.com'))?.position || null;
  return {{ topResults: results.slice(0, 5), cePosition }};
}}

async function countIndexed() {{
  const url = `https://serpapi.com/search.json?q=site:cratingexpress.com&api_key=${{KEY}}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.search_information?.total_results || 'N/A';
}}

const [keyword1, keyword2, indexedPages] = await Promise.all([
  search('crating miami'),
  search('wood crates miami'),
  countIndexed()
]);

return [{{ json: {{ keyword1, keyword2, indexedPages }} }}];
"""

serp_node = {
    "id": "maint-serp",
    "name": "🔍 SerpAPI: Posicionamiento SEO",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [960, 500],
    "parameters": {"jsCode": SERP_CODE}
}

# Add node if not already present
if not any(n['name'] == '🔍 SerpAPI: Posicionamiento SEO' for n in wf['nodes']):
    wf['nodes'].append(serp_node)

# ── Update connections ────────────────────────────────────────────────────────
conns = wf['connections']

# IF node: add SerpAPI to the true branch (alongside PageSpeed and Sucuri)
if_conns = conns.get('❓ ¿Hay tareas hoy?', {}).get('main', [[]])
true_branch = if_conns[0] if if_conns else []
if not any(t['node'] == '🔍 SerpAPI: Posicionamiento SEO' for t in true_branch):
    true_branch.append({"node": "🔍 SerpAPI: Posicionamiento SEO", "type": "main", "index": 0})
conns['❓ ¿Hay tareas hoy?'] = {"main": [true_branch]}

# SerpAPI → Prompt builder
conns['🔍 SerpAPI: Posicionamiento SEO'] = {
    "main": [[{"node": "📝 Preparar Prompt Groq", "type": "main", "index": 0}]]
}

wf['connections'] = conns

# ── PUT ───────────────────────────────────────────────────────────────────────
for attempt in range(4):
    r = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=wf)
    if r.status_code == 200:
        print("✅ SerpAPI integrado en CE Mantenimiento")
        print("   • Viernes: búsqueda 'crating miami' + 'wood crates miami' + páginas indexadas")
        print("   • 3er jueves: mismo análisis para reporte SEO mensual")
        print("   • Anual (diciembre): auditoría completa con datos reales")
        break
    elif r.status_code == 503:
        wait = 2 ** (attempt + 1)
        print(f"503 — reintentando en {wait}s...")
        time.sleep(wait)
    else:
        print(f"❌ Error {r.status_code}: {r.text[:400]}")
        break
