from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./bubble54.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    # Secreto compartido, no un JWT de usuario — lo usa el worker de LiveKit
    # Agents (un servicio, no una persona) para leer BotConfig sin necesitar
    # una sesión de negocio/agencia. Ver bubble54/worker/.
    worker_secret: str = "dev-worker-secret-change-me"
    # Orígenes reales permitidos por CORS, separados por coma — el default
    # solo cubre el dev server local de Vite. Al desplegar de verdad, hay
    # que fijar CORS_ORIGINS en el .env real con el dominio real del panel,
    # nunca dejar el default de localhost en un backend expuesto de verdad.
    cors_origins: str = "http://localhost:5173"
    # Carpeta real donde se guardan logos/documentos subidos (relativa al
    # cwd del backend, mismo criterio que database_url) — servida en
    # /uploads via StaticFiles (ver main.py). Nunca en git: son archivos
    # reales de cada instalación, no código.
    upload_dir: str = "uploads"
    # Para que documents.py le pida a una IA real un resumen del PDF subido
    # y sugerencias de servicios no cargados todavía — mismo proveedor que ya
    # usa el worker (Groq, API compatible con OpenAI). Vacía por default:
    # sin esta key, la generación de insights se salta sola (nunca revienta
    # la subida del documento), mismo criterio ya usado en el resto del
    # proyecto para dependencias externas opcionales.
    groq_api_key: str = ""
    # Alternativa real a groq_api_key, no un experimento -- confirmado
    # 17-sep que Groq (via Cloudflare) rechaza cualquier llamada directa
    # desde esta red con 403, sin importar el cliente HTTP ni si hay VPN de
    # por medio. GROQ_RELAY_URL apunta a un webhook de n8n que reenvía la
    # misma petición desde un servidor que sí llega a Groq sin problema (el
    # mismo que ya usan Content AI/Ideas AI en producción) -- si está
    # configurada, tiene prioridad sobre la llamada directa. Ver
    # documents.generate_document_insights().
    groq_relay_url: str = ""
    groq_relay_secret: str = ""
    # Cuenta REAL de Twilio de la plataforma (nunca del cliente) -- con esto
    # vacío (default), telephony.provision_phone_number() nunca intenta
    # ninguna llamada real, tira un error claro y legible en el panel en vez
    # de fallar con un timeout o un 401 crudo de Twilio. Mismo criterio que
    # groq_api_key: la funcionalidad se degrada sola, nunca inventa un
    # número como si fuera real.
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    # Servicio real de Twilio Verify -- creado el 2026-09-19 tras un
    # incidente real: el botón "usar mi propio número" compraba un número
    # nuevo sin pedir ni verificar el número real del negocio (el `mode`
    # nunca estuvo conectado a nada, solo cambiaba el texto). Sin este SID,
    # start_phone_verification()/check_phone_verification() tiran el mismo
    # tipo de error claro que TelephonyProvisionError, nunca fingen una
    # verificación que no pasó.
    twilio_verify_service_sid: str = ""
    # Números reales de la MISMA cuenta de Twilio que pertenecen a un sistema
    # completamente distinto de Bubble54 (ej. Marco/Alex, gestionado por
    # n8n+VAPI para Crating Express) -- nunca deben considerarse "libres para
    # reusar" en find_reusable_number(), aunque Twilio los liste como propios
    # y ningún bot_config de Bubble54 los tenga asignados todavía. Incidente
    # real del 2026-09-21: sin esta exclusión, find_reusable_number() eligió
    # el número real de Marco en vez del huérfano disponible -- el orden de
    # iteración de un set de Python no es determinístico entre procesos, así
    # que confiar en "no está en bot_configs" no alcanza. Separados por coma,
    # formato E.164.
    twilio_reserved_numbers: str = "+17867880417"

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def twilio_reserved_numbers_list(self) -> list[str]:
        return [n.strip() for n in self.twilio_reserved_numbers.split(",") if n.strip()]


settings = Settings()
