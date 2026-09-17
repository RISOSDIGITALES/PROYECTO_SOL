"""Convierte el PDF real de un negocio en fragmentos buscables por el bot.

Es la pieza que faltaba desde que se construyó la subida de documentos (ver
`Business.info_document_url` en models.py): el PDF ya se guardaba, pero su
contenido nunca se leía para nada. Acá se extrae el texto real, se corta en
fragmentos manejables, y a cada uno se le calcula un embedding real (vector
semántico) con un modelo local — sin ninguna cuenta ni API externa, corre
en la propia máquina.

Modelo elegido: `paraphrase-multilingual-MiniLM-L12-v2` (via fastembed, que
usa ONNX Runtime — no arrastra torch) — multilingüe de verdad porque los
documentos y las preguntas reales de los negocios van a estar sobre todo en
español, no en inglés. Se descarga una sola vez (~220MB) la primera vez que
se usa y queda cacheado localmente.

La búsqueda (`search_chunks`) compara a mano con NumPy en vez de usar un
motor de base de datos vectorial dedicado — a esta escala (un PDF por
negocio, unas pocas docenas de fragmentos) es más simple y no suma una
dependencia nueva que acá no hace ninguna falta."""

import json
import os

import httpx
import numpy as np
from pypdf import PdfReader
from sqlalchemy.orm import Session

from . import models
from .config import settings

EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
CHUNK_MAX_CHARS = 800
CHUNK_OVERLAP_CHARS = 100

# Mismo proveedor y misma API compatible-con-OpenAI que ya usa el worker de
# LiveKit para el LLM en tiempo real (ver worker/agent.py) — acá es una sola
# llamada de una sola vez por documento, no en vivo, así que se usa el
# modelo más capaz del catálogo en vez del más rápido.
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_INSIGHTS_MODEL = "llama-3.3-70b-versatile"

_embedding_model = None


def _get_embedding_model():
    """Carga el modelo una sola vez por proceso — instanciarlo es lo lento
    (carga el runtime ONNX + los pesos), no cada embedding individual."""
    global _embedding_model
    if _embedding_model is None:
        from fastembed import TextEmbedding

        _embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)
    return _embedding_model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Separado de `_get_embedding_model` a propósito — en los tests se
    reemplaza esta función entera por una versión falsa y rápida (ver
    conftest.py), sin tener que cargar nunca el modelo real ni depender de
    internet para correr la batería."""
    if not texts:
        return []
    model = _get_embedding_model()
    return [vec.tolist() for vec in model.embed(texts)]


def extract_pdf_text(path: str) -> str:
    """Texto real de cada página del PDF, unido con saltos de línea entre
    páginas. Un PDF escaneado como imagen (sin capa de texto real) va a dar
    texto vacío o casi vacío — comportamiento correcto y honesto, no se
    inventa contenido que el PDF no tiene en forma de texto."""
    reader = PdfReader(path)
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def chunk_text(text: str, max_chars: int = CHUNK_MAX_CHARS, overlap: int = CHUNK_OVERLAP_CHARS) -> list[str]:
    """Ventana deslizante por caracteres, cortando en el último espacio en
    blanco antes del límite cuando se puede — para no partir una palabra a
    la mitad sin necesidad. El overlap evita que una idea que cae justo en
    el borde de dos fragmentos quede irrecuperable en cualquiera de los dos."""
    text = " ".join(text.split())  # normaliza espacios/saltos de línea repetidos
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            cut = text.rfind(" ", start, end)
            if cut > start:
                end = cut
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)  # +1 real: garantiza avance aunque overlap sea grande
    return chunks


def process_business_document(db: Session, business: models.Business) -> int:
    """Reprocesa el PDF real ya subido de un negocio — borra los fragmentos
    viejos (si el negocio subió un PDF antes) y guarda los nuevos con su
    embedding real. Devuelve cuántos fragmentos quedaron. Si el negocio no
    tiene ningún documento cargado, o el PDF no tiene texto real extraíble,
    deja al negocio sin fragmentos — nunca inventa contenido.

    doc_summary/doc_suggested_services_json se limpian primero y solo se
    vuelven a llenar en la rama de éxito (con chunks reales) — así un
    documento borrado, corrupto o sin texto siempre deja al negocio sin
    ningún resumen/sugerencia vieja colgando de un PDF que ya no está."""
    db.query(models.DocumentChunk).filter(models.DocumentChunk.business_id == business.id).delete()
    business.doc_summary = ""
    business.doc_suggested_services_json = "[]"

    if not business.info_document_url:
        db.commit()
        return 0

    # info_document_url es la ruta pública (/uploads/...) — el archivo real
    # en disco vive bajo settings.upload_dir, mismo mapeo que usa StaticFiles.
    relative = business.info_document_url.removeprefix("/uploads/")
    full_path = os.path.join(settings.upload_dir, relative)
    if not os.path.exists(full_path):
        db.commit()
        return 0

    try:
        text = extract_pdf_text(full_path)
    except Exception:
        # Un archivo con extensión .pdf pero contenido corrupto/no-PDF real
        # no debe tumbar la subida completa — el documento ya quedó guardado
        # y visible, solo se queda sin fragmentos indexados. Mismo criterio
        # que "sin texto extraíble": un estado válido, no un error fatal.
        db.commit()
        return 0

    chunks = chunk_text(text)
    if not chunks:
        db.commit()
        return 0

    embeddings = embed_texts(chunks)
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(models.DocumentChunk(
            business_id=business.id,
            chunk_index=i,
            text=chunk,
            embedding_json=_serialize_embedding(embedding),
        ))

    insights = generate_document_insights(text, business.products_services or "")
    business.doc_summary = insights["summary"]
    business.doc_suggested_services_json = json.dumps(insights["suggested_services"])

    db.commit()
    return len(chunks)


def generate_document_insights(text: str, existing_services: str) -> dict:
    """Le pide a una IA real (Groq) que lea el texto ya extraído del PDF y
    devuelva (1) un resumen corto en español de lo que entendió — la forma
    honesta de confirmarle al negocio que el bot realmente leyó su
    documento, no solo que lo guardó — y (2) los servicios/productos reales
    que el documento menciona y que todavía NO están en `existing_services`,
    para sugerírselos (nunca se aplican solos, ver accept_suggested_service).

    Sin GROQ_API_KEY ni GROQ_RELAY_URL configurados, o ante cualquier falla
    real (red, JSON mal formado, límite de la API), devuelve resumen y
    sugerencias vacíos — mismo criterio de "nunca inventar" que el resto de
    este módulo: sin un dato real, se muestra vacío, nunca un relleno falso.

    GROQ_RELAY_URL (opcional) — cuando la red donde corre este backend no
    llega directo a Groq (confirmado 17-sep: Cloudflare devuelve 403 para
    cualquier cliente HTTP, sin importar el key, el user-agent, ni el stack
    de red usado — curl, httpx, WinHTTP, con y sin VPN, todos iguales), esta
    misma llamada se reenvía a un webhook real de n8n que hace exactamente
    la misma petición a Groq desde un servidor que sí llega sin problema
    (el mismo que ya usan Content AI/Ideas AI en producción). El relay es
    un proxy transparente — reenvía el mismo body y devuelve la misma forma
    de respuesta que Groq, así el parseo de abajo no cambia según cuál
    camino se haya usado."""
    if (not settings.groq_api_key and not settings.groq_relay_url) or not text.strip():
        return {"summary": "", "suggested_services": []}

    prompt = (
        "Este es el texto real extraído de un documento que un negocio subió "
        "para que su asistente de voz lo use como referencia.\n\n"
        "--- SERVICIOS/PRODUCTOS YA CARGADOS POR EL NEGOCIO ---\n"
        f"{existing_services.strip() or '(ninguno cargado todavía)'}\n\n"
        f"--- TEXTO DEL DOCUMENTO ---\n{text[:12000]}\n\n"
        "Devolvé SOLO un JSON con esta forma exacta, en español:\n"
        '{"summary": "2-3 oraciones resumiendo qué información real trae '
        'este documento (horarios, precios, servicios, políticas, etc.)", '
        '"suggested_services": ["servicio o producto real mencionado en el '
        'documento que NO esté ya en la lista de arriba", "..."]}\n'
        "Si el documento no menciona ningún servicio/producto nuevo, "
        "suggested_services debe ser una lista vacía. Nunca inventes nada "
        "que no esté escrito en el texto del documento."
    )
    if settings.groq_relay_url:
        url = settings.groq_relay_url
        headers = {"X-Relay-Secret": settings.groq_relay_secret}
    else:
        url = GROQ_CHAT_URL
        headers = {"Authorization": f"Bearer {settings.groq_api_key}"}

    try:
        response = httpx.post(
            url,
            headers=headers,
            json={
                "model": GROQ_INSIGHTS_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"},
                "temperature": 0.2,
            },
            timeout=30.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return {
            "summary": str(parsed.get("summary") or "").strip(),
            "suggested_services": [
                str(s).strip() for s in (parsed.get("suggested_services") or []) if str(s).strip()
            ],
        }
    except Exception:
        return {"summary": "", "suggested_services": []}


def accept_suggested_service(business: models.Business, suggestion: str) -> None:
    """Acepta una sugerencia real: la agrega como una línea nueva a
    products_services (mismo formato de texto libre que ya usa ese campo,
    una línea por producto) y la saca de la lista de pendientes. Nunca se
    aplica sola — solo corre cuando el negocio o la agencia confirma con un
    clic explícito (ver las rutas /document-suggestions/accept)."""
    remaining = [s for s in business.doc_suggested_services if s != suggestion]
    business.doc_suggested_services_json = json.dumps(remaining)
    lines = [line for line in (business.products_services or "").splitlines() if line.strip()]
    lines.append(suggestion)
    business.products_services = "\n".join(lines)


def dismiss_suggested_service(business: models.Business, suggestion: str) -> None:
    """Descarta una sugerencia sin aplicarla a products_services — no vuelve
    a aparecer hasta que el documento se reprocese de nuevo (por ejemplo si
    se sube una versión nueva del PDF)."""
    remaining = [s for s in business.doc_suggested_services if s != suggestion]
    business.doc_suggested_services_json = json.dumps(remaining)


def search_chunks(db: Session, business_id: int, query: str, top_k: int = 3) -> list[str]:
    """Los `top_k` fragmentos del documento de ese negocio más parecidos
    semánticamente a `query` — nunca por coincidencia exacta de palabras,
    por significado real (ej. "cuánto cuesta" encuentra un fragmento que
    diga "el precio es de..." aunque no comparta ninguna palabra literal).
    Lista vacía si el negocio no tiene ningún fragmento indexado todavía."""
    rows = (
        db.query(models.DocumentChunk)
        .filter(models.DocumentChunk.business_id == business_id)
        .all()
    )
    if not rows:
        return []

    query_vec = np.array(embed_texts([query])[0])
    matrix = np.array([_deserialize_embedding(r.embedding_json) for r in rows])

    # Coseno, no distancia euclidiana — lo que importa es la dirección
    # semántica del vector, no su magnitud (que varía por longitud del texto).
    query_norm = query_vec / (np.linalg.norm(query_vec) or 1)
    matrix_norms = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-10)
    scores = matrix_norms @ query_norm

    ranked = sorted(zip(rows, scores), key=lambda pair: pair[1], reverse=True)
    return [row.text for row, _score in ranked[:top_k]]


def _serialize_embedding(embedding: list[float]) -> str:
    return json.dumps(embedding)


def _deserialize_embedding(raw: str) -> list[float]:
    return json.loads(raw)
