import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import PoppableBubbles from "../components/PoppableBubbles";
import { useAuth } from "../AuthContext";
import { api } from "../api";

// Burbujas decorativas del panel de intro — datos en vez de JSX repetido;
// el estado del estallido/reaparición vive en PoppableBubbles, compartido
// con el dock de negocio/agencia.
const AMB_BUBBLES = [
  { id: "b1", size: 130, style: { left: "-4%", top: "-6%" }, delay: "-1s" },
  { id: "b2", size: 95, hue: "violet", style: { right: "-3%", top: "58%" }, delay: "-2.4s" },
  { id: "b3", size: 70, hue: "green", style: { left: "72%", top: "8%" }, delay: "-3.6s" },
  { id: "b4", size: 60, style: { left: "8%", top: "72%" }, delay: "-0.8s" },
  { id: "b5", size: 26, style: { left: "12%", top: "18%" }, delay: "-1s" },
  { id: "b6", size: 14, hue: "green", style: { left: "22%", top: "62%" }, delay: "-2.6s" },
  { id: "b7", size: 34, hue: "violet", style: { left: "68%", top: "12%" }, delay: "-0.5s" },
  { id: "b8", size: 18, style: { left: "78%", top: "70%" }, delay: "-3.3s" },
  { id: "b9", size: 10, hue: "green", style: { left: "50%", top: "82%" }, delay: "-1.8s" },
  { id: "b10", size: 12, hue: "violet", style: { left: "40%", top: "30%" }, delay: "-4s" },
];

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
        {/* burbujas decorativas — clickeables, estallan de verdad y vuelven a aparecer solas */}
        <PoppableBubbles bubbles={AMB_BUBBLES} />

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
            <h2 style={formHeadingStyle}>Bienvenido</h2>
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

          <button type="submit" disabled={loading} className="vox54-btn">
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
  justifyContent: "center",
  padding: "48px 40px 48px 72px",
};

const introContentStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 18,
  maxWidth: 440,
  width: "100%",
};

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: "#CFE0FF",
  marginTop: 12,
};

const introHeadingStyle = {
  fontSize: 40,
  lineHeight: 1.14,
  color: "#fff",
  margin: 0,
};

const introCopyStyle = {
  fontSize: 16,
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.85)",
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

