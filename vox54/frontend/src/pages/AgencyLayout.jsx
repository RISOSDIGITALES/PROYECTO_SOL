import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";

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

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch(() => {});
  }, [session]);

  if (!session) return null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      {/* `me` viaja a las pantallas que lo necesitan para su propio
          contenido (Inicio, Configuración) vía useOutletContext(), sin que
          cada una tenga que volver a pedirlo. */}
      <Outlet context={{ session, me }} />
    </AgencyShell>
  );
}
