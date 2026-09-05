import Icon from "./Icon";
import PoppableBubbles from "./PoppableBubbles";

// Mismo "todavía no hay nada real" que antes era un emoji 📞 suelto sobre
// una caja punteada — reemplazado por una escena chica y coherente con el
// resto de la marca: burbujas de vidrio reales (las mismas .vox54-amb
// poppable del login y los dockes, no una imitación) flotando alrededor
// del ícono de línea de teléfono, en vez de inventar un ilustración nueva
// o un mecanismo de animación aparte. Ni una burbuja, ni el ícono, son
// contenido — sacarlas nunca cambia lo que dice el estado, solo lo viste.
const STAGE_BUBBLES = [
  { id: "s1", size: 26, hue: "", delay: "0s", style: { left: "14%", top: "18%" } },
  { id: "s2", size: 16, hue: "green", delay: "0.6s", style: { left: "78%", top: "10%" } },
  { id: "s3", size: 20, hue: "violet", delay: "1.1s", style: { left: "84%", top: "58%" } },
  { id: "s4", size: 14, hue: "", delay: "1.7s", style: { left: "10%", top: "62%" } },
  { id: "s5", size: 18, hue: "green", delay: "0.3s", style: { left: "46%", top: "4%" } },
];

export default function EmptyCallsState({ title, subtitle }) {
  return (
    <div className="vox54-panel" style={emptyStateStyle}>
      <div style={stageStyle}>
        <PoppableBubbles bubbles={STAGE_BUBBLES} />
        <div style={coreStyle}>
          <Icon name="phone" size={26} style={{ color: "var(--g54-blue-dark)" }} />
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{subtitle}</div>
    </div>
  );
}

const emptyStateStyle = {
  border: "1px dashed var(--border)",
  padding: "20px 20px 32px",
  textAlign: "center",
};

const stageStyle = {
  position: "relative",
  height: 110,
  marginBottom: 6,
};

const coreStyle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  width: 56,
  height: 56,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "radial-gradient(circle at 30% 24%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 22%, transparent 46%), rgba(219,234,254,0.7)",
  border: "1.5px solid rgba(255,255,255,0.9)",
  boxShadow: "inset 0 -6px 10px rgba(45,91,255,0.12), inset 0 2px 3px rgba(255,255,255,0.85), 0 10px 18px -10px rgba(45,91,255,0.4)",
};
