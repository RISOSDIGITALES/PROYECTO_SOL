"""Pruebas sin internet: un sitio de prueba local con problemas conocidos."""
import asyncio
import json
import threading
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

from vigia import alerts, checks
from vigia.core import Config
from vigia.server import crear_handler
from vigia.store import Store

PAGINAS = {
    "/": '<html><body><a href="/ok">ok</a> <a href="/roto">roto</a> <a href="/oculto">x</a> <a href="/spam">s</a> '
         '<a href="/esp">e</a> <a href="mailto:a@b.com">m</a> <a href="Correo@ejemplo.com">mal</a>'
         '<script src="https://cdn.ejemplo-scripts.com/a.js"></script></body></html>',
    "/ok": "<html><body>todo bien</body></html>",
    "/oculto": '<html><body><iframe src="https://malo.example/x" width="0" height="0"></iframe></body></html>',
    "/spam": "<html><body>buy viagra and cialis now</body></html>",
    "/esp": "<html><body>Somos especialistas en embalaje</body></html>",
}


class Sitio(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _resp(self, cuerpo):
        if self.path == "/redir":
            self.send_response(302)
            self.send_header("Location", f"http://localhost:{self.server.server_address[1]}/ok")
            self.end_headers()
            return
        if self.path not in PAGINAS:
            self.send_response(404)
            self.end_headers()
            return
        b = PAGINAS[self.path].encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        if cuerpo:
            self.wfile.write(b)

    def do_GET(self):
        self._resp(True)

    def do_HEAD(self):
        self._resp(False)


@pytest.fixture(scope="module")
def sitio():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), Sitio)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


def revisar(url, modo="completo", conocidos=None):
    return asyncio.run(checks.revisar(url, modo, 10, 50, "", conocidos, externos=False))


def tipos(inf):
    return [p["tipo"] for p in inf["problemas"]]


def test_normalizar():
    assert checks.normalizar("ejemplo.com") == "https://ejemplo.com/"
    assert checks.normalizar("HTTP://Ejemplo.com/a/") == "http://ejemplo.com/a"
    assert checks.normalizar("no es url") == ""
    assert checks.dominio_registrable("www.tienda.ejemplo.com.mx") == "ejemplo.com.mx"


def test_completo_encuentra_lo_conocido(sitio):
    inf = revisar(sitio + "/")
    assert inf["ok"] and inf["nivel"] == "critico"
    detalles = " ".join(p["detalle"] for p in inf["problemas"])
    assert "iframe_oculto" in tipos(inf)
    assert "spam" in tipos(inf) and "viagra" in detalles and "cialis" in detalles
    assert "Correo@ejemplo.com" in detalles  # enlace sin mailto: da 404
    assert inf["datos"]["paginas_revisadas"] >= 5
    assert "sin_https" in tipos(inf)


def test_sin_falso_spam(sitio):
    inf = revisar(sitio + "/esp", "rapido")
    assert "spam" not in tipos(inf)


def test_pagina_caida(sitio):
    inf = revisar(sitio + "/no-existe", "rapido")
    assert inf["nivel"] == "critico" and "caido" in tipos(inf)


def test_redireccion_a_otro_dominio(sitio):
    inf = revisar(sitio + "/redir", "rapido")
    assert "redireccion" in tipos(inf)


def test_scripts_nuevos(sitio):
    assert "script_nuevo" not in tipos(revisar(sitio + "/", "rapido", conocidos=None))  # primera vez: solo base
    assert "script_nuevo" in tipos(revisar(sitio + "/", "rapido", conocidos=[]))
    assert "script_nuevo" not in tipos(revisar(sitio + "/", "rapido", conocidos=["cdn.ejemplo-scripts.com"]))


def test_no_responde():
    inf = revisar("http://127.0.0.1:9/", "rapido")
    assert inf["nivel"] == "critico" and "caido" in tipos(inf)


def _inf(problemas, modo="completo"):
    return {"url": "https://x.com/", "host": "x.com", "nombre": "", "modo": modo, "problemas": problemas,
            "datos": {"url_final": "https://x.com/"}, "revisado_en": "2026-11-24T00:00:00+00:00"}


def test_avisos_no_se_repiten_y_avisan_resuelto():
    caido = checks.problema("caido", "critico", "La portada responde 500.", "https://x.com/")
    roto = checks.problema("enlace_roto_interno", "aviso", "Enlace interno roto (404): https://x.com/a", "https://x.com/")
    mandar, res, mem = alerts.decidir(_inf([caido, roto]), {}, automatico=True)
    assert len(mandar) == 2 and not res
    mandar, res, mem2 = alerts.decidir(_inf([caido, roto]), mem, automatico=True)
    assert mandar == [] and not res  # mismo problema antes de 24 h: no se repite
    mandar, res, mem3 = alerts.decidir(_inf([roto], "rapido"), mem2, automatico=True)
    assert mandar == [] and len(res) == 1  # la rápida ve que la portada volvió
    assert any("enlace_roto" in k for k in mem3)  # el enlace roto (no visible en la rápida) se conserva


def test_rapida_avisa_solo_critico():
    aviso = checks.problema("lento", "aviso", "La portada tardó 9.0 s en responder.", "https://x.com/")
    mandar, _, _ = alerts.decidir(_inf([aviso], "rapido"), {}, automatico=True)
    assert mandar == []


def test_correo_armado():
    msg = alerts.armar(_inf([checks.problema("caido", "critico", "<b>no</b>", "")]), [checks.problema("caido", "critico", "<b>no</b>", "")], [], "en")
    assert msg["asunto"].startswith("🔴 Website Watch") and "&lt;b&gt;" in msg["html"]


def test_store(tmp_path):
    st = Store(str(tmp_path / "v.db"))
    st.inscribir("https://x.com/", email="a@b.com")
    assert [s["url"] for s in st.sitios()] == ["https://x.com/"]
    assert st.scripts("https://x.com/", "x.com") is None
    st.guardar_informe({"url": "https://x.com/", "modo": "rapido", "nivel": "ok", "revisado_en": "t"})
    st.anotar_scripts("x.com", ["cdn.a.com"])
    assert st.scripts("https://x.com/", "x.com") == ["cdn.a.com"]
    assert st.quitar("https://x.com/") and not st.sitios()


def test_api(tmp_path, sitio):
    cfg = Config()
    cfg.token = "secreto"
    st = Store(str(tmp_path / "api.db"))
    srv = ThreadingHTTPServer(("127.0.0.1", 0), crear_handler(cfg, st))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}"

    def pedir(metodo, ruta, cuerpo=None, token="secreto"):
        req = urllib.request.Request(base + ruta, method=metodo, data=json.dumps(cuerpo).encode() if cuerpo is not None else None,
                                     headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    assert pedir("GET", "/salud")[0] == 200
    assert pedir("GET", "/sitios", token="mal")[0] == 401
    assert pedir("POST", "/sitios", {"url": "ejemplo.com"})[0] == 400  # sin destino
    c, j = pedir("POST", "/sitios", {"url": "ejemplo.com", "email": "a@b.com"})
    assert c == 200 and j["inscripto"] == "https://ejemplo.com/"
    c, j = pedir("POST", "/revisar", {"url": sitio + "/esp", "modo": "rapido"})
    assert c == 200 and j["ok"] and j["modo"] == "rapido"
    assert pedir("DELETE", "/sitios?url=ejemplo.com")[1]["quitado"] is True
    srv.shutdown()
