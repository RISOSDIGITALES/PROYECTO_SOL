"""Línea de comandos.

  python -m vigia revisar ejemplo.com [--rapido] [--json] [--max-paginas 25] [--email a@b.com]
  python -m vigia inscribir ejemplo.com --email a@b.com [--telegram CHAT_ID] [--webhook URL] [--nombre X] [--idioma en]
  python -m vigia quitar ejemplo.com
  python -m vigia lista
  python -m vigia ronda --modo rapido|completo      (revisa todos los inscriptos; para usar con cron)
  python -m vigia servir                            (API + reloj interno; necesita VIGIA_TOKEN)
"""
from __future__ import annotations

import argparse
import json
import logging
import sys

from . import checks
from .core import Config, revisar_todos, revisar_y_avisar
from .store import Store

ICONO = {"critico": "🔴", "aviso": "🟠", "ok": "✅"}


def imprimir(inf: dict) -> None:
    if not inf.get("ok"):
        print("Error:", inf.get("error"))
        return
    d = inf["datos"]
    print(f"{ICONO.get(inf['nivel'], '')} {inf['url']} — {inf['nivel']} ({inf['modo']}, {inf['duracion_s']} s)")
    extra = {k: d[k] for k in ("status", "tiempo_ms", "cert_vence", "dominio_vence", "cms", "sucuri", "paginas_revisadas", "enlaces_revisados", "enlaces_rotos") if k in d}
    print("   " + " · ".join(f"{k}: {v}" for k, v in extra.items()))
    for p in inf["problemas"]:
        print(f"   [{p['nivel']}] {p['detalle']}" + (f"  ({p['donde']})" if p.get("donde") else ""))
    if inf.get("envios"):
        print("   envíos:", inf["envios"])


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(prog="vigia", description="Vigía Web: vigila sitios web (caídas, enlaces rotos, malware, certificado, dominio).")
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("revisar", help="revisa un sitio ahora")
    r.add_argument("url")
    r.add_argument("--rapido", action="store_true", help="solo la portada")
    r.add_argument("--json", action="store_true", help="informe completo en JSON")
    r.add_argument("--max-paginas", type=int)
    for p in (r, i := sub.add_parser("inscribir", help="vigilar un sitio de forma automática")):
        p.add_argument("--email", default="")
        p.add_argument("--telegram", default="")
        p.add_argument("--webhook", default="")
        p.add_argument("--nombre", default="")
        p.add_argument("--idioma", default="es", choices=["es", "en"])
    i.add_argument("url")
    sub.add_parser("quitar").add_argument("url")
    sub.add_parser("lista")
    ro = sub.add_parser("ronda", help="revisa todos los inscriptos (para cron)")
    ro.add_argument("--modo", choices=["rapido", "completo"], default="rapido")
    sub.add_parser("servir", help="API HTTP + reloj interno")
    a = ap.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    cfg = Config()
    if a.cmd == "servir":
        from .server import servir
        servir(cfg)
        return 0
    store = Store(cfg.db)
    if a.cmd == "revisar":
        url = checks.normalizar(a.url)
        if not url:
            print("Dirección no válida.")
            return 2
        sitio = {"url": url, "nombre": a.nombre, "idioma": a.idioma, "email": a.email, "telegram": a.telegram, "webhook": a.webhook}
        inf = revisar_y_avisar(cfg, store, sitio, "rapido" if a.rapido else "completo", automatico=False, max_paginas=a.max_paginas)
        inf.pop("scripts_vistos", None)
        print(json.dumps(inf, ensure_ascii=False, indent=2)) if a.json else imprimir(inf)
        return 0 if inf.get("nivel") == "ok" else (2 if inf.get("nivel") == "critico" else 1)
    if a.cmd == "inscribir":
        url = checks.normalizar(a.url)
        if not url or not (a.email or a.telegram or a.webhook):
            print("Hace falta una dirección válida y al menos un destino: --email, --telegram o --webhook.")
            return 2
        store.inscribir(url, a.nombre, a.idioma, a.email, a.telegram, a.webhook)
        print("Inscripto:", url)
        return 0
    if a.cmd == "quitar":
        print("Quitado." if store.quitar(checks.normalizar(a.url)) else "No estaba inscripto.")
        return 0
    if a.cmd == "lista":
        for s in store.sitios():
            print(f"{s['url']}  ({s['nombre'] or '-'}, {s['idioma']})  email: {s['email'] or '-'}  telegram: {s['telegram'] or '-'}  webhook: {s['webhook'] or '-'}")
        return 0
    if a.cmd == "ronda":
        for inf in revisar_todos(cfg, store, a.modo):
            imprimir(inf)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
