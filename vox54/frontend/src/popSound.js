// "Pop" sintético para el estallido de las burbujas — sin depender de
// ningún archivo de audio externo (nada que descargar, licenciar ni
// alojar). Segundo rediseño: la versión anterior (ruido dominante,
// tipo "crack") sonaba más a chasquido/estática que a un "pop" real —
// feedback directo: "prefiero un sonido más pop". Un pop reconocible
// (burbuja de chicle, corcho, el sonido clásico de una UI) es sobre
// todo TONAL — un golpe muy corto seguido de un tono redondo que cae
// de tono rápido — con apenas un click brevísimo al inicio para el
// ataque percusivo (la "p" de "pop"), no una ráfaga de ruido sostenida.
// Acá el tono manda: 2 osciladores (fundamental + una octava arriba,
// más suave, para que suene redondo y no delgado) con una caída de
// tono marcada, y el click queda reducido a una chispa de 3ms.
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
    const baseFreq = 820 - Math.min(size, 130) * 2.6;
    const jitter = 0.92 + Math.random() * 0.16;
    const freq = baseFreq * jitter;

    // --- capa 1: el click — una chispa brevísima (3ms) que le da el
    // ataque percusivo del inicio, la "p" de "pop"; casi imperceptible
    // por separado, solo define el golpe antes de que entre el tono.
    const clickDur = 0.003;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * clickDur));
    const clickBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = clickBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const click = ctx.createBufferSource();
    click.buffer = clickBuffer;
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = "lowpass";
    clickFilter.frequency.value = freq * 4;
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.09, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + clickDur);
    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);

    // --- capa 2: el cuerpo del pop — el tono que manda. Fundamental +
    // una octava arriba más suave (le da redondez, evita que suene
    // delgado/sintético) — ambos con la misma caída de tono marcada,
    // el contorno que reconocemos como "pop" en vez de un pitido plano.
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.7, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.45, 110), now + 0.075);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.075, now + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 3.4, now);
    osc2.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.9, 220), now + 0.06);
    osc2Gain.gain.setValueAtTime(0.0001, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.025, now + 0.003);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    osc2.connect(osc2Gain);
    osc2Gain.connect(ctx.destination);

    click.start(now);
    click.stop(now + clickDur);
    osc.start(now);
    osc.stop(now + 0.11);
    osc2.start(now);
    osc2.stop(now + 0.08);

    osc.onended = () => {
      osc.disconnect();
      oscGain.disconnect();
    };
    osc2.onended = () => {
      osc2.disconnect();
      osc2Gain.disconnect();
    };
    click.onended = () => {
      click.disconnect();
      clickFilter.disconnect();
      clickGain.disconnect();
    };
  } catch {
    // el sonido nunca debe romper el estallido visual si algo falla acá
  }
}
