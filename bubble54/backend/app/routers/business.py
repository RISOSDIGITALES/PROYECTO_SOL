from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import documents
from ..database import get_db
from ..deps import get_current_business_user
from ..exporting import calls_to_csv
from ..schemas import (
    BusinessMeResponse, BotConfigOutClient, BotConfigUpdateClient,
    BusinessProfileOut, BusinessProfileUpdate, CallOut, CustomerOut, CustomerUpdate,
    DocumentSuggestionAction,
    PasswordChange, PhoneActivateIn, PhoneVerifyStartIn, PhoneVerifyCheckIn, PhoneVerifyCheckOut,
)
from ..security import hash_password, verify_password
from ..uploads import save_document, save_logo
from ..validators import bot_config_as_dict, validate_bot_config
from ..telephony import (
    TelephonyProvisionError, provision_phone_number,
    start_phone_verification, check_phone_verification,
)
from .. import models

router = APIRouter(prefix="/business", tags=["business"])


@router.get("/me", response_model=BusinessMeResponse)
def me(user: models.BusinessUser = Depends(get_current_business_user)):
    agency = user.business.agency
    return BusinessMeResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        business_id=user.business_id,
        business_name=user.business.name,
        business_logo_url=user.business.logo_url or "",
        agency_name=agency.name,
        agency_contact_email=agency.contact_email or "",
        agency_contact_phone=agency.contact_phone or "",
    )


@router.put("/me/password")
def change_password(
    body: PasswordChange,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual no es correcta")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True}


@router.get("/bot-config", response_model=BotConfigOutClient)
def get_bot_config(
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    return db.query(models.BotConfig).filter(models.BotConfig.business_id == user.business_id).first()


@router.put("/bot-config", response_model=BotConfigOutClient)
def update_bot_config(
    body: BotConfigUpdateClient,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    config = db.query(models.BotConfig).filter(models.BotConfig.business_id == user.business_id).first()
    patch = body.model_dump(exclude_unset=True)
    merged = {**bot_config_as_dict(config), **patch}
    validate_bot_config(merged)  # 422 si algo no calza contra el catálogo — antes de tocar el objeto
    for field, value in patch.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


@router.post("/phone/verify/start")
def start_my_phone_verification(
    body: PhoneVerifyStartIn,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    """Manda un código real por SMS al número que el negocio dice que es
    suyo. Incidente real del 2026-09-19: antes "usar mi propio número"
    compraba un número nuevo sin pedir ni comprobar nada -- este paso (y
    verify/check) son el fix real, no un formulario decorativo."""
    config = db.query(models.BotConfig).filter(models.BotConfig.business_id == user.business_id).first()
    try:
        start_phone_verification(body.phone_number)
    except TelephonyProvisionError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    config.own_phone_number = body.phone_number
    config.own_phone_verified = False
    db.commit()
    return {"ok": True}


@router.post("/phone/verify/check", response_model=PhoneVerifyCheckOut)
def check_my_phone_verification(
    body: PhoneVerifyCheckIn,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    config = db.query(models.BotConfig).filter(models.BotConfig.business_id == user.business_id).first()
    try:
        ok = check_phone_verification(body.phone_number, body.code)
    except TelephonyProvisionError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    if ok and config.own_phone_number == body.phone_number:
        config.own_phone_verified = True
        db.commit()
    return PhoneVerifyCheckOut(verified=ok)


@router.post("/phone/activate", response_model=BotConfigOutClient)
def activate_my_phone(
    body: PhoneActivateIn,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    """Self-service real -- el propio negocio aprovisiona su número sin
    pasar por la agencia. Mismo camino y mismos errores reales que su
    espejo del lado de agencia (ver activate_business_phone). "forward"
    exige verificación real ya hecha (ver phone/verify/*) -- incidente del
    2026-09-19: antes compraba el número igual sin pedir el propio."""
    config = db.query(models.BotConfig).filter(models.BotConfig.business_id == user.business_id).first()
    if body.mode == "forward" and not config.own_phone_verified:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "Verificá tu número real primero (te mandamos un código por SMS) antes de desviarlo.",
        )
    try:
        config.phone_number = provision_phone_number(db)
    except TelephonyProvisionError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    config.phone_mode = body.mode
    db.commit()
    db.refresh(config)
    return config


@router.get("/calls", response_model=list[CallOut])
def list_calls(
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    return (
        db.query(models.Call)
        .filter(models.Call.business_id == user.business_id)
        .order_by(models.Call.started_at.desc())
        .limit(100)
        .all()
    )


@router.get("/calls/export")
def export_calls(
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    """CSV real, solo para quien ya está logueado como este negocio -- nunca
    un link público (decisión explícita del 2026-09-21, mismo criterio de
    privacidad que G54 ya aplicó una vez: transcripciones y números reales
    de clientes no deberían quedar accesibles a cualquiera con un link)."""
    calls = (
        db.query(models.Call)
        .filter(models.Call.business_id == user.business_id)
        .order_by(models.Call.started_at.desc())
        .all()
    )
    csv_text = calls_to_csv(calls)
    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="llamadas.csv"'},
    )


@router.get("/customers", response_model=list[CustomerOut])
def list_my_customers(
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    return (
        db.query(models.Customer)
        .filter(models.Customer.business_id == user.business_id)
        .order_by(models.Customer.last_call_at.desc())
        .all()
    )


def _get_my_customer(db: Session, user: models.BusinessUser, customer_id: int) -> models.Customer:
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id, models.Customer.business_id == user.business_id)
        .first()
    )
    if not customer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
    return customer


@router.get("/customers/{customer_id}", response_model=CustomerOut)
def get_my_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    return _get_my_customer(db, user, customer_id)


@router.patch("/customers/{customer_id}", response_model=CustomerOut)
def update_my_customer(
    customer_id: int,
    body: CustomerUpdate,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    customer = _get_my_customer(db, user, customer_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/profile", response_model=BusinessProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    return db.query(models.Business).filter(models.Business.id == user.business_id).first()


@router.put("/profile", response_model=BusinessProfileOut)
def update_profile(
    body: BusinessProfileUpdate,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    business = db.query(models.Business).filter(models.Business.id == user.business_id).first()
    patch = body.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(business, field, value)
    db.commit()
    db.refresh(business)
    return business


@router.post("/profile/logo", response_model=BusinessProfileOut)
async def upload_my_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    business = db.query(models.Business).filter(models.Business.id == user.business_id).first()
    business.logo_url = await save_logo(file, "logos/business", f"business_{business.id}")
    db.commit()
    db.refresh(business)
    return business


@router.delete("/profile/logo", response_model=BusinessProfileOut)
def remove_my_logo(
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    business = db.query(models.Business).filter(models.Business.id == user.business_id).first()
    business.logo_url = ""
    db.commit()
    db.refresh(business)
    return business


@router.post("/profile/info-document", response_model=BusinessProfileOut)
async def upload_my_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    business = db.query(models.Business).filter(models.Business.id == user.business_id).first()
    url, name = await save_document(file, "documents/business", f"business_{business.id}")
    business.info_document_url = url
    business.info_document_name = name
    db.commit()
    db.refresh(business)
    documents.process_business_document(db, business)
    return business


@router.delete("/profile/info-document", response_model=BusinessProfileOut)
def remove_my_document(
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    business = db.query(models.Business).filter(models.Business.id == user.business_id).first()
    business.info_document_url = ""
    business.info_document_name = ""
    db.commit()
    db.refresh(business)
    documents.process_business_document(db, business)  # borra los fragmentos viejos, ya sin PDF
    return business


@router.post("/profile/document-suggestions/accept", response_model=BusinessProfileOut)
def accept_my_document_suggestion(
    body: DocumentSuggestionAction,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    business = db.query(models.Business).filter(models.Business.id == user.business_id).first()
    documents.accept_suggested_service(business, body.suggestion)
    db.commit()
    db.refresh(business)
    return business


@router.post("/profile/document-suggestions/dismiss", response_model=BusinessProfileOut)
def dismiss_my_document_suggestion(
    body: DocumentSuggestionAction,
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    business = db.query(models.Business).filter(models.Business.id == user.business_id).first()
    documents.dismiss_suggested_service(business, body.suggestion)
    db.commit()
    db.refresh(business)
    return business
