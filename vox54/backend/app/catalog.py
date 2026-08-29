"""Catálogo de proveedores de IA y de voz que alimenta los desplegables del panel.

Los modelos de IA son reales (nombres reales de cada proveedor). Las voces son de
muestra — todavía no hay ninguna cuenta de proveedor de voz conectada de verdad,
así que se etiquetan honestamente como "voz de muestra" en vez de simular un
catálogo real de un proveedor. Cuando se conecte un proveedor real (VAPI u otro),
esta lista se reemplaza por la que devuelva su API.
"""

AI_PROVIDERS = [
    {
        "id": "groq",
        "name": "Groq",
        "models": [
            {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B Versatile"},
            {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B Instant"},
            {"id": "gemma2-9b-it", "name": "Gemma 2 9B"},
        ],
    },
    {
        "id": "openai",
        "name": "OpenAI",
        "models": [
            {"id": "gpt-4o", "name": "GPT-4o"},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
        ],
    },
    {
        "id": "anthropic",
        "name": "Anthropic",
        "models": [
            {"id": "claude-opus-5", "name": "Claude Opus 5"},
            {"id": "claude-sonnet-5", "name": "Claude Sonnet 5"},
            {"id": "claude-haiku-4-5", "name": "Claude Haiku 4.5"},
        ],
    },
    {
        "id": "gemini",
        "name": "Google Gemini",
        "models": [
            {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash"},
            {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro"},
        ],
    },
]

VOICE_PROVIDERS = [
    {
        "id": "vapi",
        "name": "VAPI",
        "voices": [
            {"id": "sample-female-warm", "name": "Voz femenina cálida (muestra)"},
            {"id": "sample-female-professional", "name": "Voz femenina profesional (muestra)"},
            {"id": "sample-male-warm", "name": "Voz masculina cálida (muestra)"},
            {"id": "sample-male-professional", "name": "Voz masculina profesional (muestra)"},
        ],
    },
]

LANGUAGES = [
    {"id": "auto", "name": "Detectar automáticamente"},
    {"id": "es", "name": "Español"},
    {"id": "en", "name": "Inglés"},
]

STATUSES = [
    {"id": "paused", "name": "Pausado"},
    {"id": "active", "name": "Activo"},
]
