// Jelly54 (28-oct): la medusa de Jelly54, animada con la misma lógica que el Bubbli plano de
// Bubble 54 (bubbliPlano.js): un SVG plano, de colores lisos, que se mueve con JavaScript.
// Lo que cambia es el nado: en vez de aletas, la campana se contrae y se suelta, y cada
// contracción la empuja; los tentáculos la siguen con retraso y se estiran al subir.
// Comportamiento: flota latiendo cada 1.6 a 2.6 s, mueve la mirada cada 1.2 a 4 s, parpadea,
// cambia de emoción (feliz, curioso, sorpresa) cada 8 a 15 s, da una vuelta completa cada 15 a
// 25 s, cada 2.5 a 4.5 min sale de paseo por la pantalla y vuelve, y cada 3 a 6 min se duerme
// un rato (ojos cerrados, zetas, se hunde despacio); se despierta si le hablan.
//
// Uso:
//   import { startJelly } from "./jelly54.js";
//   const jelly = startJelly(document.querySelector("#jelly"));   // el host define el tamaño
//   jelly.setMood("hablando");   // "quieto" (por defecto), "hablando" o "pensando"
//   jelly.accion("paseo");       // también "siesta", "despertar", "vuelta", "feliz", "curioso", "sorpresa"
//   jelly.stop();                // corta la animación
// Opciones: startJelly(host, { fondo: true }) dibuja el cuadrado gris claro del ícono detrás.
// Para que pueda pasear, el host y sus contenedores no deben recortar lo que sobresale
// (sin overflow: hidden). Con "movimiento reducido" del sistema queda quieta.

const AZUL = "#2E8BE3", AZUL_CLARO = "#55A4EC", AZUL_OSCURO = "#1F78D6", CARA = "#E3F4FF";
const TENTACULOS = [[64, 58, AZUL], [82, 72, AZUL_CLARO], [100, 64, AZUL], [118, 74, AZUL_CLARO], [136, 56, AZUL]];
const GAZES = [[0, 0], [3, 0], [-3, 0], [0, -2.2], [2.2, -1.6], [-2, 1.2]];
let unico = 0;

export function startJelly(host, opciones = {}) {
  const id = `jelly${++unico}`;
  host.innerHTML = `<svg class="jelly54" viewBox="0 0 200 200" aria-label="Jelly" role="img" style="overflow:visible">` +
    (opciones.fondo ? `<rect x="8" y="8" width="184" height="184" rx="44" fill="#F1F7F7"/>` : "") +
    // Achicada al 85 % y bajada un poco: con los tentáculos estirados ocupaba todo el alto.
    `<g class="burbujas"></g><g class="pos"><g transform="translate(15 10) scale(0.85)"><g class="cuerpo">` +
    `<g class="tentaculos">${TENTACULOS.map(([, , c]) => `<path fill="none" stroke="${c}" stroke-width="6.5" stroke-linecap="round"/>`).join("")}</g>` +
    // Campana: domo con el borde de abajo en lóbulos; arriba más clara y el borde más oscuro, como el ícono.
    `<g class="campana"><clipPath id="${id}-domo"><path d="M42 96 C40 52 68 28 100 28 C132 28 160 52 158 96 Z"/></clipPath>` +
    `<path fill="${AZUL_OSCURO}" d="M42 94 Q51 106 61 98 Q71 106 80.5 98 Q90 106 100 98 Q110 106 119.5 98 Q129 106 139 98 Q150 106 158 94 Z"/>` +
    `<path fill="${AZUL}" d="M42 96 C40 52 68 28 100 28 C132 28 160 52 158 96 Z"/>` +
    `<g clip-path="url(#${id}-domo)"><path fill="${AZUL_CLARO}" d="M30 20 H170 V58 C140 46 60 46 30 58 Z"/></g>` +
    `<g class="cara"><g class="ojos"><ellipse cx="82" cy="66" rx="7.5" ry="8" fill="${CARA}"/><ellipse cx="118" cy="66" rx="7.5" ry="8" fill="${CARA}"/></g>` +
    `<path class="ojos-felices" d="M75 69 Q82 59 89 69 M111 69 Q118 59 125 69" stroke="${CARA}" stroke-width="3.6" fill="none" stroke-linecap="round" opacity="0"/>` +
    `<path class="ojos-dormidos" d="M75 66 Q82 73 89 66 M111 66 Q118 73 125 66" stroke="${CARA}" stroke-width="3.6" fill="none" stroke-linecap="round" opacity="0"/>` +
    `<ellipse class="boca-o" cx="100" cy="82" rx="3.6" ry="4.4" fill="${CARA}" opacity="0"/>` +
    `<path class="boca" d="M95 80 Q100 84 105 80" stroke="${CARA}" stroke-width="3.2" fill="none" stroke-linecap="round"/></g></g>` +
    `</g></g></g></svg>`;
  const svg = host.firstElementChild;
  svg.setAttribute("width", "100%"); svg.setAttribute("height", "100%");
  const $ = (s) => svg.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";
  const pos = $(".pos"), cuerpo = $(".cuerpo"), campana = $(".campana"), cara = $(".cara"), ojos = $(".ojos");
  const felices = $(".ojos-felices"), dormidos = $(".ojos-dormidos"), boca = $(".boca"), bocaO = $(".boca-o");
  const tentaculos = [...svg.querySelectorAll(".tentaculos path")], burbujas = $(".burbujas");
  svg.appendChild(burbujas);   // adelante de la medusa
  ojos.style.transformBox = "view-box"; ojos.style.transformOrigin = "100px 66px";

  let mood = "quieto", pedido = null;
  // Tentáculos en reposo, para el dibujo quieto (y el arranque).
  dibujarTentaculos(1, 1, 0, 0, 0);
  const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reducido || typeof svg.animate !== "function") {
    return { stop() {}, setMood(m) { mood = m; }, accion() {} };
  }

  const rnd = (a, b) => a + Math.random() * (b - a);
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
  // Fases: "casa" (flota en su lugar), "fuera" (pasea por la pantalla) y "volver" (se acomoda).
  let x = 0, y = 0, vx = 0, vy = 0, gx = 0, gy = 0, nextDrift = 0, rot = 0;
  let pulsoT = -10, nextPulso = 0.4, pulsoDur = 1.1;
  let ex = 0, ey = 0, etx = 0, ety = 0, nextGaze = 1.5, nextBurbuja = 3;
  let emo = "normal", emoUntil = 0, emoStart = 0, nextEmo = rnd(5, 9), blinkAt = rnd(2, 4), blinkUntil = 0;
  let loopStart = -1, nextLoop = rnd(12, 20);
  let durmiendo = false, suenoHasta = 0, nextSueno = rnd(120, 200), nextZ = 0, onda = 0;
  let fase = "casa", faseT = 0, nextEscape = rnd(60, 90), ruta = null, rutaI = 0;
  let talk = 0, raf = 0, last = performance.now() / 1000;

  // Cada tentáculo es una línea suave de 6 tramos. Ondula con un retraso que crece hacia la
  // punta, se va hacia atrás cuando la medusa se mueve de costado y se estira cuando sube.
  function dibujarTentaculos(sx, sy, w, lat, estira) {
    TENTACULOS.forEach(([x0, largo], k) => {
      const rx = 100 + (x0 - 100) * sx, ry = 62 + (100 - 62) * sy, n = 6, pts = [];
      const abre = (x0 - 100) * 0.12 * (1 - sx) * 4;   // al contraerse, las puntas se abren un poco
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const ondaX = Math.sin(w - u * 2.6 + k * 0.9) * 5 * u;
        pts.push([rx + ondaX + abre * u - lat * u * u, ry + largo * estira * u]);
      }
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < n; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      tentaculos[k].setAttribute("d", d + ` L${pts[n][0].toFixed(1)} ${pts[n][1].toFixed(1)}`);
    });
  }
  function burbuja() {
    const c = document.createElementNS(NS, "circle");
    const a = (rot * Math.PI) / 180, bx = 100 + x + Math.sin(a) * 70 + rnd(-30, 30), by = 62 + y - Math.cos(a) * 40;
    c.setAttribute("cx", bx); c.setAttribute("cy", by); c.setAttribute("r", rnd(3, 5.5));
    c.setAttribute("fill", "#EAF5FF"); c.setAttribute("stroke", AZUL); c.setAttribute("stroke-width", "2");
    burbujas.appendChild(c);
    const alto = rnd(35, 60), lado = rnd(-6, 6);
    c.animate([{ transform: "translate(0,0)", opacity: 0 }, { transform: `translate(${lado / 2}px,-${alto * 0.2}px)`, opacity: 1, offset: 0.15 },
               { transform: `translate(${lado}px,-${alto}px)`, opacity: 0 }], { duration: rnd(2200, 3200), easing: "ease-in" }).onfinish = () => c.remove();
  }
  function zeta() {
    const z = document.createElementNS(NS, "text");
    z.textContent = "z"; z.setAttribute("x", 140 + x); z.setAttribute("y", 40 + y);
    z.setAttribute("font-size", rnd(13, 19)); z.setAttribute("font-weight", "700"); z.setAttribute("fill", AZUL);
    z.setAttribute("font-family", "system-ui, sans-serif");
    burbujas.appendChild(z);
    z.animate([{ transform: "translate(0,0)", opacity: 0 }, { transform: "translate(6px,-14px)", opacity: 1, offset: 0.3 },
               { transform: "translate(14px,-40px)", opacity: 0 }], { duration: 2600, easing: "ease-out" }).onfinish = () => z.remove();
  }
  // Paseo por la pantalla, en unidades del dibujo, con los mismos tipos que Bubbli: corto cerca
  // de casa (el más común), un círculo, ir a un punto y volver, zigzag o una vuelta grande.
  function armarRuta() {
    const r = host.getBoundingClientRect(), k = 200 / (r.width || 120);
    const hx = r.left + r.width / 2, hy = r.top + r.height / 2, m = 70;
    const w = window.innerWidth, h = window.innerHeight;
    const clamp = (px, py) => [Math.min(Math.max(px, m), w - m), Math.min(Math.max(py, m), h - m)];
    const tipos = ["corto", "corto", "corto", "circulo", "circulo", "ida", "ida", "zigzag", "grande"];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)], pts = [];
    if (tipo === "corto") {
      const radio = rnd(120, 260), n = Math.floor(rnd(2, 5));
      for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2); pts.push(clamp(hx + Math.cos(a) * radio * rnd(0.5, 1), hy + Math.sin(a) * radio * rnd(0.5, 1))); }
    } else if (tipo === "circulo") {
      const radio = rnd(110, 220), giro = Math.random() < 0.5 ? 1 : -1, a0 = rnd(0, Math.PI * 2);
      const cxp = hx - radio * 0.9, cyp = hy - radio * 0.9;
      for (let i = 0; i <= 8; i++) { const a = a0 + giro * (i / 8) * Math.PI * 2; pts.push(clamp(cxp + Math.cos(a) * radio, cyp + Math.sin(a) * radio)); }
    } else if (tipo === "ida") {
      pts.push(clamp(rnd(m, w - m), rnd(m, h - m)));
    } else if (tipo === "zigzag") {
      const n = Math.floor(rnd(4, 7)), alto = rnd(0.35, 0.8) * h, ancho = rnd(0.3, 0.7) * w, izq = Math.random() < 0.5;
      for (let i = 0; i < n; i++) {
        const lado = (i % 2 === 0) === izq ? -1 : 1;
        pts.push(clamp(hx - ancho / 2 + lado * ancho / 2 + rnd(-30, 30), hy - alto * (i + 1) / n));
      }
    } else {
      const n = Math.floor(rnd(4, 7));
      for (let i = 0; i < n; i++) pts.push([rnd(m, w - m), rnd(m, h - m)]);
    }
    const pts2 = pts.map(([px, py]) => [(px - hx) * k, (py - hy) * k]);
    pts2.push([0, 0]);
    return { pts: pts2, vel: rnd(200, 300) * k, llegar: 24 * k };
  }
  function emocion(t, e, dur) { emo = e; emoStart = t; emoUntil = t + dur; }
  function dormir(t) { durmiendo = true; suenoHasta = t + rnd(25, 45); emo = "normal"; emoUntil = 0; }
  function despertar(t, sorpresa) {
    durmiendo = false; nextSueno = t + rnd(180, 360); nextEscape = Math.max(nextEscape, t + 20);
    emocion(t, sorpresa ? "sorpresa" : "feliz", 1.2); nextPulso = t + 0.2;
  }
  function salir(t) { fase = "fuera"; ruta = armarRuta(); rutaI = 0; emocion(t, "feliz", 3); nextPulso = t; }

  function frame() {
    const t = performance.now() / 1000, dt = Math.min(0.05, t - last); last = t;
    let loopRot = 0, tilt = 0;
    // Pedidos desde afuera (botones de prueba o el panel).
    if (pedido) {
      const p = pedido; pedido = null;
      if (p === "siesta" && fase === "casa" && !durmiendo) dormir(t);
      else if (p === "despertar" && durmiendo) despertar(t, false);
      else if (p === "paseo" && fase === "casa") { if (durmiendo) despertar(t, true); salir(t); }
      else if (p === "vuelta" && fase === "casa" && !durmiendo && loopStart < 0) { loopStart = t; emocion(t, "feliz", 2.4); }
      else if (["feliz", "curioso", "sorpresa"].includes(p) && !durmiendo) emocion(t, p, 2);
    }

    // Latido de la campana: contracción rápida (30 %) y se suelta despacio. Cada contracción
    // empuja hacia donde apunta la campana.
    if (t > nextPulso) {
      pulsoT = t; pulsoDur = durmiendo ? 1.6 : fase === "fuera" ? 0.8 : 1.1;
      nextPulso = t + (durmiendo ? rnd(4, 6) : fase === "fuera" ? 0.9 : rnd(1.6, 2.6));
    }
    const pp = Math.min(1, (t - pulsoT) / pulsoDur);
    const contr = pp < 0.3 ? Math.sin((pp / 0.3) * Math.PI / 2) : Math.cos(((pp - 0.3) / 0.7) * Math.PI / 2) ** 2;
    const fuerza = (durmiendo ? 0.4 : 1) * contr;
    const empuje = pp < 0.3 ? 1 : 0;   // solo empuja mientras se contrae
    const ang = (rot * Math.PI) / 180;

    if (fase === "casa") {
      if (!durmiendo && t > nextSueno && mood === "quieto" && loopStart < 0) dormir(t);
      if (durmiendo && (t > suenoHasta || mood !== "quieto")) despertar(t, mood !== "quieto");
      if (!durmiendo && t > nextEscape && mood === "quieto" && loopStart < 0) salir(t);
      if (durmiendo) { gx = x * 0.98; gy = 14; nextDrift = t + 2; }
      if (!durmiendo && t > nextDrift) { gx = rnd(-12, 12); gy = rnd(-8, 8); nextDrift = t + rnd(3, 6); }
      // Se hunde un poco entre latido y latido; el latido la vuelve a subir.
      vx += ((gx - x) * 1.4 - vx * 2.2) * dt; x += vx * dt;
      vy += ((gy - y) * 1.4 - vy * 2.2 + 9 - empuje * 60 * (durmiendo ? 0.4 : 1)) * dt; y += vy * dt;
      if (loopStart >= 0) {
        const p = (t - loopStart) / 2.2;
        if (p >= 1) { loopStart = -1; nextLoop = t + rnd(15, 25); }
        else loopRot = ease(p) * 360;
      } else if (!durmiendo && t > nextLoop && mood === "quieto") { loopStart = t; emocion(t, "feliz", 2.4); }
      tilt = Math.sin(t * 0.9) * 4 + vx * 0.4;
    } else if (fase === "fuera") {
      const [tx, ty] = ruta.pts[rutaI], dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1;
      // Nada a empujones: cada contracción suma velocidad hacia el punto y el agua la frena.
      const cerca = Math.min(1, d / (ruta.vel * 0.8));
      vx += ((dx / d) * ruta.vel * 2.2 * cerca * empuje * 3.3 - vx * 1.6) * dt;
      vy += ((dy / d) * ruta.vel * 2.2 * cerca * empuje * 3.3 - vy * 1.6) * dt;
      x += vx * dt; y += vy * dt;
      // La campana apunta hacia donde va (hasta 50°).
      tilt = Math.max(-50, Math.min(50, (Math.atan2(dx, -dy) * 180) / Math.PI));
      if (dy > 0) tilt *= 0.5;   // para bajar no se pone de cabeza: se deja caer
      if (d < ruta.llegar) {
        rutaI++;
        if (rutaI >= ruta.pts.length) { fase = "volver"; faseT = t; gx = 0; gy = 0; }
      }
      if (t > emoUntil && Math.random() < dt * 0.5) emocion(t, Math.random() < 0.6 ? "feliz" : "curioso", 1.5);
    } else if (fase === "volver") {
      vx += ((0 - x) * 6 - vx * 4.5) * dt; x += vx * dt;
      vy += ((0 - y) * 6 - vy * 4.5) * dt; y += vy * dt;
      if (t - faseT > 0.8) { fase = "casa"; nextEscape = t + rnd(150, 270); emocion(t, "feliz", 1.6); nextDrift = t + 1; }
    }

    // Emociones: feliz (ojos en arco, sonrisa grande, saltito), sorpresa (ojos grandes, boca en O),
    // curioso (se inclina y mira a un costado). Parpadea cada 2 a 6 s, a veces dos veces seguidas.
    if (fase === "casa" && !durmiendo && t > nextEmo && t > emoUntil) {
      emocion(t, ["feliz", "curioso", "sorpresa", "feliz"][Math.floor(Math.random() * 4)], rnd(1.4, 2.4));
      nextEmo = t + rnd(8, 15);
    }
    const e = t < emoUntil ? emo : "normal";
    if (t > blinkAt) { blinkUntil = t + 0.13; blinkAt = t + (Math.random() < 0.2 ? 0.3 : rnd(2, 6)); }
    const parpado = t < blinkUntil ? 0.1 : 1, grande = e === "sorpresa" ? 1.25 : 1;
    ojos.style.transform = `scale(${grande}, ${grande * parpado})`;
    ojos.setAttribute("opacity", e === "feliz" || durmiendo ? 0 : 1);
    felices.setAttribute("opacity", e === "feliz" && !durmiendo ? 1 : 0);
    dormidos.setAttribute("opacity", durmiendo ? 1 : 0);
    talk += ((mood === "hablando" ? 0.5 + 0.5 * Math.sin(t * 14) : 0) - talk) * Math.min(1, dt / 0.08);
    const sonrisa = e === "feliz" ? 6 : durmiendo ? 1.5 : 3.5, ancho = e === "feliz" ? 7 : 5;
    boca.setAttribute("d", `M${100 - ancho} 80 Q100 ${(80 + sonrisa + talk * 5).toFixed(2)} ${100 + ancho} 80`);
    const enO = e === "sorpresa" && talk < 0.1;
    boca.setAttribute("opacity", enO ? 0 : 1);
    bocaO.setAttribute("opacity", enO ? 1 : 0);
    if (e === "curioso") { tilt += 10; etx = 3; ety = 0; }
    if (mood === "pensando") { etx = 1.5; ety = -2.2; nextGaze = t + 1; }
    if (!durmiendo && t > nextGaze) { const g = GAZES[Math.floor(Math.random() * GAZES.length)]; etx = g[0]; ety = g[1]; nextGaze = t + rnd(1.2, 4); }
    ex += (etx - ex) * Math.min(1, dt / 0.08); ey += (ety - ey) * Math.min(1, dt / 0.08);
    cara.setAttribute("transform", `translate(${ex.toFixed(2)} ${ey.toFixed(2)})`);
    const hop = e === "feliz" && fase === "casa" && loopStart < 0 ? -Math.abs(Math.sin((t - emoStart) * 6)) * 4 : 0;

    rot += (tilt - rot) * Math.min(1, dt / 0.35);
    pos.setAttribute("transform", `translate(${(x).toFixed(2)} ${(y + hop).toFixed(2)})`);
    cuerpo.setAttribute("transform", `rotate(${(rot + loopRot).toFixed(2)} 100 90)`);
    // La campana se angosta y se alarga al contraerse.
    const sx = 1 - 0.13 * fuerza, sy = 1 + 0.07 * fuerza;
    campana.setAttribute("transform", `translate(100 62) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-100 -62)`);
    // Tentáculos: velocidad pasada al marco del cuerpo, para que queden detrás del movimiento.
    const vxb = vx * Math.cos(ang) + vy * Math.sin(ang), vyb = -vx * Math.sin(ang) + vy * Math.cos(ang);
    onda += dt * (durmiendo ? 1.2 : 2.4 + 2 * fuerza);
    const estira = 1 + Math.max(-0.12, Math.min(0.28, -vyb * 0.004)) - 0.06 * fuerza;
    dibujarTentaculos(sx, sy, onda, Math.max(-30, Math.min(30, vxb * 0.12)), estira);

    if (durmiendo && t > nextZ) { zeta(); nextZ = t + rnd(1.4, 2.2); }
    if (!durmiendo && t > nextBurbuja) { burbuja(); nextBurbuja = t + (fase === "fuera" ? rnd(0.6, 1.2) : rnd(3, 6)); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    stop() { cancelAnimationFrame(raf); },
    setMood(m) { mood = m; },
    accion(a) { pedido = a; },
  };
}
