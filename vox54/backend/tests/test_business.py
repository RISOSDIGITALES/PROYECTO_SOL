import datetime

import pytest


@pytest.fixture()
def business_token(client, seed):
    res = client.post("/auth/business/login", json={"email": "negocio@test-demo.com", "password": "negocio_pass_123"})
    return res.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_get_bot_config(client, seed, business_token):
    res = client.get("/business/bot-config", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json()["phone_number"] == "+17865550100"


def test_update_bot_config_valido(client, seed, business_token):
    res = client.put(
        "/business/bot-config",
        headers=auth(business_token),
        json={"welcome_message": "Hola, gracias por llamar", "language": "es"},
    )
    assert res.status_code == 200
    assert res.json()["welcome_message"] == "Hola, gracias por llamar"


def test_negocio_no_puede_tocar_campos_de_infraestructura(client, seed, business_token):
    """telefonía/STT/TTS/modelo de IA son decisiones de la agencia, no del
    cliente — el schema de este endpoint ni siquiera los conoce, así que
    mandarlos no da error, simplemente se ignoran sin tocar nada."""
    before = client.get("/business/bot-config", headers=auth(business_token)).json()

    res = client.put(
        "/business/bot-config",
        headers=auth(business_token),
        json={
            "ai_provider": "openai",
            "stt_provider": "groq",
            "tts_provider": "elevenlabs",
            "telephony_provider": "telnyx",
            "runtime_target": "self_hosted",
            "ai_api_key": "sk-deberia-ser-ignorado",
            "welcome_message": "esto sí debería guardarse",
        },
    )
    assert res.status_code == 200
    after = res.json()

    assert after["welcome_message"] == "esto sí debería guardarse"
    assert after["ai_provider"] == before["ai_provider"]
    assert after["stt_provider"] == before["stt_provider"]
    assert after["tts_provider"] == before["tts_provider"]
    assert after["telephony_provider"] == before["telephony_provider"]
    assert after["runtime_target"] == before["runtime_target"]
    assert after["ai_api_key"] == before["ai_api_key"]


def test_update_bot_config_email_de_escalacion_invalido(client, seed, business_token):
    res = client.put("/business/bot-config", headers=auth(business_token), json={"escalation_email": "no-es-un-correo"})
    assert res.status_code == 422


def test_update_bot_config_telefono_de_transferencia_con_letras_invalido(client, seed, business_token):
    # phone_number es de la agencia (ver test_negocio_no_puede_tocar_campos_de_infraestructura);
    # transfer_phone_number sí sigue siendo del cliente y usa la misma validación de formato.
    res = client.put("/business/bot-config", headers=auth(business_token), json={"transfer_phone_number": "llamame-porfa"})
    assert res.status_code == 422


def test_update_bot_config_silence_timeout_fuera_de_rango(client, seed, business_token):
    res = client.put("/business/bot-config", headers=auth(business_token), json={"silence_timeout_seconds": 9999})
    assert res.status_code == 422


def test_lista_de_llamadas_vacia_al_principio(client, seed, business_token):
    """El estado real hoy — nunca inventar una llamada de ejemplo para que
    la pantalla 'se vea llena'; vacío de verdad es honesto mientras no haya
    ninguna llamada real todavía."""
    res = client.get("/business/calls", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json() == []


def test_lista_de_llamadas_reales(client, seed, business_token, db_session):
    from app import models

    call = models.Call(
        business_id=seed["business"].id,
        started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 3, 0),
        duration_seconds=180,
        caller_number="+17865551234",
        outcome="completed",
        transcript='[{"role":"user","content":"Hola"}]',
    )
    db_session.add(call)
    db_session.commit()

    res = client.get("/business/calls", headers=auth(business_token))
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["caller_number"] == "+17865551234"
    assert data[0]["duration_seconds"] == 180


def test_un_negocio_nunca_ve_las_llamadas_de_otro(client, seed, business_token, db_session):
    from app import models
    from app.security import hash_password

    business2 = models.Business(agency_id=seed["agency"].id, name="Negocio 2")
    db_session.add(business2)
    db_session.flush()
    db_session.add(models.BusinessUser(
        business_id=business2.id, name="Dueño 2", email="negocio2-calls@test-demo.com",
        password_hash=hash_password("otra_pass_123"),
    ))
    db_session.add(models.Call(
        business_id=business2.id, started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 1, 0),
        duration_seconds=60, outcome="completed",
    ))
    db_session.commit()

    res = client.get("/business/calls", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json() == []  # las de negocio 1 siguen vacías, la de negocio 2 no se filtró


def test_un_negocio_nunca_ve_ni_toca_la_config_de_otro(client, seed, business_token, db_session):
    """/business/bot-config siempre resuelve por el business_id del propio
    token, nunca por un id que alguien pase — se prueba con un segundo
    negocio real y confirmando que cada uno ve y modifica solo lo suyo."""
    from app import models
    from app.security import hash_password

    business2 = models.Business(agency_id=seed["agency"].id, name="Negocio 2")
    db_session.add(business2)
    db_session.flush()
    db_session.add(models.BusinessUser(
        business_id=business2.id, name="Dueño 2", email="negocio2@test-demo.com",
        password_hash=hash_password("otra_pass_123"),
    ))
    db_session.add(models.BotConfig(business_id=business2.id, welcome_message="Bienvenida negocio 2"))
    db_session.commit()

    login2 = client.post("/auth/business/login", json={"email": "negocio2@test-demo.com", "password": "otra_pass_123"})
    token2 = login2.json()["access_token"]

    # negocio 1 cambia su propio mensaje de bienvenida
    client.put("/business/bot-config", headers=auth(business_token), json={"welcome_message": "Bienvenida negocio 1"})

    config1 = client.get("/business/bot-config", headers=auth(business_token)).json()
    config2 = client.get("/business/bot-config", headers=auth(token2)).json()

    assert config1["welcome_message"] == "Bienvenida negocio 1"
    assert config2["welcome_message"] == "Bienvenida negocio 2"  # intacto, nunca lo tocó el otro negocio
