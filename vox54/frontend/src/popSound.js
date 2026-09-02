// "Pop" sintético para el estallido de las burbujas — sin depender de
// ningún archivo de audio externo (nada que descargar, licenciar ni
// alojar). Tercer rediseño: la versión anterior (2 osciladores, tono
// dominante) sonaba "chillante" — el problema real era el registro,
// no la mezcla ruido/tono. Un pop de burbuja de verdad es grave y
// redondo, no agudo — acá se bajó el registro de fondo (unos 250-350Hz
// en vez de 700-2600Hz) y se agregó un filtro pasa-bajos que le saca
// el brillo áspero al tono, dejando solo el golpe suave y redondo.
// El click de ataque también quedó filtrado más grave, para que no
// aporte ningún filo agudo. Mantenido bajo a propósito (sutil, nunca
// un efecto que llame la atención). Un solo AudioContext compartido,
// reusado en cada estallido.
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
// suenan un poco más graves, las chicas un poco más agudas (sin llegar
// nunca a un registro chillón), para que 6 estallidos seguidos no
// suenen todos idénticos.
export function playPopSound(size = 20) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const baseFreq = 340 - Math.min(size, 130) * 0.9;
    const jitter = 0.92 + Math.random() * 0.16;
    const freq = baseFreq * jitter;

    // --- capa 1: el click — una chispa brevísima (3ms) filtrada bien
    // grave, solo para marcar el golpe inicial sin ningún filo agudo.
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
    clickFilter.frequency.value = freq * 2.2;
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.06, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + clickDur);
    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);

    // --- capa 2: el cuerpo del pop — un único tono grave y redondo,
    // con un pasa-bajos suave que le saca cualquier brillo áspero, y
    // una caída de tono corta (no un sweep largo, que suena a sirena).
    const oscFilter = ctx.createBiquadFilter();
    oscFilter.type = "lowpass";
    oscFilter.frequency.value = freq * 3.5;
    oscFilter.Q.value = 0.6;
    oscFilter.connect(ctx.destination);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.35, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.6, 90), now + 0.065);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(0.09, now + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(oscGain);
    oscGain.connect(oscFilter);

    click.start(now);
    click.stop(now + clickDur);
    osc.start(now);
    osc.stop(now + 0.12);

    osc.onended = () => {
      osc.disconnect();
      oscGain.disconnect();
      oscFilter.disconnect();
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
