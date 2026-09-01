from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_agency_user
from ..security import hash_password
from ..schemas import AgencyMeResponse, BusinessOut, BusinessCreate, BusinessUpdate, BusinessDetailOut, BotConfigUpdate, BotConfigOut, CallOut
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
    )


@router.get("/businesses", response_model=list[BusinessOut])
def list_businesses(
    db: Session = Depends(get_db),
    user: models.AgencyUser = Depends(get_current_agency_user),
):
    return db.query(models.Business).filter(models.Business.agency_id == user.agency_id).all()


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
