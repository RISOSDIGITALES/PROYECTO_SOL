import json, requests

N8N_TOKEN = "N8N_JWT_TOKEN_HERE"
AIRTABLE_TOKEN = "AIRTABLE_TOKEN_HERE"
GROQ_KEY = "GROQ_API_KEY_HERE"

# Code: Select next blog (fixed type mismatch)
select_blog_code = """const blogs = $('\\u{1F4F0} Obtener Blogs de WordPress').all().map(i => i.json);
const ultimoData = $('\\u{1F4CB} \\u00DAltimo Publicado (Airtable)').item.json;
const ultimo = ultimoData.records && ultimoData.records[0] ? ultimoData.records[0].fields : null;
const ultimoWpId = ultimo && ultimo.WP_Post_ID ? Number(ultimo.WP_Post_ID) : 0;
const idx = ultimoWpId > 0 ? blogs.findIndex(function(b){ return Number(b.id) === ultimoWpId; }) : -1;
let siguiente = idx >= 0 ? blogs[idx + 1] : blogs[0];
if (!siguiente) siguiente = blogs[0];
if (!siguiente) throw new Error('No hay blogs en WordPress');
function stripHtml(h){ return (h||'').replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim(); }
const img = siguiente._embedded && siguiente._embedded['wp:featuredmedia'] && siguiente._embedded['wp:featuredmedia'][0] ? siguiente._embedded['wp:featuredmedia'][0].source_url||'' : '';
return [{ json: {
  wp_id: siguiente.id,
  titulo: siguiente.title ? siguiente.title.rendered||'' : '',
  extracto: stripHtml(siguiente.excerpt ? siguiente.excerpt.rendered||'' : '').slice(0,500),
  url: siguiente.link,
  fecha_wp: siguiente.date,
  featured_image_url: img
}}];"""

# Code: Parse multi-channel Groq response
parse_code = """const raw = $input.item.json.choices && $input.item.json.choices[0] ? $input.item.json.choices[0].message.content || '{}' : '{}';
let content;
try { content = JSON.parse(raw); }
catch(e) {
  const m = raw.match(/\\{[\\s\\S]*\\}/);
  content = m ? JSON.parse(m[0]) : {};
}
const blog = $('\\u{1F527} Seleccionar Blog').item.json;
return [{ json: {
  wp_id: blog.wp_id,
  titulo: blog.titulo,
  url: blog.url,
  fecha_wp: blog.fecha_wp,
  featured_image_url: blog.featured_image_url || '',
  linkedin: content.linkedin || '',
  instagram: content.instagram || '',
  facebook: content.facebook || '',
  email_subject: content.email_subject || ('Nuevo artículo: ' + blog.titulo),
  email_body: content.email_body || ''
}}];"""

groq_prompt = (
    "You are a social media content expert for Crating Express, a wood packaging and crating company in Miami. "
    "Generate optimized content for 4 platforms based on this blog article.\\n\\n"
    "Blog title: \" + $json.titulo + \"\\n"
    "Blog excerpt: \" + $json.extracto + \"\\n"
    "Article URL: \" + $json.url + \"\\n\\n"
    "RESPOND ONLY with this exact JSON (no extra text):\\n"
    "{\\\"linkedin\\\": \\\"Professional post 200-250 words. Structure: hook + 2 paragraphs + CTA with URL + blank line + exactly 7 hashtags on own line. Must include #ISPM15. Tone: expert, not salesy.\\\","
    "\\\"instagram\\\": \\\"Visual caption 80-100 words. 2-3 emojis. Strong CTA. 12-15 niche hashtags at end.\\\","
    "\\\"facebook\\\": \\\"Conversational post 100-150 words. Engaging question or CTA. 3-5 hashtags.\\\","
    "\\\"email_subject\\\": \\\"Catchy newsletter subject max 60 chars\\\","
    "\\\"email_body\\\": \\\"HTML newsletter body 150-200 words, professional, include article link button\\\"}"
)

groq_body = (
    "={{ JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: ["
    "{ role: 'system', content: 'You are a social media content expert for Crating Express, a wood packaging company in Miami. Always respond with valid JSON only.' },"
    "{ role: 'user', content: 'Generate platform-optimized content for this blog.\\\\n\\\\nBlog title: ' + $json.titulo + '\\\\nBlog excerpt: ' + $json.extracto + '\\\\nArticle URL: ' + $json.url + "
    "'\\\\n\\\\nRespond ONLY with valid JSON:\\\\n{\"linkedin\": \"Professional 200-250 words, hook+paragraphs+CTA+URL+7 hashtags including #ISPM15\", \"instagram\": \"80-100 words, 2-3 emojis, 12-15 hashtags\", \"facebook\": \"100-150 words conversational, 3-5 hashtags\", \"email_subject\": \"max 60 chars subject\", \"email_body\": \"HTML 150-200 words with article link\"}' }"
    "], temperature: 0.7, max_tokens: 1500, response_format: { type: 'json_object' } }) }}"
)

workflow = {
    "name": "CE Blog - Publicar en Todas las Redes",
    "nodes": [
        {
            "id": "trigger-schedule",
            "name": "\u23f0 Trigger Martes y Jueves 9am",
            "type": "n8n-nodes-base.scheduleTrigger",
            "typeVersion": 1.2,
            "position": [0, 300],
            "parameters": {
                "rule": {"interval": [{"field": "weeks", "weeksInterval": 1, "triggerAtDay": [2,4], "triggerAtHour": 9, "triggerAtMinute": 0}]}
            }
        },
        {
            "id": "trigger-manual",
            "name": "\u25b6\ufe0f Ejecutar Manualmente",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [0, 500],
            "parameters": {}
        },
        {
            "id": "get-blogs",
            "name": "\U0001f4f0 Obtener Blogs de WordPress",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [240, 300],
            "parameters": {
                "url": "https://cratingexpress.com/wp-json/wp/v2/posts",
                "sendQuery": True,
                "queryParameters": {"parameters": [
                    {"name": "per_page", "value": "100"},
                    {"name": "status", "value": "publish"},
                    {"name": "orderby", "value": "date"},
                    {"name": "order", "value": "asc"},
                    {"name": "_fields", "value": "id,title,excerpt,link,date,content,_links"},
                    {"name": "_embed", "value": "wp:featuredmedia"}
                ]},
                "options": {}
            }
        },
        {
            "id": "get-airtable",
            "name": "\U0001f4cb \u00daltimo Publicado (Airtable)",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [480, 300],
            "parameters": {
                "url": "https://api.airtable.com/v0/appUOYi54iBfaDcLn/Blog_Multicanal",
                "sendQuery": True,
                "queryParameters": {"parameters": [
                    {"name": "sort[0][field]", "value": "Fecha_Publicacion"},
                    {"name": "sort[0][direction]", "value": "desc"},
                    {"name": "maxRecords", "value": "1"}
                ]},
                "sendHeaders": True,
                "headerParameters": {"parameters": [
                    {"name": "Authorization", "value": f"Bearer {AIRTABLE_TOKEN}"}
                ]},
                "options": {},
                "continueOnFail": True
            },
            "continueOnFail": True
        },
        {
            "id": "select-blog",
            "name": "\U0001f527 Seleccionar Blog",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [720, 300],
            "parameters": {"jsCode": select_blog_code}
        },
        {
            "id": "download-image",
            "name": "\u2b07\ufe0f Descargar Imagen",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [960, 300],
            "parameters": {
                "url": "={{ $json.featured_image_url }}",
                "options": {}
            },
            "continueOnFail": True
        },
        {
            "id": "groq-multi",
            "name": "\U0001f916 Groq: Generar Contenido Multi-Canal",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1200, 300],
            "parameters": {
                "method": "POST",
                "url": "https://api.groq.com/openai/v1/chat/completions",
                "sendHeaders": True,
                "headerParameters": {"parameters": [
                    {"name": "Authorization", "value": f"Bearer {GROQ_KEY}"},
                    {"name": "Content-Type", "value": "application/json"}
                ]},
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": groq_body,
                "options": {}
            }
        },
        {
            "id": "parse-content",
            "name": "\U0001f50d Parsear Contenido",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1440, 300],
            "parameters": {"jsCode": parse_code}
        },
        {
            "id": "publish-linkedin",
            "name": "\U0001f4e2 Publicar en LinkedIn",
            "type": "n8n-nodes-base.linkedIn",
            "typeVersion": 1,
            "position": [1680, 180],
            "parameters": {
                "postAs": "organization",
                "organization": "112205115",
                "text": "={{ $('\U0001f50d Parsear Contenido').item.json.linkedin }}",
                "shareMediaCategory": "IMAGE",
                "additionalFields": {
                    "title": "={{ $('\U0001f50d Parsear Contenido').item.json.titulo }}"
                }
            }
        },
        {
            "id": "publish-facebook",
            "name": "\U0001f4d8 Publicar en Facebook \u26a0\ufe0f Pendiente Token",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1680, 340],
            "continueOnFail": True,
            "parameters": {
                "method": "POST",
                "url": "https://graph.facebook.com/v19.0/1713965015486703/feed",
                "sendQuery": True,
                "queryParameters": {"parameters": [
                    {"name": "message", "value": "={{ $('\U0001f50d Parsear Contenido').item.json.facebook }}"},
                    {"name": "access_token", "value": "REEMPLAZAR_CON_PAGE_ACCESS_TOKEN"}
                ]},
                "options": {}
            }
        },
        {
            "id": "publish-instagram",
            "name": "\U0001f4f8 Publicar en Instagram \u26a0\ufe0f Pendiente Token",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1680, 500],
            "continueOnFail": True,
            "parameters": {
                "method": "POST",
                "url": "https://graph.facebook.com/v19.0/INSTAGRAM_ACCOUNT_ID/media",
                "sendQuery": True,
                "queryParameters": {"parameters": [
                    {"name": "caption", "value": "={{ $('\U0001f50d Parsear Contenido').item.json.instagram }}"},
                    {"name": "image_url", "value": "={{ $('\U0001f50d Parsear Contenido').item.json.featured_image_url }}"},
                    {"name": "access_token", "value": "REEMPLAZAR_CON_PAGE_ACCESS_TOKEN"}
                ]},
                "options": {}
            }
        },
        {
            "id": "send-email",
            "name": "\U0001f4e7 Enviar Newsletter",
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2.1,
            "position": [1680, 660],
            "parameters": {
                "sendTo": "risosadmi@gmail.com",
                "subject": "={{ $('\U0001f50d Parsear Contenido').item.json.email_subject }}",
                "message": "={{ $('\U0001f50d Parsear Contenido').item.json.email_body }}",
                "options": {"appendAttribution": False}
            }
        },
        {
            "id": "save-airtable",
            "name": "\U0001f4be Guardar en Airtable",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1920, 340],
            "parameters": {
                "method": "POST",
                "url": "https://api.airtable.com/v0/appUOYi54iBfaDcLn/Blog_Multicanal",
                "sendHeaders": True,
                "headerParameters": {"parameters": [
                    {"name": "Authorization", "value": f"Bearer {AIRTABLE_TOKEN}"},
                    {"name": "Content-Type", "value": "application/json"}
                ]},
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={{ JSON.stringify({ records: [{ fields: { WP_Post_ID: $('\\U0001f50d Parsear Contenido').item.json.wp_id, Titulo: $('\\U0001f50d Parsear Contenido').item.json.titulo, URL: $('\\U0001f50d Parsear Contenido').item.json.url, Fecha_Publicacion: new Date().toISOString().split('T')[0], Estado: 'Publicado' } }] }) }}",
                "options": {}
            }
        },
        {
            "id": "notify",
            "name": "\U0001f514 Notificar Publicaci\u00f3n",
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2.1,
            "position": [2160, 340],
            "parameters": {
                "sendTo": "risosadmi@gmail.com",
                "subject": "\u2705 Blog publicado en todas las redes: {{ $('\U0001f50d Parsear Contenido').item.json.titulo }}",
                "message": "<h2>\u2705 Publicaci\u00f3n completada</h2><p><strong>Art\u00edculo:</strong> <a href='{{ $('\U0001f50d Parsear Contenido').item.json.url }}'>{{ $('\U0001f50d Parsear Contenido').item.json.titulo }}</a></p><hr><p>\u2705 LinkedIn: Publicado<br>\u26a0\ufe0f Facebook: Pendiente token Meta<br>\u26a0\ufe0f Instagram: Pendiente token Meta<br>\u2705 Email: Enviado</p>",
                "options": {"appendAttribution": False}
            }
        },
        {
            "id": "note-pending",
            "name": "\U0001f4cc Facebook e Instagram - Pendiente",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [1580, 260],
            "parameters": {
                "content": "## \u26a0\ufe0f Pendiente: Token Meta\n\nCuando tengas el **Page Access Token** de Meta:\n\n1. **Facebook**: reemplaza `REEMPLAZAR_CON_PAGE_ACCESS_TOKEN` en el nodo Facebook\n2. **Instagram**: reemplaza `INSTAGRAM_ACCOUNT_ID` y el token en el nodo Instagram\n\nPage ID Facebook: `1713965015486703`",
                "height": 200,
                "width": 350,
                "color": 3
            }
        }
    ],
    "connections": {
        "\u23f0 Trigger Martes y Jueves 9am": {"main": [[{"node": "\U0001f4f0 Obtener Blogs de WordPress", "type": "main", "index": 0}]]},
        "\u25b6\ufe0f Ejecutar Manualmente": {"main": [[{"node": "\U0001f4f0 Obtener Blogs de WordPress", "type": "main", "index": 0}]]},
        "\U0001f4f0 Obtener Blogs de WordPress": {"main": [[{"node": "\U0001f4cb \u00daltimo Publicado (Airtable)", "type": "main", "index": 0}]]},
        "\U0001f4cb \u00daltimo Publicado (Airtable)": {"main": [[{"node": "\U0001f527 Seleccionar Blog", "type": "main", "index": 0}]]},
        "\U0001f527 Seleccionar Blog": {"main": [[{"node": "\u2b07\ufe0f Descargar Imagen", "type": "main", "index": 0}]]},
        "\u2b07\ufe0f Descargar Imagen": {"main": [[{"node": "\U0001f916 Groq: Generar Contenido Multi-Canal", "type": "main", "index": 0}]]},
        "\U0001f916 Groq: Generar Contenido Multi-Canal": {"main": [[{"node": "\U0001f50d Parsear Contenido", "type": "main", "index": 0}]]},
        "\U0001f50d Parsear Contenido": {"main": [[
            {"node": "\U0001f4e2 Publicar en LinkedIn", "type": "main", "index": 0},
            {"node": "\U0001f4d8 Publicar en Facebook \u26a0\ufe0f Pendiente Token", "type": "main", "index": 0},
            {"node": "\U0001f4f8 Publicar en Instagram \u26a0\ufe0f Pendiente Token", "type": "main", "index": 0},
            {"node": "\U0001f4e7 Enviar Newsletter", "type": "main", "index": 0}
        ]]},
        "\U0001f4e2 Publicar en LinkedIn": {"main": [[{"node": "\U0001f4be Guardar en Airtable", "type": "main", "index": 0}]]},
        "\U0001f4d8 Publicar en Facebook \u26a0\ufe0f Pendiente Token": {"main": [[{"node": "\U0001f4be Guardar en Airtable", "type": "main", "index": 0}]]},
        "\U0001f4f8 Publicar en Instagram \u26a0\ufe0f Pendiente Token": {"main": [[{"node": "\U0001f4be Guardar en Airtable", "type": "main", "index": 0}]]},
        "\U0001f4e7 Enviar Newsletter": {"main": [[{"node": "\U0001f4be Guardar en Airtable", "type": "main", "index": 0}]]},
        "\U0001f4be Guardar en Airtable": {"main": [[{"node": "\U0001f514 Notificar Publicaci\u00f3n", "type": "main", "index": 0}]]}
    },
    "settings": {"executionOrder": "v1"}
}

# Push to n8n
resp = requests.post(
    "https://n8n.mdarthurdigital.com/api/v1/workflows",
    headers={"X-N8N-API-KEY": N8N_TOKEN, "Content-Type": "application/json"},
    json=workflow
)
result = resp.json()
if "id" in result:
    print(f"SUCCESS! Workflow creado: {result['id']}")
    print(f"Name: {result['name']}")
    print(f"Nodes: {len(result.get('nodes', []))}")
else:
    print("ERROR:", json.dumps(result)[:300])
