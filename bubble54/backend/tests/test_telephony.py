"""telephony.provision_phone_number() -- probado con httpx.Client mockeado
(mismo patrón que test_agent.py del worker para AsyncClient), nunca contra
la API real de Twilio. Sin credenciales configuradas, la funcion no debe
intentar ninguna llamada de red -- eso se verifica explicitamente."""
from unittest.mock import MagicMock, patch

import pytest

from app import models, telephony
from app.config import settings


@pytest.fixture(autouse=True)
def sin_credenciales_por_default(monkeypatch):
    monkeypatch.setattr(settings, "twilio_account_sid", "")
    monkeypatch.setattr(settings, "twilio_auth_token", "")


def _con_credenciales(monkeypatch):
    monkeypatch.setattr(settings, "twilio_account_sid", "ACtest")
    monkeypatch.setattr(settings, "twilio_auth_token", "tokentest")


def test_sin_credenciales_no_intenta_ninguna_llamada_de_red(db_session):
    with patch("app.telephony.httpx.Client") as mock_client_cls:
        with pytest.raises(telephony.TelephonyProvisionError, match="Twilio"):
            telephony.provision_phone_number(db_session)
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


def test_compra_un_numero_real_cuando_hay_disponibles(monkeypatch, db_session):
    _con_credenciales(monkeypatch)
    # Ningún número reusable -- así el camino real de compra es el que se ejercita.
    monkeypatch.setattr(telephony, "find_reusable_number", lambda db: None)

    search_resp = MagicMock(status_code=200)
    search_resp.json.return_value = {"available_phone_numbers": [{"phone_number": "+13055550111"}]}
    purchase_resp = MagicMock(status_code=201)
    purchase_resp.json.return_value = {"phone_number": "+13055550111"}

    search_client = _fake_client(get_response=search_resp)
    purchase_client = _fake_client(post_response=purchase_resp)

    with patch("app.telephony.httpx.Client", side_effect=[search_client, purchase_client]):
        number = telephony.provision_phone_number(db_session)

    assert number == "+13055550111"


def test_sin_numeros_disponibles_tira_error_real(monkeypatch, db_session):
    _con_credenciales(monkeypatch)
    monkeypatch.setattr(telephony, "find_reusable_number", lambda db: None)

    search_resp = MagicMock(status_code=200)
    search_resp.json.return_value = {"available_phone_numbers": []}
    search_client = _fake_client(get_response=search_resp)

    with patch("app.telephony.httpx.Client", return_value=search_client):
        with pytest.raises(telephony.TelephonyProvisionError, match="disponibles"):
            telephony.provision_phone_number(db_session)


def test_busqueda_con_error_de_twilio_tira_error_real(monkeypatch, db_session):
    _con_credenciales(monkeypatch)
    monkeypatch.setattr(telephony, "find_reusable_number", lambda db: None)

    search_resp = MagicMock(status_code=401)
    search_client = _fake_client(get_response=search_resp)

    with patch("app.telephony.httpx.Client", return_value=search_client):
        with pytest.raises(telephony.TelephonyProvisionError, match="401"):
            telephony.provision_phone_number(db_session)


def test_compra_fallida_tira_error_real_sin_devolver_numero(monkeypatch, db_session):
    _con_credenciales(monkeypatch)
    monkeypatch.setattr(telephony, "find_reusable_number", lambda db: None)

    search_resp = MagicMock(status_code=200)
    search_resp.json.return_value = {"available_phone_numbers": [{"phone_number": "+13055550111"}]}
    purchase_resp = MagicMock(status_code=500)

    search_client = _fake_client(get_response=search_resp)
    purchase_client = _fake_client(post_response=purchase_resp)

    with patch("app.telephony.httpx.Client", side_effect=[search_client, purchase_client]):
        with pytest.raises(telephony.TelephonyProvisionError, match="500"):
            telephony.provision_phone_number(db_session)


# --- find_reusable_number / reuso real antes de comprar -- pedido real de
# la usuaria (2026-09-19): un número que compramos y un cliente ya no usa
# sigue siendo nuestro, no de él -- hay que poder dárselo al próximo antes
# de gastar en uno nuevo. ---

def _crear_negocio_con_numero(db_session, phone_number):
    agency = models.Agency(name="Agencia Reuso")
    db_session.add(agency)
    db_session.flush()
    business = models.Business(agency_id=agency.id, name="Negocio Reuso")
    db_session.add(business)
    db_session.flush()
    db_session.add(models.BotConfig(business_id=business.id, phone_number=phone_number))
    db_session.commit()


def test_encuentra_un_numero_propio_libre_y_no_compra_nada(monkeypatch, db_session):
    _con_credenciales(monkeypatch)
    _crear_negocio_con_numero(db_session, "+13055550111")  # asignado, no cuenta

    owned_resp = MagicMock(status_code=200)
    owned_resp.json.return_value = {"incoming_phone_numbers": [
        {"phone_number": "+13055550111"},  # asignado -- no reusable
        {"phone_number": "+13055550222"},  # libre -- este es el que debería volver
    ]}
    owned_client = _fake_client(get_response=owned_resp)

    with patch("app.telephony.httpx.Client", return_value=owned_client) as mock_client_cls:
        number = telephony.provision_phone_number(db_session)

    assert number == "+13055550222"
    # Un solo GET (la lista de números propios) -- nunca llegó a buscar
    # disponibles para comprar ni a intentar ninguna compra.
    assert mock_client_cls.call_count == 1
    owned_client.post.assert_not_called()


def test_sin_numeros_libres_cae_al_camino_de_comprar(monkeypatch, db_session):
    _con_credenciales(monkeypatch)
    _crear_negocio_con_numero(db_session, "+13055550111")

    owned_resp = MagicMock(status_code=200)
    owned_resp.json.return_value = {"incoming_phone_numbers": [{"phone_number": "+13055550111"}]}
    search_resp = MagicMock(status_code=200)
    search_resp.json.return_value = {"available_phone_numbers": [{"phone_number": "+13055550999"}]}
    purchase_resp = MagicMock(status_code=201)
    purchase_resp.json.return_value = {"phone_number": "+13055550999"}

    owned_client = _fake_client(get_response=owned_resp)
    search_client = _fake_client(get_response=search_resp)
    purchase_client = _fake_client(post_response=purchase_resp)

    with patch("app.telephony.httpx.Client", side_effect=[owned_client, search_client, purchase_client]):
        number = telephony.provision_phone_number(db_session)

    assert number == "+13055550999"


def test_find_reusable_number_sin_credenciales_devuelve_none_sin_llamar_a_twilio(db_session):
    with patch("app.telephony.httpx.Client") as mock_client_cls:
        assert telephony.find_reusable_number(db_session) is None
        mock_client_cls.assert_not_called()


def test_nunca_reusa_un_numero_reservado_de_otro_sistema(monkeypatch, db_session):
    """Incidente real del 2026-09-21: con un número reservado (Marco/VAPI) y
    uno genuinamente libre, ambos "no asignados" en bot_configs de Bubble54
    -- el número reservado nunca debe salir elegido, sin importar el orden
    de iteración real del set."""
    _con_credenciales(monkeypatch)
    monkeypatch.setattr(settings, "twilio_reserved_numbers", "+17867880417")

    owned_resp = MagicMock(status_code=200)
    owned_resp.json.return_value = {"incoming_phone_numbers": [
        {"phone_number": "+17867880417"},  # reservado -- nunca elegible
        {"phone_number": "+16506585078"},  # genuinamente libre
    ]}
    owned_client = _fake_client(get_response=owned_resp)

    with patch("app.telephony.httpx.Client", return_value=owned_client):
        number = telephony.provision_phone_number(db_session)

    assert number == "+16506585078"


def test_find_reusable_number_es_reproducible_entre_llamadas(monkeypatch, db_session):
    """Mismo escenario, sin ningún número reservado -- confirma que ya no
    depende de next(iter(set)) (no determinístico entre procesos): llamado
    varias veces seguidas, siempre devuelve lo mismo."""
    _con_credenciales(monkeypatch)
    monkeypatch.setattr(settings, "twilio_reserved_numbers", "")

    owned_resp = MagicMock(status_code=200)
    owned_resp.json.return_value = {"incoming_phone_numbers": [
        {"phone_number": "+16506585078"},
        {"phone_number": "+17867880417"},
    ]}
    owned_client = _fake_client(get_response=owned_resp)

    with patch("app.telephony.httpx.Client", return_value=owned_client):
        resultados = {telephony.find_reusable_number(db_session) for _ in range(20)}

    assert len(resultados) == 1
