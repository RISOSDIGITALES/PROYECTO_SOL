import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import StatusPill from "../components/StatusPill";
import CreateBusinessModal from "../components/CreateBusinessModal";
import AgencyProfileRequiredModal from "../components/AgencyProfileRequiredModal";
import { api } from "../api";
import BrandMark from "../components/BrandMark";

export default function AgencyBusinessesPage() {
  // `profile` viene del layout (ya lo pide una sola vez) -- antes esta
  // pantalla volvía a pedirlo por su cuenta en cada navegación acá vía
  // useAgencyProfileDone, mismo tipo de duplicado ya corregido en Inicio.
  const { session, profile } = useOutletContext();
  const [businesses, setBusinesses] = useState([]);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showProfileRequired, setShowProfileRequired] = useState(false);
  const agencyProfileDone = !!(profile && (profile.contact_email || profile.contact_phone || profile.logo_url));

  function handleCreateClick() {
    // Mismo gate que el picker de /agencia/agentes -- sin ningún dato real
    // de contacto/logo en el perfil de la agencia, no tiene sentido dejar
    // crear un negocio nuevo todavía.
    if (agencyProfileDone) setShowCreate(true);
    else setShowProfileRequired(true);
  }

  function refreshBusinesses() {
    api.listBusinesses(session.access_token).then(setBusinesses).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (!session) return;
    refreshBusinesses();
  }, [session]);

  async function handleCreate(form) {
    await api.createBusiness(session.access_token, form);
    setShowCreate(false);
    refreshBusinesses();
  }

  if (!session) return null;

  return (
    <>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>Negocios</h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
              Negocios que gestionás y sus bots de voz.
            </p>
          </div>
          <button onClick={handleCreateClick} className="vox54-btn">+ Crear negocio</button>
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {businesses.map((b) => (
            <Link key={b.id} to={`/agencia/negocios/${b.id}`} className="vox54-card" style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <BrandMark logoUrl={b.logo_url} name={b.name} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-softer)" }}>ID {b.id}</div>
                </div>
              </div>
              <StatusPill status={b.bot_status} />
              <div style={{ fontSize: 12, color: "var(--g54-blue)", fontWeight: 700, marginTop: 16 }}>
                Ver / editar configuración →
              </div>
            </Link>
          ))}
          {businesses.length === 0 && !error && (
            <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Todavía no hay negocios cargados.</div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateBusinessModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
      {showProfileRequired && (
        <AgencyProfileRequiredModal onClose={() => setShowProfileRequired(false)} />
      )}
    </>
  );
}

const cardStyle = {
  display: "block",
  padding: "18px 18px 16px",
  textDecoration: "none",
  color: "var(--ink)",
};

