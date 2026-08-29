"""Fixtures compartidas — base de datos SQLite en memoria, aislada de la
base de desarrollo real (`vox54.db`). Cada test arranca de un schema limpio
y con datos semilla mínimos y conocidos, para que un test nunca dependa del
estado que dejó otro test ni del estado real de desarrollo."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.security import hash_password
from app import models


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def seed(db_session):
    """Semilla mínima: 1 agencia con 1 usuario, 1 negocio con 1 usuario y su
    BotConfig por defecto — mismo shape real que crea seed.py, pero
    autocontenido para que los tests no dependan de ese script."""
    agency = models.Agency(name="Agencia de Prueba")
    db_session.add(agency)
    db_session.flush()

    agency_user = models.AgencyUser(
        agency_id=agency.id,
        name="Admin Prueba",
        email="agencia@test-demo.com",
        password_hash=hash_password("agencia_pass_123"),
    )
    db_session.add(agency_user)

    business = models.Business(agency_id=agency.id, name="Negocio de Prueba")
    db_session.add(business)
    db_session.flush()

    business_user = models.BusinessUser(
        business_id=business.id,
        name="Dueño Prueba",
        email="negocio@test-demo.com",
        password_hash=hash_password("negocio_pass_123"),
    )
    db_session.add(business_user)

    bot_config = models.BotConfig(business_id=business.id, phone_number="+17865550100")
    db_session.add(bot_config)

    db_session.commit()
    return {"agency": agency, "business": business}
