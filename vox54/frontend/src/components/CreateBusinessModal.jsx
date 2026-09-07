import { useState } from "react";

// A pedido explícito de la usuaria ("necesitamos TODOS LOS DATOS") — crear
// un negocio ya no pide solo el nombre y el contacto: pide también lo que el
// bot necesita para responder desde el primer día (horario, productos,
// dirección, teléfono), sin dejarlo como un segundo paso opcional.
export default function CreateBusinessModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    hours: "",
    products_services: "",
    address: "",
    phone: "",
    contact_name: "",
    contact_email: "",
    contact_password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

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
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
          <div>
            <label style={labelStyle}>Nombre del negocio</label>
            <input
              value={form.name}
              onChange={set("name")}
              required
              style={inputStyle}
              placeholder="Ej: Panadería La Espiga"
            />
          </div>

          <div>
            <label style={labelStyle}>Horario de atención</label>
            <textarea
              value={form.hours}
              onChange={set("hours")}
              required
              rows={2}
              style={textareaStyle}
              placeholder="Ej: Lunes a viernes 8am–5pm, sábados 9am–1pm"
            />
          </div>

          <div>
            <label style={labelStyle}>Productos y servicios</label>
            <textarea
              value={form.products_services}
              onChange={set("products_services")}
              required
              rows={3}
              style={textareaStyle}
              placeholder={"Uno por línea, ej:\nCajones cerrados a medida\nEmbalaje de exportación — $150"}
            />
          </div>

          <div style={twoColStyle}>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input
                value={form.address}
                onChange={set("address")}
                required
                style={inputStyle}
                placeholder="Ej: 123 NW 82nd Ave, Doral, FL"
              />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                value={form.phone}
                onChange={set("phone")}
                required
                style={inputStyle}
                placeholder="Ej: +1 305 555 0100"
              />
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={sectionLabelStyle}>Cuenta del negocio</div>
          </div>

          <div>
            <label style={labelStyle}>Nombre del contacto</label>
            <input
              value={form.contact_name}
              onChange={set("contact_name")}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Correo del contacto (será su login)</label>
            <input
              type="email"
              value={form.contact_email}
              onChange={set("contact_email")}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Contraseña inicial</label>
            <input
              type="password"
              value={form.contact_password}
              onChange={set("contact_password")}
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
  maxWidth: 460,
  boxShadow: "0 20px 50px rgba(19,27,46,0.25)",
};

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

const sectionLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--ink-softer)",
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

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};
