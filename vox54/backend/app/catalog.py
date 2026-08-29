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

LANGUAGES = [
    {"id": "auto", "name": "Detectar automáticamente"},
    {"id": "es", "name": "Español"},
    {"id": "en", "name": "Inglés"},
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
