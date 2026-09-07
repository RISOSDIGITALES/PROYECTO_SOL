import { useEffect, useState } from "react";
import { api } from "./api";

// Mismo criterio que ya usa el checklist de "Primeros pasos" en Inicio --
// "perfil completo" significa que la agencia cargó al menos un dato real
// de contacto o su logo, no que esté absolutamente todo lleno. Compartido
// acá para no duplicar la misma condición en cada lugar que ahora también
// la necesita (el gate real antes de poder crear un negocio nuevo).
export function useAgencyProfileDone(token) {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!token) return;
    api.getAgencyProfile(token).then(setProfile).catch(() => {});
  }, [token]);
  const loading = profile === null;
  const done = !loading && !!(profile.contact_email || profile.contact_phone || profile.logo_url);
  return { done, loading };
}
