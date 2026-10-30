// JarGrowth versión 2 (30-oct): anatomía de pulpo real. La versión 1 está en v1/.
// JarGrowth (30-oct): el pulpo verde de Growth54 (el del rincón del panel), dibujado con el
// mismo estilo y las mismas animaciones que Jelly (PROYECTO-SOL/2026/11-JELLY54/jelly54.js):
// contorno oscuro, ojos casi todo pupila con dos brillos y el cachete que les corta la parte de
// abajo, cejas en punta, rubor en puntitos y boca abierta con lengua. Del pulpo original conserva
// la forma (cabeza redonda, 8 tentáculos) y los verdes. Los tentáculos se abren hacia los
// costados y tienen la punta enroscada, como un pulpo.
// Comportamiento (igual que Jelly): flota latiendo, mueve la mirada, parpadea, cambia de emoción
// (feliz, curioso, sorpresa), da una vuelta, sale de paseo por la pantalla y vuelve, y duerme la
// siesta con zetas; se despierta si le hablan.
//
// Uso:
//   import { startJarGrowth } from "./jargrowth.js";
//   const jar = startJarGrowth(document.querySelector("#jar"));   // el host define el tamaño
//   jar.setMood("hablando");   // "quieto" (por defecto), "hablando" o "pensando"
//   jar.accion("paseo");       // también "siesta", "despertar", "vuelta", "feliz", "curioso", "sorpresa"
//   jar.stop();                // corta la animación
// Opciones: startJarGrowth(host, { fondo: true }) dibuja el cuadrado gris claro del ícono detrás.
// Para que pueda pasear, el host y sus contenedores no deben recortar lo que sobresale
// (sin overflow: hidden). Con "movimiento reducido" del sistema queda quieto.

const VERDE = "#16A34A", VERDE_CUERPO = "#2AAE5F";   // VERDE_CUERPO: el de abajo de la cabeza y el de los tentáculos
const BORDE = "#14532D", NEGRO = "#111827", BOCA = "#7A1F24", LENGUA = "#E8707A", RUBOR = "#F08A94";
const OJOS = [[76, 62], [124, 62]];   // centros de los ojos
const TENTACULOS = [[58, 88], [70, 106], [84, 97], [95, 113], [105, 113], [116, 97], [130, 106], [142, 88]];
const CABEZA = 0.86;   // tamaño de la cabeza respecto del dibujo original
const GAZES = [[0, 0], [3.5, 0], [-3.5, 0], [0, -2.6], [2.6, -2], [-2.6, 1.5]];
let unico = 0;
// Curva del cachete de cada ojo (puntos "x y" de inicio, control y fin): empieza en el borde de
// adentro del ojo, cruza la parte de abajo subiendo un poco y sale del ojo hacia afuera.
const cachete = (cx, cy, afuera) => [[-12, 9.5], [3, 4.5], [15.5, 11]].map(([dx, dy]) => `${(cx + afuera * dx).toFixed(1)} ${(cy + dy).toFixed(1)}`);

export function startJarGrowth(host, opciones = {}) {
  const id = `jar${++unico}`;
  host.innerHTML = `<svg class="jargrowth" viewBox="0 0 200 200" aria-label="JarGrowth" role="img" style="overflow:visible">` +
    (opciones.fondo ? `<rect x="8" y="8" width="184" height="184" rx="44" fill="#F1F7F7"/>` : "") +
    // Achicado al 64 % y bajado: el manto es más alto y los brazos más largos, y así entra todo.
    `<g class="burbujas"></g><g class="pos"><g transform="translate(36 18) scale(0.64)"><g class="cuerpo">` +
    // Brazos (versión 2): cada uno es una forma rellena, gruesa arriba y finita en la punta, con
    // contorno y dos filas de ventosas del lado de adentro. Encima de las bases va la membrana que
    // une los brazos (como en un pulpo real), con el borde en curvas entre brazo y brazo.
    `<g class="tentaculos">${TENTACULOS.map(() => `<g><path fill="${VERDE_CUERPO}" stroke="${BORDE}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<g>${"<circle fill=\"#C9F2D6\" stroke=\"#2E7D4F\" stroke-width=\"0.8\"/>".repeat(8)}</g></g>`).join("")}</g>` +
    `<path class="membrana" fill="${VERDE_CUERPO}"/><path class="membrana-borde" fill="none" stroke="${BORDE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    // Manto (versión 2): el saco alto con forma de huevo que en un pulpo real queda arriba de los
    // ojos; la cara queda en la parte de abajo, cerca de donde nacen los brazos. Se angosta apenas abajo en un cuello, con una banda más clara arriba. Abajo no
    // tiene contorno ni sombra y termina en el mismo verde de los tentáculos: un solo cuerpo.
    `<defs><linearGradient id="${id}-g-campana" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6EDC98"/>` +
    `<stop offset="0.36" stop-color="#4CC97E"/><stop offset="0.44" stop-color="#34B96A"/><stop offset="1" stop-color="${VERDE_CUERPO}"/></linearGradient>` +
    `<clipPath id="${id}-boca"><path class="boca-clip"/></clipPath></defs>` +
    `<g class="campana"><path class="sifon" fill="${VERDE_CUERPO}" stroke="${BORDE}" stroke-width="2.4" stroke-linejoin="round" d="M46 80 Q30 82 24 92 Q22 99 29 99 Q36 96 50 90 Z"/><ellipse cx="25.5" cy="95.5" rx="2.6" ry="3.4" fill="#0F5A2E" transform="rotate(30 25.5 95.5)"/><clipPath id="${id}-domo"><path d="M66 101 C44 94 32 76 32 52 C32 12 62 -18 100 -18 C138 -18 168 12 168 52 C168 76 156 94 134 101 Q100 109 66 101 Z"/></clipPath>` +
    `<path fill="url(#${id}-g-campana)" d="M66 101 C44 94 32 76 32 52 C32 12 62 -18 100 -18 C138 -18 168 12 168 52 C168 76 156 94 134 101 Q100 109 66 101 Z"/>` +
    `<path fill="none" stroke="${BORDE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M72 103 Q68 102 66 101 C44 94 32 76 32 52 C32 12 62 -18 100 -18 C138 -18 168 12 168 52 C168 76 156 94 134 101 Q132 102 128 103"/>` +
    `<ellipse cx="96" cy="-4" rx="18" ry="7" fill="#FFFFFF" opacity="0.45" transform="rotate(-10 96 -4)"/>` +
    `<ellipse cx="54" cy="18" rx="6.5" ry="4.4" fill="#FFFFFF" opacity="0.5" transform="rotate(-50 54 18)"/>` +
    // Cara: ojos con el blanco finito y casi todo negro, con dos brillos (son los que siguen la
    // mirada), cejitas, rubor en puntitos y una boca abierta con lengua.
    `<g class="cara"><g class="mejillas">${[[59, 87], [66, 85.5], [134, 85.5], [141, 87]].map(([cx, cy]) => `<ellipse cx="${cx}" cy="${cy}" rx="3" ry="2.1" fill="${RUBOR}"/>`).join("")}</g>` +
    // Cejas como en la referencia: rellenas, finitas y en punta hacia afuera, gruesas y redondeadas
    // hacia adentro, en arco.
    `<g class="cejas">${OJOS.map(([cx, cy], i) => { const af = i ? 1 : -1, bx = cx + af * 3, by = cy - 23, X = (dx) => (bx - af * dx).toFixed(1);
      return `<path d="M${X(-7)} ${by + 2} Q${X(-2.4)} ${by - 3.6} ${X(5.2)} ${by - 2.2} Q${X(7.6)} ${by - 1.7} ${X(6.6)} ${by + 0.4} Q${X(1.4)} ${by - 0.9} ${X(-7)} ${by + 2} Z" fill="${NEGRO}" stroke="${NEGRO}" stroke-width="0.6" stroke-linejoin="round"/>`; }).join("")}</g>` +
    // 30-oct (detalles de la referencia que marcó la usuaria): el contorno no es parejo, es más
    // grueso arriba y hacia afuera y más fino abajo y hacia adentro (un óvalo negro corrido hacia
    // arriba y afuera, con el blanco encima corrido hacia abajo y adentro). Aro blanco finito y
    // pupila negra grande con un brillo grande y uno chico. El cachete sube y le corta la parte de
    // abajo al ojo: la curva cruza el ojo y lo que queda debajo no se ve (recorte con clipPath).
    `<clipPath id="${id}-ojos"><path clip-rule="evenodd" d="M30 20 H170 V110 H30 Z ${OJOS.map(([cx, cy], i) => {
      const [a, c, b] = cachete(cx, cy, i ? 1 : -1);
      return `M${a} Q${c} ${b} L${b.split(" ")[0]} ${cy + 40} L${a.split(" ")[0]} ${cy + 40} Z`; }).join(" ")}"/></clipPath>` +
    `<g class="ojos"><g clip-path="url(#${id}-ojos)">${OJOS.map(([cx, cy], i) => { const afuera = i ? 1 : -1; return `<ellipse cx="${cx + afuera * 0.7}" cy="${cy - 0.9}" rx="16" ry="17" fill="${NEGRO}"/>` +
      `<ellipse cx="${cx - afuera * 0.3}" cy="${cy + 0.5}" rx="13.8" ry="14.8" fill="#FFFFFF"/>`; }).join("")}` +
    `<g class="pupilas">${OJOS.map(([cx, cy]) => `<ellipse cx="${cx}" cy="${cy + 0.5}" rx="10.6" ry="11.5" fill="${NEGRO}"/>` +
      `<circle cx="${cx - 3}" cy="${cy - 3.9}" r="4.3" fill="#fff"/><circle cx="${cx + 2.4}" cy="${cy + 2.2}" r="2" fill="#fff"/>`).join("")}</g></g>` +
    // La línea del cachete, encima del corte (sale un poco del ojo hacia afuera).
    `${OJOS.map(([cx, cy], i) => { const [a, c, b] = cachete(cx, cy, i ? 1 : -1); return `<path d="M${a} Q${c} ${b}" stroke="${NEGRO}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; }).join("")}</g>` +
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
  const tentaculos = [...svg.querySelectorAll(".tentaculos > g")].map((g) => [g.children[0], [...g.children[1].children]]), burbujas = $(".burbujas");
  const membrana = $(".membrana"), membranaBorde = $(".membrana-borde");
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
  dibujarTentaculos(1, 1, 0, 0, 1, 0);
  campana.setAttribute("transform", `translate(100 96) scale(${CABEZA}) translate(-100 -96)`);
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

  // Brazos (versión 2), como se mueven en un pulpo real. Cada brazo es un trazo que avanza en
  // pasos y va girando, y se mueve por su cuenta: su propia onda viaja de la base a la punta, a su
  // propio ritmo, y su punta se enrosca y se suelta despacio, cada una en otro momento.
  // `cierre` (0 a 1) es el nado a chorro: el manto se contrae, los brazos se juntan y se estiran
  // hacia atrás; cuando el manto se vuelve a llenar, se abren otra vez.
  // Alrededor del trazo se dibuja la forma, gruesa arriba y finita en la punta; arriba de las
  // bases, la membrana que une un brazo con el siguiente.
  function dibujarTentaculos(sx, sy, w, lat, estira, cierre) {
    const n = 16, m = 4, todos = [];
    const ancho = (u) => 18.5 * (1 - u) + 3.6 * u;
    const borde = (q, u, lado2) => [q[0] + Math.cos(q[2]) * ancho(u) / 2 * lado2, q[1] - Math.sin(q[2]) * ancho(u) / 2 * lado2];
    const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    TENTACULOS.forEach(([x0, largo], k) => {
      const lado = x0 < 100 ? -1 : 1, paso = (largo * estira * (1 + 0.12 * cierre)) / n;
      const ritmo = 0.75 + 0.12 * (k % 4), fase = k * 1.37;
      const enrosque = (0.45 + 0.4 * (0.5 + 0.5 * Math.sin(w * 0.35 * ritmo + fase * 1.9))) * (1 - 0.7 * cierre);
      // Salen juntos, del cuello (más angosto que el manto), y recién después se abren.
      let x = 100 + (x0 - 100) * 0.7 * sx, y = 96 + 6 * (sy - 1);
      let h = ((x0 - 100) / 42) * 0.95 * (1.15 - 0.15 * sx) * (1 - 0.6 * cierre);   // ángulo: 0 = hacia abajo
      const pts = [[x, y, h]];
      for (let i = 1; i <= n; i++) {
        const u = i / n, rizo = u > 0.5 ? ((u - 0.5) / 0.5) ** 1.6 : 0;
        h += Math.sin(w * ritmo - u * 3.6 + fase) * 0.11 * u - lat * 0.0035 + lado * enrosque * rizo;
        x += Math.sin(h) * paso; y += Math.cos(h) * paso;
        pts.push([x, y, h]);
      }
      const izq = pts.map((q, i) => borde(q, i / n, 1)), der = pts.map((q, i) => borde(q, i / n, -1)).reverse();
      const [pata, ventosas] = tentaculos[k];
      pata.setAttribute("d", `M${izq.map(f).join(" L")} L${der.map(f).join(" L")} Z`);
      // Dos filas de ventosas, alternadas, del lado de adentro, más chicas hacia la punta.
      ventosas.forEach((c, j) => {
        const u = 0.28 + j * 0.075, q = pts[Math.round(u * n)], [bx, by] = borde(q, u, -lado * (j % 2 ? 0.52 : 0.12));
        c.setAttribute("cx", bx.toFixed(1)); c.setAttribute("cy", by.toFixed(1));
        c.setAttribute("r", (2.1 * (1 - u) + 0.8).toFixed(2));
      });
      todos.push(pts);
    });
    // Membrana: de la base de cada brazo hasta un cuarto de su largo, con el borde en curva entre
    // brazo y brazo (la curva se mete hacia el cuello). Los bordes de afuera siguen al primer y al
    // último brazo, así el contorno del pulpo no se corta.
    const um = m / n, centro = [100, 96 + 6 * (sy - 1)];
    const ext = todos[0].slice(0, m + 1).map((q, i) => borde(q, i / n, -1));
    const extFin = todos[todos.length - 1].slice(0, m + 1).map((q, i) => borde(q, i / n, 1)).reverse();
    let relleno = `M${f(centro)} L${ext.map(f).join(" L")}`, linea = `M${ext.map(f).join(" L")}`;
    for (let k = 0; k < todos.length; k++) {
      const a = borde(todos[k][m], um, -1), b = borde(todos[k][m], um, 1);
      relleno += ` L${f(a)} L${f(b)}`;
      if (k < todos.length - 1) {
        const sig = borde(todos[k + 1][m], um, -1);
        const c = [(b[0] + sig[0]) / 2 * 0.6 + centro[0] * 0.4, (b[1] + sig[1]) / 2 * 0.6 + centro[1] * 0.4];
        relleno += ` Q${f(c)} ${f(sig)}`;
        linea += ` M${f(b)} Q${f(c)} ${f(sig)}`;
      }
    }
    relleno += ` L${extFin.map(f).join(" L")} Z`;
    linea += ` M${extFin.map(f).join(" L")}`;
    membrana.setAttribute("d", relleno); membranaBorde.setAttribute("d", linea);
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
    z.setAttribute("font-size", rnd(13, 19)); z.setAttribute("font-weight", "700"); z.setAttribute("fill", VERDE);
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
    // La cabeza va al 86 % de su tamaño (pedido de la usuaria), achicada desde abajo para que
    // siga pegada a los tentáculos.
    campana.setAttribute("transform", `translate(100 96) scale(${(sx * CABEZA).toFixed(3)} ${(sy * CABEZA).toFixed(3)}) translate(-100 -96)`);
    // Tentáculos: velocidad pasada al marco del cuerpo, para que queden detrás del movimiento.
    const vxb = vx * Math.cos(ang) + vy * Math.sin(ang), vyb = -vx * Math.sin(ang) + vy * Math.cos(ang);
    onda += dt * (durmiendo ? 1.2 : 2.4 + 2 * fuerza);
    const estira = 1 + Math.max(-0.12, Math.min(0.28, -vyb * 0.004)) - 0.06 * fuerza;
    // Nado a chorro: al contraerse el manto los brazos se juntan; mucho más cuando sale de paseo.
    dibujarTentaculos(sx, sy, onda, Math.max(-30, Math.min(30, vxb * 0.12)), estira, fuerza * (fase === "fuera" ? 1 : 0.35));

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
