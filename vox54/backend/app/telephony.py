import httpx

from .config import settings

TWILIO_BASE = "https://api.twilio.com/2010-04-01"
VERIFY_BASE = "https://verify.twilio.com/v2"


class TelephonyProvisionError(Exception):
    """Nunca se atrapa en silencio -- el mensaje real que trae siempre está
    pensado para mostrarse tal cual en el panel (agencia o negocio), no es
    un detalle interno. Si algún día esto crece a más de un proveedor real,
    cada rama sigue tirando este mismo tipo con su propio mensaje real."""


def provision_phone_number(country: str = "US") -> str:
    """Busca y compra un número real de Twilio para la plataforma (nunca a
    nombre del cliente) y lo devuelve en formato E.164 (ej. "+13055550123").

    Sin TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN configurados, ni siquiera
    intenta la llamada -- tira TelephonyProvisionError de entrada. Es a
    propósito: nunca se inventa un número como si fuera real, y nunca se
    deja que Twilio devuelva un 401 crudo sin explicar qué significa.
    """
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise TelephonyProvisionError(
            "La cuenta de Twilio todavía no está configurada en la plataforma "
            "(falta TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)."
        )

    sid = settings.twilio_account_sid
    auth = (sid, settings.twilio_auth_token)

    try:
        with httpx.Client(auth=auth, timeout=15) as client:
            # Bug real encontrado el 2026-09-19 probando contra la cuenta
            # real de Twilio: "SmsEnabled": "false" no significa "no me
            # importa si tiene SMS" -- Twilio lo interpreta como "solo
            # números que NO soporten SMS", y casi ningún número local lo
            # cumple. Confirmado en vivo: con ese filtro, 0 resultados
            # siempre; sacándolo, resultados reales de inmediato. Solo nos
            # importa la voz, así que no se filtra por SMS en absoluto.
            search = client.get(
                f"{TWILIO_BASE}/Accounts/{sid}/AvailablePhoneNumbers/{country}/Local.json",
                params={"VoiceEnabled": "true", "PageSize": 1},
            )
    except httpx.HTTPError as exc:
        raise TelephonyProvisionError(f"No se pudo conectar con Twilio: {exc}") from exc

    if search.status_code != 200:
        raise TelephonyProvisionError(
            f"Twilio no pudo buscar números disponibles (código {search.status_code})."
        )

    available = search.json().get("available_phone_numbers", [])
    if not available:
        raise TelephonyProvisionError(
            f"No hay números disponibles para comprar en este momento ({country})."
        )
    candidate = available[0]["phone_number"]

    try:
        with httpx.Client(auth=auth, timeout=15) as client:
            purchase = client.post(
                f"{TWILIO_BASE}/Accounts/{sid}/IncomingPhoneNumbers.json",
                data={"PhoneNumber": candidate},
            )
    except httpx.HTTPError as exc:
        raise TelephonyProvisionError(f"No se pudo conectar con Twilio: {exc}") from exc

    if purchase.status_code not in (200, 201):
        raise TelephonyProvisionError(
            f"Twilio no pudo completar la compra del número (código {purchase.status_code})."
        )

    return purchase.json()["phone_number"]


def _verify_auth_or_raise() -> tuple[str, str]:
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise TelephonyProvisionError(
            "La cuenta de Twilio todavía no está configurada en la plataforma "
            "(falta TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)."
        )
    if not settings.twilio_verify_service_sid:
        raise TelephonyProvisionError(
            "No hay ningún servicio de verificación configurado en la plataforma "
            "(falta TWILIO_VERIFY_SERVICE_SID)."
        )
    return settings.twilio_verify_service_sid, settings.twilio_account_sid


def start_phone_verification(phone_number: str) -> None:
    """Manda un código real por SMS al número que el negocio dice que es
    suyo -- vía Twilio Verify, no un código inventado por nosotros ni
    guardado en texto plano en ningún lado. Incidente real del 2026-09-19:
    el flujo de "usar mi propio número" compraba un número nuevo sin pedir
    ni comprobar el número real -- esto es lo que faltaba antes de aceptar
    cualquier número como propio."""
    service_sid, account_sid = _verify_auth_or_raise()
    auth = (account_sid, settings.twilio_auth_token)
    try:
        with httpx.Client(auth=auth, timeout=15) as client:
            resp = client.post(
                f"{VERIFY_BASE}/Services/{service_sid}/Verifications",
                data={"To": phone_number, "Channel": "sms"},
            )
    except httpx.HTTPError as exc:
        raise TelephonyProvisionError(f"No se pudo conectar con Twilio: {exc}") from exc

    if resp.status_code not in (200, 201):
        detail = resp.json().get("message", f"código {resp.status_code}")
        raise TelephonyProvisionError(f"No se pudo enviar el código de verificación: {detail}")


def check_phone_verification(phone_number: str, code: str) -> bool:
    """Confirma el código real que el negocio recibió por SMS. Devuelve
    True/False según lo que Twilio realmente confirme -- nunca asume éxito
    ni guarda el número como verificado sin esta llamada real."""
    service_sid, account_sid = _verify_auth_or_raise()
    auth = (account_sid, settings.twilio_auth_token)
    try:
        with httpx.Client(auth=auth, timeout=15) as client:
            resp = client.post(
                f"{VERIFY_BASE}/Services/{service_sid}/VerificationCheck",
                data={"To": phone_number, "Code": code},
            )
    except httpx.HTTPError as exc:
        raise TelephonyProvisionError(f"No se pudo conectar con Twilio: {exc}") from exc

    if resp.status_code != 200:
        # Un código vencido/ya usado da 404 de Twilio -- no es un error de
        # conexión, es un "no, no coincide" real.
        return False

    return resp.json().get("status") == "approved"
