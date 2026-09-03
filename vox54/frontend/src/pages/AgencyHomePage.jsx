import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import StatusPill from "../components/StatusPill";
import Icon from "../components/Icon";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { firstName, initials } from "../utils";
import { formatDate } from "../callFormat";

// Landing real de la agencia (vive en /agencia) — bienvenida + progreso de
// arranque + un resumen rápido de cada sección real del menú. "Negocios"
// (la grilla para entrar a cada uno) se corrió a /agencia/negocios — esta
// pantalla es la puerta de entrada, no el trabajo del día a día.
//
// El checklist de "Primeros pasos" nunca inventa su propio estado — cada
// paso se marca hecho leyendo negocios/agentes reales (¿hay al menos un
// negocio? ¿algún bot ya tiene número? ¿algún bot ya está activo?), y el
// link de cada paso apunta al negocio real al que le falta ese paso
// puntual cuando se puede identificar uno. Una vez que los 3 pasos están
// completos, el checklist deja de mostrarse — no tiene sentido un TODO
// permanente para una agencia que ya está en marcha.
//
// Cada tarjeta de resumen (Agencia/Negocios/Registros/Agentes) toma el
// mismo tono e ícono que su ítem real en el menú lateral (AgencyShell) —
// no son colores decorativos sueltos, son los mismos --glow de theme.css
// (hueE rosa=Agencia, sin hue=azul=Negocios, hueB turquesa=Agentes, hueF
// celeste=Registros) para que la página se sienta como una sola familia
// visual con el menú, no una lista de cajas blancas planas.
const HUE = {
  inicio: "#D97706", // hueD (ámbar) — el propio Inicio, para "Primeros pasos"
  agencia: "#DB2777", // hueE (rosa)
  negocios: "#2D5BFF", // sin hue explícito en el menú = azul de marca
  agentes: "#0D9488", // hueB (turquesa)
  registros: "#0284C7", // hueF (celeste)
};

export default function AgencyHomePage() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [businesses, setBusinesses] = useState(null);
  const [agents, setAgents] = useState(null);
  const [calls, setCalls] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getAgencyProfile(session.access_token).then(setProfile).catch((e) => setError(e.message));
    api.listBusinesses(session.access_token).then(setBusinesses).catch((e) => setError(e.message));
    api.listAgents(session.access_token).then(setAgents).catch((e) => setError(e.message));
    api.listAgencyCalls(session.access_token).then(setCalls).catch((e) => setError(e.message));
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

  const hasContact = profile && (profile.contact_email || profile.contact_phone);
  const mostRecentCall = calls && calls.length > 0 ? calls[0] : null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <div style={heroStyle}>
          <div style={eyebrowStyle}>Inicio</div>
          <h1 style={{ fontSize: 27, color: "var(--ink)", margin: "6px 0 4px" }}>
            Hola, {me ? firstName(me) || me.name : "…"}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0 }}>
            Esto es lo que está pasando hoy en {me?.agency_name || "tu agencia"}.
          </p>
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        <div style={colsStyle}>
          {/* Columna izquierda — lo que hay que hacer, y lo último que pasó */}
          <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
            {!loading && !allDone && (
              <SectionCard title="Primeros pasos" hue={HUE.inicio} icon="home">
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
              </SectionCard>
            )}

            {!loading && allDone && (
              <div className="vox54-panel" style={{ padding: 22, display: "flex", alignItems: "center", gap: 14, borderLeft: `3px solid ${HUE.inicio}` }}>
                <span style={{ fontSize: 26 }}>🎉</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                    Ya tenés al menos un bot activo y funcionando.
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Podés seguir sumando negocios cuando quieras.</div>
                </div>
              </div>
            )}

            <SectionCard title="Registros" hue={HUE.registros} icon="list" linkTo="/agencia/registros" linkLabel="Ver todos →">
              {calls === null ? (
                !error && <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Cargando…</div>
              ) : calls.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Todavía no hubo ninguna llamada real.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                    {calls.length}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginLeft: 8 }}>
                      llamada{calls.length === 1 ? "" : "s"} en total
                    </span>
                  </div>
                  {mostRecentCall && (
                    <div style={{ fontSize: 12.5, color: "var(--ink-softer)" }}>
                      Última: {mostRecentCall.business_name}, {formatDate(mostRecentCall.started_at)}
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Columna derecha — de qué está hecha la cuenta hoy */}
          <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
            <SectionCard title="Resumen de agentes" hue={HUE.agentes} icon="mic" linkTo="/agencia/agentes" linkLabel="Ver inventario completo →">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <StatCard label="Agentes" value={loading ? "…" : total} />
                <StatCard label="Activos" value={loading ? "…" : active} hue="#16A34A" />
                <StatCard label="Pausados" value={loading ? "…" : paused} hue="#6B7280" />
              </div>
            </SectionCard>

            <SectionCard title="Agencia" hue={HUE.agencia} icon="building" linkTo="/agencia/perfil" linkLabel="Ver perfil →">
              {profile ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{profile.name}</div>
                  <div style={{ fontSize: 12.5, color: hasContact ? "var(--success)" : "var(--ink-softer)" }}>
                    {hasContact ? "✓ Contacto configurado" : "Sin correo ni teléfono de contacto cargados todavía"}
                  </div>
                </div>
              ) : (
                !error && <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Cargando…</div>
              )}
            </SectionCard>

            <SectionCard title={`Negocios (${loading ? "…" : businesses.length})`} hue={HUE.negocios} icon="briefcase" linkTo="/agencia/negocios" linkLabel="Ver todos →">
              {loading ? (
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Cargando…</div>
              ) : businesses.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Todavía no gestionás ningún negocio.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {businesses.map((b) => (
                    <Link key={b.id} to={`/agencia/negocios/${b.id}`} className="vox54-steprow" style={businessRowStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div className="vox54-avatar" style={avatarStyle}>{initials(b.name)}</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {b.name}
                        </span>
                      </div>
                      <StatusPill status={b.bot_status} />
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </AgencyShell>
  );
}

// Encabezado consistente para cada tarjeta de resumen — ícono chico en el
// tono real de la sección (mismo --glow que su burbuja en el menú), franja
// de color a la izquierda, y el link "ver más" si aplica. Reemplaza el
// título de texto plano suelto que tenía cada tarjeta antes.
function SectionCard({ title, hue, icon, linkTo, linkLabel, children }) {
  return (
    <div className="vox54-panel" style={{ padding: 22, borderLeft: `3px solid ${hue}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon && (
            <span style={{ ...iconChipStyle, background: `${hue}17`, color: hue }}>
              <Icon name={icon} size={16} />
            </span>
          )}
          <span style={sectionTitleStyle}>{title}</span>
        </div>
        {linkTo && (
          <Link to={linkTo} style={{ ...sectionLinkStyle, color: hue }}>
            {linkLabel}
          </Link>
        )}
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

const heroStyle = {
  marginBottom: 26,
  padding: "24px 28px",
  borderRadius: 20,
  background: "linear-gradient(135deg, rgba(45,91,255,0.07), rgba(45,91,255,0.015) 65%)",
  border: "1px solid rgba(45,91,255,0.12)",
};

// Explícitamente 2 columnas (no una grilla de N tarjetas sueltas) — cada
// columna apila sus propias tarjetas con flujo natural, así que nunca
// queda una celda huérfana al final de la fila por cómo cae el conteo de
// tarjetas, algo que sí pasaba con el auto-fit de tarjetas individuales.
const colsStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
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

const iconChipStyle = {
  width: 28,
  height: 28,
  flexShrink: 0,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
  textDecoration: "none",
};

const businessRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 10,
  textDecoration: "none",
  border: "1px solid var(--border)",
};

const avatarStyle = {
  width: 30,
  height: 30,
  flexShrink: 0,
  borderRadius: 8,
  fontSize: 11.5,
};
