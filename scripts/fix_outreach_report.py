"""
Fix CE Email Outreach: instead of one report email per lead,
send one consolidated summary after all emails are sent.

Changes:
1. Remove connection: "📧 Enviar Email" → "📊 Reporte Growth54"
2. Add new Aggregate node after "✏️ Actualizar en Sheets"
3. Connect: "✏️ Actualizar en Sheets" → Aggregate → "📊 Reporte Growth54"
4. Update Reporte Growth54 message to show full table of all leads
"""

import json, requests, sys

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "bFjarbrGigp90UCL"

# ── Load current workflow ─────────────────────────────────────────────
r = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H, timeout=30)
r.raise_for_status()
wf = r.json()

nodes       = wf["nodes"]
connections = wf["connections"]

# ── 1. Add Aggregate node ─────────────────────────────────────────────
AGG_ID = "aggregate-emails-sent"
aggregate_node = {
    "id": AGG_ID,
    "name": "📦 Agrupar Emails Enviados",
    "type": "n8n-nodes-base.aggregate",
    "typeVersion": 1,
    "position": [2200, 400],
    "parameters": {
        "aggregate": "aggregateAllItemData",
        "options": {}
    }
}

# Only add if not already present
if not any(n["id"] == AGG_ID for n in nodes):
    nodes.append(aggregate_node)
    print("✅ Aggregate node added")
else:
    print("ℹ️  Aggregate node already exists")

# ── 2. Update Reporte Growth54 message for consolidated report ─────────
REPORTE_ID = "1a9472ac-53c6-4dbb-b942-7ef78fd1100d"
for node in nodes:
    if node["id"] == REPORTE_ID:
        node["parameters"]["subject"] = (
            "=📊 CE Email Outreach — Reporte del día "
            "{{ new Date().toLocaleDateString('es-US', {timeZone:'America/New_York'}) }}"
        )
        node["parameters"]["message"] = (
            """=<div style="font-family:Arial,sans-serif;max-width:660px;color:#333;">
<div style="background:#305468;color:#fff;padding:16px 20px;border-radius:6px 6px 0 0;">
<strong>Growth54 — Reporte Automático de Email Outreach</strong>
</div>
<div style="padding:16px 20px;border:1px solid #ddd;border-top:none;border-radius:0 0 6px 6px;">
<p><strong>Fecha:</strong> {{ new Date().toLocaleString('es-US', {timeZone:'America/New_York'}) }}</p>
<p><strong>Total emails enviados hoy:</strong> {{ $json.data.length }}</p>
<hr style="border:none;border-top:1px solid #eee;margin:12px 0;">
<table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
<thead>
<tr style="background:#f5f5f5;">
<th style="text-align:left;border-bottom:2px solid #ddd;">#</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Empresa / Nombre</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Email</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Nicho</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Tipo</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Idioma</th>
</tr>
</thead>
<tbody>
{{ $json.data.map((item, i) => `<tr style="border-bottom:1px solid #eee;"><td style="color:#999;">${i+1}</td><td><strong>${item.empresa || item.nombre || '—'}</strong></td><td style="color:#305468;">${item.email || '—'}</td><td>${item.nicho || '—'}</td><td style="text-align:center;">${item.email_tipo || '—'}</td><td>${item.email_idioma || '—'}</td></tr>`).join('') }}
</tbody>
</table>
<p style="margin-top:16px;font-size:12px;color:#999;">Workflow: CE Email — Outreach Prospectos | Ejecución: {{ $execution.id }}</p>
</div>
</div>"""
        )
        print("✅ Reporte Growth54 message updated")
        break

# ── 3. Fix connections ────────────────────────────────────────────────

# 3a. Remove "📧 Enviar Email" → "📊 Reporte Growth54" from send-email connections
send_email_conns = connections.get("📧 Enviar Email", {}).get("main", [[]])
new_send_conns = []
for branch in send_email_conns:
    new_branch = [c for c in branch if c.get("node") != "📊 Reporte Growth54"]
    new_send_conns.append(new_branch)
connections["📧 Enviar Email"]["main"] = new_send_conns
print("✅ Removed per-email Reporte Growth54 connection")

# 3b. Connect "✏️ Actualizar en Sheets" → Aggregate
connections["✏️ Actualizar en Sheets"] = {
    "main": [[{"node": "📦 Agrupar Emails Enviados", "type": "main", "index": 0}]]
}
print("✅ Connected Actualizar en Sheets → Aggregate")

# 3c. Connect Aggregate → "📊 Reporte Growth54"
connections["📦 Agrupar Emails Enviados"] = {
    "main": [[{"node": "📊 Reporte Growth54", "type": "main", "index": 0}]]
}
print("✅ Connected Aggregate → Reporte Growth54")

# ── 4. PATCH workflow ─────────────────────────────────────────────────
payload = {
    "name": wf["name"],
    "nodes": nodes,
    "connections": connections,
    "settings": wf.get("settings", {}),
    "staticData": wf.get("staticData"),
}

r2 = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=payload, timeout=30)
if r2.status_code == 200:
    print("\n✅ Workflow updated successfully!")
    print("   Flow: Enviar Email → Actualizar Sheets → Agrupar → Reporte (1 email total)")
else:
    print(f"\n❌ Error {r2.status_code}: {r2.text[:500]}")
    sys.exit(1)
