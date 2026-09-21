import Logo from "./Logo";
import PoppableBubbles from "./PoppableBubbles";

// Layout real de 2 paneles compartido por LoginPage, ForgotPasswordPage y
// ResetPasswordPage (2026-09-21) -- extraído de LoginPage porque las 2
// páginas nuevas de recuperación habían nacido como una tarjeta blanca
// genérica flotando sobre gris, sin el degradado ni las burbujas reales del
// resto del producto -- ahí el propio Logo se rompe visualmente, porque
// ".g54-lockup .word" es texto blanco pensado para el fondo oscuro real
// (ver theme.css), invisible sobre blanco. Con este layout compartido,
// cualquier pantalla de auth nueva hereda la estética real por construcción,
// en vez de tener que acordarse de copiarla a mano cada vez.
const AMB_BUBBLES = [
  { id: "b1", size: 130, style: { left: "-4%", top: "-6%" }, delay: "-1s" },
  { id: "b2", size: 95, hue: "violet", style: { right: "-3%", top: "58%" }, delay: "-2.4s" },
  { id: "b3", size: 70, hue: "green", style: { left: "72%", top: "8%" }, delay: "-3.6s" },
  { id: "b4", size: 60, style: { left: "8%", top: "72%" }, delay: "-0.8s" },
  { id: "b5", size: 26, style: { left: "12%", top: "18%" }, delay: "-1s" },
  { id: "b6", size: 14, hue: "green", style: { left: "22%", top: "62%" }, delay: "-2.6s" },
  { id: "b7", size: 34, hue: "violet", style: { left: "68%", top: "12%" }, delay: "-0.5s" },
  { id: "b8", size: 18, style: { left: "78%", top: "70%" }, delay: "-3.3s" },
  { id: "b9", size: 10, hue: "green", style: { left: "50%", top: "82%" }, delay: "-1.8s" },
  { id: "b10", size: 12, hue: "violet", style: { left: "40%", top: "30%" }, delay: "-4s" },
];

export default function AuthShell({ eyebrow, heading, copy, children }) {
  return (
    <div style={pageStyle}>
      <div className="g54-gradient" style={introStyle}>
        <PoppableBubbles bubbles={AMB_BUBBLES} />
        <div style={introContentStyle}>
          <Logo />
          <div style={eyebrowStyle}>{eyebrow}</div>
          <h1 style={introHeadingStyle}>{heading}</h1>
          <p style={introCopyStyle}>{copy}</p>
        </div>
      </div>
      <div style={formSideStyle}>{children}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  flexWrap: "wrap",
};

const introStyle = {
  position: "relative",
  overflow: "hidden",
  flex: "1 1 420px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 40px 48px 72px",
};

const introContentStyle = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 18,
  maxWidth: 440,
  width: "100%",
};

const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: "#CFE0FF",
  marginTop: 12,
};

const introHeadingStyle = {
  fontSize: 40,
  lineHeight: 1.14,
  color: "#fff",
  margin: 0,
};

const introCopyStyle = {
  fontSize: 16,
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.85)",
  margin: 0,
};

const formSideStyle = {
  flex: "1 1 380px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--white)",
  padding: 24,
};

// Estilos del formulario en sí, compartidos por las 3 pantallas -- mismo
// ancho/gap/inputs/labels, para que se sientan la misma familia.
export const formStyle = {
  width: "100%",
  maxWidth: 340,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

export const formEyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "var(--g54-blue)",
  marginBottom: 6,
};

export const formHeadingStyle = {
  fontSize: 24,
  color: "var(--ink)",
  margin: 0,
};

export const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: "var(--ink-soft)",
  marginBottom: 6,
};

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "var(--font)",
};

export const linkRowStyle = {
  fontSize: 12.5,
  color: "var(--ink-soft)",
  textAlign: "center",
  textDecoration: "none",
};
