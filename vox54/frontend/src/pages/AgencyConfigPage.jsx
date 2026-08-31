import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";

// Página propia para la configuración de la agencia en sí — separada a
// propósito de "Negocios" (que lista y edita cada negocio y su bot). Hoy
// solo hay datos reales de solo-lectura porque el backend todavía no
// expone ningún endpoint para editar el perfil de la agencia; se muestra
// tal cual, sin inventar un botón de "Guardar" que no tendría nada real
// que guardar.
export default function AgencyConfigPage() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [businessCount, setBusinessCount] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.listBusinesses(session.access_token)
      .then((list) => setBusinessCount(list.length))
      .catch(() => {});
  }, [session]);

  if (!session) return null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 32px" }}>
        <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>Configuración de la agencia</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Datos de la agencia y de tu cuenta de administrador.
        </p>

        {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        {me && (
          <div style={{ display: "grid", gap: 16 }}>
            <Card title="Agencia">
              <Row label="Nombre">{me.agency_name}</Row>
              <Row label="Negocios gestionados">
                {businessCount === null ? "…" : businessCount}
              </Row>
            </Card>

            <Card title="Tu cuenta">
              <Row label="Nombre">{me.name}</Row>
              <Row label="Correo">{me.email}</Row>
            </Card>
          </div>
        )}
      </div>
    </AgencyShell>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)", marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{children}</span>
    </div>
  );
}
