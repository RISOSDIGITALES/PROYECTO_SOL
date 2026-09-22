"""Envío real de correo -- hoy solo lo usa la recuperación de contraseña
(2026-09-21). SMTP simple (smtplib), sin ninguna librería nueva -- alcanza
para el volumen real de esta función (un correo puntual por pedido de
reseteo, no una campaña). Reusa el mismo tipo de cuenta Gmail SMTP ya usada
en el resto del proyecto (ver CLAUDE.md, ítem 72), con su propio cliente
acá porque este backend no pasa por n8n.

SMTP_SSL (465, SSL directo desde el inicio), no SMTP+starttls (587) --
confirmado en vivo el 22-sep que este entorno bloquea el puerto 587
saliente (TCP timeout puro contra smtp.gmail.com, mismo tipo de bloqueo de
red ya visto con Groq) mientras que 443/465/80 sí conectan. Gmail soporta
ambos igual de bien, así que este cambio no depende de ningún relay."""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .config import settings


class EmailSendError(Exception):
    """Mismo criterio que TelephonyProvisionError -- el mensaje real
    siempre está pensado para mostrarse tal cual, nunca se atrapa en
    silencio fingiendo que el correo salió cuando no salió."""


def send_email(to: str, subject: str, html_body: str) -> None:
    if not settings.smtp_user or not settings.smtp_app_password:
        raise EmailSendError(
            "El envío de correo todavía no está configurado en la plataforma "
            "(falta SMTP_USER / SMTP_APP_PASSWORD)."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.login(settings.smtp_user, settings.smtp_app_password)
            server.sendmail(settings.smtp_user, [to], msg.as_string())
    except smtplib.SMTPException as exc:
        raise EmailSendError(f"No se pudo mandar el correo: {exc}") from exc
    except OSError as exc:
        raise EmailSendError(f"No se pudo conectar con el servidor de correo: {exc}") from exc
