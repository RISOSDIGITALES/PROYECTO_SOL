import datetime

import pytest


@pytest.fixture()
def agency_token(client, seed):
    res = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"})
    return res.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_cambiar_password_ok(client, seed, agency_token):
    res = client.put(
        "/agency/me/password",
        headers=auth(agency_token),
        json={"current_password": "agencia_pass_123", "new_password": "nueva_password_valida"},
    )
    assert res.status_code == 200

    login_vieja = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"})
    assert login_vieja.status_code == 401

    login_nueva = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "nueva_password_valida"})
    assert login_nueva.status_code == 200


def test_cambiar_password_con_password_actual_incorrecta_falla(client, seed, agency_token):
    res = client.put(
        "/agency/me/password",
        headers=auth(agency_token),
        json={"current_password": "no-es-la-real", "new_password": "nueva_password_valida"},
    )
    assert res.status_code == 400


def test_inventario_de_agentes(client, seed, agency_token):
    res = client.get("/agency/agents", headers=auth(agency_token))
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["business_name"] == "Negocio de Prueba"
    assert data[0]["bot_status"] == "paused"
    assert data[0]["ai_provider"] == "groq"


def test_inventario_de_agentes_no_incluye_los_de_otra_agencia(client, seed, agency_token, db_session):
    from app import models

    otra_agencia = models.Agency(name="Otra Agencia")
    db_session.add(otra_agencia)
    db_session.flush()
    negocio_ajeno = models.Business(agency_id=otra_agencia.id, name="Negocio Ajeno")
    db_session.add(negocio_ajeno)
    db_session.flush()
    db_session.add(models.BotConfig(business_id=negocio_ajeno.id))
    db_session.commit()

    res = client.get("/agency/agents", headers=auth(agency_token))
    assert res.status_code == 200
    assert len(res.json()) == 1  # solo el propio, el ajeno nunca aparece


def test_listar_negocios(client, seed, agency_token):
    res = client.get("/agency/businesses", headers=auth(agency_token))
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["name"] == "Negocio de Prueba"


def test_crear_negocio_ok(client, seed, agency_token):
    res = client.post(
        "/agency/businesses",
        headers=auth(agency_token),
        json={
            "name": "Negocio Nuevo",
            "contact_name": "Contacto Nuevo",
            "contact_email": "nuevo@test-demo.com",
            "contact_password": "password123",
        },
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Negocio Nuevo"

    # el negocio nuevo debe tener su propio BotConfig ya creado, con defaults reales
    detail = client.get(f"/agency/businesses/{res.json()['id']}", headers=auth(agency_token))
    assert detail.status_code == 200
    assert detail.json()["bot_config"]["status"] == "paused"
    assert detail.json()["bot_config"]["ai_provider"] == "groq"


def test_crear_negocio_password_corta_falla(client, seed, agency_token):
    res = client.post(
        "/agency/businesses",
        headers=auth(agency_token),
        json={"name": "X", "contact_name": "Y", "contact_email": "z@test-demo.com", "contact_password": "corta"},
    )
    assert res.status_code == 422


def test_crear_negocio_nombre_vacio_falla(client, seed, agency_token):
    res = client.post(
        "/agency/businesses",
        headers=auth(agency_token),
        json={"name": "   ", "contact_name": "Y", "contact_email": "z@test-demo.com", "contact_password": "password123"},
    )
    assert res.status_code == 422


def test_crear_negocio_email_de_contacto_duplicado_falla(client, seed, agency_token):
    res = client.post(
        "/agency/businesses",
        headers=auth(agency_token),
        json={
            "name": "Otro",
            "contact_name": "Otro Contacto",
            "contact_email": "negocio@test-demo.com",  # ya existe (seed)
            "contact_password": "password123",
        },
    )
    assert res.status_code == 409


def test_no_se_puede_ver_un_negocio_de_otra_agencia(client, seed, agency_token):
    res = client.get("/agency/businesses/999", headers=auth(agency_token))
    assert res.status_code == 404


def test_renombrar_negocio_ok(client, seed, agency_token):
    business_id = seed["business"].id
    res = client.patch(
        f"/agency/businesses/{business_id}",
        headers=auth(agency_token),
        json={"name": "Negocio Renombrado"},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "Negocio Renombrado"

    # el cambio debe persistir, no solo devolverse en la respuesta
    detail = client.get(f"/agency/businesses/{business_id}", headers=auth(agency_token))
    assert detail.json()["name"] == "Negocio Renombrado"


def test_renombrar_negocio_nombre_vacio_falla(client, seed, agency_token):
    business_id = seed["business"].id
    res = client.patch(
        f"/agency/businesses/{business_id}",
        headers=auth(agency_token),
        json={"name": "   "},
    )
    assert res.status_code == 422

    # el nombre original no debe haberse tocado
    detail = client.get(f"/agency/businesses/{business_id}", headers=auth(agency_token))
    assert detail.json()["name"] == "Negocio de Prueba"


def test_no_se_puede_renombrar_un_negocio_de_otra_agencia(client, seed, agency_token):
    res = client.patch(
        "/agency/businesses/999",
        headers=auth(agency_token),
        json={"name": "Intento Ajeno"},
    )
    assert res.status_code == 404


def test_actualizar_bot_config_valido(client, seed, agency_token):
    business_id = seed["business"].id
    res = client.put(
        f"/agency/businesses/{business_id}/bot-config",
        headers=auth(agency_token),
        json={"welcome_message": "Hola, gracias por llamar."},
    )
    assert res.status_code == 200
    assert res.json()["welcome_message"] == "Hola, gracias por llamar."


def test_actualizar_bot_config_modelo_no_pertenece_al_proveedor(client, seed, agency_token):
    business_id = seed["business"].id
    res = client.put(
        f"/agency/businesses/{business_id}/bot-config",
        headers=auth(agency_token),
        json={"ai_provider": "groq", "ai_model": "gpt-4o"},  # gpt-4o es de openai
    )
    assert res.status_code == 422
    assert "errors" in res.json()["detail"]


def test_actualizar_bot_config_voz_no_pertenece_al_proveedor(client, seed, agency_token):
    # tts_provider/tts_voice_id dejaron de ser editables por el negocio (ver
    # test_negocio_no_puede_tocar_campos_de_infraestructura) — esta validación
    # solo se puede seguir ejercitando desde la agencia.
    business_id = seed["business"].id
    res = client.put(
        f"/agency/businesses/{business_id}/bot-config",
        headers=auth(agency_token),
        json={"tts_provider": "cartesia", "tts_voice_id": "voz-que-no-existe"},
    )
    assert res.status_code == 422
    assert "errors" in res.json()["detail"]


def test_patch_parcial_se_valida_contra_el_proveedor_ya_guardado(client, seed, agency_token):
    """Caso crítico: mandar solo ai_model, sin ai_provider, debe validarse
    contra el ai_provider que YA está en la base (groq por default) —
    no contra un valor vacío ni contra el del request."""
    business_id = seed["business"].id
    res = client.put(
        f"/agency/businesses/{business_id}/bot-config",
        headers=auth(agency_token),
        json={"ai_model": "gpt-4o"},  # inválido contra groq (default ya guardado)
    )
    assert res.status_code == 422


def test_ver_llamadas_de_un_negocio_propio(client, seed, agency_token, db_session):
    from app import models

    db_session.add(models.Call(
        business_id=seed["business"].id, started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 2, 0),
        duration_seconds=120, caller_number="+17865551234", outcome="completed",
    ))
    db_session.commit()

    business_id = seed["business"].id
    res = client.get(f"/agency/businesses/{business_id}/calls", headers=auth(agency_token))
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["outcome"] == "completed"


def test_no_se_pueden_ver_llamadas_de_un_negocio_de_otra_agencia(client, seed, agency_token, db_session):
    from app import models

    otra_agencia = models.Agency(name="Otra Agencia")
    db_session.add(otra_agencia)
    db_session.flush()
    negocio_ajeno = models.Business(agency_id=otra_agencia.id, name="Negocio Ajeno")
    db_session.add(negocio_ajeno)
    db_session.flush()
    db_session.add(models.Call(
        business_id=negocio_ajeno.id, started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 1, 0),
        duration_seconds=60, outcome="completed",
    ))
    db_session.commit()

    res = client.get(f"/agency/businesses/{negocio_ajeno.id}/calls", headers=auth(agency_token))
    assert res.status_code == 404
