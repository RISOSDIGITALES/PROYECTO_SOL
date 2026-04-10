"""
Crea el workflow "CE - Sync Clientes Reactivación" en n8n.
Lee el sheet espejo de clientes, compara con el sheet de leads,
y agrega solo los nuevos (sin duplicar) con estado_email='reactivar'.
"""
import json, requests

TOKEN = "N8N_TOKEN_HERE"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}

LEADS_SHEET_ID   = "1WRqv3s1vsTRSpfz6Bo27u3ff9kHDki_nDDMFt9yVj-8"
CLIENTS_SHEET_ID = "1pVwP9adnV1_2lbl5pzjhi0BsBjvr5yoPbxwV6P7sNQc"
CLIENTS_GID      = "1789357450"
SHEETS_CRED      = "QE2RlAxaMLoYefTD"
GMAIL_CRED       = "TESHSjzjMCpCxBBk"

# ── Code: filtrar clientes nuevos ────────────────────────────────────────────
FILTRAR_CODE = r"""
// Clients from mirror sheet (column names from IMPORTRANGE)
const clients = $('\U0001F4CA Obtener Clientes').all().map(i => i.json);
// Current leads (to detect duplicates)
const leads   = $('\U0001F4CB Obtener Leads Actuales').all().map(i => i.json);

// Build set of emails already in the leads sheet
const existing = new Set(
  leads.map(l => (l.email || '').toString().toLowerCase().trim()).filter(e => e.includes('@'))
);

const newClients = [];

for (const c of clients) {
  // Nombre — handle slight variations in column name
  const nombre = (
    c['Cliente/ Notas'] || c['Cliente/Notas'] || c['Cliente'] || ''
  ).toString().trim();
  if (!nombre) continue;

  // Email — column "Correos para Cobranza" may have multiple, space/newline separated
  const rawEmails = (
    c['Correos para Cobranza'] || c['Correos\npara Cobranza'] || ''
  ).toString().trim();
  if (!rawEmails) continue;

  const emails = rawEmails.split(/[\s,;\n]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e.includes('@'));
  if (emails.length === 0) continue;

  const email = emails[0]; // use first valid email
  if (existing.has(email)) continue; // skip if already in system

  const direccion = (c['Direccion y Telefono'] || '').toString().trim();

  newClients.push({ json: {
    nombre,
    email,
    direccion,
    correo_enviado: '0',
    fecha_c1:       '',
    fecha_c2:       '',
    fecha_c3:       '',
    estado_email:   'reactivar'
  }});
}

if (newClients.length === 0) {
  return [{ json: { _sin_nuevos: true, count: 0, message: 'No hay clientes nuevos para agregar' } }];
}

return newClients;
"""

# ── Leads schema (all 8 columns) ─────────────────────────────────────────────
def schema_field(col_id, is_match=False):
    return {
        "id": col_id, "displayName": col_id,
        "required": False, "defaultMatch": is_match,
        "display": True, "type": "string",
        "canBeUsedToMatch": is_match
    }

LEADS_SCHEMA = [
    schema_field("nombre",         is_match=True),
    schema_field("direccion"),
    schema_field("email"),
    schema_field("correo_enviado"),
    schema_field("fecha_c1"),
    schema_field("fecha_c2"),
    schema_field("fecha_c3"),
    schema_field("estado_email"),
]

# ── Workflow nodes ────────────────────────────────────────────────────────────
nodes = [
    # Manual trigger
    {
        "id": "trigger-manual",
        "name": "\u25b6\ufe0f Ejecutar Manualmente",
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [240, 300],
        "parameters": {}
    },
    # Monthly schedule: 1st of every month at 8am
    {
        "id": "trigger-mensual",
        "name": "\u23f0 Trigger Mensual (d\u00eda 1)",
        "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2,
        "position": [240, 160],
        "parameters": {
            "rule": {
                "interval": [{
                    "field": "months",
                    "triggerAtDayOfMonth": 1,
                    "triggerAtHour": 8,
                    "triggerAtMinute": 0
                }]
            }
        }
    },
    # Read client mirror sheet
    {
        "id": "get-clients",
        "name": "\U0001f4ca Obtener Clientes",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [480, 300],
        "credentials": {
            "googleSheetsOAuth2Api": {"id": SHEETS_CRED, "name": "Google Sheets account"}
        },
        "parameters": {
            "operation": "getAll",
            "documentId": {"__rl": True, "value": CLIENTS_SHEET_ID, "mode": "id"},
            "sheetName":  {"__rl": True, "value": f"gid={CLIENTS_GID}", "mode": "id"},
            "filtersUI":  {},
            "options":    {}
        }
    },
    # Read existing leads (to detect duplicates)
    {
        "id": "get-leads-existing",
        "name": "\U0001f4cb Obtener Leads Actuales",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [720, 300],
        "credentials": {
            "googleSheetsOAuth2Api": {"id": SHEETS_CRED, "name": "Google Sheets account"}
        },
        "parameters": {
            "operation": "getAll",
            "documentId": {"__rl": True, "value": LEADS_SHEET_ID, "mode": "id"},
            "sheetName":  {"__rl": True, "value": "gid=0",        "mode": "id"},
            "filtersUI":  {},
            "options":    {}
        }
    },
    # Code: filter new clients
    {
        "id": "filtrar-nuevos",
        "name": "\U0001f50d Filtrar Clientes Nuevos",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [960, 300],
        "parameters": {"jsCode": FILTRAR_CODE}
    },
    # If: any new clients found?
    {
        "id": "check-nuevos",
        "name": "\u2753 Hay Nuevos?",
        "type": "n8n-nodes-base.if",
        "typeVersion": 2.2,
        "position": [1200, 300],
        "parameters": {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict"},
                "conditions": [{
                    "id": "cond-nuevos",
                    "leftValue":  "={{ $json._sin_nuevos }}",
                    "rightValue": True,
                    "operator": {"type": "boolean", "operation": "notEquals"}
                }],
                "combinator": "and"
            }
        }
    },
    # Append new clients to leads sheet
    {
        "id": "append-clients",
        "name": "\u2795 Agregar a Leads",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [1440, 200],
        "credentials": {
            "googleSheetsOAuth2Api": {"id": SHEETS_CRED, "name": "Google Sheets account"}
        },
        "parameters": {
            "operation": "append",
            "documentId": {"__rl": True, "value": LEADS_SHEET_ID, "mode": "id"},
            "sheetName":  {"__rl": True, "value": "gid=0",        "mode": "id"},
            "columns": {
                "mappingMode": "defineBelow",
                "value": {
                    "nombre":         "={{ $json.nombre }}",
                    "direccion":      "={{ $json.direccion }}",
                    "email":          "={{ $json.email }}",
                    "correo_enviado": "={{ $json.correo_enviado }}",
                    "fecha_c1":       "={{ $json.fecha_c1 }}",
                    "fecha_c2":       "={{ $json.fecha_c2 }}",
                    "fecha_c3":       "={{ $json.fecha_c3 }}",
                    "estado_email":   "={{ $json.estado_email }}"
                },
                "matchingColumns": ["nombre"],
                "schema": LEADS_SCHEMA
            },
            "options": {}
        }
    },
    # Aggregate results to count how many were added
    {
        "id": "aggregate",
        "name": "\U0001f4ca Contar Agregados",
        "type": "n8n-nodes-base.aggregate",
        "typeVersion": 1,
        "position": [1680, 200],
        "parameters": {
            "aggregate": "aggregateAllItemData",
            "destinationFieldName": "clientes_agregados",
            "options": {}
        }
    },
    # Notify: email summary
    {
        "id": "notificar-sync",
        "name": "\U0001f4e7 Notificar Resultado",
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.1,
        "position": [1920, 300],
        "credentials": {
            "gmailOAuth2": {"id": GMAIL_CRED, "name": "Gmail account"}
        },
        "parameters": {
            "sendTo":  "risosadmi@gmail.com",
            "subject": "={{ '[Sync Clientes] ' + ($json.clientes_agregados ? $json.clientes_agregados.length : 0) + ' clientes nuevos agregados' }}",
            "message": "={{ '<h3>Sync Clientes Reactivación</h3><p>Se agregaron <strong>' + ($json.clientes_agregados ? $json.clientes_agregados.length : 0) + ' clientes nuevos</strong> al sheet de leads con estado <code>reactivar</code>.</p><p>El flujo de outreach del próximo miércoles les enviará el email de reactivación automáticamente.</p>' }}",
            "options": {"appendAttribution": False}
        }
    },
    # No new clients: notify
    {
        "id": "notificar-sin-nuevos",
        "name": "\u2139\ufe0f Sin Clientes Nuevos",
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.1,
        "position": [1440, 420],
        "credentials": {
            "gmailOAuth2": {"id": GMAIL_CRED, "name": "Gmail account"}
        },
        "parameters": {
            "sendTo":  "risosadmi@gmail.com",
            "subject": "[Sync Clientes] Sin cambios — todos los clientes ya están en el sistema",
            "message": "<p>El sync de clientes se ejecutó pero no encontró clientes nuevos. Todos los emails del sheet de clientes ya existen en el sheet de leads.</p>",
            "options": {"appendAttribution": False}
        }
    }
]

# ── Connections ───────────────────────────────────────────────────────────────
connections = {
    "\u25b6\ufe0f Ejecutar Manualmente": {
        "main": [[{"node": "\U0001f4ca Obtener Clientes", "type": "main", "index": 0}]]
    },
    "\u23f0 Trigger Mensual (d\u00eda 1)": {
        "main": [[{"node": "\U0001f4ca Obtener Clientes", "type": "main", "index": 0}]]
    },
    "\U0001f4ca Obtener Clientes": {
        "main": [[{"node": "\U0001f4cb Obtener Leads Actuales", "type": "main", "index": 0}]]
    },
    "\U0001f4cb Obtener Leads Actuales": {
        "main": [[{"node": "\U0001f50d Filtrar Clientes Nuevos", "type": "main", "index": 0}]]
    },
    "\U0001f50d Filtrar Clientes Nuevos": {
        "main": [[{"node": "\u2753 Hay Nuevos?", "type": "main", "index": 0}]]
    },
    "\u2753 Hay Nuevos?": {
        "main": [
            [{"node": "\u2795 Agregar a Leads",        "type": "main", "index": 0}],  # true branch
            [{"node": "\u2139\ufe0f Sin Clientes Nuevos", "type": "main", "index": 0}]   # false branch
        ]
    },
    "\u2795 Agregar a Leads": {
        "main": [[{"node": "\U0001f4ca Contar Agregados", "type": "main", "index": 0}]]
    },
    "\U0001f4ca Contar Agregados": {
        "main": [[{"node": "\U0001f4e7 Notificar Resultado", "type": "main", "index": 0}]]
    }
}

# ── Create workflow ───────────────────────────────────────────────────────────
payload = {
    "name": "CE - Sync Clientes Reactivaci\u00f3n",
    "nodes": nodes,
    "connections": connections,
    "settings": {
        "executionOrder": "v1",
        "saveManualExecutions": True,
        "callerPolicy": "workflowsFromSameOwner",
        "errorWorkflow": ""
    },
    "staticData": None
}

r = requests.post(f"{BASE}/workflows", headers=H, json=payload)
result = r.json()

if "id" in result:
    print(f"✅ Workflow creado: {result['name']}")
    print(f"   ID: {result['id']}")
    print(f"   Nodes: {len(result.get('nodes', []))}")
    print(f"\n   Abre n8n y actívalo manualmente para probarlo.")
else:
    print("❌ ERROR:", json.dumps(result, indent=2)[:500])
