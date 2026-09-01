from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_business_user
from ..schemas import BusinessMeResponse, BotConfigOut, BotConfigUpdateClient
from ..validators import bot_config_as_dict, validate_bot_config
from .. import models

router = APIRouter(prefix="/business", tags=["business"])


@router.get("/me", response_model=BusinessMeResponse)
def me(user: models.BusinessUser = Depends(get_current_business_user)):
    return BusinessMeResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        business_id=user.business_id,
        business_name=user.business.name,
    )


@router.get("/bot-config", response_model=BotConfigOut)
def get_bot_config(
    db: Session = Depends(get_db),
    user: models.BusinessUser = Depends(get_current_business_user),
):
    return db.query(models.BotConfig).filter(models.BotConfig.business_id == user.business_id).first()


@router.put("/bot-config", response_model=BotConfigOut)
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
