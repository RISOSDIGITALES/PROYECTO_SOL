// Logo provisorio — mismo estilo visual que la familia de productos (colores, badge
// circular con el "54"), pero con nombre propio, no el de G54. "Bubble 54" es
// nombre de trabajo — cambiar acá cuando se decida el definitivo.
export default function Logo({ size = "normal" }) {
  const fontSize = size === "small" ? 17 : 25;
  // El "54" es una burbuja propia, no solo una etiqueta — deliberadamente
  // más grande que la palabra, con su propio brillo (ver .g54-badge en
  // theme.css, mismo truco visual que el resto de las burbujas de la app).
  const badgeSize = Math.round(fontSize * 1.8);
  const badgeFont = Math.round(fontSize * 0.85);
  return (
    <div className="g54-lockup" style={{ gap: fontSize < 20 ? 5 : 8 }}>
      <span className="word" style={{ fontSize }}>Bubble</span>
      <span className="g54-badge" style={{ width: badgeSize, height: badgeSize, fontSize: badgeFont }}>54</span>
    </div>
  );
}
