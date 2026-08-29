import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../AuthContext";
import { api } from "../api";

const AI_PROVIDERS = ["groq", "openai", "anthropic", "gemini"];

export default function BusinessDashboard() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/negocio/login");
      return;
    }
    api.businessMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getBotConfig(session.access_token).then(setConfig).catch((e) => setError(e.message));
  }, [session]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      const updated = await api.updateBotConfig(session.access_token, config);
      setConfig(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

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
        <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>
          {me?.business_name || "…"}
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Configuración de tu agente de voz.
        </p>

        {error && <div style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</div>}
        {saved && (
          <div style={{ color: "var(--success)", marginBottom: 12, fontSize: 13.5 }}>
            Guardado correctamente.
          </div>
        )}

        {config && (
          <form onSubmit={handleSave} style={{ display: "grid", gap: 16, background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
            <div>
              <label style={labelStyle}>Modelo de IA</label>
              <select
                value={config.ai_provider}
                onChange={(e) => setConfig({ ...config, ai_provider: e.target.value })}
                style={inputStyle}
              >
                {AI_PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Nombre del modelo</label>
              <input
                value={config.ai_model}
                onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Prompt del bot</label>
              <textarea
                value={config.system_prompt}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                rows={5}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font)" }}
              />
            </div>
            <button type="submit" style={buttonStyle}>Guardar cambios</button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
};

const buttonStyle = {
  background: "var(--g54-blue)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
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
