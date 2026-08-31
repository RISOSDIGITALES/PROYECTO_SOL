import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import BotConfigForm from "../components/BotConfigForm";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";

// Configuración del bot de un negocio puntual — su propia página, separada
// de la identidad del negocio (AgencyBusinessDetail) para que cada pantalla
// tenga un solo trabajo: una decide "qué negocio es", esta otra "cómo se
// comporta su bot".
export default function AgencyBotConfig() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [business, setBusiness] = useState(null);
  const [config, setConfig] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
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

  if (!session) return null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 32px" }}>
        <Link to={`/agencia/negocios/${id}`} style={backLink}>
          ← Volver a {business?.name || "negocio"}
        </Link>
        <h1 style={{ fontSize: 22, color: "var(--ink)", margin: "8px 0 4px" }}>
          Configuración del bot
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          {business?.name ? `Agente de voz de ${business.name}.` : "Cargando…"}
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
    </AgencyShell>
  );
}

const backLink = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  textDecoration: "none",
};
