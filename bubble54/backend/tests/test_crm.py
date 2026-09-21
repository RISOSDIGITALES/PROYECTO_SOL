"""CRM real por negocio (2026-09-21) -- el upsert real desde una llamada
(worker) + los endpoints de negocio y agencia para verlo/editarlo."""
import datetime

import pytest

from app import models


@pytest.fixture()
def worker_headers():
    from app.config import settings

    return {"X-Worker-Secret": settings.worker_secret}


def auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def agency_token(client, seed):
    res = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"})
    return res.json()["access_token"]


@pytest.fixture()
def business_token(client, seed):
    res = client.post("/auth/business/login", json={"email": "negocio@test-demo.com", "password": "negocio_pass_123"})
    return res.json()["access_token"]


def _report_call(client, worker_headers, business_id, caller_number, started="2026-09-01T10:00:00"):
    started_dt = datetime.datetime.fromisoformat(started)
    ended_dt = started_dt + datetime.timedelta(minutes=3)
    res = client.post(
        "/worker/calls",
        headers=worker_headers,
        json={
            "business_id": business_id,
            "started_at": started_dt.isoformat(),
            "ended_at": ended_dt.isoformat(),
            "caller_number": caller_number,
            "outcome": "completed",
            "transcript": "Hola",
        },
    )
    assert res.status_code == 201, res.text  # si esto falla, el resto del test mide un fantasma
    return res


# --- Upsert real desde una llamada ---

def test_una_llamada_real_crea_un_cliente_nuevo(client, seed, worker_headers, db_session):
    res = _report_call(client, worker_headers, seed["business"].id, "+17865551234")
    assert res.status_code == 201

    customers = db_session.query(models.Customer).all()
    assert len(customers) == 1
    assert customers[0].phone == "+17865551234"
    assert customers[0].calls_count == 1
    assert customers[0].stage == "new"


def test_segunda_llamada_del_mismo_numero_actualiza_en_vez_de_duplicar(client, seed, worker_headers, db_session):
    _report_call(client, worker_headers, seed["business"].id, "+17865551234", started="2026-09-01T10:00:00")
    _report_call(client, worker_headers, seed["business"].id, "+17865551234", started="2026-09-05T14:00:00")

    customers = db_session.query(models.Customer).all()
    assert len(customers) == 1
    assert customers[0].calls_count == 2
    assert customers[0].last_call_at == datetime.datetime(2026, 9, 5, 14, 0, 0)


def test_llamada_sin_numero_real_no_crea_ningun_cliente(client, seed, worker_headers, db_session):
    res = client.post(
        "/worker/calls",
        headers=worker_headers,
        json={
            "business_id": seed["business"].id,
            "started_at": "2026-09-01T10:00:00",
            "ended_at": "2026-09-01T10:01:00",
            "caller_number": None,
            "outcome": "completed",
        },
    )
    assert res.status_code == 201
    assert db_session.query(models.Customer).count() == 0


def test_mismo_numero_en_2_negocios_distintos_crea_2_clientes_separados(client, seed, worker_headers, db_session):
    from app.security import hash_password

    business2 = models.Business(agency_id=seed["agency"].id, name="Negocio 2")
    db_session.add(business2)
    db_session.flush()
    db_session.add(models.BusinessUser(
        business_id=business2.id, name="Dueño 2", email="negocio2-crm@test-demo.com",
        password_hash=hash_password("otra_pass_123"),
    ))
    db_session.commit()

    _report_call(client, worker_headers, seed["business"].id, "+17865551234")
    _report_call(client, worker_headers, business2.id, "+17865551234")

    customers = db_session.query(models.Customer).all()
    assert len(customers) == 2
    assert {c.business_id for c in customers} == {seed["business"].id, business2.id}


# --- Endpoints del propio negocio ---

def test_negocio_ve_su_lista_de_clientes(client, seed, worker_headers, business_token):
    _report_call(client, worker_headers, seed["business"].id, "+17865551234")
    res = client.get("/business/customers", headers=auth(business_token))
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["phone"] == "+17865551234"


def test_negocio_edita_nombre_notas_y_etapa_de_un_cliente(client, seed, worker_headers, business_token):
    _report_call(client, worker_headers, seed["business"].id, "+17865551234")
    customer_id = client.get("/business/customers", headers=auth(business_token)).json()[0]["id"]

    res = client.patch(
        f"/business/customers/{customer_id}",
        headers=auth(business_token),
        json={"name": "Juan Pérez", "notes": "Preguntó por precios", "stage": "contacted"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Juan Pérez"
    assert body["notes"] == "Preguntó por precios"
    assert body["stage"] == "contacted"
    # el teléfono y el contador de llamadas nunca se tocan por acá
    assert body["phone"] == "+17865551234"
    assert body["calls_count"] == 1


def test_negocio_no_puede_mandar_un_stage_invalido(client, seed, worker_headers, business_token):
    _report_call(client, worker_headers, seed["business"].id, "+17865551234")
    customer_id = client.get("/business/customers", headers=auth(business_token)).json()[0]["id"]

    res = client.patch(
        f"/business/customers/{customer_id}",
        headers=auth(business_token),
        json={"stage": "inventado"},
    )
    assert res.status_code == 422


def test_un_negocio_nunca_ve_los_clientes_de_otro(client, seed, worker_headers, business_token, db_session):
    from app.security import hash_password

    business2 = models.Business(agency_id=seed["agency"].id, name="Negocio 2")
    db_session.add(business2)
    db_session.flush()
    db_session.add(models.BusinessUser(
        business_id=business2.id, name="Dueño 2", email="negocio2-crm2@test-demo.com",
        password_hash=hash_password("otra_pass_123"),
    ))
    db_session.commit()

    _report_call(client, worker_headers, business2.id, "+17865559999")

    res = client.get("/business/customers", headers=auth(business_token))
    assert res.status_code == 200
    assert res.json() == []


def test_cliente_inexistente_da_404(client, seed, business_token):
    res = client.get("/business/customers/999999", headers=auth(business_token))
    assert res.status_code == 404


# --- Endpoints de agencia ---

def test_agencia_ve_los_clientes_de_su_negocio(client, seed, worker_headers, agency_token):
    _report_call(client, worker_headers, seed["business"].id, "+17865551234")
    res = client.get(f"/agency/businesses/{seed['business'].id}/customers", headers=auth(agency_token))
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_agencia_edita_un_cliente_de_su_negocio(client, seed, worker_headers, agency_token):
    _report_call(client, worker_headers, seed["business"].id, "+17865551234")
    customer_id = client.get(f"/agency/businesses/{seed['business'].id}/customers", headers=auth(agency_token)).json()[0]["id"]

    res = client.patch(
        f"/agency/businesses/{seed['business'].id}/customers/{customer_id}",
        headers=auth(agency_token),
        json={"stage": "customer", "tags": "vip, mayorista"},
    )
    assert res.status_code == 200
    assert res.json()["stage"] == "customer"
    assert res.json()["tags"] == "vip, mayorista"


def test_agencia_no_puede_ver_clientes_de_un_negocio_ajeno(client, seed, worker_headers, agency_token, db_session):
    otra_agencia = models.Agency(name="Otra Agencia CRM")
    db_session.add(otra_agencia)
    db_session.flush()
    negocio_ajeno = models.Business(agency_id=otra_agencia.id, name="Negocio Ajeno CRM")
    db_session.add(negocio_ajeno)
    db_session.commit()

    _report_call(client, worker_headers, negocio_ajeno.id, "+17865559999")

    res = client.get(f"/agency/businesses/{negocio_ajeno.id}/customers", headers=auth(agency_token))
    assert res.status_code == 404
