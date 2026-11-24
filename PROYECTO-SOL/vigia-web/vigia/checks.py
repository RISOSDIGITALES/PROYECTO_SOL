"""Revisiones de un sitio web.

Rápida: que la portada responda (y en cuánto), certificado HTTPS, redirección a otro dominio, sin HTTPS
y código sospechoso en la portada.
Completa: además recorre páginas (sitemap o enlaces), prueba sus enlaces, consulta Sucuri SiteCheck
(malware y listas negras), RDAP (vencimiento del dominio) y, si hay clave, Google Safe Browsing.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import json
import re
import socket
import ssl
import time
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpx

UA = "Mozilla/5.0 (compatible; VigiaWeb/1.0; +site-monitor)"
NO_VERIFICABLE = {401, 403, 405, 406, 429, 999}  # sitios que bloquean robots: no se cuentan como rotos
EXT_NO_PAGINA = re.compile(r"\.(jpe?g|png|gif|webp|svg|pdf|zip|css|js|ico|mp4|mp3|woff2?)(\?|$)", re.I)
SPAM = ["viagra", "cialis", "levitra", "tadalafil", "sildenafil", "casino online", "online casino", "slot gacor",
        "judi online", "togel", "payday loan", "replica watches", "porn", "xxx video", "escort service",
        "buy followers", "essay writing service", "crypto doubler", "bitcoin doubler"]
PORTADA_TIPOS = {"caido", "certificado", "lento", "redireccion", "sin_https", "iframe_oculto", "codigo_ofuscado",
                 "spam", "script_nuevo", "refresh_externo"}


def normalizar(url: str) -> str:
    """'ejemplo.com' -> 'https://ejemplo.com/'. Devuelve '' si no es una dirección válida."""
    u = (url or "").strip()
    if not u:
        return ""
    if not re.match(r"^https?://", u, re.I):
        u = "https://" + u
    p = urlsplit(u)
    if not p.hostname or "." not in p.hostname:
        return ""
    path = p.path or "/"
    if path != "/":
        path = path.rstrip("/")
    return urlunsplit((p.scheme.lower(), p.netloc.lower(), path, p.query, ""))


def base(host: str | None) -> str:
    h = (host or "").lower()
    return h[4:] if h.startswith("www.") else h


def host_de(url: str) -> str:
    try:
        return base(urlsplit(url).hostname)
    except ValueError:
        return ""


def dominio_registrable(host: str) -> str:
    partes = base(host).split(".")
    # aproximación: ejemplo.com, ejemplo.com.mx / ejemplo.co.uk
    if len(partes) >= 3 and len(partes[-1]) == 2 and partes[-2] in {"com", "co", "org", "net", "gob", "gov", "edu", "ac"}:
        return ".".join(partes[-3:])
    return ".".join(partes[-2:])


def problema(tipo: str, nivel: str, detalle: str, donde: str = "") -> dict:
    return {"tipo": tipo, "nivel": nivel, "detalle": detalle, "donde": donde}


async def pedir(client: httpx.AsyncClient, url: str, metodo: str = "GET", seguir_redir: bool = False, timeout: float = 20) -> dict:
    t = time.monotonic()
    try:
        r = await client.request(metodo, url, follow_redirects=seguir_redir, timeout=timeout)
        texto = ""
        if metodo == "GET":
            ct = r.headers.get("content-type", "")
            if any(k in ct for k in ("html", "xml", "json", "text")) or not ct:
                texto = r.text[:3_000_000]
        return {"status": r.status_code, "headers": r.headers, "texto": texto, "ms": int((time.monotonic() - t) * 1000), "url": str(r.url), "error": ""}
    except Exception as e:  # noqa: BLE001 - cualquier falla de red es un resultado
        return {"status": 0, "headers": {}, "texto": "", "ms": int((time.monotonic() - t) * 1000), "url": url, "error": f"{type(e).__name__}: {e}"[:180]}


async def seguir(client: httpx.AsyncClient, url: str) -> dict:
    """GET siguiendo hasta 6 redirecciones a mano, para saber a dónde termina."""
    cadena, actual = [], url
    r = {}
    for _ in range(7):
        r = await pedir(client, actual)
        loc = r["headers"].get("location") if r["headers"] else None
        if 300 <= r["status"] < 400 and loc:
            cadena.append(actual)
            actual = urljoin(actual, loc)
            continue
        break
    r["final"] = actual
    r["cadena"] = cadena
    return r


def es_error_certificado(err: str) -> bool:
    return bool(re.search(r"CERT|SSL|TLS|certificate|self.signed|unable to verify", err or "", re.I))


def _leer_certificado(host: str, puerto: int = 443) -> dict:
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((host, puerto), timeout=10) as sock, ctx.wrap_socket(sock, server_hostname=host) as s:
            c = s.getpeercert()
        vence = dt.datetime.strptime(c["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=dt.timezone.utc)
        emisor = dict(x[0] for x in c.get("issuer", ()))
        return {"vence": vence.date().isoformat(), "dias": (vence - dt.datetime.now(dt.timezone.utc)).days, "emisor": emisor.get("organizationName", "")}
    except Exception as e:  # noqa: BLE001
        return {"error": f"{type(e).__name__}: {e}"[:180]}


async def certificado(host: str) -> dict:
    return await asyncio.to_thread(_leer_certificado, host)


def sospechoso(html: str, pagina: str, propio: str) -> list[dict]:
    p: list[dict] = []
    if not html:
        return p
    h = html[:2_000_000]
    if re.search(r"<iframe[^>]+(width\s*=\s*[\"']?0[\"'\s>]|height\s*=\s*[\"']?0[\"'\s>]|display\s*:\s*none|visibility\s*:\s*hidden)", h, re.I):
        p.append(problema("iframe_oculto", "critico", "Hay un iframe oculto (tamaño 0 o invisible), una técnica común de malware.", pagina))
    if re.search(r"eval\s*\(\s*(atob|unescape|String\.fromCharCode|function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e)", h, re.I) or re.search(r"document\.write\s*\(\s*unescape", h, re.I):
        p.append(problema("codigo_ofuscado", "critico", "Hay JavaScript ofuscado (eval/unescape), típico de código inyectado.", pagina))
    m = re.search(r"<meta[^>]+http-equiv\s*=\s*[\"']?refresh[^>]+url\s*=\s*([^\"'>\s]+)", h, re.I)
    if m and host_de(urljoin(pagina, m.group(1))) not in ("", host_de(pagina)):
        p.append(problema("refresh_externo", "critico", f"La página se redirige sola a otro dominio ({host_de(urljoin(pagina, m.group(1)))}).", pagina))
    # palabras completas: "cialis" no tiene que saltar con "especialistas"
    texto = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<[^>]+>", " ", h, flags=re.I).lower()
    texto = " " + re.sub(r"[^a-z0-9áéíóúñü]+", " ", texto) + " "
    enc = [w for w in SPAM if f" {w} " in texto and w.split()[0] not in propio]
    if enc:
        p.append(problema("spam", "critico" if len(enc) >= 2 else "aviso", "Aparecen palabras de spam: " + ", ".join(enc[:5]) + ".", pagina))
    return p


ENLACE = re.compile(r"<(a|img|script|link|iframe|source)\b[^>]*?\s(href|src)\s*=\s*[\"']([^\"'#][^\"']*)[\"']", re.I)


def enlaces_de(html: str, pagina: str) -> list[str]:
    out: dict[str, None] = {}
    for m in ENLACE.finditer(html or ""):
        tag, u = m.group(1).lower(), m.group(3).strip().replace("&amp;", "&")
        if re.match(r"^(mailto:|tel:|javascript:|data:|sms:|whatsapp:)", u, re.I):
            continue
        if tag == "link" and not re.search(r"rel\s*=\s*[\"'][^\"']*(stylesheet|icon)", m.group(0), re.I):
            continue
        x = urljoin(pagina, u)
        if re.match(r"^https?://", x, re.I):
            out[x.split("#")[0]] = None
    return list(out)


def scripts_externos(html: str, host: str) -> list[str]:
    s = set()
    for m in re.finditer(r"<script\b[^>]*\ssrc\s*=\s*[\"']([^\"']+)[\"']", html or "", re.I):
        h = host_de(urljoin(f"https://{host}/", m.group(1)))
        if h and h != base(host) and not h.endswith("." + base(host)):
            s.add(h)
    return sorted(s)


def dias_hasta(fecha: str) -> int:
    """Días que faltan para una fecha ISO (RDAP). 9999 si no se entiende."""
    try:
        d = dt.datetime.fromisoformat(fecha.strip().replace("Z", "+00:00"))
    except ValueError:
        return 9999
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return (d - dt.datetime.now(dt.timezone.utc)).days


async def revisar(url: str, modo: str = "completo", max_paginas: int = 25, max_enlaces: int = 250,
                  nombre: str = "", scripts_conocidos: list[str] | None = None, safebrowsing_key: str = "",
                  externos: bool = True) -> dict:
    """Revisa un sitio y devuelve el informe. `scripts_conocidos`: dominios de scripts ya vistos (None = primera vez).
    `externos=False` saltea Sucuri, RDAP, Safe Browsing y la lectura del certificado (pruebas sin internet)."""
    inicio = time.monotonic()
    url = normalizar(url)
    if not url:
        return {"ok": False, "error": "Dirección no válida."}
    host = host_de(url)
    propio = host + " " + (nombre or "").lower()
    problemas: list[dict] = []
    datos: dict = {}
    limites = httpx.Limits(max_connections=20, max_keepalive_connections=10)
    async with httpx.AsyncClient(headers={"User-Agent": UA, "Accept": "*/*"}, limits=limites, verify=True) as client:
        r = await seguir(client, url)
        # si HTTPS no responde y no es por el certificado, se prueba por HTTP
        if not r["status"] and url.startswith("https:") and not es_error_certificado(r["error"]):
            rh = await seguir(client, "http:" + url[6:])
            if rh["status"]:
                r = rh
        datos.update(status=r["status"], tiempo_ms=r["ms"], url_final=r["final"], redirecciones=len(r["cadena"]))
        if not r["status"]:
            cert = es_error_certificado(r["error"])
            problemas.append(problema("certificado" if cert else "caido", "critico",
                                      ("El certificado HTTPS no es válido (" if cert else "El sitio no responde (") + r["error"] + ").", url))
        elif r["status"] >= 500:
            problemas.append(problema("caido", "critico", f"La portada responde con error del servidor {r['status']}.", r["final"]))
        elif r["status"] >= 400:
            problemas.append(problema("caido", "critico", f"La portada responde {r['status']} (no se puede ver).", r["final"]))
        elif r["ms"] > 8000:
            problemas.append(problema("lento", "aviso", f"La portada tardó {r['ms'] / 1000:.1f} s en responder.", r["final"]))
        host_final = host_de(r["final"]) or host
        if r["status"] and host_final != host:
            problemas.append(problema("redireccion", "critico", f"La portada redirige a otro dominio: {host_final}. Si no fue a propósito, puede ser un secuestro del sitio.", url))
        if r["status"] and r["final"].startswith("http:"):
            problemas.append(problema("sin_https", "aviso", "El sitio se sirve sin HTTPS.", r["final"]))
        portada = r["texto"] if 200 <= r["status"] < 300 else ""
        problemas += sospechoso(portada, r["final"], propio)
        # certificado (directo, sin depender de terceros)
        if externos and r["status"] and r["final"].startswith("https:"):
            c = await certificado(urlsplit(r["final"]).hostname)
            if "dias" in c:
                datos["cert_vence"] = c["vence"]
                datos["cert_emisor"] = c["emisor"]
                if c["dias"] <= 14:
                    problemas.append(problema("certificado", "critico" if c["dias"] <= 3 else "aviso", f"El certificado HTTPS vence en {c['dias']} días ({c['vence']}).", host_final))
        # scripts de dominios nuevos (la primera vez solo se anota la base)
        ext = scripts_externos(portada, host_final) if portada else []
        datos["scripts_externos"] = ext
        nuevos_scripts = []
        if portada and scripts_conocidos is not None:
            nuevos_scripts = [d for d in ext if d not in scripts_conocidos]
            if nuevos_scripts:
                problemas.append(problema("script_nuevo", "aviso", "La portada carga scripts de dominios nuevos: " + ", ".join(nuevos_scripts[:5]) + ". Si nadie los agregó, revisar.", r["final"]))

        if modo == "completo" and portada:
            origen = urlunsplit(urlsplit(r["final"])[:2] + ("", "", ""))
            paginas: list[str] = []
            enlace_origen: dict[str, str] = {}  # página -> dónde está enlazada (si salió de la portada)
            for sm in ("/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml"):
                x = await seguir(client, origen + sm)
                if x["status"] == 200 and re.search(r"<(urlset|sitemapindex)", x["texto"], re.I):
                    locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", x["texto"], re.I)
                    if re.search(r"<sitemapindex", x["texto"], re.I):
                        subs = await asyncio.gather(*(seguir(client, u) for u in locs[:4]))
                        locs = [l for s in subs for l in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", s["texto"], re.I)]
                    paginas = [u for u in locs if host_de(u) == host_final]
                    datos["sitemap"] = sm
                    break
            if not paginas:
                paginas = [u for u in enlaces_de(portada, r["final"]) if host_de(u) == host_final and not EXT_NO_PAGINA.search(urlsplit(u).path)]
                enlace_origen = {u: r["final"] for u in paginas}
            paginas = list(dict.fromkeys([r["final"]] + paginas))[:max_paginas]
            sem = asyncio.Semaphore(4)

            async def ver(u):
                async with sem:
                    return u, (r if u == r["final"] else await seguir(client, u))
            vistas = await asyncio.gather(*(ver(u) for u in paginas))
            enlaces: dict[str, str] = {}
            for u, v in vistas:
                if not v["status"] or v["status"] >= 400:
                    if u != r["final"]:
                        problemas.append(problema("pagina_rota", "aviso", f"Una página del sitio responde {v['status'] or v['error']}: {u}", enlace_origen.get(u, r["final"])))
                    continue
                if u != r["final"]:
                    problemas += sospechoso(v["texto"], u, propio)
                for e in enlaces_de(v["texto"], v.get("final") or u):
                    if e not in enlaces and e not in paginas:
                        enlaces[e] = u
            lista = sorted(enlaces, key=lambda e: 0 if host_de(e) == host_final else 1)[:max_enlaces]
            sem2 = asyncio.Semaphore(8)

            async def probar(u):
                async with sem2:
                    x = await pedir(client, u, "HEAD", seguir_redir=True, timeout=15)
                    if not x["status"] or x["status"] >= 400:
                        x = await pedir(client, u, "GET", seguir_redir=True, timeout=15)
                    return u, x["status"], x["error"]
            res = await asyncio.gather(*(probar(u) for u in lista))
            rotos = [(u, s, e) for u, s, e in res if (s >= 400 and s not in NO_VERIFICABLE) or (not s and not re.search(r"Timeout", e or "", re.I))]
            datos.update(paginas_revisadas=len(vistas), enlaces_revisados=len(res), enlaces_rotos=len(rotos))
            for u, s, e in rotos[:40]:
                interno = host_de(u) == host_final
                problemas.append(problema("enlace_roto_interno" if interno else "enlace_roto_externo", "aviso",
                                          ("Enlace interno roto" if interno else "Enlace a otro sitio roto") + f" ({s or e}): {u}", enlaces.get(u, "")))
            if not externos:
                datos["externos"] = "salteados"
        if modo == "completo" and portada and externos:
            # Sucuri SiteCheck: malware y listas negras
            su = await pedir(client, "https://sitecheck.sucuri.net/api/v3/?scan=" + host_final, seguir_redir=True, timeout=60)
            try:
                j = json.loads(su["texto"])
            except ValueError:
                j = None
            if j:
                for k, lw in (j.get("warnings") or {}).items():
                    for x in (lw if isinstance(lw, list) else [lw])[:5]:
                        msg = (x if isinstance(x, str) else (x.get("msg") or x.get("message") or x.get("type") or json.dumps(x)))[:200]
                        grave = re.search(r"malware|blacklist|spam|injected|defac|phish|iframe|redirect", k + " " + msg, re.I)
                        problemas.append(problema("sucuri_" + k, "critico" if grave else "aviso", "Sucuri: " + msg, host_final))
                for b in j.get("blacklists") or []:
                    problemas.append(problema("lista_negra", "critico", "Figura en una lista negra: " + str(b.get("vendor") or b.get("name") or b)[:120], host_final))
                cms = ((j.get("software") or {}).get("cms") or [{}])[0]
                if cms.get("name"):
                    datos["cms"] = cms["name"] + (" " + cms["version"] if cms.get("version") else "")
                datos["sucuri"] = (((j.get("ratings") or {}).get("total") or {}).get("rating")) or "ok"
            else:
                datos["sucuri"] = "sin respuesta"
            # Google Safe Browsing (opcional, con clave gratis)
            if safebrowsing_key:
                cuerpo = {"client": {"clientId": "vigia-web", "clientVersion": "1.0"}, "threatInfo": {
                    "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                    "platformTypes": ["ANY_PLATFORM"], "threatEntryTypes": ["URL"], "threatEntries": [{"url": r["final"]}]}}
                try:
                    g = await client.post("https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + safebrowsing_key, json=cuerpo, timeout=20)
                    for mt in (g.json().get("matches") or []):
                        problemas.append(problema("safe_browsing", "critico", "Google Safe Browsing lo marca como peligroso: " + mt.get("threatType", ""), host_final))
                    datos["safe_browsing"] = "revisado"
                except Exception:  # noqa: BLE001
                    datos["safe_browsing"] = "sin respuesta"
            # RDAP: vencimiento del dominio
            dom = dominio_registrable(host_final)
            rd = await pedir(client, "https://rdap.org/domain/" + dom, seguir_redir=True, timeout=20)
            try:
                ev = next((e for e in json.loads(rd["texto"]).get("events", []) if e.get("eventAction") == "expiration"), None)
            except ValueError:
                ev = None
            if ev:
                datos["dominio_vence"] = ev["eventDate"][:10]
                d = dias_hasta(ev["eventDate"])
                if d <= 30:
                    problemas.append(problema("dominio", "critico" if d <= 7 else "aviso", f"El dominio {dom} vence en {d} días ({ev['eventDate'][:10]}).", dom))

    nivel = "critico" if any(p["nivel"] == "critico" for p in problemas) else ("aviso" if problemas else "ok")
    return {"ok": True, "url": url, "host": host, "nombre": nombre, "modo": modo, "nivel": nivel, "problemas": problemas,
            "datos": datos, "scripts_vistos": ext, "revisado_en": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "duracion_s": round(time.monotonic() - inicio, 1)}
