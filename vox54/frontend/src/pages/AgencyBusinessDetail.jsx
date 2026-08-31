import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import BotConfigForm from "../components/BotConfigForm";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";

export default function AgencyBusinessDetail() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [business, setBusiness] = useState(null);
  const [config, setConfig] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getBusinessDetail(session.access_token, id)
      .then((detail) => {
        setBusiness(detail);
        setConfig(detail.bot_config);
      })
      .catch((e) => setError(e.message));
    api.getCatalog().then(setCatalog).catch((e) => setError(e.message));
  }, [session, id]);

  function handleChange(patch) {
    setConfig((prev) => ({ ...prev, ...patch }));
    setSavedMessage("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSavedMessage("");
    setSaving(true);
    try {
      const updated = await api.updateBusinessBotConfig(session.access_token, id, config);
      setConfig(updated);
      setSavedMessage("Guardado correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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

  if (!session) return null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 32px" }}>
        <Link to="/agencia" style={backLink}>← Volver a negocios</Link>

        {renaming ? (
          <form onSubmit={handleRename} style={{ margin: "8px 0 4px", display: "flex", gap: 8, alignItems: "center" }}>
            <input
              aria-label="Nombre del negocio"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === "Escape") cancelRenaming(); }}
              style={renameInputStyle}
            />
            <button type="submit" disabled={renameSaving} style={renameSaveBtn}>
              {renameSaving ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={cancelRenaming} style={renameCancelBtn}>
              Cancelar
            </button>
          </form>
        ) : (
          <h1 style={{ fontSize: 22, color: "var(--ink)", margin: "8px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            {business?.name || "…"}
            {business && (
              <button
                type="button"
                onClick={startRenaming}
                aria-label="Renombrar negocio"
                title="Renombrar negocio"
                style={renameIconBtn}
              >
                ✎
              </button>
            )}
          </h1>
        )}
        {renameError && <div style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 8 }}>{renameError}</div>}

        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Configuración del agente de voz — vista de agencia.
        </p>

        {config && catalog ? (
          <BotConfigForm
            config={config}
            catalog={catalog}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
            savedMessage={savedMessage}
            error={error}
          />
        ) : (
          !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando…</div>
        )}
        {error && !config && <div style={{ color: "var(--danger)" }}>{error}</div>}
      </div>
    </AgencyShell>
  );
}

const backLink = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  textDecoration: "none",
};

const renameIconBtn = {
  background: "none",
  border: "none",
  color: "var(--ink-soft)",
  cursor: "pointer",
  fontSize: 15,
  lineHeight: 1,
  padding: 4,
  borderRadius: 6,
};

const renameInputStyle = {
  fontSize: 18,
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
  flex: 1,
  maxWidth: 320,
};

const renameSaveBtn = {
  background: "var(--g54-blue)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const renameCancelBtn = {
  background: "var(--surface)",
  color: "var(--ink-soft)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
