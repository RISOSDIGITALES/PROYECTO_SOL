import pytest


@pytest.fixture()
def agency_token(client, seed):
    res = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"})
    return res.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


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
