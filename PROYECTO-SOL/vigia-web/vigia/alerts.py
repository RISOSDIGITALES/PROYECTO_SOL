"""Decide qué avisar y lo manda por correo (SMTP), Telegram o webhook."""
from __future__ import annotations

import hashlib
import hmac
import html
import json
import logging
import smtplib
import time
from email.message import EmailMessage

import httpx

from .checks import PORTADA_TIPOS

log = logging.getLogger("vigia")
REPETIR_CADA = 24 * 3600

T = {
    "es": dict(titulo="Vigía Web", critico="Problema crítico", aviso="Avisos", ok="Todo en orden", resuelto="Resuelto", en="en",
               revisado="Revisado", donde="Dónde", resueltos="Ya no aparecen (resueltos)", datos="Datos",
               pie="Aviso automático de Vigía Web. Se repite solo si el problema sigue después de 24 horas."),
    "en": dict(titulo="Website Watch", critico="Critical issue", aviso="Warnings", ok="All good", resuelto="Resolved", en="on",
               revisado="Checked", donde="Where", resueltos="No longer found (resolved)", datos="Data",
               pie="Automatic alert from Website Watch. It repeats only if the problem is still there after 24 hours."),
}


def clave(p: dict) -> str:
    return p["tipo"] + "|" + p["detalle"][:160]


def decidir(inf: dict, previos: dict, automatico: bool) -> tuple[list[dict], list[dict], dict]:
    """Devuelve (a avisar, resueltos, nueva memoria de avisados).
    Manual: se avisa todo. Automático: solo lo nuevo o lo que sigue después de 24 h; la revisión rápida avisa solo lo crítico,
    y avisa cuando un problema crítico desaparece (la rápida solo puede ver los de la portada)."""
    ahora = time.time()
    if not automatico:
        return list(inf["problemas"]), [], previos
    mandar = [p for p in inf["problemas"] if clave(p) not in previos or ahora - previos[clave(p)]["ts"] > REPETIR_CADA]
    if inf["modo"] == "rapido":
        mandar = [p for p in mandar if p["nivel"] == "critico"]
    actuales = {clave(p) for p in inf["problemas"]}
    resueltos = [v for k, v in previos.items() if v["nivel"] == "critico" and k not in actuales and (inf["modo"] == "completo" or v.get("portada"))]
    nueva: dict = {}
    enviados = {clave(p) for p in mandar}
    url_final = inf.get("datos", {}).get("url_final")
    for p in inf["problemas"]:
        k = clave(p)
        nueva[k] = {"ts": ahora if k in enviados else previos.get(k, {}).get("ts", ahora), "nivel": p["nivel"], "detalle": p["detalle"],
                    "portada": p["tipo"] in PORTADA_TIPOS and p.get("donde") in (url_final, inf["url"])}
    if inf["modo"] == "rapido":  # lo que la rápida no puede ver se conserva hasta la completa
        for k, v in previos.items():
            if k not in nueva and not v.get("portada"):
                nueva[k] = v
    return mandar, resueltos, nueva


def armar(inf: dict, mandar: list[dict], resueltos: list[dict], idioma: str = "es") -> dict:
    t = T.get(idioma, T["es"])
    nivel = "critico" if any(p["nivel"] == "critico" for p in mandar) else ("aviso" if mandar else ("resuelto" if resueltos else "ok"))
    color = {"critico": "#c81e1e", "aviso": "#b45309", "resuelto": "#15803d", "ok": "#15803d"}[nivel]
    etiqueta = {"critico": t["critico"], "aviso": t["aviso"], "resuelto": t["resuelto"], "ok": t["ok"]}[nivel]
    nombre = inf.get("nombre") or inf["host"]
    icono = {"critico": "🔴", "aviso": "🟠"}.get(nivel, "✅")
    asunto = f"{icono} {t['titulo']}: {etiqueta} {t['en']} {nombre}"
    e = html.escape
    d = inf.get("datos", {})
    pares = [("HTTP", d.get("status")), ("ms", d.get("tiempo_ms")), ("CMS", d.get("cms")), ("SSL", d.get("cert_vence")),
             ("Domain", d.get("dominio_vence")), ("Sucuri", d.get("sucuri")), ("Pages", d.get("paginas_revisadas")),
             ("Links", f"{d['enlaces_revisados']} ({d.get('enlaces_rotos', 0)} ✗)" if d.get("enlaces_revisados") is not None else None)]
    datos_txt = " · ".join(f"{k}: {v}" for k, v in pares if v not in (None, ""))
    filas = "".join(
        f'<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top;"><span style="display:inline-block;padding:1px 6px;'
        f'border-radius:4px;font-size:11px;color:#fff;background:{"#c81e1e" if p["nivel"] == "critico" else "#b45309"};">{e(p["nivel"])}</span></td>'
        f'<td style="padding:6px 8px;border-bottom:1px solid #eee;">{e(p["detalle"])}'
        + (f'<br><span style="color:#6b7280;font-size:12px;">{e(t["donde"])}: {e(p["donde"])}</span>' if p.get("donde") else "") + "</td></tr>"
        for p in mandar)
    cuerpo_html = (
        f'<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;">'
        f'<div style="background:{color};color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;"><b style="font-size:16px;">{e(t["titulo"])} · {e(etiqueta)}</b>'
        f'<br><span style="font-size:13px;">{e(nombre)} — {e(inf["url"])}</span></div>'
        f'<div style="border:1px solid #e5e7eb;border-top:none;padding:12px 18px;border-radius:0 0 8px 8px;">'
        + (f'<table style="width:100%;border-collapse:collapse;font-size:14px;">{filas}</table>' if mandar else f'<p style="font-size:14px;">{e(t["ok"]) if nivel == "ok" else ""}</p>')
        + (f'<p style="margin-top:14px;font-size:14px;"><b>{e(t["resueltos"])}</b></p><ul style="font-size:13px;">' + "".join(f"<li>{e(v['detalle'])}</li>" for v in resueltos) + "</ul>" if resueltos else "")
        + f'<p style="font-size:12px;color:#374151;margin-top:14px;">{e(t["datos"])}: {e(datos_txt)}</p>'
        f'<p style="font-size:11px;color:#9ca3af;">{e(t["revisado"])}: {e(inf["revisado_en"])} · {e(inf["modo"])}. {e(t["pie"])}</p></div></div>')
    lineas = [asunto, inf["url"], ""] + [f"[{p['nivel']}] {p['detalle']}" + (f" ({t['donde']}: {p['donde']})" if p.get("donde") else "") for p in mandar]
    if resueltos:
        lineas += ["", t["resueltos"] + ":"] + [f"- {v['detalle']}" for v in resueltos]
    lineas += ["", f"{t['datos']}: {datos_txt}"]
    return {"asunto": asunto, "html": cuerpo_html, "texto": "\n".join(lineas), "nivel": nivel}


def enviar_correo(cfg, para: str, msg: dict) -> str:
    if not cfg.smtp_host:
        return "sin SMTP configurado"
    m = EmailMessage()
    m["Subject"], m["From"], m["To"] = msg["asunto"], cfg.smtp_from or cfg.smtp_user, para
    m.set_content(msg["texto"])
    m.add_alternative(msg["html"], subtype="html")
    try:
        if cfg.smtp_port == 465:
            s = smtplib.SMTP_SSL(cfg.smtp_host, cfg.smtp_port, timeout=30)
        else:
            s = smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=30)
            s.starttls()
        with s:
            if cfg.smtp_user:
                s.login(cfg.smtp_user, cfg.smtp_password)
            s.send_message(m)
        return "ok"
    except Exception as e:  # noqa: BLE001
        log.warning("correo a %s falló: %s", para, e)
        return f"error: {e}"[:200]


def enviar_telegram(cfg, chat_id: str, msg: dict) -> str:
    if not cfg.telegram_token:
        return "sin bot de Telegram configurado"
    try:
        r = httpx.post(f"https://api.telegram.org/bot{cfg.telegram_token}/sendMessage",
                       json={"chat_id": chat_id, "text": msg["texto"][:4000], "disable_web_page_preview": True}, timeout=20)
        return "ok" if r.status_code == 200 else f"error {r.status_code}"
    except Exception as e:  # noqa: BLE001
        return f"error: {e}"[:200]


def enviar_webhook(cfg, url: str, inf: dict, mandar: list[dict], resueltos: list[dict]) -> str:
    cuerpo = json.dumps({"evento": "vigia_web", "informe": inf, "avisos": mandar, "resueltos": resueltos}, ensure_ascii=False).encode()
    h = {"Content-Type": "application/json"}
    if cfg.webhook_secret:  # firma para que quien recibe sepa que viene del Vigía
        h["X-Vigia-Firma"] = hmac.new(cfg.webhook_secret.encode(), cuerpo, hashlib.sha256).hexdigest()
    try:
        r = httpx.post(url, content=cuerpo, headers=h, timeout=20)
        return "ok" if r.status_code < 300 else f"error {r.status_code}"
    except Exception as e:  # noqa: BLE001
        return f"error: {e}"[:200]


def notificar(cfg, sitio: dict, inf: dict, mandar: list[dict], resueltos: list[dict]) -> dict:
    msg = armar(inf, mandar, resueltos, sitio.get("idioma") or "es")
    res = {}
    for para in [x for x in (sitio.get("email") or "").replace(";", ",").split(",") if x.strip()]:
        res["correo " + para.strip()] = enviar_correo(cfg, para.strip(), msg)
    if sitio.get("telegram"):
        res["telegram"] = enviar_telegram(cfg, sitio["telegram"], msg)
    if sitio.get("webhook"):
        res["webhook"] = enviar_webhook(cfg, sitio["webhook"], inf, mandar, resueltos)
    return res
