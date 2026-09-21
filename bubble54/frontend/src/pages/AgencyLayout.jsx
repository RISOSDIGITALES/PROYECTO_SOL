import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { AGENCY_PROFILE_EVENT } from "../agencyProfileEvents";

// Layout real del lado de agencia — antes cada una de las 9 pantallas
// envolvía su propio contenido en su propio <AgencyShell>, así que
// cambiar de "opción" del menú (Inicio → Negocios, etc.) es un cambio de
// ROUTE con un componente de página distinto por completo — React Router
// desmonta el árbol entero de la página vieja (shell incluido) y monta el
// de la nueva desde cero. Eso reiniciaba las animaciones de flote de las
// burbujas de fondo, hacía parpadear el badge de "Growth54" y el aviso de
// agentes pausados (volvían a null hasta que la llamada a /agency/me y
// /agency/agents terminaba de nuevo), y en la práctica se sentía como un
// salto/entrecorte real en cada clic del menú — exactamente el reporte de
// la usuaria. Con un layout real (esta pantalla + <Outlet/>), el shell se
// monta UNA sola vez por sesión y solo cambia lo de adentro — mismo patrón
// que ya usa BusinessDashboard.jsx, que nunca tuvo este problema porque ahí
// las "pestañas" son estado local, no rutas separadas.
export default function AgencyLayout() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [agents, setAgents] = useState(null);

  // Única fuente real de `me`/`profile`/`agents` para todo el lado de
  // agencia. Antes AgencyShell pedía los 3 por su cuenta (para el badge y
  // el aviso de agentes pausados) y AgencyHomePage volvía a pedir 2 de los
  // 3 (para el checklist y el resumen) -- cada login/carga de Inicio
  // disparaba 8 llamadas reales quintuplicadas por el preflight de CORS y
  // el doble-invoke de StrictMode en dev, sentido como lentitud real por
  // la usuaria. Ahora se piden una sola vez acá, en paralelo, y viajan por
  // contexto/props -- ninguna pantalla ni el shell vuelven a pedirlos.
  const refreshIdentity = useCallback(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch(() => {});
    api.getAgencyProfile(session.access_token).then(setProfile).catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!session) return;
    refreshIdentity();
    api.listAgents(session.access_token).then(setAgents).catch(() => {});
  }, [session, refreshIdentity]);

  // Mismo mecanismo de siempre (agencyProfileEvents.js) para que la barra
  // lateral y cualquier pantalla que lea `profile`/`me` del contexto se
  // enteren cuando AgencyProfilePage sube un logo o renombra la agencia,
  // sin depender de un remount. Antes solo lo escuchaba AgencyShell (solo
  // su propio badge se enteraba); ahora, al vivir acá, también llega a
  // cualquier página que consuma el contexto.
  useEffect(() => {
    window.addEventListener(AGENCY_PROFILE_EVENT, refreshIdentity);
    return () => window.removeEventListener(AGENCY_PROFILE_EVENT, refreshIdentity);
  }, [refreshIdentity]);

  if (!session) return null;

  const pausedCount = agents ? agents.filter((a) => a.bot_status === "paused").length : 0;

  return (
    <AgencyShell
      onLogout={() => { logout(); navigate("/agencia/login"); }}
      agencyName={me?.agency_name || ""}
      agencyLogoUrl={profile?.logo_url || ""}
      pausedCount={pausedCount}
    >
      {/* `me`/`profile`/`agents` viajan a las pantallas que los necesitan
          vía useOutletContext(), sin que cada una tenga que volver a
          pedirlos -- mismo criterio ya usado para `me` desde el 07-sep,
          ahora extendido a los otros dos. */}
      <Outlet context={{ session, me, profile, agents }} />
    </AgencyShell>
  );
}
