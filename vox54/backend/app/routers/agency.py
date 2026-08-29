from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_agency_user
from ..security import hash_password
from ..schemas import AgencyMeResponse, BusinessOut, BusinessCreate
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
