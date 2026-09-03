import { useState } from "react";
import { parseTranscript, formatDuration, formatDate, OUTCOME_LABEL, OUTCOME_HUE } from "../callFormat";

// Visibilidad de resultado — antes de esto, un negocio configuraba su bot y
// nunca se enteraba de qué pasaba con ninguna llamada real. Reusado tanto
// por el negocio (sus propias llamadas) como por la agencia (las de
// cualquier negocio suyo) — mismos datos reales, misma tabla, sin ninguna
// llamada de ejemplo inventada: si `calls` viene vacío, es porque
// todavía no hubo ninguna llamada real, y así se dice.
export default function CallsList({ calls, loading, error }) {
  if (loading) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando llamadas…</div>;
  }
  if (error) {
    return <div style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</div>;
  }
  if (!calls || calls.length === 0) {
    return (
      <div className="vox54-panel" style={emptyStateStyle}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>📞</div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 4 }}>
          Todavía no hubo ninguna llamada
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
          En cuanto el agente atienda una llamada real, va a aparecer acá.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {calls.map((call) => (
        <CallRow key={call.id} call={call} />
      ))}
    </div>
  );
}

function CallRow({ call }) {
  const [open, setOpen] = useState(false);
  const messages = parseTranscript(call.transcript);

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => messages.length > 0 && setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 16px",
          background: "none",
          border: "none",
          textAlign: "left",
          cursor: messages.length > 0 ? "pointer" : "default",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{formatDate(call.started_at)}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-softer)" }}>{call.caller_number || "Número no disponible"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{formatDuration(call.duration_seconds)}</span>
          <OutcomeBadge outcome={call.outcome} />
          {messages.length > 0 && (
            <span style={{ fontSize: 11, color: "var(--ink-softer)", transform: open ? "rotate(90deg)" : "none", display: "inline-block" }}>
              →
            </span>
          )}
        </div>
      </button>

      {open && messages.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", background: "var(--surface)", display: "grid", gap: 8 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ fontSize: 12.5, display: "flex", gap: 8 }}>
              <span style={{ fontWeight: 700, color: m.role === "assistant" ? "var(--g54-blue)" : "var(--ink-soft)", flexShrink: 0, minWidth: 60 }}>
                {m.role === "assistant" ? "Bot" : m.role === "user" ? "Cliente" : m.role}
              </span>
              <span style={{ color: "var(--ink)" }}>{m.content}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Exportado — Registros (lista y detalle de llamadas a nivel de agencia)
// reusa este mismo badge, en vez de duplicar el mapeo outcome→color.
export function OutcomeBadge({ outcome }) {
  const hue = OUTCOME_HUE[outcome] || "gray";
  const label = OUTCOME_LABEL[outcome] || outcome;
  return <span className={`vox54-pill ${hue}`}>{label}</span>;
}

const emptyStateStyle = {
  border: "1px dashed var(--border)",
  padding: "32px 20px",
  textAlign: "center",
};
