// Netlify Identity auth helpers
const identity = window.netlifyIdentity;

let _myInfo = null; // cache del rol

function requireAuth() {
  identity.on('init', user => {
    if (!user) window.location.href = '/login.html';
  });
  identity.init();
}

// requireAuth + redirige empleados a su vista propia
function requireAuthRole(allowedRoles) {
  identity.on('init', async user => {
    if (!user) { window.location.href = '/login.html'; return; }
    const info = await getMyInfo();
    if (allowedRoles && !allowedRoles.includes(info.rol)) {
      window.location.href = '/mi-recibo.html';
    }
  });
  identity.init();
}

function initLayout() {
  const user = identity.currentUser();
  const el = document.getElementById('user-email');
  if (el && user) el.textContent = user.email;

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    _myInfo = null;
    identity.logout();
  });

  identity.on('logout', () => {
    window.location.href = '/login.html';
  });

  // Mostrar link de Configuraciones solo a Admin
  getMyInfo().then(info => {
    const link = document.getElementById('link-config');
    if (link && info.rol !== 'Admin') link.style.display = 'none';
  });
}

async function getToken() {
  const user = identity.currentUser();
  if (!user) return null;
  return user.jwt();
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la solicitud');
  }
  return res.json();
}

// Devuelve { email, rol, nombre } del usuario actual (con caché)
async function getMyInfo() {
  if (_myInfo) return _myInfo;
  try {
    _myInfo = await apiFetch('/.netlify/functions/me');
  } catch (_) {
    _myInfo = { rol: 'Admin', nombre: null };
  }
  return _myInfo;
}

// true si el usuario tiene rol Admin
async function isAdmin() { return (await getMyInfo()).rol === 'Admin'; }
// true si Admin o Planillero
async function canEdit() { const r = (await getMyInfo()).rol; return r === 'Admin' || r === 'Planillero'; }

function fmt(n) {
  return 'C$ ' + Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showAlert(id, msg, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 3500);
}

window.AppAuth = { requireAuth, requireAuthRole, initLayout, getToken, apiFetch, getMyInfo, isAdmin, canEdit, fmt, showAlert };
