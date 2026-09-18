"""telephony.provision_phone_number() -- probado con httpx.Client mockeado
(mismo patrón que test_agent.py del worker para AsyncClient), nunca contra
la API real de Twilio. Sin credenciales configuradas, la funcion no debe
intentar ninguna llamada de red -- eso se verifica explicitamente."""
from unittest.mock import MagicMock, patch

import pytest

from app import telephony
from app.config import settings


@pytest.fixture(autouse=True)
def sin_credenciales_por_default(monkeypatch):
    monkeypatch.setattr(settings, "twilio_account_sid", "")
    monkeypatch.setattr(settings, "twilio_auth_token", "")


def test_sin_credenciales_no_intenta_ninguna_llamada_de_red():
    with patch("app.telephony.httpx.Client") as mock_client_cls:
        with pytest.raises(telephony.TelephonyProvisionError, match="Twilio"):
            telephony.provision_phone_number()
        mock_client_cls.assert_not_called()


def _fake_client(get_response=None, post_response=None):
    client = MagicMock()
    client.__enter__.return_value = client
    client.__exit__.return_value = False
    if get_response is not None:
        client.get.return_value = get_response
    if post_response is not None:
        client.post.return_value = post_response
    return client


def test_compra_un_numero_real_cuando_hay_disponibles(monkeypatch):
    monkeypatch.setattr(settings, "twilio_account_sid", "ACtest")
    monkeypatch.setattr(settings, "twilio_auth_token", "tokentest")

    search_resp = MagicMock(status_code=200)
    search_resp.json.return_value = {"available_phone_numbers": [{"phone_number": "+13055550111"}]}
    purchase_resp = MagicMock(status_code=201)
    purchase_resp.json.return_value = {"phone_number": "+13055550111"}

    search_client = _fake_client(get_response=search_resp)
    purchase_client = _fake_client(post_response=purchase_resp)

    with patch("app.telephony.httpx.Client", side_effect=[search_client, purchase_client]):
        number = telephony.provision_phone_number()

    assert number == "+13055550111"


def test_sin_numeros_disponibles_tira_error_real(monkeypatch):
    monkeypatch.setattr(settings, "twilio_account_sid", "ACtest")
    monkeypatch.setattr(settings, "twilio_auth_token", "tokentest")

    search_resp = MagicMock(status_code=200)
    search_resp.json.return_value = {"available_phone_numbers": []}
    search_client = _fake_client(get_response=search_resp)

    with patch("app.telephony.httpx.Client", return_value=search_client):
        with pytest.raises(telephony.TelephonyProvisionError, match="disponibles"):
            telephony.provision_phone_number()


def test_busqueda_con_error_de_twilio_tira_error_real(monkeypatch):
    monkeypatch.setattr(settings, "twilio_account_sid", "ACtest")
    monkeypatch.setattr(settings, "twilio_auth_token", "tokentest")

    search_resp = MagicMock(status_code=401)
    search_client = _fake_client(get_response=search_resp)

    with patch("app.telephony.httpx.Client", return_value=search_client):
        with pytest.raises(telephony.TelephonyProvisionError, match="401"):
            telephony.provision_phone_number()


def test_compra_fallida_tira_error_real_sin_devolver_numero(monkeypatch):
    monkeypatch.setattr(settings, "twilio_account_sid", "ACtest")
    monkeypatch.setattr(settings, "twilio_auth_token", "tokentest")

    search_resp = MagicMock(status_code=200)
    search_resp.json.return_value = {"available_phone_numbers": [{"phone_number": "+13055550111"}]}
    purchase_resp = MagicMock(status_code=500)

    search_client = _fake_client(get_response=search_resp)
    purchase_client = _fake_client(post_response=purchase_resp)

    with patch("app.telephony.httpx.Client", side_effect=[search_client, purchase_client]):
        with pytest.raises(telephony.TelephonyProvisionError, match="500"):
            telephony.provision_phone_number()
