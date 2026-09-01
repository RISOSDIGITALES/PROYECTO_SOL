// Logo provisorio — mismo estilo visual que la familia de productos (colores, badge
// circular con el "54"), pero con nombre propio, no el de G54. "Bubble 54" es
// nombre de trabajo — cambiar acá cuando se decida el definitivo.
export default function Logo({ size = "normal" }) {
  const fontSize = size === "small" ? 17 : 25;
  return (
    <div className="g54-lockup" style={{ gap: fontSize < 20 ? 3 : 5 }}>
      <span className="word" style={{ fontSize }}>Bubble</span>
      <span className="g54-badge" style={{ width: fontSize + 8, height: fontSize + 8, fontSize: fontSize - 8 }}>54</span>
    </div>
  );
}
