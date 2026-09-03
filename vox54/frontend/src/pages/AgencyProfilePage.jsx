import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import StatusPill from "../components/StatusPill";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { initials } from "../utils";
import { burst } from "../burst";

// Perfil real de la agencia — nombre, contacto, sitio, dirección, y ahora
// también LA LISTA REAL de negocios que gestiona (antes era solo un número,
// "2 negocios gestionados", sin decir de cuáles — la relación Agency→
// Business ya existe en la base, faltaba mostrarla). Antes esto vivía
// mezclado dentro de "Configuración" junto con la cuenta personal del admin
// logueado (nombre/correo/contraseña) — dos cosas de naturaleza distinta
// compartiendo una sola pantalla. Acá vive solo la identidad de la agencia
// en sí, editable, con su propio ítem de menú antes de "Negocios".
export default function AgencyProfilePage() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const saveBtnRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.getAgencyProfile(session.access_token).then(setProfile).catch((e) => setError(e.message));
  }, [session]);

  function handleChange(patch) {
    setProfile((prev) => ({ ...prev, ...patch }));
    setSavedMessage("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSavedMessage("");
    setSaving(true);
    try {
      const updated = await api.updateAgencyProfile(session.access_token, {
        name: profile.name,
        contact_email: profile.contact_email,
        contact_phone: profile.contact_phone,
        website: profile.website,
        address: profile.address,
      });
      setProfile((prev) => ({ ...prev, ...updated }));
      setSavedMessage("Guardado correctamente.");
      burst(saveBtnRef.current);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!session) return null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>Agencia</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Identidad y contacto de tu agencia — es lo que ven tus negocios como su canal real de soporte.
        </p>

        {error && !profile && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        {profile ? (
          <form onSubmit={handleSave} style={{ display: "grid", gap: 20 }}>
            {error && <div style={bannerStyle("danger")}>{error}</div>}
            {savedMessage && <div style={bannerStyle("success")}>{savedMessage}</div>}

            <div style={gridStyle}>
              <div className="vox54-panel" style={{ padding: 20 }}>
                <div style={sectionTitleStyle}>Identidad</div>
                <Field label="Nombre de la agencia">
                  <input value={profile.name} onChange={(e) => handleChange({ name: e.target.value })} style={inputStyle} />
                </Field>
              </div>

              {/* La lista real, no solo el conteo — cada fila lleva directo
                  a la ficha real de ese negocio. */}
              <div className="vox54-panel" style={{ padding: 20 }}>
                <div style={sectionTitleStyle}>
                  Negocios gestionados ({profile.businesses.length})
                </div>
                {profile.businesses.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                    Todavía no gestionás ningún negocio.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {profile.businesses.map((b) => (
                      <Link key={b.id} to={`/agencia/negocios/${b.id}`} className="vox54-steprow" style={businessRowStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div className="vox54-avatar" style={avatarStyle}>{initials(b.name)}</div>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {b.name}
                          </span>
                        </div>
                        <StatusPill status={b.bot_status} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="vox54-panel" style={{ padding: 20 }}>
              <div style={sectionTitleStyle}>Contacto</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                <Field label="Correo de contacto">
                  <input
                    type="email"
                    value={profile.contact_email}
                    onChange={(e) => handleChange({ contact_email: e.target.value })}
                    placeholder="hola@tuagencia.com"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    value={profile.contact_phone}
                    onChange={(e) => handleChange({ contact_phone: e.target.value })}
                    placeholder="Sin cargar todavía"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Sitio web">
                  <input
                    value={profile.website}
                    onChange={(e) => handleChange({ website: e.target.value })}
                    placeholder="https://"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Dirección">
                  <input
                    value={profile.address}
                    onChange={(e) => handleChange({ address: e.target.value })}
                    placeholder="Sin cargar todavía"
                    style={inputStyle}
                  />
                </Field>
              </div>
              <p style={{ fontSize: 12, color: "var(--ink-softer)", marginTop: 14, marginBottom: 0 }}>
                Este correo y teléfono son lo que ve cada negocio como canal real de soporte, en vez de solo el nombre de la agencia.
              </p>
            </div>

            <button ref={saveBtnRef} type="submit" disabled={saving} className="vox54-btn" style={{ justifySelf: "start" }}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </form>
        ) : (
          !error && <div style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>Cargando…</div>
        )}
      </div>
    </AgencyShell>
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

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 20,
  alignItems: "start",
};

const sectionTitleStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-soft)",
  marginBottom: 14,
};

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
  background: "var(--white)",
};

const businessRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 10,
  textDecoration: "none",
  border: "1px solid var(--border)",
};

const avatarStyle = {
  width: 30,
  height: 30,
  flexShrink: 0,
  borderRadius: 8,
  fontSize: 11.5,
};
