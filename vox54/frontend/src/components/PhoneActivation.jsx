import { useState } from "react";
import Icon from "./Icon";

// Conectar el número real del bot -- reemplaza el campo de texto que la
// agencia llenaba a mano (y el "hablalo con tu agencia" de solo lectura del
// negocio) por una acción real: elegís cómo querés recibir llamadas y la
// plataforma se encarga sola, sin que nadie tenga que entrar a Twilio ni a
// ningún otro lado. Mismo componente para agencia y negocio -- los dos son
// clientes reales (ver comentario de scope en BotConfigForm.jsx), y esto es
// justo el tipo de personalización que le corresponde a cualquiera de los
// dos, no a nosotros.
//
// `onActivate(mode)` hace la llamada real (agencia y negocio pegan a
// endpoints distintos, ver api.js) y devuelve una Promise con el
// BotConfigOut/BotConfigOutClient actualizado -- el padre decide qué hacer
// con la respuesta (BotConfigForm ya no toca phone_number directo).
export default function PhoneActivation({ phoneNumber, phoneMode, onActivate }) {
  const [activating, setActivating] = useState(null); // null | "new" | "forward"
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleChoose(mode) {
    setError("");
    setActivating(mode);
    try {
      await onActivate(mode);
    } catch (err) {
      setError(err.message);
    } finally {
      setActivating(null);
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(phoneNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (activating) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
        <div style={spinnerStyle} />
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Activando tu número…</span>
      </div>
    );
  }

  if (phoneNumber) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={numberBoxStyle}>{phoneNumber}</div>
          <button type="button" onClick={handleCopy} style={copyBtnStyle}>
            <Icon name="copy" size={13} />
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        {phoneMode === "forward" ? (
          <p style={helpTextStyle}>
            Desviá tu número de siempre hacia este desde tu celular (función de "desvío de llamadas" de tu operador) — tu número público no cambia.
          </p>
        ) : (
          <p style={helpTextStyle}>Ya está conectado — este es el número que atiende tu agente de voz.</p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {error && <div style={errorBannerStyle}>{error}</div>}
      <button type="button" onClick={() => handleChoose("new")} style={optionBtnStyle}>
        <span style={optionIconStyle}><Icon name="phone" size={17} /></span>
        <span style={{ textAlign: "left", flexGrow: 1, minWidth: 0 }}>
          <span style={optionTitleStyle}>Quiero un número nuevo</span>
          <span style={optionDescStyle}>Te asignamos un número real al instante.</span>
        </span>
      </button>
      <button type="button" onClick={() => handleChoose("forward")} style={optionBtnStyle}>
        <span style={optionIconStyle}><Icon name="forward" size={17} /></span>
        <span style={{ textAlign: "left", flexGrow: 1, minWidth: 0 }}>
          <span style={optionTitleStyle}>Quiero usar mi número actual</span>
          <span style={optionDescStyle}>Seguís publicando el de siempre, con un desvío gratis.</span>
        </span>
      </button>
    </div>
  );
}

const optionBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid var(--border)",
  borderRadius: 10,
  background: "var(--white)",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
};

const optionIconStyle = {
  flexShrink: 0,
  width: 34,
  height: 34,
  borderRadius: 8,
  background: "var(--surface)",
  color: "var(--g54-blue)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const optionTitleStyle = {
  display: "block",
  fontSize: 13.5,
  fontWeight: 700,
  color: "var(--ink)",
};

const optionDescStyle = {
  display: "block",
  fontSize: 11.5,
  color: "var(--ink-softer)",
  marginTop: 1,
};

const numberBoxStyle = {
  fontSize: 16,
  fontWeight: 700,
  color: "var(--g54-blue)",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "8px 14px",
};

const copyBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid var(--border)",
  background: "var(--white)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--g54-blue)",
  cursor: "pointer",
  fontFamily: "inherit",
};

const helpTextStyle = {
  fontSize: 11.5,
  color: "var(--ink-softer)",
  margin: 0,
  lineHeight: 1.4,
};

const errorBannerStyle = {
  fontSize: 12,
  padding: "8px 12px",
  borderRadius: 8,
  background: "#fef2f2",
  color: "var(--danger)",
};

const spinnerStyle = {
  width: 16,
  height: 16,
  borderRadius: "50%",
  border: "2px solid var(--border)",
  borderTopColor: "var(--g54-blue)",
  animation: "vox54-phone-spin 0.8s linear infinite",
};

// Único lugar que necesita esta animación -- inyectada una vez con un
// <style> real en vez de agregar una keyframe global a theme.css para un
// solo componente chico.
if (typeof document !== "undefined" && !document.getElementById("vox54-phone-spin-kf")) {
  const styleTag = document.createElement("style");
  styleTag.id = "vox54-phone-spin-kf";
  styleTag.textContent = "@keyframes vox54-phone-spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(styleTag);
}
