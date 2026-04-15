"""
Actualiza CE Email - Outreach Prospectos (bFjarbrGigp90UCL):
  1. Email tipo 1: añade línea de personalización por nicho
  2. Elimina dependencia del nodo blog (URL hardcodeada con fallback)
  3. Tipos 2, 3 y 4 sin cambios

Ejecución: python3 update_email_nicho.py
Requiere: pip install requests
Antes de correr: reemplaza N8N_TOKEN_HERE con tu token real de n8n.
"""
import json
import requests

TOKEN = "N8N_TOKEN_HERE"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "bFjarbrGigp90UCL"

print("[Email Outreach] Leyendo workflow...")
data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]
print(f"  Nodes: {len(nodes)} | {data['name']}")

# ════════════════════════════════════════════════════════════════════════════
# Nuevo código para build-email:
#   · Sin dependencia de nodo blog (URL hardcodeada)
#   · Email tipo 1: línea de personalización por nicho
#   · Tipos 2, 3 y 4 sin cambios de contenido
# ════════════════════════════════════════════════════════════════════════════
NEW_BUILD_EMAIL = r"""
const d      = $json;
const tipo   = d.email_tipo;
const nombre = d.nombre || 'there';
const nicho  = (d.nicho || '').toLowerCase().trim();
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

// ── Shared URLs with UTM ──────────────────────────────────────────────────
const waLink    = 'https://wa.me/17863948380?text=Hi%2C%20I%27m%20interested%20in%20crating%20solutions';
const quoteLink = 'https://cratingexpress.com/request-a-quote/?utm_source=email&utm_medium=outreach&utm_campaign=cold-outreach';
const blogLink  = 'https://cratingexpress.com/blog/?utm_source=email&utm_medium=outreach&utm_campaign=cold-outreach';
const blogTitle = 'Wood Crating & Packaging Insights';

// ── Niche-specific context line for Email 1 ──────────────────────────────
const nichoLines = {
  'customs-brokers':     'As a customs brokerage, you deal with freight every day — and improperly packaged cargo creates costly delays, claims, and unhappy clients.',
  'freight-forwarders':  'As a freight forwarder, you know that proper packaging is the first line of defense against cargo damage and insurance headaches.',
  'importers-exporters': 'As an importer/exporter, you know firsthand what poor packaging does to international shipments — delays, damage claims, and lost revenue.',
  'industrial-equip':    'As an industrial equipment dealer, your machinery deserves packaging engineered to its exact dimensions, weight, and export requirements.',
  'art-galleries':       'As an art gallery, your pieces are irreplaceable — and they demand custom-built protection engineered to their specific dimensions and fragility.',
  'aerospace':           'In aerospace, component integrity is everything. That starts long before takeoff — with precision packaging built to spec.',
  'medical-equipment':   'Medical equipment is fragile, precise, and high-value — exactly the kind of cargo that cannot afford standard packaging.',
  'manufacturing':       'As a manufacturer, shipping your products in properly engineered crates means fewer damage claims, lower insurance costs, and happier customers.',
};
const nichoLine = nichoLines[nicho] ? `<p>${nichoLines[nicho]}</p>` : '';

let subject  = '';
let emailBody = '';

// ════════════════════════════════════════════════════════════════════════════
if (tipo === 1) {
// ── EMAIL 1 — Introduction (with niche context) ──────────────────────────────
subject = `Custom wood crating solutions for ${nombre}`;

emailBody = `<!DOCTYPE html><html><body style="${wrap}">
<div style="${header}">
  <h2 style="margin:0;font-size:20px;">📦 Crating Express — Custom Wood Packaging, Miami FL</h2>
</div>
<div style="${body}">
  <p>Hi ${nombre},</p>

  ${nichoLine}

  <p>I'm reaching out because we work with companies that ship heavy equipment,
  machinery, and industrial products — and we know firsthand how much a poorly
  packaged shipment can cost in damage claims and delays.</p>

  <p><strong>Crating Express</strong> builds custom ISPM-15 certified wood crates
  and export-ready packaging from our Miami facility. We specialize in oversized,
  fragile, and high-value freight that needs precision engineering, not a
  standard box.</p>

  <p>📖 You might find this useful:<br>
  <a href="${blogLink}" style="color:#c0392b;font-weight:bold;">${blogTitle}</a></p>

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
    <li>📐 Oversized or irregular cargo that does not fit standard packaging</li>
  </ul>

  <p>Our Miami location is ideal for shipments heading to Latin America, Europe,
  or anywhere worldwide. Every crate is engineered to match your cargo's
  exact dimensions, weight, and handling requirements.</p>

  <p>If you would like to see how we have protected shipments similar to yours,
  I am happy to share specifics — just reach out.</p>

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

  <p>This will be my last message — I do not want to crowd your inbox.</p>

  <p>If you ever need <strong>custom wood crating, ISPM-15 certified packaging,
  or export-ready solutions for heavy freight</strong>, Crating Express is here
  whenever you are ready.</p>

  <p>Getting a quote takes less than 2 minutes — and there is no commitment:</p>

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

// ════════════════════════════════════════════════════════════════════════════
} else if (tipo === 4) {
// ── EMAIL 4 — Client Reactivation ──────────────────────────────────────────
subject = `We would love to work with you again, ${nombre}`;

const reactivateQuoteLink = 'https://cratingexpress.com/request-a-quote/?utm_source=email&utm_medium=outreach&utm_campaign=reactivacion';

emailBody = `<!DOCTYPE html><html><body style="${wrap}">
<div style="${header}">
  <h2 style="margin:0;font-size:20px;">🤝 It's Been a While — Crating Express</h2>
</div>
<div style="${body}">
  <p>Hi ${nombre},</p>

  <p>I wanted to reach out and reconnect. It has been some time since we last
  worked together, and we would love the opportunity to support your freight
  and packaging needs again.</p>

  <p>Since we last spoke, we have expanded our capabilities at Crating Express:</p>
  <ul style="padding-left:20px;line-height:1.8;">
    <li>📐 More flexible turnaround times for urgent shipments</li>
    <li>🌍 Expanded capacity for international export crating</li>
    <li>✅ Same ISPM-15 certified quality your team already knows</li>
  </ul>

  <p>If you have an upcoming shipment — or just want to catch up and explore
  options — we are here and happy to put together a fresh quote at no cost.</p>

  <div style="text-align:center;margin:28px 0;">
    <a href="${reactivateQuoteLink}" style="${btnRed}">Request a Fresh Quote</a><br>
    <a href="${waLink}" style="${btnGreen}">💬 Chat with Us on WhatsApp</a>
  </div>

  <p>Looking forward to hearing from you, ${nombre}.</p>

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
    email_subject:         subject,
    email_body:            emailBody,
    update_correo_enviado: 'SI',
    update_fecha_c1:       tipo === 1 ? today : (d.fecha_c1 || ''),
    update_fecha_c2:       tipo === 2 ? today : (d.fecha_c2 || ''),
    update_fecha_c3:       tipo === 3 ? today : (d.fecha_c3 || ''),
    update_estado_email:   tipo === 3 ? 'completado' : tipo === 4 ? 'reactivado' : 'activo',
  }
}];
"""

# ── Aplicar cambio en build-email ─────────────────────────────────────────────
updated = []
for n in nodes:
    if n["id"] == "build-email":
        n["parameters"]["jsCode"] = NEW_BUILD_EMAIL
        updated.append("build-email")

if updated:
    print(f"  ✓ Nodo actualizado: {', '.join(updated)}")
else:
    print("  ⚠️  Nodo 'build-email' no encontrado.")
    print("     IDs disponibles:", [n["id"] for n in nodes])

# ── Push ─────────────────────────────────────────────────────────────────────
payload = {
    "name":        data["name"],
    "nodes":       nodes,
    "connections": data["connections"],
    "settings":    data.get("settings", {}),
    "staticData":  data.get("staticData"),
}
r = requests.put(f"{BASE}/workflows/{WF_ID}", headers=H, json=payload)
result = r.json()

if "id" in result:
    print(f"\n  ✅ CE Email - Outreach actualizado OK")
else:
    print("  ❌ ERROR:", json.dumps(result, indent=2)[:500])
