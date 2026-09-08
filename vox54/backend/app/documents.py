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

import numpy as np
from pypdf import PdfReader
from sqlalchemy.orm import Session

from . import models
from .config import settings

EMBEDDING_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
CHUNK_MAX_CHARS = 800
CHUNK_OVERLAP_CHARS = 100

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
    deja al negocio sin fragmentos — nunca inventa contenido."""
    db.query(models.DocumentChunk).filter(models.DocumentChunk.business_id == business.id).delete()

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
    db.commit()
    return len(chunks)


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
