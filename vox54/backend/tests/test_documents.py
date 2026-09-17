"""Pruebas de la pieza que le faltaba a la subida de documentos: extraer el
texto real del PDF, cortarlo en fragmentos, y poder buscar en ellos por
significado real (no por coincidencia exacta de palabras).

La mayoría de los tests reemplazan `embed_texts` por una versión falsa y
determinística (`fake_embed`, más abajo) — rápida y sin depender de
internet ni del modelo real. Un puñado de tests (marcados explícitamente)
usan el modelo real de verdad, para confirmar que la búsqueda semántica
funciona de verdad y no solo que la plomería de datos está bien armada."""
import json

import numpy as np
import pytest

from app import documents
from app.config import settings


def make_minimal_pdf(lines: list[str]) -> bytes:
    """PDF real y válido, hecho a mano (sin ninguna librería de autoría de
    PDF) — una sola página con las líneas de texto dadas, una por línea.
    Confirmado con pypdf real que extrae el texto exacto, no una
    aproximación. Mismo criterio ya usado en otras partes de este proyecto
    para probar código que procesa documentos reales sin depender de un
    selector de archivos del sistema operativo."""
    content_ops = "BT /F1 14 Tf 20 160 Td 16 TL\n"
    for i, line in enumerate(lines):
        esc = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        content_ops += (f"({esc}) Tj\n" if i == 0 else f"T* ({esc}) Tj\n")
    content_ops += "ET"
    content_bytes = content_ops.encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> "
        b"/MediaBox [0 0 400 200] /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        f"<< /Length {len(content_bytes)} >>\nstream\n".encode("latin-1") + content_bytes + b"\nendstream",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode("latin-1") + obj + b"\nendobj\n"
    xref_offset = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode("latin-1")
    out += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        out += f"{off:010d} 00000 n \n".encode("latin-1")
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode("latin-1")
    return bytes(out)


def fake_embed(texts: list[str]) -> list[list[float]]:
    """Embedding falso, determinístico y rápido — bag-of-words hasheado a un
    vector de 32 dimensiones. No entiende sinónimos (no es el modelo real),
    pero sí produce vectores más parecidos cuanto más palabras literales
    comparten dos textos — suficiente para probar que el guardado/borrado/
    ranking funcionan, sin pagar el costo de cargar el modelo real en cada
    test."""
    vectors = []
    for text in texts:
        vec = np.zeros(32)
        for word in text.lower().split():
            vec[hash(word) % 32] += 1.0
        vectors.append(vec.tolist())
    return vectors


@pytest.fixture()
def fake_embeddings(monkeypatch):
    monkeypatch.setattr(documents, "embed_texts", fake_embed)


def auth_worker():
    return {"X-Worker-Secret": settings.worker_secret}


# ---------------------------------------------------------------------------
# chunk_text — función pura, sin PDF ni modelo de por medio
# ---------------------------------------------------------------------------

def test_chunk_text_vacio_da_lista_vacia():
    assert documents.chunk_text("") == []
    assert documents.chunk_text("   ") == []


def test_chunk_text_corto_no_se_parte():
    text = "Esto es un texto corto que entra en un solo fragmento."
    assert documents.chunk_text(text, max_chars=200) == [text]


def test_chunk_text_largo_se_parte_en_varios():
    text = " ".join(["palabra"] * 300)  # bien por encima del límite
    chunks = documents.chunk_text(text, max_chars=100, overlap=20)
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 100


def test_chunk_text_no_pierde_contenido_relevante_por_el_overlap():
    """El final de un fragmento debe reaparecer al inicio del siguiente
    (por el overlap) — una idea que cae justo en el borde no debe perderse
    en ninguno de los dos fragmentos."""
    text = "Primera idea real y completa. " + ("relleno " * 40) + "Segunda idea real y distinta."
    chunks = documents.chunk_text(text, max_chars=120, overlap=30)
    assert any("Primera idea real" in c for c in chunks)
    assert any("Segunda idea real" in c for c in chunks)


def test_chunk_text_normaliza_espacios_y_saltos_de_linea():
    text = "Línea uno\n\ncon   espacios raros\n\tademás"
    chunks = documents.chunk_text(text)
    assert chunks == ["Línea uno con espacios raros además"]


# ---------------------------------------------------------------------------
# process_business_document + search_chunks — con embeddings falsos
# ---------------------------------------------------------------------------

def test_negocio_sin_documento_no_genera_ningun_fragmento(db_session, seed, fake_embeddings):
    n = documents.process_business_document(db_session, seed["business"])
    assert n == 0
    assert documents.search_chunks(db_session, seed["business"].id, "cualquier cosa") == []


def test_pdf_real_se_procesa_y_queda_buscable(db_session, seed, fake_embeddings, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    pdf_bytes = make_minimal_pdf(["El precio de instalacion es 500 dolares.", "Abrimos de lunes a viernes."])
    rel_path = "documents/business/negocio1.pdf"
    (tmp_path / rel_path).write_bytes(pdf_bytes)

    seed["business"].info_document_url = f"/uploads/{rel_path}"
    db_session.commit()

    n = documents.process_business_document(db_session, seed["business"])
    assert n == 1  # texto corto, todo el PDF entra en un solo fragmento (max_chars=800)

    results = documents.search_chunks(db_session, seed["business"].id, "precio instalacion")
    assert any("500 dolares" in r for r in results)


def test_reprocesar_borra_los_fragmentos_viejos_no_los_acumula(db_session, seed, fake_embeddings, tmp_path, monkeypatch):
    """Si un negocio sube un PDF nuevo reemplazando al anterior, los
    fragmentos del PDF viejo no deben seguir apareciendo en la búsqueda."""
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)

    old_pdf = make_minimal_pdf(["Contenido del documento viejo."])
    (tmp_path / "documents/business/v1.pdf").write_bytes(old_pdf)
    seed["business"].info_document_url = "/uploads/documents/business/v1.pdf"
    db_session.commit()
    documents.process_business_document(db_session, seed["business"])

    new_pdf = make_minimal_pdf(["Contenido del documento nuevo."])
    (tmp_path / "documents/business/v2.pdf").write_bytes(new_pdf)
    seed["business"].info_document_url = "/uploads/documents/business/v2.pdf"
    db_session.commit()
    n = documents.process_business_document(db_session, seed["business"])

    assert n == 1
    all_chunks = documents.search_chunks(db_session, seed["business"].id, "contenido", top_k=10)
    assert len(all_chunks) == 1
    assert "nuevo" in all_chunks[0]


def test_borrar_el_documento_deja_al_negocio_sin_fragmentos(db_session, seed, fake_embeddings, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    pdf_bytes = make_minimal_pdf(["Algo de contenido real."])
    (tmp_path / "documents/business/v1.pdf").write_bytes(pdf_bytes)
    seed["business"].info_document_url = "/uploads/documents/business/v1.pdf"
    db_session.commit()
    documents.process_business_document(db_session, seed["business"])

    seed["business"].info_document_url = ""
    db_session.commit()
    n = documents.process_business_document(db_session, seed["business"])

    assert n == 0
    assert documents.search_chunks(db_session, seed["business"].id, "contenido") == []


def test_pdf_corrupto_no_revienta_deja_cero_fragmentos(db_session, seed, fake_embeddings, tmp_path, monkeypatch):
    """Un archivo con extensión .pdf pero contenido no-PDF real (ej. el
    mismo caso que ya prueba test_business.py con bytes falsos) no debe
    tumbar el procesamiento — se queda sin fragmentos, sin excepción."""
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    (tmp_path / "documents/business/roto.pdf").write_bytes(b"%PDF-1.4 esto no es un pdf real")
    seed["business"].info_document_url = "/uploads/documents/business/roto.pdf"
    db_session.commit()

    n = documents.process_business_document(db_session, seed["business"])
    assert n == 0


def test_search_respeta_top_k(db_session, seed, fake_embeddings, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    # Cada línea, larga a propósito, para forzar varios fragmentos reales
    # bajo el límite real de chunk_text (800 caracteres) — con texto corto
    # todo entraría en un solo fragmento, sin nada que rankear.
    lines = [f"Fragmento numero {i} de contenido real, " + ("relleno " * 25) + "fin del fragmento." for i in range(5)]
    pdf_bytes = make_minimal_pdf(lines)
    (tmp_path / "documents/business/v1.pdf").write_bytes(pdf_bytes)
    seed["business"].info_document_url = "/uploads/documents/business/v1.pdf"
    db_session.commit()
    n = documents.process_business_document(db_session, seed["business"])
    assert n >= 2  # confirma que de verdad se partió en más de un fragmento

    results = documents.search_chunks(db_session, seed["business"].id, "fragmento contenido", top_k=2)
    assert len(results) == 2


# ---------------------------------------------------------------------------
# Endpoint real del worker
# ---------------------------------------------------------------------------

def test_endpoint_sin_secreto_da_401(client, seed):
    res = client.post("/worker/documents/search", json={"business_id": seed["business"].id, "query": "algo"})
    assert res.status_code == 401


def test_endpoint_devuelve_lista_vacia_sin_documento(client, seed, fake_embeddings):
    res = client.post(
        "/worker/documents/search",
        headers=auth_worker(),
        json={"business_id": seed["business"].id, "query": "algo"},
    )
    assert res.status_code == 200
    assert res.json() == {"chunks": []}


def test_endpoint_encuentra_el_fragmento_real(client, db_session, seed, fake_embeddings, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    pdf_bytes = make_minimal_pdf(["El horario de atencion es de 8 a 5."])
    (tmp_path / "documents/business/v1.pdf").write_bytes(pdf_bytes)
    seed["business"].info_document_url = "/uploads/documents/business/v1.pdf"
    db_session.commit()
    documents.process_business_document(db_session, seed["business"])

    res = client.post(
        "/worker/documents/search",
        headers=auth_worker(),
        json={"business_id": seed["business"].id, "query": "horario atencion"},
    )
    assert res.status_code == 200
    assert any("8 a 5" in c for c in res.json()["chunks"])


def test_endpoint_no_confunde_documentos_de_otro_negocio(client, db_session, seed, fake_embeddings, tmp_path, monkeypatch):
    """Mismo criterio de aislamiento por negocio que ya rige el resto de la
    plataforma — el documento de un negocio nunca debe filtrarse a otro."""
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    pdf_bytes = make_minimal_pdf(["Secreto exclusivo del negocio uno."])
    (tmp_path / "documents/business/v1.pdf").write_bytes(pdf_bytes)
    seed["business"].info_document_url = "/uploads/documents/business/v1.pdf"
    db_session.commit()
    documents.process_business_document(db_session, seed["business"])

    otro_negocio_id = seed["business"].id + 999
    res = client.post(
        "/worker/documents/search",
        headers=auth_worker(),
        json={"business_id": otro_negocio_id, "query": "secreto"},
    )
    assert res.json() == {"chunks": []}


# ---------------------------------------------------------------------------
# Modelo real — sin mockear embed_texts. Más lento (carga el modelo real,
# cacheado localmente tras la primera vez), pero es la única forma genuina
# de confirmar que la búsqueda entiende significado real y no solo
# coincidencia de palabras.
# ---------------------------------------------------------------------------

def test_busqueda_semantica_real_encuentra_por_significado_no_por_palabra_exacta(db_session, seed, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    pdf_bytes = make_minimal_pdf([
        "El costo de la instalacion completa es de quinientos dolares.",
        "Nuestro local abre todos los dias de ocho de la manana a cinco de la tarde.",
    ])
    (tmp_path / "documents/business/v1.pdf").write_bytes(pdf_bytes)
    seed["business"].info_document_url = "/uploads/documents/business/v1.pdf"
    db_session.commit()
    documents.process_business_document(db_session, seed["business"])

    # "cuanto cuesta" no comparte ninguna palabra literal con "costo... es
    # de quinientos dolares" — si esto encuentra el fragmento correcto,
    # es porque el modelo real entendió el significado, no porque hizo
    # coincidencia de texto.
    results = documents.search_chunks(db_session, seed["business"].id, "cuanto cuesta", top_k=1)
    assert len(results) == 1
    assert "quinientos dolares" in results[0]


# ---------------------------------------------------------------------------
# generate_document_insights — resumen + sugerencias de servicios via Groq
# (directo o vía el relay de n8n, ver el docstring de la función). Nunca
# llama a la red real: cada test fija explícitamente groq_api_key y
# groq_relay_url (aunque el .env real de desarrollo ya tenga valores reales
# cargados desde el 17-sep) y mockea httpx.post cuando corresponde, para que
# el resultado nunca dependa de lo que haya en el .env de esta máquina.
# ---------------------------------------------------------------------------

def test_insights_sin_key_ni_relay_configurados_devuelve_vacio(monkeypatch):
    monkeypatch.setattr(settings, "groq_api_key", "")
    monkeypatch.setattr(settings, "groq_relay_url", "")
    result = documents.generate_document_insights("Texto real del documento.", "")
    assert result == {"summary": "", "suggested_services": []}


def test_insights_con_texto_vacio_no_llama_a_groq(monkeypatch):
    monkeypatch.setattr(settings, "groq_api_key", "fake-key-de-prueba")
    monkeypatch.setattr(settings, "groq_relay_url", "")

    def fail_if_called(*args, **kwargs):
        raise AssertionError("no debería llamar a Groq con texto vacío")

    monkeypatch.setattr(documents.httpx, "post", fail_if_called)
    result = documents.generate_document_insights("   ", "")
    assert result == {"summary": "", "suggested_services": []}


class _FakeGroqResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return {"choices": [{"message": {"content": json.dumps(self._payload)}}]}


def test_insights_con_key_directa_parsea_la_respuesta_de_groq(monkeypatch):
    monkeypatch.setattr(settings, "groq_api_key", "fake-key-de-prueba")
    monkeypatch.setattr(settings, "groq_relay_url", "")
    fake_payload = {
        "summary": "El documento explica precios y horarios de atención.",
        "suggested_services": ["Instalación express", "Mantenimiento anual"],
    }

    captured = {}

    def fake_post(url, headers=None, **kwargs):
        captured["url"] = url
        captured["headers"] = headers
        return _FakeGroqResponse(fake_payload)

    monkeypatch.setattr(documents.httpx, "post", fake_post)

    result = documents.generate_document_insights("El precio es 500 y abrimos 8 a 5.", "Instalación estándar")
    assert result["summary"] == fake_payload["summary"]
    assert result["suggested_services"] == fake_payload["suggested_services"]
    # confirma que sin relay configurado, sí llama a Groq directo con el
    # header de Authorization -- no al revés (el relay usa otro header).
    assert captured["url"] == documents.GROQ_CHAT_URL
    assert "Authorization" in captured["headers"]


def test_insights_con_relay_configurado_lo_usa_en_vez_del_directo(monkeypatch):
    """Confirma que, cuando hay una URL de relay real (el caso real de hoy
    en producción, ya que Groq bloquea la llamada directa desde esta red),
    la llamada va al relay con el secreto correcto -- incluso si también
    hay una groq_api_key configurada, el relay tiene prioridad."""
    monkeypatch.setattr(settings, "groq_api_key", "una-key-que-no-deberia-usarse")
    monkeypatch.setattr(settings, "groq_relay_url", "https://n8n.ejemplo.test/webhook/vox54-groq-proxy")
    monkeypatch.setattr(settings, "groq_relay_secret", "secreto-de-prueba")
    fake_payload = {"summary": "Resumen vía relay.", "suggested_services": ["Servicio X"]}

    captured = {}

    def fake_post(url, headers=None, **kwargs):
        captured["url"] = url
        captured["headers"] = headers
        return _FakeGroqResponse(fake_payload)

    monkeypatch.setattr(documents.httpx, "post", fake_post)

    result = documents.generate_document_insights("Texto real del documento.", "")
    assert result["summary"] == "Resumen vía relay."
    assert captured["url"] == "https://n8n.ejemplo.test/webhook/vox54-groq-proxy"
    assert captured["headers"] == {"X-Relay-Secret": "secreto-de-prueba"}
    assert "Authorization" not in captured["headers"]


def test_insights_ante_falla_de_red_devuelve_vacio_sin_reventar(monkeypatch):
    monkeypatch.setattr(settings, "groq_api_key", "fake-key-de-prueba")
    monkeypatch.setattr(settings, "groq_relay_url", "")

    def raise_network_error(*args, **kwargs):
        raise ConnectionError("simulado — sin internet")

    monkeypatch.setattr(documents.httpx, "post", raise_network_error)
    result = documents.generate_document_insights("Texto real.", "")
    assert result == {"summary": "", "suggested_services": []}


def test_insights_ante_json_mal_formado_devuelve_vacio_sin_reventar(monkeypatch):
    monkeypatch.setattr(settings, "groq_api_key", "fake-key-de-prueba")
    monkeypatch.setattr(settings, "groq_relay_url", "")

    class BadResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"choices": [{"message": {"content": "esto no es json real"}}]}

    monkeypatch.setattr(documents.httpx, "post", lambda *a, **k: BadResponse())
    result = documents.generate_document_insights("Texto real.", "")
    assert result == {"summary": "", "suggested_services": []}


@pytest.fixture()
def fake_insights(monkeypatch):
    """Mismo espíritu que `fake_embeddings` — reemplaza la llamada real a
    Groq por un resultado fijo y determinístico, para probar que
    process_business_document guarda lo que generate_document_insights le
    devuelve, sin depender de red."""
    monkeypatch.setattr(
        documents,
        "generate_document_insights",
        lambda text, existing: {
            "summary": "Resumen de prueba generado a partir del documento real.",
            "suggested_services": ["Servicio detectado en el PDF"],
        },
    )


def test_procesar_documento_guarda_resumen_y_sugerencias_reales(db_session, seed, fake_embeddings, fake_insights, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    pdf_bytes = make_minimal_pdf(["Contenido real del documento subido."])
    (tmp_path / "documents/business/v1.pdf").write_bytes(pdf_bytes)
    seed["business"].info_document_url = "/uploads/documents/business/v1.pdf"
    db_session.commit()

    documents.process_business_document(db_session, seed["business"])

    assert seed["business"].doc_summary == "Resumen de prueba generado a partir del documento real."
    assert seed["business"].doc_suggested_services == ["Servicio detectado en el PDF"]


def test_borrar_documento_limpia_resumen_y_sugerencias_viejas(db_session, seed, fake_embeddings, fake_insights, tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    pdf_bytes = make_minimal_pdf(["Contenido real."])
    (tmp_path / "documents/business/v1.pdf").write_bytes(pdf_bytes)
    seed["business"].info_document_url = "/uploads/documents/business/v1.pdf"
    db_session.commit()
    documents.process_business_document(db_session, seed["business"])
    assert seed["business"].doc_summary  # confirma que sí quedó algo, antes de borrarlo

    seed["business"].info_document_url = ""
    db_session.commit()
    documents.process_business_document(db_session, seed["business"])

    assert seed["business"].doc_summary == ""
    assert seed["business"].doc_suggested_services == []


def test_pdf_sin_texto_no_llama_a_groq_ni_genera_resumen(db_session, seed, fake_embeddings, tmp_path, monkeypatch):
    """Sin ningún chunk real (PDF corrupto), nunca debe llamarse a Groq —
    no hay ningún texto real que resumir."""
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path))
    (tmp_path / "documents" / "business").mkdir(parents=True)
    (tmp_path / "documents/business/roto.pdf").write_bytes(b"%PDF-1.4 no es un pdf real")
    seed["business"].info_document_url = "/uploads/documents/business/roto.pdf"
    db_session.commit()

    def fail_if_called(text, existing):
        raise AssertionError("no debería generar insights sin ningún chunk real")

    monkeypatch.setattr(documents, "generate_document_insights", fail_if_called)
    documents.process_business_document(db_session, seed["business"])
    assert seed["business"].doc_summary == ""


# ---------------------------------------------------------------------------
# accept_suggested_service / dismiss_suggested_service — nunca se aplican
# solas, solo cuando el negocio/agencia confirma con un clic explícito.
# ---------------------------------------------------------------------------

def test_aceptar_sugerencia_la_agrega_a_products_services_y_la_saca_de_la_lista(db_session, seed):
    business = seed["business"]
    business.products_services = "Servicio original"
    business.doc_suggested_services_json = json.dumps(["Servicio A", "Servicio B"])
    db_session.commit()

    documents.accept_suggested_service(business, "Servicio A")
    db_session.commit()

    assert "Servicio A" in business.products_services.splitlines()
    assert "Servicio original" in business.products_services.splitlines()
    assert business.doc_suggested_services == ["Servicio B"]


def test_descartar_sugerencia_no_toca_products_services(db_session, seed):
    business = seed["business"]
    business.products_services = "Servicio original"
    business.doc_suggested_services_json = json.dumps(["Servicio A", "Servicio B"])
    db_session.commit()

    documents.dismiss_suggested_service(business, "Servicio A")
    db_session.commit()

    assert business.products_services == "Servicio original"
    assert business.doc_suggested_services == ["Servicio B"]
