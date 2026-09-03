from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_business_user
from ..schemas import (
    BusinessMeResponse, BotConfigOutClient, BotConfigUpdateClient,
    BusinessProfileOut, BusinessProfileUpdate, CallOut, PasswordChange,
)
from ..security import hash_password, verify_password
from ..uploads import save_document, save_logo
from ..validators import bot_config_as_dict, validate_bot_config
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
    return business
