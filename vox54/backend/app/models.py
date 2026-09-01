import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
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
    calls = relationship("Call", back_populates="business", cascade="all, delete-orphan", order_by="Call.started_at.desc()")

    @property
    def bot_status(self) -> str | None:
        return self.bot_config.status if self.bot_config else None


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
    """Configuración del bot de voz de un negocio.

    NO dependemos de VAPI (ni de ningún otro orquestador todo-en-uno) — el
    pipeline de la llamada en tiempo real lo corre nuestro propio worker de
    LiveKit Agents (ver `vox54/worker/`), armado sobre 3 piezas intercambiables
    e independientes: telefonía (Twilio/Telnyx), reconocimiento de voz/STT
    (Deepgram/Groq Whisper), y síntesis de voz/TTS (Cartesia/ElevenLabs) — más
    el proveedor de IA de siempre (Groq/OpenAI/Anthropic/Gemini) para el modelo
    que piensa las respuestas. Investigado el 2026-08-29: ninguno de los
    frameworks de código abierto (Pipecat, LiveKit Agents) tiene un objeto de
    config declarativo — esta tabla ES esa capa, la seguimos necesitando
    nosotros sea cual sea el motor de voz de abajo."""

    __tablename__ = "bot_configs"

    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), unique=True, nullable=False)

    # --- Telefonía ---
    telephony_provider = Column(String(50), default="twilio")
    telephony_trunk_id = Column(String(150), default="")  # SIP trunk / número que enruta la llamada
    phone_number = Column(String(30), default="")  # número real asignado al negocio

    # --- Reconocimiento de voz (STT) ---
    stt_provider = Column(String(50), default="deepgram")
    stt_model = Column(String(100), default="nova-3")

    # --- Síntesis de voz (TTS) ---
    tts_provider = Column(String(50), default="cartesia")
    tts_voice_id = Column(String(100), default="")

    # --- Orquestación (dónde corre el worker de LiveKit Agents) ---
    runtime_target = Column(String(30), default="livekit_cloud")  # livekit_cloud | self_hosted

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

    # --- Control de la llamada ---
    # Campos reales de conversación — investigados contra VAPI/Retell/Bland
    # primero, y contra LiveKit Agents después: quién habla primero, cuándo
    # cortar por silencio o por duración, si se puede interrumpir al agente,
    # qué dice antes de colgar, y a qué humano transferir. `silence_timeout_seconds`
    # mapea directo a `min_endpointing_delay` de LiveKit; el resto no tiene
    # equivalente nativo en el framework — los implementa el worker como código.
    first_message_mode = Column(String(30), default="assistant_first")
    allow_interruptions = Column(Boolean, default=True)
    silence_timeout_seconds = Column(Integer, default=30)
    max_duration_seconds = Column(Integer, default=600)
    end_call_message = Column(Text, default="")
    transfer_phone_number = Column(String(30), default="")  # a dónde transferir con un humano
    voicemail_detection_enabled = Column(Boolean, default=False)
    voicemail_message = Column(Text, default="")

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    business = relationship("Business", back_populates="bot_config")


class Call(Base):
    """Resultado real de una llamada atendida por el worker — la visibilidad
    de resultado que hasta ahora no existía: un negocio configuraba su bot
    pero nunca veía qué pasó con ninguna llamada real. Solo el worker escribe
    acá (ver POST /worker/calls, mismo secreto compartido que ya usa para
    leer BotConfig) — nunca un negocio ni una agencia, para que este
    historial sea siempre lo que realmente pasó, no algo editable a mano."""

    __tablename__ = "calls"

    id = Column(Integer, primary_key=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)

    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=False)
    duration_seconds = Column(Integer, nullable=False)

    # Atributo SIP del participante remoto — puede no venir según el trunk/
    # proveedor real que conecte cada negocio, por eso nullable en vez de
    # exigirlo (ver el comentario de fetch en worker/agent.py).
    caller_number = Column(String(30), nullable=True)

    # completed | transferred | max_duration_reached | error — cómo terminó,
    # nunca inventado: cada worker solo puede reportar una de las razones que
    # su propio código realmente distingue.
    outcome = Column(String(30), nullable=False, default="completed")

    # JSON (lista de mensajes rol/contenido/timestamp) armado por
    # ChatContext.to_dict() del lado del worker — se guarda como texto plano,
    # sin parsear ni interpretar nada de su lado del backend.
    transcript = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utcnow)

    business = relationship("Business", back_populates="calls")
