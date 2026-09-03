import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AgencyShell from "../components/AgencyShell";
import { OutcomeBadge } from "../components/CallsList";
import { useAuth } from "../AuthContext";
import { useRequireRole } from "../useRequireRole";
import { api } from "../api";
import { formatDate, formatDuration } from "../callFormat";

// Registros — el historial de llamadas de TODA la agencia, de cualquiera de
// sus negocios, no de uno puntual (eso ya lo cubre "Llamadas recientes"
// dentro de la ficha de cada negocio). Tabla densa con lo básico de cada
// fila; entrar a una lleva al detalle completo con la transcripción real.
export default function AgencyCallsPage() {
  const { logout } = useAuth();
  const session = useRequireRole("agency");
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [businesses, setBusinesses] = useState(null);
  const [calls, setCalls] = useState(null);
  const [businessFilter, setBusinessFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    api.agencyMe(session.access_token).then(setMe).catch((e) => setError(e.message));
    api.listBusinesses(session.access_token).then(setBusinesses).catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!session) return;
    setCalls(null);
    api.listAgencyCalls(session.access_token, businessFilter || undefined)
      .then(setCalls)
      .catch((e) => setError(e.message));
  }, [session, businessFilter]);

  if (!session) return null;

  return (
    <AgencyShell userName={me?.name} onLogout={() => { logout(); navigate("/agencia/login"); }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, color: "var(--ink)", marginBottom: 4 }}>Registros</h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 13.5, margin: 0 }}>
              El historial real de llamadas de todos tus negocios, en un solo lugar.
            </p>
          </div>
          {businesses && businesses.length > 1 && (
            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value)}
              style={filterStyle}
              aria-label="Filtrar por negocio"
            >
              <option value="">Todos los negocios</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        {error && <div style={{ color: "var(--danger)", marginBottom: 16 }}>{error}</div>}

        {calls && (
          <div className="vox54-panel">
            {calls.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📞</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 4 }}>
                  Todavía no hubo ninguna llamada
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                  En cuanto un negocio reciba una llamada real, va a aparecer acá.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <Th>Negocio</Th>
                      <Th>Fecha</Th>
                      <Th>Duración</Th>
                      <Th>Número</Th>
                      <Th>Resultado</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {calls.map((c) => (
                      <tr key={c.id} style={rowStyle}>
                        <Td style={{ fontWeight: 700, color: "var(--ink)" }}>{c.business_name}</Td>
                        <Td>{formatDate(c.started_at)}</Td>
                        <Td style={{ fontVariantNumeric: "tabular-nums" }}>{formatDuration(c.duration_seconds)}</Td>
                        <Td style={{ fontVariantNumeric: "tabular-nums" }}>{c.caller_number || "—"}</Td>
                        <Td><OutcomeBadge outcome={c.outcome} /></Td>
                        <Td>
                          <Link to={`/agencia/registros/${c.id}`} style={{ color: "var(--g54-blue)", fontWeight: 700, fontSize: 12, textDecoration: "none" }}>
                            Ver detalle →
                          </Link>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

const filterStyle = {
  padding: "8px 12px",
  fontSize: 13,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
  background: "var(--white)",
  color: "var(--ink)",
};
