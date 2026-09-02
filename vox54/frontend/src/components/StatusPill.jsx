// Mismos 2 valores reales del catálogo (active/paused) — nunca un tercer
// estado inventado. Sin dato (negocio recién creado, todavía cargando) no
// muestra nada en vez de adivinar.
const CONFIG = {
  active: { label: "Activo", hue: "green" },
  paused: { label: "Pausado", hue: "gray" },
};

export default function StatusPill({ status }) {
  const cfg = CONFIG[status];
  if (!cfg) return null;
  return (
    <span className={`vox54-pill ${cfg.hue}`}>
      <span className="dot" />
      {cfg.label}
    </span>
  );
}
