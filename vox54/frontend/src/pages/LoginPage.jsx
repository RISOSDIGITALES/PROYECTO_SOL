import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function LoginPage({ role }) {
  const isAgency = role === "agency";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = isAgency
        ? await api.agencyLogin(email, password)
        : await api.businessLogin(email, password);
      login(data);
      navigate(isAgency ? "/agencia" : "/negocio");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--white)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(19,27,46,0.12)",
        }}
      >
        <div
          className="g54-gradient"
          style={{ padding: "32px 32px 26px", display: "flex", flexDirection: "column", gap: 14 }}
        >
          <Logo />
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "#CFE0FF",
            }}
          >
            {isAgency ? "Acceso de agencia" : "Acceso de negocio"}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--danger)", background: "#fef2f2", padding: "10px 12px", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <a
            href={isAgency ? "/negocio/login" : "/agencia/login"}
            style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", textDecoration: "none" }}
          >
            {isAgency ? "¿Sos un negocio? Entrar por acá" : "¿Sos parte de la agencia? Entrar por acá"}
          </a>
        </form>
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
