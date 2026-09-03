"""Endpoints que llama el worker de LiveKit Agents (un servicio, no un usuario
con sesión) — protegidos con un secreto compartido, no con JWT de agencia/negocio.

La lectura de BotConfig es de solo lectura: el worker nunca la escribe, solo
la lee al arrancar una llamada real para saber qué proveedor/modelo/prompt
usar en esa sesión. El reporte de llamadas (POST /calls) es la única
escritura que hace el worker — y la única fuente real de la tabla `calls`:
ni un negocio ni una agencia pueden crear ni editar un registro de llamada
a mano, para que ese historial sea siempre lo que realmente pasó.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_worker_secret
from ..schemas import CallOut, CallReport, WorkerBotConfigOut
from ..validators import bot_config_as_dict
from .. import models

router = APIRouter(prefix="/worker", tags=["worker"], dependencies=[Depends(require_worker_secret)])


def _worker_bot_config_out(config: models.BotConfig) -> WorkerBotConfigOut:
    """BotConfigOut (infraestructura) + el perfil real del negocio (nombre,
    resumen, horario, productos) — el worker es el único consumidor que
    necesita ambas cosas juntas para armar el contexto real del agente."""
    business = config.business
    data = bot_config_as_dict(config)
    data["business_id"] = config.business_id
    data["business_name"] = business.name
    data["business_description"] = business.description or ""
    data["business_hours"] = business.hours or ""
    data["business_products_services"] = business.products_services or ""
    return WorkerBotConfigOut(**data)


@router.get("/bot-config/{business_id}", response_model=WorkerBotConfigOut)
def get_bot_config_for_worker(business_id: int, db: Session = Depends(get_db)):
    config = db.query(models.BotConfig).filter(models.BotConfig.business_id == business_id).first()
    if not config:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe BotConfig para ese business_id")
    return _worker_bot_config_out(config)


@router.get("/bot-config/by-phone/{phone_number}", response_model=WorkerBotConfigOut)
def get_bot_config_by_phone(phone_number: str, db: Session = Depends(get_db)):
    """El worker resuelve qué negocio es dueño de una llamada entrante por el
    número al que marcó el cliente — así arma el AgentSession correcto antes
    de que el cliente escuche el primer sonido."""
    config = db.query(models.BotConfig).filter(models.BotConfig.phone_number == phone_number).first()
    if not config:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ningún negocio tiene asignado ese número")
    return _worker_bot_config_out(config)


@router.post("/calls", response_model=CallOut, status_code=status.HTTP_201_CREATED)
def report_call(body: CallReport, db: Session = Depends(get_db)):
    business = db.query(models.Business).filter(models.Business.id == body.business_id).first()
    if not business:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe ese business_id")

    duration = int((body.ended_at - body.started_at).total_seconds())
    if duration < 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "ended_at no puede ser anterior a started_at")

    call = models.Call(
        business_id=body.business_id,
        started_at=body.started_at,
        ended_at=body.ended_at,
        duration_seconds=duration,
        caller_number=body.caller_number,
        outcome=body.outcome,
        transcript=body.transcript,
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call
