// "Pop" sintético para el estallido de las burbujas — sin depender de
// ningún archivo de audio externo (nada que descargar, licenciar ni
// alojar). Sexto rediseño, con una referencia concreta y reconocible:
// el plástico de burbujas para empacar. Ese pop tiene 2 partes bien
// distintas — un "crack" agudo y crocante (la membrana rompiéndose,
// nítido, no apagado) seguido de inmediato por un "thump" grave con
// peso real (el aire de la burbuja escapando, el bolsillo colapsando)
// — la versión anterior (un solo filtro barriendo de agudo a grave)
// se quedaba corta de cuerpo/graves y sonaba más a un "tsk" delgado
// que a un pop con peso. Acá son 2 capas de ruido (nunca un oscilador
// — eso siempre termina sonando a nota musical, no a golpe físico):
// el crack, brillante y brevísimo; el thump, un pasa-bajos resonante
// grave y más largo que sí le da el "boom" de fondo. Mantenido bajo
// a propósito (sutil, nunca un efecto que llame la atención). Un solo
// AudioContext compartido, reusado en cada estallido.
//
// El interruptor de "Sonido" de Configuración vive acá adentro, no en cada
// lugar que llama a playPopSound — así cualquier caller nuevo lo respeta
// automáticamente sin tener que acordarse de chequearlo primero.
import { getPrefs } from "./prefs";

let audioCtx = null;

function getContext() {
  if (audioCtx) return audioCtx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = Ctx ? new Ctx() : null;
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

function makeNoiseBuffer(ctx, durSec) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * durSec));
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

// size: el diámetro real de la burbuja que estalló — pockets grandes
// suenan un poco más graves/con más cuerpo, chicos más secos/agudos,
// para que 6 estallidos seguidos no suenen todos idénticos.
export function playPopSound(size = 20) {
  if (!getPrefs().soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const jitter = 0.92 + Math.random() * 0.16;
    const sizeFactor = 1 - Math.min(size, 130) / 240; // grande = más grave

    // --- capa 1: el crack — la membrana rompiéndose. Muy corto (4ms),
    // pasa-altos para que quede brillante y nítido, nunca apagado —
    // es lo que le da el ataque "crocante" real del plástico.
    const crackDur = 0.004;
    const crack = ctx.createBufferSource();
    crack.buffer = makeNoiseBuffer(ctx, crackDur);
    const crackFilter = ctx.createBiquadFilter();
    crackFilter.type = "highpass";
    crackFilter.frequency.value = 1800 * sizeFactor * jitter;
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.09, now);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, now + crackDur);
    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(ctx.destination);

    // --- capa 2: el thump — el bolsillo de aire colapsando. Pasa-bajos
    // resonante grave (~110-190Hz según tamaño), con Q alto para que
    // tenga un poco de "boing" de cuerpo, y más largo (45ms) que el
    // crack para que se sienta el peso, no solo el golpe.
    const thumpDur = 0.045;
    const thump = ctx.createBufferSource();
    thump.buffer = makeNoiseBuffer(ctx, thumpDur);
    const thumpFilter = ctx.createBiquadFilter();
    thumpFilter.type = "lowpass";
    thumpFilter.Q.value = 9;
    const thumpFreq = (110 + size * 0.5) * sizeFactor * jitter;
    thumpFilter.frequency.setValueAtTime(thumpFreq * 2.2, now);
    thumpFilter.frequency.exponentialRampToValueAtTime(thumpFreq, now + 0.015);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.0001, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.5, now + 0.006);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + thumpDur);
    thump.connect(thumpFilter);
    thumpFilter.connect(thumpGain);
    thumpGain.connect(ctx.destination);

    crack.start(now);
    crack.stop(now + crackDur);
    thump.start(now);
    thump.stop(now + thumpDur);

    crack.onended = () => {
      crack.disconnect();
      crackFilter.disconnect();
      crackGain.disconnect();
    };
    thump.onended = () => {
      thump.disconnect();
      thumpFilter.disconnect();
      thumpGain.disconnect();
    };
  } catch {
    // el sonido nunca debe romper el estallido visual si algo falla acá
  }
}
