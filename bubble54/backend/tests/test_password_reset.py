"""Recuperación de contraseña por correo (2026-09-21) -- send_email real
nunca se llama en estos tests, se mockea (mismo patrón que test_telephony.py
mockea httpx.Client en vez de pegarle a Twilio real)."""
import datetime
import hashlib
from unittest.mock import patch

import pytest

from app import models
from app.config import settings
from app.security import verify_password


@pytest.fixture(autouse=True)
def smtp_configurado(monkeypatch):
    monkeypatch.setattr(settings, "smtp_user", "bot@bubble54.test")
    monkeypatch.setattr(settings, "smtp_app_password", "app-password-test")


def test_forgot_sin_smtp_configurado_da_503(client, seed, monkeypatch):
    monkeypatch.setattr(settings, "smtp_user", "")
    res = client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    assert res.status_code == 503


def test_forgot_con_email_inexistente_responde_igual_y_no_manda_nada(client, seed):
    """Nunca debe revelar si una cuenta existe -- mismo 200 genérico, pero
    sin disparar ningún correo real."""
    with patch("app.routers.auth.send_email") as mock_send:
        res = client.post("/auth/agency/password/forgot", json={"email": "no-existe@test-demo.com"})
    assert res.status_code == 200
    assert res.json()["ok"] is True
    mock_send.assert_not_called()


def test_forgot_con_email_real_manda_un_correo_y_crea_el_token(client, seed, db_session):
    with patch("app.routers.auth.send_email") as mock_send:
        res = client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    assert res.status_code == 200
    mock_send.assert_called_once()
    to, subject, html = mock_send.call_args[0]
    assert to == "agencia@test-demo.com"
    assert "token=" in html

    tokens = db_session.query(models.PasswordResetToken).all()
    assert len(tokens) == 1
    assert tokens[0].role == "agency"
    assert tokens[0].used_at is None


def _extraer_token_del_link(html: str) -> str:
    return html.split("token=", 1)[1].split('"', 1)[0]


def test_reset_con_token_real_cambia_la_contrasena(client, seed):
    with patch("app.routers.auth.send_email") as mock_send:
        client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    token = _extraer_token_del_link(mock_send.call_args[0][2])

    res = client.post("/auth/agency/password/reset", json={"token": token, "new_password": "contrasena-nueva-123"})
    assert res.status_code == 200

    # La vieja ya no sirve, la nueva sí.
    viejo = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "agencia_pass_123"})
    assert viejo.status_code == 401
    nuevo = client.post("/auth/agency/login", json={"email": "agencia@test-demo.com", "password": "contrasena-nueva-123"})
    assert nuevo.status_code == 200


def test_reset_con_token_ya_usado_falla(client, seed):
    with patch("app.routers.auth.send_email") as mock_send:
        client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    token = _extraer_token_del_link(mock_send.call_args[0][2])

    client.post("/auth/agency/password/reset", json={"token": token, "new_password": "primera-pasada-123"})
    res = client.post("/auth/agency/password/reset", json={"token": token, "new_password": "segunda-pasada-123"})
    assert res.status_code == 422


def test_reset_con_token_vencido_falla(client, seed, db_session):
    with patch("app.routers.auth.send_email") as mock_send:
        client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    token = _extraer_token_del_link(mock_send.call_args[0][2])

    entry = db_session.query(models.PasswordResetToken).first()
    entry.expires_at = datetime.datetime.utcnow() - datetime.timedelta(minutes=1)
    db_session.commit()

    res = client.post("/auth/agency/password/reset", json={"token": token, "new_password": "otra-nueva-123456"})
    assert res.status_code == 422


def test_reset_con_token_inventado_falla(client, seed):
    res = client.post(
        "/auth/agency/password/reset",
        json={"token": "esto-no-existe-nunca-fue-real", "new_password": "cualquier-cosa-123"},
    )
    assert res.status_code == 422


def test_reset_de_agencia_no_sirve_para_resetear_un_negocio(client, seed):
    """Un token real de agencia no debe poder colarse por el endpoint de
    negocio, aunque el hash coincida -- el `role` guardado en el token debe
    respetarse."""
    with patch("app.routers.auth.send_email") as mock_send:
        client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    token = _extraer_token_del_link(mock_send.call_args[0][2])

    res = client.post("/auth/business/password/reset", json={"token": token, "new_password": "no-deberia-123"})
    assert res.status_code == 422


def test_reset_contrasena_corta_es_rechazada(client, seed):
    with patch("app.routers.auth.send_email") as mock_send:
        client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    token = _extraer_token_del_link(mock_send.call_args[0][2])

    res = client.post("/auth/agency/password/reset", json={"token": token, "new_password": "corta"})
    assert res.status_code == 422


def test_token_se_guarda_hasheado_no_en_texto_plano(client, seed, db_session):
    with patch("app.routers.auth.send_email") as mock_send:
        client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    token_real = _extraer_token_del_link(mock_send.call_args[0][2])

    entry = db_session.query(models.PasswordResetToken).first()
    assert entry.token_hash != token_real
    assert entry.token_hash == hashlib.sha256(token_real.encode("utf-8")).hexdigest()


def test_forgot_repetido_se_bloquea_como_los_logins(client, seed):
    with patch("app.routers.auth.send_email"):
        for _ in range(5):
            client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
        res = client.post("/auth/agency/password/forgot", json={"email": "agencia@test-demo.com"})
    assert res.status_code == 429
