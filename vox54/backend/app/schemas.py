from pydantic import BaseModel, EmailStr


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
    voice_provider: str
    voice_id: str
    phone_number: str
    ai_provider: str
    ai_model: str
    ai_api_key: str
    system_prompt: str
    welcome_message: str
    escalation_email: str
    language: str
    status: str

    class Config:
        from_attributes = True


class BotConfigUpdate(BaseModel):
    voice_provider: str | None = None
    voice_id: str | None = None
    phone_number: str | None = None
    ai_provider: str | None = None
    ai_model: str | None = None
    ai_api_key: str | None = None
    system_prompt: str | None = None
    welcome_message: str | None = None
    escalation_email: str | None = None
    language: str | None = None
    status: str | None = None


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


class VoiceProviderOut(BaseModel):
    id: str
    name: str
    voices: list[VoiceOut]


class OptionOut(BaseModel):
    id: str
    name: str


class CatalogOut(BaseModel):
    ai_providers: list[AIProviderOut]
    voice_providers: list[VoiceProviderOut]
    languages: list[OptionOut]
    statuses: list[OptionOut]
