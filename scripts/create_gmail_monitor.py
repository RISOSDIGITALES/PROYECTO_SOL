import json, requests, time

TOKEN          = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE           = "https://n8n.mdarthurdigital.com/api/v1"
H              = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
GMAIL_CRED_ID  = "TESHSjzjMCpCxBBk"
SHEETS_CRED_ID = "QE2RlAxaMLoYefTD"
SPREADSHEET_ID = "1WRqv3s1vsTRSpfz6Bo27u3ff9kHDki_nDDMFt9yVj-8"

# ── Match replies against known leads ─────────────────────────────────────────
MATCH_CODE = r"""
const emails  = $('📬 Leer Inbox Gmail').all();
const leads   = $('📋 Obtener Leads').all();

// Build lookup: email address → lead row_number
const leadMap = {};
for (const l of leads) {
  const d = l.json;
  if (d.email) leadMap[d.email.toLowerCase().trim()] = d;
}

const today   = new Date().toISOString().split('T')[0];
const replies = [];

for (const msg of emails) {
  const m    = msg.json;
  const from = (m.from || '').toLowerCase();

  // Extract email address from "Name <email@example.com>" format
  const match = from.match(/<(.+?)>/) || from.match(/([^\s]+@[^\s]+)/);
  const senderEmail = match ? match[1].trim() : from.trim();

  const lead = leadMap[senderEmail];
  if (!lead) continue;  // not a known lead, skip

  replies.push({
    json: {
      row_number:              lead.row_number,
      email:                   senderEmail,
      nombre:                  lead.nombre || '',
      estado_email_nuevo:      'respondió',
      fecha_ultima_interaccion: today,
      asunto_respuesta:        m.subject || '',
      fecha_respuesta:         today
    }
  });
}

if (replies.length === 0) return [{ json: { noReplies: true } }];
return replies;
"""

# ── Notify about replies ──────────────────────────────────────────────────────
NOTIFY_CODE = r"""
const items = $input.all();
if (items[0]?.json?.noReplies) return [{ json: { skipped: true } }];

const NAVY   = '#305468';
const ORANGE = '#ff6900';
const today  = new Date().toLocaleDateString('es-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

const rows = items.map(i => `
  <tr>
    <td style="padding:8px;border-bottom:1px solid #eee;">${i.json.nombre || '—'}</td>
    <td style="padding:8px;border-bottom:1px solid #eee;">${i.json.email}</td>
    <td style="padding:8px;border-bottom:1px solid #eee;">${i.json.asunto_respuesta || '—'}</td>
  </tr>`).join('');

const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#333;">
  <div style="background:${NAVY};color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
    <div style="font-size:11px;letter-spacing:1px;opacity:.7;text-transform:uppercase;">Gmail Monitor</div>
    <h2 style="margin:4px 0 0;font-size:20px;">💬 ${items.length} Lead(s) respondieron</h2>
    <p style="margin:6px 0 0;opacity:.8;font-size:13px;">${today}</p>
  </div>
  <div style="padding:20px 24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
    <p>Hola Sol, estos leads respondieron uno de nuestros emails:</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;text-align:left;">Nombre</th>
          <th style="padding:8px;text-align:left;">Email</th>
          <th style="padding:8px;text-align:left;">Asunto</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;font-size:13px;color:#666;">Su estado fue actualizado a <strong>"respondió"</strong> en el CRM y no recibirán más emails automáticos hasta que los contactes manualmente.</p>
    <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
    <p style="font-size:12px;color:#999;">CE Gmail Monitor — Generado automáticamente por n8n</p>
  </div>
</div>`;

return [{ json: { subject: `💬 ${items.length} lead(s) respondieron — ${today}`, body_html: html } }];
"""

wf = {
    "name": "📬 CE Gmail Monitor — Detectar Respuestas de Leads",
    "nodes": [
        {
            "id": "gmon-sched",
            "name": "⏰ Revisar cada hora",
            "type": "n8n-nodes-base.scheduleTrigger",
            "typeVersion": 1.2,
            "position": [0, 300],
            "parameters": {
                "rule": {"interval": [{"field": "hours", "hoursInterval": 1}]}
            }
        },
        {
            "id": "gmon-manual",
            "name": "▶️ Ejecutar Manualmente",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [0, 480],
            "parameters": {}
        },
        # Read unread inbox emails from last 2 hours
        {
            "id": "gmon-gmail",
            "name": "📬 Leer Inbox Gmail",
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2.1,
            "position": [280, 300],
            "credentials": {
                "gmailOAuth2": {"id": GMAIL_CRED_ID, "name": "Gmail account"}
            },
            "parameters": {
                "operation": "getAll",
                "filters": {
                    "q": "in:inbox is:unread newer_than:2h"
                },
                "limit": 50,
                "options": {}
            }
        },
        # Get all leads from Sheets
        {
            "id": "gmon-leads",
            "name": "📋 Obtener Leads",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "position": [280, 480],
            "credentials": {
                "googleSheetsOAuth2Api": {"id": SHEETS_CRED_ID, "name": "Google Sheets account"}
            },
            "parameters": {
                "operation": "read",
                "documentId": {"__rl": True, "value": SPREADSHEET_ID, "mode": "id"},
                "sheetName": {"__rl": True, "value": "gid=0", "mode": "id"},
                "options": {}
            }
        },
        # Match replies to leads
        {
            "id": "gmon-match",
            "name": "🔍 Cruzar con Leads",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [560, 300],
            "parameters": {"jsCode": MATCH_CODE}
        },
        # IF: any matches?
        {
            "id": "gmon-if",
            "name": "❓ ¿Hay respuestas?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [800, 300],
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                    "conditions": [
                        {
                            "id": "cond-replies",
                            "leftValue": "={{ $json.noReplies }}",
                            "rightValue": True,
                            "operator": {"type": "boolean", "operation": "false"}
                        }
                    ],
                    "combinator": "and"
                }
            }
        },
        # Update Sheet: estado_email = respondió, fecha_ultima_interaccion = today
        {
            "id": "gmon-update",
            "name": "✅ Actualizar Estado en Sheets",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "position": [1040, 200],
            "credentials": {
                "googleSheetsOAuth2Api": {"id": SHEETS_CRED_ID, "name": "Google Sheets account"}
            },
            "parameters": {
                "operation": "update",
                "documentId": {"__rl": True, "value": SPREADSHEET_ID, "mode": "id"},
                "sheetName": {"__rl": True, "value": "gid=0", "mode": "id"},
                "columns": {
                    "mappingMode": "defineBelow",
                    "value": {
                        "row_number":               "={{ $json.row_number }}",
                        "estado_email":             "={{ $json.estado_email_nuevo }}",
                        "fecha_ultima_interaccion": "={{ $json.fecha_ultima_interaccion }}"
                    },
                    "matchingColumns": ["row_number"],
                    "schema": [
                        {"id": "row_number",               "displayName": "row_number",               "canBeUsedToMatch": True,  "defaultMatch": True},
                        {"id": "estado_email",             "displayName": "estado_email",             "canBeUsedToMatch": False, "defaultMatch": False},
                        {"id": "fecha_ultima_interaccion", "displayName": "fecha_ultima_interaccion", "canBeUsedToMatch": False, "defaultMatch": False}
                    ]
                },
                "options": {}
            }
        },
        # Notify Sol
        {
            "id": "gmon-notify-code",
            "name": "📋 Preparar Notificación",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1040, 380],
            "parameters": {"jsCode": NOTIFY_CODE}
        },
        {
            "id": "gmon-email",
            "name": "📧 Notificar a Sol",
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2.1,
            "position": [1280, 380],
            "credentials": {
                "gmailOAuth2": {"id": GMAIL_CRED_ID, "name": "Gmail account"}
            },
            "parameters": {
                "sendTo": "solange@cratingexpress.com",
                "subject": "={{ $json.subject }}",
                "message": "={{ $json.body_html }}",
                "options": {"appendAttribution": False, "senderName": "CE Gmail Monitor"}
            }
        }
    ],
    "connections": {
        "⏰ Revisar cada hora":    {"main": [[{"node": "📬 Leer Inbox Gmail", "type": "main", "index": 0},
                                              {"node": "📋 Obtener Leads",    "type": "main", "index": 0}]]},
        "▶️ Ejecutar Manualmente": {"main": [[{"node": "📬 Leer Inbox Gmail", "type": "main", "index": 0},
                                              {"node": "📋 Obtener Leads",    "type": "main", "index": 0}]]},
        "📬 Leer Inbox Gmail":     {"main": [[{"node": "🔍 Cruzar con Leads", "type": "main", "index": 0}]]},
        "📋 Obtener Leads":        {"main": [[{"node": "🔍 Cruzar con Leads", "type": "main", "index": 0}]]},
        "🔍 Cruzar con Leads":     {"main": [[{"node": "❓ ¿Hay respuestas?", "type": "main", "index": 0}]]},
        "❓ ¿Hay respuestas?":      {"main": [
            [{"node": "✅ Actualizar Estado en Sheets", "type": "main", "index": 0},
             {"node": "📋 Preparar Notificación",       "type": "main", "index": 0}],
            []
        ]},
        "📋 Preparar Notificación": {"main": [[{"node": "📧 Notificar a Sol", "type": "main", "index": 0}]]}
    },
    "settings": {"executionOrder": "v1"},
    "staticData": None
}

for attempt in range(4):
    r = requests.post(f"{BASE}/workflows", headers=H, json=wf)
    if r.status_code in (200, 201):
        data = r.json()
        wf_id = data.get("id", "")
        print(f"✅ Workflow creado: {data.get('name')} (ID: {wf_id})")
        print(f"\n⚠️  PRUEBA MANUAL REQUERIDA:")
        print(f"   1. Abre n8n → busca '📬 CE Gmail Monitor'")
        print(f"   2. Haz clic en '▶️ Ejecutar Manualmente'")
        print(f"   3. Si da error de permisos → la credencial solo tiene permisos de envío")
        print(f"   4. Si funciona → actívalo para que corra cada hora automáticamente")
        break
    elif r.status_code == 503:
        wait = 2 ** (attempt + 1)
        print(f"503 — reintentando en {wait}s...")
        time.sleep(wait)
    else:
        print(f"❌ Error {r.status_code}: {r.text[:400]}")
        break
