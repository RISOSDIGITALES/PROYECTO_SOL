import { useEffect, useState } from "react";

// Reloj real en vivo — "parecido a G54 pero en nuestro estilo" (G54 muestra
// hora + GMT en la esquina superior de su Centro de Operaciones). Es la
// hora/huso del navegador de quien mira el panel, no la de un negocio en
// particular — la agencia gestiona negocios que pueden estar en husos
// distintos, así que no hay una única zona horaria "correcta" para un
// reloj global. Vive en TopBrandBar (franja azul, compartida por agencia y
// negocio) — por eso el chip es la variante de vidrio para fondo oscuro
// (.vox54-clock), no .vox54-pill (pensada para fondos claros). Actualiza
// cada 20s — de sobra para un reloj que solo muestra hora:minuto, sin
// gastar nada de más re-renderizando por cada segundo que nadie llega a ver.
export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20000);
    return () => clearInterval(id);
  }, []);
  const offsetHours = -now.getTimezoneOffset() / 60;
  const gmt = `GMT${offsetHours >= 0 ? "+" : ""}${offsetHours}`;
  const date = now.toLocaleDateString("es-NI", { day: "numeric", month: "short" });
  const time = now.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit", hour12: false });
  return (
    <span className="vox54-clock">
      <span className="dot" />
      {date} · {time} {gmt}
    </span>
  );
}
