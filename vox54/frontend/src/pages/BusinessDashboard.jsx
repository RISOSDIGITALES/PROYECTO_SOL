import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import BotConfigForm from "../components/BotConfigForm";
import CallsList from "../components/CallsList";
import ChangePasswordForm from "../components/ChangePasswordForm";
import PoppableBubbles from "../components/PoppableBubbles";
import StatusPill from "../components/StatusPill";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { initials } from "../utils";

// Mismo tratamiento de menú que AgencyShell — vuelve a vivir a la
// izquierda, sobre el fondo azul degradado real, en vez del dock flotando
// abajo sobre blanco (donde el vidrio translúcido casi no se veía). Acá
// las 4 secciones (Llamadas, Configuración, Cuenta, Salir) son estado
// local, no rutas reales — la barra hace de tabs, no de <Link>.

// Burbujas decorativas de fondo de la barra — datos en vez de JSX repetido;
// el estado del estallido/reaparición vive en PoppableBubbles, compartido
// con el login. Nunca son las burbujas de navegación reales (Llamadas/
// Configuración/Cuenta/Salir) — esas siguen con su propio squish de
// siempre, tienen que quedarse ahí para poder navegar.
const DOCK_BUBBLES = [
  { id: "d1", size: 16, style: { left: "8%", top: "4%" }, delay: "-1.2s" },
  { id: "d2", size: 10, hue: "green", style: { right: "10%", top: "13%" }, delay: "-2.7s" },
  { id: "d3", size: 22, style: { left: "-14%", top: "24%", filter: "blur(0.5px)" }, delay: "-0.4s" },
  { id: "d4", size: 11, hue: "violet", style: { right: "-10%", top: "37%" }, delay: "-4.1s" },
  { id: "d5", size: 13, hue: "green", style: { left: "4%", top: "50%" }, delay: "-3.4s" },
  { id: "d6", size: 19, hue: "violet", style: { right: "6%", top: "63%", filter: "blur(0.4px)" }, delay: "-1.5s" },
  { id: "d7", size: 21, style: { left: "-12%", top: "75%" }, delay: "-1.8s" },
  { id: "d8", size: 9, style: { right: "16%", top: "87%" }, delay: "-2.2s" },
  { id: "d9", size: 15, hue: "green", style: { left: "10%", top: "95%" }, delay: "-0.9s" },
];

export default function BusinessDashboard() {
  const { logout } = useAuth();
  const session = useRequireRole("business");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [config, setConfig] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  // "Llamadas" primero, no "Configuración" — lo que le importa a un cliente
  // real es qué pasó, no ajustar perillas; la config queda a un clic.
  const [tab, setTab] = useState("calls");
  const [calls, setCalls] = useState(null);
  const [callsError, setCallsError] = useState("");
  const [poppingId, setPoppingId] = useState(null);

  useEffect(() => {
    if (!session) return;
    api.businessMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getBotConfig(session.access_token).then(setConfig).catch((e) => setError(e.message));
    api.getCatalog().then(setCatalog).catch((e) => setError(e.message));
    api.listCalls(session.access_token).then(setCalls).catch((e) => setCallsError(e.message));
  }, [session]);

  function handleChange(patch) {
    setConfig((prev) => ({ ...prev, ...patch }));
    setSavedMessage("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSavedMessage("");
    setSaving(true);
    try {
      const updated = await api.updateBotConfig(session.access_token, config);
      setConfig(updated);
      setSavedMessage("Guardado correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function goTo(id) {
    setPoppingId(id);
    setTimeout(() => setPoppingId(null), 500);
    if (id === "salir") {
      logout();
      navigate("/negocio/login");
      return;
    }
    setTab(id);
  }

  if (!session) return null;

  // Nunca un badge inventado — cuenta llamadas reales que terminaron en
  // error, un dato real que sí vale la pena que el negocio note de un
  // vistazo. Sin ninguna, no se muestra ningún aviso.
  const errorCallsCount = calls ? calls.filter((c) => c.outcome === "error").length : 0;

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <nav className="vox54-sidebar g54-gradient" aria-label="Navegación de negocio">
        <PoppableBubbles bubbles={DOCK_BUBBLES} />

        <div className="vox54-sidebar-brand"><Logo size="small" /></div>

        <div className="vox54-sidebar-main">
          <button type="button" className="vox54-navcol" style={{ animationDelay: "-0.6s" }} onClick={() => goTo("calls")}>
            <span className={`vox54-navbubble ${tab === "calls" ? "active" : ""} ${poppingId === "calls" ? "popping" : ""}`}>
              <span className="icon">📞</span>
              {errorCallsCount > 0 && <span className="vox54-notif">{errorCallsCount}</span>}
            </span>
            <span className="vox54-navlabel">Llamadas</span>
          </button>

          <button type="button" className="vox54-navcol" style={{ animationDelay: "-1.9s" }} onClick={() => goTo("config")}>
            <span className={`vox54-navbubble hueB ${tab === "config" ? "active" : ""} ${poppingId === "config" ? "popping" : ""}`}>
              <span className="icon">⚙️</span>
            </span>
            <span className="vox54-navlabel">Configuración</span>
          </button>
        </div>

        <div className="vox54-sidebar-foot">
          <button type="button" className="vox54-navcol" style={{ animationDelay: "-3.1s" }} onClick={() => goTo("account")}>
            <span className={`vox54-navbubble hueC ${tab === "account" ? "active" : ""} ${poppingId === "account" ? "popping" : ""}`}>
              <span className="icon">👤</span>
            </span>
            <span className="vox54-navlabel">Cuenta</span>
          </button>

          <button type="button" className="vox54-navcol" style={{ animationDelay: "-0.2s" }} onClick={() => goTo("salir")}>
            <span className={`vox54-navbubble exit ${poppingId === "salir" ? "popping" : ""}`}>
              <span className="icon">🚪</span>
            </span>
            <span className="vox54-navlabel">Salir</span>
          </button>
        </div>
      </nav>

      <div style={contentColStyle}>
        <div style={topbarStyle}>
          <span style={{ color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 600 }}>{me?.name}</span>
        </div>

        <main style={mainScrollStyle}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
          <div className="vox54-panel" style={identityCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="vox54-avatar" style={avatarStyle}>{initials(me?.business_name)}</div>
              <div>
                <h1 style={{ fontSize: 18, color: "var(--ink)", margin: 0 }}>{me?.business_name || "…"}</h1>
                <div style={{ fontSize: 12, color: "var(--ink-softer)", marginTop: 2 }}>Tu agente de voz</div>
              </div>
            </div>
            {config && <StatusPill status={config.status} />}
          </div>

          {tab === "calls" && <CallsList calls={calls} loading={calls === null && !callsError} error={callsError} />}

          {tab === "config" && (
            config && catalog ? (
              <BotConfigForm
                config={config}
                catalog={catalog}
                onChange={handleChange}
                onSave={handleSave}
                saving={saving}
                savedMessage={savedMessage}
                error={error}
                scope="client"
              />
            ) : (
              !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando…</div>
            )
          )}

          {tab === "account" && (
            <div style={{ display: "grid", gap: 16 }}>
              <div className="vox54-panel" style={accountCardStyle}>
                <div style={accountCardTitleStyle}>Tu cuenta</div>
                <Row label="Nombre">{me?.name}</Row>
                <Row label="Correo">{me?.email}</Row>
              </div>

              <div className="vox54-panel" style={accountCardStyle}>
                <div style={accountCardTitleStyle}>Cambiar contraseña</div>
                <ChangePasswordForm
                  onSubmit={(current, next) =>
                    api.changeBusinessPassword(session.access_token, { current_password: current, new_password: next })
                  }
                />
              </div>

              {/* Nunca inventamos un canal de soporte propio — quien gestiona
                  este negocio es la agencia, así que es a ella a quien hay
                  que avisarle si algo no funciona. */}
              {me?.agency_name && (
                <div className="vox54-panel" style={{ ...accountCardStyle, background: "#eef4ff" }}>
                  <div style={accountCardTitleStyle}>¿Necesitás ayuda?</div>
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                    Este bot lo gestiona <strong style={{ color: "var(--ink)" }}>{me.agency_name}</strong>. Si algo no funciona
                    como esperás o necesitás un cambio que no podés hacer desde acá, contactalos directamente a ellos.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{children}</span>
    </div>
  );
}

const contentColStyle = {
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  height: "100vh",
};

const topbarStyle = {
  flexShrink: 0,
  padding: "14px 28px",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  borderBottom: "1px solid var(--border)",
  background: "var(--white)",
};

const mainScrollStyle = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
};

const identityCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "16px 20px",
  marginBottom: 20,
};

const avatarStyle = {
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: 10,
  fontSize: 14,
};

const accountCardStyle = {
  display: "grid",
  gap: 14,
  padding: 20,
};

const accountCardTitleStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-soft)",
};
