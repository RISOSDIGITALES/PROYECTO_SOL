"""Tests reales de la lógica de armado del pipeline (build_stt/build_tts/
build_llm) y de fetch_bot_config — sin ninguna llamada de red real, sea a
Groq, Deepgram, Cartesia o ElevenLabs.

Por qué esto importa a pesar de no probar audio real: cada plugin del SDK
tiene su propio nombre de parámetro para "la voz" (`cartesia.TTS(voice=...)`
vs. `elevenlabs.TTS(voice_id=...)`, confirmado por inspección real del SDK
en la sesión del 2026-08-29) — un typo ahí es invisible hasta que alguien
prueba con una llamada real, y desde este entorno esa llamada real está
bloqueada por red (Cloudflare rechaza la IP del sandbox contra api.groq.com,
confirmado con curl -v: 403 servido por `Server: cloudflare` antes de llegar
a la lógica de auth de Groq). Estos tests SÍ corren sin esa dependencia,
verificando la única parte que está bajo nuestro control: qué argumentos
le mandamos a cada plugin real, no si esos argumentos producen audio.

Correr: WORKER_SECRET=test venv/Scripts/python.exe -m unittest test_agent -v
"""
import os
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("WORKER_SECRET", "test-secret-solo-para-tests")

import agent  # noqa: E402


class TestBuildStt(unittest.TestCase):
    def test_deepgram(self):
        with patch("agent.deepgram.STT") as mock_stt:
            agent.PLATFORM_KEYS["deepgram"] = "fake-deepgram-key"
            agent.build_stt({"stt_provider": "deepgram", "stt_model": "nova-3"})
            mock_stt.assert_called_once_with(model="nova-3", api_key="fake-deepgram-key")

    def test_groq_usa_endpoint_openai_compatible(self):
        with patch("agent.openai.STT") as mock_stt:
            agent.PLATFORM_KEYS["groq"] = "fake-groq-key"
            agent.build_stt({"stt_provider": "groq", "stt_model": "whisper-large-v3-turbo"})
            mock_stt.assert_called_once_with(
                model="whisper-large-v3-turbo",
                base_url="https://api.groq.com/openai/v1",
                api_key="fake-groq-key",
            )

    def test_proveedor_desconocido_falla_explicito(self):
        with self.assertRaises(ValueError) as ctx:
            agent.build_stt({"stt_provider": "un-proveedor-inventado", "stt_model": "x"})
        self.assertIn("un-proveedor-inventado", str(ctx.exception))


class TestBuildTts(unittest.TestCase):
    def test_cartesia_usa_parametro_voice_no_voice_id(self):
        """El bug que este test existe para prevenir: cartesia.TTS espera
        `voice=`, no `voice_id=` — confirmado inspeccionando el SDK real
        (ítem de la sesión del 29-ago). Si alguien 'simplifica' esto para
        que coincida con ElevenLabs, este test lo agarra sin necesitar
        ninguna llamada real."""
        with patch("agent.cartesia.TTS") as mock_tts:
            agent.PLATFORM_KEYS["cartesia"] = "fake-cartesia-key"
            agent.build_tts({"tts_provider": "cartesia", "tts_voice_id": "sample-male-professional"})
            mock_tts.assert_called_once_with(voice="sample-male-professional", api_key="fake-cartesia-key")

    def test_elevenlabs_usa_parametro_voice_id(self):
        with patch("agent.elevenlabs.TTS") as mock_tts:
            agent.PLATFORM_KEYS["elevenlabs"] = "fake-elevenlabs-key"
            agent.build_tts({"tts_provider": "elevenlabs", "tts_voice_id": "sample-female-warm"})
            mock_tts.assert_called_once_with(voice_id="sample-female-warm", api_key="fake-elevenlabs-key")

    def test_proveedor_desconocido_falla_explicito(self):
        with self.assertRaises(ValueError):
            agent.build_tts({"tts_provider": "un-proveedor-inventado", "tts_voice_id": "x"})


class TestBuildLlm(unittest.TestCase):
    def test_groq_usa_endpoint_openai_compatible(self):
        with patch("agent.openai.LLM") as mock_llm:
            agent.build_llm({"ai_provider": "groq", "ai_model": "llama-3.3-70b-versatile", "ai_api_key": ""})
            agent.PLATFORM_KEYS["groq"] = "fake-groq-key"  # se resetea abajo
            mock_llm.assert_called_once()
            _, kwargs = mock_llm.call_args
            self.assertEqual(kwargs["model"], "llama-3.3-70b-versatile")
            self.assertEqual(kwargs["base_url"], "https://api.groq.com/openai/v1")

    def test_ai_api_key_propio_del_negocio_tiene_prioridad_sobre_la_compartida(self):
        """BotConfig.ai_api_key (propio del negocio) siempre debe ganarle a
        PLATFORM_KEYS (la key compartida de plataforma) cuando el negocio
        trae la suya — mismo criterio documentado en el modelo de datos."""
        agent.PLATFORM_KEYS["groq"] = "key-compartida-de-plataforma"
        with patch("agent.openai.LLM") as mock_llm:
            agent.build_llm({"ai_provider": "groq", "ai_model": "x", "ai_api_key": "key-propia-del-negocio"})
            _, kwargs = mock_llm.call_args
            self.assertEqual(kwargs["api_key"], "key-propia-del-negocio")

    def test_openai(self):
        with patch("agent.openai.LLM") as mock_llm:
            agent.build_llm({"ai_provider": "openai", "ai_model": "gpt-4o-mini", "ai_api_key": "sk-fake"})
            mock_llm.assert_called_once_with(model="gpt-4o-mini", api_key="sk-fake")

    def test_anthropic_no_soportado_falla_explicito_no_inventa_nada(self):
        """anthropic/gemini están permitidos en el catálogo de Vox54 (para
        texto, en el resto de la plataforma) pero este worker no tiene
        instalado su plugin de LiveKit — debe fallar claro, nunca improvisar
        con otro proveedor."""
        with self.assertRaises(ValueError) as ctx:
            agent.build_llm({"ai_provider": "anthropic", "ai_model": "claude-sonnet-5", "ai_api_key": "x"})
        self.assertIn("anthropic", str(ctx.exception))


class TestFetchBotConfig(unittest.IsolatedAsyncioTestCase):
    async def test_por_business_id(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"status": "active"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client

        with patch("agent.httpx.AsyncClient", return_value=mock_client):
            result = await agent.fetch_bot_config(business_id=1)

        mock_client.get.assert_called_once_with(
            "/worker/bot-config/1", headers={"X-Worker-Secret": os.environ["WORKER_SECRET"]}
        )
        self.assertEqual(result, {"status": "active"})

    async def test_por_phone_number_cuando_no_hay_business_id(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"status": "paused"}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client

        with patch("agent.httpx.AsyncClient", return_value=mock_client):
            await agent.fetch_bot_config(business_id=None, phone_number="+17865551234")

        mock_client.get.assert_called_once_with(
            "/worker/bot-config/by-phone/+17865551234", headers={"X-Worker-Secret": os.environ["WORKER_SECRET"]}
        )

    async def test_sin_ningun_identificador_falla_antes_de_llamar_a_la_red(self):
        with self.assertRaises(ValueError):
            await agent.fetch_bot_config()


class TestReportCall(unittest.IsolatedAsyncioTestCase):
    async def test_manda_el_body_correcto(self):
        import datetime

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client

        started = datetime.datetime(2026, 9, 1, 10, 0, 0)
        ended = datetime.datetime(2026, 9, 1, 10, 3, 0)

        with patch("agent.httpx.AsyncClient", return_value=mock_client):
            await agent.report_call(
                business_id=1,
                started_at=started,
                ended_at=ended,
                caller_number="+17865551234",
                outcome="completed",
                transcript="[]",
            )

        mock_client.post.assert_called_once_with(
            "/worker/calls",
            headers={"X-Worker-Secret": os.environ["WORKER_SECRET"]},
            json={
                "business_id": 1,
                "started_at": started.isoformat(),
                "ended_at": ended.isoformat(),
                "caller_number": "+17865551234",
                "outcome": "completed",
                "transcript": "[]",
            },
        )

    async def test_un_fallo_de_red_se_loguea_y_nunca_se_propaga(self):
        """El shutdown del job no debe explotar porque el backend esté caído
        — un fallo acá se pierde el reporte de esa llamada puntual, pero
        nunca debe tumbar el resto del apagado del worker."""
        import datetime

        mock_client = AsyncMock()
        mock_client.post.side_effect = ConnectionError("backend caído")
        mock_client.__aenter__.return_value = mock_client

        with patch("agent.httpx.AsyncClient", return_value=mock_client):
            await agent.report_call(
                business_id=1,
                started_at=datetime.datetime(2026, 9, 1, 10, 0, 0),
                ended_at=datetime.datetime(2026, 9, 1, 10, 1, 0),
                caller_number=None,
                outcome="completed",
                transcript=None,
            )  # no debe lanzar nada


if __name__ == "__main__":
    unittest.main()
