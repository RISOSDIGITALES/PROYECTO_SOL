from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./vox54.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    # Secreto compartido, no un JWT de usuario — lo usa el worker de LiveKit
    # Agents (un servicio, no una persona) para leer BotConfig sin necesitar
    # una sesión de negocio/agencia. Ver vox54/worker/.
    worker_secret: str = "dev-worker-secret-change-me"

    class Config:
        env_file = ".env"


settings = Settings()
