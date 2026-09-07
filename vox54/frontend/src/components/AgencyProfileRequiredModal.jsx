import { Link } from "react-router-dom";

// Se planta en vez del formulario de "Crear negocio" cuando la agencia
// todavía no cargó ningún dato de contacto real ni logo -- a pedido
// explícito de la usuaria: un negocio nuevo no puede tener como único
// "canal de soporte" un perfil de agencia completamente vacío.
export default function AgencyProfileRequiredModal({ onClose }) {
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="vox54-panel" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, marginBottom: 10 }}>Completá el perfil de tu agencia primero</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 20px" }}>
          Todavía no cargaste ningún correo, teléfono o logo de tu agencia — un negocio nuevo necesita al
          menos un dato real de contacto para poder mostrarlo como su canal de soporte.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} className="vox54-btn secondary" style={{ flex: 1 }}>Cancelar</button>
          <Link to="/agencia/perfil" onClick={onClose} className="vox54-btn" style={{ flex: 1, textAlign: "center", textDecoration: "none" }}>
            Ir a Agencia
          </Link>
        </div>
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
