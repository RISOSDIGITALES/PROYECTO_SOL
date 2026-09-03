// En dev, sin ningún .env, cae al backend local de siempre. Al desplegar
// de verdad, VITE_API_BASE debe apuntar al dominio real del backend —
// dejarlo en localhost rompería todo el panel fuera de esta máquina.
// Exportado porque logo_url/info_document_url que devuelve el backend son
// rutas relativas (/uploads/...) — hay que anteponerles esto para armar
// una URL real, o el navegador las resuelve contra el origen del frontend.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function toResult(res) {
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

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return toResult(res);
}

// Subida real de archivo (logo, documento) — FormData en vez de JSON, sin
// fijar Content-Type a mano: el navegador arma el boundary real del
// multipart solo, fijarlo nosotros lo rompe.
async function requestUpload(path, { method = "POST", file, token }) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: form });
  return toResult(res);
}

export const api = {
  agencyLogin: (email, password) =>
    request("/auth/agency/login", { method: "POST", body: { email, password } }),
  businessLogin: (email, password) =>
    request("/auth/business/login", { method: "POST", body: { email, password } }),
  agencyMe: (token) => request("/agency/me", { token }),
  businessMe: (token) => request("/business/me", { token }),
  changeAgencyPassword: (token, body) => request("/agency/me/password", { method: "PUT", body, token }),
  changeBusinessPassword: (token, body) => request("/business/me/password", { method: "PUT", body, token }),
  listBusinesses: (token) => request("/agency/businesses", { token }),
  listAgents: (token) => request("/agency/agents", { token }),
  createBusiness: (token, body) => request("/agency/businesses", { method: "POST", body, token }),
  getBusinessDetail: (token, id) => request(`/agency/businesses/${id}`, { token }),
  renameBusiness: (token, id, name) =>
    request(`/agency/businesses/${id}`, { method: "PATCH", body: { name }, token }),
  updateBusinessBotConfig: (token, id, body) =>
    request(`/agency/businesses/${id}/bot-config`, { method: "PUT", body, token }),
  getBotConfig: (token) => request("/business/bot-config", { token }),
  updateBotConfig: (token, body) => request("/business/bot-config", { method: "PUT", body, token }),
  listCalls: (token) => request("/business/calls", { token }),
  listBusinessCalls: (token, id) => request(`/agency/businesses/${id}/calls`, { token }),
  getCatalog: () => request("/catalog"),

  // --- Perfil de la agencia ---
  getAgencyProfile: (token) => request("/agency/profile", { token }),
  updateAgencyProfile: (token, body) => request("/agency/profile", { method: "PUT", body, token }),
  uploadAgencyLogo: (token, file) => requestUpload("/agency/profile/logo", { file, token }),
  removeAgencyLogo: (token) => request("/agency/profile/logo", { method: "DELETE", token }),

  // --- Perfil de un negocio (lo que el bot necesita saber: resumen,
  // horarios, productos — separado a propósito de bot-config, que es
  // infraestructura) ---
  getBusinessProfile: (token, id) => request(`/agency/businesses/${id}/profile`, { token }),
  updateBusinessProfile: (token, id, body) =>
    request(`/agency/businesses/${id}/profile`, { method: "PUT", body, token }),
  getMyProfile: (token) => request("/business/profile", { token }),
  updateMyProfile: (token, body) => request("/business/profile", { method: "PUT", body, token }),

  // --- Logo + documento de información de un negocio — subido por la
  // agencia (sobre cualquier negocio suyo) o por el propio negocio (sobre
  // sí mismo). Dos pares de endpoints reales del lado del backend (el
  // scope/autorización es distinto), unificados acá por un flag `asAgency`
  // para que BusinessProfileForm no tenga que saber la ruta exacta. ---
  uploadBusinessLogo: (token, id, file, asAgency) =>
    requestUpload(asAgency ? `/agency/businesses/${id}/logo` : "/business/profile/logo", { file, token }),
  removeBusinessLogo: (token, id, asAgency) =>
    request(asAgency ? `/agency/businesses/${id}/logo` : "/business/profile/logo", { method: "DELETE", token }),
  uploadBusinessDocument: (token, id, file, asAgency) =>
    requestUpload(asAgency ? `/agency/businesses/${id}/info-document` : "/business/profile/info-document", { file, token }),
  removeBusinessDocument: (token, id, asAgency) =>
    request(asAgency ? `/agency/businesses/${id}/info-document` : "/business/profile/info-document", { method: "DELETE", token }),

  // --- Registros: historial de llamadas de toda la agencia ---
  listAgencyCalls: (token, businessId) =>
    request(businessId ? `/agency/calls?business_id=${businessId}` : "/agency/calls", { token }),
  getAgencyCall: (token, callId) => request(`/agency/calls/${callId}`, { token }),
};
