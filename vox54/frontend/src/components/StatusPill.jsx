// Mismos 2 valores reales del catálogo (active/paused) — nunca un tercer
// estado inventado. Sin dato (negocio recién creado, todavía cargando) no
// muestra nada en vez de adivinar.
const CONFIG = {
  active: { label: "Activo", color: "var(--success)", bg: "rgba(34,197,94,0.1)" },
  paused: { label: "Pausado", color: "var(--ink-softer)", bg: "rgba(156,163,175,0.14)" },
};

export default function StatusPill({ status }) {
  const cfg = CONFIG[status];
  if (!cfg) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        borderRadius: 999,
        padding: "3px 9px",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}
