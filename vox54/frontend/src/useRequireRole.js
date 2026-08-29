import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const LOGIN_PATH = { agency: "/agencia/login", business: "/negocio/login" };
const HOME_PATH = { agency: "/agencia", business: "/negocio" };

/**
 * Exige que la sesión activa sea del rol indicado antes de renderizar la
 * pantalla. Sin sesión → al login de ese rol. Con sesión de OTRO rol → al
 * panel real de ese rol (ya está autenticado, solo entró al panel
 * equivocado — no tiene sentido mandarlo a loguearse de nuevo).
 */
export function useRequireRole(role) {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate(LOGIN_PATH[role]);
    } else if (session.role !== role) {
      navigate(HOME_PATH[session.role]);
    }
  }, [session, role]);

  return session && session.role === role ? session : null;
}
