import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell, { formStyle, formEyebrowStyle, formHeadingStyle, inputStyle, linkRowStyle } from "../components/AuthShell";
import { api } from "../api";

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
    <AuthShell
      eyebrow={isAgency ? "Acceso de agencia" : "Acceso de negocio"}
      heading="Recuperá el acceso a tu cuenta."
      copy="Te mandamos un enlace real por correo, con vencimiento, para que puedas volver a entrar sin depender de nadie más."
    >
      <div style={formStyle}>
        <div style={{ marginBottom: 6 }}>
          <div style={formEyebrowStyle}>Recuperar contraseña</div>
          <h2 style={formHeadingStyle}>¿Olvidaste tu contraseña?</h2>
        </div>

        {sent ? (
          <div style={{ fontSize: 13.5, color: "var(--ink)", background: "#f0fdf4", padding: "14px 16px", borderRadius: 10, lineHeight: 1.5 }}>
            Si ese correo tiene una cuenta, te llegó un enlace para restablecer tu contraseña. Revisá tu bandeja
            (y spam, por las dudas).
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

        <Link to={isAgency ? "/agencia/login" : "/negocio/login"} style={linkRowStyle}>
          ← Volver al login
        </Link>
      </div>
    </AuthShell>
  );
}
