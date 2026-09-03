import { setPref, usePrefs } from "../prefs";

// Compartido por la Configuración de agencia y la pestaña Cuenta de
// negocio — el interruptor real de sonido/animación que pidió la usuaria.
// Preferencia por navegador (localStorage, ver prefs.js), no un dato de
// cuenta real — por eso no pega a ningún endpoint, no hace falta `saving`
// ni `savedMessage`, el cambio ya es instantáneo y persiste solo.
export default function PrefsToggles() {
  const prefs = usePrefs();
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ToggleRow
        label="Sonido"
        detail="El 'pop' al tocar burbujas y confirmar acciones."
        checked={prefs.soundEnabled}
        onChange={(v) => setPref("soundEnabled", v)}
      />
      <ToggleRow
        label="Animaciones"
        detail="El flote de las burbujas y el efecto al confirmar acciones."
        checked={prefs.animationsEnabled}
        onChange={(v) => setPref("animationsEnabled", v)}
      />
    </div>
  );
}

function ToggleRow({ label, detail, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--ink-softer)" }}>{detail}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        style={{ ...toggleStyle, flexShrink: 0, background: checked ? "var(--success)" : "var(--border)" }}
      >
        <span style={{ ...toggleKnobStyle, transform: checked ? "translateX(20px)" : "translateX(2px)" }} />
      </button>
    </div>
  );
}

const toggleStyle = {
  width: 44,
  height: 24,
  borderRadius: 12,
  border: "none",
  position: "relative",
  cursor: "pointer",
  padding: 0,
  transition: "background 0.15s ease",
};

const toggleKnobStyle = {
  position: "absolute",
  top: 2,
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#fff",
  transition: "transform 0.15s ease",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
};
