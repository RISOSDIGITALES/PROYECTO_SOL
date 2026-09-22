import Icon from "./Icon";
import { firstName } from "../utils";
import { profileCompleteness } from "../profileCompleteness";
import { formatDate } from "../callFormat";

// Landing real del negocio (tab "Inicio" de BusinessDashboard, ahora la
// pestaña por default) -- espejo de AgencyHomePage, pero sin nada que un
// negocio no controla (no hay "creá tu primer negocio", ya existe uno solo:
// el suyo). Antes de esto, un negocio recién creado entraba directo a
// "Llamadas" (vacío si es nuevo) sin ninguna guía de qué hacer primero.
//
// El checklist nunca inventa su propio estado -- cada paso se deriva de
// datos reales ya cargados por BusinessDashboard (config del bot, el
// perfil, las llamadas), mismo criterio que el checklist de agencia.
export default function BusinessHome({ me, config, profile, calls, onNavigateTab }) {
  const loading = !config || !profile;
  const { percent: profilePercent, missing: profileMissing } = profileCompleteness(profile || {});
  // 80% en vez de 100 -- perfeccionismo no ayuda acá; con 8 de 10 campos
  // reales cargados el bot ya tiene contexto de sobra para responder bien,
  // y forzar el 100% dejaría el checklist "pendiente" para siempre en casos
  // razonables (ej. un negocio sin sitio web propio).
  const profileDone = profilePercent >= 80;
  const hasPhone = !!config?.phone_number;
  const isActive = config?.status === "active";

  const steps = loading
    ? []
    : [
        {
          done: profileDone,
          label: "Completá el perfil de tu negocio",
          detail: profileDone
            ? "Tu agente ya tiene contexto real para responder."
            : `Perfil ${profilePercent}% completo — falta ${profileMissing.slice(0, 2).join(", ")}${profileMissing.length > 2 ? "…" : ""}.`,
          to: "negocio",
        },
        {
          done: hasPhone,
          label: "Asigná tu número de teléfono",
          detail: hasPhone ? `Tu número: ${config.phone_number}` : "Sin número todavía — hace falta para poder recibir llamadas reales.",
          to: "config",
        },
        {
          done: isActive,
          label: "Activá el bot cuando esté listo",
          detail: isActive ? "Atendiendo llamadas ahora mismo." : "Tu bot está pausado — no atiende ninguna llamada real todavía.",
          to: "config",
        },
      ];
  const allDone = steps.length > 0 && steps.every((s) => s.done);

  const mostRecentCall = calls && calls.length > 0 ? calls[0] : null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={heroStyle}>
        <div style={eyebrowStyle}>Inicio</div>
        <h1 style={{ fontSize: 24, color: "var(--ink)", margin: "6px 0 4px" }}>
          Hola, {me ? firstName(me) || me.name : "…"}
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: 0 }}>
          Esto es lo que está pasando hoy con {me?.business_name || "tu negocio"}.
        </p>
      </div>

      {!loading && !allDone && (
        <SectionCard title="Primeros pasos" icon="home">
          <div style={{ display: "grid", gap: 8 }}>
            {steps.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onNavigateTab(s.to)}
                className="bubble54-steprow"
                style={stepRowStyle}
              >
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
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {!loading && allDone && (
        <div className="bubble54-panel" style={{ padding: 22, display: "flex", alignItems: "center", gap: 14, borderLeft: "3px solid #D97706" }}>
          <span style={{ fontSize: 26 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
              Tu bot ya está activo, con número y con un perfil real cargado.
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Podés seguir ajustando lo que quieras desde Configuración.</div>
          </div>
        </div>
      )}

      <SectionCard title="Registros" icon="list" onLinkClick={() => onNavigateTab("calls")} linkLabel="Ver todas →">
        {calls === null ? (
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Cargando…</div>
        ) : calls.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Todavía no hubo ninguna llamada real.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {calls.length}
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginLeft: 8 }}>
                llamada{calls.length === 1 ? "" : "s"} en total
              </span>
            </div>
            {mostRecentCall && (
              <div style={{ fontSize: 12.5, color: "var(--ink-softer)" }}>
                Última: {formatDate(mostRecentCall.started_at)}
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, icon, onLinkClick, linkLabel, children }) {
  return (
    <div className="bubble54-panel" style={{ padding: 22, borderLeft: "3px solid #D97706" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && (
            <span style={iconChipStyle}>
              <Icon name={icon} size={16} />
            </span>
          )}
          <span style={sectionTitleStyle}>{title}</span>
        </div>
        {onLinkClick && (
          <button type="button" onClick={onLinkClick} style={sectionLinkStyle}>
            {linkLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

const heroStyle = {
  padding: "22px 26px",
  borderRadius: 20,
  background: "linear-gradient(135deg, rgba(45,91,255,0.07), rgba(45,91,255,0.015) 65%)",
  border: "1px solid rgba(45,91,255,0.12)",
};

const eyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "var(--g54-blue)",
};

const iconChipStyle = {
  width: 28,
  height: 28,
  flexShrink: 0,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#D9770617",
  color: "#D97706",
};

const stepRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "8px 10px",
  borderRadius: 10,
  background: "none",
  border: "none",
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  font: "inherit",
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

const sectionTitleStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-soft)",
};

const sectionLinkStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#D97706",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
};
