# Exporta todos los agentes de n8n a PROYECTO-SOL/agentes-n8n/<grupo>/<nombre>.json
# con los secretos tapados, y escribe la lista en agentes-n8n/LISTA.md.
# Uso (desde la raíz del repo):  python PROYECTO-SOL/scripts/exportar-agentes.py
# Borra y vuelve a crear la carpeta agentes-n8n, así que siempre refleja lo que hay hoy en n8n.
# Los valores a tapar salen de .secrets.local.md (nunca se escriben en este archivo).
import json, re, shutil, unicodedata, urllib.request, datetime, pathlib

RAIZ = pathlib.Path(__file__).resolve().parents[2]
DESTINO = RAIZ / 'PROYECTO-SOL' / 'agentes-n8n'
sec = {k.strip(): v.strip() for k, v in (l.split('=', 1) for l in
       (RAIZ / '.secrets.local.md').read_text(encoding='utf-8').splitlines()
       if '=' in l and not l.startswith('#'))}

PATRONES = [(r'EAA[A-Za-z0-9]{20,}', 'REDACTED_FB_TOKEN'),
            (r'IGAA[A-Za-z0-9_-]{20,}', 'REDACTED_IG_TOKEN'),
            (r'AQ[VXW][A-Za-z0-9_-]{30,}', 'REDACTED_LINKEDIN_TOKEN'),
            (r'gsk_[A-Za-z0-9]{20,}', 'REDACTED_GROQ_KEY'),
            (r'AIzaSy[A-Za-z0-9_-]{20,}', 'REDACTED_GOOGLE_KEY'),
            (r'sk-[A-Za-z0-9_-]{20,}', 'REDACTED_API_KEY'),
            (r'pcsk_[A-Za-z0-9_-]{20,}', 'REDACTED_PINECONE_KEY'),
            (r'\b\d{8,10}:[A-Za-z0-9_-]{30,40}\b', 'REDACTED_TELEGRAM_TOKEN'),
            (r'\b[0-9a-f]{40}\b', 'REDACTED_HEX_KEY')]

# Grupo de cada agente. Lo que no está acá va a "g54-plataforma".
MARCO = {'zAhV8gEsXD8dCrXq', 'HaSG63Q9C2tGOLH3', '1PXcg3dOQBt8hrrT', 's1Z7jKoFzy5x7XvC', 'J8qbKOF7t4GnhRDT',
         'PqbfMghL0E7xKflC', '5GU89AeWsBZ86FWa', 'FYKfTJBfgwsMpJV7', '6UWT1GHKZVvCDcc6', 'OMZLwErubDaiGgO7',
         'FU8QG1BVmT4r5Kjw', 'cJZV7jcwlbFoW5qJ'}
OTROS = {'2ISjIHJvjYHfoHyP'}


def grupo(w):
    if w['id'] in MARCO:
        return 'marco-crating-express'
    if w['id'] in OTROS:
        return 'otros'
    return 'g54-plataforma'


def nombre_archivo(nombre):
    s = unicodedata.normalize('NFKD', nombre).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^A-Za-z0-9]+', '-', s).strip('-').lower()
    return s or 'sin-nombre'


def tapar(texto):
    for k, v in sec.items():
        if len(v) >= 8:
            texto = texto.replace(v, 'REDACTED_' + k)
    for p, r in PATRONES:
        texto = re.sub(p, r, texto)
    return texto


def get(url):
    req = urllib.request.Request(url, headers={'X-N8N-API-KEY': sec['N8N_API_TOKEN'], 'User-Agent': 'export'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


lista = get('https://n8n.mdarthurdigital.com/api/v1/workflows?limit=250')['data']
if DESTINO.exists():
    # Se vacía por dentro en vez de borrar la carpeta: si una terminal está parada en ella, Windows no deja borrarla.
    for hijo in DESTINO.iterdir():
        shutil.rmtree(hijo) if hijo.is_dir() else hijo.unlink()
filas = []
for w in sorted(lista, key=lambda w: (grupo(w), w['name'])):
    full = get(f"https://n8n.mdarthurdigital.com/api/v1/workflows/{w['id']}")
    # Sin pinData ni staticData: pueden traer datos reales de contactos o tokens guardados por el flujo
    limpio = {k: full.get(k) for k in ('id', 'name', 'active', 'updatedAt', 'tags', 'settings', 'nodes', 'connections')}
    g = grupo(w)
    archivo = DESTINO / g / (nombre_archivo(w['name']) + '.json')
    archivo.parent.mkdir(parents=True, exist_ok=True)
    archivo.write_text(tapar(json.dumps(limpio, ensure_ascii=False, indent=2)) + '\n', encoding='utf-8')
    filas.append((g, w['name'], w['id'], 'sí' if w['active'] else 'no', w['updatedAt'][:10], archivo.name))

hoy = datetime.date.today().isoformat()
md = [f'# Agentes de n8n — copia del {hoy}', '',
      'Generado con `python PROYECTO-SOL/scripts/exportar-agentes.py`. Secretos tapados (`REDACTED_...`);',
      'los valores reales están en `.secrets.local.md` y en n8n. No incluye `pinData` ni `staticData`.', '']
for g in sorted({f[0] for f in filas}):
    md += [f'## {g}', '', '| Agente | ID | Activo | Última edición | Archivo |', '|---|---|---|---|---|']
    md += [f'| {n} | `{i}` | {a} | {u} | [{f}]({g}/{f}) |' for gg, n, i, a, u, f in filas if gg == g]
    md.append('')
(DESTINO / 'LISTA.md').write_text('\n'.join(md), encoding='utf-8')
print(f'{len(filas)} agentes exportados en {DESTINO}')
