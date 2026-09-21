import { useEffect, useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import StatusPill from "../components/StatusPill";
import CallsList from "../components/CallsList";
import BusinessProfileForm from "../components/BusinessProfileForm";
import BrandMark from "../components/BrandMark";
import { api } from "../api";

// Ficha completa de un negocio — todo lo que hay que saber de él en una
// sola pantalla: identidad, su perfil real (resumen/horario/productos,
// editable acá mismo, sin un clic más — antes vivía detrás de una tarjeta
// "Perfil del negocio" separada, un paso de más que no hacía falta), un
// resumen rápido de su bot con un link a la configuración completa (esa sí
// se queda en su propia pantalla — BotConfigForm es un formulario grande de
// infraestructura, con motivo real para tener su propio espacio), y sus
// llamadas recientes.
export default function AgencyBusinessDetail() {
  const { session } = useOutletContext();
  const { id } = useParams();
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
  const [catalog, setCatalog] = useState(null);
  const [usage, setUsage] = useState(null);
  const [usageError, setUsageError] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  // Cambiar el plan tiene impacto real en el precio mensual del negocio -- el
  // <select> ya no dispara el cambio solo, arma un plan "pendiente" hasta que
  // se confirma explícitamente cuánto va a costar; si se cancela, el <select>
  // vuelve solo al plan real porque su value sigue atado a business.plan_id.
  const [pendingPlanId, setPendingPlanId] = useState(null);

  useEffect(() => {
    if (!session) return;
    api.getBusinessDetail(session.access_token, id)
      .then(setBusiness)
      .catch((e) => setError(e.message));
    api.listBusinessCalls(session.access_token, id).then(setCalls).catch((e) => setCallsError(e.message));
    api.getBusinessProfile(session.access_token, id).then(setProfile).catch((e) => setProfileError(e.message));
    // Solo para resolver el nombre real del modelo de IA en el resumen de
    // abajo — sin esto se ve el id crudo del catálogo (ej. "llama-3.3-70b-
    // versatile") en vez de "Llama 3.3 70B Versatile", mismo criterio que ya
    // se aplicó en BotConfigForm y en el Inventario de Agentes.
    api.getCatalog().then(setCatalog).catch(() => {});
    api.getBusinessUsage(session.access_token, id).then(setUsage).catch((e) => setUsageError(e.message));
  }, [session, id]);

  function handlePlanSelect(e) {
    setPendingPlanId(e.target.value);
  }

  function cancelPlanChange() {
    setPendingPlanId(null);
  }

  async function confirmPlanChange() {
    if (!pendingPlanId) return;
    setPlanSaving(true);
    setUsageError("");
    try {
      const updated = await api.updateBusinessPlan(session.access_token, id, pendingPlanId);
      setBusiness((prev) => ({ ...prev, plan_id: updated.plan_id }));
      const freshUsage = await api.getBusinessUsage(session.access_token, id);
      setUsage(freshUsage);
      setPendingPlanId(null);
    } catch (err) {
      setUsageError(err.message);
    } finally {
      setPlanSaving(false);
    }
  }

  function planLabel(planId) {
    const p = catalog?.plans?.find((pl) => pl.id === planId);
    return p ? `${p.name} — $${p.price_usd}/mes` : planId;
  }

  function aiModelLabel(providerId, modelId) {
    if (!modelId) return "—";
    const provider = catalog?.ai_providers?.find((p) => p.id === providerId);
    return provider?.models?.find((m) => m.id === modelId)?.name || modelId;
  }

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
        address: profile.address,
        phone: profile.phone,
        timezone: profile.timezone,
        city: profile.city,
        website: profile.website,
        contact_email: profile.contact_email,
        value_proposition: profile.value_proposition,
        industry: profile.industry,
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
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <Link to="/agencia/negocios" style={backLink}>← Volver a negocios</Link>

        {error && <div style={{ color: "var(--danger)", margin: "16px 0" }}>{error}</div>}

        {business && (
          <div className="vox54-panel" style={{ padding: 24, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <BrandMark logoUrl={profile?.logo_url} name={business.name} size={44} />
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
                onUploadDocument={(file, onProgress) => api.uploadBusinessDocument(session.access_token, id, file, true, onProgress)}
                onRemoveDocument={() => api.removeBusinessDocument(session.access_token, id, true)}
                onAcceptSuggestion={(s) => api.acceptDocumentSuggestion(session.access_token, id, s, true)}
                onDismissSuggestion={(s) => api.dismissDocumentSuggestion(session.access_token, id, s, true)}
              />
            ) : (
              !profileError && <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando…</div>
            )}
          </div>
        )}

        {business && (
          <div style={{ marginTop: 20 }}>
            <div style={sectionTitleStyle}>Plan comercial</div>
            <div className="vox54-panel" style={{ padding: 20, display: "grid", gap: 12 }}>
              <Row label="Plan">
                <select
                  value={pendingPlanId ?? business.plan_id}
                  onChange={handlePlanSelect}
                  disabled={planSaving || !catalog}
                  style={planSelectStyle}
                >
                  {(catalog?.plans || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — ${p.price_usd}/mes</option>
                  ))}
                </select>
              </Row>
              {pendingPlanId && pendingPlanId !== business.plan_id && (
                <div style={planConfirmBoxStyle}>
                  <span style={{ fontSize: 12.5, color: "var(--ink)" }}>
                    Vas a cambiar el plan de <strong>{planLabel(business.plan_id)}</strong> a{" "}
                    <strong>{planLabel(pendingPlanId)}</strong>.
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={confirmPlanChange} disabled={planSaving} className="vox54-btn small">
                      {planSaving ? "Cambiando…" : "Confirmar cambio de plan"}
                    </button>
                    <button type="button" onClick={cancelPlanChange} disabled={planSaving} className="vox54-btn secondary small">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {usage && (
                <>
                  <Row label="Minutos usados este mes">
                    {usage.minutes_used} / {usage.minutes_included} min
                  </Row>
                  {usage.overage_minutes > 0 && (
                    <Row label="Excedente">{usage.overage_minutes} min extra</Row>
                  )}
                  <Row label="Estimado del mes">${usage.estimated_bill_usd}</Row>
                </>
              )}
              {usageError && <div style={{ fontSize: 12.5, color: "var(--danger)" }}>{usageError}</div>}
              <div style={{ fontSize: 11.5, color: "var(--ink-softer)" }}>
                Hipotético — todavía no hay ningún cobro real conectado, solo el uso real medido.
              </div>
            </div>
          </div>
        )}

        {business && (
          <div style={twoColStyle}>
            <div>
              <div style={sectionTitleStyle}>Bot de voz</div>
              <div className="vox54-panel" style={{ padding: 20, display: "grid", gap: 12 }}>
                <Row label="Estado"><StatusPill status={config?.status} /></Row>
                <Row label="Número">{config?.phone_number || "Sin asignar todavía"}</Row>
                <Row label="Modelo de IA">{aiModelLabel(config?.ai_provider, config?.ai_model)}</Row>
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

const planConfirmBoxStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "12px 14px",
  borderRadius: 10,
  background: "#fffbeb",
  border: "1px solid #fde68a",
};

const planSelectStyle = {
  fontSize: 13,
  fontWeight: 600,
  padding: "5px 8px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--ink)",
  fontFamily: "var(--font)",
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
