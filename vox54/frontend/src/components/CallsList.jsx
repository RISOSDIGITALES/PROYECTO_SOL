import { useState } from "react";

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
      <div style={emptyStateStyle}>
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
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
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

function OutcomeBadge({ outcome }) {
  const cfg = OUTCOME_CONFIG[outcome] || { label: outcome, color: "var(--ink-softer)", bg: "rgba(156,163,175,0.14)" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

const OUTCOME_CONFIG = {
  completed: { label: "Completada", color: "var(--success)", bg: "rgba(34,197,94,0.1)" },
  transferred: { label: "Transferida", color: "var(--g54-blue)", bg: "rgba(45,91,255,0.1)" },
  max_duration_reached: { label: "Cortada por duración", color: "#b45309", bg: "rgba(217,119,6,0.12)" },
  error: { label: "Error", color: "var(--danger)", bg: "rgba(239,68,68,0.1)" },
};

function parseTranscript(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return parsed
      .filter((item) => item.type === "message" && Array.isArray(item.content))
      .map((item) => ({ role: item.role, content: item.content.join(" ") }));
  } catch {
    return [];
  }
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso) {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return d.toLocaleString("es-NI", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const emptyStateStyle = {
  background: "var(--white)",
  border: "1px dashed var(--border)",
  borderRadius: 12,
  padding: "32px 20px",
  textAlign: "center",
};
