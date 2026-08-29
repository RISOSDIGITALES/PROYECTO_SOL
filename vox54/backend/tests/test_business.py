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
        json={"stt_provider": "groq", "stt_model": "whisper-large-v3-turbo"},
    )
    assert res.status_code == 200
    assert res.json()["stt_provider"] == "groq"


def test_update_bot_config_voz_no_pertenece_al_proveedor(client, seed, business_token):
    res = client.put(
        "/business/bot-config",
        headers=auth(business_token),
        json={"tts_provider": "cartesia", "tts_voice_id": "voz-que-no-existe"},
    )
    assert res.status_code == 422


def test_update_bot_config_email_de_escalacion_invalido(client, seed, business_token):
    res = client.put("/business/bot-config", headers=auth(business_token), json={"escalation_email": "no-es-un-correo"})
    assert res.status_code == 422


def test_update_bot_config_telefono_con_letras_invalido(client, seed, business_token):
    res = client.put("/business/bot-config", headers=auth(business_token), json={"phone_number": "llamame-porfa"})
    assert res.status_code == 422


def test_update_bot_config_silence_timeout_fuera_de_rango(client, seed, business_token):
    res = client.put("/business/bot-config", headers=auth(business_token), json={"silence_timeout_seconds": 9999})
    assert res.status_code == 422


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
    db_session.add(models.BotConfig(business_id=business2.id, phone_number="+17865559999"))
    db_session.commit()

    login2 = client.post("/auth/business/login", json={"email": "negocio2@test-demo.com", "password": "otra_pass_123"})
    token2 = login2.json()["access_token"]

    # negocio 1 cambia su propio teléfono
    client.put("/business/bot-config", headers=auth(business_token), json={"phone_number": "+17865551111"})

    config1 = client.get("/business/bot-config", headers=auth(business_token)).json()
    config2 = client.get("/business/bot-config", headers=auth(token2)).json()

    assert config1["phone_number"] == "+17865551111"
    assert config2["phone_number"] == "+17865559999"  # intacto, nunca lo tocó el otro negocio
