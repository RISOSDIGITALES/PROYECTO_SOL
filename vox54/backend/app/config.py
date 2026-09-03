from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./vox54.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    # Secreto compartido, no un JWT de usuario — lo usa el worker de LiveKit
    # Agents (un servicio, no una persona) para leer BotConfig sin necesitar
    # una sesión de negocio/agencia. Ver vox54/worker/.
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

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
