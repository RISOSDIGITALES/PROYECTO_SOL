import json, requests, time

TOKEN     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE      = "https://n8n.mdarthurdigital.com/api/v1"
H         = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
GROQ_KEY  = "gsk_xh4sNFnhiBX0IIKYo5cLWGdyb3FYnFEJIPiSPuIBTK8MgCmVb"
GMAIL_CRED_ID = "TESHSjzjMCpCxBBk"
WF_ID     = "T9J845yE4sd8Dde5"

# ── Updated calendar code: adds isSaturday flag ─────────────────────────────
CALENDAR_CODE = r"""
const now   = new Date();
const day   = now.getDay();   // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
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
if (day === 5) tasks.push({ tipo:'semanal', nombre:'Indexación y Broken Links', descripcion:'Revisión del estado de indexación de cratingexpress.com. NOTA: Google Search Console requiere acceso manual — generar reporte de mejores prácticas y recordatorio de revisar la consola.', data:null });

if (day === 4) {
  const week = weekOfMonth(date, 4);
  if (week === 1) tasks.push({ tipo:'mensual', nombre:'Optimización de Base de Datos', descripcion:'Instrucciones y mejores prácticas para optimización de base de datos WordPress. Incluir WP-Optimize y checklist de limpieza.', data:null });
  if (week === 2) tasks.push({ tipo:'mensual', nombre:'Auditoría de Velocidad (PageSpeed)', descripcion:'Análisis de rendimiento cratingexpress.com con datos reales de PageSpeed Insights. Documentar LCP, CLS, TBT y generar recomendaciones.', data:'PAGESPEED_DATA' });
  if (week === 3) tasks.push({ tipo:'mensual', nombre:'SEO y Métricas de Contenido', descripcion:'Revisión SEO de cratingexpress.com. Identificar páginas de bajo rendimiento, keywords del sector logística/packaging/crating Miami. NOTA: SerpAPI pendiente — generar análisis de mejores prácticas.', data:null });
}

if (day === 2 && isQuarterMonth) {
  const week = weekOfMonth(date, 2);
  if (week === 2) tasks.push({ tipo:'trimestral', nombre:'UX y Compatibilidad de Navegadores', descripcion:'Checklist de pruebas UX para cratingexpress.com en múltiples dispositivos y navegadores. Incluir pruebas mobile-first.', data:null });
  if (week === 3) tasks.push({ tipo:'trimestral', nombre:'Prueba de Formularios y Pasarelas de Pago', descripcion:'Protocolo de prueba para formularios de contacto y pasarelas de pago. Escenarios paso a paso.', data:null });
}

if (day === 2 && isDecember) {
  const week = weekOfMonth(date, 2);
  if (week === 1) tasks.push({ tipo:'anual', nombre:'Renovación de Dominio y SSL', descripcion:'Checklist de renovación de dominio cratingexpress.com, certificados SSL y actualización de contraseñas críticas.', data:null });
  if (week === 3) tasks.push({ tipo:'anual', nombre:'Auditoría Estratégica SEO/AEO Completa', descripcion:'Auditoría anual SEO/AEO para Crating Express. Keywords, E-E-A-T, metadatos, estructura H1-H3, contenido 1000-1500 palabras. Audiencia: freight forwarders, manufacturers, exporters Miami.', data:null });
}

const fechaHoy = now.toLocaleDateString('es-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

return [{ json: { tasks, fechaHoy, hayTareas: tasks.length > 0 || isSaturday, isSaturday, needsPageSpeed: tasks.some(t => t.data === 'PAGESPEED_DATA'), needsSucuri: tasks.some(t => t.data === 'SUCURI_DATA') } }];
"""

# ── Updated prompt builder: stores in staticData, Saturday reads it ─────────
PROMPT_CODE = r"""
const tareas = $('📅 Determinar Tareas de Hoy').first().json;
const tasks  = tareas.tasks;
const fecha  = tareas.fechaHoy;

let pageSpeedData = '';
let sucuriData    = 'Sucuri: Verificar manualmente en sitecheck.sucuri.net/results/cratingexpress.com';

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

const taskDescriptions = tasks.map(t => {
  let desc = `## ${t.tipo.toUpperCase()}: ${t.nombre}\n${t.descripcion}`;
  if (t.data === 'PAGESPEED_DATA' && pageSpeedData) desc += `\n\nDATOS REALES: ${pageSpeedData}`;
  if (t.data === 'SUCURI_DATA') desc += `\n\nDATOS REALES: ${sucuriData}`;
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

# ── New node: Guardar resultado en staticData ───────────────────────────────
SAVE_CODE = r"""
const staticData = $getWorkflowStaticData('global');
if (!staticData.semana) staticData.semana = [];

const parsed   = $('📋 Parsear Reporte').first().json;
const tareas   = $('📅 Determinar Tareas de Hoy').first().json;

staticData.semana.push({
  fecha:   tareas.fechaHoy,
  tareas:  tareas.tasks.map(t => t.nombre),
  resumen: parsed.resumen_texto || '',
  html:    parsed.body_html || ''
});

return [{ json: { guardado: true, totalDias: staticData.semana.length } }];
"""

# ── New node: IF ¿Es sábado? ────────────────────────────────────────────────

# ── New node: Preparar Reporte Semanal ─────────────────────────────────────
WEEKLY_REPORT_CODE = r"""
const staticData = $getWorkflowStaticData('global');
const semana = staticData.semana || [];

const now    = new Date();
const fecha  = now.toLocaleDateString('es-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

if (semana.length === 0) {
  return [{ json: { sinTareas: true } }];
}

// Build combined HTML report
const NAVY   = '#305468';
const sections = semana.map(dia => `
  <div style="margin-bottom:28px;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
    <h3 style="color:${NAVY};margin:0 0 8px;">${dia.fecha}</h3>
    <p style="color:#555;font-size:13px;margin:0 0 12px;"><strong>Tareas:</strong> ${dia.tareas.join(', ')}</p>
    <p style="color:#444;margin:0 0 12px;">${dia.resumen}</p>
    <details>
      <summary style="cursor:pointer;color:${NAVY};font-size:13px;">Ver reporte completo</summary>
      <div style="margin-top:12px;">${dia.html}</div>
    </details>
  </div>
`).join('');

const bodyHtml = `
<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#333;">
  <div style="background:${NAVY};color:#fff;padding:24px 28px;border-radius:8px 8px 0 0;">
    <div style="font-size:11px;letter-spacing:1px;opacity:.7;text-transform:uppercase;">Reporte Semanal</div>
    <h1 style="margin:4px 0 0;font-size:22px;">Crating Express — Mantenimiento Web</h1>
    <p style="margin:6px 0 0;opacity:.8;font-size:14px;">${fecha}</p>
  </div>
  <div style="padding:24px 28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
    <p>Hola Sol,</p>
    <p>Aquí está el resumen de todas las tareas de mantenimiento ejecutadas esta semana:</p>
    ${sections}
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
    <p style="font-size:12px;color:#999;">CE Maintenance Manager — Generado automáticamente por n8n</p>
  </div>
</div>`;

// Clear staticData for next week
staticData.semana = [];

return [{ json: {
  subject: `Reporte Semanal: Crating Express Mantenimiento Web — ${fecha}`,
  body_html: bodyHtml
}}];
"""

# ── Fetch and rebuild workflow ───────────────────────────────────────────────
wf_raw = json.load(open('/tmp/maint_wf.json'))
ALLOWED = {"name", "nodes", "connections", "settings", "staticData"}
wf = {k: v for k, v in wf_raw.items() if k in ALLOWED}

# ── Replace the calendar and prompt nodes, keep structure ───────────────────
new_nodes = []
for n in wf['nodes']:
    if n['name'] == '📅 Determinar Tareas de Hoy':
        n['parameters']['jsCode'] = CALENDAR_CODE
    if n['name'] == '📝 Preparar Prompt Groq':
        n['parameters']['jsCode'] = PROMPT_CODE
    new_nodes.append(n)

# Add 3 new nodes
new_nodes += [
    {
        "id": "maint-save",
        "name": "💾 Guardar en Semana",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1680, 300],
        "parameters": {"jsCode": SAVE_CODE}
    },
    {
        "id": "maint-ifsat",
        "name": "📆 ¿Es sábado?",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [1920, 300],
        "parameters": {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                "conditions": [
                    {
                        "id": "cond-sat",
                        "leftValue": "={{ $('📅 Determinar Tareas de Hoy').first().json.isSaturday }}",
                        "rightValue": True,
                        "operator": {"type": "boolean", "operation": "true"}
                    }
                ],
                "combinator": "and"
            }
        }
    },
    {
        "id": "maint-weekly",
        "name": "📊 Preparar Reporte Semanal",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [2160, 200],
        "parameters": {"jsCode": WEEKLY_REPORT_CODE}
    }
]

wf['nodes'] = new_nodes

# ── Rewire connections ───────────────────────────────────────────────────────
conns = wf['connections']

# Email node now comes after weekly report, not after parse
# Remove old Parse → Email connection (it now goes: Parse → Save → IfSat → WeeklyReport → Email)
old_parse = conns.get('📋 Parsear Reporte', {})
# Keep parse connected to save instead of email
conns['📋 Parsear Reporte'] = {"main": [[{"node": "💾 Guardar en Semana", "type": "main", "index": 0}]]}

# Save → IfSat
conns['💾 Guardar en Semana'] = {"main": [[{"node": "📆 ¿Es sábado?", "type": "main", "index": 0}]]}

# IfSat: true → WeeklyReport; false → stop
conns['📆 ¿Es sábado?'] = {"main": [
    [{"node": "📊 Preparar Reporte Semanal", "type": "main", "index": 0}],
    []
]}

# WeeklyReport → Email
conns['📊 Preparar Reporte Semanal'] = {"main": [[{"node": "📧 Enviar Reporte a Sol", "type": "main", "index": 0}]]}

# Also: on Saturday with no tasks in the week, trigger still runs
# The IF ¿Hay tareas? node on Saturday should pass (isSaturday=true means hayTareas=true)

wf['connections'] = conns

# ── PUT ──────────────────────────────────────────────────────────────────────
for attempt in range(4):
    r = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=wf)
    if r.status_code == 200:
        print("✅ Workflow actualizado: tareas diarias, reporte semanal los sábados")
        break
    elif r.status_code == 503:
        wait = 2 ** (attempt + 1)
        print(f"503 — reintentando en {wait}s...")
        time.sleep(wait)
    else:
        print(f"❌ Error {r.status_code}: {r.text[:400]}")
        break
