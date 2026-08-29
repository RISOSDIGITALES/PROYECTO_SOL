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
    ai_provider: str
    ai_model: str
    system_prompt: str
    voice_id: str

    class Config:
        from_attributes = True


class BotConfigUpdate(BaseModel):
    voice_provider: str | None = None
    ai_provider: str | None = None
    ai_model: str | None = None
    system_prompt: str | None = None
    voice_id: str | None = None


class BusinessOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class BusinessCreate(BaseModel):
    name: str
    contact_name: str
    contact_email: EmailStr
    contact_password: str
