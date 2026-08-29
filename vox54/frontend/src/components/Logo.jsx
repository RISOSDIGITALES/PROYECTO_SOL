// Logo provisorio — mismo estilo visual que la familia de productos (colores, badge
// circular con el "54"), pero con nombre propio, no el de G54. Cambiar "Vox" cuando
// se decida el nombre real.
export default function Logo({ size = "normal" }) {
  const fontSize = size === "small" ? 18 : 26;
  return (
    <div className="g54-lockup" style={{ gap: 2 }}>
      <span className="word" style={{ fontSize }}>Vox</span>
      <span className="g54-badge" style={{ width: fontSize + 8, height: fontSize + 8, fontSize: fontSize - 8 }}>54</span>
    </div>
  );
}
