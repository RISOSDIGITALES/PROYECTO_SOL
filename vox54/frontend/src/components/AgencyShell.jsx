import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";
import PoppableBubbles from "./PoppableBubbles";
import { useAuth } from "../AuthContext";
import { api } from "../api";

// Shell compartido por todas las pantallas del lado de agencia. El menú
// vuelve a vivir a la izquierda (después del experimento con el dock
// flotando abajo) pero conserva el mismo tratamiento de burbujas de vidrio
// — esta vez sobre el fondo azul degradado real (.g54-gradient, el mismo
// de la intro del login), donde el vidrio translúcido sí se lee: sobre
// blanco casi desaparecía, que era justo la queja. Mismas clases de
// theme.css (prefijo vox54-), solo un contenedor vertical nuevo.

// Burbujas decorativas de fondo de la barra lateral — mismo set y mismo
// mecanismo interactivo (PoppableBubbles) ya usado en LoginPage y
// BusinessDashboard, nunca las burbujas de navegación reales
// (Negocios/Agentes/Configuración/Salir), que siguen con su propio squish
// de siempre. Coordenadas repensadas para una columna angosta y alta en
// vez de una barra horizontal.
const DOCK_BUBBLES = [
  { id: "d1", size: 16, style: { left: "8%", top: "4%" }, delay: "-1.2s" },
  { id: "d2", size: 10, hue: "green", style: { right: "10%", top: "13%" }, delay: "-2.7s" },
  { id: "d3", size: 22, style: { left: "-14%", top: "24%", filter: "blur(0.5px)" }, delay: "-0.4s" },
  { id: "d4", size: 11, hue: "violet", style: { right: "-10%", top: "37%" }, delay: "-4.1s" },
  { id: "d5", size: 13, hue: "green", style: { left: "4%", top: "50%" }, delay: "-3.4s" },
  { id: "d6", size: 19, hue: "violet", style: { right: "6%", top: "63%", filter: "blur(0.4px)" }, delay: "-1.5s" },
  { id: "d7", size: 21, style: { left: "-12%", top: "75%" }, delay: "-1.8s" },
  { id: "d8", size: 9, style: { right: "16%", top: "87%" }, delay: "-2.2s" },
  { id: "d9", size: 15, hue: "green", style: { left: "10%", top: "95%" }, delay: "-0.9s" },
];

export default function AgencyShell({ userName, onLogout, children }) {
  const location = useLocation();
  const { session } = useAuth();
  const [poppingId, setPoppingId] = useState(null);
  const [pausedCount, setPausedCount] = useState(0);
  const [agencyName, setAgencyName] = useState("");

  // "Inicio" es la landing (bienvenida + progreso + resumen), exclusiva de
  // /agencia — ya no comparte ruta con "Negocios", que se corrió a
  // /agencia/negocios y cubre la lista más todo lo que cuelga de un negocio
  // puntual (identidad, perfil, configuración de su bot). "Agencia" es el
  // perfil real de la agencia en sí (contacto, sitio, dirección) — antes
  // vivía mezclado dentro de "Configuración" junto con la cuenta personal
  // del admin; ahora tiene su propio lugar, antes de "Negocios". "Agentes"
  // es el inventario aparte, de solo lectura, de todos los bots.
  // "Registros" es el historial de llamadas de TODA la agencia (no de un
  // negocio puntual, eso ya vive dentro de cada negocio). "Configuración"
  // sigue siendo pura cuenta personal (cambio de contraseña), nunca la
  // agencia ni un negocio.
  const isInicio = location.pathname === "/agencia";
  const isAgencia = location.pathname.startsWith("/agencia/perfil");
  const isNegocios = location.pathname.startsWith("/agencia/negocios");
  const isAgentes = location.pathname.startsWith("/agencia/agentes");
  const isRegistros = location.pathname.startsWith("/agencia/registros");
  const isConfig = location.pathname.startsWith("/agencia/configuracion");

  useEffect(() => {
    if (!session?.access_token) return;
    // La burbuja de "Agentes" solo muestra un número real — cuántos bots
    // propios están pausados ahora mismo — nunca un dato inventado. Sin
    // ninguno pausado, no se muestra ninguna burbuja de aviso.
    api.listAgents(session.access_token)
      .then((agents) => setPausedCount(agents.filter((a) => a.bot_status === "paused").length))
      .catch(() => {});
    // Nombre real de la agencia para el rectángulo bajo el logo — llamada
    // propia del shell, independiente de lo que cada pantalla ya pida para
    // sí misma (mismo criterio que el conteo de pausados de arriba).
    api.agencyMe(session.access_token)
      .then((me) => setAgencyName(me.agency_name || ""))
      .catch(() => {});
  }, [session]);

  function handleClick(id, e) {
    setPoppingId(id);
    setTimeout(() => setPoppingId(null), 500);
    if (id === "salir") onLogout();
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <nav className="vox54-sidebar g54-gradient" aria-label="Navegación de agencia">
        <PoppableBubbles bubbles={DOCK_BUBBLES} />

        <Link to="/agencia" className="vox54-sidebar-brand" aria-label="Bubble 54">
          <Logo size="small" />
        </Link>

        {agencyName && (
          <div className="vox54-agency-badge" title={agencyName}>
            {agencyName}
          </div>
        )}

        <div className="vox54-sidebar-main">
          <Link
            to="/agencia"
            className="vox54-navcol"
            style={{ animationDelay: "-2.4s" }}
            onClick={() => handleClick("inicio")}
          >
            <span className={`vox54-navbubble hueD ${isInicio ? "active" : ""} ${poppingId === "inicio" ? "popping" : ""}`}>
              <Icon name="home" className="icon" />
            </span>
            <span className="vox54-navlabel">Inicio</span>
          </Link>

          <Link
            to="/agencia/perfil"
            className="vox54-navcol"
            style={{ animationDelay: "-2.1s" }}
            onClick={() => handleClick("agencia")}
          >
            <span className={`vox54-navbubble hueE ${isAgencia ? "active" : ""} ${poppingId === "agencia" ? "popping" : ""}`}>
              <Icon name="building" className="icon" />
            </span>
            <span className="vox54-navlabel">Agencia</span>
          </Link>

          <Link
            to="/agencia/negocios"
            className="vox54-navcol"
            style={{ animationDelay: "-0.6s" }}
            onClick={() => handleClick("negocios")}
          >
            <span className={`vox54-navbubble ${isNegocios ? "active" : ""} ${poppingId === "negocios" ? "popping" : ""}`}>
              <Icon name="briefcase" className="icon" />
            </span>
            <span className="vox54-navlabel">Negocios</span>
          </Link>

          <Link
            to="/agencia/agentes"
            className="vox54-navcol"
            style={{ animationDelay: "-1.9s" }}
            onClick={() => handleClick("agentes")}
          >
            <span className={`vox54-navbubble hueB ${isAgentes ? "active" : ""} ${poppingId === "agentes" ? "popping" : ""}`}>
              <Icon name="mic" className="icon" />
              {pausedCount > 0 && <span className="vox54-notif">{pausedCount}</span>}
            </span>
            <span className="vox54-navlabel">Agentes</span>
          </Link>

          <Link
            to="/agencia/registros"
            className="vox54-navcol"
            style={{ animationDelay: "-3.6s" }}
            onClick={() => handleClick("registros")}
          >
            <span className={`vox54-navbubble hueF ${isRegistros ? "active" : ""} ${poppingId === "registros" ? "popping" : ""}`}>
              <Icon name="list" className="icon" />
            </span>
            <span className="vox54-navlabel">Registros</span>
          </Link>
        </div>

        {/* Configuración + Salir agrupadas al pie, separadas del trabajo
            del día a día — mismo criterio ya usado cuando el menú vivía
            del lado izquierdo la primera vez (son ajuste de cuenta, no
            un destino de trabajo). */}
        <div className="vox54-sidebar-foot">
          <Link
            to="/agencia/configuracion"
            className="vox54-navcol"
            style={{ animationDelay: "-3.1s" }}
            onClick={() => handleClick("config")}
          >
            <span className={`vox54-navbubble hueC ${isConfig ? "active" : ""} ${poppingId === "config" ? "popping" : ""}`}>
              <Icon name="gear" className="icon" />
            </span>
            <span className="vox54-navlabel">Configuración</span>
          </Link>

          <button
            type="button"
            className="vox54-navcol"
            style={{ animationDelay: "-0.2s" }}
            onClick={() => handleClick("salir")}
          >
            <span className={`vox54-navbubble exit ${poppingId === "salir" ? "popping" : ""}`}>
              <Icon name="logout" className="icon" />
            </span>
            <span className="vox54-navlabel">Salir</span>
          </button>
        </div>
      </nav>

      <div style={contentColStyle}>
        <div style={topbarStyle}>
          <span style={{ color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 600 }}>{userName}</span>
        </div>

        {/* flex:1 + overflowY propio, mismo criterio de siempre para que el
            contenido nunca quede tapado — acá ni hace falta el truco: al
            ser la barra un hermano de ancho fijo en una fila flex, nunca
            puede superponerse al contenido, se lo cede automáticamente. */}
        <main style={mainScrollStyle}>{children}</main>
      </div>
    </div>
  );
}

const contentColStyle = {
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  height: "100vh",
};

const topbarStyle = {
  flexShrink: 0,
  padding: "14px 28px",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  borderBottom: "1px solid var(--border)",
  background: "var(--white)",
};

const mainScrollStyle = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
};
