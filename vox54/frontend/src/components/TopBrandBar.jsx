import Logo from "./Logo";
import BrandMark from "./BrandMark";
import LiveClock from "./LiveClock";

// Franja superior, angosta y de ancho completo, con tres cosas conviviendo
// en la misma fila: el logo + nombre real del cliente (agencia o negocio)
// pegados a la esquina de arriba a la izquierda — exactamente donde tiene
// que estar, sin ningún hueco antes —, "Bubble 54" (la marca de la
// plataforma) centrado en el medio sin importar el ancho que ocupe lo de
// la izquierda, y el reloj real a la derecha. Antes el logo del cliente
// vivía adentro de la barra lateral, con el padding propio de esa barra
// sumado a esta franja de encima — un hueco vacío real antes de llegar a
// él, no la esquina.
//
// El reloj vivió primero en la barra blanca de abajo (AgencyShell), junto
// al nombre del usuario logueado — la usuaria señaló, con razón, que el
// nombre de la agencia ya está visible acá mismo, así que mostrar además
// "[nombre] Admin" en otra franja era redundante; se sacó esa franja del
// todo y el reloj se movió acá, la única identidad que de verdad falta.
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
      <div style={rightSlotStyle}>
        <LiveClock />
      </div>
    </div>
  );
}

// Grid real de 3 columnas, no 3 elementos flotando por posicionamiento
// absoluto -- antes el logo del centro vivía en `left:50%` fijo, sin
// importar cuánto ocupara el nombre real de la izquierda (un nombre largo,
// o simplemente un viewport angosto) lo pisaba de lleno, sin ningún límite
// real que lo evitara. Con `grid-template-columns: minmax(0,1fr) auto
// minmax(0,1fr)`, cada bloque vive en su propia columna real: la izquierda
// y la derecha se reparten el resto del ancho y se achican (elipsis) antes
// de invadir la columna del medio, que reserva exactamente lo que su
// contenido necesita y nunca se mueve.
const barStyle = {
  position: "relative",
  flexShrink: 0,
  height: 52,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
};

const leftSlotStyle = {
  paddingLeft: 14,
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
  overflow: "hidden",
};

const nameStyle = {
  color: "rgba(255,255,255,0.94)",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  minWidth: 0,
};

const centerSlotStyle = {
  justifySelf: "center",
  display: "flex",
  alignItems: "center",
};

// Sin `justifySelf: "end"` a propósito -- eso cambia el default de la
// celda de "stretch" (llena el ancho real de la columna, así el
// `overflow:hidden` de abajo sí puede recortar contra un borde real) a
// "se achica al tamaño de su contenido" -- con eso, el reloj (que nunca
// se abrevia, `white-space:nowrap`) volvía a su ancho natural y se salía
// de su columna igual que antes del grid, pisando el logo del medio. La
// celda ahora ocupa el ancho completo de su columna (stretch real) y el
// alineado a la derecha se hace puertas adentro, con flexbox.
const rightSlotStyle = {
  paddingRight: 18,
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  minWidth: 0,
  overflow: "hidden",
};
