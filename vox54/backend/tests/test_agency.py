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


# --- Perfil de la agencia ---

def test_get_agency_profile_incluye_negocios_gestionados(client, seed, agency_token):
    res = client.get("/agency/profile", headers=auth(agency_token))
    assert res.status_code == 200
    assert res.json()["name"] == "Agencia de Prueba"
    assert res.json()["business_count"] == 1


def test_update_agency_profile_persiste(client, seed, agency_token):
    res = client.put(
        "/agency/profile",
        headers=auth(agency_token),
        json={"contact_email": "hola@agenciaprueba.com", "contact_phone": "+1 555 0100", "website": "https://agenciaprueba.com"},
    )
    assert res.status_code == 200
    assert res.json()["contact_email"] == "hola@agenciaprueba.com"

    # el cambio debe persistir, no solo devolverse en la respuesta
    detail = client.get("/agency/profile", headers=auth(agency_token))
    assert detail.json()["contact_phone"] == "+1 555 0100"
    assert detail.json()["website"] == "https://agenciaprueba.com"


def test_update_agency_profile_nombre_vacio_falla(client, seed, agency_token):
    res = client.put("/agency/profile", headers=auth(agency_token), json={"name": "   "})
    assert res.status_code == 422


def test_update_agency_profile_parcial_no_toca_lo_demas(client, seed, agency_token):
    client.put("/agency/profile", headers=auth(agency_token), json={"contact_email": "a@a.com"})
    res = client.put("/agency/profile", headers=auth(agency_token), json={"website": "https://x.com"})
    assert res.status_code == 200
    assert res.json()["contact_email"] == "a@a.com"  # no se perdió con el segundo PUT
    assert res.json()["website"] == "https://x.com"


# --- Perfil de un negocio ---

def test_get_business_profile(client, seed, agency_token):
    business_id = seed["business"].id
    res = client.get(f"/agency/businesses/{business_id}/profile", headers=auth(agency_token))
    assert res.status_code == 200
    assert res.json()["name"] == "Negocio de Prueba"
    assert res.json()["description"] == ""


def test_update_business_profile_persiste(client, seed, agency_token):
    business_id = seed["business"].id
    res = client.put(
        f"/agency/businesses/{business_id}/profile",
        headers=auth(agency_token),
        json={
            "description": "Empresa de prueba para tests automatizados.",
            "hours": "Lunes a viernes 9am-5pm",
            "products_services": "Servicio de prueba A, servicio de prueba B",
        },
    )
    assert res.status_code == 200
    assert res.json()["hours"] == "Lunes a viernes 9am-5pm"

    detail = client.get(f"/agency/businesses/{business_id}/profile", headers=auth(agency_token))
    assert detail.json()["description"] == "Empresa de prueba para tests automatizados."
    assert detail.json()["products_services"] == "Servicio de prueba A, servicio de prueba B"


def test_no_se_puede_ver_ni_editar_el_perfil_de_un_negocio_de_otra_agencia(client, seed, agency_token):
    res_get = client.get("/agency/businesses/999/profile", headers=auth(agency_token))
    assert res_get.status_code == 404
    res_put = client.put("/agency/businesses/999/profile", headers=auth(agency_token), json={"hours": "x"})
    assert res_put.status_code == 404


# --- Registros: llamadas de toda la agencia ---

def test_registros_incluye_llamadas_de_todos_los_negocios_propios(client, seed, agency_token, db_session):
    from app import models

    business2 = models.Business(agency_id=seed["agency"].id, name="Negocio 2")
    db_session.add(business2)
    db_session.flush()
    db_session.add(models.Call(
        business_id=seed["business"].id, started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 1, 0), duration_seconds=60, outcome="completed",
    ))
    db_session.add(models.Call(
        business_id=business2.id, started_at=datetime.datetime(2026, 9, 1, 11, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 11, 2, 0), duration_seconds=120, outcome="transferred",
    ))
    db_session.commit()

    res = client.get("/agency/calls", headers=auth(agency_token))
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    nombres = {c["business_name"] for c in data}
    assert nombres == {"Negocio de Prueba", "Negocio 2"}


def test_registros_filtra_por_business_id(client, seed, agency_token, db_session):
    from app import models

    business2 = models.Business(agency_id=seed["agency"].id, name="Negocio 2")
    db_session.add(business2)
    db_session.flush()
    db_session.add(models.Call(
        business_id=seed["business"].id, started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 1, 0), duration_seconds=60, outcome="completed",
    ))
    db_session.add(models.Call(
        business_id=business2.id, started_at=datetime.datetime(2026, 9, 1, 11, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 11, 2, 0), duration_seconds=120, outcome="completed",
    ))
    db_session.commit()

    res = client.get(f"/agency/calls?business_id={business2.id}", headers=auth(agency_token))
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["business_name"] == "Negocio 2"


def test_registros_no_incluye_llamadas_de_otra_agencia(client, seed, agency_token, db_session):
    from app import models

    otra_agencia = models.Agency(name="Otra Agencia")
    db_session.add(otra_agencia)
    db_session.flush()
    negocio_ajeno = models.Business(agency_id=otra_agencia.id, name="Negocio Ajeno")
    db_session.add(negocio_ajeno)
    db_session.flush()
    db_session.add(models.Call(
        business_id=negocio_ajeno.id, started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 1, 0), duration_seconds=60, outcome="completed",
    ))
    db_session.commit()

    res = client.get("/agency/calls", headers=auth(agency_token))
    assert res.status_code == 200
    assert res.json() == []


def test_ver_el_detalle_de_una_llamada_real(client, seed, agency_token, db_session):
    from app import models

    call = models.Call(
        business_id=seed["business"].id, started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 3, 0), duration_seconds=180,
        caller_number="+17865551234", outcome="completed",
        transcript='[{"type":"message","role":"user","content":["Hola"]}]',
    )
    db_session.add(call)
    db_session.commit()
    db_session.refresh(call)

    res = client.get(f"/agency/calls/{call.id}", headers=auth(agency_token))
    assert res.status_code == 200
    body = res.json()
    assert body["business_name"] == "Negocio de Prueba"
    assert body["caller_number"] == "+17865551234"
    assert "Hola" in body["transcript"]


def test_no_se_puede_ver_el_detalle_de_una_llamada_de_otra_agencia(client, seed, agency_token, db_session):
    from app import models

    otra_agencia = models.Agency(name="Otra Agencia")
    db_session.add(otra_agencia)
    db_session.flush()
    negocio_ajeno = models.Business(agency_id=otra_agencia.id, name="Negocio Ajeno")
    db_session.add(negocio_ajeno)
    db_session.flush()
    call = models.Call(
        business_id=negocio_ajeno.id, started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
        ended_at=datetime.datetime(2026, 9, 1, 10, 1, 0), duration_seconds=60, outcome="completed",
    )
    db_session.add(call)
    db_session.commit()
    db_session.refresh(call)

    res = client.get(f"/agency/calls/{call.id}", headers=auth(agency_token))
    assert res.status_code == 404


def test_ver_una_llamada_inexistente_da_404(client, seed, agency_token):
    res = client.get("/agency/calls/999999", headers=auth(agency_token))
    assert res.status_code == 404
