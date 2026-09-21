import { useState } from "react";
import { formatDate, CUSTOMER_STAGE_LABEL, CUSTOMER_STAGE_HUE } from "../callFormat";
import EmptyCallsState from "./EmptyCallsState";

// CRM real por negocio (2026-09-21) -- reusado por el propio negocio y por
// la agencia sobre cualquiera de sus negocios, mismo patrón que CallsList.
// `onUpdate(customerId, patch)` hace el PATCH real; cuál endpoint exacto
// (business vs agency) lo decide quien use este componente, no acá.
export default function CustomersList({ customers, loading, error, onUpdate }) {
  if (loading) {
    return <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando clientes…</div>;
  }
  if (error) {
    return <div style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</div>;
  }
  if (!customers || customers.length === 0) {
    return (
      <EmptyCallsState
        title="Todavía no hay ningún cliente"
        subtitle="En cuanto entre una llamada real, el que llamó aparece acá solo."
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {customers.map((c) => (
        <CustomerRow key={c.id} customer={c} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

function CustomerRow({ customer, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(customer.name);
  const [notes, setNotes] = useState(customer.notes);
  const [tags, setTags] = useState(customer.tags);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  async function handleStageChange(e) {
    await onUpdate(customer.id, { stage: e.target.value });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(customer.id, { name, notes, tags });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bubble54-panel" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 14 }}>
            {customer.name || customer.phone}
          </div>
          {customer.name && (
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>{customer.phone}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "var(--ink-softer)" }}>
            {customer.calls_count} {customer.calls_count === 1 ? "llamada" : "llamadas"}
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-softer)" }}>
            {customer.last_call_at ? formatDate(customer.last_call_at) : "—"}
          </span>
          <span
            className={`bubble54-pill ${CUSTOMER_STAGE_HUE[customer.stage] || "gray"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <select
              value={customer.stage}
              onChange={handleStageChange}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "transparent", border: "none", font: "inherit", color: "inherit", cursor: "pointer" }}
            >
              {Object.entries(CUSTOMER_STAGE_LABEL).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </span>
          <span style={{ fontSize: 13, color: "var(--ink-softer)" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "grid", gap: 10 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sin nombre todavía" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Etiquetas</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ej. vip, mayorista" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={handleSave} disabled={saving} className="bubble54-btn" style={{ fontSize: 12.5, padding: "7px 14px" }}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
            {savedFlash && <span style={{ fontSize: 12.5, color: "var(--success, #16a34a)" }}>Guardado.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 4,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
};
