import { Fragment, useState } from "react";
import { playPopSound } from "../popSound";
import { shardOffsets } from "../shardOffsets";

// Campo de burbujas de vidrio, clickeables — al tocarlas estallan de verdad
// (destello + aro de onda expansiva + partículas que salen disparadas, no
// solo un fundido) y vuelven a aparecer solas, en el mismo lugar, entre 1.6
// y 3s después — nunca queda el panel "agujereado" para siempre. Un solo
// componente para no repetir esta lógica en cada pantalla que tiene su
// propio campo de burbujas (login, dashboard de negocio, dashboard de
// agencia). El CSS real (.vox54-amb, .bursting, .vox54-shard, etc.) vive
// en theme.css. La fórmula de las partículas (shardOffsets) vive en un solo
// archivo compartido con burst.js — antes cada uno tenía su propia copia,
// y llegaron a divergir en los números sin que nadie lo hubiera decidido.

// bubbles: [{ id, size, hue?, delay, style: {left/right/top/bottom} }]
export default function PoppableBubbles({ bubbles }) {
  // id -> partículas ya calculadas en el momento del clic (no se
  // recalculan en cada render, si no la explosión "tiembla")
  const [bursting, setBursting] = useState(() => new Map());
  const [popped, setPopped] = useState(() => new Set());

  function pop(id, size) {
    if (bursting.has(id) || popped.has(id)) return;
    playPopSound(size);
    setBursting((prev) => {
      const next = new Map(prev);
      next.set(id, shardOffsets(size));
      return next;
    });
    // 700ms deja terminar de desvanecerse al destello (0.3s), el estallido
    // de la burbuja (0.48s), el aro (0.55s) y las partículas (0.65s, más
    // grandes y con más recorrido que antes) antes de sacarla del DOM — si
    // se saca antes, se corta el efecto a mitad.
    setTimeout(() => {
      setBursting((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setPopped((prev) => new Set(prev).add(id));
      const respawnDelay = 1600 + Math.random() * 1400;
      setTimeout(() => {
        setPopped((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, respawnDelay);
    }, 700);
  }

  return bubbles.map((b) => {
    if (popped.has(b.id)) return null;
    const shards = bursting.get(b.id);
    const posStyle = { width: b.size, height: b.size, animationDelay: b.delay, ...b.style };
    return (
      <Fragment key={b.id}>
        <span
          aria-hidden="true"
          className={`vox54-amb poppable ${b.hue || ""} ${shards ? "bursting" : ""}`}
          style={posStyle}
          onClick={() => pop(b.id, b.size)}
        />
        {/* partículas — hermanas de la burbuja, no hijas: si viajaran
            adentro de un elemento que a la vez se achica a scale(0.15),
            la propia explosión de la burbuja se las llevaría puestas */}
        {shards && (
          <span className="vox54-shardfield" style={posStyle} aria-hidden="true">
            {shards.map((s, i) => (
              <span key={i} className="vox54-shard" style={{ "--tx": `${s.tx}px`, "--ty": `${s.ty}px` }} />
            ))}
          </span>
        )}
      </Fragment>
    );
  });
}
