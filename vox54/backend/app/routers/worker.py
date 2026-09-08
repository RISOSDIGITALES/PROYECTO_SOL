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

from .. import documents
from ..database import get_db
from ..deps import require_worker_secret
from ..schemas import CallOut, CallReport, DocumentSearchOut, DocumentSearchRequest, WorkerBotConfigOut
from ..validators import bot_config_as_dict
from .. import models

router = APIRouter(prefix="/worker", tags=["worker"], dependencies=[Depends(require_worker_secret)])


def _worker_bot_config_out(db: Session, config: models.BotConfig) -> WorkerBotConfigOut:
    """BotConfigOut (infraestructura) + el perfil real del negocio (nombre,
    resumen, horario, productos) — el worker es el único consumidor que
    necesita ambas cosas juntas para armar el contexto real del agente.

    `has_document` le dice al worker si tiene sentido ofrecerle a la IA la
    tool de buscar en el PDF real del negocio — se calcula por fragmentos
    reales ya indexados, no por si `info_document_url` está seteado: un PDF
    subido pero sin texto extraíble (ej. escaneado como imagen) no debe
    ofrecer una tool que siempre va a devolver una lista vacía."""
    business = config.business
    data = bot_config_as_dict(config)
    data["business_id"] = config.business_id
    data["business_name"] = business.name
    data["business_description"] = business.description or ""
    data["business_hours"] = business.hours or ""
    data["business_products_services"] = business.products_services or ""
    data["has_document"] = (
        db.query(models.DocumentChunk.id).filter(models.DocumentChunk.business_id == business.id).first()
        is not None
    )
    return WorkerBotConfigOut(**data)


@router.get("/bot-config/{business_id}", response_model=WorkerBotConfigOut)
def get_bot_config_for_worker(business_id: int, db: Session = Depends(get_db)):
    config = db.query(models.BotConfig).filter(models.BotConfig.business_id == business_id).first()
    if not config:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No existe BotConfig para ese business_id")
    return _worker_bot_config_out(db, config)


@router.get("/bot-config/by-phone/{phone_number}", response_model=WorkerBotConfigOut)
def get_bot_config_by_phone(phone_number: str, db: Session = Depends(get_db)):
    """El worker resuelve qué negocio es dueño de una llamada entrante por el
    número al que marcó el cliente — así arma el AgentSession correcto antes
    de que el cliente escuche el primer sonido."""
    config = db.query(models.BotConfig).filter(models.BotConfig.phone_number == phone_number).first()
    if not config:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ningún negocio tiene asignado ese número")
    return _worker_bot_config_out(db, config)


@router.post("/documents/search", response_model=DocumentSearchOut)
def search_documents(body: DocumentSearchRequest, db: Session = Depends(get_db)):
    """El worker llama acá mid-llamada (como una tool que la IA puede
    invocar, ver `buscar_en_documentos` en agent.py) cuando necesita algo
    del PDF real que el negocio subió. Nunca falla si el negocio no tiene
    ningún documento — devuelve una lista vacía, y el worker/la IA se las
    arregla con eso (no es un 404: no tener un documento es un estado
    válido, no un error)."""
    chunks = documents.search_chunks(db, body.business_id, body.query, top_k=body.top_k)
    return DocumentSearchOut(chunks=chunks)


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
