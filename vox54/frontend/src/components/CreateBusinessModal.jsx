import { useState } from "react";

export default function CreateBusinessModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", contact_name: "", contact_email: "", contact_password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onCreate(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="vox54-panel" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, marginBottom: 16 }}>Crear negocio nuevo</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Nombre del negocio</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={inputStyle}
              placeholder="Ej: Panadería La Espiga"
            />
          </div>
          <div>
            <label style={labelStyle}>Nombre del contacto</label>
            <input
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Correo del contacto (será su login)</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Contraseña inicial</label>
            <input
              type="password"
              value={form.contact_password}
              onChange={(e) => setForm({ ...form, contact_password: e.target.value })}
              required
              minLength={8}
              style={inputStyle}
            />
            <div style={hintStyle}>Mínimo 8 caracteres.</div>
          </div>

          {error && <div style={{ fontSize: 13, color: "var(--danger)" }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose} className="vox54-btn secondary" style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" disabled={saving} className="vox54-btn" style={{ flex: 1 }}>
              {saving ? "Creando…" : "Crear negocio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(19,27,46,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalStyle = {
  padding: 28,
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 20px 50px rgba(19,27,46,0.25)",
};

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

const hintStyle = {
  fontSize: 11.5,
  color: "var(--ink-soft)",
  marginTop: 4,
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
