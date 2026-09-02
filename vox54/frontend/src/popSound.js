// "Pop" sintético para el estallido de las burbujas — sin depender de
// ningún archivo de audio externo (nada que descargar, licenciar ni
// alojar). Un oscilador con un barrido de tono hacia abajo + una
// envolvente de volumen corta suena exactamente como un "pop" real,
// mantenido deliberadamente bajo (sutil, nunca un efecto que llame la
// atención). Un solo AudioContext compartido, reusado en cada estallido.
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

// size: el diámetro real de la burbuja que estalló — burbujas grandes
// suenan un poco más graves, las chicas más agudas, como en la vida real,
// para que 6 estallidos seguidos no suenen todos idénticos.
export function playPopSound(size = 20) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 1500 - Math.min(size, 130) * 4;
    const jitter = 0.92 + Math.random() * 0.16;
    const startFreq = baseFreq * jitter;

    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(startFreq * 0.4, 80), now + 0.09);

    // pico bajo (0.07 de 1.0) y decaimiento rápido — sutil a propósito
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    // el sonido nunca debe romper el estallido visual si algo falla acá
  }
}
