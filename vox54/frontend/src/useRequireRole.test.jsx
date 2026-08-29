import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { useRequireRole } from "./useRequireRole";

/**
 * Prueba de comportamiento real, no de implementación — monta el hook
 * dentro de un Router real y confirma A DÓNDE termina navegando, en vez
 * de mockear react-router-dom. Es el mismo mecanismo que dejó atascada
 * la pantalla al visitar el rol equivocado (bug real corregido el
 * 2026-08-27) — este test existe para que no vuelva a pasar en silencio.
 */
function Probe({ role }) {
  const session = useRequireRole(role);
  const location = useLocation();
  return (
    <div data-testid="probe" data-path={location.pathname}>
      {session ? "con-sesion" : "sin-sesion"}
    </div>
  );
}

function renderProbe(role, initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="*" element={<Probe role={role} />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

function seedSession(role) {
  localStorage.setItem("vox54_session", JSON.stringify({ access_token: "fake", role, name: "Test" }));
}

beforeEach(() => {
  localStorage.clear();
});

describe("useRequireRole", () => {
  it("sin ninguna sesión guardada, redirige al login del rol pedido", () => {
    renderProbe("agency", "/agencia");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-path", "/agencia/login");
    expect(screen.getByTestId("probe")).toHaveTextContent("sin-sesion");
  });

  it("con sesión del rol correcto, se queda donde está y devuelve la sesión", () => {
    seedSession("agency");
    renderProbe("agency", "/agencia");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-path", "/agencia");
    expect(screen.getByTestId("probe")).toHaveTextContent("con-sesion");
  });

  it("con sesión de NEGOCIO visitando una ruta de AGENCIA, redirige a /negocio (no se queda cargando)", () => {
    seedSession("business");
    renderProbe("agency", "/agencia");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-path", "/negocio");
  });

  it("con sesión de AGENCIA visitando una ruta de NEGOCIO, redirige a /agencia", () => {
    seedSession("agency");
    renderProbe("business", "/negocio");
    expect(screen.getByTestId("probe")).toHaveAttribute("data-path", "/agencia");
  });
});
