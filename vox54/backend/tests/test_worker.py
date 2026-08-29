from app.config import settings


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
