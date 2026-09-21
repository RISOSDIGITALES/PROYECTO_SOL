import { Link, useLocation } from "react-router-dom";
import Icon from "./Icon";
import PoppableBubbles from "./PoppableBubbles";
import TopBrandBar from "./TopBrandBar";
import { burst } from "../burst";

// Shell compartido por todas las pantallas del lado de agencia. El menú
// vuelve a vivir a la izquierda (después del experimento con el dock
// flotando abajo) pero conserva el mismo tratamiento de burbujas de vidrio
// — esta vez sobre el fondo azul degradado real (.g54-gradient, el mismo
// de la intro del login), donde el vidrio translúcido sí se lee: sobre
// blanco casi desaparecía, que era justo la queja. Mismas clases de
// theme.css (prefijo bubble54-), solo un contenedor vertical nuevo.

// Burbujas decorativas de fondo de la barra lateral — mismo set y mismo
// mecanismo interactivo (PoppableBubbles) ya usado en LoginPage y
// BusinessDashboard, nunca las burbujas de navegación reales
// (Negocios/Agentes/Configuración/Salir), que siguen con su propio squish
// de siempre. Ampliado con más burbujas pegadas a los bordes (left/right
// cerca de 0% o negativos, como si asomaran desde más allá del panel) a
// pedido explícito de la usuaria — antes se concentraban más al centro.
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
  { id: "d10", size: 12, hue: "violet", style: { left: "-16%", top: "8%" }, delay: "-3.9s" },
  { id: "d11", size: 8, style: { right: "-8%", top: "20%" }, delay: "-0.6s" },
  { id: "d12", size: 14, hue: "green", style: { right: "-12%", top: "45%", filter: "blur(0.4px)" }, delay: "-2.1s" },
  { id: "d13", size: 10, style: { left: "-10%", top: "58%" }, delay: "-4.4s" },
  { id: "d14", size: 17, hue: "violet", style: { left: "-15%", top: "90%" }, delay: "-1.1s" },
  { id: "d15", size: 9, style: { right: "-9%", top: "72%" }, delay: "-3.2s" },
];

export default function AgencyShell({ onLogout, children, agencyName = "", agencyLogoUrl = "", pausedCount = 0 }) {
  const location = useLocation();

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

  // `agencyName`/`agencyLogoUrl`/`pausedCount` ya no se piden acá -- vienen
  // como props desde AgencyLayout, que es dueño único de `me`/`profile`/
  // `agents` y se re-suscribe solo a agencyProfileEvents.js. Este shell se
  // sigue enterando de un logo/nombre nuevo sin remontarse (mismo
  // comportamiento de antes), solo que ya no dispara sus propias 3
  // llamadas duplicadas para lograrlo.

  // Estallido real (flash+aro+partículas), igual al de las burbujas
  // decorativas — a pedido explícito, sin que el ícono desaparezca (nunca
  // se saca del DOM, ver burst.js). El "parpadeo"/salto que se veía al
  // clickear NO era este efecto — era que `.bubble54-navbubble.active`
  // cambiaba width/height (70px), lo que reacomodaba el layout de toda la
  // columna centrada del menú; corregido en theme.css a un transform:scale
  // puramente visual, que nunca mueve a los demás ítems.
  //
  // No se combina con el squish viejo (.popping/bubble54-pop, ya retirado) —
  // los dos animan `transform` sobre el mismo elemento a la vez, y burst()
  // ya trae su propio pulso de escala (.bubble54-burstkeep) — apilar los dos
  // es el mismo tipo de conflicto de animaciones ya encontrado y corregido
  // antes en esta sesión (flote vs. hover).
  function handleClick(id, e) {
    const bubbleEl = e?.currentTarget?.querySelector(".bubble54-navbubble");
    burst(bubbleEl);
    if (id === "salir") onLogout();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopBrandBar logoUrl={agencyLogoUrl} name={agencyName} />
      <div style={{ display: "flex", flex: "1 1 auto", minHeight: 0 }}>
      <nav className="bubble54-sidebar g54-gradient" aria-label="Navegación de agencia">
        <PoppableBubbles bubbles={DOCK_BUBBLES} />

        {/* Un solo listado, sin ítems anclados aparte — antes
            Configuración/Salir vivían agrupados al pie, separados del
            resto; eso hacía que se vieran "pegados" al fondo en vez de
            fluir con todo lo demás. El logo/nombre de la agencia ya no
            vive acá — se movió a TopBrandBar, pegado a la esquina de
            arriba, sin el hueco que dejaba antes en esta barra. */}
        <div className="bubble54-sidebar-main">
          <Link to="/agencia" className="bubble54-navcol" onClick={(e) => handleClick("inicio", e)}>
            <span className="bubble54-navfloat" style={{ animationDelay: "-2.4s" }}>
              <span className={`bubble54-navbubble hueD ${isInicio ? "active" : ""}`}>
                <Icon name="home" className="icon" />
              </span>
            </span>
            <span className="bubble54-navlabel">Inicio</span>
          </Link>

          <Link to="/agencia/perfil" className="bubble54-navcol" onClick={(e) => handleClick("agencia", e)}>
            <span className="bubble54-navfloat" style={{ animationDelay: "-2.1s" }}>
              <span className={`bubble54-navbubble hueE ${isAgencia ? "active" : ""}`}>
                <Icon name="building" className="icon" />
              </span>
            </span>
            <span className="bubble54-navlabel">Agencia</span>
          </Link>

          <Link to="/agencia/negocios" className="bubble54-navcol" onClick={(e) => handleClick("negocios", e)}>
            <span className="bubble54-navfloat" style={{ animationDelay: "-0.6s" }}>
              <span className={`bubble54-navbubble ${isNegocios ? "active" : ""}`}>
                <Icon name="briefcase" className="icon" />
              </span>
            </span>
            <span className="bubble54-navlabel">Negocios</span>
          </Link>

          <Link to="/agencia/agentes" className="bubble54-navcol" onClick={(e) => handleClick("agentes", e)}>
            <span className="bubble54-navfloat" style={{ animationDelay: "-1.9s" }}>
              <span className={`bubble54-navbubble hueB ${isAgentes ? "active" : ""}`}>
                <Icon name="mic" className="icon" />
                {pausedCount > 0 && <span className="bubble54-notif">{pausedCount}</span>}
              </span>
            </span>
            <span className="bubble54-navlabel">Agentes</span>
          </Link>

          <Link to="/agencia/registros" className="bubble54-navcol" onClick={(e) => handleClick("registros", e)}>
            <span className="bubble54-navfloat" style={{ animationDelay: "-3.6s" }}>
              <span className={`bubble54-navbubble hueF ${isRegistros ? "active" : ""}`}>
                <Icon name="list" className="icon" />
              </span>
            </span>
            <span className="bubble54-navlabel">Registros</span>
          </Link>

          <Link to="/agencia/configuracion" className="bubble54-navcol" onClick={(e) => handleClick("config", e)}>
            <span className="bubble54-navfloat" style={{ animationDelay: "-3.1s" }}>
              <span className={`bubble54-navbubble hueC ${isConfig ? "active" : ""}`}>
                <Icon name="gear" className="icon" />
              </span>
            </span>
            <span className="bubble54-navlabel">Configuración</span>
          </Link>

          <button type="button" className="bubble54-navcol" onClick={(e) => handleClick("salir", e)}>
            <span className="bubble54-navfloat" style={{ animationDelay: "-0.2s" }}>
              <span className="bubble54-navbubble exit">
                <Icon name="logout" className="icon" />
              </span>
            </span>
            <span className="bubble54-navlabel">Salir</span>
          </button>
        </div>
      </nav>

      <div style={contentColStyle}>
        {/* flex:1 + overflowY propio, mismo criterio de siempre para que el
            contenido nunca quede tapado — acá ni hace falta el truco: al
            ser la barra un hermano de ancho fijo en una fila flex, nunca
            puede superponerse al contenido, se lo cede automáticamente. */}
        <main style={mainScrollStyle}>{children}</main>
      </div>
      </div>
    </div>
  );
}

const contentColStyle = {
  flex: "1 1 auto",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  // 100% (no 100vh) — ahora esta columna es hija de la fila que vive
  // debajo de TopBrandBar, no directa del viewport. Mismo motivo que el
  // fix de .bubble54-sidebar en theme.css.
  height: "100%",
};

const mainScrollStyle = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
};
