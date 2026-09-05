import { useEffect, useRef, useState } from "react";
import { burst } from "../burst";
import { API_BASE } from "../api";
import Icon from "./Icon";

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
export default function BusinessProfileForm({
  profile, onChange, onSave, saving, savedMessage, error,
  onUploadLogo, onRemoveLogo, onUploadDocument, onRemoveDocument,
}) {
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
  const [uploadError, setUploadError] = useState("");
  const [logoDragOver, setLogoDragOver] = useState(false);
  const logoBtnRef = useRef(null);
  const docBtnRef = useRef(null);

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
    try {
      const updated = await onUploadDocument(file);
      onChange({ info_document_url: updated.info_document_url, info_document_name: updated.info_document_name });
      burst(docBtnRef.current);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleRemoveDoc() {
    setUploadError("");
    try {
      const updated = await onRemoveDocument();
      onChange({ info_document_url: updated.info_document_url, info_document_name: updated.info_document_name });
    } catch (err) {
      setUploadError(err.message);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Logo + documento son subidas reales e independientes del guardado
          de texto de abajo — cada archivo se sube apenas se elige, no
          espera al botón "Guardar cambios" (son dos endpoints reales
          distintos del backend, no el mismo PUT de los 3 campos de texto). */}
      <div className="vox54-panel" style={{ padding: 20, display: "grid", gap: 18 }}>
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
                  <button type="button" onClick={handleRemoveLogo} style={removeLinkStyle}>Quitar logo</button>
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
                <div style={{ display: "flex", gap: 10 }}>
                  <label ref={docBtnRef} className="vox54-btn secondary small" style={{ cursor: "pointer" }}>
                    {uploadingDoc ? "Subiendo…" : "Reemplazar"}
                    <input type="file" accept="application/pdf" onChange={handleDocFile} style={{ display: "none" }} disabled={uploadingDoc} />
                  </label>
                  <button type="button" onClick={handleRemoveDoc} style={removeLinkStyle}>Quitar</button>
                </div>
              </div>
            ) : (
              <label ref={docBtnRef} className="vox54-btn secondary small" style={{ cursor: "pointer", justifySelf: "start" }}>
                {uploadingDoc ? "Subiendo…" : "Subir PDF"}
                <input type="file" accept="application/pdf" onChange={handleDocFile} style={{ display: "none" }} disabled={uploadingDoc} />
              </label>
            )}
            <p style={{ fontSize: 11.5, color: "var(--ink-softer)", margin: "8px 0 0" }}>
              Se guarda como referencia del negocio. Usar su contenido como fuente real para que el bot responda es una función que todavía se está construyendo.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSave} style={{ display: "grid", gap: 20 }}>
        {error && <div style={bannerStyle("danger")}>{error}</div>}
        {savedMessage && <div style={bannerStyle("success")}>{savedMessage}</div>}

        <div className="vox54-panel" style={{ padding: 20, display: "grid", gap: 16 }}>
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

          <Field label="Productos y servicios">
            <textarea
              value={profile.products_services}
              onChange={(e) => onChange({ products_services: e.target.value })}
              rows={5}
              placeholder="Ej: Cajones cerrados a medida, jaulas abiertas, cunas para maquinaria, embalaje certificado para exportación."
              style={textareaStyle}
            />
          </Field>

          <p style={{ fontSize: 12, color: "var(--ink-softer)", margin: 0 }}>
            Esto es lo que tu agente de voz usa como contexto real para responder — cuanto más completo, mejor puede ayudar sin inventar nada.
          </p>
        </div>

        <button ref={saveBtnRef} type="submit" disabled={saving} className="vox54-btn" style={{ justifySelf: "start" }}>
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
  objectFit: "contain",
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
