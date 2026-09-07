// Bug real: AgencyShell lee el nombre/logo de la agencia UNA sola vez al
// montar (independiente de lo que cada pantalla ya pida para sí misma, a
// propósito) — pero eso significa que si se sube/quita un logo o se
// renombra la agencia desde AgencyProfilePage sin recargar la página, la
// barra lateral se queda mostrando el valor viejo hasta el próximo login.
// Mismo patrón ya usado en prefs.js (window.dispatchEvent + addEventListener
// con un Event propio) para el mismo tipo de problema: dos componentes que
// no comparten estado de React pero sí necesitan enterarse el uno del otro.
export const AGENCY_PROFILE_EVENT = "vox54:agency-profile-changed";

export function notifyAgencyProfileChanged() {
  window.dispatchEvent(new Event(AGENCY_PROFILE_EVENT));
}
