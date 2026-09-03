import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import { OutcomeBadge } from "../components/CallsList";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { formatDateLong, formatDuration, parseTranscript } from "../callFormat";

// El detalle real de una llamada — todo lo que "Registros" no puede mostrar
// en una fila de tabla: metadata completa (negocio, cuándo, cuánto duró,
// número, cómo terminó) más la transcripción completa abajo. Mismo formato
// de transcripción que ya usa CallsList (vía callFormat), para que se vea
// exactamente igual en los dos lugares.
export default function AgencyCallDetail() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const { callId } = useParams();
  const [me, setMe] = useState(null);
  const [call, setCall] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getAgencyCall(session.access_token, callId).then(setCall).catch((e) => setError(e.message));
  }, [session, callId]);

  if (!session) return null;

  const messages = call ? parseTranscript(call.transcript) : [];

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 40px" }}>
        <Link to="/agencia/registros" style={backLink}>← Volver a Registros</Link>

        {error && <div style={{ color: "var(--danger)", margin: "16px 0" }}>{error}</div>}

        {!call && !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: 16 }}>Cargando…</div>}

        {call && (
          <>
            <div className="vox54-panel" style={{ padding: 24, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
                <div>
                  <h1 style={{ fontSize: 19, color: "var(--ink)", margin: 0 }}>{call.business_name}</h1>
                  <div style={{ fontSize: 12.5, color: "var(--ink-softer)", marginTop: 3 }}>Llamada #{call.id}</div>
                </div>
                <OutcomeBadge outcome={call.outcome} />
              </div>

              <div style={metaGridStyle}>
                <MetaRow label="Fecha y hora">{formatDateLong(call.started_at)}</MetaRow>
                <MetaRow label="Duración">{formatDuration(call.duration_seconds)}</MetaRow>
                <MetaRow label="Número">{call.caller_number || "No disponible"}</MetaRow>
                <MetaRow label="Terminó">{formatDateLong(call.ended_at)}</MetaRow>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", marginBottom: 10 }}>
                Transcripción
              </div>
              {messages.length === 0 ? (
                <div className="vox54-panel" style={{ padding: "24px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                    No hay transcripción disponible para esta llamada.
                  </div>
                </div>
              ) : (
                <div className="vox54-panel" style={{ padding: "16px 20px", display: "grid", gap: 10 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ fontSize: 13, display: "flex", gap: 10 }}>
                      <span style={{ fontWeight: 700, color: m.role === "assistant" ? "var(--g54-blue)" : "var(--ink-soft)", flexShrink: 0, minWidth: 60 }}>
                        {m.role === "assistant" ? "Bot" : m.role === "user" ? "Cliente" : m.role}
                      </span>
                      <span style={{ color: "var(--ink)" }}>{m.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AgencyShell>
  );
}

function MetaRow({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-softer)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{children}</div>
    </div>
  );
}

const backLink = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  textDecoration: "none",
};

const metaGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 16,
};
