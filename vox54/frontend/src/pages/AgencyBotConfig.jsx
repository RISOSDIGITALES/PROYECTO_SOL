import { useEffect, useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import BotConfigForm from "../components/BotConfigForm";
import { api } from "../api";

// Configuración del bot de un negocio puntual — su propia página, separada
// de la identidad del negocio (AgencyBusinessDetail) para que cada pantalla
// tenga un solo trabajo: una decide "qué negocio es", esta otra "cómo se
// comporta su bot".
export default function AgencyBotConfig() {
  const { session } = useOutletContext();
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [config, setConfig] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!session) return;
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

  async function handleActivatePhone(mode) {
    const updated = await api.activateBusinessPhone(session.access_token, id, mode);
    setConfig(updated);
  }

  async function handleVerifyPhoneStart(phoneNumber) {
    await api.verifyBusinessPhoneStart(session.access_token, id, phoneNumber);
    setConfig((prev) => ({ ...prev, own_phone_number: phoneNumber, own_phone_verified: false }));
  }

  async function handleVerifyPhoneCheck(phoneNumber, code) {
    const result = await api.verifyBusinessPhoneCheck(session.access_token, id, phoneNumber, code);
    if (result.verified) setConfig((prev) => ({ ...prev, own_phone_verified: true }));
    return result;
  }

  async function handleReleasePhone() {
    const updated = await api.releaseBusinessPhone(session.access_token, id);
    setConfig(updated);
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
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
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
            onActivatePhone={handleActivatePhone}
            onVerifyPhoneStart={handleVerifyPhoneStart}
            onVerifyPhoneCheck={handleVerifyPhoneCheck}
            onReleasePhone={handleReleasePhone}
            saving={saving}
            savedMessage={savedMessage}
            error={error}
            scope="agency"
          />
        ) : (
          !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando…</div>
        )}
        {error && !config && <div style={{ color: "var(--danger)" }}>{error}</div>}
      </div>
  );
}

const backLink = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  textDecoration: "none",
};
