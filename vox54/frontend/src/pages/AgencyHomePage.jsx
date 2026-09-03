import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { firstName } from "../utils";

// Landing real de la agencia (vive en /agencia) — bienvenida + progreso de
// arranque + un resumen rápido del estado de los agentes. "Negocios" (la
// grilla para entrar a cada uno) se corrió a /agencia/negocios — esta
// pantalla es la puerta de entrada, no el trabajo del día a día.
//
// El checklist de "Primeros pasos" nunca inventa su propio estado — cada
// paso se marca hecho leyendo negocios/agentes reales (¿hay al menos un
// negocio? ¿algún bot ya tiene número? ¿algún bot ya está activo?), y el
// link de cada paso apunta al negocio real al que le falta ese paso
// puntual cuando se puede identificar uno. Una vez que los 3 pasos están
// completos, el checklist deja de mostrarse — no tiene sentido un TODO
// permanente para una agencia que ya está en marcha.
export default function AgencyHomePage() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [businesses, setBusinesses] = useState(null);
  const [agents, setAgents] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.listBusinesses(session.access_token).then(setBusinesses).catch((e) => setError(e.message));
    api.listAgents(session.access_token).then(setAgents).catch((e) => setError(e.message));
  }, [session]);

  if (!session) return null;

  const loading = businesses === null || agents === null;
  const hasBusiness = !loading && businesses.length > 0;
  const businessWithoutPhone = !loading ? agents.find((a) => !a.phone_number) : null;
  const businessReadyToActivate = !loading ? agents.find((a) => a.phone_number && a.bot_status !== "active") : null;
  const hasActiveBot = !loading && agents.some((a) => a.bot_status === "active");

  const steps = loading
    ? []
    : [
        {
          done: hasBusiness,
          label: "Creá tu primer negocio",
          detail: "Un negocio es un cliente con su propio bot de voz.",
          to: "/agencia/negocios",
        },
        {
          done: hasBusiness && !businessWithoutPhone,
          label: "Asigná un número de teléfono",
          detail: businessWithoutPhone
            ? `Falta en ${businessWithoutPhone.business_name}.`
            : "Cada bot necesita un número real para poder recibir llamadas.",
          to: businessWithoutPhone ? `/agencia/negocios/${businessWithoutPhone.business_id}/bot` : "/agencia/negocios",
        },
        {
          done: hasActiveBot,
          label: "Activá el bot cuando esté listo",
          detail: businessReadyToActivate
            ? `${businessReadyToActivate.business_name} ya tiene número — falta activarlo.`
            : "Un bot pausado no atiende ninguna llamada real.",
          to: businessReadyToActivate
            ? `/agencia/negocios/${businessReadyToActivate.business_id}/bot`
            : "/agencia/negocios",
        },
      ];
  const allDone = steps.length > 0 && steps.every((s) => s.done);

  const total = loading ? 0 : agents.length;
  const active = loading ? 0 : agents.filter((a) => a.bot_status === "active").length;
  const paused = total - active;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={eyebrowStyle}>Inicio</div>
          <h1 style={{ fontSize: 22, color: "var(--ink)", margin: "4px 0" }}>Hola, {me ? firstName(me) || me.name : "…"}</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
            Esto es lo que está pasando hoy en {me?.agency_name || "tu agencia"}.
          </p>
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        <div style={gridStyle}>
          {!loading && !allDone && (
            <Card title="Primeros pasos">
              <div style={{ display: "grid", gap: 8 }}>
                {steps.map((s) => (
                  <Link key={s.label} to={s.to} className="vox54-steprow" style={stepRowStyle}>
                    <span style={s.done ? stepDotDoneStyle : stepDotPendingStyle}>{s.done ? "✓" : ""}</span>
                    <span style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--ink)",
                          textDecoration: s.done ? "line-through" : "none",
                          opacity: s.done ? 0.55 : 1,
                        }}
                      >
                        {s.label}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-softer)" }}>{s.detail}</div>
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {!loading && allDone && (
            <div className="vox54-panel" style={{ padding: 20, display: "flex", alignItems: "center", gap: 14, gridColumn: "1 / -1" }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                  Ya tenés al menos un bot activo y funcionando.
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Podés seguir sumando negocios cuando quieras.</div>
              </div>
            </div>
          )}

          <div className="vox54-panel" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)" }}>
                Resumen de agentes
              </div>
              <Link to="/agencia/agentes" style={{ fontSize: 12, color: "var(--g54-blue)", fontWeight: 700, textDecoration: "none" }}>
                Ver inventario completo →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <StatCard label="Agentes" value={loading ? "…" : total} />
              <StatCard label="Activos" value={loading ? "…" : active} hue="#16A34A" />
              <StatCard label="Pausados" value={loading ? "…" : paused} hue="#6B7280" />
            </div>
          </div>
        </div>
      </div>
    </AgencyShell>
  );
}

function Card({ title, children }) {
  return (
    <div className="vox54-panel" style={{ padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, hue = "var(--g54-blue)" }) {
  return (
    <div style={{ ...statCardStyle, borderLeft: `3px solid ${hue}` }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
  gap: 20,
  alignItems: "start",
};

const eyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "var(--g54-blue)",
};

const stepRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "8px 10px",
  borderRadius: 10,
  textDecoration: "none",
};

const stepDotBase = {
  flexShrink: 0,
  width: 20,
  height: 20,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 800,
  marginTop: 1,
};

const stepDotDoneStyle = {
  ...stepDotBase,
  background: "#16A34A",
  color: "#fff",
};

const stepDotPendingStyle = {
  ...stepDotBase,
  border: "2px solid var(--border)",
};

const statCardStyle = {
  padding: "14px 16px",
  borderRadius: 10,
  background: "var(--surface)",
};
