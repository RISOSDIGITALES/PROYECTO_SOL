import Logo from "./Logo";
import BrandMark from "./BrandMark";

// Franja superior, angosta y de ancho completo, con dos identidades
// distintas conviviendo en la misma fila: el logo + nombre real del
// cliente (agencia o negocio) pegados a la esquina de arriba a la
// izquierda — exactamente donde tiene que estar, sin ningún hueco antes —
// y "Bubble 54" (la marca de la plataforma) centrado en el medio, sin
// importar el ancho que ocupe lo de la izquierda. Antes el logo del
// cliente vivía adentro de la barra lateral, con el padding propio de esa
// barra sumado a esta franja de encima — un hueco vacío real antes de
// llegar a él, no la esquina.
export default function TopBrandBar({ logoUrl, name }) {
  return (
    <div className="g54-gradient" style={barStyle}>
      <div style={leftSlotStyle}>
        <BrandMark logoUrl={logoUrl} name={name} size={36} />
        {name && <span style={nameStyle}>{name}</span>}
      </div>
      <div style={centerSlotStyle}>
        <Logo size="small" />
      </div>
    </div>
  );
}

const barStyle = {
  position: "relative",
  flexShrink: 0,
  height: 52,
  display: "flex",
  alignItems: "center",
};

const leftSlotStyle = {
  paddingLeft: 14,
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  gap: 10,
  maxWidth: "38%",
};

const nameStyle = {
  color: "rgba(255,255,255,0.94)",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const centerSlotStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
};
