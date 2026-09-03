// Set propio de íconos de línea — reemplaza el emoji crudo que se usaba en
// el menú (🏛️/🏢/🎙️/📋/⚙️/🚪/📞/🏷️/👤). El problema real del emoji no era
// solo estético: es un glifo a todo color que el navegador dibuja tal cual,
// sin ninguna forma de controlar su contraste ni su color desde CSS — por
// eso "dale más contraste" no se podía resolver sin cambiarlos. Un ícono de
// trazo (stroke, sin relleno) con `currentColor` sí responde a `color` real,
// así que cada burbuja del menú puede pintarlo con su propio tono (o blanco
// cuando está activa) en vez de depender de cómo el sistema operativo
// decida renderizar el emoji.
const PATHS = {
  home: (
    <path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
  ),
  building: (
    <>
      <path d="M6 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16" />
      <path d="M3 21h18" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3M9 21h6" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="3" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.7 6.3l-1.7 1.7M8 16l-1.7 1.7M17.7 17.7 16 16M8 8 6.3 6.3" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  phone: (
    <path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3a1.5 1.5 0 0 1-1.6 1.5A17 17 0 0 1 5 5.6 1.5 1.5 0 0 1 6.5 3Z" />
  ),
  tag: (
    <>
      <path d="M12.5 3.5 20 11l-8.5 8.5a2 2 0 0 1-2.8 0L4 14.8a2 2 0 0 1 0-2.8L12.5 3.5Z" />
      <path d="M12.5 3.5H19a1 1 0 0 1 1 1v6.5" />
      <circle cx="16" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
};

export default function Icon({ name, size = 22, className, style }) {
  const body = PATHS[name];
  if (!body) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {body}
    </svg>
  );
}
