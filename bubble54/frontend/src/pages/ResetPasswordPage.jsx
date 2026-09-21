import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell, { formStyle, formEyebrowStyle, formHeadingStyle, labelStyle, inputStyle, linkRowStyle } from "../components/AuthShell";
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
    <AuthShell
      eyebrow={isAgency ? "Acceso de agencia" : "Acceso de negocio"}
      heading="Restablecé tu contraseña."
      copy="Elegí una nueva contraseña real para tu cuenta — el enlace que te mandamos por correo solo sirve una vez."
    >
      <div style={formStyle}>
        <div style={{ marginBottom: 6 }}>
          <div style={formEyebrowStyle}>Contraseña nueva</div>
          <h2 style={formHeadingStyle}>Restablecer tu contraseña</h2>
        </div>

        {!token ? (
          <div style={{ fontSize: 13.5, color: "var(--danger)", background: "#fef2f2", padding: "14px 16px", borderRadius: 10 }}>
            Este enlace no trae ningún token real — pedí uno nuevo desde "¿Olvidaste tu contraseña?".
          </div>
        ) : done ? (
          <div style={{ fontSize: 13.5, color: "var(--ink)", background: "#f0fdf4", padding: "14px 16px", borderRadius: 10, lineHeight: 1.5 }}>
            Contraseña actualizada. Ya podés entrar con la nueva.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

        <Link to={isAgency ? "/agencia/login" : "/negocio/login"} style={linkRowStyle}>
          ← Volver al login
        </Link>
      </div>
    </AuthShell>
  );
}
