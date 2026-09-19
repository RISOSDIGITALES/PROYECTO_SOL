import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_current_agency_user
from ..security import hash_password, verify_password
from ..schemas import (
    AgencyMeResponse, AgencyProfileOut, AgencyProfileUpdate, AgencyBusinessSummary,
    BusinessOut, BusinessCreate, BusinessUpdate, BusinessDetailOut,
    BusinessProfileOut, BusinessProfileUpdate, DocumentSuggestionAction,
    BotConfigUpdate, BotConfigOut, CallOut, AgencyCallOut,
    PasswordChange, AgentInventoryItem, PhoneActivateIn,
    PlanUpdate, BusinessUsageOut,
    PhoneVerifyStartIn, PhoneVerifyCheckIn, PhoneVerifyCheckOut,
)
from ..uploads import save_document, save_logo
from ..validators import bot_config_as_dict, validate_bot_config
from ..telephony import (
    TelephonyProvisionError, provision_phone_number,
    start_phone_verification, check_phone_verification,
)
from .. import catalog, documents, models

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
            AgencyBusinessSummary(
                id=b.id,
                name=b.name,
                bot_status=b.bot_config.status if b.bot_config else None,
                logo_url=b.logo_url or "",
            )
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

    business = models.Business(
        agency_id=user.agency_id,
        name=body.name,
        hours=body.hours,
        products_services=body.products_services,
        address=body.address,
        phone=body.phone,
    )
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


@router.put("/businesses/{business_id}/plan", response_model=BusinessDetailOut)
def update_business_plan(
    business_id: int,
    body: PlanUpdate,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    """Asigna el plan comercial de este negocio -- solo la agencia, nunca el
    propio negocio (mismo criterio que la infraestructura de BotConfig).
    Rechaza cualquier id que no esté en el catálogo real en vez de guardar
    un plan inventado."""
    business = _get_owned_business(db, user, business_id)
    valid_ids = {p["id"] for p in catalog.PLANS}
    if body.plan_id not in valid_ids:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Plan inválido: '{body.plan_id}'")
    business.plan_id = body.plan_id
    db.commit()
    db.refresh(business)
    return business


@router.get("/businesses/{business_id}/usage", response_model=BusinessUsageOut)
def get_business_usage(
    business_id: int,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    """Uso real del mes calendario en curso -- suma `Call.duration_seconds`
    de las llamadas reales que ya reportó el worker, nunca un número
    estimado. Sin ningún cobro real conectado todavía (ver catalog.PLANS)."""
    business = _get_owned_business(db, user, business_id)
    plan = next((p for p in catalog.PLANS if p["id"] == business.plan_id), catalog.PLANS[0])

    today = datetime.date.today()
    period_start = today.replace(day=1)
    next_month = period_start.replace(day=28) + datetime.timedelta(days=4)
    period_end = next_month.replace(day=1) - datetime.timedelta(days=1)

    seconds_used = (
        db.query(models.Call)
        .filter(
            models.Call.business_id == business.id,
            models.Call.started_at >= datetime.datetime.combine(period_start, datetime.time.min),
        )
        .with_entities(models.Call.duration_seconds)
        .all()
    )
    minutes_used = sum(s[0] for s in seconds_used) / 60
    overage_minutes = max(0.0, minutes_used - plan["included_minutes"])
    estimated_bill = plan["price_usd"] + overage_minutes * plan["overage_per_minute_usd"]

    return BusinessUsageOut(
        plan=plan,
        minutes_used=round(minutes_used, 2),
        minutes_included=plan["included_minutes"],
        overage_minutes=round(overage_minutes, 2),
        estimated_bill_usd=round(estimated_bill, 2),
        period_start=period_start,
        period_end=period_end,
    )


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


@router.post("/businesses/{business_id}/phone/verify/start")
def start_business_phone_verification(
    business_id: int,
    body: PhoneVerifyStartIn,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    config = business.bot_config
    try:
        start_phone_verification(body.phone_number)
    except TelephonyProvisionError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    config.own_phone_number = body.phone_number
    config.own_phone_verified = False
    db.commit()
    return {"ok": True}


@router.post("/businesses/{business_id}/phone/verify/check", response_model=PhoneVerifyCheckOut)
def check_business_phone_verification(
    business_id: int,
    body: PhoneVerifyCheckIn,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    config = business.bot_config
    try:
        ok = check_phone_verification(body.phone_number, body.code)
    except TelephonyProvisionError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    if ok and config.own_phone_number == body.phone_number:
        config.own_phone_verified = True
        db.commit()
    return PhoneVerifyCheckOut(verified=ok)


@router.post("/businesses/{business_id}/phone/activate", response_model=BotConfigOut)
def activate_business_phone(
    business_id: int,
    body: PhoneActivateIn,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    """Aprovisiona un número real de Twilio para este negocio -- mismo
    camino real para "new" y "forward" (ver PhoneActivateIn), el `mode`
    solo cambia qué instrucciones ve el cliente en el panel. Un
    TelephonyProvisionError (ej. Twilio sin configurar) se traduce a 422
    con el mensaje real, nunca se inventa un número para que "se vea bien".
    "forward" exige verificación real ya hecha (ver phone/verify/*) --
    incidente del 2026-09-19: antes compraba el número igual sin pedir el
    propio del negocio."""
    business = _get_owned_business(db, user, business_id)
    config = business.bot_config
    if body.mode == "forward" and not config.own_phone_verified:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "Verificá el número real del negocio primero (mandale un código por SMS) antes de desviarlo.",
        )
    try:
        config.phone_number = provision_phone_number()
    except TelephonyProvisionError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    config.phone_mode = body.mode
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
    documents.process_business_document(db, business)
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
    documents.process_business_document(db, business)  # borra los fragmentos viejos, ya sin PDF
    return business


@router.post("/businesses/{business_id}/document-suggestions/accept", response_model=BusinessProfileOut)
def accept_business_document_suggestion(
    business_id: int,
    body: DocumentSuggestionAction,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    documents.accept_suggested_service(business, body.suggestion)
    db.commit()
    db.refresh(business)
    return business


@router.post("/businesses/{business_id}/document-suggestions/dismiss", response_model=BusinessProfileOut)
def dismiss_business_document_suggestion(
    business_id: int,
    body: DocumentSuggestionAction,
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    business = _get_owned_business(db, user, business_id)
    documents.dismiss_suggested_service(business, body.suggestion)
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
