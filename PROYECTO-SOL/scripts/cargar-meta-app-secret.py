"""Carga el App Secret de Meta en el control de firma (🔏 Firma de Meta) de Marco, Sales AI y Community.

Uso: guardar el secreto en .secrets.local.md como META_APP_SECRET_<EMPRESA>=valor (por ejemplo
META_APP_SECRET_CE=...) y correr:  python PROYECTO-SOL/scripts/cargar-meta-app-secret.py
Carga todos los META_APP_SECRET_* que haya. El valor nunca se imprime ni se escribe en ningún archivo del repo:
viaja por POST a cada webhook con X-Webhook-Key y queda en la memoria de cada flujo.
Para quitar uno: agregar --quitar al comando (quita los que están en el archivo).
"""
import json, sys, time, urllib.request, urllib.error, pathlib
RAIZ = pathlib.Path(__file__).resolve().parents[2]
sec = dict(l.split('=', 1) for l in (RAIZ / '.secrets.local.md').read_text(encoding='utf-8').splitlines() if '=' in l and l[0].isupper())
secretos = {k: v.strip() for k, v in sec.items() if k.startswith('META_APP_SECRET') and v.strip()}
if not secretos:
    sys.exit('No hay ningún META_APP_SECRET_* en .secrets.local.md')
accion = 'meta_app_secret_quitar' if '--quitar' in sys.argv else 'meta_app_secret_agregar'
K = sec['N8N_WEBHOOK_KEY'].strip()
nh = {'X-N8N-API-KEY': sec['N8N_API_TOKEN'].strip(), 'User-Agent': 'diag'}
FLUJOS = (('zAhV8gEsXD8dCrXq', 'whatsapp-ce', 'Marco WA'), ('otycsrxrMEMuxuwD', 'wa-engine-g54', 'Sales AI'), ('62tIvF0snsrMj0sM', 'community-ai-g54', 'Community'))
for nombre_sec, valor in secretos.items():
    for wid, path, nombre in FLUJOS:
        req = urllib.request.Request('https://n8n.mdarthurdigital.com/webhook/' + path, method='POST',
                                     data=json.dumps({accion: valor}).encode(),
                                     headers={'Content-Type': 'application/json', 'X-Webhook-Key': K, 'User-Agent': 'diag'})
        try:
            urllib.request.urlopen(req, timeout=60).read()
        except urllib.error.HTTPError as e:
            print(f'{nombre}: respuesta {e.code}')
time.sleep(5)
for wid, path, nombre in FLUJOS:
    w = json.loads(urllib.request.urlopen(urllib.request.Request(f'https://n8n.mdarthurdigital.com/api/v1/workflows/{wid}', headers=nh), timeout=60).read())
    guardados = ((w.get('staticData') or {}).get('global', {}).get('metaFirma') or {}).get('secretos') or []
    cargados = sum(1 for v in secretos.values() if v in guardados)
    print(f"{nombre}: {cargados} de {len(secretos)} secreto(s) del archivo cargados ({len(guardados)} en total en el flujo)")
