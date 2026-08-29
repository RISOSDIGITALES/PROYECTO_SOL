"""Crea datos de prueba: 1 agencia + 1 usuario de agencia, 1 negocio + 1 usuario de negocio.
Correr una sola vez: python seed.py
"""
from app.database import SessionLocal, Base, engine
from app.security import hash_password
from app import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if not db.query(models.Agency).first():
    agency = models.Agency(name="Growth54")
    db.add(agency)
    db.flush()

    agency_user = models.AgencyUser(
        agency_id=agency.id,
        name="Admin Agencia",
        email="admin@growth54.com",
        password_hash=hash_password("agencia123"),
    )
    db.add(agency_user)

    business = models.Business(agency_id=agency.id, name="Crating Express (demo)")
    db.add(business)
    db.flush()

    business_user = models.BusinessUser(
        business_id=business.id,
        name="Admin Negocio",
        email="admin@cratingexpress-demo.com",
        password_hash=hash_password("negocio123"),
    )
    db.add(business_user)

    bot_config = models.BotConfig(
        business_id=business.id,
        voice_provider="vapi",
        ai_provider="groq",
        ai_model="llama-3.3-70b-versatile",
        system_prompt="Eres un asistente de voz para Crating Express.",
    )
    db.add(bot_config)

    db.commit()
    print("Datos de prueba creados:")
    print("  Agencia  -> admin@growth54.com / agencia123")
    print("  Negocio  -> admin@cratingexpress-demo.com / negocio123")
else:
    print("Ya existen datos — no se creó nada nuevo.")

db.close()
