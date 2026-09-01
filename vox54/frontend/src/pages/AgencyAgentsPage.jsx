import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import StatusPill from "../components/StatusPill";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";

// Vista aparte de "Negocios" — esa es una grilla de tarjetas pensada para
// entrar a editar un negocio puntual; esta es una tabla densa pensada para
// ver de un vistazo el estado real de infraestructura de cada agente
// (proveedor de telefonía, número, modelo de IA) sin entrar a cada uno.
export default function AgencyAgentsPage() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [agents, setAgents] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.listAgents(session.access_token).then(setAgents).catch((e) => setError(e.message));
    api.getCatalog().then(setCatalog).catch(() => {});
  }, [session]);

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
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "36px 32px" }}>
        <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>Inventario de agentes</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 24 }}>
          Todos los agentes de voz que gestionás, a qué negocio pertenece cada uno, y con qué infraestructura corre.
        </p>

        {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        {agents && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
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
    </AgencyShell>
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
