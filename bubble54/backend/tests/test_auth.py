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


# --- Rate limiting real contra fuerza bruta -- auditoría del 2026-09-21:
# ninguno de los dos logins tenía ningún freno. ---

def test_login_se_bloquea_tras_varios_intentos_fallidos(client, seed):
    for _ in range(5):
        res = client.post(
            "/auth/agency/login",
            json={"email": "agencia@test-demo.com", "password": "incorrecta"},
        )
        assert res.status_code == 401

    # El 6to intento, aunque la contraseña sea la correcta, ya no se procesa.
    res = client.post(
        "/auth/agency/login",
        json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"},
    )
    assert res.status_code == 429


def test_login_correcto_no_cuenta_como_intento_fallido(client, seed):
    """4 fallos (no 5) no deberían bloquear nada -- confirma que el umbral
    real es 5, no un número más chico por error de un solo dígito."""
    for _ in range(4):
        client.post(
            "/auth/agency/login",
            json={"email": "agencia@test-demo.com", "password": "incorrecta"},
        )
    res = client.post(
        "/auth/agency/login",
        json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"},
    )
    assert res.status_code == 200


def test_login_exitoso_resetea_el_contador(client, seed):
    """Sin esto, una persona real que se equivoca 3 veces y después entra
    bien quedaría con "3 fallos" pegados esperando a que expire la ventana
    -- un login bueno debe limpiar la cuenta, no solo dejarla pasar."""
    for _ in range(4):
        client.post(
            "/auth/agency/login",
            json={"email": "agencia@test-demo.com", "password": "incorrecta"},
        )
    ok = client.post(
        "/auth/agency/login",
        json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"},
    )
    assert ok.status_code == 200

    for _ in range(4):
        res = client.post(
            "/auth/agency/login",
            json={"email": "agencia@test-demo.com", "password": "incorrecta"},
        )
        assert res.status_code == 401  # nunca 429 -- el contador arrancó de cero


def test_bloqueo_es_por_cuenta_no_global(client, seed):
    """Bloquear la cuenta de agencia no debe afectar a otra cuenta real
    (agencia o negocio) que nunca falló nada."""
    for _ in range(5):
        client.post(
            "/auth/agency/login",
            json={"email": "agencia@test-demo.com", "password": "incorrecta"},
        )
    res = client.post(
        "/auth/business/login",
        json={"email": "negocio@test-demo.com", "password": "negocio_pass_123"},
    )
    assert res.status_code == 200
