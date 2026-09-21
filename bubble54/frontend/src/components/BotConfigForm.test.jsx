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
  phone_mode: "",
  own_phone_number: "",
  own_phone_verified: false,
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
function Wrapper({
  initialConfig, onSave = vi.fn(), onChangeSpy, onActivatePhone = vi.fn(),
  onVerifyPhoneStart = vi.fn(), onVerifyPhoneCheck = vi.fn(), onReleasePhone, scope,
}) {
  const [config, setConfig] = useState(initialConfig);
  function handleChange(patch) {
    onChangeSpy?.(patch);
    setConfig((prev) => ({ ...prev, ...patch }));
  }
  return (
    <BotConfigForm
      config={config}
      catalog={catalog}
      onChange={handleChange}
      onSave={onSave}
      onActivatePhone={onActivatePhone}
      onVerifyPhoneStart={onVerifyPhoneStart}
      onVerifyPhoneCheck={onVerifyPhoneCheck}
      onReleasePhone={onReleasePhone}
      saving={false}
      scope={scope}
    />
  );
}

describe("BotConfigForm — auto-corrección de desplegables huérfanos", () => {
  it("si tts_voice_id no pertenece al tts_provider actual, se corrige sola a la primera voz real", async () => {
    render(<Wrapper initialConfig={{ ...baseConfig, tts_provider: "cartesia", tts_voice_id: "voz-que-ya-no-existe" }} />);
    const select = await screen.findByDisplayValue("Voz 1");
    expect(select).toBeInTheDocument();
  });

  it("mismo caso para stt_model — corregido en estado aunque el select viva plegado en Configuración técnica", async () => {
    const user = userEvent.setup();
    render(<Wrapper initialConfig={{ ...baseConfig, stt_provider: "groq", stt_model: "" }} />);
    await user.click(screen.getByRole("button", { name: /Configuración técnica/ }));
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
  // Agencia y Negocio son los dos clientes reales de la plataforma (ninguno
  // es la vista interna de Growth54) — la personalización de cara al
  // cliente (Número, Modelo de IA, Voz del agente) se ve igual en los dos
  // scopes. Lo único que cambia es la configuración técnica de
  // infraestructura (telefonía/SIP/STT/API key), exclusiva de la plataforma.
  it("scope agencia (default) muestra personalización (Número, Modelo de IA, Voz del agente) a simple vista", () => {
    render(<Wrapper initialConfig={baseConfig} scope="agency" />);
    expect(screen.getByText("Número")).toBeInTheDocument();
    expect(screen.getByText("Modelo de IA")).toBeInTheDocument();
    expect(screen.getByText("Voz del agente")).toBeInTheDocument();
  });

  it("scope agencia arranca con la configuración técnica plegada, y el botón la despliega", async () => {
    const user = userEvent.setup();
    render(<Wrapper initialConfig={baseConfig} scope="agency" />);

    expect(screen.queryByText("Telefonía")).not.toBeInTheDocument();
    expect(screen.queryByText("Reconocimiento de voz (STT)")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Configuración técnica/ }));

    expect(screen.getByText("Telefonía")).toBeInTheDocument();
    expect(screen.getByText("Reconocimiento de voz (STT)")).toBeInTheDocument();
    expect(screen.getByLabelText("API key propia de IA (opcional)")).toBeInTheDocument();
  });

  it("scope cliente oculta las secciones técnicas de infraestructura por completo, ni siquiera quedan en el DOM", () => {
    render(<Wrapper initialConfig={baseConfig} scope="client" />);
    expect(screen.queryByText("Telefonía")).not.toBeInTheDocument();
    expect(screen.queryByText("Reconocimiento de voz (STT)")).not.toBeInTheDocument();
    expect(screen.queryByText("Proveedor de telefonía")).not.toBeInTheDocument();
    expect(screen.queryByText("API key propia de IA (opcional)")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Configuración técnica/ })).not.toBeInTheDocument();
  });

  it("scope cliente SÍ muestra Modelo de IA y Voz del agente — es personalización real de cualquier cliente, no solo de agencia", () => {
    render(<Wrapper initialConfig={baseConfig} scope="client" />);
    expect(screen.getByText("Modelo de IA")).toBeInTheDocument();
    expect(screen.getByText("Voz del agente")).toBeInTheDocument();
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

describe("BotConfigForm — activación real de número (self-service, mismo componente en los 2 scopes)", () => {
  it("sin número todavía, ofrece las 2 opciones -- en agencia", () => {
    render(<Wrapper initialConfig={baseConfig} scope="agency" />);
    expect(screen.getByText("Quiero un número nuevo")).toBeInTheDocument();
    expect(screen.getByText("Quiero usar mi número actual")).toBeInTheDocument();
  });

  it("sin número todavía, ofrece las 2 opciones -- en negocio por igual", () => {
    render(<Wrapper initialConfig={baseConfig} scope="client" />);
    expect(screen.getByText("Quiero un número nuevo")).toBeInTheDocument();
    expect(screen.getByText("Quiero usar mi número actual")).toBeInTheDocument();
  });

  it("'número nuevo' ya NO compra de un clic -- explica el costo real y pide confirmar (incidente 2026-09-19)", async () => {
    const user = userEvent.setup();
    const onActivatePhone = vi.fn().mockResolvedValue();
    render(<Wrapper initialConfig={baseConfig} onActivatePhone={onActivatePhone} scope="agency" />);

    await user.click(screen.getByText("Quiero un número nuevo"));
    expect(onActivatePhone).not.toHaveBeenCalled();
    expect(screen.getByText(/Esto compra un número de teléfono real ahora mismo/)).toBeInTheDocument();

    await user.click(screen.getByText("Sí, comprar número nuevo"));
    expect(onActivatePhone).toHaveBeenCalledWith("new");
  });

  it("'número nuevo' -- cancelar en la confirmación no compra nada", async () => {
    const user = userEvent.setup();
    const onActivatePhone = vi.fn();
    render(<Wrapper initialConfig={baseConfig} onActivatePhone={onActivatePhone} scope="agency" />);

    await user.click(screen.getByText("Quiero un número nuevo"));
    await user.click(screen.getByText("Cancelar"));

    expect(onActivatePhone).not.toHaveBeenCalled();
    expect(screen.getByText("Quiero un número nuevo")).toBeInTheDocument();
  });

  it("'usar mi número actual' ya NO activa de una -- pide verificar el número real primero (incidente 2026-09-19)", async () => {
    const user = userEvent.setup();
    const onActivatePhone = vi.fn().mockResolvedValue();
    render(<Wrapper initialConfig={baseConfig} onActivatePhone={onActivatePhone} scope="client" />);

    await user.click(screen.getByText("Quiero usar mi número actual"));

    // Ya no dispara la compra directo -- pide el número real primero.
    expect(onActivatePhone).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("+1 305 555 0100")).toBeInTheDocument();
  });

  it("flujo real completo: pedir número -> mandar código -> confirmarlo -> recién ahí activar 'forward'", async () => {
    const user = userEvent.setup();
    const onActivatePhone = vi.fn().mockResolvedValue();
    const onVerifyPhoneStart = vi.fn().mockResolvedValue();
    const onVerifyPhoneCheck = vi.fn().mockResolvedValue({ verified: true });
    render(
      <Wrapper
        initialConfig={baseConfig}
        onActivatePhone={onActivatePhone}
        onVerifyPhoneStart={onVerifyPhoneStart}
        onVerifyPhoneCheck={onVerifyPhoneCheck}
        scope="client"
      />
    );

    await user.click(screen.getByText("Quiero usar mi número actual"));
    await user.type(screen.getByPlaceholderText("+1 305 555 0100"), "+17865551234");
    await user.click(screen.getByText("Enviar código"));
    expect(onVerifyPhoneStart).toHaveBeenCalledWith("+17865551234");

    const codeInput = await screen.findByPlaceholderText("123456");
    await user.type(codeInput, "123456");
    await user.click(screen.getByText("Confirmar código"));
    expect(onVerifyPhoneCheck).toHaveBeenCalledWith("+17865551234", "123456");

    await user.click(await screen.findByText("Sí, activar el desvío"));
    expect(onActivatePhone).toHaveBeenCalledWith("forward");
  });

  it("código incorrecto no activa nada y muestra el error real", async () => {
    const user = userEvent.setup();
    const onActivatePhone = vi.fn();
    const onVerifyPhoneStart = vi.fn().mockResolvedValue();
    const onVerifyPhoneCheck = vi.fn().mockResolvedValue({ verified: false });
    render(
      <Wrapper
        initialConfig={baseConfig}
        onActivatePhone={onActivatePhone}
        onVerifyPhoneStart={onVerifyPhoneStart}
        onVerifyPhoneCheck={onVerifyPhoneCheck}
        scope="client"
      />
    );

    await user.click(screen.getByText("Quiero usar mi número actual"));
    await user.type(screen.getByPlaceholderText("+1 305 555 0100"), "+17865551234");
    await user.click(screen.getByText("Enviar código"));
    const codeInput = await screen.findByPlaceholderText("123456");
    await user.type(codeInput, "000000");
    await user.click(screen.getByText("Confirmar código"));

    expect(await screen.findByText(/no es correcto/)).toBeInTheDocument();
    expect(onActivatePhone).not.toHaveBeenCalled();
  });

  it("con un número ya asignado, muestra el número real en vez de las opciones", () => {
    render(<Wrapper initialConfig={{ ...baseConfig, phone_number: "+17865550100", phone_mode: "new" }} scope="client" />);
    expect(screen.getByText("+17865550100")).toBeInTheDocument();
    expect(screen.queryByText("Quiero un número nuevo")).not.toBeInTheDocument();
  });

  it("liberar número: sin onReleasePhone (scope negocio) no muestra el link -- exclusivo de agencia", () => {
    render(<Wrapper initialConfig={{ ...baseConfig, phone_number: "+17865550100", phone_mode: "new" }} scope="client" />);
    expect(screen.queryByText(/Liberar este número/)).not.toBeInTheDocument();
  });

  it("liberar número: pedido real de la usuaria (2026-09-19) -- pide confirmar y no lo llama de un solo clic", async () => {
    const user = userEvent.setup();
    const onReleasePhone = vi.fn().mockResolvedValue();
    render(
      <Wrapper
        initialConfig={{ ...baseConfig, phone_number: "+17865550100", phone_mode: "new" }}
        onReleasePhone={onReleasePhone}
        scope="agency"
      />
    );

    await user.click(screen.getByText(/Liberar este número/));
    expect(onReleasePhone).not.toHaveBeenCalled();
    expect(screen.getByText(/sigue pagado y disponible/)).toBeInTheDocument();

    await user.click(screen.getByText("Sí, liberar el número"));
    expect(onReleasePhone).toHaveBeenCalled();
  });

  it("un error real de activación (ej. Twilio sin configurar) se muestra tal cual, sin romper la pantalla", async () => {
    const user = userEvent.setup();
    const onActivatePhone = vi.fn().mockRejectedValue(new Error("La cuenta de Twilio todavía no está configurada en la plataforma."));
    render(<Wrapper initialConfig={baseConfig} onActivatePhone={onActivatePhone} scope="agency" />);

    await user.click(screen.getByText("Quiero un número nuevo"));
    await user.click(screen.getByText("Sí, comprar número nuevo"));

    expect(await screen.findByText("La cuenta de Twilio todavía no está configurada en la plataforma.")).toBeInTheDocument();
  });
});
