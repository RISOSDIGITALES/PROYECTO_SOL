import { useEffect, useState } from "react";

// Preferencia real por navegador/dispositivo — nunca del lado del servidor,
// nunca por empresa ni por agencia. Es un ajuste de cómo SE VE la interfaz
// para quien la mira en ESTE navegador, no un dato de negocio (mismo
// criterio ya usado para todo lo que vive en localStorage en este proyecto:
// nunca se guarda algo acá que otro viewer/dispositivo necesite ver
// también). Default: todo activado, el comportamiento de siempre, hasta que
// alguien lo apaga a propósito desde Configuración.
const KEY = "vox54_prefs_v1";
const EVENT = "vox54:prefs-changed";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — la app sigue
    // funcionando con los defaults, solo no persiste entre sesiones
    return {};
  }
}

export function getPrefs() {
  const raw = read();
  return {
    soundEnabled: raw.soundEnabled !== false,
    animationsEnabled: raw.animationsEnabled !== false,
  };
}

// Espeja la preferencia de animación en un atributo real del <html> — mismo
// mecanismo que ya usa prefers-reduced-motion en theme.css (selectores
// [data-vox54-motion="off"] junto a los de la media query, no en vez de
// ellos: la señal de accesibilidad del sistema operativo nunca la pisa este
// interruptor de la app, se suman). Se aplica apenas se importa este módulo
// (no solo dentro de un componente React) para que una preferencia guardada
// en una sesión anterior ya rija desde el primer render de cualquier
// pantalla, sin depender de que justo se abra Configuración primero.
function applyMotionAttr(prefs) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-vox54-motion", prefs.animationsEnabled ? "on" : "off");
}

applyMotionAttr(getPrefs());

export function setPref(key, value) {
  const raw = read();
  raw[key] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(raw));
  } catch {
    // no persiste, pero el resto de esta pestaña igual respeta el cambio
  }
  applyMotionAttr(getPrefs());
  window.dispatchEvent(new Event(EVENT));
}

// Hook reactivo — cualquier pantalla que muestre los toggles (o cualquier
// componente que necesite saber el valor actual en vivo) se re-renderiza
// sola cuando cambian, sin tener que recargar la página.
export function usePrefs() {
  const [prefs, setPrefs] = useState(getPrefs);
  useEffect(() => {
    const onChange = () => setPrefs(getPrefs());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange); // sincroniza entre pestañas del mismo navegador
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return prefs;
}
