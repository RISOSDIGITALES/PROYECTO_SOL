"""Crea datos de prueba: 1 agencia + 1 usuario de agencia, 2 negocios + sus usuarios.
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

    # --- Negocio 1 ---
    business1 = models.Business(agency_id=agency.id, name="Crating Express (demo)")
    db.add(business1)
    db.flush()

    db.add(models.BusinessUser(
        business_id=business1.id,
        name="Admin Negocio",
        email="admin@cratingexpress-demo.com",
        password_hash=hash_password("negocio123"),
    ))

    db.add(models.BotConfig(
        business_id=business1.id,
        voice_provider="vapi",
        voice_id="sample-male-professional",
        ai_provider="groq",
        ai_model="llama-3.3-70b-versatile",
        system_prompt="Eres Marco, un asistente de voz para Crating Express, empresa de embalajes de madera a medida en Miami.",
        welcome_message="Gracias por llamar a Crating Express, soy Marco. ¿Con quién tengo el gusto?",
        escalation_email="ventas@cratingexpress-demo.com",
        language="auto",
        status="active",
    ))

    # --- Negocio 2 ---
    business2 = models.Business(agency_id=agency.id, name="Orison Managua (demo)")
    db.add(business2)
    db.flush()

    db.add(models.BusinessUser(
        business_id=business2.id,
        name="Admin Orison",
        email="admin@orison-demo.com",
        password_hash=hash_password("negocio123"),
    ))

    db.add(models.BotConfig(
        business_id=business2.id,
        voice_provider="vapi",
        voice_id="sample-female-warm",
        ai_provider="groq",
        ai_model="llama-3.1-8b-instant",
        system_prompt="Eres el asistente de voz de Orison Managua, un hotel en Managua, Nicaragua.",
        welcome_message="Gracias por llamar a Orison Managua, ¿en qué puedo ayudarte?",
        escalation_email="reservas@orison-demo.com",
        language="es",
        status="paused",
    ))

    db.commit()
    print("Datos de prueba creados:")
    print("  Agencia   -> admin@growth54.com / agencia123")
    print("  Negocio 1 -> admin@cratingexpress-demo.com / negocio123 (Crating Express)")
    print("  Negocio 2 -> admin@orison-demo.com / negocio123 (Orison Managua)")
else:
    print("Ya existen datos — no se creó nada nuevo.")

db.close()
