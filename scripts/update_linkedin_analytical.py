"""
LinkedIn workflow: actualiza el prompt de Groq para ángulo analítico/thought-leadership
y añade UTM tracking en parsear-post.
Workflow: CE LinkedIn - Publicar Blog Semanal (Hh0HsBADMs1zUZSb)
Solo se modifican: groq-linkedin (jsonBody) y parsear-post (jsCode).
"""
import json, requests

TOKEN = "N8N_TOKEN_HERE"
BASE  = "https://n8n.mdarthurdigital.com/api/v1"
H     = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID = "Hh0HsBADMs1zUZSb"

print("[LinkedIn] Leyendo workflow actual...")
data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]
print(f"  Nodes: {len(nodes)}, Name: {data['name']}")

# ── New groq-linkedin prompt: analytical / thought-leadership angle ─────────
# Rules per the marketing plan:
#   - Education first, selling never
#   - Analytical framing: what it means for freight forwarders / shippers
#   - One clear CTA
#   - Exactly 7 hashtags, #ISPM15 mandatory
#   - Use full brand name "Crating Express"
# Avoid single quotes inside content strings to prevent JS parse errors

NEW_GROQ_BODY = (
    "={{ JSON.stringify({ "
    "model: 'llama-3.3-70b-versatile', "
    "messages: [{ "
    "role: 'system', "
    "content: 'You are a B2B thought leadership writer for Crating Express, a wood packaging and industrial crating company in Miami FL. "
    "You write analytical LinkedIn posts for freight forwarders, logistics managers, and industrial shippers. "
    "Education first, never salesy. Always respond with valid JSON only.' "
    "}, { "
    "role: 'user', "
    "content: "
    "'Write an analytical LinkedIn post in ENGLISH based on this blog article.\\n\\n"
    "IMPORTANT: This is NOT a blog summary. Reframe the content as an industry insight or thought leadership piece. "
    "Focus on what this topic means for freight professionals and shippers.\\n\\n"
    "ANALYTICAL ANGLES (pick the one that fits best):\\n"
    "- Industry problem + how expert packaging solves it\\n"
    "- Most common mistake shippers make regarding this topic\\n"
    "- Regulatory or compliance insight (ISPM-15, export requirements, international standards)\\n"
    "- Cost and risk framing: what poor packaging decisions actually cost\\n\\n"
    "FORMATTING RULES (follow exactly):\\n"
    "- Structure: 1 strong hook line (contrarian fact, industry pain point, or bold stat) "
    "=> blank line => 2 short analytical paragraphs (2-3 sentences each) "
    "=> blank line => 1 CTA line with article URL "
    "=> blank line => exactly 7 hashtags on their own line\\n"
    "- Max 250 words total\\n"
    "- Tone: expert, analytical. Education precedes selling.\\n"
    "- ONE clear CTA only. No multiple CTAs.\\n"
    "- Use full name Crating Express — never abbreviate.\\n\\n"
    "HASHTAG RULES:\\n"
    "- EXACTLY 7 hashtags on the last line, nothing else on that line\\n"
    "- #ISPM15 is MANDATORY in every post\\n"
    "- The other 6 must be specific to the article topic (no generic tags like #Business or #Tips)\\n\\n"
    "Blog title: ' + $json.titulo + '\\n"
    "Blog excerpt: ' + $json.extracto + '\\n"
    "Article URL: ' + $json.url + '\\n\\n"
    "Respond ONLY with this JSON:\\n"
    "{\"post_text\": \"Hook line.\\\\n\\\\nParagraph 1.\\\\n\\\\nParagraph 2.\\\\n\\\\n"
    "Read the full analysis: [ARTICLE URL]\\\\n\\\\n#ISPM15 #Tag2 #Tag3 #Tag4 #Tag5 #Tag6 #Tag7\", "
    "\"hook\": \"first sentence only\"}' "
    "}], "
    "temperature: 0.7, "
    "max_tokens: 700, "
    "response_format: { type: 'json_object' } "
    "}) }}"
)

# ── New parsear-post: same logic + UTM tracking ─────────────────────────────
NEW_PARSEAR_POST = r"""const aiResponse = $input.item.json.choices?.[0]?.message?.content || '{}';

let post;
try { post = JSON.parse(aiResponse); }
catch(e) {
  const match = aiResponse.match(/\{[\s\S]*\}/);
  post = match ? JSON.parse(match[0]) : { post_text: aiResponse };
}

const blog = $('\U0001F527 Seleccionar Siguiente Blog').item.json;

// ── UTM tracking: tag any cratingexpress.com link in the post ──────────────
function addUtm(text) {
  if (!text) return text;
  return text.replace(
    /https?:\/\/(www\.)?cratingexpress\.com(\/[^\s"'<>\)]*)?/g,
    function(match) {
      if (match.includes('utm_source')) return match;
      const sep = match.includes('?') ? '&' : '?';
      return match + sep + 'utm_source=linkedin&utm_medium=social&utm_campaign=blog-semanal';
    }
  );
}

return [{
  json: {
    wp_id:              blog.wp_id,
    titulo:             blog.titulo,
    url:                blog.url,
    fecha_wp:           blog.fecha_wp,
    featured_image_url: blog.featured_image_url || '',
    post_text:          addUtm(post.post_text || ''),
    hook:               post.hook || ''
  }
}];"""

# ── Apply changes ────────────────────────────────────────────────────────────
updated = []
for n in nodes:
    if n["id"] == "groq-linkedin":
        n["parameters"]["jsonBody"] = NEW_GROQ_BODY
        updated.append("groq-linkedin (prompt analítico + una sola CTA)")
    elif n["id"] == "parsear-post":
        n["parameters"]["jsCode"] = NEW_PARSEAR_POST
        updated.append("parsear-post (UTM en post_text)")

if updated:
    for u in updated:
        print(f"  → Actualizado: {u}")
else:
    print("  ⚠️  No se encontraron los nodes esperados")
    print("  IDs disponibles:", [n["id"] for n in nodes])

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
    print(f"  ✅ CE LinkedIn - Publicar Blog Semanal — actualizado OK")
else:
    print(f"  ❌ ERROR:", json.dumps(result)[:300])
