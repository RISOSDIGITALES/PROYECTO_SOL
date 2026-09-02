// "Pop" sintético para el estallido de las burbujas — sin depender de
// ningún archivo de audio externo (nada que descargar, licenciar ni
// alojar). Quinto rediseño: las versiones anteriores construían un
// "pop" musical — una nota con caída de tono — pero una burbuja real
// (o el plástico de burbujas, la referencia más reconocible) no suena
// a una nota, suena a un golpe seco y corto: un solo transiente de
// ruido, filtrado hasta que colapsa a grave en 15-20 milisegundos,
// SIN ninguna melodía ni sostenido. Acá ya no hay ningún oscilador —
// es puro ruido pasado por un filtro resonante que arranca agudo (el
// "tick" del reviente) y cae en picada a un cuerpo grave (el "thock"),
// nada más. Todo el sonido dura ~25ms, mucho más corto que los
// intentos anteriores — un pop real no se sostiene. Mantenido bajo
// a propósito (sutil, nunca un efecto que llame la atención). Un solo
// AudioContext compartido, reusado en cada estallido.
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
// suenan un poco más graves, las chicas un poco más agudas, para que
// 6 estallidos seguidos no suenen todos idénticos.
export function playPopSound(size = 20) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const jitter = 0.9 + Math.random() * 0.2;
    const sizeFactor = 1 - Math.min(size, 130) / 220; // grande = más grave
    const startCutoff = (1900 + Math.random() * 300) * sizeFactor * jitter;
    const endCutoff = (260 + size * 0.6) * sizeFactor;
    const dur = 0.024;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // el filtro es lo que hace todo el trabajo acá: arranca dejando
    // pasar el ruido agudo (el "tick" del instante que revienta) y en
    // pocos milisegundos colapsa a un pasa-bajos grave (el "thock" del
    // cuerpo) — con algo de resonancia (Q) para que el colapso se
    // sienta como un golpe con peso, no un simple fundido.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(startCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(endCutoff, now + dur * 0.7);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + dur);
    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch {
    // el sonido nunca debe romper el estallido visual si algo falla acá
  }
}
