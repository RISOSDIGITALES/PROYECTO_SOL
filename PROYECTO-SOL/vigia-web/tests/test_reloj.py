"""Pruebas del reloj interno con un reloj simulado: avanza de a 30 s, como el bucle real, y cuenta qué corre."""
import datetime as dt
from zoneinfo import ZoneInfo

from vigia.core import Config
from vigia.server import dias_completa, que_toca

MIAMI = ZoneInfo("America/New_York")


def simular(cfg, desde, horas, paso_s=30):
    """Recorre el tiempo como el reloj real y devuelve [(hora local, modo)] de cada ronda disparada."""
    estado, corridas = {}, []
    t = desde.astimezone(dt.timezone.utc)
    fin = t + dt.timedelta(hours=horas)
    while t < fin:
        ahora = t.astimezone(MIAMI)
        modo = que_toca(ahora, cfg, estado)
        if modo:
            corridas.append((ahora, modo))
        t += dt.timedelta(seconds=paso_s)
    return corridas


def cfg(**kw):
    base = dict(zona="America/New_York", hora_completa="06:05", minuto_rapida=17, dias_completa="todos", cada_rapida=1)
    base.update(kw)
    return Config(**base)


LUNES = dt.datetime(2026, 11, 30, 0, 0, tzinfo=MIAMI)  # lunes


def test_por_defecto_completa_diaria_y_rapida_cada_hora():
    c = simular(cfg(), LUNES, 24 * 7)
    completas = [a for a, m in c if m == "completo"]
    rapidas = [a for a, m in c if m == "rapido"]
    assert len(completas) == 7
    assert all((a.hour, a.minute) == (6, 5) for a in completas)
    # 23 rápidas por día: la hora 6 la cubre la completa
    assert len(rapidas) == 23 * 7
    assert all(a.minute == 17 for a in rapidas)


def test_completa_solo_los_lunes():
    c = simular(cfg(dias_completa="lun"), LUNES, 24 * 14)
    completas = [a for a, m in c if m == "completo"]
    assert [a.date().isoformat() for a in completas] == ["2026-11-30", "2026-12-07"]
    assert all(a.weekday() == 0 for a in completas)
    # los demás días la hora 6 sí tiene rápida
    rapidas_6 = [a for a, m in c if m == "rapido" and a.hour == 6]
    assert len(rapidas_6) == 12


def test_varios_dias_y_nombres_en_ingles():
    assert dias_completa("lun,jue") == {0, 3}
    assert dias_completa("Mon, Thu") == {0, 3}
    assert dias_completa("miércoles") == {2}
    assert dias_completa("todos") == set(range(7))
    assert dias_completa("") == set(range(7))
    assert dias_completa("xyz") == set(range(7))  # nada válido: todos, nunca "ninguno"


def test_rapida_cada_6_horas_y_apagada():
    c = simular(cfg(cada_rapida=6), LUNES, 24)
    assert sorted(a.hour for a, m in c if m == "rapido") == [0, 12, 18]  # la de las 6 la hace la completa
    c = simular(cfg(cada_rapida=0), LUNES, 48)
    assert all(m == "completo" for _, m in c) and len(c) == 2


def test_no_repite_en_la_misma_hora_ni_al_volver_a_mirar():
    estado = {}
    t = dt.datetime(2026, 11, 30, 10, 17, tzinfo=MIAMI)
    assert que_toca(t, cfg(), estado) == "rapido"
    for s in range(30, 60 * 40, 30):  # el resto de la hora
        assert que_toca(t + dt.timedelta(seconds=s), cfg(), estado) is None


def test_cambio_de_hora_de_noviembre_no_duplica():
    # 1-nov-2026: a las 2:00 vuelve a la 1:00 (la 1 se repite)
    domingo = dt.datetime(2026, 11, 1, 0, 0, tzinfo=MIAMI)
    c = simular(cfg(), domingo, 25)  # 25 h reales = un día local completo
    rapidas_1 = [a for a, m in c if m == "rapido" and a.hour == 1]
    assert len(rapidas_1) == 1
    assert len([1 for _, m in c if m == "completo"]) == 1


def test_cambio_de_hora_de_marzo_sigue_andando():
    # 8-mar-2026: a las 2:00 salta a las 3:00 (la hora 2 no existe)
    domingo = dt.datetime(2026, 3, 8, 0, 0, tzinfo=MIAMI)
    c = simular(cfg(), domingo, 23)
    horas = sorted(a.hour for a, m in c if m == "rapido")
    assert 2 not in horas and 3 in horas and len([1 for _, m in c if m == "completo"]) == 1


def test_completa_tardia_si_el_reloj_arranca_despues_de_la_hora():
    # el servicio arranca a las 6:40: la completa de ese día corre igual (dentro de la hora 6)
    c = simular(cfg(), dt.datetime(2026, 11, 30, 6, 40, tzinfo=MIAMI), 1)
    assert c and c[0][1] == "completo"
