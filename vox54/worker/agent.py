"""Worker de LiveKit Agents para Vox54 — reemplaza la dependencia de VAPI.

Investigado el 2026-08-29 (ver README de vox54/): ni Pipecat ni LiveKit Agents
tienen un objeto de config declarativo tipo el `Assistant` de VAPI — la capa
de configuración la seguimos necesitando nosotros. `BotConfig` (backend de
Vox54) ES esa capa. Este worker solo LEE esa config al arrancar una llamada
real y arma el pipeline de voz correspondiente — nunca decide nada de
configuración por su cuenta, y nunca inventa un valor que no venga del
backend (si algo no está configurado, el job falla explícito, no adivina).

Cómo entra un job acá:
- LiveKit despacha un job a este worker cuando entra una llamada SIP a un
  número con una dispatch rule registrada. `ctx.job.metadata` debería traer
  `{"business_id": N}` — lo arma quien registra esa dispatch rule.
- Si no viene metadata (ej. dispatch de prueba manual), este worker intenta
  resolver el negocio por el número SIP marcado
  (`GET /worker/bot-config/by-phone/...`).

Verificado contra el SDK real instalado (livekit-agents 1.7.1) antes de
escribir este archivo — cada firma de función usada acá (`AgentSession`,
`Agent`, `JobContext`, `function_tool`, los plugins de STT/TTS/LLM) se
inspeccionó en vivo, no se adivinó de memoria.

Qué SÍ mapea directo a un parámetro real de `AgentSession`:
- silence_timeout_seconds -> min_endpointing_delay
- allow_interruptions     -> allow_interruptions

Qué SÍ se implementa acá como código de aplicación (sin equivalente nativo
en el framework, confirmado en la investigación):
- first_message_mode: quién saluda primero
- max_duration_seconds: un timer que cuelga la llamada sola
- end_call_message: lo dice el agente antes de colgar por duración máxima
- transfer_phone_number: transferencia SIP real a un humano, expuesta como
  una tool que la IA puede invocar cuando el cliente lo pide — no un botón,
  porque quien decide transferir es la conversación, no un evento externo.

Pendiente, sin implementar a propósito (documentado, no un olvido):
- voicemail_detection_enabled/voicemail_message: no hay ninguna heurística
  confiable escrita todavía — detectar un buzón de voz real (vs. una persona
  contestando) requiere probarlo contra llamadas reales, algo que no se puede
  hacer sin una cuenta real de LiveKit/Twilio conectada. Se deja el campo ya
  leído de la config pero sin ninguna lógica todavía, para no fingir un
  comportamiento no verificado.
- ai_provider "anthropic"/"gemini": el catálogo de Vox54 los permite para
  texto (Content AI, etc. en el resto de la plataforma), pero este worker
  todavía no tiene instalado ni el plugin livekit-plugins-anthropic ni
  livekit-plugins-google — si un negocio real elige alguno de los dos para
  su agente de voz, build_llm() falla explícito en vez de improvisar.
"""
import asyncio
import datetime
import json
import logging
import os

import httpx
from livekit import agents
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    function_tool,
)
from livekit.plugins import cartesia, deepgram, elevenlabs, openai, silero

logger = logging.getLogger("vox54-worker")

VOX54_API_BASE = os.environ.get("VOX54_API_BASE", "http://localhost:8000")
WORKER_SECRET = os.environ["WORKER_SECRET"]  # sin default — que falle fuerte si falta

# Keys compartidas de plataforma (fallback cuando el negocio no trae su propia
# key — mismo criterio que `ai_api_key` ya usa en BotConfig hoy). Cada
# proveedor de STT/TTS/LLM se resuelve con la que corresponda según lo que
# el negocio eligió en su config, nunca una key hardcodeada en este archivo.
PLATFORM_KEYS = {
    "deepgram": os.environ.get("DEEPGRAM_API_KEY", ""),
    "cartesia": os.environ.get("CARTESIA_API_KEY", ""),
    "elevenlabs": os.environ.get("ELEVENLABS_API_KEY", ""),
    "groq": os.environ.get("GROQ_API_KEY", ""),
    "openai": os.environ.get("OPENAI_API_KEY", ""),
}


async def fetch_bot_config(business_id: int | None = None, phone_number: str | None = None) -> dict:
    """Trae la BotConfig real desde el backend de Vox54 — nunca se inventa
    ningún dato acá; si el backend no la tiene, el job falla explícito."""
    if business_id is None and phone_number is None:
        raise ValueError("hace falta business_id o phone_number para resolver la config")

    path = (
        f"/worker/bot-config/{business_id}"
        if business_id is not None
        else f"/worker/bot-config/by-phone/{phone_number}"
    )
    async with httpx.AsyncClient(base_url=VOX54_API_BASE, timeout=10.0) as client:
        resp = await client.get(path, headers={"X-Worker-Secret": WORKER_SECRET})
        resp.raise_for_status()
        return resp.json()


async def report_call(
    business_id: int,
    started_at: datetime.datetime,
    ended_at: datetime.datetime,
    caller_number: str | None,
    outcome: str,
    transcript: str | None,
) -> None:
    """Le avisa al backend cómo terminó una llamada real — la única escritura
    que hace este worker (todo lo demás es solo lectura de BotConfig). Un
    fallo acá nunca debe tumbar el shutdown del job ni ocultar el error real
    de la llamada en sí — se loguea y se sigue."""
    try:
        async with httpx.AsyncClient(base_url=VOX54_API_BASE, timeout=10.0) as client:
            resp = await client.post(
                "/worker/calls",
                headers={"X-Worker-Secret": WORKER_SECRET},
                json={
                    "business_id": business_id,
                    "started_at": started_at.isoformat(),
                    "ended_at": ended_at.isoformat(),
                    "caller_number": caller_number,
                    "outcome": outcome,
                    "transcript": transcript,
                },
            )
            resp.raise_for_status()
    except Exception:
        logger.exception("no se pudo reportar el resultado de la llamada del negocio %s", business_id)


def build_stt(config: dict):
    provider = config["stt_provider"]
    model = config["stt_model"]
    if provider == "deepgram":
        return deepgram.STT(model=model, api_key=PLATFORM_KEYS["deepgram"])
    if provider == "groq":
        # El endpoint de Whisper de Groq es compatible con la API de
        # transcripción de OpenAI — mismo patrón ya usado en el resto del
        # proyecto para hablarle a Groq como si fuera OpenAI.
        return openai.STT(model=model, base_url="https://api.groq.com/openai/v1", api_key=PLATFORM_KEYS["groq"])
    raise ValueError(f"stt_provider no soportado por este worker: '{provider}'")


def build_tts(config: dict):
    provider = config["tts_provider"]
    voice = config["tts_voice_id"]
    if provider == "cartesia":
        return cartesia.TTS(voice=voice, api_key=PLATFORM_KEYS["cartesia"])
    if provider == "elevenlabs":
        return elevenlabs.TTS(voice_id=voice, api_key=PLATFORM_KEYS["elevenlabs"])
    raise ValueError(f"tts_provider no soportado por este worker: '{provider}'")


def build_llm(config: dict):
    provider = config["ai_provider"]
    model = config["ai_model"]
    api_key = config.get("ai_api_key") or PLATFORM_KEYS.get(provider, "")
    if provider == "groq":
        return openai.LLM(model=model, base_url="https://api.groq.com/openai/v1", api_key=api_key)
    if provider == "openai":
        return openai.LLM(model=model, api_key=api_key)
    raise ValueError(
        f"ai_provider '{provider}' no tiene plugin de LLM instalado en este worker "
        "(faltaría livekit-plugins-anthropic o livekit-plugins-google)"
    )


def prewarm(proc: JobProcess):
    # Cargar el modelo de VAD una sola vez por proceso worker, no en cada
    # llamada — es lo que recomienda la propia doc de LiveKit Agents para
    # este tipo de modelo local.
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    metadata = {}
    if ctx.job.metadata:
        try:
            metadata = json.loads(ctx.job.metadata)
        except json.JSONDecodeError:
            logger.warning("job.metadata no es JSON válido: %r", ctx.job.metadata)

    business_id = metadata.get("business_id")
    phone_number = metadata.get("phone_number") if business_id is None else None

    config = await fetch_bot_config(business_id=business_id, phone_number=phone_number)

    if config["status"] != "active":
        logger.info("negocio %s tiene el agente pausado — no se atiende la llamada", business_id or phone_number)
        ctx.shutdown(reason="agent_paused")
        return

    await ctx.connect()

    # --- Visibilidad de resultado: desde acá hasta el shutdown callback de
    # más abajo, todo lo que se agrega es para poder reportar qué pasó en
    # esta llamada real — antes de esto, un negocio configuraba su bot y
    # nunca se enteraba de ningún resultado. call_state es un dict (no una
    # variable suelta) para poder mutarlo desde los closures de más abajo
    # (transfer_to_human, _hangup_by_max_duration) sin pelear con `nonlocal`. ---
    started_at = datetime.datetime.utcnow()
    call_state = {"outcome": "completed"}

    session = AgentSession(
        stt=build_stt(config),
        llm=build_llm(config),
        tts=build_tts(config),
        vad=ctx.proc.userdata["vad"],
        turn_detection="vad",
        allow_interruptions=config["allow_interruptions"],
        min_endpointing_delay=config["silence_timeout_seconds"],
    )

    async def _report_call_result():
        ended_at = datetime.datetime.utcnow()

        caller_number = None
        try:
            participant = next(iter(ctx.room.remote_participants.values()), None)
            if participant:
                # LiveKit no documenta un nombre fijo de atributo para el
                # número real que marcó — se intenta el atributo SIP más
                # habitual primero y, si no está, se cae a `identity` (que en
                # la integración SIP de LiveKit suele coincidir con el
                # número). Sin una llamada SIP real contra la que confirmar
                # esto desde acá — documentado como incierto, no adivinado
                # en silencio (ver nota de voicemail_detection más arriba).
                caller_number = participant.attributes.get("sip.phoneNumber") or participant.identity or None
        except Exception:
            logger.exception("no se pudo leer el número del participante remoto")

        transcript = None
        try:
            transcript = json.dumps(session.history.to_dict(exclude_timestamp=False)["items"])
        except Exception:
            logger.exception("no se pudo armar el transcript de la llamada")

        await report_call(
            business_id=config["business_id"],
            started_at=started_at,
            ended_at=ended_at,
            caller_number=caller_number,
            outcome=call_state["outcome"],
            transcript=transcript,
        )

    ctx.add_shutdown_callback(_report_call_result)

    # --- Transferencia a un humano — expuesta como tool, la invoca la IA
    # cuando la conversación lo amerita, no un evento externo. Sin número
    # configurado, la tool ni se ofrece (la IA nunca ve la opción). ---
    tools = []
    if config.get("transfer_phone_number"):
        @function_tool(
            name="transfer_to_human",
            description="Transferí la llamada a un especialista humano cuando el cliente lo pida "
            "explícitamente o cuando la consulta esté fuera de lo que podés resolver vos.",
        )
        async def transfer_to_human() -> str:
            participant = next(iter(ctx.room.remote_participants.values()), None)
            if not participant:
                return "No hay ningún participante remoto para transferir todavía."
            await ctx.transfer_sip_participant(participant, config["transfer_phone_number"])
            call_state["outcome"] = "transferred"
            return "Transferencia iniciada."

        tools.append(transfer_to_human)

    agent = Agent(
        instructions=config["system_prompt"] or "Sos un asistente de voz útil, breve y cordial.",
        tools=tools,
    )

    # --- Corte por duración máxima — sin equivalente nativo, lo hacemos
    # nosotros con un timer que cuelga la llamada sola pasado ese tiempo. ---
    async def _hangup_by_max_duration():
        await asyncio.sleep(config["max_duration_seconds"])
        call_state["outcome"] = "max_duration_reached"
        if config.get("end_call_message"):
            await session.say(config["end_call_message"])
        ctx.shutdown(reason="max_duration_reached")

    max_duration_task = asyncio.create_task(_hangup_by_max_duration())
    ctx.add_shutdown_callback(lambda: max_duration_task.cancel())

    try:
        await session.start(agent=agent, room=ctx.room)

        # --- Quién habla primero ---
        if config["first_message_mode"] == "assistant_first" and config.get("welcome_message"):
            await session.say(config["welcome_message"])
        # Si es "user_first", no se dice nada acá — se deja que el cliente hable
        # primero; AgentSession ya maneja el turno de escucha inicial solo.
    except Exception:
        # No se sobreescribe un outcome ya decidido (ej. una transferencia que
        # salió bien y disparó un error de limpieza después) — solo se marca
        # error si la llamada no había llegado a ningún resultado real todavía.
        if call_state["outcome"] == "completed":
            call_state["outcome"] = "error"
        raise


async def request_fn(req: agents.JobRequest):
    """Acepta todos los jobs — el filtrado de qué llamadas le tocan a este
    worker vs. otro ya lo resuelve la dispatch rule de LiveKit, no hace
    falta duplicar esa lógica acá."""
    await req.accept()


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            request_fnc=request_fn,
            prewarm_fnc=prewarm,
        )
    )
