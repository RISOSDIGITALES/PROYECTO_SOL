import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import { api } from "../api";

export default function ResetPasswordPage({ role }) {
  const isAgency = role === "agency";
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      isAgency ? await api.agencyResetPassword(token, password) : await api.businessResetPassword(token, password);
      setDone(true);
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
        <h2 style={{ fontSize: 22, color: "var(--ink)", margin: "18px 0 4px" }}>Restablecer tu contraseña</h2>

        {!token ? (
          <div style={{ fontSize: 13.5, color: "var(--danger)", background: "#fef2f2", padding: "14px 16px", borderRadius: 10, marginTop: 12 }}>
            Este enlace no trae ningún token real — pedí uno nuevo desde "¿Olvidaste tu contraseña?".
          </div>
        ) : done ? (
          <div style={{ fontSize: 13.5, color: "var(--ink)", background: "#f0fdf4", padding: "14px 16px", borderRadius: 10, marginTop: 12, lineHeight: 1.5 }}>
            Contraseña actualizada. Ya podés entrar con la nueva.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
            <div>
              <label style={labelStyle}>Contraseña nueva</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Al menos 8 caracteres"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Repetila</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
              />
            </div>
            {error && (
              <div style={{ fontSize: 13, color: "var(--danger)", background: "#fef2f2", padding: "10px 12px", borderRadius: 8 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="bubble54-btn">
              {loading ? "Guardando…" : "Guardar contraseña nueva"}
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
