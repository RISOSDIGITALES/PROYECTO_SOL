import json, requests, time

TOKEN     = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE      = "https://n8n.mdarthurdigital.com/api/v1"
H         = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
GROQ_KEY  = "gsk_xh4sNFnhiBX0IIKYo5cLWGdyb3FYnFEJIPiSPuIBTK8MgCmVb"
GMAIL_CRED_ID = "TESHSjzjMCpCxBBk"

# ── Node names ─────────────────────────────────────────────────────────────
N_SCHED   = "⏰ Trigger 9am Diario"
N_MANUAL  = "▶️ Ejecutar Manualmente"
N_TASKS   = "📅 Determinar Tareas de Hoy"
N_IF      = "❓ ¿Hay tareas hoy?"
N_SPEED   = "🌐 PageSpeed: Obtener Datos"
N_SECURI  = "🔒 Sucuri: Verificar Seguridad"
N_PROMPT  = "📝 Preparar Prompt Groq"
N_GROQ    = "🤖 Groq: Generar Reporte"
N_PARSE   = "📋 Parsear Reporte"
N_EMAIL   = "📧 Enviar Reporte a Sol"

CALENDAR_CODE = r"""
const now   = new Date();
const day   = now.getDay();   // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const date  = now.getDate();
const month = now.getMonth(); // 0=Jan … 11=Dec

// Which week-of-month is this weekday? (1st, 2nd, 3rd, 4th)
function weekOfMonth(d, targetDay) {
  let count = 0;
  for (let i = 1; i <= d; i++) {
    const wd = new Date(now.getFullYear(), month, i).getDay();
    if (wd === targetDay) count++;
  }
  return count;
}

const isQuarterMonth = [0, 3, 6, 9].includes(month); // Jan Apr Jul Oct
const isDecember     = month === 11;

const tasks = [];

// ── WEEKLY ──────────────────────────────────────────────────────────────────
if (day === 1) {
  tasks.push({
    tipo: 'semanal',
    nombre: 'Actualizaciones WordPress',
    descripcion: 'Recordatorio de actualizaciones de WordPress core, plugins y temas. Incluir enlace al panel de administración y pasos claros de actualización.',
    data: null
  });
}

if (day === 3) {
  tasks.push({
    tipo: 'semanal',
    nombre: 'Seguridad y Backups (Sucuri)',
    descripcion: 'Análisis de seguridad del sitio cratingexpress.com usando datos de Sucuri SiteCheck. Verificar malware, vulnerabilidades y estado de backups.',
    data: 'SUCURI_DATA'  // placeholder - replaced with real data
  });
}

if (day === 5) {
  tasks.push({
    tipo: 'semanal',
    nombre: 'Indexación y Broken Links (Search Console)',
    descripcion: 'Revisión del estado de indexación de cratingexpress.com en Google. Identificar errores de indexación y enlaces rotos. NOTA: Google Search Console requiere acceso OAuth manual — generar reporte basado en mejores prácticas y recordatorio de revisar la consola manualmente.',
    data: null
  });
}

// ── MONTHLY ─────────────────────────────────────────────────────────────────
if (day === 4) {  // Thursday
  const week = weekOfMonth(date, 4);
  if (week === 1) {
    tasks.push({
      tipo: 'mensual',
      nombre: 'Optimización de Base de Datos',
      descripcion: 'Instrucciones y mejores prácticas para optimización de base de datos WordPress. Incluir comandos SQL seguros, plugins recomendados (WP-Optimize) y checklist de limpieza.',
      data: null
    });
  }
  if (week === 2) {
    tasks.push({
      tipo: 'mensual',
      nombre: 'Auditoría de Velocidad (PageSpeed/GTmetrix)',
      descripcion: 'Análisis de rendimiento del sitio cratingexpress.com. Datos de Google PageSpeed Insights incluidos. Documentar LCP, FID, CLS y generar recomendaciones de optimización.',
      data: 'PAGESPEED_DATA'  // placeholder - replaced with real data
    });
  }
  if (week === 3) {
    tasks.push({
      tipo: 'mensual',
      nombre: 'SEO y Métricas de Contenido',
      descripcion: 'Revisión de tendencias de tráfico y SEO para cratingexpress.com. Identificar páginas de bajo rendimiento, investigar keywords del sector logística/packaging/crating Miami. NOTA: Para datos en tiempo real se requiere SerpAPI — generar análisis basado en conocimiento SEO del sector y recomendaciones accionables.',
      data: null
    });
  }
}

// ── QUARTERLY ───────────────────────────────────────────────────────────────
if (day === 2 && isQuarterMonth) {  // Tuesday in quarter months
  const week = weekOfMonth(date, 2);
  if (week === 2) {
    tasks.push({
      tipo: 'trimestral',
      nombre: 'UX y Compatibilidad de Navegadores',
      descripcion: 'Generar checklist completo de pruebas UX para cratingexpress.com en múltiples dispositivos y navegadores (Chrome, Firefox, Safari, Edge). Incluir pruebas mobile-first.',
      data: null
    });
  }
  if (week === 3) {
    tasks.push({
      tipo: 'trimestral',
      nombre: 'Prueba de Formularios y Pasarelas de Pago',
      descripcion: 'Protocolo de prueba para formularios de contacto y pasarelas de pago en cratingexpress.com. Incluir escenarios de prueba paso a paso para cada formulario.',
      data: null
    });
  }
}

// ── ANNUAL ───────────────────────────────────────────────────────────────────
if (day === 2 && isDecember) {  // Tuesday in December
  const week = weekOfMonth(date, 2);
  if (week === 1) {
    tasks.push({
      tipo: 'anual',
      nombre: 'Renovación de Dominio y SSL',
      descripcion: 'Checklist de renovación de dominio cratingexpress.com, certificados SSL y actualización de contraseñas críticas. Verificar fechas de vencimiento.',
      data: null
    });
  }
  if (week === 3) {
    tasks.push({
      tipo: 'anual',
      nombre: 'Auditoría Estratégica SEO/AEO Completa',
      descripcion: 'Auditoría estratégica anual completa de SEO/AEO para Crating Express. Incluir análisis de keywords primario y secundarios, E-E-A-T, metadatos optimizados, estructura H1-H3, recomendaciones de contenido (1000-1500 palabras) con enfoque en logística industrial Miami. Audiencia: freight forwarders, manufacturers, exporters.',
      data: null
    });
  }
}

const fechaHoy = now.toLocaleDateString('es-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

return [{ json: { tasks, fechaHoy, hayTareas: tasks.length > 0, needsPageSpeed: tasks.some(t => t.data === 'PAGESPEED_DATA'), needsSucuri: tasks.some(t => t.data === 'SUCURI_DATA') } }];
"""

PROMPT_CODE = r"""
const tareas  = $('📅 Determinar Tareas de Hoy').first().json;
const tasks   = tareas.tasks;
const fecha   = tareas.fechaHoy;

// Inject real data where available
let pageSpeedData = '';
let sucuriData    = '';

try {
  const ps = $('🌐 PageSpeed: Obtener Datos').first().json;
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
  const sc = $('🔒 Sucuri: Verificar Seguridad').first().json;
  const clean = sc.system?.scan?.site_clean;
  sucuriData = `Sucuri SiteCheck: ${clean ? '✅ Sitio limpio, sin malware detectado' : '⚠️ Revisar manualmente en sitecheck.sucuri.net/results/cratingexpress.com'}`;
} catch(e) {
  sucuriData = 'Sucuri: Verificar manualmente en sitecheck.sucuri.net/results/cratingexpress.com';
}

// Build task descriptions with real data
const taskDescriptions = tasks.map(t => {
  let desc = `## ${t.tipo.toUpperCase()}: ${t.nombre}\n${t.descripcion}`;
  if (t.data === 'PAGESPEED_DATA' && pageSpeedData) desc += `\n\nDATOS REALES: ${pageSpeedData}`;
  if (t.data === 'SUCURI_DATA') desc += `\n\nDATOS REALES: ${sucuriData}`;
  return desc;
}).join('\n\n---\n\n');

const systemPrompt = `Eres el Maintenance Manager de Crating Express, empresa especializada en soluciones de embalaje de madera y crating personalizado en Miami, FL.

EMPRESA: Crating Express (CE) | Web: https://cratingexpress.com/en/ | Nicho: Custom wood crating (ISPM-15), servicios ON SITE en Miami
AUDIENCIA INTERNA: Sol (risosadmi@gmail.com) — responsable de operaciones digitales

INSTRUCCIONES DE COMUNICACIÓN:
- Siempre escribe "Crating Express" completo, nunca abrevies
- Tono profesional, directo, orientado a resultados
- Usa "disponer" en lugar de "ofrecer"
- Estructura: Resumen → Hallazgos → Recomendaciones → Próximos Pasos
- Incluye nombres de herramientas y enlaces relevantes
- Si no tienes acceso a datos en tiempo real, genera recomendaciones basadas en mejores prácticas del sector`;

const userPrompt = `Fecha: ${fecha}

Ejecuta y genera el reporte para las siguientes tareas de mantenimiento de hoy:

${taskDescriptions}

Genera un email HTML profesional completo con:
- Asunto del email en formato: "Reporte de Tarea: Crating Express - ${fecha}"
- Cuerpo HTML con secciones claras para cada tarea
- Hallazgos técnicos específicos
- Recomendaciones accionables
- Próximos pasos concretos

Responde SOLO con JSON válido:
{
  "subject": "...",
  "body_html": "... (HTML completo del email) ..."
}`;

return [{ json: { systemPrompt, userPrompt } }];
"""

nodes = [
    {
        "id": "maint-sched",
        "name": N_SCHED,
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [0, 300],
        "parameters": {
            "rule": {"interval": [{"field": "cronExpression", "expression": "0 9 * * *"}]}
        }
    },
    {
        "id": "maint-manual",
        "name": N_MANUAL,
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [0, 480],
        "parameters": {}
    },
    {
        "id": "maint-tasks",
        "name": N_TASKS,
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [240, 300],
        "parameters": {"jsCode": CALENDAR_CODE}
    },
    {
        "id": "maint-if",
        "name": N_IF,
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [480, 300],
        "parameters": {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                "conditions": [
                    {
                        "id": "cond-tasks",
                        "leftValue": "={{ $json.hayTareas }}",
                        "rightValue": True,
                        "operator": {"type": "boolean", "operation": "true"}
                    }
                ],
                "combinator": "and"
            }
        }
    },
    {
        "id": "maint-pagespeed",
        "name": N_SPEED,
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [720, 200],
        "parameters": {
            "method": "GET",
            "url": "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
            "sendQuery": True,
            "queryParameters": {
                "parameters": [
                    {"name": "url", "value": "https://cratingexpress.com"},
                    {"name": "strategy", "value": "mobile"}
                ]
            },
            "options": {"timeout": 30000}
        }
    },
    {
        "id": "maint-sucuri",
        "name": N_SECURI,
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [720, 380],
        "parameters": {
            "method": "GET",
            "url": "https://sitecheck.sucuri.net/api/check/",
            "sendQuery": True,
            "queryParameters": {
                "parameters": [
                    {"name": "scan", "value": "cratingexpress.com"}
                ]
            },
            "options": {"timeout": 30000}
        }
    },
    {
        "id": "maint-prompt",
        "name": N_PROMPT,
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [960, 300],
        "parameters": {"jsCode": PROMPT_CODE}
    },
    {
        "id": "maint-groq",
        "name": N_GROQ,
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [1200, 300],
        "parameters": {
            "method": "POST",
            "url": "https://api.groq.com/openai/v1/chat/completions",
            "sendHeaders": True,
            "headerParameters": {
                "parameters": [
                    {"name": "Authorization", "value": f"Bearer {GROQ_KEY}"},
                    {"name": "Content-Type", "value": "application/json"}
                ]
            },
            "sendBody": True,
            "specifyBody": "json",
            "jsonBody": '={{ JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "system", content: $json.systemPrompt }, { role: "user", content: $json.userPrompt }], temperature: 0.4, max_tokens: 4000, response_format: { type: "json_object" } }) }}'
        }
    },
    {
        "id": "maint-parse",
        "name": N_PARSE,
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1440, 300],
        "parameters": {
            "jsCode": r"""
const raw = $input.item.json.choices?.[0]?.message?.content || '{}';
let parsed;
try { parsed = JSON.parse(raw); }
catch(e) {
  const m = raw.match(/\{[\s\S]*\}/);
  parsed = m ? JSON.parse(m[0]) : {};
}
const fecha = $('📅 Determinar Tareas de Hoy').first().json.fechaHoy;
return [{ json: {
  subject: parsed.subject || `Reporte de Tarea: Crating Express - ${fecha}`,
  body_html: parsed.body_html || `<p>Error generando reporte. Fecha: ${fecha}</p>`
}}];
"""
        }
    },
    {
        "id": "maint-email",
        "name": N_EMAIL,
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.1,
        "position": [1680, 300],
        "credentials": {
            "gmailOAuth2": {"id": GMAIL_CRED_ID, "name": "Gmail account"}
        },
        "parameters": {
            "sendTo": "risosadmi@gmail.com",
            "subject": "={{ $json.subject }}",
            "message": "={{ $json.body_html }}",
            "options": {
                "appendAttribution": False,
                "ccList": "risosnds@gmail.com",
                "senderName": "CE Maintenance Manager"
            }
        }
    }
]

connections = {
    N_SCHED:  {"main": [[{"node": N_TASKS,  "type": "main", "index": 0}]]},
    N_MANUAL: {"main": [[{"node": N_TASKS,  "type": "main", "index": 0}]]},
    N_TASKS:  {"main": [[{"node": N_IF,     "type": "main", "index": 0}]]},
    N_IF:     {"main": [
        # true → fetch external data in parallel
        [
            {"node": N_SPEED,  "type": "main", "index": 0},
            {"node": N_SECURI, "type": "main", "index": 0}
        ],
        # false → stop silently
        []
    ]},
    N_SPEED:  {"main": [[{"node": N_PROMPT, "type": "main", "index": 0}]]},
    N_SECURI: {"main": [[{"node": N_PROMPT, "type": "main", "index": 0}]]},
    N_PROMPT: {"main": [[{"node": N_GROQ,   "type": "main", "index": 0}]]},
    N_GROQ:   {"main": [[{"node": N_PARSE,  "type": "main", "index": 0}]]},
    N_PARSE:  {"main": [[{"node": N_EMAIL,  "type": "main", "index": 0}]]},
}

workflow = {
    "name": "CE Mantenimiento Web - Calendario Automático",
    "nodes": nodes,
    "connections": connections,
    "settings": {
        "executionOrder": "v1",
        "errorWorkflow": "CKOju9JVnSMymfKv"
    },
    "staticData": None
}

for attempt in range(4):
    r = requests.post(f"{BASE}/workflows", headers=H, json=workflow)
    if r.status_code in (200, 201):
        wf_id = r.json().get("id")
        print(f"✅ Workflow creado: ID = {wf_id}")
        # Activate it
        ra = requests.post(f"{BASE}/workflows/{wf_id}/activate", headers=H)
        print(f"✅ Activado: {ra.status_code}")
        break
    elif r.status_code == 503:
        wait = 2 ** (attempt + 1)
        print(f"503 — reintentando en {wait}s...")
        time.sleep(wait)
    else:
        print(f"❌ Error {r.status_code}: {r.text[:500]}")
        break
