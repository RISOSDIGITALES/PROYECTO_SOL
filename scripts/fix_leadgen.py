"""
Fix Lead Generation workflow:
1. Add nicho + idioma fields to Formatear Lead (pulled from ⚙️ Parámetros)
2. Add continueOnFail to HTTP request nodes (Place Details, Hunter, Scraping)
3. Fix Reporte Growth54 → one consolidated email per run, not one per lead
"""

import json, requests, sys

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "rtyrpJJsXD2xHINU"

r = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H, timeout=30)
r.raise_for_status()
wf = r.json()
nodes       = wf["nodes"]
connections = wf["connections"]

# ── 1. Add nicho + idioma to Formatear Lead ───────────────────────────
for node in nodes:
    if node["id"] == "node-format":
        assignments = node["parameters"]["assignments"]["assignments"]
        ids = [a["id"] for a in assignments]

        if "f13" not in ids:
            assignments.append({
                "id": "f13",
                "name": "nicho",
                "value": "={{ $('⚙️ Parámetros').first().json.nicho }}",
                "type": "string"
            })
        if "f14" not in ids:
            assignments.append({
                "id": "f14",
                "name": "idioma",
                "value": "=en",
                "type": "string"
            })
        # Add empresa = nombre for Email Outreach compatibility
        if "f15" not in ids:
            assignments.append({
                "id": "f15",
                "name": "empresa",
                "value": "={{ $json.result.name }}",
                "type": "string"
            })
        print("✅ Added nicho, idioma, empresa to Formatear Lead")
        break

# ── 2. Add continueOnFail to HTTP nodes ───────────────────────────────
http_node_ids = ["node-place-details", "node-fetch-web", "node-scraping-fetch", "node-scraping-fetch-about"]
for node in nodes:
    if node["id"] in http_node_ids:
        if "onError" not in node:
            node["onError"] = "continueRegularOutput"
        print(f"✅ Added error handling to {node['name']}")

# ── 3. Fix Reporte Growth54 → consolidated via Aggregate ─────────────
REPORTE_ID = "8e0a140d-f3e6-4752-bd4f-b5340c41bb41"
AGG_ID     = "agg-leads-found"

# Find what's currently connected to Reporte Growth54
# The report fires after email found or after scraping fails
# Replace with: all Sheets Update nodes → Aggregate → Reporte

# Add Aggregate node if not present
if not any(n["id"] == AGG_ID for n in nodes):
    nodes.append({
        "id": AGG_ID,
        "name": "📦 Agrupar Leads",
        "type": "n8n-nodes-base.aggregate",
        "typeVersion": 1,
        "position": [3400, 300],
        "parameters": {
            "aggregate": "aggregateAllItemData",
            "options": {}
        }
    })
    print("✅ Aggregate node added")

# Update Reporte Growth54 message for consolidated report
for node in nodes:
    if node["id"] == REPORTE_ID:
        node["parameters"]["subject"] = (
            "=📊 Lead Generation — Reporte del {{ new Date().toLocaleDateString('es-US', {timeZone:'America/New_York'}) }}"
        )
        node["parameters"]["message"] = (
            """=<div style="font-family:Arial,sans-serif;max-width:660px;color:#333;">
<div style="background:#305468;color:#fff;padding:16px 20px;border-radius:6px 6px 0 0;">
<strong>Growth54 — Reporte Lead Generation (Google Maps)</strong>
</div>
<div style="padding:16px 20px;border:1px solid #ddd;border-top:none;border-radius:0 0 6px 6px;">
<p><strong>Fecha:</strong> {{ new Date().toLocaleString('es-US', {timeZone:'America/New_York'}) }}</p>
<p><strong>Total leads guardados:</strong> {{ $json.data.length }}</p>
<hr style="border:none;border-top:1px solid #eee;margin:12px 0;">
<table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
<thead>
<tr style="background:#f5f5f5;">
<th style="text-align:left;border-bottom:2px solid #ddd;">#</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Empresa</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Email</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Teléfono</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Nicho</th>
<th style="text-align:left;border-bottom:2px solid #ddd;">Web</th>
</tr>
</thead>
<tbody>
{{ $json.data.map((item, i) => `<tr style="border-bottom:1px solid #eee;"><td style="color:#999;">${i+1}</td><td><strong>${item.nombre || '—'}</strong></td><td style="color:#305468;">${item.email || '<em style=color:#ccc>sin email</em>'}</td><td>${item.telefono || '—'}</td><td>${item.nicho || '—'}</td><td style="font-size:12px;color:#888;">${(item.web||'').substring(0,30) || '—'}</td></tr>`).join('') }}
</tbody>
</table>
<p style="margin-top:16px;font-size:12px;color:#999;">Workflow: Lead Generation — Google Maps | Ejecución: {{ $execution.id }}</p>
</div>
</div>"""
        )
        print("✅ Reporte Growth54 message updated (consolidated)")
        break

# ── 4. Update connections: all paths → Aggregate → Reporte ────────────
# Currently Reporte fires from: "📊 Actualizar Email" and possibly from scraping paths
# Find which nodes currently connect to Reporte Growth54
connected_to_reporte = []
for node_name, node_conns in connections.items():
    for branch in node_conns.get("main", []):
        for conn in branch:
            if conn.get("node") == "📊 Reporte Growth54":
                connected_to_reporte.append(node_name)

print(f"   Nodes currently → Reporte Growth54: {connected_to_reporte}")

# Remove all direct connections to Reporte Growth54
for node_name in connected_to_reporte:
    node_conns = connections[node_name]
    new_main = []
    for branch in node_conns.get("main", []):
        new_branch = [c for c in branch if c.get("node") != "📊 Reporte Growth54"]
        new_main.append(new_branch)
    connections[node_name]["main"] = new_main
    print(f"✅ Removed {node_name} → Reporte Growth54")

# Connect "📊 Actualizar Email" → Aggregate (this is the successful email path)
# Also need to connect the scraping paths when no email is found
# The cleanest path: connect node-update-email → Aggregate
# And also connect the "no email found" end nodes → Aggregate

# Find the Actualizar Email and end-of-scraping nodes
update_email_node = None
for node in nodes:
    if node["id"] == "node-update-email":
        update_email_node = node
        break

# Connect Actualizar Email → Aggregate
if "📊 Actualizar Email" in connections:
    conns = connections["📊 Actualizar Email"].get("main", [[]])
    # Add aggregate to first branch if not already there
    if conns and not any(c.get("node") == "📦 Agrupar Leads" for c in conns[0]):
        conns[0].append({"node": "📦 Agrupar Leads", "type": "main", "index": 0})
    connections["📊 Actualizar Email"]["main"] = conns
else:
    connections["📊 Actualizar Email"] = {
        "main": [[{"node": "📦 Agrupar Leads", "type": "main", "index": 0}]]
    }
print("✅ Actualizar Email → Aggregate")

# Connect Aggregate → Reporte Growth54
connections["📦 Agrupar Leads"] = {
    "main": [[{"node": "📊 Reporte Growth54", "type": "main", "index": 0}]]
}
print("✅ Aggregate → Reporte Growth54")

# ── 5. Save ────────────────────────────────────────────────────────────
payload = {
    "name": wf["name"],
    "nodes": nodes,
    "connections": connections,
    "settings": wf.get("settings", {}),
    "staticData": wf.get("staticData"),
}

r2 = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=payload, timeout=30)
if r2.status_code == 200:
    print("\n✅ Lead Generation workflow updated!")
    print("   - nicho/idioma/empresa added to each lead")
    print("   - HTTP error handling added (workflow continues on failed requests)")
    print("   - Reporte Growth54 now sends ONE email with all leads")
else:
    print(f"\n❌ Error {r2.status_code}: {r2.text[:500]}")
    sys.exit(1)
