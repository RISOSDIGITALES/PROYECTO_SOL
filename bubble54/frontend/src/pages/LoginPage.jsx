import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthShell, { formStyle, formEyebrowStyle, formHeadingStyle, labelStyle, inputStyle, linkRowStyle } from "../components/AuthShell";
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
    <AuthShell
      eyebrow="Agentes de voz con IA"
      heading="Atención al cliente que nunca hace esperar."
      copy="Bubble pone un agente de voz real a cargo de tu teléfono — responde llamadas, resuelve dudas y atiende a tus clientes las 24 horas, sin que nadie tenga que levantar el tubo."
    >
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

        <button type="submit" disabled={loading} className="bubble54-btn">
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <Link to={isAgency ? "/agencia/olvide" : "/negocio/olvide"} style={linkRowStyle}>
          ¿Olvidaste tu contraseña?
        </Link>

        <Link to={isAgency ? "/negocio/login" : "/agencia/login"} style={linkRowStyle}>
          {isAgency ? "¿Sos un negocio? Entrar por acá" : "¿Sos parte de la agencia? Entrar por acá"}
        </Link>
      </form>
    </AuthShell>
  );
}
