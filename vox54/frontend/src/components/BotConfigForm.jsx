import { useEffect, useMemo } from "react";

/**
 * Formulario completo de configuración del agente de voz — reusado tanto por el
 * panel de negocio (edita su propio bot) como por el panel de agencia (edita el
 * bot de cualquier negocio suyo). Los desplegables de modelo/voz dependen del
 * proveedor elegido (cascada) — si cambia el proveedor y el valor actual no
 * pertenece a la lista nueva, se ajusta solo al primero disponible.
 */
export default function BotConfigForm({ config, catalog, onChange, onSave, saving, savedMessage, error }) {
  const aiModels = useMemo(() => {
    const provider = catalog.ai_providers.find((p) => p.id === config.ai_provider);
    return provider ? provider.models : [];
  }, [catalog, config.ai_provider]);

  const voices = useMemo(() => {
    const provider = catalog.voice_providers.find((p) => p.id === config.voice_provider);
    return provider ? provider.voices : [];
  }, [catalog, config.voice_provider]);

  // Un negocio recién creado guarda voice_id/ai_model vacíos — un <select> con un
  // value que no matchea NINGUNA <option> igual muestra la primera opción en
  // pantalla, sin que el estado real cambie. Sin esta corrección, el desplegable
  // parece tener algo elegido que en realidad nunca se guardó.
  useEffect(() => {
    if (aiModels.length > 0 && !aiModels.some((m) => m.id === config.ai_model)) {
      onChange({ ai_model: aiModels[0].id });
    }
  }, [aiModels, config.ai_model]);

  useEffect(() => {
    if (voices.length > 0 && !voices.some((v) => v.id === config.voice_id)) {
      onChange({ voice_id: voices[0].id });
    }
  }, [voices, config.voice_id]);

  function handleAiProviderChange(newProviderId) {
    const provider = catalog.ai_providers.find((p) => p.id === newProviderId);
    const stillValid = provider && provider.models.some((m) => m.id === config.ai_model);
    onChange({
      ai_provider: newProviderId,
      ai_model: stillValid ? config.ai_model : provider?.models[0]?.id || "",
    });
  }

  function handleVoiceProviderChange(newProviderId) {
    const provider = catalog.voice_providers.find((p) => p.id === newProviderId);
    const stillValid = provider && provider.voices.some((v) => v.id === config.voice_id);
    onChange({
      voice_provider: newProviderId,
      voice_id: stillValid ? config.voice_id : provider?.voices[0]?.id || "",
    });
  }

  const isActive = config.status === "active";

  return (
    <form onSubmit={onSave} style={{ display: "grid", gap: 24 }}>
      {error && <div style={bannerStyle("danger")}>{error}</div>}
      {savedMessage && <div style={bannerStyle("success")}>{savedMessage}</div>}

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

      <Section title="Canal de voz">
        <Row>
          <Field label="Proveedor de voz">
            <select
              value={config.voice_provider}
              onChange={(e) => handleVoiceProviderChange(e.target.value)}
              style={inputStyle}
            >
              {catalog.voice_providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Voz">
            <select
              value={config.voice_id}
              onChange={(e) => onChange({ voice_id: e.target.value })}
              style={inputStyle}
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </Field>
        </Row>
        <Field label="Número de teléfono asignado">
          <input
            value={config.phone_number}
            onChange={(e) => onChange({ phone_number: e.target.value })}
            placeholder="Sin asignar todavía"
            style={inputStyle}
          />
        </Field>
      </Section>

      <Section title="Modelo de IA">
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
        <Field label="API key propia (opcional)">
          <input
            type="password"
            value={config.ai_api_key}
            onChange={(e) => onChange({ ai_api_key: e.target.value })}
            placeholder="Dejar vacío para usar la key compartida de la plataforma"
            style={inputStyle}
          />
        </Field>
      </Section>

      <Section title="Comportamiento del agente">
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
        <Field label="Mensaje de bienvenida">
          <input
            value={config.welcome_message}
            onChange={(e) => onChange({ welcome_message: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Correo de escalación (cuando el bot no sabe algo)">
          <input
            type="email"
            value={config.escalation_email}
            onChange={(e) => onChange({ escalation_email: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Prompt del sistema">
          <textarea
            value={config.system_prompt}
            onChange={(e) => onChange({ system_prompt: e.target.value })}
            rows={6}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font)" }}
          />
        </Field>
      </Section>

      <button type="submit" disabled={saving} style={buttonStyle}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: "grid", gap: 14 }}>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
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

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
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

const buttonStyle = {
  background: "var(--g54-blue)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 14,
  fontWeight: 700,
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

const toggleKnobStyle = {
  position: "absolute",
  top: 2,
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#fff",
  transition: "transform 0.15s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};
