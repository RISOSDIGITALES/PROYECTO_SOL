from fastapi import APIRouter

from .. import catalog as catalog_data
from ..schemas import CatalogOut

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=CatalogOut)
def get_catalog():
    return CatalogOut(
        ai_providers=catalog_data.AI_PROVIDERS,
        voice_providers=catalog_data.VOICE_PROVIDERS,
        languages=catalog_data.LANGUAGES,
        statuses=catalog_data.STATUSES,
        first_message_modes=catalog_data.FIRST_MESSAGE_MODES,
    )
