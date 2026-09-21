import datetime
import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import rate_limit
from ..config import settings
from ..database import get_db
from ..emailer import EmailSendError, send_email
from ..security import verify_password, hash_password, create_access_token
from ..schemas import (
    LoginRequest,
    PasswordForgotRequest,
    PasswordForgotResponse,
    PasswordResetConfirm,
    TokenResponse,
)
from .. import models

router = APIRouter(prefix="/auth", tags=["auth"])

ROLE_MODEL = {"agency": models.AgencyUser, "business": models.BusinessUser}
ROLE_LABEL = {"agency": "agencia", "business": "negocio"}
# El resto del panel usa rutas en español (/agencia/login, /negocio/login) --
# el link del correo tiene que coincidir con esas rutas reales del frontend,
# no con el nombre interno del rol (que sigue en inglés en el JWT/DB).
ROLE_PATH = {"agency": "agencia", "business": "negocio"}


def _utcnow() -> datetime.datetime:
    return datetime.datetime.utcnow()


def _request_password_reset(db: Session, role: str, email: str) -> None:
    """Mismo resultado externo exista o no esa cuenta -- solo cambia si de
    verdad se manda un correo. La verificación de que el correo esté
    configurado va ANTES de buscar el usuario, para que un fallo de SMTP
    falle siempre igual sin importar si la cuenta existe (no filtra nada por
    la diferencia entre las dos ramas)."""
    if not settings.smtp_user or not settings.smtp_app_password:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "El envío de correo todavía no está configurado en la plataforma.",
        )

    model = ROLE_MODEL[role]
    user = db.query(model).filter(model.email == email).first()
    if not user:
        return

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    expires_at = _utcnow() + datetime.timedelta(minutes=settings.password_reset_token_expire_minutes)
    db.add(models.PasswordResetToken(role=role, user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    db.commit()

    link = f"{settings.frontend_base_url}/{ROLE_PATH[role]}/reset-password?token={token}"
    html = f"""
    <p>Hola {user.name},</p>
    <p>Pediste restablecer tu contraseña de {ROLE_LABEL[role]} en Bubble 54.</p>
    <p><a href="{link}">Restablecer contraseña</a></p>
    <p>Este enlace vence en {settings.password_reset_token_expire_minutes} minutos.
    Si no fuiste vos, podés ignorar este correo con tranquilidad.</p>
    """
    try:
        send_email(user.email, "Restablecer tu contraseña — Bubble 54", html)
    except EmailSendError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc


def _confirm_password_reset(db: Session, role: str, token: str, new_password: str) -> None:
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    entry = (
        db.query(models.PasswordResetToken)
        .filter(models.PasswordResetToken.token_hash == token_hash, models.PasswordResetToken.role == role)
        .first()
    )
    if not entry or entry.used_at is not None or entry.expires_at < _utcnow():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El enlace no es válido o ya venció.")

    model = ROLE_MODEL[role]
    user = db.query(model).filter(model.id == entry.user_id).first()
    if not user:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El enlace no es válido o ya venció.")

    user.password_hash = hash_password(new_password)
    entry.used_at = _utcnow()
    db.commit()


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


# --- Recuperación de contraseña por correo (2026-09-21) ---
# El mismo rate_limit de los logins protege también acá -- sin esto,
# /password/forgot sería una forma gratis de mandar correos en loop a
# cualquier email real, aunque no exista ninguna cuenta con ese correo.

@router.post("/agency/password/forgot", response_model=PasswordForgotResponse)
def agency_forgot_password(body: PasswordForgotRequest, db: Session = Depends(get_db)):
    key = f"forgot:agency:{body.email.lower()}"
    _guarded_login(key)
    rate_limit.record_failure(key)  # cuenta el pedido en sí, exista o no la cuenta
    _request_password_reset(db, "agency", body.email)
    return PasswordForgotResponse()


@router.post("/agency/password/reset")
def agency_reset_password(body: PasswordResetConfirm, db: Session = Depends(get_db)):
    _confirm_password_reset(db, "agency", body.token, body.new_password)
    return {"ok": True}


@router.post("/business/password/forgot", response_model=PasswordForgotResponse)
def business_forgot_password(body: PasswordForgotRequest, db: Session = Depends(get_db)):
    key = f"forgot:business:{body.email.lower()}"
    _guarded_login(key)
    rate_limit.record_failure(key)
    _request_password_reset(db, "business", body.email)
    return PasswordForgotResponse()


@router.post("/business/password/reset")
def business_reset_password(body: PasswordResetConfirm, db: Session = Depends(get_db)):
    _confirm_password_reset(db, "business", body.token, body.new_password)
    return {"ok": True}
