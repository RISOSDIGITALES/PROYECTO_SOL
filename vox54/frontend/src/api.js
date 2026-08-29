const API_BASE = "http://localhost:8000";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let message = "Ocurrió un error inesperado.";
    if (Array.isArray(data.detail)) {
      // errores de validación de Pydantic (422 nativo) — cuando el validador
      // propio lanza un ValueError con nuestro texto, Pydantic le antepone
      // "Value error, " automáticamente; se saca para que se vea limpio.
      message = data.detail.map((d) => (d.msg || "").replace(/^Value error,\s*/i, "")).join(", ");
    } else if (data.detail && Array.isArray(data.detail.errors)) {
      // nuestra validación custom de negocio (validators.py): {"errors": [...]}
      message = data.detail.errors.join(" · ");
    } else if (typeof data.detail === "string") {
      message = data.detail;
    }
    throw new Error(message);
  }
  return data;
}

export const api = {
  agencyLogin: (email, password) =>
    request("/auth/agency/login", { method: "POST", body: { email, password } }),
  businessLogin: (email, password) =>
    request("/auth/business/login", { method: "POST", body: { email, password } }),
  agencyMe: (token) => request("/agency/me", { token }),
  businessMe: (token) => request("/business/me", { token }),
  listBusinesses: (token) => request("/agency/businesses", { token }),
  createBusiness: (token, body) => request("/agency/businesses", { method: "POST", body, token }),
  getBusinessDetail: (token, id) => request(`/agency/businesses/${id}`, { token }),
  updateBusinessBotConfig: (token, id, body) =>
    request(`/agency/businesses/${id}/bot-config`, { method: "PUT", body, token }),
  getBotConfig: (token) => request("/business/bot-config", { token }),
  updateBotConfig: (token, body) => request("/business/bot-config", { method: "PUT", body, token }),
  getCatalog: () => request("/catalog"),
};
