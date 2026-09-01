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
