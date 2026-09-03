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


def test_get_bot_config_no_expone_infraestructura(client, seed, business_token, db_session):
    """La barrera de escritura (BotConfigUpdateClient) no sirve de nada si
    la RESPUESTA de lectura sigue mandando todo el objeto completo — un
    negocio no debe recibir en el JSON ni el api key propio de otro
    negocio ni ningún dato de infraestructura, aunque el formulario nunca
    los muestre (network tab del navegador los vería igual)."""
    seed["business"].bot_config.ai_api_key = "sk-secreto-de-verdad-nunca-deberia-viajar"
    db_session.commit()

    res = client.get("/business/bot-config", headers=auth(business_token))
    assert res.status_code == 200
    data = res.json()
    for campo in ("ai_api_key", "ai_provider", "ai_model", "telephony_provider", "telephony_trunk_id", "stt_provider", "stt_model", "tts_provider", "tts_voice_id", "runtime_target"):
        assert campo not in data, f"'{campo}' no debería estar en la respuesta de /business/bot-config"
    # lo que sí le corresponde ver seguir presente
    assert data["phone_number"] == "+17865550100"
    assert "system_prompt" in data


def test_update_bot_config_respuesta_no_expone_infraestructura(client, seed, business_token):
    res = client.put("/business/bot-config", headers=auth(business_token), json={"welcome_message": "Hola"})
    assert res.status_code == 200
    assert "ai_api_key" not in res.json()
    assert "ai_provider" not in res.json()


def test_negocio_no_puede_tocar_campos_de_infraestructura(client, seed, business_token, db_session):
    """telefonía/STT/TTS/modelo de IA son decisiones de la agencia, no del
    cliente — el schema de este endpoint ni siquiera los conoce, así que
    mandarlos no da error, simplemente se ignoran sin tocar nada. Ni la
    respuesta de este endpoint expone esos campos (ver
    test_get_bot_config_no_expone_infraestructura), así que la comparación
    real de "no cambió nada" se hace contra la base, no contra el JSON."""
    bot_config = seed["business"].bot_config
    antes = (bot_config.ai_provider, bot_config.stt_provider, bot_config.tts_provider, bot_config.telephony_provider, bot_config.runtime_target, bot_config.ai_api_key)

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
    assert res.json()["welcome_message"] == "esto sí debería guardarse"

    db_session.refresh(bot_config)
    despues = (bot_config.ai_provider, bot_config.stt_provider, bot_config.tts_provider, bot_config.telephony_provider, bot_config.runtime_target, bot_config.ai_api_key)
    assert despues == antes


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


def test_me_incluye_el_nombre_de_la_agencia(client, seed, business_token):
    """Un negocio no tiene ningún canal de soporte propio — quien lo
    gestiona es su agencia, así que necesita saber cuál es."""
    res = client.get("/business/me", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json()["agency_name"] == "Agencia de Prueba"


def test_me_incluye_el_contacto_real_de_la_agencia_si_lo_cargo(client, seed, business_token, db_session):
    seed["agency"].contact_email = "hola@agenciaprueba.com"
    seed["agency"].contact_phone = "+1 555 0100"
    db_session.commit()

    res = client.get("/business/me", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json()["agency_contact_email"] == "hola@agenciaprueba.com"
    assert res.json()["agency_contact_phone"] == "+1 555 0100"


def test_me_sin_contacto_de_agencia_cargado_no_inventa_nada(client, seed, business_token):
    res = client.get("/business/me", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json()["agency_contact_email"] == ""
    assert res.json()["agency_contact_phone"] == ""


# --- Perfil del propio negocio ---

def test_get_profile(client, seed, business_token):
    res = client.get("/business/profile", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json()["name"] == "Negocio de Prueba"
    assert res.json()["hours"] == ""


def test_update_profile_persiste(client, seed, business_token):
    res = client.put(
        "/business/profile",
        headers=auth(business_token),
        json={
            "description": "Somos una empresa de prueba.",
            "hours": "Todos los días 8am-6pm",
            "products_services": "Servicio A, Servicio B",
        },
    )
    assert res.status_code == 200
    assert res.json()["description"] == "Somos una empresa de prueba."

    detail = client.get("/business/profile", headers=auth(business_token))
    assert detail.json()["hours"] == "Todos los días 8am-6pm"
    assert detail.json()["products_services"] == "Servicio A, Servicio B"


def test_update_profile_no_puede_cambiar_el_nombre(client, seed, business_token):
    """A propósito: BusinessProfileUpdate ni siquiera conoce `name` — el
    negocio no se renombra a sí mismo, eso es de la agencia (ver
    /agency/businesses/{id}, endpoint distinto)."""
    res = client.put("/business/profile", headers=auth(business_token), json={"name": "Nombre Robado"})
    assert res.status_code == 200  # el campo desconocido se ignora, no da error
    assert res.json()["name"] == "Negocio de Prueba"


def test_un_negocio_nunca_ve_ni_toca_el_perfil_de_otro(client, seed, business_token, db_session):
    from app import models
    from app.security import hash_password

    business2 = models.Business(agency_id=seed["agency"].id, name="Negocio 2", description="Perfil de negocio 2")
    db_session.add(business2)
    db_session.flush()
    db_session.add(models.BusinessUser(
        business_id=business2.id, name="Dueño 2", email="negocio2-perfil@test-demo.com",
        password_hash=hash_password("otra_pass_123"),
    ))
    db_session.commit()

    login2 = client.post("/auth/business/login", json={"email": "negocio2-perfil@test-demo.com", "password": "otra_pass_123"})
    token2 = login2.json()["access_token"]

    client.put("/business/profile", headers=auth(business_token), json={"description": "Perfil de negocio 1"})

    profile1 = client.get("/business/profile", headers=auth(business_token)).json()
    profile2 = client.get("/business/profile", headers=auth(token2)).json()

    assert profile1["description"] == "Perfil de negocio 1"
    assert profile2["description"] == "Perfil de negocio 2"  # intacto


def test_cambiar_password_ok(client, seed, business_token):
    res = client.put(
        "/business/me/password",
        headers=auth(business_token),
        json={"current_password": "negocio_pass_123", "new_password": "nueva_password_valida"},
    )
    assert res.status_code == 200

    # la contraseña vieja ya no sirve
    login_vieja = client.post("/auth/business/login", json={"email": "negocio@test-demo.com", "password": "negocio_pass_123"})
    assert login_vieja.status_code == 401

    # la nueva sí
    login_nueva = client.post("/auth/business/login", json={"email": "negocio@test-demo.com", "password": "nueva_password_valida"})
    assert login_nueva.status_code == 200


def test_cambiar_password_con_password_actual_incorrecta_falla(client, seed, business_token):
    res = client.put(
        "/business/me/password",
        headers=auth(business_token),
        json={"current_password": "esto-no-es-la-password-real", "new_password": "nueva_password_valida"},
    )
    assert res.status_code == 400
    # la contraseña real sigue funcionando — el intento fallido no la tocó
    login = client.post("/auth/business/login", json={"email": "negocio@test-demo.com", "password": "negocio_pass_123"})
    assert login.status_code == 200


def test_cambiar_password_nueva_muy_corta_falla(client, seed, business_token):
    res = client.put(
        "/business/me/password",
        headers=auth(business_token),
        json={"current_password": "negocio_pass_123", "new_password": "corta"},
    )
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


# --- Logo y documento de información propios — mismo criterio que en
# test_agency.py: el endpoint solo valida content-type/tamaño, no el
# contenido real del archivo. `isolated_upload_dir` (conftest.py, autouse)
# ya redirige la escritura real a un directorio temporal.
def test_subir_mi_propio_logo(client, seed, business_token):
    res = client.post(
        "/business/profile/logo",
        headers=auth(business_token),
        files={"file": ("logo.svg", b"<svg></svg>", "image/svg+xml")},
    )
    assert res.status_code == 200
    assert res.json()["logo_url"].startswith("/uploads/logos/business/")

    fresh = client.get("/business/profile", headers=auth(business_token))
    assert fresh.json()["logo_url"] == res.json()["logo_url"]


def test_borrar_mi_propio_logo(client, seed, business_token):
    client.post(
        "/business/profile/logo",
        headers=auth(business_token),
        files={"file": ("logo.png", b"fake", "image/png")},
    )
    res = client.delete("/business/profile/logo", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json()["logo_url"] == ""


def test_subir_mi_propio_documento(client, seed, business_token):
    res = client.post(
        "/business/profile/info-document",
        headers=auth(business_token),
        files={"file": ("Horarios y precios.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["info_document_url"].startswith("/uploads/documents/business/")
    assert body["info_document_name"] == "Horarios y precios.pdf"

    res = client.delete("/business/profile/info-document", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json()["info_document_name"] == ""


def test_un_negocio_no_puede_subir_documento_de_otro(client, seed, business_token, db_session):
    from app.security import hash_password
    from app import models

    business2 = models.Business(agency_id=seed["agency"].id, name="Negocio 2")
    db_session.add(business2)
    db_session.flush()
    db_session.add(models.BusinessUser(
        business_id=business2.id, name="Dueño 2", email="negocio2@test-demo.com",
        password_hash=hash_password("otra_pass_123"),
    ))
    db_session.commit()

    # negocio 1 sube su propio documento
    client.post(
        "/business/profile/info-document",
        headers=auth(business_token),
        files={"file": ("propio.pdf", b"%PDF-1.4", "application/pdf")},
    )

    login2 = client.post("/auth/business/login", json={"email": "negocio2@test-demo.com", "password": "otra_pass_123"})
    token2 = login2.json()["access_token"]
    profile2 = client.get("/business/profile", headers=auth(token2))
    # negocio 2 nunca tuvo su propio endpoint apuntado a business1 — pero la
    # prueba real es que el documento de negocio 1 nunca se filtra al 2
    assert profile2.json()["info_document_name"] == ""
