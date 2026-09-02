// "Pop" sintético para el estallido de las burbujas — sin depender de
// ningún archivo de audio externo (nada que descargar, licenciar ni
// alojar). Un pop de burbuja real es, sobre todo, un chasquido — un
// golpe corto y seco, casi todo ruido — con apenas un resonancia suave
// por debajo que se apaga enseguida; no es un tono que se escucha solo.
// Por eso acá el "snap" (ruido filtrado, decayendo rapidísimo) es la
// capa protagonista y el "boop" (un seno corto) queda muy por debajo,
// como cola, no como voz principal — la primera versión tenía esto al
// revés y sonaba más a un blip electrónico que a un reviente real.
// Mantenido bajo a propósito (sutil, nunca un efecto que llame la
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
    const baseFreq = 1500 - Math.min(size, 130) * 5;
    const jitter = 0.9 + Math.random() * 0.2;
    const freq = baseFreq * jitter;

    // --- capa 1: el chasquido — la parte que realmente hace que suene
    // a "pop" y no a un pitido. Ruido filtrado con un pasa-banda angosto
    // que se desliza hacia abajo muy rápido, y una caída de volumen
    // todavía más rápida que la del propio buffer (doble envolvente) —
    // el golpe seco de una membrana reventando, no un "shh" sostenido.
    const noiseDur = 0.035;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * noiseDur));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.12));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.Q.value = 3.2;
    noiseFilter.frequency.setValueAtTime(freq * 3, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.035);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.24, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // --- capa 2: la resonancia — una cola tonal muy discreta por debajo
    // del chasquido, apenas perceptible por separado; le da cuerpo sin
    // convertirse en un tono que se escuche solo.
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.3, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.55, 90), now + 0.07);

    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.022, now + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + noiseDur);
    osc.start(now);
    osc.stop(now + 0.1);

    osc.onended = () => {
      osc.disconnect();
      oscGain.disconnect();
    };
    noise.onended = () => {
      noise.disconnect();
      noiseFilter.disconnect();
      noiseGain.disconnect();
    };
  } catch {
    // el sonido nunca debe romper el estallido visual si algo falla acá
  }
}
