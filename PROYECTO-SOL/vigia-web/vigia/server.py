"""API HTTP mínima (sin dependencias) y reloj interno: rápida cada hora, completa una vez al día.

Rutas (todas con `Authorization: Bearer <VIGIA_TOKEN>`, salvo /salud):
  GET    /salud                        estado
  GET    /sitios                       sitios inscriptos
  POST   /sitios       {url, email?, telegram?, webhook?, nombre?, idioma?}   inscribir
  DELETE /sitios?url=ejemplo.com       quitar
  POST   /revisar      {url, modo?: "rapido"|"completo", max_paginas?, email?, telegram?, webhook?, idioma?}
  GET    /informes?url=ejemplo.com&n=10
"""
from __future__ import annotations

import datetime as dt
import hmac
import json
import logging
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit
from zoneinfo import ZoneInfo

from . import checks
from .core import Config, revisar_todos, revisar_y_avisar
from .store import Store

log = logging.getLogger("vigia")


def reloj(cfg: Config, store: Store, parar: threading.Event) -> None:
    zona = ZoneInfo(cfg.zona)
    hh, mm = (int(x) for x in cfg.hora_completa.split(":"))
    ultima_rapida = ultima_completa = None
    while not parar.is_set():
        ahora = dt.datetime.now(zona)
        hoy = ahora.date()
        if ahora.hour == hh and ahora.minute >= mm and ultima_completa != hoy:
            ultima_completa = hoy
            ultima_rapida = (hoy, ahora.hour)
            revisar_todos(cfg, store, "completo")
        elif ahora.minute >= cfg.minuto_rapida and ultima_rapida != (hoy, ahora.hour):
            ultima_rapida = (hoy, ahora.hour)
            revisar_todos(cfg, store, "rapido")
        parar.wait(30)


def crear_handler(cfg: Config, store: Store):
    class H(BaseHTTPRequestHandler):
        server_version = "VigiaWeb/1.0"

        def log_message(self, fmt, *args):  # al log normal, no a stderr
            log.info("%s %s", self.address_string(), fmt % args)

        def _json(self, codigo: int, obj) -> None:
            b = json.dumps(obj, ensure_ascii=False).encode()
            self.send_response(codigo)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(b)))
            self.end_headers()
            self.wfile.write(b)

        def _autorizado(self) -> bool:
            dado = (self.headers.get("Authorization") or "").removeprefix("Bearer ").strip()
            return bool(cfg.token) and hmac.compare_digest(dado, cfg.token)

        def _cuerpo(self) -> dict:
            n = int(self.headers.get("Content-Length") or 0)
            if n > 100_000:
                return {}
            try:
                return json.loads(self.rfile.read(n) or b"{}")
            except ValueError:
                return {}

        def _ruta(self):
            p = urlsplit(self.path)
            return p.path.rstrip("/") or "/", {k: v[0] for k, v in parse_qs(p.query).items()}

        def do_GET(self):
            ruta, q = self._ruta()
            if ruta == "/salud":
                return self._json(200, {"ok": True, "sitios": len(store.sitios())})
            if not self._autorizado():
                return self._json(401, {"ok": False, "error": "no autorizado"})
            if ruta == "/sitios":
                return self._json(200, {"ok": True, "sitios": store.sitios()})
            if ruta == "/informes":
                url = checks.normalizar(q.get("url", ""))
                return self._json(200, {"ok": True, "informes": store.informes(url, min(50, int(q.get("n", 10))))})
            return self._json(404, {"ok": False, "error": "ruta desconocida"})

        def do_DELETE(self):
            ruta, q = self._ruta()
            if not self._autorizado():
                return self._json(401, {"ok": False, "error": "no autorizado"})
            if ruta == "/sitios":
                return self._json(200, {"ok": True, "quitado": store.quitar(checks.normalizar(q.get("url", "")))})
            return self._json(404, {"ok": False, "error": "ruta desconocida"})

        def do_POST(self):
            ruta, _ = self._ruta()
            if not self._autorizado():
                return self._json(401, {"ok": False, "error": "no autorizado"})
            b = self._cuerpo()
            url = checks.normalizar(str(b.get("url", "")))
            if not url:
                return self._json(400, {"ok": False, "error": "Falta una url válida (por ejemplo, ejemplo.com)."})
            sitio = {"url": url, "nombre": str(b.get("nombre", ""))[:80], "idioma": "en" if b.get("idioma") == "en" else "es",
                     "email": str(b.get("email", ""))[:300], "telegram": str(b.get("telegram", ""))[:40], "webhook": str(b.get("webhook", ""))[:300]}
            if ruta == "/sitios":
                if not any(sitio[k] for k in ("email", "telegram", "webhook")):
                    return self._json(400, {"ok": False, "error": "Para inscribir un sitio hace falta al menos un destino: email, telegram o webhook."})
                store.inscribir(**sitio)
                return self._json(200, {"ok": True, "inscripto": url, "sitios": store.sitios()})
            if ruta == "/revisar":
                modo = "rapido" if b.get("modo") == "rapido" else "completo"
                mp = max(1, min(60, int(b.get("max_paginas") or cfg.max_paginas)))
                inf = revisar_y_avisar(cfg, store, sitio, modo, automatico=False, max_paginas=mp)
                inf.pop("scripts_vistos", None)
                return self._json(200 if inf.get("ok") else 400, inf)
            return self._json(404, {"ok": False, "error": "ruta desconocida"})

    return H


def servir(cfg: Config) -> None:
    if not cfg.token:
        raise SystemExit("Falta VIGIA_TOKEN: la API no arranca sin una clave.")
    store = Store(cfg.db)
    parar = threading.Event()
    threading.Thread(target=reloj, args=(cfg, store, parar), daemon=True).start()
    srv = ThreadingHTTPServer(("0.0.0.0", cfg.puerto), crear_handler(cfg, store))
    log.info("Vigía Web escuchando en :%d (zona %s, completa a las %s, rápida a los :%02d)", cfg.puerto, cfg.zona, cfg.hora_completa, cfg.minuto_rapida)
    try:
        srv.serve_forever()
    finally:
        parar.set()
        time.sleep(0.1)
