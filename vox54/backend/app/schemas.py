from pydantic import BaseModel, EmailStr, field_validator


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


class BusinessMeResponse(BaseModel):
    id: int
    name: str
    email: str
    business_id: int
    business_name: str


class BotConfigOut(BaseModel):
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

    class Config:
        from_attributes = True


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


class BusinessOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class BusinessDetailOut(BaseModel):
    id: int
    name: str
    bot_config: BotConfigOut

    class Config:
        from_attributes = True


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
