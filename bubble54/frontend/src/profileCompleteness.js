// Cuánto del perfil real de un negocio ya está cargado -- compartido entre
// BusinessProfileForm (donde se edita, agencia o negocio) y BusinessHome (el
// checklist de "Primeros pasos" del negocio). Nunca cuenta el logo ni el
// documento PDF -- son opcionales de verdad, a diferencia de estos 10 campos
// de texto que el bot usa como contexto real para responder llamadas.
export const PROFILE_FIELDS = [
  { key: "description", label: "resumen del negocio" },
  { key: "hours", label: "horario de atención" },
  { key: "address", label: "dirección" },
  { key: "city", label: "ciudad" },
  { key: "timezone", label: "zona horaria" },
  { key: "website", label: "sitio web" },
  { key: "contact_email", label: "correo de contacto" },
  { key: "industry", label: "rubro" },
  { key: "value_proposition", label: "propuesta de valor" },
  { key: "products_services", label: "productos y servicios" },
];

export function profileCompleteness(profile) {
  const missing = PROFILE_FIELDS.filter((f) => !String(profile?.[f.key] || "").trim());
  const done = PROFILE_FIELDS.length - missing.length;
  return {
    percent: Math.round((done / PROFILE_FIELDS.length) * 100),
    done,
    total: PROFILE_FIELDS.length,
    missing: missing.map((f) => f.label),
  };
}
