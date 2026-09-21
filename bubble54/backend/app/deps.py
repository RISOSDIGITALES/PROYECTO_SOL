from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .security import decode_access_token
from . import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/agency/login", auto_error=False)


def require_worker_secret(x_worker_secret: str | None = Header(default=None)) -> None:
    """El worker de LiveKit Agents es un servicio, no una persona — no tiene
    sesión de negocio/agencia, así que se autentica con un secreto compartido
    fijo en vez de un JWT de usuario. Mismo criterio que el AGENT_TOKEN que ya
    usa el resto de la plataforma G54 para llamadas agente-a-agente."""
    if not x_worker_secret or x_worker_secret != settings.worker_secret:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Worker secret inválido o ausente")


def _decode_or_401(token: str | None) -> dict:
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido o expirado")
    return payload


def get_current_agency_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.AgencyUser:
    payload = _decode_or_401(token)
    if payload.get("role") != "agency":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Se requiere una sesión de agencia")
    user = db.query(models.AgencyUser).filter(models.AgencyUser.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no encontrado")
    return user


def get_current_business_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.BusinessUser:
    payload = _decode_or_401(token)
    if payload.get("role") != "business":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Se requiere una sesión de negocio")
    user = db.query(models.BusinessUser).filter(models.BusinessUser.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no encontrado")
    return user
