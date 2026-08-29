"""Validación server-side de la configuración del agente.

El frontend ya hace la cascada de proveedor→modelo/voz (BotConfigForm), pero eso
es solo cortesía de UI — un cliente de API directo (o un bug futuro del propio
frontend) podría mandar cualquier combinación. Esta validación corre siempre,
sin importar quién llame al endpoint, sobre el objeto YA MEZCLADO (config
existente + el patch parcial que llegó) — no sobre el patch solo, porque un
PUT parcial puede mandar solo `ai_model` sin `ai_provider`, y hay que validar
contra el proveedor que YA está guardado en ese caso.
"""
from email_validator import validate_email, EmailNotValidError
from fastapi import HTTPException, status

from . import catalog as catalog_data

BOT_CONFIG_FIELDS = [
    "telephony_provider", "telephony_trunk_id", "phone_number",
    "stt_provider", "stt_model",
    "tts_provider", "tts_voice_id",
    "runtime_target",
    "ai_provider", "ai_model", "ai_api_key",
    "system_prompt", "welcome_message", "escalation_email",
    "language", "status",
    "first_message_mode", "allow_interruptions",
    "silence_timeout_seconds", "max_duration_seconds",
    "end_call_message", "transfer_phone_number",
    "voicemail_detection_enabled", "voicemail_message",
]

VALID_LANGUAGES = {opt["id"] for opt in catalog_data.LANGUAGES}
VALID_STATUSES = {opt["id"] for opt in catalog_data.STATUSES}
VALID_FIRST_MESSAGE_MODES = {opt["id"] for opt in catalog_data.FIRST_MESSAGE_MODES}
VALID_TELEPHONY_PROVIDERS = {opt["id"] for opt in catalog_data.TELEPHONY_PROVIDERS}
VALID_RUNTIME_TARGETS = {opt["id"] for opt in catalog_data.RUNTIME_TARGETS}


def bot_config_as_dict(config) -> dict:
    return {field: getattr(config, field) for field in BOT_CONFIG_FIELDS}


def _valid_phone(phone: str) -> bool:
    cleaned = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]
    return cleaned.isdigit() and 7 <= len(cleaned) <= 15


def validate_bot_config(merged: dict) -> None:
    errors = []

    ai_provider = next((p for p in catalog_data.AI_PROVIDERS if p["id"] == merged.get("ai_provider")), None)
    if not ai_provider:
        errors.append(f"ai_provider inválido: '{merged.get('ai_provider')}'")
    elif merged.get("ai_model") and not any(m["id"] == merged["ai_model"] for m in ai_provider["models"]):
        errors.append(f"el modelo '{merged.get('ai_model')}' no pertenece al proveedor de IA '{merged.get('ai_provider')}'")

    stt_provider = next((p for p in catalog_data.STT_PROVIDERS if p["id"] == merged.get("stt_provider")), None)
    if not stt_provider:
        errors.append(f"stt_provider inválido: '{merged.get('stt_provider')}'")
    elif merged.get("stt_model") and not any(m["id"] == merged["stt_model"] for m in stt_provider["models"]):
        errors.append(f"el modelo '{merged.get('stt_model')}' no pertenece al proveedor de STT '{merged.get('stt_provider')}'")

    tts_provider = next((p for p in catalog_data.TTS_PROVIDERS if p["id"] == merged.get("tts_provider")), None)
    if not tts_provider:
        errors.append(f"tts_provider inválido: '{merged.get('tts_provider')}'")
    elif merged.get("tts_voice_id") and not any(v["id"] == merged["tts_voice_id"] for v in tts_provider["voices"]):
        errors.append(f"la voz '{merged.get('tts_voice_id')}' no pertenece al proveedor de TTS '{merged.get('tts_provider')}'")

    if merged.get("telephony_provider") not in VALID_TELEPHONY_PROVIDERS:
        errors.append(f"telephony_provider debe ser uno de {sorted(VALID_TELEPHONY_PROVIDERS)}")

    if merged.get("runtime_target") not in VALID_RUNTIME_TARGETS:
        errors.append(f"runtime_target debe ser uno de {sorted(VALID_RUNTIME_TARGETS)}")

    if merged.get("language") not in VALID_LANGUAGES:
        errors.append(f"language debe ser uno de {sorted(VALID_LANGUAGES)}")

    if merged.get("status") not in VALID_STATUSES:
        errors.append(f"status debe ser uno de {sorted(VALID_STATUSES)}")

    escalation_email = merged.get("escalation_email") or ""
    if escalation_email:
        try:
            validate_email(escalation_email, check_deliverability=False)
        except EmailNotValidError:
            errors.append("escalation_email no tiene un formato de correo válido")

    phone = merged.get("phone_number") or ""
    if phone and not _valid_phone(phone):
        errors.append("phone_number debe tener entre 7 y 15 dígitos (se permiten +, espacios y guiones)")

    if len(merged.get("system_prompt") or "") > 8000:
        errors.append("system_prompt es demasiado largo (máx. 8000 caracteres)")

    if len(merged.get("welcome_message") or "") > 500:
        errors.append("welcome_message es demasiado largo (máx. 500 caracteres)")

    if merged.get("first_message_mode") not in VALID_FIRST_MESSAGE_MODES:
        errors.append(f"first_message_mode debe ser uno de {sorted(VALID_FIRST_MESSAGE_MODES)}")

    silence = merged.get("silence_timeout_seconds")
    if not isinstance(silence, int) or not (5 <= silence <= 600):
        errors.append("silence_timeout_seconds debe ser un entero entre 5 y 600 segundos")

    max_duration = merged.get("max_duration_seconds")
    if not isinstance(max_duration, int) or not (30 <= max_duration <= 7200):
        errors.append("max_duration_seconds debe ser un entero entre 30 y 7200 segundos (2 horas)")

    if len(merged.get("end_call_message") or "") > 500:
        errors.append("end_call_message es demasiado largo (máx. 500 caracteres)")

    transfer_phone = merged.get("transfer_phone_number") or ""
    if transfer_phone and not _valid_phone(transfer_phone):
        errors.append("transfer_phone_number debe tener entre 7 y 15 dígitos (se permiten +, espacios y guiones)")

    if len(merged.get("voicemail_message") or "") > 500:
        errors.append("voicemail_message es demasiado largo (máx. 500 caracteres)")

    if errors:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, {"errors": errors})
