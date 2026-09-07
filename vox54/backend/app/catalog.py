"""Catálogo de proveedores (IA, telefonía, STT, TTS) que alimenta los
desplegables del panel.

No dependemos de VAPI ni de ningún otro orquestador todo-en-uno — cada pieza
del pipeline de voz (telefonía, reconocimiento de voz, síntesis de voz) es un
proveedor intercambiable propio, corrido por nuestro worker de LiveKit Agents
(ver `vox54/worker/`). Los modelos de IA y de STT son reales (nombres reales
de cada proveedor, confirmados en la investigación del 2026-08-29). Las voces
de TTS son de muestra — todavía no hay ninguna cuenta de Cartesia/ElevenLabs
conectada de verdad, así que se etiquetan honestamente como "voz de muestra"
en vez de simular un catálogo real. Cuando se conecte una cuenta real, esta
lista se reemplaza por la que devuelva su API.
"""

AI_PROVIDERS = [
    {
        "id": "groq",
        "name": "Groq",
        "models": [
            {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B Versatile (el más capaz, algo más lento)"},
            {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B Instant (más rápido y económico)"},
            {"id": "gemma2-9b-it", "name": "Gemma 2 9B (liviano, para conversaciones simples)"},
        ],
    },
    {
        "id": "openai",
        "name": "OpenAI",
        "models": [
            {"id": "gpt-4o", "name": "GPT-4o (equilibrado)"},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini (más rápido y económico)"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo (más potente, más lento)"},
        ],
    },
    {
        "id": "anthropic",
        "name": "Anthropic",
        "models": [
            {"id": "claude-opus-5", "name": "Claude Opus 5 (el más capaz, más lento)"},
            {"id": "claude-sonnet-5", "name": "Claude Sonnet 5 (el equilibrio recomendado)"},
            {"id": "claude-haiku-4-5", "name": "Claude Haiku 4.5 (el más rápido)"},
        ],
    },
    {
        "id": "gemini",
        "name": "Google Gemini",
        "models": [
            {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash (rápido y económico)"},
            {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro (piensa mejor, más lento)"},
        ],
    },
]

TELEPHONY_PROVIDERS = [
    {"id": "twilio", "name": "Twilio"},
    {"id": "telnyx", "name": "Telnyx"},
]

STT_PROVIDERS = [
    {
        "id": "deepgram",
        "name": "Deepgram",
        "models": [
            {"id": "nova-3", "name": "Nova-3 (recomendado, streaming)"},
            {"id": "nova-2", "name": "Nova-2"},
        ],
    },
    {
        "id": "groq",
        "name": "Groq (Whisper)",
        "models": [
            {"id": "whisper-large-v3-turbo", "name": "Whisper Large v3 Turbo (más barato)"},
            {"id": "whisper-large-v3", "name": "Whisper Large v3 (más preciso)"},
        ],
    },
]

TTS_PROVIDERS = [
    {
        "id": "cartesia",
        "name": "Cartesia",
        "voices": [
            {"id": "sample-female-warm", "name": "Voz femenina cálida (muestra)"},
            {"id": "sample-female-professional", "name": "Voz femenina profesional (muestra)"},
            {"id": "sample-male-warm", "name": "Voz masculina cálida (muestra)"},
            {"id": "sample-male-professional", "name": "Voz masculina profesional (muestra)"},
        ],
    },
    {
        "id": "elevenlabs",
        "name": "ElevenLabs",
        "voices": [
            {"id": "sample-female-warm", "name": "Voz femenina cálida (muestra)"},
            {"id": "sample-female-professional", "name": "Voz femenina profesional (muestra)"},
            {"id": "sample-male-warm", "name": "Voz masculina cálida (muestra)"},
            {"id": "sample-male-professional", "name": "Voz masculina profesional (muestra)"},
        ],
    },
]

RUNTIME_TARGETS = [
    {"id": "livekit_cloud", "name": "LiveKit Cloud (recomendado para empezar)"},
    {"id": "self_hosted", "name": "Self-hosted (solo si el volumen lo justifica)"},
]

# "auto" hoy solo cubre español/inglés (lo único probado de punta a punta) —
# el nombre lo aclara para que no se confunda con "cualquier idioma". Los
# proveedores reales (Deepgram/Groq Whisper para STT, Cartesia/ElevenLabs para
# TTS) sí soportan portugués y francés como idioma fijo, no como parte del
# auto-detect todavía — agregar más acá alcanza en tanto el proveedor elegido
# los soporte, sin volver a tocar el pipeline.
LANGUAGES = [
    {"id": "auto", "name": "Detectar automáticamente (español e inglés)"},
    {"id": "es", "name": "Español"},
    {"id": "en", "name": "Inglés"},
    {"id": "pt", "name": "Portugués"},
    {"id": "fr", "name": "Francés"},
]

STATUSES = [
    {"id": "paused", "name": "Pausado"},
    {"id": "active", "name": "Activo"},
]

# Quién habla primero al conectar la llamada — mismo campo real que exponen
# VAPI/Retell (first_message_mode / first_message plan). No es cosmético: cambia
# el comportamiento real del agente en la primera fracción de segundo de la llamada.
FIRST_MESSAGE_MODES = [
    {"id": "assistant_first", "name": "El agente saluda primero"},
    {"id": "user_first", "name": "Espera a que hable el cliente"},
]
