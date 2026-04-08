import json

with open('/tmp/workflow_current.json') as f:
    data = json.load(f)

nodes = data['nodes']

# runOnceForAllItems: iterate all items, access $('node').all() for original lead data
# Hunter data is in $json.data.emails (outputPropertyName didn't work)
extract_email_code = (
    "// runOnceForAllItems: process all 20 Hunter responses at once\n"
    "const hunterItems = $input.all();\n"
    "let leadItems = [];\n"
    "try { leadItems = $(\"\\u2705 \\u00bfTiene contacto?\").all(); } catch(e) {}\n\n"
    "return hunterItems.map((hunterItem, i) => {\n"
    "  const lead = leadItems[i] ? leadItems[i].json : {};\n"
    "  const nombre = (lead.nombre || '').toString();\n"
    "  const web = (lead.web || '').toString();\n\n"
    "  let email = '';\n"
    "  try {\n"
    "    const emails = hunterItem.json && hunterItem.json.data && hunterItem.json.data.emails\n"
    "      ? hunterItem.json.data.emails : [];\n"
    "    if (emails.length > 0) {\n"
    "      const sorted = emails.slice().sort(function(a,b){ return (b.confidence||0)-(a.confidence||0); });\n"
    "      email = sorted[0].value || '';\n"
    "    }\n"
    "  } catch(e) {}\n\n"
    "  return { json: { nombre: nombre, web: web, email: email } };\n"
    "});"
)

# Scraping /contact: runOnceForAllItems
scraping_contact_code = (
    "// runOnceForAllItems\n"
    "const scrapingItems = $input.all();\n"
    "let extractItems = [];\n"
    "try { extractItems = $(\"\\u{1F4E7} Extraer Email\").all(); } catch(e) {}\n\n"
    "return scrapingItems.map((item, i) => {\n"
    "  const lead = extractItems[i] ? extractItems[i].json : {};\n"
    "  const nombre = (lead.nombre || '').toString();\n"
    "  const web = (lead.web || '').toString();\n\n"
    "  let html = '';\n"
    "  try {\n"
    "    const raw = item.json.data || item.json.body || '';\n"
    "    html = typeof raw === 'string' ? raw : JSON.stringify(raw);\n"
    "  } catch(e) {}\n\n"
    "  const mailtoEmails = [];\n"
    "  const re = /href=[\"']mailto:([^\"'?\\s]+)/gi;\n"
    "  let m;\n"
    "  while ((m = re.exec(html)) !== null) {\n"
    "    if (m[1].indexOf('@') > -1) mailtoEmails.push(m[1]);\n"
    "  }\n\n"
    "  const regexFound = html.match(/[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/g) || [];\n"
    "  const blacklist = ['example','sentry','wixpress','yourdomain','schema','placeholder','noreply','no-reply','webmaster@'];\n"
    "  const all = [];\n"
    "  const seen = {};\n"
    "  mailtoEmails.concat(regexFound).forEach(function(e) {\n"
    "    const l = e.toLowerCase();\n"
    "    if (!seen[l] && !blacklist.some(function(b){return l.indexOf(b)>-1;})\n"
    "      && l.indexOf('@')>-1 && l.indexOf('.')>l.indexOf('@')) {\n"
    "      seen[l]=1; all.push(e);\n"
    "    }\n"
    "  });\n\n"
    "  return { json: { nombre: nombre, web: web, email: all[0] || '' } };\n"
    "});"
)

# Scraping /about: runOnceForAllItems
scraping_about_code = (
    "// runOnceForAllItems\n"
    "const scrapingItems = $input.all();\n"
    "let contactItems = [];\n"
    "try { contactItems = $(\"\\u{1F4E7} Extraer Email Scraping\").all(); } catch(e) {}\n\n"
    "return scrapingItems.map((item, i) => {\n"
    "  const lead = contactItems[i] ? contactItems[i].json : {};\n"
    "  const nombre = (lead.nombre || '').toString();\n\n"
    "  let html = '';\n"
    "  try {\n"
    "    const raw = item.json.data || item.json.body || '';\n"
    "    html = typeof raw === 'string' ? raw : JSON.stringify(raw);\n"
    "  } catch(e) {}\n\n"
    "  const mailtoEmails = [];\n"
    "  const re = /href=[\"']mailto:([^\"'?\\s]+)/gi;\n"
    "  let m;\n"
    "  while ((m = re.exec(html)) !== null) {\n"
    "    if (m[1].indexOf('@') > -1) mailtoEmails.push(m[1]);\n"
    "  }\n\n"
    "  const regexFound = html.match(/[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/g) || [];\n"
    "  const blacklist = ['example','sentry','wixpress','yourdomain','schema','placeholder','noreply','no-reply','webmaster@'];\n"
    "  const all = [];\n"
    "  const seen = {};\n"
    "  mailtoEmails.concat(regexFound).forEach(function(e) {\n"
    "    const l = e.toLowerCase();\n"
    "    if (!seen[l] && !blacklist.some(function(b){return l.indexOf(b)>-1;})\n"
    "      && l.indexOf('@')>-1 && l.indexOf('.')>l.indexOf('@')) {\n"
    "      seen[l]=1; all.push(e);\n"
    "    }\n"
    "  });\n\n"
    "  return { json: { nombre: nombre, email: all[0] || '' } };\n"
    "});"
)

updated = 0
for n in nodes:
    if n['id'] == 'node-extract-email':
        n['parameters']['jsCode'] = extract_email_code
        n['parameters']['mode'] = 'runOnceForAllItems'
        n['continueOnFail'] = False
        print("Fixed node-extract-email: runOnceForAllItems")
        updated += 1
    elif n['id'] == 'node-scraping-code':
        n['parameters']['jsCode'] = scraping_contact_code
        n['parameters']['mode'] = 'runOnceForAllItems'
        print("Fixed scraping-code /contact: runOnceForAllItems")
        updated += 1
    elif n['id'] == 'node-scraping-code-about':
        n['parameters']['jsCode'] = scraping_about_code
        n['parameters']['mode'] = 'runOnceForAllItems'
        print("Fixed scraping-code /about: runOnceForAllItems")
        updated += 1
    # Restore Hunter to default options (remove outputPropertyName hack)
    elif n['id'] == 'node-fetch-web':
        n['parameters']['options'] = {"timeout": 15000}
        print("Restored Hunter options")
        updated += 1

print(f"Updated {updated} nodes")
data['nodes'] = nodes

with open('/tmp/workflow_updated.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Saved!")
