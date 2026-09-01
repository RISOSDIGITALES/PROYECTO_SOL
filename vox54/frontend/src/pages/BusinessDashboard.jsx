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

  if (!session) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="g54-gradient" style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="small" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#fff", fontSize: 13.5 }}>{me?.name}</span>
          <button onClick={() => { logout(); navigate("/negocio/login"); }} style={logoutBtn}>
            Salir
          </button>
        </div>
      </div>

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

        <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <TabButton active={tab === "calls"} onClick={() => setTab("calls")}>Llamadas</TabButton>
          <TabButton active={tab === "config"} onClick={() => setTab("config")}>Configuración</TabButton>
          <TabButton active={tab === "account"} onClick={() => setTab("account")}>Cuenta</TabButton>
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

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        borderBottom: active ? "2px solid var(--g54-blue)" : "2px solid transparent",
        color: active ? "var(--g54-blue)" : "var(--ink-soft)",
        fontWeight: 700,
        fontSize: 13.5,
        padding: "8px 4px",
        marginBottom: -1,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

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

const logoutBtn = {
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#fff",
  borderRadius: 8,
  padding: "6px 14px",
  fontSize: 12.5,
  cursor: "pointer",
};
