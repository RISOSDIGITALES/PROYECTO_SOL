import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

// Shell con menú lateral, compartido por todas las pantallas del lado de
// agencia — antes cada página tenía su propia barra suelta sin ningún menú,
// dejando el panel sin ninguna estructura de navegación real.
export default function AgencyShell({ userName, onLogout, children }) {
  const location = useLocation();
  // "Negocios" cubre la lista y todo lo que cuelga de un negocio puntual
  // (identidad, configuración de su bot) — son la misma sección de la
  // agencia, no páginas sueltas. "Agentes" es el inventario aparte, de solo
  // lectura, de todos los bots. "Configuración" (la config de la agencia en
  // sí, nunca la de un negocio) vive abajo, junto a la cuenta y Salir — es
  // ajuste de la cuenta propia, no un destino de trabajo del día a día.
  const isNegocios = location.pathname === "/agencia" || location.pathname.startsWith("/agencia/negocios");
  const isAgentes = location.pathname.startsWith("/agencia/agentes");
  const isConfig = location.pathname.startsWith("/agencia/configuracion");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={sidebarStyle}>
        <div style={{ padding: "22px 20px 18px" }}>
          <Logo size="small" />
        </div>

        <nav style={{ padding: "4px 12px", flex: 1 }}>
          <Link to="/agencia" style={{ ...navItemStyle, ...(isNegocios ? activeNavItemStyle : {}) }}>
            <span style={navIconStyle}>🏢</span> Negocios
          </Link>
          <Link to="/agencia/agentes" style={{ ...navItemStyle, ...(isAgentes ? activeNavItemStyle : {}) }}>
            <span style={navIconStyle}>🎙️</span> Agentes
          </Link>
        </nav>

        <div style={footerStyle}>
          <Link to="/agencia/configuracion" style={{ ...navItemStyle, ...(isConfig ? activeNavItemStyle : {}), marginBottom: 10 }}>
            <span style={navIconStyle}>⚙️</span> Configuración
          </Link>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName}
          </div>
          <button onClick={onLogout} style={logoutBtn}>Salir</button>
        </div>
      </aside>

      <main style={mainStyle}>{children}</main>
    </div>
  );
}

const sidebarStyle = {
  width: 220,
  flexShrink: 0,
  background: "var(--g54-navy)",
  display: "flex",
  flexDirection: "column",
  position: "sticky",
  top: 0,
  height: "100vh",
};

const navItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 8,
  color: "rgba(255,255,255,.75)",
  textDecoration: "none",
  fontSize: 13.5,
  fontWeight: 600,
  marginBottom: 2,
};

const activeNavItemStyle = {
  background: "var(--g54-blue)",
  color: "#fff",
};

const navIconStyle = {
  fontSize: 15,
  width: 18,
  textAlign: "center",
};

const footerStyle = {
  padding: "16px 20px 20px",
  borderTop: "1px solid rgba(255,255,255,.1)",
};

const logoutBtn = {
  width: "100%",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "#fff",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

const mainStyle = {
  flex: 1,
  minWidth: 0,
  background: "var(--paper)",
};
