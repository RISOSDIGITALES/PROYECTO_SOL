import { useEffect, useRef } from "react";
import { burst } from "../burst";

// El conocimiento real de un negocio — a qué se dedica, cuándo atiende, qué
// vende — separado a propósito de BotConfigForm (infraestructura del bot:
// telefonía/STT/TTS/modelo/prompt). Reusado tanto por la agencia (edita el
// perfil de cualquier negocio suyo) como por el propio negocio (edita el
// suyo) — a diferencia de BotConfigForm, acá no hace falta ningún `scope`:
// ninguno de estos 3 campos es infraestructura sensible, así que ambos lados
// ven y editan exactamente lo mismo.
export default function BusinessProfileForm({ profile, onChange, onSave, saving, savedMessage, error }) {
  // El botón estalla (sin desaparecer) cuando el guardado se confirmó de
  // verdad — savedMessage lo pone el padre solo tras una respuesta real del
  // servidor, nunca en el click en sí, para no festejar un guardado que
  // todavía puede fallar.
  const saveBtnRef = useRef(null);
  useEffect(() => {
    if (savedMessage) burst(saveBtnRef.current);
  }, [savedMessage]);

  return (
    <form onSubmit={onSave} style={{ display: "grid", gap: 20 }}>
      {error && <div style={bannerStyle("danger")}>{error}</div>}
      {savedMessage && <div style={bannerStyle("success")}>{savedMessage}</div>}

      <div className="vox54-panel" style={{ padding: 20, display: "grid", gap: 16 }}>
        <Field label="Resumen del negocio (a qué se dedica)">
          <textarea
            value={profile.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={4}
            placeholder="Ej: Empresa de embalajes de madera a medida en Miami, especializada en carga industrial y de exportación."
            style={textareaStyle}
          />
        </Field>

        <Field label="Horario de atención">
          <textarea
            value={profile.hours}
            onChange={(e) => onChange({ hours: e.target.value })}
            rows={2}
            placeholder="Ej: Lunes a viernes 8am–5pm, sábados 9am–1pm"
            style={textareaStyle}
          />
        </Field>

        <Field label="Productos y servicios">
          <textarea
            value={profile.products_services}
            onChange={(e) => onChange({ products_services: e.target.value })}
            rows={5}
            placeholder="Ej: Cajones cerrados a medida, jaulas abiertas, cunas para maquinaria, embalaje certificado para exportación."
            style={textareaStyle}
          />
        </Field>

        <p style={{ fontSize: 12, color: "var(--ink-softer)", margin: 0 }}>
          Esto es lo que tu agente de voz usa como contexto real para responder — cuanto más completo, mejor puede ayudar sin inventar nada.
        </p>
      </div>

      <button ref={saveBtnRef} type="submit" disabled={saving} className="vox54-btn" style={{ justifySelf: "start" }}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      {children}
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

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

const textareaStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
  background: "var(--white)",
  resize: "vertical",
};
