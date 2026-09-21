// Fórmula real de las partículas del estallido — ÚNICA fuente, importada
// por PoppableBubbles.jsx (burbujas decorativas) y burst.js (botones/
// íconos funcionales), para que las dos nunca puedan volver a divergir
// silenciosamente (ya pasó una vez esta misma sesión: dos copias de esta
// misma función con números distintos, "size * 0.5" en un lado y
// "size * 0.9" en el otro, hacían que el mismo efecto se viera más débil
// en un lado sin que nadie lo hubiera decidido a propósito).
//
// 9 partículas (antes 6) y más distancia real — a pedido explícito de
// hacer el efecto más notable.
export function shardOffsets(size) {
  const n = 9;
  const dist = Math.max(22, size * 1.05);
  return Array.from({ length: n }, (_, i) => {
    const angle = (360 / n) * i + (Math.random() * 20 - 10);
    const rad = (angle * Math.PI) / 180;
    const d = dist * (0.7 + Math.random() * 0.6);
    return { tx: Math.cos(rad) * d, ty: Math.sin(rad) * d };
  });
}
