"""
Fix CE Mantenimiento:
1. Make ¿Es sábado? check use a fresh Date().getDay() === 6 to be bulletproof
2. Remove the $('📋 Parsear Reporte') fallback from Gmail subject/message
   (it was causing the daily report to leak through on non-Saturdays)
3. Change Groq prompt to use bullet points instead of paragraphs
4. Update weekly report format to use bullet points
"""

import requests, sys

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMmE1YmEyMDQtZDU5ZC00YzFiLTkxMjktZGM5NGNlNmM0MTk3IiwiaWF0IjoxNzczODUxMjg5fQ.RHRC3nRgvgn_fyJ8mflqsVrBxxncYc_EwWiepr127T8"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "T9J845yE4sd8Dde5"

r = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H, timeout=30)
r.raise_for_status()
wf = r.json()
nodes = wf["nodes"]

for node in nodes:
    # ── 1. Fix ¿Es sábado? condition ──────────────────────────────────
    if node["id"] == "maint-ifsat":
        node["parameters"]["conditions"]["conditions"][0]["leftValue"] = \
            "={{ new Date().getDay() === 6 }}"
        node["parameters"]["conditions"]["conditions"][0]["rightValue"] = True
        print("✅ ¿Es sábado? now uses fresh new Date().getDay() === 6")

    # ── 2. Fix Gmail node: remove Parsear Reporte fallback ────────────
    if node["id"] == "maint-email":
        node["parameters"]["subject"] = "={{ $json.subject }}"
        node["parameters"]["message"] = "={{ $json.body_html }}"
        print("✅ Gmail node: removed $('📋 Parsear Reporte') fallback expressions")

    # ── 3. Fix Groq prompt: ask for bullet points ─────────────────────
    if node["id"] == "maint-prompt":
        code = node["parameters"]["jsCode"]
        old_format = '''"subject": "Reporte de Tarea: Crating Express - ${fecha}",
  "resumen_texto": "resumen en texto plano de máximo 3 líneas con los hallazgos clave",
  "body_html": "HTML completo del reporte con secciones: Hallazgos → Recomendaciones → Próximos Pasos"'''
        new_format = '''"subject": "Reporte de Tarea: Crating Express - ${fecha}",
  "resumen_texto": "resumen en texto plano de máximo 3 líneas con los hallazgos clave",
  "body_html": "HTML con cada sección usando SOLO listas de incisos (<ul><li>). Sin párrafos de texto corrido. Secciones: Hallazgos → Recomendaciones → Próximos Pasos. Cada punto debe ser conciso y directo (máximo 15 palabras por inciso)."'''
        if old_format in code:
            node["parameters"]["jsCode"] = code.replace(old_format, new_format)
            print("✅ Groq prompt updated: bullet points format")
        else:
            print("⚠️  Could not find Groq prompt section to update — manual check needed")

    # ── 4. Fix Preparar Reporte Semanal: bullet point wrapper style ───
    if node["id"] == "maint-weekly":
        code = node["parameters"]["jsCode"]
        # Update the section display to be more concise
        old_section = '''const sections = semana.map(dia => `
  <div style="margin-bottom:28px;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
    <h3 style="color:${NAVY};margin:0 0 8px;">${dia.fecha}</h3>
    <p style="color:#555;font-size:13px;margin:0 0 12px;"><strong>Tareas:</strong> ${dia.tareas.join(', ')}</p>
    <p style="color:#444;margin:0 0 12px;">${dia.resumen}</p>
    <details>
      <summary style="cursor:pointer;color:${NAVY};font-size:13px;">Ver reporte completo</summary>
      <div style="margin-top:12px;">${dia.html}</div>
    </details>
  </div>
`).join('');'''
        new_section = '''const sections = semana.map(dia => `
  <div style="margin-bottom:24px;padding:18px 20px;border:1px solid #e0e0e0;border-radius:8px;">
    <h3 style="color:${NAVY};margin:0 0 10px;font-size:15px;">${dia.fecha}</h3>
    <p style="color:#666;font-size:12px;margin:0 0 10px;">
      <strong>Tareas ejecutadas:</strong>
      <ul style="margin:4px 0 0;padding-left:18px;color:#444;">${dia.tareas.map(t => `<li>${t}</li>`).join('')}</ul>
    </p>
    ${dia.html}
  </div>
`).join('');'''
        if old_section in code:
            node["parameters"]["jsCode"] = code.replace(old_section, new_section)
            print("✅ Preparar Reporte Semanal: updated section format")
        else:
            print("⚠️  Could not find weekly section code to update — skipping")

# ── Save ───────────────────────────────────────────────────────────────
payload = {
    "name": wf["name"],
    "nodes": nodes,
    "connections": wf["connections"],
    "settings": wf.get("settings", {}),
    "staticData": wf.get("staticData"),
}
r2 = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=payload, timeout=30)
if r2.status_code == 200:
    print("\n✅ CE Mantenimiento workflow updated!")
    print("   - Saturday check now uses fresh Date().getDay() (can't be tricked)")
    print("   - Gmail node no longer falls back to Parsear Reporte")
    print("   - Groq now generates bullet points instead of paragraphs")
else:
    print(f"\n❌ Error {r2.status_code}: {r2.text[:400]}")
    sys.exit(1)
