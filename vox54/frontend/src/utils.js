// Iniciales para el avatar circular — mismo criterio en toda la plataforma
// (agencia y negocio), así que vive en un solo lugar en vez de repetirse.
export function initials(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Nombre de pila para un saludo — "Hola, María" en vez de "Hola, María
// González Pérez", más personal y más corto. Primero intenta el nombre real
// (`me.name`, lo que un usuario real escribe al darse de alta); si por algún
// motivo no está, cae a extraer algo legible del correo (antes de la @,
// separadores comunes tipo punto/guion limpiados, número final descartado)
// en vez de mostrar un saludo vacío o el correo entero. Nunca inventa un
// nombre que no esté en ninguno de los dos datos reales.
export function firstName(person) {
  const fromName = (person?.name || "").trim().split(/\s+/)[0];
  if (fromName) return fromName;

  const local = (person?.email || "").split("@")[0];
  const cleaned = local.replace(/[._-]+/g, " ").replace(/\d+$/, "").trim();
  const fromEmail = cleaned.split(/\s+/)[0];
  if (fromEmail) return fromEmail.charAt(0).toUpperCase() + fromEmail.slice(1).toLowerCase();

  return "";
}
