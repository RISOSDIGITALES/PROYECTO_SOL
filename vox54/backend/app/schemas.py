import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class AgencyMeResponse(BaseModel):
    id: int
    name: str
    email: str
    agency_id: int
    agency_name: str


class AgencyProfileOut(BaseModel):
    """Perfil real de la agencia — antes solo vivía el nombre + un conteo de
    negocios dentro de 'Configuración', mezclado con la cuenta personal del
    admin. Esto es la identidad de la agencia en sí, editable, separada del
    ajuste de cuenta (cambio de contraseña, que sigue en Configuración)."""

    id: int
    name: str
    contact_email: str
    contact_phone: str
    website: str
    address: str
    business_count: int


class AgencyProfileUpdate(BaseModel):
    name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    website: str | None = None
    address: str | None = None

    @field_validator("name")
    @classmethod
    def not_blank(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("no puede estar vacío")
        return v


class BusinessMeResponse(BaseModel):
    id: int
    name: str
    email: str
    business_id: int
    business_name: str
    # Un negocio no tiene ningún canal de soporte propio todavía — quien
    # atiende sus dudas reales es la agencia que lo gestiona, así que se le
    # muestra el nombre real de esa agencia en vez de inventar un contacto
    # de "soporte" que no existe.
    agency_name: str
    # Correo/teléfono reales de la agencia, si los cargó — hacen que ese
    # "canal de soporte" sea de verdad contactable, no solo un nombre.
    # Pueden venir vacíos (agencia sin perfil cargado todavía); nunca se
    # inventa un valor de respaldo.
    agency_contact_email: str = ""
    agency_contact_phone: str = ""


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("la contraseña nueva debe tener al menos 8 caracteres")
        return v


class BotConfigOut(BaseModel):
    business_id: int
    telephony_provider: str
    telephony_trunk_id: str
    phone_number: str
    stt_provider: str
    stt_model: str
    tts_provider: str
    tts_voice_id: str
    runtime_target: str
    ai_provider: str
    ai_model: str
    ai_api_key: str
    system_prompt: str
    welcome_message: str
    escalation_email: str
    language: str
    status: str
    first_message_mode: str
    allow_interruptions: bool
    silence_timeout_seconds: int
    max_duration_seconds: int
    end_call_message: str
    transfer_phone_number: str
    voicemail_detection_enabled: bool
    voicemail_message: str

    model_config = ConfigDict(from_attributes=True)


class BotConfigUpdate(BaseModel):
    telephony_provider: str | None = None
    telephony_trunk_id: str | None = None
    phone_number: str | None = None
    stt_provider: str | None = None
    stt_model: str | None = None
    tts_provider: str | None = None
    tts_voice_id: str | None = None
    runtime_target: str | None = None
    ai_provider: str | None = None
    ai_model: str | None = None
    ai_api_key: str | None = None
    system_prompt: str | None = None
    welcome_message: str | None = None
    escalation_email: str | None = None
    language: str | None = None
    status: str | None = None
    first_message_mode: str | None = None
    allow_interruptions: bool | None = None
    silence_timeout_seconds: int | None = None
    max_duration_seconds: int | None = None
    end_call_message: str | None = None
    transfer_phone_number: str | None = None
    voicemail_detection_enabled: bool | None = None
    voicemail_message: str | None = None


class BotConfigUpdateClient(BaseModel):
    """Subconjunto de BotConfigUpdate seguro para que un negocio edite su
    propio bot — deliberadamente NO incluye telefonía/STT/TTS/modelo de IA
    (proveedor, modelo, API key propia): son decisiones de infraestructura
    de la agencia, no del cliente. Cualquier campo fuera de esta lista que
    llegue en el body (ej. ai_provider) se descarta solo, sin error — no es
    un campo que este endpoint conozca. La barrera real vive acá, en el
    schema — no es solo que el formulario del cliente no lo muestre."""

    system_prompt: str | None = None
    welcome_message: str | None = None
    escalation_email: str | None = None
    language: str | None = None
    status: str | None = None
    first_message_mode: str | None = None
    allow_interruptions: bool | None = None
    silence_timeout_seconds: int | None = None
    max_duration_seconds: int | None = None
    end_call_message: str | None = None
    transfer_phone_number: str | None = None
    voicemail_detection_enabled: bool | None = None
    voicemail_message: str | None = None


class BotConfigOutClient(BaseModel):
    """Espejo de lectura de BotConfigUpdateClient — la misma barrera de
    escritura no sirve de nada si GET /business/bot-config sigue mandando
    todo el objeto completo igual. Un negocio SÍ necesita ver su propio
    `phone_number` (de solo lectura, para mostrarlo en 'Tu número'), pero
    nunca `ai_api_key` ni el resto de infraestructura — antes de este
    schema, esos campos viajaban igual en la respuesta HTTP aunque el
    formulario nunca los mostrara, visibles para cualquiera que abriera
    las devtools del navegador."""

    business_id: int
    phone_number: str
    system_prompt: str
    welcome_message: str
    escalation_email: str
    language: str
    status: str
    first_message_mode: str
    allow_interruptions: bool
    silence_timeout_seconds: int
    max_duration_seconds: int
    end_call_message: str
    transfer_phone_number: str
    voicemail_detection_enabled: bool
    voicemail_message: str

    model_config = ConfigDict(from_attributes=True)


class BusinessOut(BaseModel):
    id: int
    name: str
    bot_status: str | None = None

    model_config = ConfigDict(from_attributes=True)


class BusinessDetailOut(BaseModel):
    id: int
    name: str
    bot_config: BotConfigOut

    model_config = ConfigDict(from_attributes=True)


class AgentInventoryItem(BaseModel):
    """Una fila del inventario de agentes — hoy cada negocio tiene exactamente
    un bot (BotConfig es 1-a-1 con Business), así que esto es la misma
    relación que ya usa BusinessOut.bot_status, solo con más campos reales
    del lado de infraestructura para poder ver de un vistazo a qué proveedor
    y número está atado cada agente sin entrar al detalle de cada negocio."""

    business_id: int
    business_name: str
    bot_status: str | None = None
    telephony_provider: str | None = None
    phone_number: str | None = None
    ai_provider: str | None = None
    ai_model: str | None = None


class BusinessUpdate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("no puede estar vacío")
        return v


class BusinessProfileOut(BaseModel):
    """El conocimiento real del negocio — separado a propósito de
    BotConfigOut (infraestructura del bot). Lo edita tanto la agencia como el
    propio negocio; nadie sabe su horario real mejor que el dueño."""

    id: int
    name: str
    description: str
    hours: str
    products_services: str

    model_config = ConfigDict(from_attributes=True)


class BusinessProfileUpdate(BaseModel):
    description: str | None = None
    hours: str | None = None
    products_services: str | None = None


class BusinessCreate(BaseModel):
    name: str
    contact_name: str
    contact_email: EmailStr
    contact_password: str

    @field_validator("name", "contact_name")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("no puede estar vacío")
        return v

    @field_validator("contact_password")
    @classmethod
    def min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("la contraseña debe tener al menos 8 caracteres")
        return v


VALID_CALL_OUTCOMES = {"completed", "transferred", "max_duration_reached", "error"}


class CallReport(BaseModel):
    """Lo que manda el worker al terminar una llamada real — nunca lo manda
    ni un negocio ni una agencia."""

    business_id: int
    started_at: datetime.datetime
    ended_at: datetime.datetime
    caller_number: str | None = None
    outcome: str
    transcript: str | None = None

    @field_validator("outcome")
    @classmethod
    def outcome_valido(cls, v: str) -> str:
        if v not in VALID_CALL_OUTCOMES:
            raise ValueError(f"outcome debe ser uno de {sorted(VALID_CALL_OUTCOMES)}")
        return v


class CallOut(BaseModel):
    id: int
    started_at: datetime.datetime
    ended_at: datetime.datetime
    duration_seconds: int
    caller_number: str | None
    outcome: str
    transcript: str | None

    model_config = ConfigDict(from_attributes=True)


class AgencyCallOut(CallOut):
    """Una llamada real, pero vista desde 'Registros' — el historial agregado
    de TODAS las llamadas de la agencia, de cualquiera de sus negocios, no
    solo de uno puntual (eso ya lo cubre CallOut vía
    /agency/businesses/{id}/calls). Necesita saber de qué negocio es cada
    fila, así que suma ese único dato encima de CallOut."""

    business_id: int
    business_name: str


class WorkerBotConfigOut(BotConfigOut):
    """Mismo shape que BotConfigOut (todo lo de infraestructura), más el
    conocimiento real del negocio — nombre, resumen, horario, productos —
    para que el worker pueda pasárselo al modelo como contexto real. Solo la
    ve el worker; la respuesta que ve agencia/negocio sigue siendo
    BotConfigOut/BotConfigOutClient tal cual, sin estos campos."""

    business_name: str
    business_description: str
    business_hours: str
    business_products_services: str


class ModelOut(BaseModel):
    id: str
    name: str


class AIProviderOut(BaseModel):
    id: str
    name: str
    models: list[ModelOut]


class VoiceOut(BaseModel):
    id: str
    name: str


class TTSProviderOut(BaseModel):
    """Mismo shape que un proveedor de IA (id/name + lista con id/name) mapeado
    al vocabulario de síntesis de voz: en vez de 'modelos', 'voces'."""
    id: str
    name: str
    voices: list[VoiceOut]


class OptionOut(BaseModel):
    id: str
    name: str


class CatalogOut(BaseModel):
    ai_providers: list[AIProviderOut]
    stt_providers: list[AIProviderOut]  # mismo shape (id/name/models) que ai_providers
    tts_providers: list[TTSProviderOut]
    telephony_providers: list[OptionOut]
    runtime_targets: list[OptionOut]
    languages: list[OptionOut]
    statuses: list[OptionOut]
    first_message_modes: list[OptionOut]
