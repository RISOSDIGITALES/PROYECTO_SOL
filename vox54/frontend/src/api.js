// En dev, sin ningún .env, cae al backend local de siempre. Al desplegar
// de verdad, VITE_API_BASE debe apuntar al dominio real del backend —
// dejarlo en localhost rompería todo el panel fuera de esta máquina.
// Exportado porque logo_url/info_document_url que devuelve el backend son
// rutas relativas (/uploads/...) — hay que anteponerles esto para armar
// una URL real, o el navegador las resuelve contra el origen del frontend.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

// Compartida por toResult (fetch) y requestUploadWithProgress (XHR, que no
// tiene un objeto Response real) -- mismo criterio de extracción de mensaje
// para los dos, sin duplicarlo.
function resolveResult(data, ok) {
  if (!ok) {
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

async function toResult(res) {
  const data = await res.json().catch(() => ({}));
  return resolveResult(data, res.ok);
}

// Un 401 en una llamada que YA llevaba un token (una sesión que dejó de
// servir -- secreto rotado del lado del servidor, backend reiniciado con
// otra base, o una expiración real) se mostraba como el mensaje crudo del
// backend ("Token inválido o expirado") en cualquier pantalla, sin sacar a
// nadie de ahí -- encontrado en vivo el 2026-09-18. Un 401 de LOGIN (sin
// token todavía, ej. contraseña mal) nunca debe disparar esto -- ahí el
// error real es que las credenciales están mal, no que la sesión expiró.
function bounceToLoginIfSessionInvalid(status, token) {
  if (status !== 401 || !token) return;
  let role = null;
  try {
    const raw = localStorage.getItem("vox54_session");
    role = raw ? JSON.parse(raw).role : null;
  } catch {
    // localStorage bloqueado/corrupto -- seguir igual al destino default de abajo
  }
  localStorage.removeItem("vox54_session");
  window.location.href = role === "business" ? "/negocio/login" : "/agencia/login";
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  bounceToLoginIfSessionInvalid(res.status, token);
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
  bounceToLoginIfSessionInvalid(res.status, token);
  return toResult(res);
}

// Misma subida que requestUpload, pero con progreso real de bytes
// transferidos (onProgress, 0-100) -- fetch no expone esto de forma nativa
// para el body de salida, así que acá sí hace falta XMLHttpRequest. Pensado
// para el documento de información (hasta 15MB, puede tardar en subirse en
// una conexión lenta), no para el logo (3MB, casi instantáneo siempre).
//
// Importante -- lo que tarda de verdad en el documento no es la subida en
// sí (unos pocos MB, rápido incluso en 3G) sino el PROCESAMIENTO real del
// lado del servidor después de recibirlo (extraer el texto del PDF y
// calcular un embedding real por fragmento, ver app/documents.py) --
// confirmado en vivo que puede tardar 10-15s. onProgress solo cubre la fase
// de transferencia; quien llama debe mostrar un estado de "procesando"
// aparte una vez que onProgress llega a 100 pero la promesa todavía no
// resolvió -- no hay forma de medir un % real de esa segunda fase sin que
// el servidor reporte su propio progreso, algo desproporcionado para un
// documento por negocio.
function requestUploadWithProgress(path, { file, token, onProgress }) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}${path}`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.addEventListener("load", () => {
      bounceToLoginIfSessionInvalid(xhr.status, token);
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* respuesta vacía o no-JSON */ }
      try {
        resolve(resolveResult(data, xhr.status >= 200 && xhr.status < 300));
      } catch (err) {
        reject(err);
      }
    });
    xhr.addEventListener("error", () => reject(new Error("No se pudo conectar con el servidor.")));

    xhr.send(form);
  });
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
  // Plan comercial hipotético (2026-09-19) -- ver catalog.PLANS. getBusinessUsage
  // suma minutos reales del mes en curso, nunca un número estimado.
  updateBusinessPlan: (token, id, planId) =>
    request(`/agency/businesses/${id}/plan`, { method: "PUT", body: { plan_id: planId }, token }),
  getBusinessUsage: (token, id) => request(`/agency/businesses/${id}/usage`, { token }),
  // Aprovisiona un numero real (Twilio, del lado de la plataforma -- nunca
  // una cuenta del cliente) y lo conecta solo. `mode`: "new" (el negocio lo
  // publica como propio) | "forward" (sigue con el suyo de siempre y lo
  // desvia hacia este) -- mismo camino real en los dos casos, ver
  // telephony.py en el backend.
  activateBusinessPhone: (token, id, mode) =>
    request(`/agency/businesses/${id}/phone/activate`, { method: "POST", body: { mode }, token }),
  getBotConfig: (token) => request("/business/bot-config", { token }),
  updateBotConfig: (token, body) => request("/business/bot-config", { method: "PUT", body, token }),
  activateMyPhone: (token, mode) =>
    request("/business/phone/activate", { method: "POST", body: { mode }, token }),
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
  uploadBusinessDocument: (token, id, file, asAgency, onProgress) =>
    requestUploadWithProgress(asAgency ? `/agency/businesses/${id}/info-document` : "/business/profile/info-document", { file, token, onProgress }),
  removeBusinessDocument: (token, id, asAgency) =>
    request(asAgency ? `/agency/businesses/${id}/info-document` : "/business/profile/info-document", { method: "DELETE", token }),
  acceptDocumentSuggestion: (token, id, suggestion, asAgency) =>
    request(asAgency ? `/agency/businesses/${id}/document-suggestions/accept` : "/business/profile/document-suggestions/accept", { method: "POST", body: { suggestion }, token }),
  dismissDocumentSuggestion: (token, id, suggestion, asAgency) =>
    request(asAgency ? `/agency/businesses/${id}/document-suggestions/dismiss` : "/business/profile/document-suggestions/dismiss", { method: "POST", body: { suggestion }, token }),

  // --- Registros: historial de llamadas de toda la agencia ---
  listAgencyCalls: (token, businessId) =>
    request(businessId ? `/agency/calls?business_id=${businessId}` : "/agency/calls", { token }),
  getAgencyCall: (token, callId) => request(`/agency/calls/${callId}`, { token }),
};
