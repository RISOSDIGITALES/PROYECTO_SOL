from fastapi import APIRouter

from .. import catalog as catalog_data
from ..schemas import CatalogOut

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=CatalogOut)
def get_catalog():
    return CatalogOut(
        ai_providers=catalog_data.AI_PROVIDERS,
        stt_providers=catalog_data.STT_PROVIDERS,
        tts_providers=catalog_data.TTS_PROVIDERS,
        telephony_providers=catalog_data.TELEPHONY_PROVIDERS,
        runtime_targets=catalog_data.RUNTIME_TARGETS,
        languages=catalog_data.LANGUAGES,
        statuses=catalog_data.STATUSES,
        first_message_modes=catalog_data.FIRST_MESSAGE_MODES,
    )
