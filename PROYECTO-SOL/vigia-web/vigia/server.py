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


DIAS = {"lun": 0, "mar": 1, "mie": 2, "mié": 2, "jue": 3, "vie": 4, "sab": 5, "sáb": 5, "dom": 6,
        "mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}


def dias_completa(texto: str) -> set[int]:
    """'todos' (o vacío) = los 7 días; si no, una lista como 'lun,jue' o 'mon,thu'. Un nombre desconocido se ignora."""
    t = (texto or "").strip().lower()
    if t in ("", "todos", "all", "*"):
        return set(range(7))
    dias = {DIAS[d.strip()[:3]] for d in t.split(",") if d.strip()[:3] in DIAS}
    return dias or set(range(7))


def que_toca(ahora: dt.datetime, cfg: Config, estado: dict) -> str | None:
    """Decide qué revisión corresponde en este momento y anota en `estado` para no repetirla.

    - Completa: a la hora de VIGIA_HORA_COMPLETA, una vez por día, solo los días de VIGIA_DIAS_COMPLETA.
    - Rápida: cada VIGIA_CADA_RAPIDA horas (contadas desde medianoche), al minuto VIGIA_MINUTO_RAPIDA; 0 la apaga.
      La hora en que corre la completa no hace además la rápida (la completa ya la incluye).
    """
    hh, mm = (int(x) for x in cfg.hora_completa.split(":"))
    hoy = ahora.date()
    if (ahora.weekday() in dias_completa(cfg.dias_completa) and ahora.hour == hh and ahora.minute >= mm
            and estado.get("completa") != hoy):
        estado["completa"] = hoy
        estado["rapida"] = (hoy, ahora.hour)
        return "completo"
    cada = cfg.cada_rapida
    if (cada > 0 and ahora.hour % cada == 0 and ahora.minute >= cfg.minuto_rapida
            and estado.get("rapida") != (hoy, ahora.hour)):
        estado["rapida"] = (hoy, ahora.hour)
        return "rapido"
    return None


def reloj(cfg: Config, store: Store, parar: threading.Event) -> None:
    zona = ZoneInfo(cfg.zona)
    estado: dict = {}
    while not parar.is_set():
        modo = que_toca(dt.datetime.now(zona), cfg, estado)
        if modo:
            try:
                revisar_todos(cfg, store, modo)
            except Exception:  # una ronda que falla no puede apagar el reloj
                log.exception("La ronda %s falló; el reloj sigue.", modo)
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
    log.info("Vigía Web escuchando en :%d (zona %s; completa a las %s, días: %s; rápida cada %d h a los :%02d)",
             cfg.puerto, cfg.zona, cfg.hora_completa, cfg.dias_completa or "todos", cfg.cada_rapida, cfg.minuto_rapida)
    try:
        srv.serve_forever()
    finally:
        parar.set()
        time.sleep(0.1)
