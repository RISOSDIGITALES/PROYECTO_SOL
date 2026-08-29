import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Logo from "../components/Logo";
import BotConfigForm from "../components/BotConfigForm";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function AgencyBusinessDetail() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [config, setConfig] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!session) {
      navigate("/agencia/login");
      return;
    }
    api.getBusinessDetail(session.access_token, id)
      .then((detail) => {
        setBusiness(detail);
        setConfig(detail.bot_config);
      })
      .catch((e) => setError(e.message));
    api.getCatalog().then(setCatalog).catch((e) => setError(e.message));
  }, [session, id]);

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
      const updated = await api.updateBusinessBotConfig(session.access_token, id, config);
      setConfig(updated);
      setSavedMessage("Guardado correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="g54-gradient" style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="small" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#fff", fontSize: 13.5 }}>Agencia</span>
          <button onClick={() => { logout(); navigate("/agencia/login"); }} style={logoutBtn}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
        <Link to="/agencia" style={backLink}>← Volver a negocios</Link>
        <h1 style={{ fontSize: 22, color: "var(--ink)", margin: "8px 0 4px" }}>
          {business?.name || "…"}
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Configuración del agente de voz — vista de agencia.
        </p>

        {config && catalog ? (
          <BotConfigForm
            config={config}
            catalog={catalog}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
            savedMessage={savedMessage}
            error={error}
          />
        ) : (
          !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando…</div>
        )}
        {error && !config && <div style={{ color: "var(--danger)" }}>{error}</div>}
      </div>
    </div>
  );
}

const backLink = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  textDecoration: "none",
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
