import { API_BASE } from "../api";
import { initials } from "../utils";

// La identidad real del cliente (agencia o negocio) — el logo propio si ya
// lo cargó, o sus iniciales (mismo relleno de vidrio ya usado en el resto
// de la app, ver .vox54-avatar) si todavía no subió ninguno. Nunca se
// inventa un logo que no existe.
//
// Vive en TopBrandBar, pegado a la esquina superior izquierda — no en la
// barra lateral: ahí dejaba un hueco vacío antes de que empezara el logo
// (el padding propio de la barra + la franja de arriba), que se leía como
// un espacio roto/sin usar en vez de la identidad del cliente.
// `size` permite un render más chico ahí (36px) que el que tenía antes en
// la barra lateral (44px, valor por default si no se pasa nada).
export default function BrandMark({ logoUrl, name, size = 44 }) {
  if (logoUrl) {
    return <img src={`${API_BASE}${logoUrl}`} alt={name || "Logo"} style={imgStyle(size)} />;
  }
  return (
    <div className="vox54-avatar" style={avatarStyle(size)} title={name || ""}>
      {initials(name || "")}
    </div>
  );
}

function avatarStyle(size) {
  return {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.27),
    fontSize: Math.round(size * 0.36),
    flexShrink: 0,
  };
}

function imgStyle(size) {
  return {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.27),
    objectFit: "contain",
    background: "rgba(255,255,255,0.92)",
    padding: Math.round(size * 0.09),
    flexShrink: 0,
  };
}
