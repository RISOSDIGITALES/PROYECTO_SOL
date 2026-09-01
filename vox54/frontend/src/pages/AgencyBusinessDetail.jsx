import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import StatusPill from "../components/StatusPill";
import CallsList from "../components/CallsList";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { initials } from "../utils";

// Identidad del negocio (nombre, estado, ID) — separada a propósito de la
// configuración del bot en sí, que vive en su propia página
// (AgencyBotConfig). Antes las dos cosas estaban mezcladas en una sola
// pantalla larga; acá solo se decide "qué negocio es" y desde acá se entra
// a configurarlo.
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

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getBusinessDetail(session.access_token, id)
      .then(setBusiness)
      .catch((e) => setError(e.message));
    api.listBusinessCalls(session.access_token, id).then(setCalls).catch((e) => setCallsError(e.message));
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

  if (!session) return null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 32px" }}>
        <Link to="/agencia" style={backLink}>← Volver a negocios</Link>

        {error && <div style={{ color: "var(--danger)", margin: "16px 0" }}>{error}</div>}

        {business && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={avatarStyle}>{initials(business.name)}</div>
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
                      <button type="submit" disabled={renameSaving} style={renameSaveBtn}>
                        {renameSaving ? "Guardando…" : "Guardar"}
                      </button>
                      <button type="button" onClick={cancelRenaming} style={renameCancelBtn}>
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
              <StatusPill status={business.bot_config?.status} />
            </div>
            {renameError && <div style={{ fontSize: 12.5, color: "var(--danger)", marginTop: 10 }}>{renameError}</div>}
          </div>
        )}

        {business && (
          <Link to={`/agencia/negocios/${id}/bot`} className="vox54-card" style={ctaCardStyle}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)", marginBottom: 3 }}>
                Configuración del bot de voz
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                Telefonía, voz, modelo de IA, comportamiento y control de la llamada.
              </div>
            </div>
            <span style={{ fontSize: 20, color: "var(--g54-blue)" }}>→</span>
          </Link>
        )}

        {!business && !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: 16 }}>Cargando…</div>}

        {business && (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", marginBottom: 10 }}>
              Llamadas recientes
            </div>
            <CallsList calls={calls} loading={calls === null && !callsError} error={callsError} />
          </div>
        )}
      </div>
    </AgencyShell>
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
  background: "var(--g54-blue)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const ctaCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "18px 20px",
  marginTop: 16,
  textDecoration: "none",
  color: "inherit",
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

const renameSaveBtn = {
  background: "var(--g54-blue)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "7px 12px",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const renameCancelBtn = {
  background: "var(--surface)",
  color: "var(--ink-soft)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "7px 12px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
