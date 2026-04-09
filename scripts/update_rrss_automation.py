import json, requests

N8N_TOKEN = "N8N_JWT_TOKEN_HERE"
WORKFLOW_ID = "HqKUsOwwguIYQbsU"

with open('/tmp/rrss_automation.json') as f:
    data = json.load(f)
nodes = data['nodes']

# ─────────────────────────────────────────────────────────────────────────────
# Helper: build user message (same for Gemini and Groq fallback)
# Uses string concat so dynamic fields ($json.x) are evaluated by n8n
# ─────────────────────────────────────────────────────────────────────────────
HASHTAG_RULES = (
    "FACEBOOK rules:\\n"
    "- 4 short paragraphs (hook, value/proof, result, CTA). Max 300 words total.\\n"
    "- Conversational B2B tone, not salesy.\\n"
    "- Paragraph 4 ends with: cratingexpress.com/request-a-quote/\\n"
    "- facebook_hashtags: EXACTLY 5 hashtags separated by spaces. "
    "#ISPM15 is MANDATORY. Pick 4 more from: "
    "#WoodCrating #CustomCrating #MiamiLogistics #IndustrialPackaging "
    "#FreightProtection #ShippingExperts #WoodPackaging #ExportCrating.\\n\\n"
    "INSTAGRAM rules:\\n"
    "- instagram_lines[0]: strong hook sentence with 1-2 emojis\\n"
    "- instagram_lines[1]: 2-3 key benefits joined in 1-2 sentences\\n"
    "- instagram_lines[2]: CTA line — exactly: Link in bio for a free quote\\n"
    "- instagram_lines[3]: empty string\\n"
    "- instagram_hashtags: EXACTLY 13 hashtags. "
    "3 high-competition from (#packaging #logistics #shipping #manufacturing #miami), "
    "5 medium from (#woodpackaging #customcrating #industrialpackaging #woodencrates #freightprotection), "
    "5 niche from (#ISPM15 #woodcrating #exportcrating #cratingexpress #miamilogistics #exportpackaging).\\n\\n"
    "SLIDES TEXT rules:\\n"
    "- texto_canva_titulo_en: 4-6 impactful English words (visual headline for the post image)\\n"
    "- texto_canva_subtitulo_en: 8-12 English words describing the key benefit"
)

JSON_SCHEMA = (
    'Return ONLY this JSON structure, no extra text:\\n'
    '{"texto_canva_titulo_en":"...","texto_canva_subtitulo_en":"...",'
    '"facebook_paragraphs":["p1","p2","p3","p4"],'
    '"facebook_hashtags":"#ISPM15 #WoodCrating ...",'
    '"instagram_lines":["hook","benefits","cta",""],'
    '"instagram_hashtags":"13 hashtags here"}'
)

# ── Gemini body (format: ={"contents":[...{{ JSON.stringify(...) }}...]}) ─────
def build_gemini_body(hook_ref, msg_ref, cta_ref, tema_ref, desc_ref, kw_ref):
    """hook_ref etc. are n8n expressions like $json.hook_es"""
    static_intro = (
        "Based on this weekly theme and Spanish content, write platform-specific "
        "English social media posts for Crating Express (wood packaging, Miami FL). "
        "Write natural English — do NOT translate literally.\\n\\n"
        "**Weekly Theme:** "
    )
    static_mid1 = "\\n**Theme Description:** "
    static_mid2 = "\\n**Keywords:** "
    static_mid3 = "\\n\\n**Spanish reference:**\\n- Hook: "
    static_mid4 = "\\n- Message: "
    static_mid5 = "\\n- CTA: "
    static_end  = f"\\n\\n{HASHTAG_RULES}\\n\\n{JSON_SCHEMA}"

    user_text = (
        f'"{static_intro}" + {tema_ref} + '
        f'"{static_mid1}" + ({desc_ref} || "") + '
        f'"{static_mid2}" + ({kw_ref} || "") + '
        f'"{static_mid3}" + {hook_ref} + '
        f'"{static_mid4}" + {msg_ref} + '
        f'"{static_mid5}" + {cta_ref} + '
        f'"{static_end}"'
    )

    sys_instr = (
        "You are a professional social media copywriter for Crating Express, "
        "a wood packaging and industrial crating company in Miami, FL. "
        "You write natural, authentic English for B2B audiences. "
        "Always respond with valid JSON only."
    )

    return (
        '={"contents":[{"role":"user","parts":[{"text":{{ JSON.stringify('
        + user_text +
        ') }}}]}],'
        '"systemInstruction":{"parts":[{"text":"' + sys_instr + '"}]},'
        '"generationConfig":{"temperature":0.72,"maxOutputTokens":2000,'
        '"responseMimeType":"application/json"}}'
    )

# ── Groq body (format ={{ JSON.stringify({...}) }}) ────────────────────────
def build_groq_body(hook_ref, msg_ref, cta_ref, tema_ref, desc_ref, kw_ref):
    static_intro = (
        "Based on this weekly theme and Spanish content, write platform-specific "
        "English social media posts for Crating Express (wood packaging, Miami FL). "
        "Write natural English — do NOT translate literally.\\\\n\\\\n"
        "Weekly Theme: "
    )
    static_mid1 = "\\\\nTheme Description: "
    static_mid2 = "\\\\nKeywords: "
    static_mid3 = "\\\\n\\\\nSpanish reference:\\\\n- Hook: "
    static_mid4 = "\\\\n- Message: "
    static_mid5 = "\\\\n- CTA: "
    static_end  = (
        "\\\\n\\\\n" +
        HASHTAG_RULES.replace('\n','\\\\n').replace('"','\\"') +
        "\\\\n\\\\n" +
        JSON_SCHEMA.replace('\n','\\\\n').replace('"','\\"')
    )

    user_content = (
        f"'{static_intro}' + {tema_ref} + "
        f"'{static_mid1}' + ({desc_ref} || '') + "
        f"'{static_mid2}' + ({kw_ref} || '') + "
        f"'{static_mid3}' + {hook_ref} + "
        f"'{static_mid4}' + {msg_ref} + "
        f"'{static_mid5}' + {cta_ref} + "
        f"'{static_end}'"
    )

    sys_msg = (
        "You are a professional social media copywriter for Crating Express, "
        "a wood packaging company in Miami FL. "
        "Write natural English for B2B audiences. "
        "Respond ONLY with valid JSON."
    )

    return (
        "={{ JSON.stringify({"
        "model: 'llama-3.3-70b-versatile',"
        "messages: ["
        "{role: 'system', content: '" + sys_msg + "'},"
        "{role: 'user', content: " + user_content + "}"
        "],"
        "temperature: 0.72,"
        "max_tokens: 2000,"
        "response_format: {type: 'json_object'}"
        "}) }}"
    )

# ─────────────────────────────────────────────────────────────────────────────
# Updated parsear-versiones-en code
# ─────────────────────────────────────────────────────────────────────────────
NEW_PARSEAR_CODE = r"""const aiResponse = $input.item.json.candidates?.[0]?.content?.parts?.[0]?.text
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
  const ctaIdx = lines.findIndex(l => /cratingexpress|→|free|visit|request|link in bio/i.test(l));
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
  required.forEach(function(h) {
    if (!seen.has(h)) { seen.add(h); final.push(h); }
  });
  found.forEach(function(h) {
    if (!seen.has(h) && final.length < count) { seen.add(h); final.push(h); }
  });
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

// ── Build final post texts ─────────────────────────────────────────────────
const fbBody = fromArray(versiones.facebook_paragraphs) || smartSplit(versiones.facebook, 2) || '';
const igBody = splitInstagram(versiones.instagram_lines, versiones.instagram) || '';

// Remove any hashtags already in the body, then append controlled ones
const fbClean = fbBody.replace(/#[A-Za-z0-9_]+/g, '').replace(/\n{3,}/g, '\n\n').trim();
const igClean = igBody.replace(/#[A-Za-z0-9_]+/g, '').replace(/\n{3,}/g, '\n\n').trim();

return [{
  json: {
    ...prevData,
    texto_canva_titulo_en:    versiones.texto_canva_titulo_en    || prevData.texto_canva_titulo  || '',
    texto_canva_subtitulo_en: versiones.texto_canva_subtitulo_en || prevData.texto_canva_subtitulo || '',
    post_facebook_en:  fbClean + '\n\n' + fbHashtags,
    post_instagram_en: igClean + '\n\n' + igHashtags,
  }
}];"""

# ─────────────────────────────────────────────────────────────────────────────
# Apply updates
# ─────────────────────────────────────────────────────────────────────────────
for n in nodes:

    if n['id'] == 'generar-versiones-en':
        n['parameters']['jsonBody'] = build_gemini_body(
            hook_ref="$json.hook_es",
            msg_ref="$json.mensaje_es",
            cta_ref="$json.cta_es",
            tema_ref="$json.tema_texto",
            desc_ref="$json.tema_descripcion",
            kw_ref="$json.keyword_principal"
        )
        print("Updated generar-versiones-en (Gemini): added titulo_en, subtitulo_en, hashtag fields + SEO rules")

    elif n['id'] == 'grok-versiones-en':
        parsear_ref = "$('\U0001F50D Parsear Post Español').item.json"
        n['parameters']['jsonBody'] = build_groq_body(
            hook_ref=f"{parsear_ref}.hook_es",
            msg_ref=f"{parsear_ref}.mensaje_es",
            cta_ref=f"{parsear_ref}.cta_es",
            tema_ref=f"{parsear_ref}.tema_texto",
            desc_ref=f"{parsear_ref}.tema_descripcion",
            kw_ref=f"{parsear_ref}.keyword_principal"
        )
        print("Updated grok-versiones-en (Groq fallback): same improvements")

    elif n['id'] == 'parsear-versiones-en':
        n['parameters']['jsCode'] = NEW_PARSEAR_CODE
        print("Updated parsear-versiones-en: hashtag enforcement (5 FB / 13 IG) + titulo_en/subtitulo_en")

# ─────────────────────────────────────────────────────────────────────────────
# Push
# ─────────────────────────────────────────────────────────────────────────────
payload = {
    "name": data["name"],
    "nodes": nodes,
    "connections": data["connections"],
    "settings": data.get("settings", {}),
    "staticData": data.get("staticData"),
}
resp = requests.put(
    f"https://n8n.mdarthurdigital.com/api/v1/workflows/{WORKFLOW_ID}",
    headers={"X-N8N-API-KEY": N8N_TOKEN, "Content-Type": "application/json"},
    json=payload
)
result = resp.json()
if "id" in result:
    print(f"\nSUCCESS! RRSS Automation actualizado: {result['id']}")
    print(f"Nodes: {len(result.get('nodes',[]))}")
else:
    print("ERROR:", json.dumps(result, indent=2)[:600])
