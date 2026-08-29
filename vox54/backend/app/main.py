from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, agency, business, catalog

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vox54 API (nombre provisorio)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(agency.router)
app.include_router(business.router)
app.include_router(catalog.router)


@app.get("/health")
def health():
    return {"ok": True}
