import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

// Shell con menú lateral, compartido por todas las pantallas del lado de
// agencia — antes cada página tenía su propia barra suelta sin ningún menú,
// dejando el panel sin ninguna estructura de navegación real.
export default function AgencyShell({ userName, onLogout, children }) {
  const location = useLocation();
  const isNegocios = location.pathname.startsWith("/agencia");

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
        </nav>

        <div style={footerStyle}>
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
