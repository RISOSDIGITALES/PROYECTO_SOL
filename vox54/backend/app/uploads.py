import os
import uuid

from fastapi import HTTPException, UploadFile, status

from .config import settings

# Logo — imagen real, tipos y tamaño acotados; SVG incluido porque es un
# formato real y común para logos de marca, no solo raster.
ALLOWED_LOGO_EXT = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
}
MAX_LOGO_BYTES = 3 * 1024 * 1024  # 3MB

MAX_DOC_BYTES = 15 * 1024 * 1024  # 15MB


def _write(data: bytes, subdir: str, prefix: str, ext: str) -> str:
    folder = os.path.join(settings.upload_dir, subdir)
    os.makedirs(folder, exist_ok=True)
    fname = f"{prefix}_{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(folder, fname), "wb") as f:
        f.write(data)
    # URL pública real, la misma ruta que sirve StaticFiles en main.py — no
    # la ruta del disco, que es un detalle de implementación del servidor.
    return f"/uploads/{subdir}/{fname}".replace("\\", "/")


async def save_logo(file: UploadFile, subdir: str, prefix: str) -> str:
    ext = ALLOWED_LOGO_EXT.get(file.content_type)
    if not ext:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "El logo debe ser una imagen real (PNG, JPG, WEBP o SVG).",
        )
    data = await file.read()
    if len(data) > MAX_LOGO_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "El logo no puede pesar más de 3MB.")
    if len(data) == 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El archivo llegó vacío.")
    return _write(data, subdir, prefix, ext)


async def save_document(file: UploadFile, subdir: str, prefix: str) -> tuple[str, str]:
    """Guarda un PDF real como fuente de información — devuelve (url, nombre
    original) para mostrarlo tal cual el usuario lo llamó, no el nombre
    interno con el que se guarda en disco."""
    if file.content_type != "application/pdf":
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El documento debe ser un PDF.")
    data = await file.read()
    if len(data) > MAX_DOC_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "El documento no puede pesar más de 15MB.")
    if len(data) == 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El archivo llegó vacío.")
    url = _write(data, subdir, prefix, "pdf")
    return url, (file.filename or "documento.pdf")
