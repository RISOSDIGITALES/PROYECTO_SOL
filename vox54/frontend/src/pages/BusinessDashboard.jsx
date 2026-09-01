import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import BotConfigForm from "../components/BotConfigForm";
import CallsList from "../components/CallsList";
import ChangePasswordForm from "../components/ChangePasswordForm";
import StatusPill from "../components/StatusPill";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { initials } from "../utils";

// Mismo tratamiento de menú que AgencyShell — dock de burbujas abajo,
// nada de sidebar ni de tabs planas. Acá las 3 secciones (Llamadas,
// Configuración, Cuenta) son estado local, no rutas reales — el dock
// hace de tabs, no de <Link>. Layout idéntico al de AgencyShell (columna
// flex 100vh, <main> con su propio scroll) por la misma razón: el dock
// nunca puede terminar tapando contenido, sin importar el largo de cada
// sección — ver el ítem del 01-sep en CLAUDE.md si hace falta el porqué.
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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="g54-gradient" style={topbarStyle}>
        <Logo size="small" />
        <span style={{ color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{me?.name}</span>
      </div>

      <main style={mainScrollStyle}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
          <div style={identityCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={avatarStyle}>{initials(me?.business_name)}</div>
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
              <div style={accountCardStyle}>
                <div style={accountCardTitleStyle}>Tu cuenta</div>
                <Row label="Nombre">{me?.name}</Row>
                <Row label="Correo">{me?.email}</Row>
              </div>

              <div style={accountCardStyle}>
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
                <div style={{ ...accountCardStyle, background: "#eef4ff" }}>
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

      <nav className="vox54-bubblefield" aria-label="Navegación de negocio">
        <span className="vox54-amb" style={{ width: 14, height: 14, left: "6%", bottom: 92, animationDelay: "-1.2s" }} />
        <span className="vox54-amb green" style={{ width: 9, height: 9, left: "14%", bottom: 40, animationDelay: "-2.7s", filter: "blur(0.4px)" }} />
        <span className="vox54-amb" style={{ width: 20, height: 20, left: "24%", bottom: 110, animationDelay: "-0.4s", filter: "blur(0.5px)" }} />
        <span className="vox54-amb violet" style={{ width: 10, height: 10, left: "36%", bottom: 28, animationDelay: "-4.1s" }} />
        <span className="vox54-amb green" style={{ width: 11, height: 11, right: "32%", bottom: 100, animationDelay: "-3.4s" }} />
        <span className="vox54-amb violet" style={{ width: 15, height: 15, right: "22%", bottom: 115, animationDelay: "-1.5s", filter: "blur(0.4px)" }} />
        <span className="vox54-amb" style={{ width: 16, height: 16, right: "16%", bottom: 50, animationDelay: "-1.8s" }} />
        <span className="vox54-amb" style={{ width: 8, height: 8, right: "9%", bottom: 108, animationDelay: "-2.2s" }} />
        <span className="vox54-amb green" style={{ width: 13, height: 13, right: "6%", bottom: 70, animationDelay: "-0.9s" }} />

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
      </nav>
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

const topbarStyle = {
  flexShrink: 0,
  padding: "14px 28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 20,
};

const avatarStyle = {
  width: 40,
  height: 40,
  flexShrink: 0,
  borderRadius: 10,
  background: "var(--g54-blue)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const accountCardStyle = {
  display: "grid",
  gap: 14,
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
};

const accountCardTitleStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-soft)",
};
