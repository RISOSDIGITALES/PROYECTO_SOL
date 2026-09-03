import { useOutletContext } from "react-router-dom";
import ChangePasswordForm from "../components/ChangePasswordForm";
import PrefsToggles from "../components/PrefsToggles";
import { api } from "../api";
import { formatDateLong } from "../callFormat";

// Página propia para el ajuste de la CUENTA PERSONAL del admin logueado —
// separada a propósito del perfil de la agencia en sí (nombre, contacto,
// sitio), que ahora tiene su propio ítem de menú, "Agencia". Antes las dos
// cosas vivían mezcladas acá; un dato de la agencia (su correo de contacto)
// y un dato de la cuenta (la contraseña de quien está logueado) son ajustes
// de naturaleza distinta, aunque los edite la misma persona.
//
// `me` viene del layout (AgencyLayout ya lo pide una sola vez al loguearse,
// ver comentario ahí) — esta pantalla no necesita pedirlo de nuevo.
export default function AgencyConfigPage() {
  const { session, me } = useOutletContext();

  if (!session) return null;

  return (
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>Configuración</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Tu cuenta de administrador. Los datos de la agencia en sí viven en "Agencia".
        </p>

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

            <Card title="Efectos">
              <PrefsToggles />
            </Card>
          </div>
        )}
      </div>
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
