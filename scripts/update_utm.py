"""
UTM tracking: añade parámetros UTM a los links de cratingexpress.com
Workflows afectados:
  - CE Blog - Publicar en Todas las Redes  → node: parse-content
  - RRSS Automation - Crating Express      → node: parsear-versiones-en
Solo se modifica el jsCode de cada node. Conexiones/credenciales intactas.
"""
import json, requests

TOKEN = "N8N_TOKEN_HERE"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}

def push(wf_id, data, label):
    payload = {
        "name":        data["name"],
        "nodes":       data["nodes"],
        "connections": data["connections"],
        "settings":    data.get("settings", {}),
        "staticData":  data.get("staticData"),
    }
    r = requests.put(f"{BASE}/workflows/{wf_id}", headers=H, json=payload)
    result = r.json()
    if "id" in result:
        print(f"  ✅ {label} — actualizado OK")
    else:
        print(f"  ❌ {label} — ERROR:", json.dumps(result)[:300])

# ── UTM helper (inserted into every Code node) ──────────────────────────────
UTM_HELPER = r"""
// ── UTM Tracking ─────────────────────────────────────────────────────────────
function addUtm(text, source, medium, campaign) {
  if (!text) return text;
  return text.replace(
    /https?:\/\/(www\.)?cratingexpress\.com(\/[^\s"'<>\)]*)?/g,
    function(match) {
      if (match.includes('utm_source')) return match; // already tagged
      const sep = match.includes('?') ? '&' : '?';
      return match + sep + 'utm_source=' + source +
             '&utm_medium=' + medium + '&utm_campaign=' + campaign;
    }
  );
}
"""

# ════════════════════════════════════════════════════════════════════════════
# 1. CE Blog — Publicar en Todas las Redes  (parse-content)
# ════════════════════════════════════════════════════════════════════════════
print("\n[1] CE Blog — Publicar en Todas las Redes")
data = requests.get(f"{BASE}/workflows/38fO1D5uJpVUDMqm", headers=H).json()

NEW_PARSE_CONTENT = r"""const raw = $input.item.json.choices && $input.item.json.choices[0]
  ? $input.item.json.choices[0].message.content || '{}'
  : '{}';

let content;
try { content = JSON.parse(raw); }
catch(e) {
  const m = raw.match(/\{[\s\S]*\}/);
  content = m ? JSON.parse(m[0]) : {};
}

// Use cross-node reference — blog data is safe regardless of image download result
const blog = $('\U0001F527 Seleccionar Blog').item.json;

// ── LinkedIn: enforce EXACTLY 7 specific hashtags ──────────────────────────
function enforceLinkedInHashtags(text) {
  if (!text) return text;
  const REQUIRED = ['#ISPM15'];
  const POOL = [
    '#WoodCrating','#CustomCrating','#WoodPackaging','#IndustrialPackaging',
    '#FreightProtection','#ExportCrating','#HeavyEquipmentShipping','#MiamiLogistics',
    '#ShippingCrates','#SupplyChain','#ExportPackaging','#B2BLogistics','#ManufacturingMiami'
  ];
  const found = (text.match(/#[A-Za-z0-9_]+/g) || []);
  const seen = new Set();
  const hashtags = [];
  REQUIRED.forEach(function(h) { if (!seen.has(h)) { seen.add(h); hashtags.push(h); } });
  found.forEach(function(h)    { if (!seen.has(h) && hashtags.length < 7) { seen.add(h); hashtags.push(h); } });
  for (let i = 0; i < POOL.length && hashtags.length < 7; i++) {
    if (!seen.has(POOL[i])) { seen.add(POOL[i]); hashtags.push(POOL[i]); }
  }
  const cleanText = text.replace(/#[A-Za-z0-9_]+/g, '').replace(/\n{3,}/g, '\n\n').trim();
  return cleanText + '\n\n' + hashtags.slice(0, 7).join(' ');
}

const linkedinFinal = enforceLinkedInHashtags(content.linkedin || '');

// Pass image binary from download node so LinkedIn can upload it directly
let imgBinary = {};
try { imgBinary = $('\u2B07\uFE0F Descargar Imagen').item.binary || {}; } catch(e) {}

// ── UTM Tracking ─────────────────────────────────────────────────────────────
function addUtm(text, source, medium, campaign) {
  if (!text) return text;
  return text.replace(
    /https?:\/\/(www\.)?cratingexpress\.com(\/[^\s"'<>\)]*)?/g,
    function(match) {
      if (match.includes('utm_source')) return match;
      const sep = match.includes('?') ? '&' : '?';
      return match + sep + 'utm_source=' + source +
             '&utm_medium=' + medium + '&utm_campaign=' + campaign;
    }
  );
}

return [{
  json: {
    wp_id:     blog.wp_id,
    titulo:    blog.titulo,
    extracto:  blog.extracto || '',
    url:       blog.url,
    fecha_wp:  blog.fecha_wp,
    featured_image_url: blog.featured_image_url || '',
    linkedin:      addUtm(linkedinFinal,           'linkedin',  'social',     'blog-semanal'),
    instagram:     addUtm(content.instagram  || '', 'instagram', 'social',     'blog-semanal'),
    facebook:      addUtm(content.facebook   || '', 'facebook',  'social',     'blog-semanal'),
    email_subject: content.email_subject || ('Blog Update: ' + blog.titulo).slice(0, 45),
    email_body:    addUtm(content.email_body || '', 'email',     'newsletter', 'blog-semanal'),
  },
  binary: imgBinary
}];"""

changed = False
for n in data["nodes"]:
    if n["id"] == "parse-content":
        n["parameters"]["jsCode"] = NEW_PARSE_CONTENT
        print("  → parse-content: UTM añadido a linkedin/facebook/instagram/email_body")
        changed = True

if changed:
    push("38fO1D5uJpVUDMqm", data, "CE Blog - Publicar en Todas las Redes")
else:
    print("  ⚠️  parse-content no encontrado")

# ════════════════════════════════════════════════════════════════════════════
# 2. RRSS Automation — parsear-versiones-en
# ════════════════════════════════════════════════════════════════════════════
print("\n[2] RRSS Automation - Crating Express")
data = requests.get(f"{BASE}/workflows/HqKUsOwwguIYQbsU", headers=H).json()

NEW_PARSEAR_VERSIONES = r"""const aiResponse = $input.item.json.candidates?.[0]?.content?.parts?.[0]?.text
  || $input.item.json.choices?.[0]?.message?.content || '{}';

let versiones;
try { versiones = JSON.parse(aiResponse); }
catch(e) {
  const m = aiResponse.match(/\{[\s\S]*\}/);
  versiones = m ? JSON.parse(m[0]) : {};
}

const prevData = $('\U0001F50D Parsear Post Español').item.json;

// ── Array → paragraph string ───────────────────────────────────────────────
function fromArray(arr) {
  if (Array.isArray(arr) && arr.length > 0)
    return arr.map(p => p.trim()).filter(p => p.length > 0).join('\n\n');
  return null;
}

// ── Smart split for plain text ─────────────────────────────────────────────
function smartSplit(text, spp) {
  if (!text) return '';
  text = text.trim();
  const hashIdx = text.search(/(^|\s)#\w/);
  let body = hashIdx > 0 ? text.slice(0, hashIdx).trim() : text;
  const tags = hashIdx > 0 ? text.slice(hashIdx).trim() : '';
  const sentences = body.match(/[^.!?]+[.!?]+/g) || [body];
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += spp) {
    const chunk = sentences.slice(i, i + spp).join(' ').trim();
    if (chunk) paragraphs.push(chunk);
  }
  if (tags) paragraphs.push(tags);
  return paragraphs.join('\n\n');
}

// ── Instagram split ─────────────────────────────────────────────────────────
function splitInstagram(arr, text) {
  const joined = fromArray(arr);
  if (joined) return joined;
  if (!text) return '';
  text = text.trim();
  const hashIdx = text.search(/(^|\s)#\w/);
  const tags = hashIdx > 0 ? text.slice(hashIdx).trim() : '';
  const body = hashIdx > 0 ? text.slice(0, hashIdx).trim() : text;
  const lines = body.split(/\s{2,}|\n/).map(l => l.trim()).filter(l => l);
  const ctaIdx = lines.findIndex(l => /cratingexpress|free|visit|request|link in bio/i.test(l));
  let parts = [];
  if (ctaIdx > 0) {
    parts.push(lines.slice(0, ctaIdx).join(' '));
    parts.push(lines.slice(ctaIdx).join(' '));
  } else {
    const mid = Math.ceil(lines.length / 2);
    parts.push(lines.slice(0, mid).join(' '));
    if (lines.slice(mid).length) parts.push(lines.slice(mid).join(' '));
  }
  if (tags) parts.push(tags);
  return parts.filter(p => p).join('\n\n');
}

// ── Hashtag enforcement ────────────────────────────────────────────────────
function enforceHashtags(raw, count, required, pool) {
  const found = (raw || '').match(/#[A-Za-z0-9_]+/g) || [];
  const seen = new Set();
  const final = [];
  required.forEach(function(h) { if (!seen.has(h)) { seen.add(h); final.push(h); } });
  found.forEach(function(h)    { if (!seen.has(h) && final.length < count) { seen.add(h); final.push(h); } });
  for (let i = 0; i < pool.length && final.length < count; i++) {
    if (!seen.has(pool[i])) { seen.add(pool[i]); final.push(pool[i]); }
  }
  return final.slice(0, count).join(' ');
}

const FB_POOL = ['#WoodCrating','#CustomCrating','#MiamiLogistics','#IndustrialPackaging',
  '#FreightProtection','#ShippingExperts','#WoodPackaging','#ExportCrating'];
const IG_POOL = ['#packaging','#logistics','#shipping','#manufacturing','#miami',
  '#woodpackaging','#customcrating','#industrialpackaging','#woodencrates','#freightprotection',
  '#woodcrating','#exportcrating','#cratingexpress','#miamilogistics','#exportpackaging'];

const fbHashtags = enforceHashtags(versiones.facebook_hashtags, 5, ['#ISPM15'], FB_POOL);
const igHashtags = enforceHashtags(versiones.instagram_hashtags, 13, ['#ISPM15'], IG_POOL);

const fbBody = fromArray(versiones.facebook_paragraphs) || smartSplit(versiones.facebook, 2) || '';
const igBody = splitInstagram(versiones.instagram_lines, versiones.instagram) || '';

const fbClean = fbBody.replace(/#[A-Za-z0-9_]+/g, '').replace(/\n{3,}/g, '\n\n').trim();
const igClean = igBody.replace(/#[A-Za-z0-9_]+/g, '').replace(/\n{3,}/g, '\n\n').trim();

// ── UTM Tracking ─────────────────────────────────────────────────────────────
function addUtm(text, source, medium, campaign) {
  if (!text) return text;
  return text.replace(
    /https?:\/\/(www\.)?cratingexpress\.com(\/[^\s"'<>\)]*)?/g,
    function(match) {
      if (match.includes('utm_source')) return match;
      const sep = match.includes('?') ? '&' : '?';
      return match + sep + 'utm_source=' + source +
             '&utm_medium=' + medium + '&utm_campaign=' + campaign;
    }
  );
}

return [{
  json: {
    ...prevData,
    texto_canva_titulo_en:    versiones.texto_canva_titulo_en    || prevData.texto_canva_titulo   || '',
    texto_canva_subtitulo_en: versiones.texto_canva_subtitulo_en || prevData.texto_canva_subtitulo || '',
    post_facebook_en:  addUtm(fbClean + '\n\n' + fbHashtags, 'facebook',  'social', 'rrss-automation'),
    post_instagram_en: addUtm(igClean + '\n\n' + igHashtags, 'instagram', 'social', 'rrss-automation'),
  }
}];"""

changed = False
for n in data["nodes"]:
    if n["id"] == "parsear-versiones-en":
        n["parameters"]["jsCode"] = NEW_PARSEAR_VERSIONES
        print("  → parsear-versiones-en: UTM añadido a post_facebook_en y post_instagram_en")
        changed = True

if changed:
    push("HqKUsOwwguIYQbsU", data, "RRSS Automation - Crating Express")
else:
    print("  ⚠️  parsear-versiones-en no encontrado")
