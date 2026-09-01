import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <div style={pageStyle}>
      <div className="g54-gradient" style={introStyle}>
        <span className="vox54-amb" style={{ width: 26, height: 26, left: "12%", top: "18%", animationDelay: "-1s" }} />
        <span className="vox54-amb green" style={{ width: 14, height: 14, left: "22%", top: "62%", animationDelay: "-2.6s" }} />
        <span className="vox54-amb violet" style={{ width: 34, height: 34, left: "68%", top: "12%", animationDelay: "-0.5s" }} />
        <span className="vox54-amb" style={{ width: 18, height: 18, left: "78%", top: "70%", animationDelay: "-3.3s" }} />
        <span className="vox54-amb green" style={{ width: 10, height: 10, left: "50%", top: "82%", animationDelay: "-1.8s" }} />
        <span className="vox54-amb violet" style={{ width: 12, height: 12, left: "40%", top: "30%", animationDelay: "-4s" }} />

        <div style={introContentStyle}>
          <Logo />
          <div style={eyebrowStyle}>Agentes de voz con IA</div>
          <h1 style={introHeadingStyle}>Atención al cliente que nunca hace esperar.</h1>
          <p style={introCopyStyle}>
            Bubble pone un agente de voz real a cargo de tu teléfono — responde llamadas, resuelve dudas y
            atiende a tus clientes las 24 horas, sin que nadie tenga que levantar el tubo.
          </p>
        </div>
      </div>

      <div style={formSideStyle}>
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={{ marginBottom: 6 }}>
            <div style={formEyebrowStyle}>{isAgency ? "Acceso de agencia" : "Acceso de negocio"}</div>
            <h2 style={formHeadingStyle}>Entrá a tu cuenta</h2>
          </div>

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

          <Link
            to={isAgency ? "/negocio/login" : "/agencia/login"}
            style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", textDecoration: "none" }}
          >
            {isAgency ? "¿Sos un negocio? Entrar por acá" : "¿Sos parte de la agencia? Entrar por acá"}
          </Link>
        </form>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  flexWrap: "wrap",
};

const introStyle = {
  position: "relative",
  overflow: "hidden",
  flex: "1 1 420px",
  display: "flex",
  alignItems: "center",
  padding: "48px 56px",
};

const introContentStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  maxWidth: 420,
};

const eyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: "#CFE0FF",
  marginTop: 10,
};

const introHeadingStyle = {
  fontSize: 32,
  lineHeight: 1.15,
  color: "#fff",
  margin: 0,
};

const introCopyStyle = {
  fontSize: 14.5,
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.82)",
  margin: 0,
};

const formSideStyle = {
  flex: "1 1 380px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--white)",
  padding: 24,
};

const formStyle = {
  width: "100%",
  maxWidth: 340,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const formEyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "var(--g54-blue)",
  marginBottom: 6,
};

const formHeadingStyle = {
  fontSize: 24,
  color: "var(--ink)",
  margin: 0,
};

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
