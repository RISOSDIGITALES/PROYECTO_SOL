import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { api } from "../api";

// Mismo layout de 2 paneles que LoginPage, sin duplicar sus estilos --
// re-exportados acá porque son privados a ese archivo (no vale la pena
// levantar un módulo de estilos compartido para 2 pantallas).
export default function ForgotPasswordPage({ role }) {
  const isAgency = role === "agency";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      isAgency ? await api.agencyForgotPassword(email) : await api.businessForgotPassword(email);
      // Mismo mensaje siempre exista o no la cuenta -- el backend ya no
      // revela nada, el frontend tampoco debe hacerlo con un error distinto.
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Logo />
        <h2 style={{ fontSize: 22, color: "var(--ink)", margin: "18px 0 4px" }}>Recuperar tu contraseña</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 20px", lineHeight: 1.5 }}>
          Escribí el correo de tu cuenta de {isAgency ? "agencia" : "negocio"} — si existe, te mandamos un enlace
          real para restablecerla.
        </p>

        {sent ? (
          <div style={{ fontSize: 13.5, color: "var(--ink)", background: "#f0fdf4", padding: "14px 16px", borderRadius: 10, lineHeight: 1.5 }}>
            Si ese correo tiene una cuenta, te llegó un enlace para restablecer tu contraseña. Revisá tu bandeja
            (y spam, por las dudas).
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@correo.com"
              style={inputStyle}
            />
            {error && (
              <div style={{ fontSize: 13, color: "var(--danger)", background: "#fef2f2", padding: "10px 12px", borderRadius: 8 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="bubble54-btn">
              {loading ? "Mandando…" : "Mandar enlace"}
            </button>
          </form>
        )}

        <Link
          to={isAgency ? "/agencia/login" : "/negocio/login"}
          style={{ display: "block", marginTop: 18, fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center", textDecoration: "none" }}
        >
          ← Volver al login
        </Link>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--paper)",
  padding: 24,
};

const cardStyle = {
  width: "100%",
  maxWidth: 380,
  background: "var(--white)",
  borderRadius: 16,
  padding: "32px 28px",
  boxShadow: "0 8px 30px rgba(20,30,60,0.08)",
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
