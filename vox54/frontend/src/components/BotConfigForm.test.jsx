import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BotConfigForm from "./BotConfigForm";

const catalog = {
  ai_providers: [
    { id: "groq", name: "Groq", models: [{ id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" }] },
    { id: "openai", name: "OpenAI", models: [{ id: "gpt-4o-mini", name: "GPT-4o Mini" }] },
  ],
  stt_providers: [
    { id: "deepgram", name: "Deepgram", models: [{ id: "nova-3", name: "Nova-3" }] },
    { id: "groq", name: "Groq (Whisper)", models: [{ id: "whisper-large-v3-turbo", name: "Whisper Turbo" }] },
  ],
  tts_providers: [
    { id: "cartesia", name: "Cartesia", voices: [{ id: "voz-cartesia-1", name: "Voz 1" }] },
    { id: "elevenlabs", name: "ElevenLabs", voices: [{ id: "voz-eleven-1", name: "Voz A" }] },
  ],
  telephony_providers: [{ id: "twilio", name: "Twilio" }, { id: "telnyx", name: "Telnyx" }],
  runtime_targets: [{ id: "livekit_cloud", name: "LiveKit Cloud" }, { id: "self_hosted", name: "Self-hosted" }],
  languages: [{ id: "auto", name: "Automático" }],
  statuses: [{ id: "active", name: "Activo" }, { id: "paused", name: "Pausado" }],
  first_message_modes: [{ id: "assistant_first", name: "El agente saluda primero" }],
};

const baseConfig = {
  telephony_provider: "twilio",
  telephony_trunk_id: "",
  phone_number: "",
  stt_provider: "deepgram",
  stt_model: "nova-3",
  tts_provider: "cartesia",
  tts_voice_id: "voz-cartesia-1",
  runtime_target: "livekit_cloud",
  ai_provider: "groq",
  ai_model: "llama-3.3-70b-versatile",
  ai_api_key: "",
  system_prompt: "",
  welcome_message: "",
  escalation_email: "",
  language: "auto",
  status: "paused",
  first_message_mode: "assistant_first",
  allow_interruptions: true,
  silence_timeout_seconds: 30,
  max_duration_seconds: 600,
  end_call_message: "",
  transfer_phone_number: "",
  voicemail_detection_enabled: false,
  voicemail_message: "",
};

/** Envoltorio con estado real, igual al patrón que usan BusinessDashboard y
 * AgencyBusinessDetail — onChange hace un merge real, no un mock ciego, así
 * que el formulario recibe props actualizadas de verdad tras cada cambio. */
function Wrapper({ initialConfig, onSave = vi.fn(), onChangeSpy, scope }) {
  const [config, setConfig] = useState(initialConfig);
  function handleChange(patch) {
    onChangeSpy?.(patch);
    setConfig((prev) => ({ ...prev, ...patch }));
  }
  return (
    <BotConfigForm config={config} catalog={catalog} onChange={handleChange} onSave={onSave} saving={false} scope={scope} />
  );
}

describe("BotConfigForm — auto-corrección de desplegables huérfanos", () => {
  it("si tts_voice_id no pertenece al tts_provider actual, se corrige sola a la primera voz real", async () => {
    render(<Wrapper initialConfig={{ ...baseConfig, tts_provider: "cartesia", tts_voice_id: "voz-que-ya-no-existe" }} />);
    const select = await screen.findByDisplayValue("Voz 1");
    expect(select).toBeInTheDocument();
  });

  it("mismo caso para stt_model", async () => {
    render(<Wrapper initialConfig={{ ...baseConfig, stt_provider: "groq", stt_model: "" }} />);
    const select = await screen.findByDisplayValue("Whisper Turbo");
    expect(select).toBeInTheDocument();
  });
});

describe("BotConfigForm — cambio de proveedor resetea el modelo/voz a uno válido", () => {
  it("cambiar el proveedor de IA de groq a openai actualiza el modelo al primero de openai", async () => {
    const user = userEvent.setup();
    render(<Wrapper initialConfig={baseConfig} />);

    const openaiOption = screen.getByRole("option", { name: "OpenAI" });
    const aiProviderSelect = openaiOption.closest("select");

    await user.selectOptions(aiProviderSelect, "openai");

    expect(await screen.findByDisplayValue("GPT-4o Mini")).toBeInTheDocument();
  });
});

describe("BotConfigForm — toggles", () => {
  it("clickear el toggle de interrupciones invierte allow_interruptions", async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(<Wrapper initialConfig={baseConfig} onChangeSpy={onChangeSpy} />);

    const toggle = screen.getByText("El cliente puede interrumpir al agente mientras habla")
      .parentElement.querySelector("button");
    await user.click(toggle);

    expect(onChangeSpy).toHaveBeenCalledWith({ allow_interruptions: false });
  });

  it("el campo de mensaje de buzón de voz solo aparece cuando el toggle está activado", async () => {
    const user = userEvent.setup();
    render(<Wrapper initialConfig={{ ...baseConfig, voicemail_detection_enabled: false }} />);

    expect(screen.queryByLabelText("Mensaje a dejar en el buzón")).not.toBeInTheDocument();

    const toggle = screen.getByText("Detectar buzón de voz").parentElement.querySelector("button");
    await user.click(toggle);

    expect(await screen.findByLabelText("Mensaje a dejar en el buzón")).toBeInTheDocument();
  });
});

describe("BotConfigForm — envío", () => {
  it("clickear 'Guardar cambios' dispara onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn((e) => e.preventDefault());
    render(<Wrapper initialConfig={baseConfig} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onSave).toHaveBeenCalled();
  });

  it("el botón de guardar se deshabilita mientras saving=true", () => {
    render(
      <BotConfigForm config={baseConfig} catalog={catalog} onChange={vi.fn()} onSave={vi.fn()} saving={true} />
    );
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  });
});

describe("BotConfigForm — separación cliente/agencia", () => {
  it("scope agencia (default) muestra las 4 secciones técnicas completas", () => {
    render(<Wrapper initialConfig={baseConfig} scope="agency" />);
    expect(screen.getByText("Telefonía")).toBeInTheDocument();
    expect(screen.getByText("Reconocimiento de voz (STT)")).toBeInTheDocument();
    expect(screen.getByText("Síntesis de voz (TTS)")).toBeInTheDocument();
    expect(screen.getByText("Modelo de IA")).toBeInTheDocument();
  });

  it("scope cliente oculta las 4 secciones técnicas por completo, ni siquiera quedan en el DOM", () => {
    render(<Wrapper initialConfig={baseConfig} scope="client" />);
    expect(screen.queryByText("Telefonía")).not.toBeInTheDocument();
    expect(screen.queryByText("Reconocimiento de voz (STT)")).not.toBeInTheDocument();
    expect(screen.queryByText("Síntesis de voz (TTS)")).not.toBeInTheDocument();
    expect(screen.queryByText("Modelo de IA")).not.toBeInTheDocument();
    expect(screen.queryByText("Proveedor de telefonía")).not.toBeInTheDocument();
    expect(screen.queryByText("API key propia (opcional)")).not.toBeInTheDocument();
  });

  it("scope cliente muestra el número asignado como texto de solo lectura, no un input editable", () => {
    render(<Wrapper initialConfig={{ ...baseConfig, phone_number: "+17865550100" }} scope="client" />);
    expect(screen.getByText("+17865550100")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("+17865550100")).not.toBeInTheDocument(); // un <input> lo mostraría por value, no por texto
  });

  it("scope cliente conserva las secciones que sí le corresponden al negocio", () => {
    render(<Wrapper initialConfig={baseConfig} scope="client" />);
    expect(screen.getByText("Estado del agente")).toBeInTheDocument();
    expect(screen.getByText("Comportamiento del agente")).toBeInTheDocument();
    expect(screen.getByText("Control de la llamada")).toBeInTheDocument();
  });
});
