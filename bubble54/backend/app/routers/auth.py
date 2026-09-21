from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import rate_limit
from ..database import get_db
from ..security import verify_password, create_access_token
from ..schemas import LoginRequest, TokenResponse
from .. import models

router = APIRouter(prefix="/auth", tags=["auth"])


def _guarded_login(key: str) -> None:
    wait = rate_limit.seconds_until_unlocked(key)
    if wait:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Demasiados intentos fallidos. Probá de nuevo en {wait} segundos.",
        )


@router.post("/agency/login", response_model=TokenResponse)
def agency_login(body: LoginRequest, db: Session = Depends(get_db)):
    key = f"agency:{body.email.lower()}"
    _guarded_login(key)
    user = db.query(models.AgencyUser).filter(models.AgencyUser.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        rate_limit.record_failure(key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos")
    rate_limit.record_success(key)
    token = create_access_token({"sub": str(user.id), "role": "agency"})
    return TokenResponse(access_token=token, role="agency", name=user.name)


@router.post("/business/login", response_model=TokenResponse)
def business_login(body: LoginRequest, db: Session = Depends(get_db)):
    key = f"business:{body.email.lower()}"
    _guarded_login(key)
    user = db.query(models.BusinessUser).filter(models.BusinessUser.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        rate_limit.record_failure(key)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos")
    rate_limit.record_success(key)
    token = create_access_token({"sub": str(user.id), "role": "business"})
    return TokenResponse(access_token=token, role="business", name=user.name)
