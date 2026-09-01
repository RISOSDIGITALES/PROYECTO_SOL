import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../AuthContext";
import { api } from "../api";

// Shell compartido por todas las pantallas del lado de agencia. El menú
// vive como un campo de burbujas flotando abajo, sin ninguna barra ni caja
// que las encierre — diseño elegido y afinado en vox54/design/menu-propuestas.html
// antes de implementarlo acá (ver ese archivo si hace falta retocar el
// tratamiento visual — mismas clases, viven en theme.css con el prefijo
// vox54-).
export default function AgencyShell({ userName, onLogout, children }) {
  const location = useLocation();
  const { session } = useAuth();
  const [poppingId, setPoppingId] = useState(null);
  const [pausedCount, setPausedCount] = useState(0);

  // "Negocios" cubre la lista y todo lo que cuelga de un negocio puntual
  // (identidad, configuración de su bot) — son la misma sección de la
  // agencia, no páginas sueltas. "Agentes" es el inventario aparte, de solo
  // lectura, de todos los bots. "Configuración" es la config de la agencia
  // en sí, nunca la de un negocio.
  const isNegocios = location.pathname === "/agencia" || location.pathname.startsWith("/agencia/negocios");
  const isAgentes = location.pathname.startsWith("/agencia/agentes");
  const isConfig = location.pathname.startsWith("/agencia/configuracion");

  useEffect(() => {
    if (!session?.access_token) return;
    // La burbuja de "Agentes" solo muestra un número real — cuántos bots
    // propios están pausados ahora mismo — nunca un dato inventado. Sin
    // ninguno pausado, no se muestra ninguna burbuja de aviso.
    api.listAgents(session.access_token)
      .then((agents) => setPausedCount(agents.filter((a) => a.bot_status === "paused").length))
      .catch(() => {});
  }, [session]);

  function handleClick(id, e) {
    setPoppingId(id);
    setTimeout(() => setPoppingId(null), 500);
    if (id === "salir") onLogout();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="g54-gradient" style={topbarStyle}>
        <Logo size="small" />
        <span style={{ color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{userName}</span>
      </div>

      {/* flex:1 + overflowY propio — el dock de abajo es un hermano del
          mismo alto flex-column, nunca se superpone al contenido porque el
          contenido scrollea adentro suyo, no debajo del dock. minHeight:0
          es necesario para que el overflow realmente funcione en flexbox. */}
      <main style={mainScrollStyle}>{children}</main>

      <nav className="vox54-bubblefield" aria-label="Navegación de agencia">
        <span className="vox54-amb" style={{ width: 14, height: 14, left: "6%", bottom: 92, animationDelay: "-1.2s" }} />
        <span className="vox54-amb green" style={{ width: 9, height: 9, left: "14%", bottom: 40, animationDelay: "-2.7s", filter: "blur(0.4px)" }} />
        <span className="vox54-amb" style={{ width: 20, height: 20, left: "24%", bottom: 110, animationDelay: "-0.4s", filter: "blur(0.5px)" }} />
        <span className="vox54-amb violet" style={{ width: 10, height: 10, left: "36%", bottom: 28, animationDelay: "-4.1s" }} />
        <span className="vox54-amb green" style={{ width: 11, height: 11, right: "32%", bottom: 100, animationDelay: "-3.4s" }} />
        <span className="vox54-amb violet" style={{ width: 15, height: 15, right: "22%", bottom: 115, animationDelay: "-1.5s", filter: "blur(0.4px)" }} />
        <span className="vox54-amb" style={{ width: 16, height: 16, right: "16%", bottom: 50, animationDelay: "-1.8s" }} />
        <span className="vox54-amb" style={{ width: 8, height: 8, right: "9%", bottom: 108, animationDelay: "-2.2s" }} />
        <span className="vox54-amb green" style={{ width: 13, height: 13, right: "6%", bottom: 70, animationDelay: "-0.9s" }} />

        <Link
          to="/agencia"
          className="vox54-navcol"
          style={{ animationDelay: "-0.6s" }}
          onClick={() => handleClick("negocios")}
        >
          <span className={`vox54-navbubble ${isNegocios ? "active" : ""} ${poppingId === "negocios" ? "popping" : ""}`}>
            <span className="icon">🏢</span>
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
            <span className="icon">🎙️</span>
            {pausedCount > 0 && <span className="vox54-notif">{pausedCount}</span>}
          </span>
          <span className="vox54-navlabel">Agentes</span>
        </Link>

        <Link
          to="/agencia/configuracion"
          className="vox54-navcol"
          style={{ animationDelay: "-3.1s" }}
          onClick={() => handleClick("config")}
        >
          <span className={`vox54-navbubble hueC ${isConfig ? "active" : ""} ${poppingId === "config" ? "popping" : ""}`}>
            <span className="icon">⚙️</span>
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
            <span className="icon">🚪</span>
          </span>
          <span className="vox54-navlabel">Salir</span>
        </button>
      </nav>
    </div>
  );
}

const topbarStyle = {
  flexShrink: 0,
  padding: "14px 28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const mainScrollStyle = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
};
