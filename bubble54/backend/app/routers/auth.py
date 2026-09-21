from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..security import verify_password, create_access_token
from ..schemas import LoginRequest, TokenResponse
from .. import models

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/agency/login", response_model=TokenResponse)
def agency_login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.AgencyUser).filter(models.AgencyUser.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos")
    token = create_access_token({"sub": str(user.id), "role": "agency"})
    return TokenResponse(access_token=token, role="agency", name=user.name)


@router.post("/business/login", response_model=TokenResponse)
def business_login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.BusinessUser).filter(models.BusinessUser.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos")
    token = create_access_token({"sub": str(user.id), "role": "business"})
    return TokenResponse(access_token=token, role="business", name=user.name)
