"""
Actualiza RRSS Automation (HqKUsOwwguIYQbsU) — cambios quirúrgicos:
  • Facebook párr. 2 → prueba social (clientes Miami)
  • Facebook párr. 3 → línea de urgencia natural (plazo de embarque / capacidad)
  • Facebook párr. 4 → CTA con WhatsApp + quote link
  • Instagram línea 2 → CTA con WhatsApp number

Solo se tocan: generar-versiones-en  y  grok-versiones-en
El nodo parsear-versiones-en NO se modifica.

Ejecución : python3 update_rrss_urgencia_wa.py
Requiere   : pip install requests
Antes      : reemplaza N8N_TOKEN_HERE con tu token real de n8n.
"""
import json
import requests

TOKEN       = "N8N_TOKEN_HERE"
BASE        = "https://n8n.mdarthurdigital.com/api/v1"
H           = {"X-N8N-API-KEY": TOKEN, "Content-Type": "application/json"}
WF_ID       = "HqKUsOwwguIYQbsU"
WA_LINK     = "wa.me/17863948380"
QUOTE_LINK  = "cratingexpress.com/request-a-quote/"

print("[RRSS] Leyendo workflow...")
data  = requests.get(f"{BASE}/workflows/{WF_ID}", headers=H).json()
nodes = data["nodes"]
print(f"  Nodes: {len(nodes)} | {data['name']}")

# ════════════════════════════════════════════════════════════════════════════
# Reglas actualizadas que se inyectan en ambos prompts (Gemini + Groq)
# ════════════════════════════════════════════════════════════════════════════
HASHTAG_RULES = (
    "FACEBOOK rules:\n"
    "- 4 short paragraphs. Max 320 words total. Conversational B2B tone, not salesy.\n"
    "- Paragraph 1: hook — open with an insight or pain point about freight damage / crating.\n"
    "- Paragraph 2: social proof — mention working with Miami freight forwarders, "
    "logistics companies, or industrial exporters. Keep it specific and credible.\n"
    "- Paragraph 3: urgency — one natural line tied to real shipping realities: "
    "port deadlines, Q2/Q3 peak season, 48–72 hr lead times, or limited custom crate capacity. "
    "Do NOT invent fake discounts or countdowns.\n"
    "- Paragraph 4: CTA — end with exactly these two links on separate lines:\n"
    f"  💬 WhatsApp us: {WA_LINK}\n"
    f"  📋 Free quote: {QUOTE_LINK}\n"
    "- facebook_hashtags: EXACTLY 5 hashtags separated by spaces. "
    "#ISPM15 is MANDATORY. Pick 4 more from: "
    "#WoodCrating #CustomCrating #MiamiLogistics #IndustrialPackaging "
    "#FreightProtection #ShippingExperts #WoodPackaging #ExportCrating.\n\n"
    "INSTAGRAM rules:\n"
    "- instagram_lines[0]: strong hook sentence with 1-2 emojis\n"
    "- instagram_lines[1]: 2-3 key benefits — include one credibility cue "
    "(e.g. ISPM-15 certified, trusted by Miami exporters, 48-hr turnaround)\n"
    f"- instagram_lines[2]: CTA line — exactly: "
    f"\U0001f4e9 WhatsApp +1\u202f786-394-8380 or link in bio for a free quote\n"
    "- instagram_lines[3]: empty string\n"
    "- instagram_hashtags: EXACTLY 13 hashtags. "
    "3 high-competition from (#packaging #logistics #shipping #manufacturing #miami), "
    "5 medium from (#woodpackaging #customcrating #industrialpackaging #woodencrates #freightprotection), "
    "5 niche from (#ISPM15 #woodcrating #exportcrating #cratingexpress #miamilogistics #exportpackaging).\n\n"
    "SLIDES TEXT rules:\n"
    "- texto_canva_titulo_en: 4-6 impactful English words (visual headline for the post image)\n"
    "- texto_canva_subtitulo_en: 8-12 English words describing the key benefit"
)

JSON_SCHEMA = (
    'Return ONLY this JSON structure, no extra text:\n'
    '{"texto_canva_titulo_en":"...","texto_canva_subtitulo_en":"...",'
    '"facebook_paragraphs":["p1","p2","p3","p4"],'
    '"facebook_hashtags":"#ISPM15 #WoodCrating ...",'
    '"instagram_lines":["hook","benefits","cta",""],'
    '"instagram_hashtags":"13 hashtags here"}'
)

SYS_MSG = (
    "You are a professional social media copywriter for Crating Express, "
    "a wood packaging and industrial crating company in Miami, FL. "
    "You write natural, authentic English for B2B audiences. "
    "Always respond with valid JSON only."
)

# ════════════════════════════════════════════════════════════════════════════
# Builder helpers (same pattern as update_rrss_automation.py)
# ════════════════════════════════════════════════════════════════════════════
def build_gemini_body(hook_ref, msg_ref, cta_ref, tema_ref, desc_ref, kw_ref):
    static_intro = (
        "Based on this weekly theme and Spanish content, write platform-specific "
        "English social media posts for Crating Express (wood packaging, Miami FL). "
        "Write natural English — do NOT translate literally.\\n\\n"
        "Weekly Theme: "
    )
    static_mid  = (
        "\\nTheme Description: ",
        "\\nKeywords: ",
        "\\n\\nSpanish reference:\\n- Hook: ",
        "\\n- Message: ",
        "\\n- CTA: ",
    )
    static_end = f"\\n\\n{HASHTAG_RULES}\\n\\n{JSON_SCHEMA}"

    user_text = (
        f'"{static_intro}" + {tema_ref} + '
        f'"{static_mid[0]}" + ({desc_ref} || "") + '
        f'"{static_mid[1]}" + ({kw_ref} || "") + '
        f'"{static_mid[2]}" + {hook_ref} + '
        f'"{static_mid[3]}" + {msg_ref} + '
        f'"{static_mid[4]}" + {cta_ref} + '
        f'"{static_end}"'
    )

    return (
        '={"contents":[{"role":"user","parts":[{"text":{{ JSON.stringify('
        + user_text +
        ') }}}]}],'
        '"systemInstruction":{"parts":[{"text":"' + SYS_MSG + '"}]},'
        '"generationConfig":{"temperature":0.72,"maxOutputTokens":2000,'
        '"responseMimeType":"application/json"}}'
    )


def build_groq_body(hook_ref, msg_ref, cta_ref, tema_ref, desc_ref, kw_ref):
    static_intro = (
        "Based on this weekly theme and Spanish content, write platform-specific "
        "English social media posts for Crating Express (wood packaging, Miami FL). "
        "Write natural English — do NOT translate literally.\\\\n\\\\n"
        "Weekly Theme: "
    )
    static_mid = (
        "\\\\nTheme Description: ",
        "\\\\nKeywords: ",
        "\\\\n\\\\nSpanish reference:\\\\n- Hook: ",
        "\\\\n- Message: ",
        "\\\\n- CTA: ",
    )
    rules_escaped = (
        HASHTAG_RULES.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\\\n")
    )
    schema_escaped = (
        JSON_SCHEMA.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\\\n")
    )
    static_end = f"\\\\n\\\\n{rules_escaped}\\\\n\\\\n{schema_escaped}"

    user_content = (
        f"'{static_intro}' + {tema_ref} + "
        f"'{static_mid[0]}' + ({desc_ref} || '') + "
        f"'{static_mid[1]}' + ({kw_ref} || '') + "
        f"'{static_mid[2]}' + {hook_ref} + "
        f"'{static_mid[3]}' + {msg_ref} + "
        f"'{static_mid[4]}' + {cta_ref} + "
        f"'{static_end}'"
    )

    sys_msg_safe = SYS_MSG.replace('"', '\\"')

    return (
        "={{ JSON.stringify({"
        "model: 'llama-3.3-70b-versatile',"
        "messages: ["
        "{role: 'system', content: '" + sys_msg_safe + "'},"
        "{role: 'user', content: " + user_content + "}"
        "],"
        "temperature: 0.72,"
        "max_tokens: 2000,"
        "response_format: {type: 'json_object'}"
        "}) }}"
    )


# ════════════════════════════════════════════════════════════════════════════
# Apply — only touch the 2 generation nodes
# ════════════════════════════════════════════════════════════════════════════
updated = []
for n in nodes:
    if n["id"] == "generar-versiones-en":
        n["parameters"]["jsonBody"] = build_gemini_body(
            hook_ref="$json.hook_es",
            msg_ref="$json.mensaje_es",
            cta_ref="$json.cta_es",
            tema_ref="$json.tema_texto",
            desc_ref="$json.tema_descripcion",
            kw_ref="$json.keyword_principal",
        )
        updated.append("generar-versiones-en (Gemini)")

    elif n["id"] == "grok-versiones-en":
        pref = "$('\U0001f50d Parsear Post Español').item.json"
        n["parameters"]["jsonBody"] = build_groq_body(
            hook_ref=f"{pref}.hook_es",
            msg_ref=f"{pref}.mensaje_es",
            cta_ref=f"{pref}.cta_es",
            tema_ref=f"{pref}.tema_texto",
            desc_ref=f"{pref}.tema_descripcion",
            kw_ref=f"{pref}.keyword_principal",
        )
        updated.append("grok-versiones-en (Groq fallback)")

if updated:
    for u in updated:
        print(f"  ✓ {u}")
else:
    print("  ⚠️  Nodos no encontrados — IDs disponibles:",
          [n["id"] for n in nodes])

# ════════════════════════════════════════════════════════════════════════════
# Push
# ════════════════════════════════════════════════════════════════════════════
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
    print(f"\n  ✅ RRSS Automation actualizado OK")
    print(f"     Cambios: urgencia + WhatsApp CTA + prueba social")
else:
    print("  ❌ ERROR:", json.dumps(result, indent=2)[:500])
