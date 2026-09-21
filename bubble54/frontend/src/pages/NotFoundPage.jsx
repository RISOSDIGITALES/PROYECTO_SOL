import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Logo size="small" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: "var(--ink-softer)", marginBottom: 4 }}>404</div>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, marginBottom: 20 }}>Esta página no existe.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/agencia/login" style={linkStyle}>Entrar como agencia</Link>
          <Link to="/negocio/login" style={linkStyle}>Entrar como negocio</Link>
        </div>
      </div>
    </div>
  );
}

const linkStyle = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--g54-blue)",
  textDecoration: "none",
};
