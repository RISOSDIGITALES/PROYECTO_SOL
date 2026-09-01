import { useState } from "react";

// Compartido por las dos vistas de cuenta (agencia y negocio) — nada acá
// sabe de qué rol es, solo llama a `onSubmit(currentPassword, newPassword)`
// y deja que quien lo usa decida a qué endpoint real le pega.
export default function ChangePasswordForm({ onSubmit }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSavedMessage("");

    if (next !== confirm) {
      setError("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(current, next);
      setSavedMessage("Contraseña actualizada correctamente.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      {error && <div style={bannerStyle("danger")}>{error}</div>}
      {savedMessage && <div style={bannerStyle("success")}>{savedMessage}</div>}

      <label style={{ display: "block" }}>
        <span style={labelStyle}>Contraseña actual</span>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          style={inputStyle}
        />
      </label>
      <label style={{ display: "block" }}>
        <span style={labelStyle}>Contraseña nueva</span>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />
      </label>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: -6 }}>Mínimo 8 caracteres.</div>
      <label style={{ display: "block" }}>
        <span style={labelStyle}>Confirmar contraseña nueva</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={inputStyle}
        />
      </label>

      <button type="submit" disabled={saving} style={buttonStyle}>
        {saving ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

function bannerStyle(kind) {
  const isDanger = kind === "danger";
  return {
    fontSize: 13,
    padding: "10px 14px",
    borderRadius: 8,
    background: isDanger ? "#fef2f2" : "#f0fdf4",
    color: isDanger ? "var(--danger)" : "var(--success)",
  };
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
  background: "var(--white)",
};

const buttonStyle = {
  background: "var(--g54-blue)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};
