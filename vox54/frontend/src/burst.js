import { playPopSound } from "./popSound";
import { getPrefs } from "./prefs";
import { shardOffsets } from "./shardOffsets";

// LA MISMA animación que PoppableBubbles.jsx (.vox54-amb.bursting) — no una
// reimplementación paralela. Flash + PARTÍCULAS + el pulso de escala/brillo
// del propio elemento — SIN aro/onda expansiva (a pedido explícito, "esa
// onda que dispara es horrible" — sacado del todo, no solo suavizado). Se
// usa para botones y burbujas de navegación FUNCIONALES, donde el elemento
// tiene que seguir ahí y usable después (a diferencia de PoppableBubbles,
// que sí saca la burbuja decorativa del DOM un rato antes de reaparecer):
// la única diferencia real es que `el` nunca se toca de forma destructiva —
// recibe una clase de pulso (`.vox54-burstkeep`, en theme.css) que anima
// scale/brillo con el mismo pico que la burbuja real y vuelve sola a
// scale(1) sin perder nunca opacidad, en vez de colapsar a 0 como hace
// `.vox54-amb.bursting`. El destello es el mismo ::before de siempre (mismo
// keyframe vox54-flash, solo centrado con --burst-size en vez de
// inset-percentage, para que también funcione en un botón rectangular como
// "Guardar cambios"). Las partículas se agregan como hijas reales de `el`
// — igual que en PoppableBubbles, donde son hermanas de la burbuja dentro
// del mismo contenedor — con el mismo `.vox54-shard`/`vox54-shard-fly`, y
// la MISMA fórmula real (`shardOffsets.js`, un solo archivo compartido —
// antes cada lado tenía su propia copia con números que ya habían empezado
// a divergir sin que nadie lo hubiera decidido).

function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function burst(el) {
  if (!el) return;
  const prefs = getPrefs();
  const size = Math.max(el.offsetWidth, el.offsetHeight);

  if (prefs.soundEnabled) playPopSound(size);
  if (!prefs.animationsEnabled || reducedMotion()) return;

  // Tamaño real para que ::before/::after (theme.css) armen un aro
  // circular centrado, aunque `el` no sea cuadrado.
  el.style.setProperty("--burst-size", `${size}px`);

  // Reflow forzado para poder re-disparar la animación si se hace clic dos
  // veces seguidas sobre el mismo botón antes de que termine la primera.
  el.classList.remove("vox54-burstkeep");
  el.querySelectorAll(".vox54-shard").forEach((s) => s.remove());
  void el.offsetWidth;
  el.classList.add("vox54-burstkeep");
  el.addEventListener("animationend", () => el.classList.remove("vox54-burstkeep"), { once: true });
  // Red de seguridad — si la pestaña queda en segundo plano justo después
  // del clic, el navegador puede pausar/atrasar el reloj de la animación y
  // `animationend` nunca llega a disparar — sin esto, la clase se quedaría
  // pegada para siempre. 500ms da margen de sobra sobre los 420ms reales.
  setTimeout(() => el.classList.remove("vox54-burstkeep"), 500);

  shardOffsets(size).forEach((s) => {
    const shard = document.createElement("span");
    shard.className = "vox54-shard";
    shard.setAttribute("aria-hidden", "true");
    shard.style.setProperty("--tx", `${s.tx}px`);
    shard.style.setProperty("--ty", `${s.ty}px`);
    el.appendChild(shard);
  });
  // vox54-shard-fly dura 0.65s — con margen de sobra, mismo motivo que el
  // setTimeout de arriba.
  setTimeout(() => el.querySelectorAll(".vox54-shard").forEach((s) => s.remove()), 700);
}
