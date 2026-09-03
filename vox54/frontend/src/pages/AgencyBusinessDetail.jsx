import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import StatusPill from "../components/StatusPill";
import CallsList from "../components/CallsList";
import BusinessProfileForm from "../components/BusinessProfileForm";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { initials } from "../utils";

// Ficha completa de un negocio — todo lo que hay que saber de él en una
// sola pantalla: identidad, su perfil real (resumen/horario/productos,
// editable acá mismo, sin un clic más — antes vivía detrás de una tarjeta
// "Perfil del negocio" separada, un paso de más que no hacía falta), un
// resumen rápido de su bot con un link a la configuración completa (esa sí
// se queda en su propia pantalla — BotConfigForm es un formulario grande de
// infraestructura, con motivo real para tener su propio espacio), y sus
// llamadas recientes.
export default function AgencyBusinessDetail() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [calls, setCalls] = useState(null);
  const [callsError, setCallsError] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedMessage, setProfileSavedMessage] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getBusinessDetail(session.access_token, id)
      .then(setBusiness)
      .catch((e) => setError(e.message));
    api.listBusinessCalls(session.access_token, id).then(setCalls).catch((e) => setCallsError(e.message));
    api.getBusinessProfile(session.access_token, id).then(setProfile).catch((e) => setProfileError(e.message));
  }, [session, id]);

  function startRenaming() {
    setNameDraft(business?.name || "");
    setRenameError("");
    setRenaming(true);
  }

  function cancelRenaming() {
    setRenaming(false);
    setRenameError("");
  }

  async function handleRename(e) {
    e.preventDefault();
    setRenameError("");
    setRenameSaving(true);
    try {
      const updated = await api.renameBusiness(session.access_token, id, nameDraft);
      setBusiness((prev) => ({ ...prev, name: updated.name }));
      setRenaming(false);
    } catch (err) {
      setRenameError(err.message);
    } finally {
      setRenameSaving(false);
    }
  }

  function handleProfileChange(patch) {
    setProfile((prev) => ({ ...prev, ...patch }));
    setProfileSavedMessage("");
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileError("");
    setProfileSavedMessage("");
    setProfileSaving(true);
    try {
      const updated = await api.updateBusinessProfile(session.access_token, id, {
        description: profile.description,
        hours: profile.hours,
        products_services: profile.products_services,
      });
      setProfile(updated);
      setProfileSavedMessage("Guardado correctamente.");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  }

  if (!session) return null;

  const config = business?.bot_config;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <Link to="/agencia/negocios" style={backLink}>← Volver a negocios</Link>

        {error && <div style={{ color: "var(--danger)", margin: "16px 0" }}>{error}</div>}

        {business && (
          <div className="vox54-panel" style={{ padding: 24, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="vox54-avatar" style={avatarStyle}>{initials(business.name)}</div>
                <div>
                  {renaming ? (
                    <form onSubmit={handleRename} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        aria-label="Nombre del negocio"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Escape") cancelRenaming(); }}
                        style={renameInputStyle}
                      />
                      <button type="submit" disabled={renameSaving} className="vox54-btn small">
                        {renameSaving ? "Guardando…" : "Guardar"}
                      </button>
                      <button type="button" onClick={cancelRenaming} className="vox54-btn secondary small">
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <h1 style={{ fontSize: 20, color: "var(--ink)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      {business.name}
                      <button
                        type="button"
                        onClick={startRenaming}
                        aria-label="Renombrar negocio"
                        title="Renombrar negocio"
                        style={renameIconBtn}
                      >
                        ✎
                      </button>
                    </h1>
                  )}
                  <div style={{ fontSize: 12, color: "var(--ink-softer)", marginTop: 2 }}>ID {business.id}</div>
                </div>
              </div>
              <StatusPill status={config?.status} />
            </div>
            {renameError && <div style={{ fontSize: 12.5, color: "var(--danger)", marginTop: 10 }}>{renameError}</div>}
          </div>
        )}

        {!business && !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: 16 }}>Cargando…</div>}

        {business && (
          <div style={{ marginTop: 20 }}>
            <div style={sectionTitleStyle}>Perfil del negocio</div>
            {profile ? (
              <BusinessProfileForm
                profile={profile}
                onChange={handleProfileChange}
                onSave={handleProfileSave}
                saving={profileSaving}
                savedMessage={profileSavedMessage}
                error={profileError}
                onUploadLogo={(file) => api.uploadBusinessLogo(session.access_token, id, file, true)}
                onRemoveLogo={() => api.removeBusinessLogo(session.access_token, id, true)}
                onUploadDocument={(file) => api.uploadBusinessDocument(session.access_token, id, file, true)}
                onRemoveDocument={() => api.removeBusinessDocument(session.access_token, id, true)}
              />
            ) : (
              !profileError && <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando…</div>
            )}
          </div>
        )}

        {business && (
          <div style={twoColStyle}>
            <div>
              <div style={sectionTitleStyle}>Bot de voz</div>
              <div className="vox54-panel" style={{ padding: 20, display: "grid", gap: 12 }}>
                <Row label="Estado"><StatusPill status={config?.status} /></Row>
                <Row label="Número">{config?.phone_number || "Sin asignar todavía"}</Row>
                <Row label="Modelo de IA">{config?.ai_model || "—"}</Row>
                <Link to={`/agencia/negocios/${id}/bot`} style={fullConfigLinkStyle}>
                  Configuración completa →
                </Link>
              </div>
            </div>

            <div>
              <div style={sectionTitleStyle}>Llamadas recientes</div>
              <CallsList calls={calls} loading={calls === null && !callsError} error={callsError} />
            </div>
          </div>
        )}
      </div>
    </AgencyShell>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{children}</span>
    </div>
  );
}

const backLink = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  textDecoration: "none",
};

const avatarStyle = {
  width: 44,
  height: 44,
  flexShrink: 0,
  borderRadius: 10,
  fontSize: 15,
};

const sectionTitleStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-soft)",
  marginBottom: 10,
};

const twoColStyle = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "minmax(280px, 1fr) minmax(340px, 1.4fr)",
  gap: 24,
  alignItems: "start",
};

const fullConfigLinkStyle = {
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--g54-blue)",
  textDecoration: "none",
  marginTop: 4,
};

const renameIconBtn = {
  background: "none",
  border: "none",
  color: "var(--ink-soft)",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
  padding: 4,
  borderRadius: 6,
};

const renameInputStyle = {
  fontSize: 16,
  padding: "7px 9px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
  flex: 1,
  maxWidth: 260,
};
