import { useEffect, useRef, useState } from "react";
import { burst } from "../burst";
import { API_BASE } from "../api";
import Icon from "./Icon";
import { profileCompleteness } from "../profileCompleteness";

// El conocimiento real de un negocio — a qué se dedica, cuándo atiende, qué
// vende — separado a propósito de BotConfigForm (infraestructura del bot:
// telefonía/STT/TTS/modelo/prompt). Reusado tanto por la agencia (edita el
// perfil de cualquier negocio suyo) como por el propio negocio (edita el
// suyo) — a diferencia de BotConfigForm, acá no hace falta ningún `scope`
// para los 3 campos de texto: ninguno es infraestructura sensible, así que
// ambos lados ven y editan exactamente lo mismo.
//
// El logo y el documento PDF pegan a rutas de backend distintas según quién
// edita (la agencia sobre cualquier negocio suyo, el negocio sobre el
// propio) — pero, igual que onSave/onChange, este componente nunca llama a
// `api` directo: recibe las 4 mutaciones ya armadas como props
// (onUploadLogo/onRemoveLogo/onUploadDocument/onRemoveDocument, cada una
// una función que hace la llamada real y devuelve una Promise con el
// perfil actualizado) — mismo patrón ya usado en todo el proyecto, y lo que
// mantiene esto testeable sin tener que mockear el módulo de red.
// El texto guardado sigue siendo UN string plano (products_services, sin
// migración de schema) — una línea por producto, opcionalmente
// "Nombre — $Precio". Es el mismo separador que ya espera el worker real
// (_PRICE_SUFFIX en agent.py) para poder recortar los precios cuando el
// negocio no quiere que el bot los mencione (ver el toggle nuevo en
// BotConfigForm). Estas dos funciones son solo cómo el FORMULARIO edita
// ese mismo string de a un producto por vez, en vez de como un párrafo.
function parseProducts(text) {
  const lines = (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [{ name: "", price: "" }];
  return lines.map((line) => {
    const m = line.match(/^(.*?)\s+—\s*\$?\s*(.+)$/);
    return m ? { name: m[1].trim(), price: m[2].trim() } : { name: line, price: "" };
  });
}

function serializeProducts(items) {
  return items
    .filter((it) => it.name.trim())
    .map((it) => (it.price.trim() ? `${it.name.trim()} — $${it.price.trim()}` : it.name.trim()))
    .join("\n");
}

// El % real (docProgress) solo mide la fase de transferencia -- una vez que
// llega a 100, el archivo ya está en el servidor pero la promesa de
// onUploadDocument todavía no resolvió porque sigue extrayendo el texto
// real y calculando los embeddings (ver comentario largo en api.js). Sin
// esta segunda etiqueta, un documento con contenido real se queda con
// "Subiendo… 100%" fijo por varios segundos más, dando la misma sensación
// de "esto no funciona" que reportó la usuaria -- ahora se explica qué
// está pasando en esa segunda mitad de la espera, aunque no haya un % real
// que mostrar ahí.
function docStatusLabel(progress) {
  if (progress === null || progress === undefined) return "Subiendo…";
  if (progress < 100) return `Subiendo… ${progress}%`;
  return "Procesando documento…";
}

// Lista curada, no exhaustiva — cubre los husos reales donde ya hay negocios
// (Miami/Managua entre ellos) más el resto de capitales de habla hispana más
// comunes. String IANA real (no un offset numérico) para que el horario de
// verano se resuelva solo, sin que nadie tenga que actualizar nada dos veces
// al año.
const TIMEZONES = [
  { value: "", label: "Sin configurar" },
  { value: "America/New_York", label: "Este de EE.UU. (Miami, Nueva York)" },
  { value: "America/Chicago", label: "Centro de EE.UU." },
  { value: "America/Denver", label: "Montaña de EE.UU." },
  { value: "America/Los_Angeles", label: "Pacífico de EE.UU." },
  { value: "America/Mexico_City", label: "Ciudad de México" },
  { value: "America/Guatemala", label: "Guatemala" },
  { value: "America/Tegucigalpa", label: "Honduras" },
  { value: "America/Managua", label: "Nicaragua" },
  { value: "America/Costa_Rica", label: "Costa Rica" },
  { value: "America/Panama", label: "Panamá" },
  { value: "America/Bogota", label: "Colombia" },
  { value: "America/Lima", label: "Perú" },
  { value: "America/Santiago", label: "Chile" },
  { value: "America/Buenos_Aires", label: "Argentina" },
  { value: "Europe/Madrid", label: "España" },
];

export default function BusinessProfileForm({
  profile, onChange, onSave, saving, savedMessage, error,
  onUploadLogo, onRemoveLogo, onUploadDocument, onRemoveDocument,
  onAcceptSuggestion, onDismissSuggestion,
}) {
  // Estado local, no derivado de `profile` en cada render — si se
  // re-parseara el string en cada tecleo (incluyendo el eco que vuelve del
  // propio onChange del padre), una fila nueva todavía sin nombre
  // desaparecería antes de poder escribirle nada. Solo se re-sincroniza
  // cuando cambia la IDENTIDAD del negocio (este mismo formulario lo edita
  // tanto la agencia, sobre cualquier negocio suyo, como el propio
  // negocio) — nunca en cada tecla.
  const [productItems, setProductItems] = useState(() => parseProducts(profile.products_services));
  const loadedProfileId = useRef(profile.id);
  useEffect(() => {
    if (profile.id !== loadedProfileId.current) {
      loadedProfileId.current = profile.id;
      setProductItems(parseProducts(profile.products_services));
    }
  }, [profile.id, profile.products_services]);

  function updateProductItem(index, patch) {
    const next = productItems.map((it, i) => (i === index ? { ...it, ...patch } : it));
    setProductItems(next);
    onChange({ products_services: serializeProducts(next) });
  }

  function addProductItem() {
    // No hace falta propagar onChange acá — una fila vacía nueva serializa
    // a nada (se filtra), así que el texto real del padre no cambia hasta
    // que el usuario escriba algo de verdad.
    setProductItems((prev) => [...prev, { name: "", price: "" }]);
  }

  function removeProductItem(index) {
    const next = productItems.filter((_, i) => i !== index);
    const finalItems = next.length ? next : [{ name: "", price: "" }];
    setProductItems(finalItems);
    onChange({ products_services: serializeProducts(finalItems) });
  }

  // El botón estalla (sin desaparecer) cuando el guardado se confirmó de
  // verdad — savedMessage lo pone el padre solo tras una respuesta real del
  // servidor, nunca en el click en sí, para no festejar un guardado que
  // todavía puede fallar.
  const saveBtnRef = useRef(null);
  useEffect(() => {
    if (savedMessage) burst(saveBtnRef.current);
  }, [savedMessage]);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docProgress, setDocProgress] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoBtnRef = useRef(null);
  const docBtnRef = useRef(null);
  // Quitar el logo o el documento no tiene deshacer -- un segundo clic real
  // de confirmación, no window.confirm(), mismo criterio de este proyecto
  // (ver PhoneActivation.jsx) de nunca usar el diálogo nativo del navegador.
  const [confirmingLogoRemove, setConfirmingLogoRemove] = useState(false);
  const [confirmingDocRemove, setConfirmingDocRemove] = useState(false);

  // Núcleo compartido — tanto elegir el archivo desde el <input> como
  // soltarlo arriba de la dropzone terminan en la misma subida real, sin
  // duplicar el try/catch ni el burst() de confirmación.
  async function uploadLogoFile(file) {
    if (!file) return;
    setUploadError("");
    setUploadingLogo(true);
    try {
      const updated = await onUploadLogo(file);
      onChange({ logo_url: updated.logo_url });
      burst(logoBtnRef.current);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  function handleLogoFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // deja re-elegir el mismo archivo después si hace falta
    uploadLogoFile(file);
  }

  function handleLogoDrop(e) {
    e.preventDefault();
    setLogoDragOver(false);
    if (uploadingLogo) return;
    uploadLogoFile(e.dataTransfer.files?.[0]);
  }

  async function handleRemoveLogo() {
    setUploadError("");
    setConfirmingLogoRemove(false);
    try {
      const updated = await onRemoveLogo();
      onChange({ logo_url: updated.logo_url });
    } catch (err) {
      setUploadError(err.message);
    }
  }

  async function handleDocFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError("");
    setUploadingDoc(true);
    setDocProgress(0);
    try {
      // onProgress solo cubre la transferencia real del archivo (rápida,
      // hasta 15MB) -- el 100% se alcanza bastante antes de que la promesa
      // resuelva, porque el servidor sigue trabajando después de recibirlo
      // (extraer el texto real y calcular un embedding por fragmento,
      // confirmado en vivo que puede tardar 10-15s). Ese tramo real, sin
      // ningún % que medir desde acá, se comunica aparte más abajo
      // (docProgress===100 && uploadingDoc → "Procesando documento…").
      const updated = await onUploadDocument(file, setDocProgress);
      onChange({
        info_document_url: updated.info_document_url,
        info_document_name: updated.info_document_name,
        doc_summary: updated.doc_summary,
        doc_suggested_services: updated.doc_suggested_services,
      });
      burst(docBtnRef.current);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadingDoc(false);
      setDocProgress(null);
    }
  }

  async function handleRemoveDoc() {
    setUploadError("");
    setConfirmingDocRemove(false);
    try {
      const updated = await onRemoveDocument();
      onChange({
        info_document_url: updated.info_document_url,
        info_document_name: updated.info_document_name,
        doc_summary: updated.doc_summary,
        doc_suggested_services: updated.doc_suggested_services,
      });
    } catch (err) {
      setUploadError(err.message);
    }
  }

  // Distinto de uploadingLogo/uploadingDoc -- guarda CUÁL sugerencia puntual
  // está en curso (su propio texto, no un booleano), para deshabilitar solo
  // los botones de esa fila sin bloquear el resto de la lista mientras corre.
  const [suggestionBusy, setSuggestionBusy] = useState(null);

  async function handleAcceptSuggestion(suggestion) {
    if (!onAcceptSuggestion) return;
    setUploadError("");
    setSuggestionBusy(suggestion);
    try {
      const updated = await onAcceptSuggestion(suggestion);
      // products_services cambió del lado del servidor (accept_suggested_service
      // le agrega la línea ahí) -- hay que re-parsear el estado local de
      // productItems también, no solo propagar el string via onChange, o la
      // grilla de productos del formulario se queda desactualizada.
      setProductItems(parseProducts(updated.products_services));
      onChange({ products_services: updated.products_services, doc_suggested_services: updated.doc_suggested_services });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setSuggestionBusy(null);
    }
  }

  async function handleDismissSuggestion(suggestion) {
    if (!onDismissSuggestion) return;
    setUploadError("");
    setSuggestionBusy(suggestion);
    try {
      const updated = await onDismissSuggestion(suggestion);
      onChange({ doc_suggested_services: updated.doc_suggested_services });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setSuggestionBusy(null);
    }
  }

  const { percent: profilePercent, missing: profileMissing } = profileCompleteness(profile);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Nunca inventa un número -- se calcula de verdad contando cuántos de
          los 10 campos de texto reales están cargados (ver
          profileCompleteness.js, compartido con el checklist de "Primeros
          pasos" del negocio). Sin esto, un perfil a medio llenar se veía
          exactamente igual que uno completo -- no había ninguna señal de que
          el bot le falta contexto real para responder bien. */}
      <div className="bubble54-panel" style={{ padding: "16px 20px", display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "2px 12px" }}>
          <span style={labelStyle}>Perfil {profilePercent}% completo</span>
          {profileMissing.length > 0 && (
            <span style={{ fontSize: 11.5, color: "var(--ink-softer)" }}>
              Falta: {profileMissing.join(", ")}
            </span>
          )}
        </div>
        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${profilePercent}%` }} />
        </div>
        {!profile.timezone && (
          <div style={timezoneWarningStyle}>
            ⚠ Sin zona horaria configurada — afecta cómo se interpreta tu horario de atención y la hora real que ve tu negocio en cada llamada.
          </div>
        )}
      </div>

      {/* Logo + documento son subidas reales e independientes del guardado
          de texto de abajo — cada archivo se sube apenas se elige, no
          espera al botón "Guardar cambios" (son dos endpoints reales
          distintos del backend, no el mismo PUT de los 3 campos de texto). */}
      <div className="bubble54-panel" style={{ padding: 20, display: "grid", gap: 18 }}>
        {uploadError && <div style={bannerStyle("danger")}>{uploadError}</div>}

        <div style={twoColStyle}>
          <div>
            <span style={labelStyle}>Logo</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <label
                ref={logoBtnRef}
                style={{ ...logoDropzoneStyle, ...(logoDragOver ? logoDropzoneDragStyle : null), cursor: uploadingLogo ? "default" : "pointer" }}
                onDragOver={(e) => { e.preventDefault(); if (!uploadingLogo) setLogoDragOver(true); }}
                onDragLeave={() => setLogoDragOver(false)}
                onDrop={handleLogoDrop}
                title={profile.logo_url ? "Hacé clic o soltá una imagen para cambiarlo" : "Hacé clic o soltá una imagen acá"}
              >
                {profile.logo_url ? (
                  <img src={`${API_BASE}${profile.logo_url}`} alt="Logo" style={logoPreviewImgStyle} />
                ) : (
                  <>
                    <Icon name="image" size={22} style={{ color: "var(--ink-softer)" }} />
                    <span style={{ fontSize: 10, color: "var(--ink-softer)", fontWeight: 600 }}>Sin logo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoFile}
                  style={{ display: "none" }}
                  disabled={uploadingLogo}
                />
              </label>
              <div style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {uploadingLogo ? "Subiendo…" : profile.logo_url ? "Hacé clic en el logo para cambiarlo" : "Hacé clic o arrastrá una imagen acá"}
                </span>
                {profile.logo_url && (
                  confirmingLogoRemove ? (
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11.5, color: "var(--danger)" }}>¿Seguro?</span>
                      <button type="button" onClick={handleRemoveLogo} style={removeLinkStyle}>Sí, quitar</button>
                      <button type="button" onClick={() => setConfirmingLogoRemove(false)} style={cancelLinkStyle}>Cancelar</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmingLogoRemove(true)} style={removeLinkStyle}>Quitar logo</button>
                  )
                )}
              </div>
            </div>
          </div>

          <div>
            <span style={labelStyle}>Documento de información (PDF)</span>
            {profile.info_document_url ? (
              <div style={{ display: "grid", gap: 6 }}>
                <a href={`${API_BASE}${profile.info_document_url}`} target="_blank" rel="noreferrer" style={docLinkStyle}>
                  📄 {profile.info_document_name || "Documento subido"}
                </a>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <label ref={docBtnRef} className="bubble54-btn secondary small" style={{ cursor: "pointer" }}>
                    {uploadingDoc ? docStatusLabel(docProgress) : "Reemplazar"}
                    <input type="file" accept="application/pdf" onChange={handleDocFile} style={{ display: "none" }} disabled={uploadingDoc} />
                  </label>
                  {confirmingDocRemove ? (
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11.5, color: "var(--danger)" }}>¿Seguro?</span>
                      <button type="button" onClick={handleRemoveDoc} style={removeLinkStyle}>Sí, quitar</button>
                      <button type="button" onClick={() => setConfirmingDocRemove(false)} style={cancelLinkStyle}>Cancelar</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setConfirmingDocRemove(true)} style={removeLinkStyle}>Quitar</button>
                  )}
                </div>
              </div>
            ) : (
              <label ref={docBtnRef} className="bubble54-btn secondary small" style={{ cursor: "pointer", justifySelf: "start" }}>
                {uploadingDoc ? docStatusLabel(docProgress) : "Subir PDF"}
                <input type="file" accept="application/pdf" onChange={handleDocFile} style={{ display: "none" }} disabled={uploadingDoc} />
              </label>
            )}
            {uploadingDoc && (
              <div style={docProgressTrackStyle}>
                <div style={{ ...docProgressFillStyle, width: `${docProgress === 100 ? 100 : docProgress || 0}%` }} />
              </div>
            )}
            <p style={{ fontSize: 11.5, color: "var(--ink-softer)", margin: "8px 0 0" }}>
              Se guarda como referencia del negocio, y su contenido real ya se usa como fuente para que el bot responda — un documento con más texto tarda algunos segundos en procesarse después de subirlo.
            </p>
          </div>
        </div>

        {/* Confirmación real de que el bot leyó el documento -- no aparece
            hasta que el servidor termina de procesarlo (uploadingDoc en
            "Procesando…" todavía no llegó a esto). Ninguno de los dos
            bloques se muestra si no hay nada real que mostrar. */}
        {profile.doc_summary && (
          <div style={docInsightBoxStyle}>
            <span style={insightLabelStyle}>🧠 Esto entendió tu asistente del documento</span>
            <p style={{ fontSize: 13, color: "var(--ink)", margin: 0, lineHeight: 1.5 }}>{profile.doc_summary}</p>
          </div>
        )}

        {(profile.doc_suggested_services || []).length > 0 && (
          <div style={docInsightBoxStyle}>
            <span style={insightLabelStyle}>Servicios detectados en el documento, sin agregar todavía</span>
            <div style={{ display: "grid", gap: 8 }}>
              {profile.doc_suggested_services.map((s) => (
                <div key={s} style={suggestionRowStyle}>
                  <span style={{ fontSize: 13, color: "var(--ink)", flex: 1, minWidth: 0 }}>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleAcceptSuggestion(s)}
                    disabled={suggestionBusy === s}
                    className="bubble54-btn small"
                  >
                    {suggestionBusy === s ? "…" : "+ Agregar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismissSuggestion(s)}
                    disabled={suggestionBusy === s}
                    style={removeLinkStyle}
                  >
                    Descartar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSave} style={{ display: "grid", gap: 20 }}>
        {error && <div style={bannerStyle("danger")}>{error}</div>}
        {savedMessage && <div style={bannerStyle("success")}>{savedMessage}</div>}

        <div className="bubble54-panel" style={{ padding: 20, display: "grid", gap: 16 }}>
          <Field label="Resumen del negocio (a qué se dedica)">
            <textarea
              value={profile.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={4}
              placeholder="Ej: Empresa de embalajes de madera a medida en Miami, especializada en carga industrial y de exportación."
              style={textareaStyle}
            />
          </Field>

          <Field label="Horario de atención">
            <textarea
              value={profile.hours}
              onChange={(e) => onChange({ hours: e.target.value })}
              rows={2}
              placeholder="Ej: Lunes a viernes 8am–5pm, sábados 9am–1pm"
              style={textareaStyle}
            />
          </Field>

          <div style={twoColStyle}>
            <Field label="Dirección">
              <input
                value={profile.address || ""}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder="Ej: 123 NW 82nd Ave, Doral, FL"
                style={rowInputStyle}
              />
            </Field>
            <Field label="Teléfono">
              <input
                value={profile.phone || ""}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="Ej: +1 305 555 0100"
                style={rowInputStyle}
              />
            </Field>
          </div>

          <div style={twoColStyle}>
            <Field label="Ciudad">
              <input
                value={profile.city || ""}
                onChange={(e) => onChange({ city: e.target.value })}
                placeholder="Ej: Miami, FL"
                style={rowInputStyle}
              />
            </Field>
            <Field label="Zona horaria">
              <select
                value={profile.timezone || ""}
                onChange={(e) => onChange({ timezone: e.target.value })}
                style={rowInputStyle}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </Field>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--ink-softer)", margin: "-4px 0 4px" }}>
            Afecta el horario de arriba y la hora de tus llamadas.
          </p>

          <div style={twoColStyle}>
            <Field label="Sitio web">
              <input
                value={profile.website || ""}
                onChange={(e) => onChange({ website: e.target.value })}
                placeholder="Ej: https://tuempresa.com"
                style={rowInputStyle}
              />
            </Field>
            <Field label="Correo de contacto">
              <input
                type="email"
                value={profile.contact_email || ""}
                onChange={(e) => onChange({ contact_email: e.target.value })}
                placeholder="Ej: contacto@tuempresa.com"
                style={rowInputStyle}
              />
            </Field>
          </div>

          <Field label="Rubro">
            <input
              value={profile.industry || ""}
              onChange={(e) => onChange({ industry: e.target.value })}
              placeholder="Ej: Embalaje industrial, Hotelería, Ferretería"
              style={rowInputStyle}
            />
          </Field>

          <Field label="Propuesta de valor (qué te diferencia)">
            <textarea
              value={profile.value_proposition || ""}
              onChange={(e) => onChange({ value_proposition: e.target.value })}
              rows={2}
              placeholder="Ej: Único taller en Miami certificado ISPM-15 con entrega el mismo día."
              style={textareaStyle}
            />
          </Field>

          <div>
            <span style={labelStyle}>Productos y servicios</span>
            <div style={{ display: "grid", gap: 8 }}>
              {productItems.map((item, i) => (
                <div key={i} className="bubble54-product-row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={item.name}
                    onChange={(e) => updateProductItem(i, { name: e.target.value })}
                    placeholder="Ej: Cajones cerrados a medida"
                    className="bubble54-product-name"
                    style={rowInputStyle}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>$</span>
                    <input
                      value={item.price}
                      onChange={(e) => updateProductItem(i, { price: e.target.value })}
                      placeholder="Precio (opcional)"
                      style={{ ...rowInputStyle, width: 130 }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProductItem(i)}
                    style={removeItemBtnStyle}
                    aria-label="Quitar este producto o servicio"
                    title="Quitar"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addProductItem} className="bubble54-btn secondary small" style={{ marginTop: 10 }}>
              + Agregar producto o servicio
            </button>
          </div>

          <p style={{ fontSize: 12, color: "var(--ink-softer)", margin: 0 }}>
            Esto es lo que tu agente de voz usa como contexto real para responder — cuanto más completo, mejor puede ayudar sin inventar nada.
          </p>
        </div>

        <button ref={saveBtnRef} type="submit" disabled={saving} className="bubble54-btn" style={{ justifySelf: "start" }}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function bannerStyle(kind) {
  const isDanger = kind === "danger";
  return {
    fontSize: 13,
    padding: "10px 14px",
    borderRadius: 8,
    background: isDanger ? "#fef2f2" : "#f0fdf4",
    color: isDanger ? "var(--danger)" : "var(--success)",
  };
}

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

const rowInputStyle = {
  padding: "9px 11px",
  fontSize: 13.5,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
  background: "var(--white)",
};

const removeItemBtnStyle = {
  flexShrink: 0,
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--ink-softer)",
  fontSize: 16,
  lineHeight: 1,
  cursor: "pointer",
};

const textareaStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
  background: "var(--white)",
  resize: "vertical",
};

const twoColStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 20,
};

const logoPreviewImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  objectPosition: "center",
  borderRadius: 8,
};

// Dropzone real — clic o arrastre disparan la misma subida. Punteada y
// chica cuando no hay logo (invita a completarla); apenas hay uno, el
// borde pasa a sólido, es la miniatura real, no un placeholder.
const logoDropzoneStyle = {
  width: 72,
  height: 72,
  flexShrink: 0,
  borderRadius: 12,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  background: "var(--surface)",
  border: "1.5px dashed var(--border)",
  transition: "border-color 0.15s ease, background-color 0.15s ease",
};

const logoDropzoneDragStyle = {
  borderColor: "var(--g54-blue)",
  borderStyle: "solid",
  background: "rgba(45,91,255,0.06)",
};

// Barra real de progreso de subida -- solo mientras uploadingDoc está
// activo. Al llegar a 100%, se queda llena (no desaparece) mientras dura la
// fase de procesamiento del servidor -- confirma visualmente que la
// transferencia sí terminó, en vez de dar la sensación de que se detuvo a
// mitad de camino.
const docProgressTrackStyle = {
  marginTop: 10,
  height: 5,
  borderRadius: 999,
  background: "var(--surface)",
  overflow: "hidden",
};

const docProgressFillStyle = {
  height: "100%",
  borderRadius: 999,
  background: "var(--g54-blue)",
  transition: "width 0.2s ease",
};

const progressTrackStyle = {
  height: 6,
  borderRadius: 999,
  background: "var(--surface)",
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  borderRadius: 999,
  background: "var(--g54-blue)",
  transition: "width 0.2s ease",
};

const timezoneWarningStyle = {
  fontSize: 12,
  color: "#92400E",
  background: "#FFFBEB",
  border: "1px solid #FDE68A",
  borderRadius: 8,
  padding: "8px 10px",
  lineHeight: 1.5,
};

const docInsightBoxStyle = {
  padding: "14px 16px",
  borderRadius: 10,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  display: "grid",
  gap: 10,
};

const insightLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--ink-soft)",
};

const suggestionRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 8,
  background: "var(--white)",
  border: "1px solid var(--border)",
};

const docLinkStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--g54-blue)",
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
};

const removeLinkStyle = {
  background: "none",
  border: "none",
  color: "var(--danger)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  justifySelf: "start",
};

const cancelLinkStyle = {
  background: "none",
  border: "none",
  color: "var(--ink-soft)",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
};
