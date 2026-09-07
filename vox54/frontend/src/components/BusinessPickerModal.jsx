import { Link } from "react-router-dom";
import StatusPill from "./StatusPill";

// "+ Nuevo agente" no salta directo a crear un negocio -- primero muestra
// los que ya existen (elegir uno lleva directo a SU bot, ya que 1 negocio
// = 1 bot desde que se crea, no hay ningún "agente suelto" para asignar).
// A pedido explícito de la usuaria: si ya hay negocios cargados, la opción
// de crear uno nuevo NO se muestra acá -- este picker es solo para elegir
// entre los que ya existen. Crear uno nuevo vive en su propio lugar
// (/agencia/negocios, botón "+ Crear negocio"). El único caso en que este
// modal SÍ ofrece crear es cuando todavía no hay ningún negocio -- ahí no
// hay nada que elegir, así que lo dice explícito antes de ofrecer crear
// el primero, nunca abre el formulario en silencio.
export default function BusinessPickerModal({ agents, onClose, onRequestCreate }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="vox54-panel" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, marginBottom: 4 }}>¿Para qué negocio?</h2>

        {agents.length > 0 ? (
          <>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "0 0 16px" }}>
              Cada negocio ya tiene su propio agente — elegí uno para ir directo a configurarlo.
            </p>
            <div style={{ display: "grid", gap: 8, marginBottom: 18, maxHeight: 260, overflowY: "auto" }}>
              {agents.map((a) => (
                <Link
                  key={a.business_id}
                  to={`/agencia/negocios/${a.business_id}/bot`}
                  onClick={onClose}
                  style={rowStyle}
                >
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>{a.business_name}</span>
                  <StatusPill status={a.bot_status} />
                </Link>
              ))}
            </div>
            <button type="button" onClick={onClose} className="vox54-btn" style={{ width: "100%" }}>
              Cerrar
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 18px" }}>
              Todavía no tenés ningún negocio. Creá el primero para que tenga su propio agente.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} className="vox54-btn secondary" style={{ flex: 1 }}>Cancelar</button>
              <button type="button" onClick={onRequestCreate} className="vox54-btn" style={{ flex: 1 }}>
                + Crear negocio nuevo
              </button>
            </div>
          </>
        )}
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

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  textDecoration: "none",
};
