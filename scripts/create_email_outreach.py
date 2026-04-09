import json
import requests

N8N_TOKEN = "TOKEN_HERE"
N8N_BASE = "https://n8n.mdarthurdigital.com/api/v1"
HEADERS = {"X-N8N-API-KEY": N8N_TOKEN, "Content-Type": "application/json"}

SPREADSHEET_ID = "1WRqv3s1vsTRSpfz6Bo27u3ff9kHDki_nDDMFt9yVj-8"
SHEETS_CRED_ID = "QE2RlAxaMLoYefTD"
GMAIL_CRED_ID  = "TESHSjzjMCpCxBBk"
ADMIN_EMAIL    = "risosadmi@gmail.com"

# Node names (used in both nodes list and connections dict)
N_SCHED    = "\u23f0 Trigger Mi\u00e9rcoles 9am"
N_MANUAL   = "\u25b6\ufe0f Ejecutar Manualmente"
N_BLOG     = "\U0001f4f0 Obtener \u00daltimo Blog"
N_LEADS    = "\U0001f4cb Obtener Leads"
N_CLASIF   = "\U0001f50d Clasificar Leads"
N_IF_LEADS = "\u2753 \u00bfHay leads hoy?"
N_BUILD    = "\u2709\ufe0f Preparar Email"
N_IF_BODY  = "\u2705 Email v\u00e1lido"
N_SEND     = "\U0001f4e7 Enviar Email"
N_UPDATE   = "\u270f\ufe0f Actualizar en Sheets"
N_NOLEADS  = "\U0001f4ed Sin Leads Hoy"

# ─── Code: Classify leads ─────────────────────────────────────────────────────
CLASSIFY_CODE = r"""
const today = new Date();
today.setHours(0, 0, 0, 0);

function daysSince(dateStr) {
  if (!dateStr || !String(dateStr).trim()) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return Math.floor((today - d) / (1000 * 60 * 60 * 24));
}

const results = [];

for (const item of $input.all()) {
  const lead = item.json;

  // Skip rows without email or not active
  const email = (lead.email || '').trim();
  if (!email || !email.includes('@')) continue;
  const estado = (lead.estado_email || '').toLowerCase().trim();
  if (estado !== 'activo') continue;

  const d1 = daysSince(lead.fecha_c1);
  const d2 = daysSince(lead.fecha_c2);
  const hasFecha3 = !!(lead.fecha_c3 || '').trim();

  // Already completed full sequence
  if (hasFecha3) continue;

  let email_tipo = 0;

  if (!lead.fecha_c1 || !(lead.fecha_c1 || '').trim()) {
    // Email 1: never contacted
    email_tipo = 1;
  } else if (d1 !== null && d1 >= 3 && (!lead.fecha_c2 || !(lead.fecha_c2 || '').trim())) {
    // Email 2: intro sent 3+ days ago, no follow-up yet
    email_tipo = 2;
  } else if (d1 !== null && d1 >= 9 && (lead.fecha_c2 || '').trim()) {
    // Email 3: 9+ days since first email, email 2 already sent
    email_tipo = 3;
  }

  if (email_tipo === 0) continue;

  results.push({ json: { ...lead, email_tipo } });
}

if (results.length === 0) {
  return [{ json: { _no_leads: true, email_tipo: 0 } }];
}

return results;
"""

# ─── Code: Build email subject + HTML body ────────────────────────────────────
BUILD_EMAIL_CODE = (
    # The node name N_BLOG embedded as a Python string; Python f-string interpolation
    # happens at script-write time, n8n sees the final Unicode string
    "const BLOG_NODE_NAME = '" + N_BLOG + "';\n\n"
    r"""
// Fetch latest blog URL + title from upstream WordPress node
let blogUrl   = 'https://cratingexpress.com/blog/';
let blogTitle = 'Wood Crating & Packaging Insights';
try {
  const blogData = $(BLOG_NODE_NAME).first().json;
  const arr = Array.isArray(blogData) ? blogData : [blogData];
  if (arr[0] && arr[0].link)                              blogUrl   = arr[0].link;
  if (arr[0] && arr[0].title && arr[0].title.rendered)   blogTitle = arr[0].title.rendered;
} catch(e) {}

const d      = $json;
const tipo   = d.email_tipo;
const nombre = d.nombre || 'there';
const today  = new Date().toISOString().slice(0, 10);

// ── Style fragments ──────────────────────────────────────────────────────────
const btnRed = (
  'display:inline-block;background:#c0392b;color:#fff;padding:12px 28px;' +
  'border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;'
);
const btnGreen = (
  'display:inline-block;background:#25D366;color:#fff;padding:12px 28px;' +
  'border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;margin-top:10px;'
);
const wrap   = 'font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;';
const header = 'background:#1a2035;color:#fff;padding:24px 28px;border-radius:8px 8px 0 0;';
const body   = 'padding:24px 28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;';
const footer = 'margin-top:24px;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#999;';

const waLink    = 'https://wa.me/17863948380?text=Hi%2C%20I%27m%20interested%20in%20crating%20solutions';
const quoteLink = 'https://cratingexpress.com/request-a-quote/';

let subject = '';
let emailBody = '';

// ════════════════════════════════════════════════════════════════════════════
if (tipo === 1) {
// ── EMAIL 1 — Introduction ──────────────────────────────────────────────────
subject = `Custom wood crating solutions for ${nombre}`;

emailBody = `<!DOCTYPE html><html><body style="${wrap}">
<div style="${header}">
  <h2 style="margin:0;font-size:20px;">📦 Crating Express — Custom Wood Packaging, Miami FL</h2>
</div>
<div style="${body}">
  <p>Hi ${nombre},</p>

  <p>I'm reaching out because we work with companies that ship heavy equipment,
  machinery, and industrial products — and we know firsthand how much a poorly
  packaged shipment can cost in damage claims and delays.</p>

  <p><strong>Crating Express</strong> builds custom ISPM-15 certified wood crates
  and export-ready packaging from our Miami facility. We specialize in oversized,
  fragile, and high-value freight that needs precision engineering, not a
  standard box.</p>

  <p>📖 You might find this article useful:<br>
  <a href="${blogUrl}" style="color:#c0392b;font-weight:bold;">${blogTitle}</a></p>

  <p>Happy to put together a free, no-obligation quote for your next shipment.
  Just reach out — it only takes a few minutes.</p>

  <div style="text-align:center;margin:28px 0;">
    <a href="${quoteLink}" style="${btnRed}">Request a Free Quote</a><br>
    <a href="${waLink}" style="${btnGreen}">💬 Chat on WhatsApp</a>
  </div>

  <p style="${footer}">
    <strong>Crating Express</strong> · Miami, FL<br>
    <a href="https://cratingexpress.com">cratingexpress.com</a><br><br>
    To unsubscribe, reply with "unsubscribe".
  </p>
</div>
</body></html>`;

// ════════════════════════════════════════════════════════════════════════════
} else if (tipo === 2) {
// ── EMAIL 2 — Credibility & Follow-up ──────────────────────────────────────
subject = `How we protect complex shipments — Crating Express`;

emailBody = `<!DOCTYPE html><html><body style="${wrap}">
<div style="${header}">
  <h2 style="margin:0;font-size:20px;">🔩 Built for Demanding Shipments</h2>
</div>
<div style="${body}">
  <p>Hi ${nombre},</p>

  <p>Following up on my previous note — wanted to share a bit more
  about the types of shipments we handle daily at Crating Express.</p>

  <p>We build crates for:</p>
  <ul style="padding-left:20px;line-height:1.8;">
    <li>🏭 Industrial machinery — CNC machines, presses, turbines</li>
    <li>🚢 Export shipments requiring ISPM-15 heat-treated wood</li>
    <li>⚙️ Fragile or high-value equipment that cannot risk damage</li>
    <li>📐 Oversized or irregular cargo that doesn't fit standard packaging</li>
  </ul>

  <p>Our Miami location is ideal for shipments heading to Latin America, Europe,
  or anywhere worldwide. Every crate is engineered to match your cargo's
  exact dimensions, weight, and handling requirements.</p>

  <p>If you'd like to see how we've protected shipments similar to yours,
  I'm happy to share specifics — just reach out.</p>

  <div style="text-align:center;margin:28px 0;">
    <a href="${quoteLink}" style="${btnRed}">Get a Free Quote</a><br>
    <a href="${waLink}" style="${btnGreen}">💬 Let's Talk on WhatsApp</a>
  </div>

  <p style="${footer}">
    <strong>Crating Express</strong> · Miami, FL<br>
    <a href="https://cratingexpress.com">cratingexpress.com</a><br><br>
    To unsubscribe, reply with "unsubscribe".
  </p>
</div>
</body></html>`;

// ════════════════════════════════════════════════════════════════════════════
} else if (tipo === 3) {
// ── EMAIL 3 — Final CTA ─────────────────────────────────────────────────────
subject = `Free crating quote for ${nombre} — last note`;

emailBody = `<!DOCTYPE html><html><body style="${wrap}">
<div style="${header}">
  <h2 style="margin:0;font-size:20px;">📋 One Last Note from Crating Express</h2>
</div>
<div style="${body}">
  <p>Hi ${nombre},</p>

  <p>This will be my last message — I don't want to crowd your inbox.</p>

  <p>If you ever need <strong>custom wood crating, ISPM-15 certified packaging,
  or export-ready solutions for heavy freight</strong>, Crating Express is here
  whenever you're ready.</p>

  <p>Getting a quote takes less than 2 minutes — and there's no commitment:</p>

  <div style="text-align:center;margin:28px 0;">
    <a href="${quoteLink}" style="${btnRed}">📋 Request My Free Quote</a><br>
    <a href="${waLink}" style="${btnGreen}">💬 Or Reach Us on WhatsApp</a>
  </div>

  <p>We serve Miami-Dade, Broward, and coordinate nationwide and internationally.</p>

  <p>Thanks for your time, ${nombre} — hope to work together someday.</p>

  <p style="${footer}">
    <strong>Crating Express</strong> · Miami, FL<br>
    <a href="https://cratingexpress.com">cratingexpress.com</a><br><br>
    To unsubscribe, reply with "unsubscribe".
  </p>
</div>
</body></html>`;

} // end if tipo

return [{
  json: {
    ...d,
    email_subject:        subject,
    email_body:           emailBody,
    update_correo_enviado: 'SI',
    update_fecha_c1:      tipo === 1 ? today : (d.fecha_c1 || ''),
    update_fecha_c2:      tipo === 2 ? today : (d.fecha_c2 || ''),
    update_fecha_c3:      tipo === 3 ? today : (d.fecha_c3 || ''),
    update_estado_email:  tipo === 3 ? 'completado' : 'activo',
  }
}];
"""
)

# ─── Workflow definition ──────────────────────────────────────────────────────
workflow = {
    "name": "CE Email - Outreach Prospectos",
    "nodes": [

        # ── Triggers ─────────────────────────────────────────────────────────
        {
            "id": "schedule-trigger",
            "name": N_SCHED,
            "type": "n8n-nodes-base.scheduleTrigger",
            "typeVersion": 1.2,
            "position": [0, 280],
            "parameters": {
                "rule": {"interval": [
                    {"field": "weeks", "weeksInterval": 1,
                     "triggerAtDay": [3], "triggerAtHour": 9, "triggerAtMinute": 0}
                ]}
            }
        },
        {
            "id": "manual-trigger",
            "name": N_MANUAL,
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [0, 440],
            "parameters": {}
        },

        # ── Get latest WP blog post (for Email 1 reference) ───────────────────
        {
            "id": "get-latest-blog",
            "name": N_BLOG,
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [240, 360],
            "continueOnFail": True,
            "parameters": {
                "url": "https://cratingexpress.com/wp-json/wp/v2/posts",
                "sendQuery": True,
                "queryParameters": {"parameters": [
                    {"name": "per_page", "value": "1"},
                    {"name": "status",   "value": "publish"},
                    {"name": "orderby",  "value": "date"},
                    {"name": "order",    "value": "desc"},
                    {"name": "_fields",  "value": "id,title,link"}
                ]},
                "options": {}
            }
        },

        # ── Get all leads from Google Sheets ──────────────────────────────────
        {
            "id": "get-leads",
            "name": N_LEADS,
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "position": [480, 360],
            "credentials": {
                "googleSheetsOAuth2Api": {
                    "id": SHEETS_CRED_ID,
                    "name": "Google Sheets account"
                }
            },
            "parameters": {
                "operation": "getAll",
                "documentId": {
                    "__rl": True,
                    "value": SPREADSHEET_ID,
                    "mode": "id"
                },
                "sheetName": {
                    "__rl": True,
                    "value": "gid=0",
                    "mode": "id"
                },
                "filtersUI": {},
                "options": {}
            }
        },

        # ── Classify: filter active leads + determine email type ──────────────
        {
            "id": "clasificar-leads",
            "name": N_CLASIF,
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [720, 360],
            "parameters": {"jsCode": CLASSIFY_CODE}
        },

        # ── IF: any leads need email today? ────────────────────────────────────
        {
            "id": "if-hay-leads",
            "name": N_IF_LEADS,
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [960, 360],
            "parameters": {
                "conditions": {
                    "options": {
                        "caseSensitive": True,
                        "leftValue": "",
                        "typeValidation": "strict"
                    },
                    "conditions": [{
                        "id": "cond1",
                        "leftValue": "={{ $json._no_leads }}",
                        "rightValue": True,
                        "operator": {
                            "type": "boolean",
                            "operation": "notEquals"
                        }
                    }],
                    "combinator": "and"
                },
                "options": {}
            }
        },

        # ── Build email subject + HTML body ────────────────────────────────────
        {
            "id": "build-email",
            "name": N_BUILD,
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1200, 260],
            "parameters": {"jsCode": BUILD_EMAIL_CODE}
        },

        # ── IF: skip if no email body (safety) ────────────────────────────────
        {
            "id": "if-tiene-body",
            "name": N_IF_BODY,
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [1440, 260],
            "parameters": {
                "conditions": {
                    "options": {
                        "caseSensitive": True,
                        "leftValue": "",
                        "typeValidation": "strict"
                    },
                    "conditions": [{
                        "id": "cond2",
                        "leftValue": "={{ $json.email_subject }}",
                        "rightValue": "",
                        "operator": {
                            "type": "string",
                            "operation": "notEquals"
                        }
                    }],
                    "combinator": "and"
                },
                "options": {}
            }
        },

        # ── Send Gmail ────────────────────────────────────────────────────────
        {
            "id": "send-email",
            "name": N_SEND,
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2,
            "position": [1680, 180],
            "continueOnFail": True,
            "credentials": {
                "gmailOAuth2": {
                    "id": GMAIL_CRED_ID,
                    "name": "cuenta de Gmail"
                }
            },
            "parameters": {
                "sendTo":    "={{ $json.email }}",
                "subject":   "={{ $json.email_subject }}",
                "emailType": "html",
                "message":   "={{ $json.email_body }}",
                "options": {}
            }
        },

        # ── Update Google Sheets row ──────────────────────────────────────────
        {
            "id": "update-lead",
            "name": N_UPDATE,
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "position": [1920, 180],
            "continueOnFail": True,
            "credentials": {
                "googleSheetsOAuth2Api": {
                    "id": SHEETS_CRED_ID,
                    "name": "Google Sheets account"
                }
            },
            "parameters": {
                "operation": "update",
                "documentId": {
                    "__rl": True,
                    "value": SPREADSHEET_ID,
                    "mode": "id"
                },
                "sheetName": {
                    "__rl": True,
                    "value": "gid=0",
                    "mode": "id"
                },
                "columns": {
                    "mappingMode": "defineBelow",
                    "value": {
                        "nombre":          "={{ $json.nombre }}",
                        "correo_enviado":  "={{ $json.update_correo_enviado }}",
                        "fecha_c1":        "={{ $json.update_fecha_c1 }}",
                        "fecha_c2":        "={{ $json.update_fecha_c2 }}",
                        "fecha_c3":        "={{ $json.update_fecha_c3 }}",
                        "estado_email":    "={{ $json.update_estado_email }}"
                    },
                    "matchingColumns": ["nombre"],
                    "schema": [
                        {"id": "nombre",        "displayName": "nombre",        "required": False, "defaultMatch": True,  "display": True, "type": "string", "canBeUsedToMatch": True},
                        {"id": "correo_enviado", "displayName": "correo_enviado","required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": False},
                        {"id": "fecha_c1",       "displayName": "fecha_c1",      "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": False},
                        {"id": "fecha_c2",       "displayName": "fecha_c2",      "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": False},
                        {"id": "fecha_c3",       "displayName": "fecha_c3",      "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": False},
                        {"id": "estado_email",   "displayName": "estado_email",  "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": False},
                    ]
                },
                "options": {}
            }
        },

        # ── No leads today — admin notification ───────────────────────────────
        {
            "id": "no-leads-notif",
            "name": N_NOLEADS,
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2,
            "position": [1200, 500],
            "credentials": {
                "gmailOAuth2": {
                    "id": GMAIL_CRED_ID,
                    "name": "cuenta de Gmail"
                }
            },
            "parameters": {
                "sendTo":    ADMIN_EMAIL,
                "subject":   "[Outreach] Sin leads pendientes hoy",
                "emailType": "html",
                "message": (
                    "=<p>El flujo <strong>CE Email - Outreach Prospectos</strong> "
                    "corrió el <strong>{{ $now.toFormat('yyyy-MM-dd') }}</strong> "
                    "pero no encontró leads con emails pendientes.</p>"
                    "<p>Condiciones: <code>estado_email = activo</code> y fechas dentro "
                    "de los rangos del drip (días 1, 4, 10).</p>"
                    "<p>Revisa el sheet: "
                    f"<a href='https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}'>"
                    "Abrir Google Sheets</a></p>"
                ),
                "options": {}
            }
        },

    ],  # end nodes

    # ── Connections ───────────────────────────────────────────────────────────
    "connections": {
        N_SCHED:    {"main": [[{"node": N_BLOG,     "type": "main", "index": 0}]]},
        N_MANUAL:   {"main": [[{"node": N_BLOG,     "type": "main", "index": 0}]]},
        N_BLOG:     {"main": [[{"node": N_LEADS,    "type": "main", "index": 0}]]},
        N_LEADS:    {"main": [[{"node": N_CLASIF,   "type": "main", "index": 0}]]},
        N_CLASIF:   {"main": [[{"node": N_IF_LEADS, "type": "main", "index": 0}]]},
        N_IF_LEADS: {
            "main": [
                [{"node": N_BUILD,   "type": "main", "index": 0}],  # true  → leads exist
                [{"node": N_NOLEADS, "type": "main", "index": 0}]   # false → no leads
            ]
        },
        N_BUILD:    {"main": [[{"node": N_IF_BODY, "type": "main", "index": 0}]]},
        N_IF_BODY:  {
            "main": [
                [{"node": N_SEND, "type": "main", "index": 0}],  # true  → send email
                []                                                 # false → stop
            ]
        },
        N_SEND:     {"main": [[{"node": N_UPDATE, "type": "main", "index": 0}]]},
    },

    "settings": {
        "executionOrder": "v1",
        "saveManualExecutions": True,
        "callerPolicy": "workflowsFromSameOwner",
        "errorWorkflow": ""
    },
    "staticData": None,
}

# ─── Push to n8n ──────────────────────────────────────────────────────────────
resp = requests.post(
    f"{N8N_BASE}/workflows",
    headers=HEADERS,
    json=workflow
)
result = resp.json()

if "id" in result:
    wf_id = result["id"]
    print(f"\nSUCCESS! Workflow creado: {wf_id}")
    print(f"Nombre: {result.get('name')}")
    print(f"Nodes: {len(result.get('nodes', []))}")
    print(f"URL: https://n8n.mdarthurdigital.com/workflow/{wf_id}")
else:
    print("ERROR:", json.dumps(result, indent=2)[:800])
