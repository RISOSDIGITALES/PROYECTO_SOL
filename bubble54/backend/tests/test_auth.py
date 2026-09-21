def test_agency_login_ok(client, seed):
    res = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"})
    assert res.status_code == 200
    body = res.json()
    assert body["role"] == "agency"
    assert body["access_token"]


def test_agency_login_password_incorrecta(client, seed):
    res = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "otra-cosa"})
    assert res.status_code == 401


def test_agency_login_email_inexistente(client, seed):
    res = client.post("/auth/agency/login", json={"email": "no-existe@test-demo.com", "password": "x"})
    assert res.status_code == 401


def test_business_login_ok(client, seed):
    res = client.post("/auth/business/login", json={"email": "negocio@test-demo.com", "password": "negocio_pass_123"})
    assert res.status_code == 200
    assert res.json()["role"] == "business"


def test_un_token_de_negocio_no_sirve_para_endpoints_de_agencia(client, seed):
    """El rol viaja adentro del JWT — un token de negocio real no debe
    poder usarse contra un endpoint de agencia, ni al revés."""
    login = client.post("/auth/business/login", json={"email": "negocio@test-demo.com", "password": "negocio_pass_123"})
    token = login.json()["access_token"]
    res = client.get("/agency/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_sin_token_da_401(client, seed):
    assert client.get("/agency/me").status_code == 401
    assert client.get("/business/me").status_code == 401
