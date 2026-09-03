import { playPopSound } from "./popSound";
import { getPrefs } from "./prefs";

// Estalla "sin desaparecer" — para botones y burbujas de navegación
// FUNCIONALES, donde el elemento tiene que seguir ahí y usable después
// (a diferencia de PoppableBubbles, que sí saca la burbuja decorativa del
// DOM un rato antes de reaparecer). El elemento real nunca se toca de forma
// destructiva: recibe una clase de pulso transitoria que vuelve sola a
// scale(1) (nunca colapsa a 0), y el destello/aro/partículas viven en un
// overlay aparte, insertado y sacado del DOM a mano, posicionado sobre el
// rect real del elemento — así sirve tanto para una burbuja circular del
// menú como para un botón rectangular de "Guardar cambios".
function shardOffsets(size) {
  const n = 6;
  const dist = Math.max(16, size * 0.5);
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
  if (prefs.soundEnabled) playPopSound(44);
  if (!prefs.animationsEnabled || reducedMotion()) return;

  // Reflow forzado para poder re-disparar la animación si se hace clic dos
  // veces seguidas sobre el mismo botón antes de que termine la primera.
  el.classList.remove("vox54-burstkeep");
  void el.offsetWidth;
  el.classList.add("vox54-burstkeep");
  el.addEventListener("animationend", () => el.classList.remove("vox54-burstkeep"), { once: true });
  // Red de seguridad — si la pestaña queda en segundo plano justo después
  // del clic (guardaste y cambiaste de pestaña), el navegador puede
  // pausar/atrasar el reloj de la animación y `animationend` nunca llega a
  // disparar — sin esto, la clase se quedaría pegada para siempre. 500ms
  // da margen de sobra sobre los 420ms reales de la animación.
  setTimeout(() => el.classList.remove("vox54-burstkeep"), 500);

  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 0.85;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const overlay = document.createElement("div");
  overlay.className = "vox54-burstfx";
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText =
    `position:fixed; left:${cx}px; top:${cy}px; width:${size}px; height:${size}px; ` +
    `margin:${-size / 2}px 0 0 ${-size / 2}px; pointer-events:none; z-index:9999;`;

  overlay.appendChild(Object.assign(document.createElement("span"), { className: "vox54-burstfx-flash" }));
  overlay.appendChild(Object.assign(document.createElement("span"), { className: "vox54-burstfx-ring" }));

  shardOffsets(size).forEach((s) => {
    const shard = document.createElement("span");
    shard.className = "vox54-shard";
    shard.style.setProperty("--tx", `${s.tx}px`);
    shard.style.setProperty("--ty", `${s.ty}px`);
    overlay.appendChild(shard);
  });

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 620);
}
