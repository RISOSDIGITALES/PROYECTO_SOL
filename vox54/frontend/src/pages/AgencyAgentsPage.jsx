import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import StatusPill from "../components/StatusPill";
import CreateBusinessModal from "../components/CreateBusinessModal";
import BusinessPickerModal from "../components/BusinessPickerModal";
import AgencyProfileRequiredModal from "../components/AgencyProfileRequiredModal";
import { api } from "../api";
import { useAgencyProfileDone } from "../useAgencyProfileDone";

// Vista aparte de "Negocios" — esa es una grilla de tarjetas pensada para
// entrar a editar un negocio puntual; esta es una tabla densa pensada para
// ver de un vistazo el estado real de infraestructura de cada agente
// (proveedor de telefonía, número, modelo de IA) sin entrar a cada uno.
//
// No existe ningún "crear agente" independiente — el modelo real es 1
// negocio = 1 bot (BotConfig nace solo al crear el Business, ver
// create_business en agency.py). El botón de acá reusa el mismo modal de
// "Crear negocio" que ya usa /agencia/negocios, para no tener dos flujos
// de creación distintos aterrizando en lo mismo — y, a diferencia de esa
// pantalla, después de crear manda directo a configurar el bot nuevo (que
// es lo que alguien mirando ESTE inventario en particular busca).
export default function AgencyAgentsPage() {
  const { session } = useOutletContext();
  const navigate = useNavigate();
  const [agents, setAgents] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfileRequired, setShowProfileRequired] = useState(false);
  const { done: agencyProfileDone } = useAgencyProfileDone(session?.access_token);

  function refreshAgents() {
    api.listAgents(session.access_token).then(setAgents).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (!session) return;
    refreshAgents();
    api.getCatalog().then(setCatalog).catch(() => {});
  }, [session]);

  async function handleCreate(form) {
    const created = await api.createBusiness(session.access_token, form);
    setShowCreate(false);
    navigate(`/agencia/negocios/${created.id}/bot`);
  }

  if (!session) return null;

  function providerLabel(list, id) {
    if (!id) return "—";
    const found = catalog?.[list]?.find((p) => p.id === id);
    return found?.name || id;
  }

  function modelLabel(providerId, modelId) {
    if (!modelId) return "—";
    const provider = catalog?.ai_providers?.find((p) => p.id === providerId);
    const found = provider?.models?.find((m) => m.id === modelId);
    return found?.name || modelId;
  }

  return (
    <>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>Inventario de agentes</h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>
              Todos los agentes de voz que gestionás, a qué negocio pertenece cada uno, y con qué infraestructura corre.
            </p>
          </div>
          {/* Nunca salta directo a "crear negocio" -- primero muestra los
              que ya existen (BusinessPickerModal), para no crear uno
              duplicado por error cuando la intención era ir a configurar
              uno que ya está. Si ya hay negocios, el picker solo deja
              elegir uno -- crear uno nuevo se hace desde /agencia/negocios,
              no desde acá. Solo ofrece crear cuando no hay ninguno todavía. */}
          <button onClick={() => setShowPicker(true)} className="vox54-btn" style={{ flexShrink: 0 }}>+ Nuevo agente</button>
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        {agents && (
          <div className="vox54-panel">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <Th>Negocio</Th>
                    <Th>Estado</Th>
                    <Th>Telefonía</Th>
                    <Th>Número</Th>
                    <Th>Modelo de IA</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={a.business_id} style={rowStyle}>
                      <Td>
                        <div style={{ fontWeight: 700, color: "var(--ink)" }}>{a.business_name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-softer)" }}>ID {a.business_id}</div>
                      </Td>
                      <Td><StatusPill status={a.bot_status} /></Td>
                      <Td>{providerLabel("telephony_providers", a.telephony_provider)}</Td>
                      <Td style={{ fontVariantNumeric: "tabular-nums" }}>{a.phone_number || "—"}</Td>
                      <Td>
                        {providerLabel("ai_providers", a.ai_provider)}
                        {a.ai_model && (
                          <span style={{ color: "var(--ink-softer)" }}> · {modelLabel(a.ai_provider, a.ai_model)}</span>
                        )}
                      </Td>
                      <Td>
                        <Link to={`/agencia/negocios/${a.business_id}/bot`} style={{ color: "var(--g54-blue)", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                          Ver bot →
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {agents.length === 0 && !error && (
              <div style={{ padding: 20, color: "var(--ink-soft)", fontSize: 13.5 }}>Todavía no hay ningún agente cargado.</div>
            )}
          </div>
        )}
      </div>
      {showPicker && (
        <BusinessPickerModal
          agents={agents || []}
          onClose={() => setShowPicker(false)}
          onRequestCreate={() => {
            setShowPicker(false);
            // Sin ningún dato real de contacto/logo en el perfil de la
            // agencia, un negocio nuevo no tendría ningún canal de soporte
            // real que mostrar -- se corta acá, antes de llegar al
            // formulario, en vez de dejar que se cree igual.
            if (agencyProfileDone) setShowCreate(true);
            else setShowProfileRequired(true);
          }}
        />
      )}
      {showCreate && (
        <CreateBusinessModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
      {showProfileRequired && (
        <AgencyProfileRequiredModal onClose={() => setShowProfileRequired(false)} />
      )}
    </>
  );
}

function Th({ children }) {
  return (
    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)", borderBottom: "1px solid var(--border)" }}>
      {children}
    </th>
  );
}

function Td({ children, style }) {
  return <td style={{ padding: "12px 16px", verticalAlign: "middle", ...style }}>{children}</td>;
}

const rowStyle = {
  borderBottom: "1px solid var(--border)",
};
