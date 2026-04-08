import json

with open('/tmp/linkedin_workflow.json') as f:
    data = json.load(f)

nodes = data['nodes']

for n in nodes:
    # Fix Bug 1: type mismatch in blog selection
    if n['id'] == 'seleccionar-blog':
        n['parameters']['jsCode'] = (
            "// Traer TODOS los blogs\n"
            "const blogs = $('\U0001f4f0 Obtener Blogs de WordPress').all().map(item => item.json);\n"
            "const ultimoData = $('\U0001f4cb Obtener \u00DAltimo Publicado (Airtable)').item.json;\n\n"
            "// \u00DAltimo WP Post ID publicado en LinkedIn\n"
            "const ultimoRegistro = ultimoData.records && ultimoData.records[0] ? ultimoData.records[0].fields : null;\n"
            "// Fix: convert to number to avoid string/number mismatch\n"
            "const ultimoWpId = ultimoRegistro && ultimoRegistro.WP_Post_ID ? Number(ultimoRegistro.WP_Post_ID) : 0;\n\n"
            "// Encontrar el siguiente blog en orden cronol\u00f3gico\n"
            "const idx = ultimoWpId > 0 ? blogs.findIndex(function(b){ return Number(b.id) === ultimoWpId; }) : -1;\n"
            "let siguiente = idx >= 0 ? blogs[idx + 1] : blogs[0];\n\n"
            "// Si se complet\u00f3 el ciclo, reiniciar desde el primero\n"
            "if (!siguiente) siguiente = blogs[0];\n"
            "if (!siguiente) throw new Error('No se encontraron blogs en WordPress');\n\n"
            "function stripHtml(html) {\n"
            "  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();\n"
            "}\n\n"
            "// Get featured image URL from _embedded\n"
            "const featuredImage = siguiente._embedded && siguiente._embedded['wp:featuredmedia'] && siguiente._embedded['wp:featuredmedia'][0]\n"
            "  ? siguiente._embedded['wp:featuredmedia'][0].source_url || '' : '';\n\n"
            "const titulo = siguiente.title ? siguiente.title.rendered || '' : '';\n"
            "const extracto = stripHtml(siguiente.excerpt ? siguiente.excerpt.rendered || '' : siguiente.content ? siguiente.content.rendered || '' : '');\n\n"
            "return [{\n"
            "  json: {\n"
            "    wp_id: siguiente.id,\n"
            "    titulo: titulo,\n"
            "    extracto: extracto.slice(0, 500),\n"
            "    url: siguiente.link,\n"
            "    fecha_wp: siguiente.date,\n"
            "    featured_image_url: featuredImage\n"
            "  }\n"
            "}];"
        )
        print("Fixed Bug 1: seleccionar-blog (type mismatch)")

    # Fix Bug 2: notification uses wrong $json - reference Parsear Post LinkedIn instead
    if n['id'] == 'notificar-email':
        n['parameters']['message'] = (
            "<h2>\u2705 Post publicado en LinkedIn</h2>"
            "<p><strong>Art\u00edculo:</strong> "
            "<a href='{{ $('\U0001f50d Parsear Post LinkedIn').item.json.url }}'>"
            "{{ $('\U0001f50d Parsear Post LinkedIn').item.json.titulo }}</a></p>"
            "<hr><h3>Texto publicado:</h3>"
            "<p>{{ $('\U0001f50d Parsear Post LinkedIn').item.json.post_text.replace(/\\n/g, '<br>') }}</p>"
        )
        n['parameters']['subject'] = (
            "\u2705 LinkedIn CE \u2014 Publicado: {{ $('\U0001f50d Parsear Post LinkedIn').item.json.titulo }}"
        )
        print("Fixed Bug 2: notificar-email (wrong $json reference)")

data['nodes'] = nodes

with open('/tmp/linkedin_fixed.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Saved!")
