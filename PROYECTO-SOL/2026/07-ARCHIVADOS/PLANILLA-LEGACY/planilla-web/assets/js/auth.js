<<<<<<< HEAD
// ─── Auth helpers — Nomify ────────────────────────────────────────────
=======
// Polyfill para páginas que usan netlifyIdentity directamente
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
>>>>>>> origin/claude/check-claude-md-file-EC9xe

let _myInfo = null;

function getToken() {
  return localStorage.getItem('planilla_token');
}

<<<<<<< HEAD
// onReady(roles, fn) — verifica auth y rol, luego llama fn()
// Si roles es null acepta cualquier rol autenticado.
async function onReady(roles, fn) {
  if (!getToken()) { window.location.href = '/login.html'; return; }
  try {
    const info = await getMyInfo();
    if (roles && !roles.includes(info.rol)) {
      window.location.href = '/login.html';
      return;
    }
    fn(info);
  } catch (_) {
    window.location.href = '/login.html';
=======
function requireAuth() {
  if (!getToken()) { window.location.href = '/login.html'; return; }
}

async function requireAuthRole(allowedRoles) {
  if (!getToken()) { window.location.href = '/login.html'; return; }
  const info = await getMyInfo();
  if (allowedRoles && !allowedRoles.includes(info.rol)) {
    window.location.href = '/mi-recibo.html';
>>>>>>> origin/claude/check-claude-md-file-EC9xe
  }
}

function initLayout() {
  const info = JSON.parse(localStorage.getItem('planilla_user') || '{}');
  const el = document.getElementById('user-email');
<<<<<<< HEAD
  if (el) el.textContent = info.nombre || info.email || '';
=======
  if (el) el.textContent = info.email || '';
>>>>>>> origin/claude/check-claude-md-file-EC9xe

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    _myInfo = null;
    localStorage.removeItem('planilla_token');
    localStorage.removeItem('planilla_user');
    window.location.href = '/login.html';
  });

<<<<<<< HEAD
  // Ocultar enlace de usuarios para Colaborador
  getMyInfo().then(info => {
    const linkUsuarios = document.getElementById('link-usuarios');
    if (linkUsuarios && info.rol !== 'Master') linkUsuarios.style.display = 'none';

    // Ocultar botón generar planilla para Colaborador (opcional, server igual filtra)
    const btnGenerar = document.getElementById('btn-generar');
    if (btnGenerar && info.rol !== 'Master') btnGenerar.style.display = 'none';
=======
  getMyInfo().then(info => {
    const link = document.getElementById('link-config');
    if (link && info.rol !== 'Admin') link.style.display = 'none';
>>>>>>> origin/claude/check-claude-md-file-EC9xe
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
    throw new Error('Sesión expirada');
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
  } catch (_) {
    _myInfo = { rol: 'Colaborador', nombre: null };
  }
  return _myInfo;
}

<<<<<<< HEAD
async function isMaster() { return (await getMyInfo()).rol === 'Master'; }
=======
async function isAdmin() { return (await getMyInfo()).rol === 'Admin'; }
async function canEdit() { const r = (await getMyInfo()).rol; return r === 'Admin' || r === 'Planillero'; }
>>>>>>> origin/claude/check-claude-md-file-EC9xe

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

window.AppAuth = { onReady, initLayout, getToken, apiFetch, getMyInfo, isMaster, fmt, showAlert };
