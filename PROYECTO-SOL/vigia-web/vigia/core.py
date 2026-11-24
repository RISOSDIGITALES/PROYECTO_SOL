"""Configuración (variables de entorno) y el motor: revisa, guarda, decide y avisa."""
from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass, field

from . import alerts, checks
from .store import Store

log = logging.getLogger("vigia")


@dataclass
class Config:
    db: str = field(default_factory=lambda: os.getenv("VIGIA_DB", "vigia.db"))
    token: str = field(default_factory=lambda: os.getenv("VIGIA_TOKEN", ""))
    puerto: int = field(default_factory=lambda: int(os.getenv("VIGIA_PUERTO", "8080")))
    zona: str = field(default_factory=lambda: os.getenv("VIGIA_ZONA", "America/New_York"))
    hora_completa: str = field(default_factory=lambda: os.getenv("VIGIA_HORA_COMPLETA", "06:05"))
    minuto_rapida: int = field(default_factory=lambda: int(os.getenv("VIGIA_MINUTO_RAPIDA", "17")))
    max_paginas: int = field(default_factory=lambda: int(os.getenv("VIGIA_MAX_PAGINAS", "25")))
    max_enlaces: int = field(default_factory=lambda: int(os.getenv("VIGIA_MAX_ENLACES", "250")))
    smtp_host: str = field(default_factory=lambda: os.getenv("SMTP_HOST", ""))
    smtp_port: int = field(default_factory=lambda: int(os.getenv("SMTP_PORT", "587")))
    smtp_user: str = field(default_factory=lambda: os.getenv("SMTP_USER", ""))
    smtp_password: str = field(default_factory=lambda: os.getenv("SMTP_PASSWORD", ""))
    smtp_from: str = field(default_factory=lambda: os.getenv("SMTP_FROM", ""))
    telegram_token: str = field(default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", ""))
    webhook_secret: str = field(default_factory=lambda: os.getenv("VIGIA_WEBHOOK_SECRET", ""))
    safebrowsing_key: str = field(default_factory=lambda: os.getenv("GOOGLE_SAFEBROWSING_KEY", ""))


def revisar_y_avisar(cfg: Config, store: Store, sitio: dict, modo: str, automatico: bool, max_paginas: int | None = None) -> dict:
    """Revisa un sitio, guarda el informe y manda los avisos que correspondan. Devuelve el informe con lo avisado."""
    url = checks.normalizar(sitio["url"])
    host = checks.host_de(url)
    conocidos = store.scripts(url, host)
    inf = asyncio.run(checks.revisar(url, modo, max_paginas or cfg.max_paginas, cfg.max_enlaces, sitio.get("nombre", ""),
                                     conocidos, cfg.safebrowsing_key))
    if not inf.get("ok"):
        return inf
    store.anotar_scripts(host, inf.get("scripts_vistos", []))
    mandar, resueltos, memoria = alerts.decidir(inf, store.avisados(host), automatico)
    if automatico:
        store.guardar_avisados(host, memoria)
    store.guardar_informe(inf)
    hay_destino = any(sitio.get(k) for k in ("email", "telegram", "webhook"))
    if hay_destino and (mandar or resueltos or not automatico):
        inf["envios"] = alerts.notificar(cfg, sitio, inf, mandar, resueltos)
    inf["avisados"] = len(mandar)
    inf["resueltos"] = len(resueltos)
    log.info("%s %s: %s (%d problemas, %d avisados)", modo, url, inf["nivel"], len(inf["problemas"]), len(mandar))
    return inf


def revisar_todos(cfg: Config, store: Store, modo: str) -> list[dict]:
    out = []
    for s in store.sitios():
        try:
            out.append(revisar_y_avisar(cfg, store, s, modo, automatico=True))
        except Exception as e:  # noqa: BLE001 - un sitio que falla no frena a los demás
            log.exception("falló la revisión de %s", s["url"])
            out.append({"ok": False, "url": s["url"], "error": str(e)[:200]})
    return out
