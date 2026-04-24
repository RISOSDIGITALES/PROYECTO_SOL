import json, requests, time

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}

SHEETS_CRED_ID = "QE2RlAxaMLoYefTD"
GMAIL_CRED_ID  = "TESHSjzjMCpCxBBk"
SPREADSHEET_ID = "1WRqv3s1vsTRSpfz6Bo27u3ff9kHDki_nDDMFt9yVj-8"
GROQ_KEY       = "gsk_xh4sNFnhiBX0IIKYo5cLWGdyb3FYnFEJIPiSPuIBTK8MgCmVb"

# ── Extract caller info from Vapi transcript using Groq ──────────────────────
EXTRACT_CODE = r"""
const body     = $input.first().json.body || $input.first().json;
const callData = body.message || body;

// Vapi sends different event types — only process call-ended
const eventType = callData.type || callData.event || '';
if (!eventType.includes('end') && !eventType.includes('End')) {
  return [{ json: { skip: true, reason: 'Not a call-ended event', eventType } }];
}

const call        = callData.call || callData;
const transcript  = callData.artifact?.transcript || callData.transcript || '';
const callerPhone = call.customer?.number || call.phoneNumber || 'unknown';
const duration    = Math.round((call.endedAt && call.startedAt
  ? (new Date(call.endedAt) - new Date(call.startedAt)) / 1000
  : callData.durationSeconds || 0));

const endedReason = call.endedReason || callData.endedReason || 'unknown';

return [{ json: {
  skip:         false,
  transcript,
  callerPhone,
  duration,
  endedReason,
  rawEvent:     eventType,
  fechaLlamada: new Date().toISOString().split('T')[0]
}}];
"""

# ── Groq: extract structured lead data from transcript ──────────────────────
GROQ_EXTRACT_CODE = r"""
const data = $input.first().json;
if (data.skip) return [{ json: data }];

const transcript = data.transcript || '';
if (!transcript || transcript.length < 20) {
  return [{ json: { ...data, nombre: '', empresa: '', interes: 'sin_transcript', notas: '' } }];
}

const prompt = `Extract lead information from this phone call transcript. Return ONLY valid JSON with these fields:
- nombre: caller's name if mentioned, else ""
- empresa: company name if mentioned, else ""
- interes: one of "cotizacion", "informacion", "urgente", "no_interesado", "otro"
- notas: 1-2 sentence summary of what the caller needed in Spanish

Transcript:
${transcript.slice(0, 2000)}

Return only JSON, no explanation.`;

const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${GROQ_KEY}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.1
  })
});

let extracted = { nombre: '', empresa: '', interes: 'otro', notas: '' };
try {
  const groqRes = await res.json();
  const text = groqRes.choices?.[0]?.message?.content || '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
} catch(e) {}

return [{ json: { ...data, ...extracted } }];
""".replace("${GROQ_KEY}", GROQ_KEY)

# ── Save to Google Sheets ────────────────────────────────────────────────────
# Adds a new row to a "Llamadas" sheet tab

# ── Notify via Gmail ─────────────────────────────────────────────────────────
NOTIFY_CODE = r"""
const d = $input.first().json;
if (d.skip) return [{ json: { skipped: true } }];

const NAVY   = '#305468';
const ORANGE = '#ff6900';

const interesBadge = {
  cotizacion:     '🔥 Cotización',
  informacion:    'ℹ️ Información',
  urgente:        '🚨 URGENTE',
  no_interesado:  '❌ No interesado',
  otro:           '📌 Otro'
}[d.interes] || d.interes;

const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:${NAVY};color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
    <div style="font-size:11px;letter-spacing:1px;opacity:.7;text-transform:uppercase;">Vapi Voice Agent</div>
    <h2 style="margin:4px 0 0;font-size:20px;">📞 Nueva Llamada — Alex</h2>
  </div>
  <div style="padding:20px 24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#777;width:130px;">Teléfono</td><td><strong>${d.callerPhone}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#777;">Nombre</td><td>${d.nombre || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#777;">Empresa</td><td>${d.empresa || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#777;">Interés</td><td><span style="background:${ORANGE};color:#fff;padding:2px 10px;border-radius:12px;font-size:12px;">${interesBadge}</span></td></tr>
      <tr><td style="padding:6px 0;color:#777;">Duración</td><td>${d.duration}s</td></tr>
      <tr><td style="padding:6px 0;color:#777;">Fecha</td><td>${d.fechaLlamada}</td></tr>
    </table>
    ${d.notas ? `<div style="margin-top:16px;padding:12px;background:#f9f9f9;border-radius:6px;font-size:13px;color:#444;"><strong>Resumen:</strong><br>${d.notas}</div>` : ''}
    ${d.transcript ? `<details style="margin-top:12px;"><summary style="cursor:pointer;color:${NAVY};font-size:13px;">Ver transcripción completa</summary><pre style="margin-top:8px;font-size:12px;white-space:pre-wrap;color:#555;">${d.transcript.slice(0,3000)}</pre></details>` : ''}
    <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
    <p style="font-size:12px;color:#999;">CE Voice Agent — Generado automáticamente por Vapi + n8n</p>
  </div>
</div>`;

return [{ json: { subject: `📞 Llamada CE: ${interesBadge} — ${d.callerPhone} (${d.fechaLlamada})`, body_html: html, ...d } }];
"""

# ── Build workflow ────────────────────────────────────────────────────────────
wf = {
    "name": "📞 CE Voice Agent — Vapi Webhook",
    "nodes": [
        {
            "id": "vapi-trigger",
            "name": "🔔 Webhook Vapi",
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 2,
            "position": [240, 300],
            "webhookId": "vapi-ce-calls",
            "parameters": {
                "path": "vapi-ce-calls",
                "responseMode": "lastNode",
                "options": {}
            }
        },
        {
            "id": "vapi-parse",
            "name": "🔍 Parsear Evento Vapi",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [480, 300],
            "parameters": {"jsCode": EXTRACT_CODE}
        },
        {
            "id": "vapi-ifskip",
            "name": "❓ ¿Es llamada terminada?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [720, 300],
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                    "conditions": [
                        {
                            "id": "cond-skip",
                            "leftValue": "={{ $json.skip }}",
                            "rightValue": False,
                            "operator": {"type": "boolean", "operation": "false"}
                        }
                    ],
                    "combinator": "and"
                }
            }
        },
        {
            "id": "vapi-groq",
            "name": "🤖 Groq: Extraer Datos Lead",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [960, 200],
            "parameters": {"jsCode": GROQ_EXTRACT_CODE}
        },
        {
            "id": "vapi-sheets",
            "name": "📊 Guardar Llamada en Sheets",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "position": [1200, 200],
            "credentials": {
                "googleSheetsOAuth2Api": {"id": SHEETS_CRED_ID, "name": "Google Sheets account"}
            },
            "parameters": {
                "operation": "append",
                "documentId": {"__rl": True, "value": SPREADSHEET_ID, "mode": "id"},
                "sheetName": {"__rl": True, "value": "Llamadas", "mode": "name"},
                "columns": {
                    "mappingMode": "defineBelow",
                    "value": {
                        "fecha":         "={{ $json.fechaLlamada }}",
                        "telefono":      "={{ $json.callerPhone }}",
                        "nombre":        "={{ $json.nombre }}",
                        "empresa":       "={{ $json.empresa }}",
                        "interes":       "={{ $json.interes }}",
                        "duracion_seg":  "={{ $json.duration }}",
                        "notas":         "={{ $json.notas }}",
                        "transcripcion": "={{ $json.transcript }}"
                    },
                    "matchingColumns": [],
                    "schema": [
                        {"id": "fecha",         "displayName": "fecha",         "canBeUsedToMatch": False},
                        {"id": "telefono",      "displayName": "telefono",      "canBeUsedToMatch": False},
                        {"id": "nombre",        "displayName": "nombre",        "canBeUsedToMatch": False},
                        {"id": "empresa",       "displayName": "empresa",       "canBeUsedToMatch": False},
                        {"id": "interes",       "displayName": "interes",       "canBeUsedToMatch": False},
                        {"id": "duracion_seg",  "displayName": "duracion_seg",  "canBeUsedToMatch": False},
                        {"id": "notas",         "displayName": "notas",         "canBeUsedToMatch": False},
                        {"id": "transcripcion", "displayName": "transcripcion", "canBeUsedToMatch": False}
                    ]
                },
                "options": {}
            }
        },
        {
            "id": "vapi-notify",
            "name": "📋 Preparar Notificación",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1440, 200],
            "parameters": {"jsCode": NOTIFY_CODE}
        },
        {
            "id": "vapi-email",
            "name": "📧 Notificar a Sol",
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2.1,
            "position": [1680, 200],
            "credentials": {
                "gmailOAuth2": {"id": GMAIL_CRED_ID, "name": "Gmail account"}
            },
            "parameters": {
                "sendTo": "solange@cratingexpress.com",
                "subject": "={{ $json.subject }}",
                "message": "={{ $json.body_html }}",
                "options": {
                    "appendAttribution": False,
                    "senderName": "CE Voice Agent"
                }
            }
        },
        {
            "id": "vapi-respond",
            "name": "✅ Responder OK a Vapi",
            "type": "n8n-nodes-base.respondToWebhook",
            "typeVersion": 1,
            "position": [1920, 200],
            "parameters": {
                "respondWith": "json",
                "responseBody": "{\"status\":\"ok\"}"
            }
        }
    ],
    "connections": {
        "🔔 Webhook Vapi": {
            "main": [[{"node": "🔍 Parsear Evento Vapi", "type": "main", "index": 0}]]
        },
        "🔍 Parsear Evento Vapi": {
            "main": [[{"node": "❓ ¿Es llamada terminada?", "type": "main", "index": 0}]]
        },
        "❓ ¿Es llamada terminada?": {
            "main": [
                [{"node": "🤖 Groq: Extraer Datos Lead", "type": "main", "index": 0}],
                []
            ]
        },
        "🤖 Groq: Extraer Datos Lead": {
            "main": [[{"node": "📊 Guardar Llamada en Sheets", "type": "main", "index": 0}]]
        },
        "📊 Guardar Llamada en Sheets": {
            "main": [[{"node": "📋 Preparar Notificación", "type": "main", "index": 0}]]
        },
        "📋 Preparar Notificación": {
            "main": [[{"node": "📧 Notificar a Sol", "type": "main", "index": 0}]]
        },
        "📧 Notificar a Sol": {
            "main": [[{"node": "✅ Responder OK a Vapi", "type": "main", "index": 0}]]
        }
    },
    "settings": {"executionOrder": "v1"},
    "staticData": None
}

# ── POST (create new workflow) ────────────────────────────────────────────────
for attempt in range(4):
    r = requests.post(f"{BASE}/workflows", headers=H, json=wf)
    if r.status_code in (200, 201):
        data = r.json()
        wf_id = data.get("id", "")
        print(f"✅ Workflow creado: {data.get('name')} (ID: {wf_id})")

        # Activate it
        time.sleep(1)
        r2 = requests.post(f"{BASE}/workflows/{wf_id}/activate", headers=H)
        if r2.status_code == 200:
            print("✅ Workflow activado")
            print(f"\n🔗 URL del webhook para Vapi:")
            print(f"   https://n8n.mdarthurdigital.com/webhook/vapi-ce-calls")
        else:
            print(f"⚠️ No se pudo activar: {r2.status_code} — actívalo manualmente en n8n")
        break
    elif r.status_code == 503:
        wait = 2 ** (attempt + 1)
        print(f"503 — reintentando en {wait}s...")
        time.sleep(wait)
    else:
        print(f"❌ Error {r.status_code}: {r.text[:500]}")
        break
