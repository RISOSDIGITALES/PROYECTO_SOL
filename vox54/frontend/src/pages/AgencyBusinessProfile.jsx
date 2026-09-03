import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import BusinessProfileForm from "../components/BusinessProfileForm";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";

// El conocimiento real de un negocio puntual — separada de
// AgencyBusinessDetail (identidad) y de AgencyBotConfig (infraestructura del
// bot), mismo criterio ya usado para esa última: cada pantalla, un trabajo.
export default function AgencyBusinessProfile() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getBusinessProfile(session.access_token, id).then(setProfile).catch((e) => setError(e.message));
  }, [session, id]);

  function handleChange(patch) {
    setProfile((prev) => ({ ...prev, ...patch }));
    setSavedMessage("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSavedMessage("");
    setSaving(true);
    try {
      const updated = await api.updateBusinessProfile(session.access_token, id, {
        description: profile.description,
        hours: profile.hours,
        products_services: profile.products_services,
      });
      setProfile(updated);
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
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "36px 32px" }}>
        <Link to={`/agencia/negocios/${id}`} style={backLink}>
          ← Volver a {profile?.name || "negocio"}
        </Link>
        <h1 style={{ fontSize: 22, color: "var(--ink)", margin: "8px 0 4px" }}>
          Perfil del negocio
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          {profile?.name ? `Qué sabe el agente de voz sobre ${profile.name}.` : "Cargando…"}
        </p>

        {profile ? (
          <BusinessProfileForm
            profile={profile}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
            savedMessage={savedMessage}
            error={error}
          />
        ) : (
          !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando…</div>
        )}
        {error && !profile && <div style={{ color: "var(--danger)" }}>{error}</div>}
      </div>
    </AgencyShell>
  );
}

const backLink = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  textDecoration: "none",
};
