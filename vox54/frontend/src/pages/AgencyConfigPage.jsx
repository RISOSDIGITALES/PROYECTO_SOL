import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import ChangePasswordForm from "../components/ChangePasswordForm";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { formatDateLong } from "../callFormat";

// Página propia para el ajuste de la CUENTA PERSONAL del admin logueado —
// separada a propósito del perfil de la agencia en sí (nombre, contacto,
// sitio), que ahora tiene su propio ítem de menú, "Agencia". Antes las dos
// cosas vivían mezcladas acá; un dato de la agencia (su correo de contacto)
// y un dato de la cuenta (la contraseña de quien está logueado) son ajustes
// de naturaleza distinta, aunque los edite la misma persona.
export default function AgencyConfigPage() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
  }, [session]);

  if (!session) return null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>Configuración</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Tu cuenta de administrador. Los datos de la agencia en sí viven en "Agencia".
        </p>

        {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        {me && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}>
            <Card title="Tu cuenta">
              <Row label="Nombre">{me.name}</Row>
              <Row label="Correo">{me.email}</Row>
              <Row label="Agencia">{me.agency_name}</Row>
              <Row label="Miembro desde">{formatDateLong(me.member_since)}</Row>
            </Card>

            <Card title="Cambiar contraseña">
              <ChangePasswordForm
                onSubmit={(current, next) =>
                  api.changeAgencyPassword(session.access_token, { current_password: current, new_password: next })
                }
              />
            </Card>
          </div>
        )}
      </div>
    </AgencyShell>
  );
}

function Card({ title, children }) {
  return (
    <div className="vox54-panel" style={{ padding: 20 }}>
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
