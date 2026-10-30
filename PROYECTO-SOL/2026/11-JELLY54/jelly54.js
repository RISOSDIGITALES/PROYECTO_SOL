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

const AZUL = "#2E8BE3", AZUL_CLARO = "#5AA8EC", AZUL_OSCURO = "#2A7AD3";
// 30-oct (pedido de Don Marc): dibujo al estilo de la medusa que armó con Gemini, tipo
// caricatura: contorno azul marino, ojos negros grandes con dos brillos, cejitas, boca abierta
// con lengua (sin dientes), rubor en puntitos, campana brillante con el borde en lóbulos y
// 7 tentáculos con contorno. Las animaciones son las mismas de antes.
const BORDE = "#163A73", NEGRO = "#111827", BOCA = "#7A1F24", LENGUA = "#E8707A", RUBOR = "#F08A94";
const OJOS = [[76, 62], [124, 62]];   // centros de los ojos
const TENTACULOS = [[52, 50], [66, 66], [83, 58], [100, 72], [117, 60], [134, 68], [148, 52]];
const GAZES = [[0, 0], [3.5, 0], [-3.5, 0], [0, -2.6], [2.6, -2], [-2.6, 1.5]];
let unico = 0;

export function startJelly(host, opciones = {}) {
  const id = `jelly${++unico}`;
  host.innerHTML = `<svg class="jelly54" viewBox="0 0 200 200" aria-label="Jelly" role="img" style="overflow:visible">` +
    (opciones.fondo ? `<rect x="8" y="8" width="184" height="184" rx="44" fill="#F1F7F7"/>` : "") +
    // Achicada al 85 % y bajada un poco: con los tentáculos estirados ocupaba todo el alto.
    `<g class="burbujas"></g><g class="pos"><g transform="translate(15 10) scale(0.85)"><g class="cuerpo">` +
    // Tentáculos (30-oct): cada uno es un trazo ancho azul marino (el contorno) con uno celeste encima.
    `<g class="tentaculos">${TENTACULOS.map(() => `<g><path fill="none" stroke="${BORDE}" stroke-width="12" stroke-linecap="round"/>` +
      `<path fill="none" stroke="${AZUL_CLARO}" stroke-width="8" stroke-linecap="round"/></g>`).join("")}</g>` +
    // Campana con una banda más clara arriba (como en la imagen de referencia) y el borde en lóbulos.
    `<defs><linearGradient id="${id}-g-campana" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7CBCF3"/>` +
    `<stop offset="0.36" stop-color="#5FA9EE"/><stop offset="0.44" stop-color="#3E91E4"/><stop offset="1" stop-color="${AZUL_OSCURO}"/></linearGradient>` +
    `<clipPath id="${id}-boca"><path class="boca-clip"/></clipPath></defs>` +
    `<g class="campana"><clipPath id="${id}-domo"><path d="M36 98 C34 48 66 24 100 24 C134 24 166 48 164 98 Z"/></clipPath>` +
    `<path fill="${AZUL}" stroke="${BORDE}" stroke-width="2.6" stroke-linejoin="round" d="M38 94 Q46 110 56 102 Q66 112 78 103 Q89 112 100 103 Q111 112 122 103 Q134 112 144 102 Q154 110 162 94 Z"/>` +
    `<path fill="url(#${id}-g-campana)" d="M36 98 C34 48 66 24 100 24 C134 24 166 48 164 98 Z"/>` +
    `<g clip-path="url(#${id}-domo)"><ellipse cx="100" cy="106" rx="72" ry="13" fill="#1B5FB5" opacity="0.3"/></g>` +
    `<path fill="none" stroke="${BORDE}" stroke-width="2.6" stroke-linejoin="round" d="M36 98 C34 48 66 24 100 24 C134 24 166 48 164 98 Z"/>` +
    `<ellipse cx="100" cy="36" rx="14" ry="6" fill="#FFFFFF" opacity="0.45" transform="rotate(-8 100 36)"/>` +
    `<ellipse cx="62" cy="50" rx="6" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-40 62 50)"/>` +
    // Cara: ojos con el blanco finito y casi todo negro, con dos brillos (son los que siguen la
    // mirada), cejitas, rubor en puntitos y una boca abierta con lengua.
    `<g class="cara"><g class="mejillas">${[[58, 81], [65, 79.5], [135, 79.5], [142, 81]].map(([cx, cy]) => `<ellipse cx="${cx}" cy="${cy}" rx="3" ry="2.1" fill="${RUBOR}"/>`).join("")}</g>` +
    `<g class="cejas">${OJOS.map(([cx, cy], i) => `<path d="M${cx - 7 + (i ? 3 : -3)} ${cy - 24} Q${cx + (i ? 3 : -3)} ${cy - 28.5} ${cx + 7 + (i ? 3 : -3)} ${cy - 24}" stroke="${NEGRO}" stroke-width="3.8" fill="none" stroke-linecap="round"/>`).join("")}</g>` +
    // 30-oct (detalles de la referencia que marcó la usuaria): el contorno no es parejo, es más
    // grueso arriba y hacia afuera y más fino abajo y hacia adentro (un óvalo negro corrido hacia
    // arriba y afuera, con el blanco encima corrido hacia abajo y adentro); debajo, pegada al ojo,
    // una línea curva como el cachete que sube al sonreír. Aro blanco finito y pupila negra grande
    // con un brillo grande y uno chico.
    `<g class="ojos">${OJOS.map(([cx, cy], i) => { const afuera = i ? 1 : -1; return `<ellipse cx="${cx + afuera * 1}" cy="${cy - 1.3}" rx="17.6" ry="18.6" fill="${NEGRO}"/>` +
      `<ellipse cx="${cx - afuera * 0.4}" cy="${cy + 0.7}" rx="14.6" ry="15.6" fill="#FFFFFF"/>` +
      // La línea del cachete es un arquito que sube (︵), debajo del ojo y hacia afuera, pegado
      // encima del borde del ojo (la punta se monta sobre el contorno): es el cachete empujando al sonreír, no una ojera.
      (() => { const a = (115 * Math.PI) / 180, px = cx + afuera * 1 + afuera * 17.6 * -Math.cos(a), py = cy - 1.3 + 18.6 * Math.sin(a);
        return `<path d="M${(px - 6.5).toFixed(1)} ${(py + 1.4).toFixed(1)} Q${px.toFixed(1)} ${(py - 4.8).toFixed(1)} ${(px + 6.5).toFixed(1)} ${(py + 1.4).toFixed(1)}" stroke="${NEGRO}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; })(); }).join("")}` +
    `<g class="pupilas">${OJOS.map(([cx, cy]) => `<ellipse cx="${cx}" cy="${cy + 0.5}" rx="11.3" ry="12.3" fill="${NEGRO}"/>` +
      `<circle cx="${cx - 3.2}" cy="${cy - 4.2}" r="4.6" fill="#fff"/><circle cx="${cx + 2.6}" cy="${cy + 2.4}" r="2.1" fill="#fff"/>`).join("")}</g></g>` +
    `<path class="ojos-felices" d="M62 66 Q76 50 90 66 M110 66 Q124 50 138 66" stroke="${NEGRO}" stroke-width="3.8" fill="none" stroke-linecap="round" opacity="0"/>` +
    `<path class="ojos-dormidos" d="M62 62 Q76 73 90 62 M110 62 Q124 73 138 62" stroke="${NEGRO}" stroke-width="3.8" fill="none" stroke-linecap="round" opacity="0"/>` +
    `<g class="boca-o" opacity="0"><ellipse cx="100" cy="88" rx="6" ry="7" fill="${BOCA}" stroke="${NEGRO}" stroke-width="2"/>` +
    `<ellipse cx="100" cy="92.5" rx="3.6" ry="2.2" fill="${LENGUA}"/></g>` +
    // Boca: el contorno se dibuja en cada cuadro; la lengua queda recortada adentro.
    `<g class="boca"><path class="boca-fondo" fill="${BOCA}"/><g clip-path="url(#${id}-boca)">` +
    `<ellipse class="lengua" cx="100" cy="92" rx="7" ry="4.5" fill="${LENGUA}"/></g>` +
    `<path class="boca-borde" fill="none" stroke="${NEGRO}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path class="comisuras" fill="none" stroke="${NEGRO}" stroke-width="2" stroke-linecap="round"/></g></g></g>` +
    `</g></g></g></svg>`;
  const svg = host.firstElementChild;
  svg.setAttribute("width", "100%"); svg.setAttribute("height", "100%");
  const $ = (s) => svg.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";
  const pos = $(".pos"), cuerpo = $(".cuerpo"), campana = $(".campana"), cara = $(".cara"), ojos = $(".ojos"), pupilas = $(".pupilas");
  const felices = $(".ojos-felices"), dormidos = $(".ojos-dormidos"), boca = $(".boca"), bocaO = $(".boca-o");
  const bocaFondo = $(".boca-fondo"), bocaClip = $(".boca-clip"), bocaBorde = $(".boca-borde"), comisuras = $(".comisuras"), lengua = $(".lengua"), cejas = $(".cejas");
  const tentaculos = [...svg.querySelectorAll(".tentaculos > g")].map((g) => [...g.children]), burbujas = $(".burbujas");
  svg.appendChild(burbujas);   // adelante de la medusa
  ojos.style.transformBox = "view-box"; ojos.style.transformOrigin = "100px 62px";

  // Sonrisa abierta (29-oct): el borde de arriba casi recto y el de abajo en curva; `abre` es
  // cuánto baja la curva (más con alegría o al hablar).
  function dibujarBoca(ancho, abre) {
    const y0 = 79, d = `M${100 - ancho} ${y0} Q100 ${y0 + 2} ${100 + ancho} ${y0} Q100 ${(y0 + abre).toFixed(2)} ${100 - ancho} ${y0} Z`;
    bocaFondo.setAttribute("d", d); bocaClip.setAttribute("d", d); bocaBorde.setAttribute("d", d);
    // Rayitas curvas en las puntas de la sonrisa, como en la referencia.
    const l = 100 - ancho, r = 100 + ancho;
    comisuras.setAttribute("d", `M${l - 3.5} ${y0 - 3} Q${l - 2} ${y0 + 0.5} ${l + 1} ${y0 + 0.8} M${r + 3.5} ${y0 - 3} Q${r + 2} ${y0 + 0.5} ${r - 1} ${y0 + 0.8}`);
    // La curva llega hasta la mitad de `abre`: la lengua va en el fondo de esa curva.
    lengua.setAttribute("cy", (y0 + abre * 0.46).toFixed(2));
    lengua.setAttribute("rx", (ancho * 0.55).toFixed(2));
  }

  let mood = "quieto", pedido = null;
  // Tentáculos y boca en reposo, para el dibujo quieto (y el arranque).
  dibujarTentaculos(1, 1, 0, 0, 0);
  dibujarBoca(13, 20);
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
      const rx = 100 + (x0 - 100) * sx, ry = 62 + (102 - 62) * sy, n = 6, pts = [];
      const abre = (x0 - 100) * 0.12 * (1 - sx) * 4;   // al contraerse, las puntas se abren un poco
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const ondaX = Math.sin(w - u * 3.4 + k * 0.9) * 6.5 * u;
        pts.push([rx + ondaX + abre * u - lat * u * u, ry + largo * estira * u]);
      }
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < n; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const dd = d + ` L${pts[n][0].toFixed(1)} ${pts[n][1].toFixed(1)}`;
      tentaculos[k].forEach((p) => p.setAttribute("d", dd));
    });
  }
  function burbuja() {
    const c = document.createElementNS(NS, "circle");
    const a = (rot * Math.PI) / 180, bx = 100 + x + Math.sin(a) * 70 + rnd(-30, 30), by = 62 + y - Math.cos(a) * 40;
    c.setAttribute("cx", bx); c.setAttribute("cy", by); c.setAttribute("r", rnd(3, 5.5));
    c.setAttribute("fill", "#EAF5FF"); c.setAttribute("stroke", BORDE); c.setAttribute("stroke-width", "2");
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
    // Sonrisa abierta: más grande feliz, chiquita dormida, y se abre y cierra al hablar.
    const abre = (e === "feliz" ? 26 : durmiendo ? 6 : 20) + talk * 10, anchoBoca = e === "feliz" ? 15 : durmiendo ? 6 : 13;
    dibujarBoca(anchoBoca, abre);
    const enO = e === "sorpresa" && talk < 0.1;
    boca.setAttribute("opacity", enO ? 0 : 1);
    bocaO.setAttribute("opacity", enO ? 1 : 0);
    // Cejas: suben con la sorpresa y la curiosidad, bajan un poco dormida.
    const cejaY = e === "sorpresa" ? -4 : e === "curioso" ? -2.5 : durmiendo ? 2 : 0;
    cejas.setAttribute("transform", `translate(0 ${cejaY})`);
    if (e === "curioso") { tilt += 10; etx = 4; ety = 0; }
    if (mood === "pensando") { etx = 1.5; ety = -2.2; nextGaze = t + 1; }
    if (!durmiendo && t > nextGaze) { const g = GAZES[Math.floor(Math.random() * GAZES.length)]; etx = g[0]; ety = g[1]; nextGaze = t + rnd(1.2, 4); }
    ex += (etx - ex) * Math.min(1, dt / 0.08); ey += (ety - ey) * Math.min(1, dt / 0.08);
    // Las pupilas se mueven dentro del ojo y la cara entera acompaña un poco.
    pupilas.setAttribute("transform", `translate(${(ex * 0.95).toFixed(2)} ${(ey * 0.95).toFixed(2)})`);
    cara.setAttribute("transform", `translate(${(ex * 0.4).toFixed(2)} ${(ey * 0.4).toFixed(2)})`);
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
