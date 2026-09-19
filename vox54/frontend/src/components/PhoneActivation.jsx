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
//
// `onVerifyStart(phone)`/`onVerifyCheck(phone, code)` -- agregados tras un
// incidente real (2026-09-19): "usar mi número actual" compraba un número
// nuevo de una, sin pedir ni comprobar cuál era el número real del negocio.
// Ahora ese camino primero manda un código real por SMS (Twilio Verify) y
// solo activa el desvío después de un código correcto real.
// `onRelease` -- opcional, solo lo pasa AgencyBotConfig.jsx (liberar el
// número de un negocio es exclusivo de agencia, ver release_business_phone
// en el backend). Pedido real de la usuaria (2026-09-19): un número que
// compramos sigue siendo nuestro cuando un cliente se va -- esto lo
// desconecta sin devolverlo a Twilio, para que el próximo negocio que
// active "número nuevo" lo reciba gratis en vez de comprar otro.
export default function PhoneActivation({
  phoneNumber, phoneMode, onActivate,
  ownPhoneNumber = "", ownPhoneVerified = false,
  onVerifyStart, onVerifyCheck, onRelease,
}) {
  const [activating, setActivating] = useState(null); // null | "new" | "forward"
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // "choose" (2 botones) -> "verify-input" (pedir el número real) ->
  // "verify-code" (pedir el código que llegó por SMS) -> activa solo.
  const [forwardStep, setForwardStep] = useState(ownPhoneVerified ? "verify-code-done" : "choose");
  const [phoneInput, setPhoneInput] = useState(ownPhoneNumber);
  const [codeInput, setCodeInput] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  // Incidente real del 2026-09-19 (parte 2): ni "número nuevo" ni el botón
  // final de "forward" explicaban que eso es una compra real -- un clic
  // bastaba para gastar plata real sin decir nada. Los dos ahora paran acá
  // primero: explican el costo real y piden un segundo clic a propósito.
  const [confirmingNew, setConfirmingNew] = useState(false);
  const [confirmingRelease, setConfirmingRelease] = useState(false);
  const [releasing, setReleasing] = useState(false);

  async function handleRelease() {
    setError("");
    setReleasing(true);
    try {
      await onRelease();
      setConfirmingRelease(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setReleasing(false);
    }
  }

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

  async function handleSendCode() {
    setError("");
    setVerifyBusy(true);
    try {
      await onVerifyStart(phoneInput.trim());
      setForwardStep("verify-code");
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleCheckCode() {
    setError("");
    setVerifyBusy(true);
    try {
      const result = await onVerifyCheck(phoneInput.trim(), codeInput.trim());
      if (!result.verified) {
        setError("Ese código no es correcto (o ya venció) -- pedí uno nuevo.");
        return;
      }
      setForwardStep("verify-code-done");
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleActivateForward() {
    setError("");
    setActivating("forward");
    try {
      await onActivate("forward");
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
        {onRelease && !confirmingRelease && (
          <button type="button" onClick={() => setConfirmingRelease(true)} style={releaseLinkStyle}>
            Liberar este número (para reasignarlo a otro negocio)
          </button>
        )}
        {onRelease && confirmingRelease && (
          <div style={costNoticeStyle}>
            El bot de este negocio deja de atender llamadas de inmediato. El número no se pierde -- sigue pagado y disponible para dárselo al próximo negocio que active "número nuevo".
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="button" disabled={releasing} onClick={handleRelease} className="vox54-btn small">
                {releasing ? "Liberando…" : "Sí, liberar el número"}
              </button>
              <button type="button" className="vox54-btn secondary small" onClick={() => setConfirmingRelease(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (forwardStep === "verify-input") {
    // <div>, no <form> -- PhoneActivation ya vive adentro del <form> real de
    // BotConfigForm (el de "Guardar cambios"); un <form> anidado es HTML
    // inválido y React lo marca como error de hidratación.
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {error && <div style={errorBannerStyle}>{error}</div>}
        <p style={helpTextStyle}>
          Necesitamos confirmar que ese número es tuyo de verdad -- te mandamos un código por SMS.
        </p>
        <input
          type="tel"
          placeholder="+1 305 555 0100"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && phoneInput.trim()) handleSendCode(); }}
          style={phoneInputStyle}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" disabled={verifyBusy || !phoneInput.trim()} onClick={handleSendCode} className="vox54-btn small">
            {verifyBusy ? "Enviando…" : "Enviar código"}
          </button>
          <button type="button" className="vox54-btn secondary small" onClick={() => { setError(""); setForwardStep("choose"); }}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (forwardStep === "verify-code") {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {error && <div style={errorBannerStyle}>{error}</div>}
        <p style={helpTextStyle}>Te mandamos un código de 6 dígitos a {phoneInput} -- escribilo acá.</p>
        <input
          type="text"
          inputMode="numeric"
          placeholder="123456"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && codeInput.trim()) handleCheckCode(); }}
          style={phoneInputStyle}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" disabled={verifyBusy || !codeInput.trim()} onClick={handleCheckCode} className="vox54-btn small">
            {verifyBusy ? "Confirmando…" : "Confirmar código"}
          </button>
          <button type="button" className="vox54-btn secondary small" onClick={() => { setError(""); setForwardStep("verify-input"); }}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (forwardStep === "verify-code-done") {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {error && <div style={errorBannerStyle}>{error}</div>}
        <p style={helpTextStyle}>
          Confirmado -- {phoneInput || ownPhoneNumber} es realmente tuyo.
        </p>
        <div style={costNoticeStyle}>
          Este paso compra un número real (el puente al que vas a desviar tu número de siempre) -- tiene un costo real (~$1.15/mes + uso), y no se puede deshacer.
        </div>
        <button type="button" onClick={handleActivateForward} className="vox54-btn small" style={{ alignSelf: "start" }}>
          Sí, activar el desvío
        </button>
      </div>
    );
  }

  if (confirmingNew) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {error && <div style={errorBannerStyle}>{error}</div>}
        <div style={costNoticeStyle}>
          Esto compra un número de teléfono real ahora mismo -- tiene un costo real (~$1.15/mes + uso), y no se puede deshacer.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => handleChoose("new")} className="vox54-btn small">
            Sí, comprar número nuevo
          </button>
          <button type="button" className="vox54-btn secondary small" onClick={() => { setError(""); setConfirmingNew(false); }}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {error && <div style={errorBannerStyle}>{error}</div>}
      <button type="button" onClick={() => setConfirmingNew(true)} style={optionBtnStyle}>
        <span style={optionIconStyle}><Icon name="phone" size={17} /></span>
        <span style={{ textAlign: "left", flexGrow: 1, minWidth: 0 }}>
          <span style={optionTitleStyle}>Quiero un número nuevo</span>
          <span style={optionDescStyle}>Te asignamos un número real al instante (tiene un costo real).</span>
        </span>
      </button>
      <button type="button" onClick={() => { setError(""); setForwardStep("verify-input"); }} style={optionBtnStyle}>
        <span style={optionIconStyle}><Icon name="forward" size={17} /></span>
        <span style={{ textAlign: "left", flexGrow: 1, minWidth: 0 }}>
          <span style={optionTitleStyle}>Quiero usar mi número actual</span>
          <span style={optionDescStyle}>Confirmamos que es tuyo con un código por SMS, después lo desviás gratis.</span>
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

const phoneInputStyle = {
  fontSize: 14,
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontFamily: "inherit",
  maxWidth: 240,
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

const costNoticeStyle = {
  fontSize: 12,
  padding: "10px 12px",
  borderRadius: 8,
  background: "#fffbeb",
  border: "1px solid #fde68a",
  color: "#92400e",
  lineHeight: 1.4,
};

const releaseLinkStyle = {
  background: "none",
  border: "none",
  padding: 0,
  fontSize: 11.5,
  color: "var(--ink-softer)",
  textDecoration: "underline",
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left",
  justifySelf: "start",
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
