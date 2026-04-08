import json, requests

N8N_TOKEN = "N8N_JWT_TOKEN_HERE"
WORKFLOW_ID = "38fO1D5uJpVUDMqm"
AIRTABLE_TOKEN = "AIRTABLE_TOKEN_HERE"

with open('/tmp/unified_current.json') as f:
    data = json.load(f)
# Re-fetch latest version
resp = requests.get(
    f"https://n8n.mdarthurdigital.com/api/v1/workflows/{WORKFLOW_ID}",
    headers={"X-N8N-API-KEY": N8N_TOKEN}
)
data = resp.json()
nodes = data['nodes']

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1: get-airtable → fetch ALL published WP_Post_IDs (not just last 1)
# ─────────────────────────────────────────────────────────────────────────────
for n in nodes:
    if n['id'] == 'get-airtable':
        n['parameters']['queryParameters']['parameters'] = [
            {"name": "fields[]",  "value": "WP_Post_ID"},
            {"name": "maxRecords","value": "500"}
        ]
        print("Fixed get-airtable: now fetches all published WP_Post_IDs")

# ─────────────────────────────────────────────────────────────────────────────
# FIX 2: select-blog → set-based logic (no repeats, detects new blogs by ID)
# ─────────────────────────────────────────────────────────────────────────────
select_blog_code = r"""// Blogs ordered ASC by date from WordPress
const blogs = $('\U0001F4F0 Obtener Blogs de WordPress').all().map(i => i.json);
const airtableData = $('\U0001F4CB \u00DAltimo Publicado (Airtable)').item.json;

// Build SET of every WP_Post_ID already published in Blog_Multicanal
const published = new Set();
if (airtableData.records) {
  airtableData.records.forEach(function(r) {
    if (r.fields && r.fields.WP_Post_ID) {
      published.add(Number(r.fields.WP_Post_ID));
    }
  });
}

// Find the FIRST blog (chronological order) that has NOT been published yet
let siguiente = null;
for (let i = 0; i < blogs.length; i++) {
  if (!published.has(Number(blogs[i].id))) {
    siguiente = blogs[i];
    break;
  }
}

// All blogs published → restart cycle from the first one
if (!siguiente) {
  siguiente = blogs[0];
}

if (!siguiente) throw new Error('No blogs found in WordPress');

function stripHtml(h) {
  return (h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const img =
  siguiente._embedded &&
  siguiente._embedded['wp:featuredmedia'] &&
  siguiente._embedded['wp:featuredmedia'][0]
    ? siguiente._embedded['wp:featuredmedia'][0].source_url || ''
    : '';

return [{
  json: {
    wp_id: siguiente.id,
    titulo: siguiente.title ? siguiente.title.rendered || '' : '',
    extracto: stripHtml(siguiente.excerpt ? siguiente.excerpt.rendered || '' : '').slice(0, 500),
    url: siguiente.link,
    fecha_wp: siguiente.date,
    featured_image_url: img
  }
}];"""

# ─────────────────────────────────────────────────────────────────────────────
# FIX 3: groq-multi → comprehensive English SEO prompt with specific hashtag pools
#          Uses cross-node reference $('🔧 Seleccionar Blog').item.json
#          so blog data is NOT lost after the image download step
# ─────────────────────────────────────────────────────────────────────────────

# Build the Groq jsonBody expression (n8n expression → JavaScript)
# Using single quotes for JS strings, avoiding apostrophes in static content

system_msg = (
    "You are an expert social media strategist and SEO specialist for Crating Express, "
    "a wood packaging and custom crating company based in Miami FL. "
    "You write B2B industrial content. "
    "ALL output MUST be in English. "
    "Respond ONLY with valid JSON, zero extra text."
)

hashtag_rules = (
    "LINKEDIN HASHTAG RULE: The LAST line of the linkedin field MUST contain "
    "EXACTLY 7 hashtags separated by spaces, nothing else. "
    "#ISPM15 is MANDATORY in every post. "
    "Pick the other 6 from this pool (choose based on article topic): "
    "#WoodCrating #CustomCrating #WoodPackaging #IndustrialPackaging "
    "#FreightProtection #ExportCrating #HeavyEquipmentShipping #MiamiLogistics "
    "#ShippingCrates #SupplyChain #ExportPackaging #B2BLogistics #ManufacturingMiami. "
    "NEVER use generic hashtags like #business #marketing #tips #entrepreneur.\\n\\n"
    "INSTAGRAM HASHTAG RULE: After a blank line add EXACTLY 13 hashtags. "
    "Mix: 3 high-competition from (#packaging #logistics #shipping #manufacturing #miami), "
    "5 medium-competition from (#woodpackaging #customcrating #industrialpackaging "
    "#woodencrates #freightprotection #heavyequipment #palletcrating), "
    "5 niche from (#ISPM15 #woodcrating #exportcrating #cratingexpress #miamilogistics "
    "#exportpackaging #heavyequipmentcrating #industrialshipping)."
)

platform_specs = (
    "PLATFORM CONTENT REQUIREMENTS (all in English):\\n\\n"
    "linkedin: 200-250 words total. "
    "First 2 lines = strong hook (pain point or industry stat, visible before see more). "
    "Body = 2-3 short paragraphs with industry-specific B2B keywords. "
    "CTA line with article URL. "
    "Blank line. "
    "Final line = EXACTLY 7 hashtags (see LINKEDIN HASHTAG RULE above).\\n\\n"
    "instagram: 80-120 word caption. "
    "First line = hook sentence, no hashtags. "
    "2-3 emojis placed naturally in the text. "
    "End caption with a CTA (example: Link in bio to read more). "
    "Blank line. "
    "EXACTLY 13 hashtags (see INSTAGRAM HASHTAG RULE above).\\n\\n"
    "facebook: 120-150 words. "
    "Open with an engaging question or a bold industry fact. "
    "Conversational tone. 1-2 emojis. "
    "End with: Read more (article URL). "
    "4-5 relevant hashtags.\\n\\n"
    "email_subject: Maximum 45 characters. "
    "Curiosity-driven or benefit-focused. "
    "No spam trigger words. "
    "Do NOT start with New article or New post.\\n\\n"
    "email_body: Valid HTML. H2 heading. 2 short paragraphs (150-200 words total). "
    "CTA button linked to article URL. Professional Crating Express closing."
)

full_instructions = hashtag_rules + "\\n\\n" + platform_specs

# The n8n expression — uses cross-node ref to Seleccionar Blog to avoid data loss after image download
groq_body = (
    "={{ JSON.stringify({"
    "model: 'llama-3.3-70b-versatile',"
    "messages: ["
    "{ role: 'system', content: '" + system_msg + "' },"
    "{ role: 'user', content: "
    "'BLOG TITLE: ' + $('" + "\\U0001F527" + " Seleccionar Blog').item.json.titulo + "
    "'\\nBLOG EXCERPT: ' + ($('" + "\\U0001F527" + " Seleccionar Blog').item.json.extracto || '').slice(0,300) + "
    "'\\nARTICLE URL: ' + $('" + "\\U0001F527" + " Seleccionar Blog').item.json.url + "
    "'\\n\\n" + full_instructions + "' "
    "}"
    "],"
    "temperature: 0.7,"
    "max_tokens: 2000,"
    "response_format: { type: 'json_object' }"
    "}) }}"
)

# ─────────────────────────────────────────────────────────────────────────────
# FIX 4: parse-content → use cross-node ref + enforce exactly 7 LinkedIn hashtags
# ─────────────────────────────────────────────────────────────────────────────
parse_code = r"""const raw = $input.item.json.choices && $input.item.json.choices[0]
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

  const REQUIRED   = ['#ISPM15'];
  const POOL = [
    '#WoodCrating','#CustomCrating','#WoodPackaging','#IndustrialPackaging',
    '#FreightProtection','#ExportCrating','#HeavyEquipmentShipping','#MiamiLogistics',
    '#ShippingCrates','#SupplyChain','#ExportPackaging','#B2BLogistics','#ManufacturingMiami'
  ];

  // Extract hashtags present in the AI response
  const found = (text.match(/#[A-Za-z0-9_]+/g) || []);

  // Build final list: required → found → fill from pool
  const seen = new Set();
  const hashtags = [];

  REQUIRED.forEach(function(h) {
    if (!seen.has(h)) { seen.add(h); hashtags.push(h); }
  });
  found.forEach(function(h) {
    if (!seen.has(h) && hashtags.length < 7) { seen.add(h); hashtags.push(h); }
  });
  for (let i = 0; i < POOL.length && hashtags.length < 7; i++) {
    if (!seen.has(POOL[i])) { seen.add(POOL[i]); hashtags.push(POOL[i]); }
  }

  const final7 = hashtags.slice(0, 7);

  // Remove all hashtags from body text, append controlled 7
  const cleanText = text.replace(/#[A-Za-z0-9_]+/g, '').replace(/\n{3,}/g, '\n\n').trim();
  return cleanText + '\n\n' + final7.join(' ');
}

const linkedinFinal = enforceLinkedInHashtags(content.linkedin || '');

// Pass image binary from download node so LinkedIn can upload it directly
let imgBinary = {};
try {
  imgBinary = $('\u2B07\uFE0F Descargar Imagen').item.binary || {};
} catch(e) {}

return [{
  json: {
    wp_id: blog.wp_id,
    titulo: blog.titulo,
    extracto: blog.extracto || '',
    url: blog.url,
    fecha_wp: blog.fecha_wp,
    featured_image_url: blog.featured_image_url || '',
    linkedin:      linkedinFinal,
    instagram:     content.instagram     || '',
    facebook:      content.facebook      || '',
    email_subject: content.email_subject || ('Blog Update: ' + blog.titulo).slice(0, 45),
    email_body:    content.email_body    || ''
  },
  binary: imgBinary
}];"""

# ─────────────────────────────────────────────────────────────────────────────
# Apply all fixes
# ─────────────────────────────────────────────────────────────────────────────
for n in nodes:
    if n['id'] == 'select-blog':
        n['parameters']['jsCode'] = select_blog_code
        print("Fixed select-blog: set-based no-repeat + new blog detection")

    elif n['id'] == 'groq-multi':
        n['parameters']['jsonBody'] = groq_body
        n['parameters']['sendHeaders'] = True
        print("Fixed groq-multi: English SEO prompt + specific hashtag pools + cross-node ref")

    elif n['id'] == 'parse-content':
        n['parameters']['jsCode'] = parse_code
        print("Fixed parse-content: cross-node ref + LinkedIn hashtag enforcement")

# ─────────────────────────────────────────────────────────────────────────────
# Push to n8n (keep same connections — only node content changed)
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
    print(f"\nSUCCESS! Workflow actualizado: {result['id']}")
    print(f"Nodes: {len(result.get('nodes',[]))}")
else:
    print("ERROR:", json.dumps(result, indent=2)[:600])
