import { playPopSound } from "./popSound";
import { getPrefs } from "./prefs";

// LA MISMA animación que PoppableBubbles.jsx (.vox54-amb.bursting) — no una
// reimplementación paralela con los números copiados a mano. Se usa para
// botones y burbujas de navegación FUNCIONALES, donde el elemento tiene que
// seguir ahí y usable después (a diferencia de PoppableBubbles, que sí saca
// la burbuja decorativa del DOM un rato antes de reaparecer): la única
// diferencia real es que `el` nunca se toca de forma destructiva — recibe
// una clase de pulso (`.vox54-burstkeep`, en theme.css) que anima
// scale/brillo con el mismo pico que la burbuja real y vuelve sola a
// scale(1) sin perder nunca opacidad, en vez de colapsar a 0 como hace
// `.vox54-amb.bursting`. El destello y el aro son los mismos ::before/
// ::after de siempre (mismos keyframes vox54-flash/vox54-shock, solo
// centrados con --burst-size en vez de inset-percentage, para que un botón
// rectangular como "Guardar cambios" también dé un aro circular). Las
// partículas se agregan como hijas reales de `el` — igual que en
// PoppableBubbles, donde son hermanas de la burbuja dentro del mismo
// contenedor — con el mismo `.vox54-shard`/`vox54-shard-fly` de siempre.
function shardOffsets(size) {
  const n = 6;
  const dist = Math.max(18, size * 0.9);
  return Array.from({ length: n }, (_, i) => {
    const angle = (360 / n) * i + (Math.random() * 24 - 12);
    const rad = (angle * Math.PI) / 180;
    const d = dist * (0.7 + Math.random() * 0.6);
    return { tx: Math.cos(rad) * d, ty: Math.sin(rad) * d };
  });
}

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
  // vox54-shard-fly dura 0.5s — con margen de sobra, mismo motivo que el
  // setTimeout de arriba.
  setTimeout(() => el.querySelectorAll(".vox54-shard").forEach((s) => s.remove()), 550);
}
