import { useEffect, useMemo, useRef, useState } from "react";
import { burst } from "../burst";
import PhoneActivation from "./PhoneActivation";

// Plantillas de arranque para el prompt del sistema -- hoy es una caja de
// texto en blanco (más lo que ya cargó Content AI, si algo), sin ningún
// punto de partida real para quien nunca escribió un prompt de IA. Genéricas
// a propósito (con [Nombre del negocio] como placeholder que cada negocio
// completa) -- no inventan datos reales de ningún negocio puntual, solo dan
// una estructura razonable para adaptar.
const PROMPT_TEMPLATES = [
  {
    id: "recepcion",
    label: "Recepción general",
    text: `Sos el agente de voz de [Nombre del negocio]. Atendés llamadas entrantes con un tono cordial y profesional.

- Saludá, preguntá el nombre de quien llama y en qué podés ayudar.
- Respondé solo con la información real que tenés cargada (horario, dirección, servicios) — nunca inventes un dato que no tengas.
- Si preguntan algo que no sabés, ofrecé anotar el mensaje o transferir la llamada.
- Cerrá la llamada de forma breve y amable.`,
  },
  {
    id: "ventas",
    label: "Ventas y cotizaciones",
    text: `Sos el agente de voz de [Nombre del negocio], enfocado en atender consultas de ventas.

- Identificá qué producto o servicio le interesa a quien llama.
- Usá el catálogo real de productos y servicios cargado para responder — nunca inventes precios ni disponibilidad que no tengas.
- Si no podés cotizar en el momento, ofrecé que un vendedor lo llame de vuelta.
- Antes de cerrar, pedí un dato de contacto (nombre y teléfono) para poder darle seguimiento.`,
  },
  {
    id: "soporte",
    label: "Soporte / atención al cliente",
    text: `Sos el agente de voz de [Nombre del negocio], especializado en resolver dudas de clientes existentes.

- Escuchá el problema completo antes de responder.
- Respondé solo con información real que tengas cargada — si no estás seguro, decilo con honestidad en vez de adivinar.
- Para reclamos o problemas que no puedas resolver por teléfono, ofrecé transferir a un humano o anotar los datos para que lo llamen de vuelta.
- Mantené un tono paciente y empático en todo momento.`,
  },
  {
    id: "reservas",
    label: "Reservas y turnos",
    text: `Sos el agente de voz de [Nombre del negocio]. Tu tarea principal es coordinar reservas o turnos.

- Preguntá fecha, hora y el servicio o cantidad de personas que necesita quien llama.
- Confirmá el horario de atención real antes de ofrecer un turno.
- Si no podés confirmar disponibilidad en el momento, anotá los datos del cliente y avisá que le confirman por otro medio.
- Repetí los datos de la reserva en voz alta antes de cerrar, para confirmar que quedaron bien anotados.`,
  },
];

/**
 * Formulario de configuración del agente de voz — reusado tanto por el panel
 * de negocio (edita su propio bot) como por el panel de agencia (edita el bot
 * de cualquier negocio suyo). Los desplegables de modelo/voz dependen del
 * proveedor elegido (cascada) — si cambia el proveedor y el valor actual no
 * pertenece a la lista nueva, se ajusta solo al primero disponible.
 *
 * Agencia y Negocio son los dos clientes reales de la plataforma (una
 * agencia gestiona varios negocios/sucursales; un negocio es uno solo) —
 * ninguno de los dos es "nuestra" vista interna de administrador. Por eso
 * la personalización real de cara al cliente — número (de solo lectura,
 * ver más abajo), modelo de IA, voz del agente — se ve en los DOS scopes
 * por igual: es lo que cualquier cliente real "elige" al armar su bot.
 *
 * `scope`: solo cambia qué tan al fondo vive la configuración técnica de
 * infraestructura (telefonía/SIP, reconocimiento de voz/STT, la API key
 * propia de IA) — eso sigue siendo exclusivo de la plataforma (Growth54),
 * nunca de ningún cliente, agencia o negocio: "agency" la muestra plegada
 * en <AdvancedSection> (mientras no exista una vista propia de operador de
 * plataforma, alguien tiene que poder tocarla); "client" la oculta del
 * todo. La barrera real no es esta — vive en el backend
 * (BotConfigUpdateClient, ver schemas.py) — esto es la vista honesta de esa
 * misma barrera, para no mostrarle a nadie un campo que después el
 * servidor va a ignorar en silencio.
 */
export default function BotConfigForm({ config, catalog, onChange, onSave, onActivatePhone, onVerifyPhoneStart, onVerifyPhoneCheck, onReleasePhone, saving, savedMessage, error, scope = "agency" }) {
  const isAgency = scope === "agency";
  const aiModels = useMemo(() => {
    const provider = catalog.ai_providers.find((p) => p.id === config.ai_provider);
    return provider ? provider.models : [];
  }, [catalog, config.ai_provider]);

  const sttModels = useMemo(() => {
    const provider = catalog.stt_providers.find((p) => p.id === config.stt_provider);
    return provider ? provider.models : [];
  }, [catalog, config.stt_provider]);

  const ttsVoices = useMemo(() => {
    const provider = catalog.tts_providers.find((p) => p.id === config.tts_provider);
    return provider ? provider.voices : [];
  }, [catalog, config.tts_provider]);

  // Un negocio recién creado guarda estos campos vacíos — un <select> con un
  // value que no matchea NINGUNA <option> igual muestra la primera opción en
  // pantalla, sin que el estado real cambie. Sin esta corrección, el desplegable
  // parece tener algo elegido que en realidad nunca se guardó.
  useEffect(() => {
    if (aiModels.length > 0 && !aiModels.some((m) => m.id === config.ai_model)) {
      onChange({ ai_model: aiModels[0].id });
    }
  }, [aiModels, config.ai_model]);

  useEffect(() => {
    if (sttModels.length > 0 && !sttModels.some((m) => m.id === config.stt_model)) {
      onChange({ stt_model: sttModels[0].id });
    }
  }, [sttModels, config.stt_model]);

  useEffect(() => {
    if (ttsVoices.length > 0 && !ttsVoices.some((v) => v.id === config.tts_voice_id)) {
      onChange({ tts_voice_id: ttsVoices[0].id });
    }
  }, [ttsVoices, config.tts_voice_id]);

  function handleAiProviderChange(newProviderId) {
    const provider = catalog.ai_providers.find((p) => p.id === newProviderId);
    const stillValid = provider && provider.models.some((m) => m.id === config.ai_model);
    onChange({
      ai_provider: newProviderId,
      ai_model: stillValid ? config.ai_model : provider?.models[0]?.id || "",
    });
  }

  function handleSttProviderChange(newProviderId) {
    const provider = catalog.stt_providers.find((p) => p.id === newProviderId);
    const stillValid = provider && provider.models.some((m) => m.id === config.stt_model);
    onChange({
      stt_provider: newProviderId,
      stt_model: stillValid ? config.stt_model : provider?.models[0]?.id || "",
    });
  }

  function handleTtsProviderChange(newProviderId) {
    const provider = catalog.tts_providers.find((p) => p.id === newProviderId);
    const stillValid = provider && provider.voices.some((v) => v.id === config.tts_voice_id);
    onChange({
      tts_provider: newProviderId,
      tts_voice_id: stillValid ? config.tts_voice_id : provider?.voices[0]?.id || "",
    });
  }

  const isActive = config.status === "active";

  // Mismo criterio que BusinessProfileForm — el botón estalla (sin
  // desaparecer) recién cuando el padre confirma un guardado real, nunca
  // en el click en sí.
  const saveBtnRef = useRef(null);
  useEffect(() => {
    if (savedMessage) burst(saveBtnRef.current);
  }, [savedMessage]);

  // Plantilla pendiente de confirmar -- si ya hay un prompt real escrito,
  // aplicar una plantilla lo reemplazaría sin avisar; mismo criterio de
  // confirmación explícita de 2 clics que ya usa este proyecto en todos
  // lados (nunca window.confirm), no solo para acciones que cuestan plata.
  const [confirmingTemplate, setConfirmingTemplate] = useState(null);

  function handleApplyTemplate(template) {
    if (!config.system_prompt || !config.system_prompt.trim()) {
      onChange({ system_prompt: template.text });
      return;
    }
    setConfirmingTemplate(template);
  }

  function confirmApplyTemplate() {
    onChange({ system_prompt: confirmingTemplate.text });
    setConfirmingTemplate(null);
  }

  return (
    <form onSubmit={onSave} style={{ display: "grid", gap: 24 }}>
      {error && <div style={{ ...bannerStyle("danger"), gridColumn: "1 / -1" }}>{error}</div>}
      {savedMessage && <div style={{ ...bannerStyle("success"), gridColumn: "1 / -1" }}>{savedMessage}</div>}

      {/* Grid real de 2+ columnas en vez de una sola columna angosta — en
          una pantalla ancha, apilar 8 tarjetas una debajo de la otra dejaba
          casi todo el espacio real vacío a los costados. Las secciones
          cortas (Estado, Telefonía, STT, TTS, Modelo de IA) se emparejan de
          a 2 por fila; las más largas (Comportamiento, Control de la
          llamada — tienen textarea/varios toggles) ocupan el ancho completo
          con `full`, para no dejar un hueco raro al lado de una tarjeta
          corta. */}
      <div style={gridStyle}>
      {/* Las 4 tarjetas de personalización (Estado, Número, Modelo de IA,
          Voz) van en su propio sub-grid de 2 columnas fijas, iguales en los
          dos scopes — el auto-fit del grid de afuera las repartía 3+1 en
          pantallas anchas (se acomodaban tantas como entraran por ancho, no
          por cuántas hay), dejando "Voz del agente" sola y feo en su propia
          fila. Acá siempre son 2 y 2. */}
      <div className="bubble54-form-row-2" style={{ gridColumn: "1 / -1", display: "grid", gap: 20 }}>
        <Section title="Estado del agente">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={() => onChange({ status: isActive ? "paused" : "active" })}
            style={{
              ...toggleStyle,
              flexShrink: 0,
              background: isActive ? "var(--success)" : "var(--border)",
            }}
          >
            <span
              style={{
                ...toggleKnobStyle,
                transform: isActive ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: isActive ? "var(--success)" : "var(--ink-soft)" }}>
            {isActive ? "Activo — atendiendo llamadas" : "Pausado — no atiende llamadas"}
          </span>
        </div>
      </Section>

      <Section title={isAgency ? "Número" : "Tu número"}>
        <PhoneActivation
          phoneNumber={config.phone_number}
          phoneMode={config.phone_mode}
          onActivate={onActivatePhone}
          ownPhoneNumber={config.own_phone_number}
          ownPhoneVerified={config.own_phone_verified}
          onVerifyStart={onVerifyPhoneStart}
          onVerifyCheck={onVerifyPhoneCheck}
          onRelease={onReleasePhone}
        />
      </Section>

      {/* Modelo de IA y Voz del agente son personalización real de cara al
          cliente (Agencia o Negocio, los dos son clientes reales — ninguno
          es "nuestra" vista interna) — visibles en los dos scopes. Lo que
          sigue siendo exclusivo de infraestructura (telefonía/SIP/STT/API
          key propia) vive más abajo, en <AdvancedSection>. */}
      <Section title="Modelo de IA" hint="El proveedor es el servicio que 'piensa' la respuesta de tu agente. El modelo es qué tan rápido y sofisticado es ese pensamiento — uno más grande entiende mejor casos complicados, pero puede tardar un poco más en contestar.">
        <Row>
          <Field label="Proveedor">
            <select
              value={config.ai_provider}
              onChange={(e) => handleAiProviderChange(e.target.value)}
              style={inputStyle}
            >
              {catalog.ai_providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Modelo">
            <select
              value={config.ai_model}
              onChange={(e) => onChange({ ai_model: e.target.value })}
              style={inputStyle}
            >
              {aiModels.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
        </Row>
      </Section>

      <Section title="Voz del agente">
        <Row>
          <Field label="Proveedor">
            <select
              value={config.tts_provider}
              onChange={(e) => handleTtsProviderChange(e.target.value)}
              style={inputStyle}
            >
              {catalog.tts_providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Voz">
            <select
              value={config.tts_voice_id}
              onChange={(e) => onChange({ tts_voice_id: e.target.value })}
              style={inputStyle}
            >
              {ttsVoices.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </Field>
        </Row>
        <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
          Estas voces son solo etiquetas por ahora — sin una cuenta real de {catalog.tts_providers.find((p) => p.id === config.tts_provider)?.name || "el proveedor"} conectada no hay ningún audio real que reproducir todavía.
        </div>
      </Section>
      </div>

      <Section title="Comportamiento del agente" full>
        <Row>
          <Field label="Idioma">
            <select
              value={config.language}
              onChange={(e) => onChange({ language: e.target.value })}
              style={inputStyle}
            >
              {catalog.languages.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Correo de escalación (cuando el bot no sabe algo)">
            <input
              type="email"
              value={config.escalation_email}
              onChange={(e) => onChange({ escalation_email: e.target.value })}
              style={inputStyle}
            />
          </Field>
        </Row>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={() => onChange({ use_products_services: !config.use_products_services })}
            style={{
              ...toggleStyle,
              flexShrink: 0,
              background: config.use_products_services ? "var(--success)" : "var(--border)",
            }}
          >
            <span
              style={{
                ...toggleKnobStyle,
                transform: config.use_products_services ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
            Usar los productos y servicios del negocio como contexto para responder
          </span>
        </div>

        {/* Solo tiene sentido ofrecer esto si el toggle de arriba está
            prendido — mencionar precios sin usar el catálogo en absoluto
            no significa nada. Mismo criterio real que ya aplica el worker
            (ver build_instructions en agent.py): apagado por default,
            mencionar un precio real en una llamada sin que el negocio lo
            haya autorizado es un riesgo real, no un detalle cosmético. */}
        {config.use_products_services && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: 58 }}>
            <button
              type="button"
              onClick={() => onChange({ mention_prices: !config.mention_prices })}
              style={{
                ...toggleStyle,
                flexShrink: 0,
                background: config.mention_prices ? "var(--success)" : "var(--border)",
              }}
            >
              <span
                style={{
                  ...toggleKnobStyle,
                  transform: config.mention_prices ? "translateX(20px)" : "translateX(2px)",
                }}
              />
            </button>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
              Puede mencionar los precios que el negocio haya cargado
            </span>
          </div>
        )}

        <Field label="Mensaje de bienvenida">
          <input
            value={config.welcome_message}
            onChange={(e) => onChange({ welcome_message: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Prompt del sistema">
          <textarea
            value={config.system_prompt}
            onChange={(e) => onChange({ system_prompt: e.target.value })}
            rows={8}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font)" }}
          />
        </Field>

        <div>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)" }}>
            ¿No sabés por dónde arrancar? Elegí una plantilla según tu rubro:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {PROMPT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleApplyTemplate(t)}
                className="bubble54-btn secondary small"
              >
                {t.label}
              </button>
            ))}
          </div>
          {confirmingTemplate && (
            <div style={templateConfirmBoxStyle}>
              <span style={{ fontSize: 12.5, color: "var(--ink)" }}>
                Esto va a reemplazar el prompt actual por la plantilla de "{confirmingTemplate.label}". ¿Seguro?
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={confirmApplyTemplate} className="bubble54-btn small">
                  Sí, reemplazar
                </button>
                <button type="button" onClick={() => setConfirmingTemplate(null)} style={cancelLinkStyle}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Control de la llamada" full>
        <Row>
          <Field
            label="Quién habla primero"
            hint="'El agente saluda primero' hace que tu bot hable apenas atiende la llamada, sin esperar a que la persona diga algo."
          >
            <select
              value={config.first_message_mode}
              onChange={(e) => onChange({ first_message_mode: e.target.value })}
              style={inputStyle}
            >
              {catalog.first_message_modes.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>
          <Field
            label="Corte por silencio (segundos)"
            hint="Si quien llama se queda callado más de este tiempo, el agente asume que terminó de hablar (o que se cortó) y sigue con la conversación."
          >
            <input
              type="number"
              min={5}
              max={600}
              value={config.silence_timeout_seconds}
              onChange={(e) => onChange({ silence_timeout_seconds: Number(e.target.value) })}
              style={inputStyle}
            />
          </Field>
        </Row>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={() => onChange({ allow_interruptions: !config.allow_interruptions })}
            style={{
              ...toggleStyle,
              flexShrink: 0,
              background: config.allow_interruptions ? "var(--success)" : "var(--border)",
            }}
          >
            <span
              style={{
                ...toggleKnobStyle,
                transform: config.allow_interruptions ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
            El cliente puede interrumpir al agente mientras habla
          </span>
        </div>

        <Row>
          <Field
            label="Duración máxima de la llamada (segundos)"
            hint="Corta la llamada automáticamente al llegar a este tiempo — una red de seguridad contra llamadas que quedan colgadas sin colgar de verdad."
          >
            <input
              type="number"
              min={30}
              max={7200}
              value={config.max_duration_seconds}
              onChange={(e) => onChange({ max_duration_seconds: Number(e.target.value) })}
              style={inputStyle}
            />
          </Field>
          <Field
            label="Transferir a un humano (número, opcional)"
            hint="Si el agente no puede resolver algo, puede pasarle la llamada en vivo a este número."
          >
            <input
              value={config.transfer_phone_number}
              onChange={(e) => onChange({ transfer_phone_number: e.target.value })}
              placeholder="Sin transferencia configurada"
              style={inputStyle}
            />
          </Field>
        </Row>
        <Field label="Mensaje antes de colgar (opcional)">
          <input
            value={config.end_call_message}
            onChange={(e) => onChange({ end_call_message: e.target.value })}
            placeholder="Ej: Gracias por llamar, que tengas un buen día."
            style={inputStyle}
          />
        </Field>

        {/* Todavía no hay ninguna heurística real para distinguir un buzón
            de voz de una persona atendiendo (ver la nota en agent.py) — un
            toggle que se puede prender pero que no hace nada es peor que no
            tenerlo, porque el negocio cree que está protegido y no lo está.
            Deshabilitado a propósito, marcado "Próximamente" en vez de
            escondido del todo -- así el negocio sabe que existe y que
            todavía no funciona, no que se le ocultó algo. Si alguien ya
            tenía el campo en true de antes de este cambio, el mensaje sigue
            visible para no perder ese dato, aunque el toggle en sí ya no se
            pueda tocar. */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Todavía no hay ninguna forma confiable de detectar un buzón de voz real — en construcción."
            style={{
              ...toggleStyle,
              flexShrink: 0,
              cursor: "not-allowed",
              opacity: 0.55,
              background: config.voicemail_detection_enabled ? "var(--success)" : "var(--border)",
            }}
          >
            <span
              style={{
                ...toggleKnobStyle,
                transform: config.voicemail_detection_enabled ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)" }}>
            Detectar buzón de voz
          </span>
          <span className="bubble54-pill amber">
            <span className="dot" />
            Próximamente
          </span>
        </div>
        <p style={fieldHintStyle}>
          Todavía estamos construyendo una forma confiable de distinguir un buzón de voz real de una persona
          atendiendo — por ahora este campo no hace nada, aunque lo actives.
        </p>
        {config.voicemail_detection_enabled && (
          <Field label="Mensaje a dejar en el buzón">
            <input
              value={config.voicemail_message}
              onChange={(e) => onChange({ voicemail_message: e.target.value })}
              placeholder="Ej: Te llamamos de Crating Express, te devolvemos la llamada pronto."
              style={inputStyle}
            />
          </Field>
        )}
      </Section>

      {isAgency && (
        <AdvancedSection>
          <Section title="Telefonía">
            <Row>
              <Field label="Proveedor de telefonía">
                <select
                  value={config.telephony_provider}
                  onChange={(e) => onChange({ telephony_provider: e.target.value })}
                  style={inputStyle}
                >
                  {catalog.telephony_providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="SIP trunk / ID de configuración (opcional)">
                <input
                  value={config.telephony_trunk_id}
                  onChange={(e) => onChange({ telephony_trunk_id: e.target.value })}
                  placeholder="Sin configurar todavía"
                  style={inputStyle}
                />
              </Field>
            </Row>
            <Field label="Dónde corre el agente (worker de LiveKit Agents)">
              <select
                value={config.runtime_target}
                onChange={(e) => onChange({ runtime_target: e.target.value })}
                style={inputStyle}
              >
                {catalog.runtime_targets.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
          </Section>

          <Section title="Reconocimiento de voz (STT)">
            <Row>
              <Field label="Proveedor">
                <select
                  value={config.stt_provider}
                  onChange={(e) => handleSttProviderChange(e.target.value)}
                  style={inputStyle}
                >
                  {catalog.stt_providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Modelo">
                <select
                  value={config.stt_model}
                  onChange={(e) => onChange({ stt_model: e.target.value })}
                  style={inputStyle}
                >
                  {sttModels.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </Field>
            </Row>
            <Field label="API key propia de IA (opcional)">
              <input
                type="password"
                value={config.ai_api_key}
                onChange={(e) => onChange({ ai_api_key: e.target.value })}
                placeholder="Dejar vacío para usar la key compartida de la plataforma"
                style={inputStyle}
              />
            </Field>
          </Section>
        </AdvancedSection>
      )}
      </div>

      <button ref={saveBtnRef} type="submit" disabled={saving} className="bubble54-btn">
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function Section({ title, hint, full, children }) {
  return (
    <div className="bubble54-panel" style={{ padding: 20, gridColumn: full ? "1 / -1" : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", marginBottom: hint ? 4 : 14 }}>
        {title}
      </div>
      {hint && <p style={sectionHintStyle}>{hint}</p>}
      <div style={{ display: "grid", gap: 14 }}>{children}</div>
    </div>
  );
}

// Agrupa lo que es configuración técnica de una sola vez (telefonía, SIP,
// reconocimiento de voz, API key propia) — plegado por default para que la
// personalización real (número, modelo de IA, voz) no quede enterrada entre
// términos de infraestructura que a nadie no técnico le importan seguido.
function AdvancedSection({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ gridColumn: "1 / -1", display: "grid", gap: 16 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={advancedToggleStyle}
      >
        <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s ease" }}>▸</span>
        {open ? "Ocultar configuración técnica" : "Configuración técnica (telefonía, reconocimiento de voz)"}
      </button>
      {open && <div style={gridStyle}>{children}</div>}
    </div>
  );
}

function Row({ children }) {
  return <div className="bubble54-form-row-2" style={{ display: "grid", gap: 14 }}>{children}</div>;
}

function Field({ label, hint, children }) {
  // El label envuelve el campo (en vez de ser un hermano suelto) para que
  // quede asociado de verdad — sin esto, un lector de pantalla nunca anuncia
  // qué campo es cuál, aunque se vea bien a simple vista. `hint` es texto de
  // ayuda en criollo debajo del campo -- para quien no sabe qué significa
  // "proveedor" o "corte por silencio" sin haberlo armado uno mismo.
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {hint && <span style={fieldHintStyle}>{hint}</span>}
    </label>
  );
}

function bannerStyle(kind) {
  const isDanger = kind === "danger";
  return {
    fontSize: 13,
    padding: "10px 14px",
    borderRadius: 8,
    background: isDanger ? "#fef2f2" : "#f0fdf4",
    color: isDanger ? "var(--danger)" : "var(--success)",
  };
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
  gap: 20,
  alignItems: "start",
};

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

const fieldHintStyle = {
  display: "block",
  marginTop: 5,
  fontSize: 11,
  fontWeight: 400,
  color: "var(--ink-softer)",
  lineHeight: 1.4,
};

const sectionHintStyle = {
  fontSize: 11.5,
  color: "var(--ink-softer)",
  lineHeight: 1.45,
  margin: "0 0 12px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
  background: "var(--white)",
};

const advancedToggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "fit-content",
  background: "none",
  border: "none",
  padding: "4px 0",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  cursor: "pointer",
};

const toggleStyle = {
  width: 44,
  height: 24,
  borderRadius: 12,
  border: "none",
  position: "relative",
  cursor: "pointer",
  padding: 0,
  transition: "background 0.15s ease",
};

const templateConfirmBoxStyle = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 8,
  background: "#FFFBEB",
  border: "1px solid #FDE68A",
  display: "grid",
  gap: 8,
};

const cancelLinkStyle = {
  background: "none",
  border: "none",
  color: "var(--ink-soft)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
};

const toggleKnobStyle = {
  position: "absolute",
  top: 2,
  left: 0,
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#fff",
  transition: "transform 0.15s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};
