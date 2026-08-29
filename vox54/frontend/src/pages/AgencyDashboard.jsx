import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function AgencyDashboard() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) {
      navigate("/agencia/login");
      return;
    }
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.listBusinesses(session.access_token).then(setBusinesses).catch((e) => setError(e.message));
  }, [session]);

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
        <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>
          Panel de agencia — {me?.agency_name || "…"}
        </h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Negocios que gestionás y sus bots de voz.
        </p>

        {error && <div style={{ color: "var(--danger)" }}>{error}</div>}

        <div style={{ display: "grid", gap: 12 }}>
          {businesses.map((b) => (
            <div key={b.id} style={cardStyle}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>ID {b.id}</div>
            </div>
          ))}
          {businesses.length === 0 && !error && (
            <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Todavía no hay negocios cargados.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "14px 18px",
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
