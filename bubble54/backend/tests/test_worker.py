from app.config import settings


def auth_worker():
    return {"X-Worker-Secret": settings.worker_secret}


def test_sin_secreto_da_401(client, seed):
    business_id = seed["business"].id
    res = client.get(f"/worker/bot-config/{business_id}")
    assert res.status_code == 401


def test_secreto_incorrecto_da_401(client, seed):
    business_id = seed["business"].id
    res = client.get(f"/worker/bot-config/{business_id}", headers={"X-Worker-Secret": "lo-que-sea"})
    assert res.status_code == 401


def test_secreto_correcto_devuelve_la_config_real(client, seed):
    business_id = seed["business"].id
    res = client.get(
        f"/worker/bot-config/{business_id}", headers={"X-Worker-Secret": settings.worker_secret}
    )
    assert res.status_code == 200
    assert res.json()["phone_number"] == "+17865550100"


def test_business_id_inexistente_da_404(client, seed):
    res = client.get("/worker/bot-config/999999", headers={"X-Worker-Secret": settings.worker_secret})
    assert res.status_code == 404


def test_resolver_por_telefono_real(client, seed):
    res = client.get(
        "/worker/bot-config/by-phone/+17865550100", headers={"X-Worker-Secret": settings.worker_secret}
    )
    assert res.status_code == 200


def test_resolver_por_telefono_no_asignado_da_404(client, seed):
    res = client.get(
        "/worker/bot-config/by-phone/+19999999999", headers={"X-Worker-Secret": settings.worker_secret}
    )
    assert res.status_code == 404


def test_bot_config_incluye_el_perfil_real_del_negocio(client, seed, db_session):
    """El worker necesita el conocimiento real del negocio (no solo la
    infraestructura del bot) para poder armar las instrucciones reales del
    agente — ver worker/agent.py:build_instructions."""
    seed["business"].description = "Empresa de embalajes de madera a medida."
    seed["business"].hours = "Lunes a viernes 8am-5pm"
    seed["business"].products_services = "Cajones cerrados, jaulas abiertas"
    db_session.commit()

    business_id = seed["business"].id
    res = client.get(f"/worker/bot-config/{business_id}", headers=auth_worker())
    assert res.status_code == 200
    body = res.json()
    assert body["business_name"] == "Negocio de Prueba"
    assert body["business_description"] == "Empresa de embalajes de madera a medida."
    assert body["business_hours"] == "Lunes a viernes 8am-5pm"
    assert body["business_products_services"] == "Cajones cerrados, jaulas abiertas"


def test_bot_config_sin_perfil_cargado_devuelve_strings_vacios_no_null(client, seed):
    """Un negocio recién creado no tiene perfil todavía — el worker debe
    poder confiar en que estos campos siempre son string, nunca None."""
    business_id = seed["business"].id
    res = client.get(f"/worker/bot-config/{business_id}", headers=auth_worker())
    assert res.status_code == 200
    body = res.json()
    assert body["business_description"] == ""
    assert body["business_hours"] == ""
    assert body["business_products_services"] == ""


def test_bot_config_incluye_business_id(client, seed):
    """El worker necesita saber a qué negocio reportarle la llamada — sin
    esto no tiene forma de armar el POST /worker/calls cuando resolvió la
    config por número de teléfono, no por business_id."""
    business_id = seed["business"].id
    res = client.get(f"/worker/bot-config/{business_id}", headers=auth_worker())
    assert res.json()["business_id"] == business_id


def test_reportar_llamada_sin_secreto_da_401(client, seed):
    res = client.post("/worker/calls", json={"business_id": seed["business"].id})
    assert res.status_code == 401


def test_reportar_llamada_real(client, seed):
    business_id = seed["business"].id
    res = client.post(
        "/worker/calls",
        headers=auth_worker(),
        json={
            "business_id": business_id,
            "started_at": "2026-09-01T10:00:00",
            "ended_at": "2026-09-01T10:03:30",
            "caller_number": "+17865551234",
            "outcome": "completed",
            "transcript": '[{"role":"assistant","content":"Hola"}]',
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["duration_seconds"] == 210  # 3 min 30s
    assert body["caller_number"] == "+17865551234"
    assert body["outcome"] == "completed"


def test_reportar_llamada_business_id_inexistente_da_404(client, seed):
    res = client.post(
        "/worker/calls",
        headers=auth_worker(),
        json={
            "business_id": 999999,
            "started_at": "2026-09-01T10:00:00",
            "ended_at": "2026-09-01T10:01:00",
            "outcome": "completed",
        },
    )
    assert res.status_code == 404


def test_reportar_llamada_outcome_invalido_da_422(client, seed):
    res = client.post(
        "/worker/calls",
        headers=auth_worker(),
        json={
            "business_id": seed["business"].id,
            "started_at": "2026-09-01T10:00:00",
            "ended_at": "2026-09-01T10:01:00",
            "outcome": "un-outcome-inventado",
        },
    )
    assert res.status_code == 422


def test_reportar_llamada_ended_at_antes_de_started_at_da_422(client, seed):
    res = client.post(
        "/worker/calls",
        headers=auth_worker(),
        json={
            "business_id": seed["business"].id,
            "started_at": "2026-09-01T10:05:00",
            "ended_at": "2026-09-01T10:00:00",
            "outcome": "completed",
        },
    )
    assert res.status_code == 422


def test_un_negocio_no_puede_reportar_llamadas_por_su_cuenta(client, seed):
    """Este endpoint es exclusivo del worker — protegido con el secreto
    compartido, no con un JWT de negocio/agencia. Sin el secreto, ni con un
    token de negocio real, se puede escribir en `calls`."""
    login = client.post("/auth/business/login", json={"email": "negocio@test-demo.com", "password": "negocio_pass_123"})
    token = login.json()["access_token"]
    res = client.post(
        "/worker/calls",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "business_id": seed["business"].id,
            "started_at": "2026-09-01T10:00:00",
            "ended_at": "2026-09-01T10:01:00",
            "outcome": "completed",
        },
    )
    assert res.status_code == 401
