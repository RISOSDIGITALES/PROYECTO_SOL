"""Endpoints que llama el worker de LiveKit Agents (un servicio, no un usuario
con sesión) — protegidos con un secreto compartido, no con JWT de agencia/negocio.

Es de solo lectura: el worker nunca escribe BotConfig, solo lo lee al arrancar
una llamada real para saber qué proveedor/modelo/prompt usar en esa sesión.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_worker_secret
from ..schemas import BotConfigOut
from .. import models

router = APIRouter(prefix="/worker", tags=["worker"], dependencies=[Depends(require_worker_secret)])


@router.get("/bot-config/{business_id}", response_model=BotConfigOut)
def get_bot_config_for_worker(business_id: int, db: Session = Depends(get_db)):
    config = db.query(models.BotConfig).filter(models.BotConfig.business_id == business_id).first()
    if not config:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe BotConfig para ese business_id")
    return config


@router.get("/bot-config/by-phone/{phone_number}", response_model=BotConfigOut)
def get_bot_config_by_phone(phone_number: str, db: Session = Depends(get_db)):
    """El worker resuelve qué negocio es dueño de una llamada entrante por el
    número al que marcó el cliente — así arma el AgentSession correcto antes
    de que el cliente escuche el primer sonido."""
    config = db.query(models.BotConfig).filter(models.BotConfig.phone_number == phone_number).first()
    if not config:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ningún negocio tiene asignado ese número")
    return config
