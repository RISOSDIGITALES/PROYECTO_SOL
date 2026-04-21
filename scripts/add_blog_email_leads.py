import json, requests, time

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "38fO1D5uJpVUDMqm"

SHEETS_CRED_ID  = "QE2RlAxaMLoYefTD"
GMAIL_CRED_ID   = "TESHSjzjMCpCxBBk"
SPREADSHEET_ID  = "1WRqv3s1vsTRSpfz6Bo27u3ff9kHDki_nDDMFt9yVj-8"

# ── Node names ────────────────────────────────────────────────────────────────
N_PARSEAR   = "🔍 Parsear Contenido"
N_GETLEADS  = "📋 Obtener Leads para Blog"
N_FILTRAR   = "🔍 Filtrar Leads Blog"
N_IF        = "❓ ¿Hay leads para blog?"
N_SEND      = "📧 Enviar Blog a Leads"
N_UPDATE    = "✅ Actualizar fecha_blog"

# ── Fetch current workflow ────────────────────────────────────────────────────
r = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H)
r.raise_for_status()
wf = r.json()

# Remove metadata keys n8n rejects on PUT
ALLOWED = {"name", "nodes", "connections", "settings", "staticData"}
wf = {k: v for k, v in wf.items() if k in ALLOWED}

nodes = wf["nodes"]
conns = wf["connections"]

# ── New nodes ─────────────────────────────────────────────────────────────────
new_nodes = [
    # 1. Obtener Leads para Blog (Google Sheets getAll)
    {
        "id": "blog-getleads",
        "name": N_GETLEADS,
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [1680, 800],
        "credentials": {
            "googleSheetsOAuth2Api": {"id": SHEETS_CRED_ID, "name": "Google Sheets account"}
        },
        "parameters": {
            "operation": "read",
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
            "options": {}
        }
    },

    # 2. Filtrar Leads Blog (Code)
    {
        "id": "blog-filtrar",
        "name": N_FILTRAR,
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1920, 800],
        "parameters": {
            "jsCode": r"""
const leads  = $input.all();
const blog   = $('🔍 Parsear Contenido').first().json;
const today  = new Date();
const result = [];

for (const item of leads) {
  const d = item.json;
  if (!d.email) continue;
  if (!d.fecha_c1) continue;  // only leads already in funnel
  if ((d.estado_email || '').toLowerCase() === 'bloqueado') continue;

  // Check cadence: last ANY email must be > 14 days ago
  if (d.fecha_ultima_interaccion) {
    const dias = (today - new Date(d.fecha_ultima_interaccion)) / 86400000;
    if (dias < 14) continue;
  }

  result.push({
    json: {
      row_number:  d.row_number,
      email:       d.email,
      nombre:      d.nombre || d.empresa || 'there',
      empresa:     d.empresa || '',
      // Blog data
      blog_titulo:  blog.titulo   || '',
      blog_url:     blog.url      || '',
      blog_extracto: blog.extracto || '',
      email_subject: blog.email_subject || ('New on our blog: ' + blog.titulo).slice(0,60),
      email_body:    blog.email_body   || '',
    }
  });
}
return result;
"""
        }
    },

    # 3. IF: ¿Hay leads?
    {
        "id": "blog-ifleads",
        "name": N_IF,
        "type": "n8n-nodes-base.if",
        "typeVersion": 2,
        "position": [2160, 800],
        "parameters": {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                "conditions": [
                    {
                        "id": "cond-blog-leads",
                        "leftValue": "={{ $input.all().length }}",
                        "rightValue": 0,
                        "operator": {"type": "number", "operation": "gt"}
                    }
                ],
                "combinator": "and"
            }
        }
    },

    # 4. Enviar Blog a Leads (Gmail)
    {
        "id": "blog-send",
        "name": N_SEND,
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.1,
        "position": [2400, 800],
        "credentials": {
            "gmailOAuth2": {"id": GMAIL_CRED_ID, "name": "Gmail account"}
        },
        "parameters": {
            "sendTo": "={{ $json.email }}",
            "subject": "={{ $json.email_subject }}",
            "message": r"""={{ (() => {
  const NAVY   = '#305468';
  const ORANGE = '#ff6900';
  const nombre  = $json.nombre || 'there';
  const titulo  = $json.blog_titulo || '';
  const url     = $json.blog_url   || '#';
  const extracto = ($json.blog_extracto || '').slice(0, 220);

  const wrap = 'font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;';
  const hdr  = `background:${NAVY};color:#fff;padding:24px 28px;border-radius:8px 8px 0 0;`;
  const bdy  = 'padding:24px 28px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;';
  const btn  = `display:inline-block;background:${ORANGE};color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:20px;`;

  return `<div style="${wrap}">
    <div style="${hdr}">
      <div style="font-size:11px;letter-spacing:1px;opacity:.7;text-transform:uppercase;">Blog Update</div>
      <h1 style="margin:4px 0 0;font-size:22px;">Crating Express</h1>
    </div>
    <div style="${bdy}">
      <p>Hi ${nombre},</p>
      <p>We just published a new article we think you'll find useful:</p>
      <h2 style="color:${NAVY};margin:20px 0 8px;">${titulo}</h2>
      <p style="color:#555;line-height:1.6;">${extracto}${extracto ? '...' : ''}</p>
      <a href="${url}?utm_source=email&utm_medium=newsletter&utm_campaign=blog-leads" style="${btn}">Read the Full Article →</a>
      <hr style="margin:28px 0;border:none;border-top:1px solid #eee;">
      <p style="font-size:13px;color:#888;">
        I'm Marc, Manager at Crating Express.<br>
        Questions? Reply to this email or reach us on <a href="https://wa.me/17865586007" style="color:${ORANGE};">WhatsApp</a>.
      </p>
    </div>
  </div>`;
})() }}""",
            "options": {
                "appendAttribution": False,
                "senderName": "Marc @ Crating Express"
            }
        }
    },

    # 5. Actualizar fecha_blog en Leads (Google Sheets update)
    {
        "id": "blog-update",
        "name": N_UPDATE,
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [2640, 800],
        "credentials": {
            "googleSheetsOAuth2Api": {"id": SHEETS_CRED_ID, "name": "Google Sheets account"}
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
                    "row_number": "={{ $json.row_number }}",
                    "fecha_ultima_interaccion": "={{ new Date().toISOString().split('T')[0] }}"
                },
                "matchingColumns": ["row_number"],
                "schema": [
                    {"id": "row_number",                "displayName": "row_number",                "canBeUsedToMatch": True},
                    {"id": "fecha_ultima_interaccion",  "displayName": "fecha_ultima_interaccion",  "canBeUsedToMatch": False}
                ]
            },
            "options": {}
        }
    }
]

# ── Add nodes ─────────────────────────────────────────────────────────────────
nodes.extend(new_nodes)

# ── Add connections ───────────────────────────────────────────────────────────
# Parsear Contenido → Obtener Leads para Blog (new parallel branch)
if N_PARSEAR not in conns:
    conns[N_PARSEAR] = {"main": [[]]}

existing_parsear_main = conns[N_PARSEAR].get("main", [[]])
# Extend main array if needed (we need index 0 already has connections; add to it)
while len(existing_parsear_main) < 1:
    existing_parsear_main.append([])
existing_parsear_main[0].append({"node": N_GETLEADS, "type": "main", "index": 0})
conns[N_PARSEAR]["main"] = existing_parsear_main

# Obtener Leads → Filtrar
conns[N_GETLEADS] = {"main": [[{"node": N_FILTRAR, "type": "main", "index": 0}]]}

# Filtrar → IF
conns[N_FILTRAR] = {"main": [[{"node": N_IF, "type": "main", "index": 0}]]}

# IF true (0) → Enviar; IF false (1) → nothing
conns[N_IF] = {"main": [[{"node": N_SEND, "type": "main", "index": 0}], []]}

# Enviar → Actualizar
conns[N_SEND] = {"main": [[{"node": N_UPDATE, "type": "main", "index": 0}]]}

# ── PUT ───────────────────────────────────────────────────────────────────────
for attempt in range(4):
    r = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=wf)
    if r.status_code == 200:
        print("✅ CE Blog workflow actualizado con rama de email a leads")
        break
    elif r.status_code == 503:
        wait = 2 ** (attempt + 1)
        print(f"503 — reintentando en {wait}s...")
        time.sleep(wait)
    else:
        print(f"❌ Error {r.status_code}: {r.text[:500]}")
        break
