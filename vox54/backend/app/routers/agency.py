from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_current_agency_user
from ..security import hash_password, verify_password
from ..schemas import (
    AgencyMeResponse, AgencyProfileOut, AgencyProfileUpdate, AgencyBusinessSummary,
    BusinessOut, BusinessCreate, BusinessUpdate, BusinessDetailOut,
    BusinessProfileOut, BusinessProfileUpdate,
    BotConfigUpdate, BotConfigOut, CallOut, AgencyCallOut,
    PasswordChange, AgentInventoryItem,
)
from ..uploads import save_document, save_logo
from ..validators import bot_config_as_dict, validate_bot_config
from .. import models

router = APIRouter(prefix="/agency", tags=["agency"])


@router.get("/me", response_model=AgencyMeResponse)
def me(user: models.AgencyUser = Depends(get_current_agency_user)):
    return AgencyMeResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        agency_id=user.agency_id,
        agency_name=user.agency.name,
        member_since=user.created_at,
    )


@router.put("/me/password")
def change_password(
    body: PasswordChange,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual no es correcta")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True}


def _agency_profile_out(db: Session, agency: models.Agency) -> AgencyProfileOut:
    # Antes esto solo contaba (`business_count`) sin decir de cuáles negocios
    # se trataba — la relación real (Agency → Business) ya existe en la
    # base, acá se resuelve y se devuelve de verdad en vez de esconderla
    # detrás de un número.
    businesses = (
        db.query(models.Business)
        .options(joinedload(models.Business.bot_config))
        .filter(models.Business.agency_id == agency.id)
        .order_by(models.Business.name)
        .all()
    )
    return AgencyProfileOut(
        id=agency.id,
        name=agency.name,
        contact_email=agency.contact_email or "",
        contact_phone=agency.contact_phone or "",
        website=agency.website or "",
        address=agency.address or "",
        logo_url=agency.logo_url or "",
        business_count=len(businesses),
        businesses=[
            AgencyBusinessSummary(id=b.id, name=b.name, bot_status=b.bot_config.status if b.bot_config else None)
            for b in businesses
        ],
    )


@router.get("/profile", response_model=AgencyProfileOut)
def get_agency_profile(
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    return _agency_profile_out(db, user.agency)


@router.put("/profile", response_model=AgencyProfileOut)
def update_agency_profile(
    body: AgencyProfileUpdate,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    agency = user.agency
    patch = body.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(agency, field, value)
    db.commit()
    db.refresh(agency)
    return _agency_profile_out(db, agency)


@router.post("/profile/logo", response_model=AgencyProfileOut)
async def upload_agency_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    agency = user.agency
    agency.logo_url = await save_logo(file, "logos/agency", f"agency_{agency.id}")
    db.commit()
    db.refresh(agency)
    return _agency_profile_out(db, agency)


@router.delete("/profile/logo", response_model=AgencyProfileOut)
def remove_agency_logo(
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    agency = user.agency
    agency.logo_url = ""
    db.commit()
    db.refresh(agency)
    return _agency_profile_out(db, agency)


@router.get("/businesses", response_model=list[BusinessOut])
def list_businesses(
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    return db.query(models.Business).filter(models.Business.agency_id == user.agency_id).all()


@router.get("/agents", response_model=list[AgentInventoryItem])
def list_agents(
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    businesses = (
        db.query(models.Business)
        .options(joinedload(models.Business.bot_config))
        .filter(models.Business.agency_id == user.agency_id)
        .all()
    )
    return [
        AgentInventoryItem(
            business_id=b.id,
            business_name=b.name,
            bot_status=b.bot_config.status if b.bot_config else None,
            telephony_provider=b.bot_config.telephony_provider if b.bot_config else None,
            phone_number=b.bot_config.phone_number if b.bot_config else None,
            ai_provider=b.bot_config.ai_provider if b.bot_config else None,
            ai_model=b.bot_config.ai_model if b.bot_config else None,
        )
        for b in businesses
    ]


@router.post("/businesses", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
def create_business(
    body: BusinessCreate,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    existing = db.query(models.BusinessUser).filter(models.BusinessUser.email == body.contact_email).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un usuario de negocio con ese email")

    business = models.Business(agency_id=user.agency_id, name=body.name)
    db.add(business)
    db.flush()  # para tener business.id antes del commit

    contact = models.BusinessUser(
        business_id=business.id,
        name=body.contact_name,
        email=body.contact_email,
        password_hash=hash_password(body.contact_password),
    )
    db.add(contact)

    bot_config = models.BotConfig(business_id=business.id)
    db.add(bot_config)

    db.commit()
    db.refresh(business)
    return business


def _get_owned_business(db: Session, user: models.AgencyUser, business_id: int) -> models.Business:
    business = (
        db.query(models.Business)
        .filter(models.Business.id == business_id, models.Business.agency_id == user.agency_id)
        .first()
    )
    if not business:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Negocio no encontrado")
    return business


@router.get("/businesses/{business_id}", response_model=BusinessDetailOut)
def get_business(
    business_id: int,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    return _get_owned_business(db, user, business_id)


@router.patch("/businesses/{business_id}", response_model=BusinessOut)
def update_business(
    business_id: int,
    body: BusinessUpdate,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    business.name = body.name
    db.commit()
    db.refresh(business)
    return business


@router.put("/businesses/{business_id}/bot-config", response_model=BotConfigOut)
def update_business_bot_config(
    business_id: int,
    body: BotConfigUpdate,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    config = business.bot_config
    patch = body.model_dump(exclude_unset=True)
    merged = {**bot_config_as_dict(config), **patch}
    validate_bot_config(merged)
    for field, value in patch.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


@router.get("/businesses/{business_id}/calls", response_model=list[CallOut])
def list_business_calls(
    business_id: int,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    return (
        db.query(models.Call)
        .filter(models.Call.business_id == business.id)
        .order_by(models.Call.started_at.desc())
        .limit(100)
        .all()
    )


@router.get("/businesses/{business_id}/profile", response_model=BusinessProfileOut)
def get_business_profile(
    business_id: int,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    return _get_owned_business(db, user, business_id)


@router.put("/businesses/{business_id}/profile", response_model=BusinessProfileOut)
def update_business_profile(
    business_id: int,
    body: BusinessProfileUpdate,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    patch = body.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(business, field, value)
    db.commit()
    db.refresh(business)
    return business


@router.post("/businesses/{business_id}/logo", response_model=BusinessProfileOut)
async def upload_business_logo(
    business_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    business.logo_url = await save_logo(file, "logos/business", f"business_{business.id}")
    db.commit()
    db.refresh(business)
    return business


@router.delete("/businesses/{business_id}/logo", response_model=BusinessProfileOut)
def remove_business_logo(
    business_id: int,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    business.logo_url = ""
    db.commit()
    db.refresh(business)
    return business


@router.post("/businesses/{business_id}/info-document", response_model=BusinessProfileOut)
async def upload_business_document(
    business_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    url, name = await save_document(file, "documents/business", f"business_{business.id}")
    business.info_document_url = url
    business.info_document_name = name
    db.commit()
    db.refresh(business)
    return business


@router.delete("/businesses/{business_id}/info-document", response_model=BusinessProfileOut)
def remove_business_document(
    business_id: int,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    business.info_document_url = ""
    business.info_document_name = ""
    db.commit()
    db.refresh(business)
    return business


# --- Registros: historial de llamadas de TODA la agencia, no de un negocio
# puntual (eso ya lo cubre list_business_calls arriba) — con el nombre del
# negocio ya resuelto en cada fila, para no tener que cruzar datos del lado
# del cliente. ---
def _agency_call_out(call: models.Call) -> AgencyCallOut:
    return AgencyCallOut(
        id=call.id,
        business_id=call.business_id,
        business_name=call.business.name,
        started_at=call.started_at,
        ended_at=call.ended_at,
        duration_seconds=call.duration_seconds,
        caller_number=call.caller_number,
        outcome=call.outcome,
        transcript=call.transcript,
    )


@router.get("/calls", response_model=list[AgencyCallOut])
def list_agency_calls(
    business_id: int | None = None,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    q = (
        db.query(models.Call)
        .join(models.Business, models.Call.business_id == models.Business.id)
        .filter(models.Business.agency_id == user.agency_id)
    )
    if business_id is not None:
        q = q.filter(models.Call.business_id == business_id)
    calls = q.order_by(models.Call.started_at.desc()).limit(200).all()
    return [_agency_call_out(c) for c in calls]


@router.get("/calls/{call_id}", response_model=AgencyCallOut)
def get_agency_call(
    call_id: int,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    call = (
        db.query(models.Call)
        .join(models.Business, models.Call.business_id == models.Business.id)
        .filter(models.Call.id == call_id, models.Business.agency_id == user.agency_id)
        .first()
    )
    if not call:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Llamada no encontrada")
    return _agency_call_out(call)
