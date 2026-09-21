import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "./api";

/**
 * Se prueba a través de api.agencyLogin (no se exporta `request` directo)
 * para ejercitar exactamente el mismo camino que usa la app real — mockeando
 * fetch global, sin ninguna llamada de red real.
 */
function mockFetch(status, body) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("manejo de errores del backend", () => {
  it("un 200 real devuelve el body tal cual, sin tocar nada", async () => {
    mockFetch(200, { access_token: "abc", role: "agency", name: "Admin" });
    const result = await api.agencyLogin("a@b.com", "pass");
    expect(result.access_token).toBe("abc");
  });

  it("saca el prefijo 'Value error, ' que antepone Pydantic a los mensajes de nuestros validadores propios (bug real encontrado el 2026-08-29)", async () => {
    mockFetch(422, {
      detail: [{ msg: "Value error, la contraseña debe tener al menos 8 caracteres" }],
    });
    await expect(api.agencyLogin("a@b.com", "corta")).rejects.toThrow(
      "la contraseña debe tener al menos 8 caracteres"
    );
  });

  it("no toca un mensaje de Pydantic que nunca tuvo el prefijo (ej. formato de email)", async () => {
    mockFetch(422, { detail: [{ msg: "value is not a valid email address" }] });
    await expect(api.agencyLogin("a@b.com", "x")).rejects.toThrow("value is not a valid email address");
  });

  it("une con ' · ' los errores de negocio propios (validators.py, forma {errors:[...]})", async () => {
    mockFetch(422, { detail: { errors: ["error uno", "error dos"] } });
    await expect(api.agencyLogin("a@b.com", "x")).rejects.toThrow("error uno · error dos");
  });

  it("muestra un detail que es un string plano tal cual (ej. 401 de login)", async () => {
    mockFetch(401, { detail: "Email o contraseña incorrectos" });
    await expect(api.agencyLogin("a@b.com", "x")).rejects.toThrow("Email o contraseña incorrectos");
  });

  it("con un body de error irreconocible, cae a un mensaje genérico en vez de mostrar [object Object]", async () => {
    mockFetch(500, { algo_inesperado: true });
    await expect(api.agencyLogin("a@b.com", "x")).rejects.toThrow("Ocurrió un error inesperado.");
  });

  it("con un body vacío/no-JSON, también cae al mensaje genérico sin explotar", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("no es JSON")),
    });
    await expect(api.agencyLogin("a@b.com", "x")).rejects.toThrow("Ocurrió un error inesperado.");
  });
});

describe("armado de requests", () => {
  it("manda el header Authorization solo cuando se pasa un token", async () => {
    mockFetch(200, { ok: true });
    await api.agencyMe("mi-token-real");
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer mi-token-real");
  });

  it("getCatalog no manda Authorization (endpoint público, sin token)", async () => {
    mockFetch(200, { ai_providers: [] });
    await api.getCatalog();
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });
});

describe("sesión inválida (401 con token) -- bug real del 2026-09-18, la persona se quedaba viendo el error crudo en pantalla en vez de que la mandaran al login", () => {
  let originalLocation;

  beforeEach(() => {
    localStorage.clear();
    originalLocation = window.location;
    delete window.location;
    window.location = { href: "" };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("agencia: limpia bubble54_session y manda a /agencia/login", async () => {
    localStorage.setItem("bubble54_session", JSON.stringify({ access_token: "viejo", role: "agency", name: "Admin" }));
    mockFetch(401, { detail: "Token inválido o expirado" });

    await expect(api.agencyMe("token-viejo")).rejects.toThrow("Token inválido o expirado");

    expect(localStorage.getItem("bubble54_session")).toBeNull();
    expect(window.location.href).toBe("/agencia/login");
  });

  it("negocio: usa el role guardado para mandar a /negocio/login en vez de al de agencia", async () => {
    localStorage.setItem("bubble54_session", JSON.stringify({ access_token: "viejo", role: "business", name: "Un Negocio" }));
    mockFetch(401, { detail: "Token inválido o expirado" });

    await expect(api.businessMe("token-viejo")).rejects.toThrow("Token inválido o expirado");

    expect(window.location.href).toBe("/negocio/login");
  });

  it("sin ninguna sesión guardada en localStorage (caso raro pero posible), cae al login de agencia por default sin explotar", async () => {
    mockFetch(401, { detail: "Token inválido o expirado" });
    await expect(api.agencyMe("token-viejo")).rejects.toThrow();
    expect(window.location.href).toBe("/agencia/login");
  });

  it("un 401 de LOGIN (sin token todavía) es un error de credenciales, no de sesión -- nunca dispara el redirect", async () => {
    localStorage.setItem("bubble54_session", JSON.stringify({ access_token: "algo", role: "agency" }));
    mockFetch(401, { detail: "Email o contraseña incorrectos" });

    await expect(api.agencyLogin("a@b.com", "mal")).rejects.toThrow("Email o contraseña incorrectos");

    // ni se toca la sesión que hubiera (no debería haber, pero por las dudas) ni se redirige
    expect(window.location.href).toBe("");
    expect(localStorage.getItem("bubble54_session")).not.toBeNull();
  });

  it("un 401 con token en una subida de archivo (requestUpload) también dispara el redirect", async () => {
    localStorage.setItem("bubble54_session", JSON.stringify({ access_token: "viejo", role: "agency" }));
    mockFetch(401, { detail: "Token inválido o expirado" });
    const file = new File(["contenido"], "logo.png", { type: "image/png" });

    await expect(api.uploadAgencyLogo("token-viejo", file)).rejects.toThrow();

    expect(window.location.href).toBe("/agencia/login");
  });
});
