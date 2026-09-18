import httpx

from .config import settings

TWILIO_BASE = "https://api.twilio.com/2010-04-01"


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
            search = client.get(
                f"{TWILIO_BASE}/Accounts/{sid}/AvailablePhoneNumbers/{country}/Local.json",
                params={"VoiceEnabled": "true", "SmsEnabled": "false", "PageSize": 1},
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
