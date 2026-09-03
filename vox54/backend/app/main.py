import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, engine
from .routers import auth, agency, business, catalog, worker

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vox54 API (nombre provisorio)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logos y documentos subidos (ver app/uploads.py) — StaticFiles exige que la
# carpeta ya exista antes de montarla.
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(agency.router)
app.include_router(business.router)
app.include_router(catalog.router)
app.include_router(worker.router)


@app.get("/health")
def health():
    return {"ok": True}
