// Polyfill para paginas que usan netlifyIdentity directamente
window.netlifyIdentity = {
  currentUser: () => localStorage.getItem('planilla_token')
    ? JSON.parse(localStorage.getItem('planilla_user') || '{}')
    : null,
  on: (event, cb) => {
    if (event === 'init' || event === 'login') {
      setTimeout(() => cb(window.netlifyIdentity.currentUser()), 0);
    }
    if (event === 'logout') {
      window._niLogoutCb = cb;
    }
  },
  logout: () => {
    localStorage.removeItem('planilla_token');
    localStorage.removeItem('planilla_user');
    if (window._niLogoutCb) window._niLogoutCb();
    window.location.href = '/login.html';
  },
  init: () => {},
  open: () => { window.location.href = '/login.html'; },
};

let _myInfo = null;

function getToken() {
  return localStorage.getItem('planilla_token');
}

function requireAuth() {
  if (!getToken()) { window.location.href = '/login.html'; return; }
}

async function requireAuthRole(allowedRoles) {
  if (!getToken()) { window.location.href = '/login.html'; return; }
  const info = await getMyInfo();
  if (allowedRoles && !allowedRoles.includes(info.rol)) {
    window.location.href = '/mi-recibo.html';
  }
}

function initLayout() {
  const info = JSON.parse(localStorage.getItem('planilla_user') || '{}');
  const el = document.getElementById('user-email');
  if (el) el.textContent = info.email || '';

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    _myInfo = null;
    localStorage.removeItem('planilla_token');
    localStorage.removeItem('planilla_user');
    window.location.href = '/login.html';
  });

  getMyInfo().then(info => {
    const link = document.getElementById('link-usuarios');
    if (link && info.rol !== 'Master') link.style.display = 'none';
  });
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('planilla_token');
    localStorage.removeItem('planilla_user');
    window.location.href = '/login.html';
    throw new Error('Sesion expirada');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la solicitud');
  }
  return res.json();
}

async function getMyInfo() {
  if (_myInfo) return _myInfo;
  try {
    _myInfo = await apiFetch('/api/auth/me');
    if (_myInfo.rol === 'Admin') _myInfo.rol = 'Master';
  } catch (e) {
    localStorage.removeItem('planilla_token');
    localStorage.removeItem('planilla_user');
    window.location.href = '/login.html';
    throw e;
  }
  return _myInfo;
}

async function onReady(allowedRoles, fn) {
  if (!getToken()) { window.location.href = '/login.html'; return; }
  if (allowedRoles) {
    const info = await getMyInfo();
    if (!allowedRoles.includes(info.rol)) {
      window.location.href = '/mi-recibo.html';
      return;
    }
  }
  fn();
}

async function isMaster() { return (await getMyInfo()).rol === 'Master'; }
async function isAdmin()  { return (await getMyInfo()).rol === 'Master'; }
async function canEdit()  { const r = (await getMyInfo()).rol; return r === 'Master' || r === 'Colaborador'; }

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

window.AppAuth = { onReady, requireAuth, requireAuthRole, initLayout, getToken, apiFetch, getMyInfo, isMaster, isAdmin, canEdit, fmt, showAlert };
