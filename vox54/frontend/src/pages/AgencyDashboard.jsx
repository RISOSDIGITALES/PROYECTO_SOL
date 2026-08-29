import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import CreateBusinessModal from "../components/CreateBusinessModal";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";

export default function AgencyDashboard() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  function refreshBusinesses() {
    api.listBusinesses(session.access_token).then(setBusinesses).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    refreshBusinesses();
  }, [session]);

  async function handleCreate(form) {
    await api.createBusiness(session.access_token, form);
    setShowCreate(false);
    refreshBusinesses();
  }

  if (!session) return null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="g54-gradient" style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="small" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#fff", fontSize: 13.5 }}>{me?.name}</span>
          <button onClick={() => { logout(); navigate("/agencia/login"); }} style={logoutBtn}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>
              Panel de agencia — {me?.agency_name || "…"}
            </h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
              Negocios que gestionás y sus bots de voz.
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} style={createBtn}>+ Crear negocio</button>
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "grid", gap: 12 }}>
          {businesses.map((b) => (
            <Link key={b.id} to={`/agencia/negocios/${b.id}`} style={cardStyle}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>ID {b.id} — ver / editar configuración →</div>
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
    </div>
  );
}

const cardStyle = {
  display: "block",
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "14px 18px",
  textDecoration: "none",
  color: "var(--ink)",
};

const createBtn = {
  background: "var(--g54-blue)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 13.5,
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
