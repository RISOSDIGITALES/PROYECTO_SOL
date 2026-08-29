from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, agency, business

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Voice Platform API")

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


@app.get("/health")
def health():
    return {"ok": True}
