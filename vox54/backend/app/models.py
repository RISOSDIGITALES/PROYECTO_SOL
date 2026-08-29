import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship

from .database import Base


def utcnow():
    return datetime.datetime.utcnow()


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    users = relationship("AgencyUser", back_populates="agency", cascade="all, delete-orphan")
    businesses = relationship("Business", back_populates="agency", cascade="all, delete-orphan")


class AgencyUser(Base):
    __tablename__ = "agency_users"

    id = Column(Integer, primary_key=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    agency = relationship("Agency", back_populates="users")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False)
    name = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    agency = relationship("Agency", back_populates="businesses")
    users = relationship("BusinessUser", back_populates="business", cascade="all, delete-orphan")
    bot_config = relationship("BotConfig", back_populates="business", uselist=False, cascade="all, delete-orphan")


class BusinessUser(Base):
    __tablename__ = "business_users"

    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    business = relationship("Business", back_populates="users")


class BotConfig(Base):
    """Configuración del bot de voz de un negocio — proveedor de voz + proveedor de IA,
    cada uno intercambiable (VAPI/otro para voz; Groq/OpenAI/Anthropic/Gemini para el
    modelo de IA que piensa las respuestas), sin acoplar el negocio a uno solo."""

    __tablename__ = "bot_configs"

    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), unique=True, nullable=False)

    # --- Voz ---
    voice_provider = Column(String(50), default="vapi")
    voice_id = Column(String(100), default="")
    phone_number = Column(String(30), default="")  # número asignado por el proveedor de voz
    voice_provider_config = Column(JSON, default=dict)  # datos avanzados específicos del proveedor

    # --- IA ---
    ai_provider = Column(String(50), default="groq")
    ai_model = Column(String(100), default="llama-3.3-70b-versatile")
    ai_api_key = Column(String(255), default="")  # vacío = usa la key compartida de la plataforma

    # --- Comportamiento del agente ---
    system_prompt = Column(Text, default="")
    welcome_message = Column(Text, default="")
    escalation_email = Column(String(255), default="")
    language = Column(String(20), default="auto")  # es | en | auto
    status = Column(String(20), default="paused")  # active | paused

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    business = relationship("Business", back_populates="bot_config")
