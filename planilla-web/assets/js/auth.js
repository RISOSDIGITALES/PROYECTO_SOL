// ─── Auth helpers — Nomify ────────────────────────────────────────────────

let _myInfo = null;

function getToken() {
  return localStorage.getItem('planilla_token');
}

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
  }
}

function initLayout() {
  const info = JSON.parse(localStorage.getItem('planilla_user') || '{}');
  const el = document.getElementById('user-email');
  if (el) el.textContent = info.nombre || info.email || '';

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    _myInfo = null;
    localStorage.removeItem('planilla_token');
    localStorage.removeItem('planilla_user');
    window.location.href = '/login.html';
  });

  // Ocultar enlace de usuarios para Colaborador
  getMyInfo().then(info => {
    const linkUsuarios = document.getElementById('link-usuarios');
    if (linkUsuarios && info.rol !== 'Master') linkUsuarios.style.display = 'none';

    // Ocultar botón generar planilla para Colaborador (opcional, server igual filtra)
    const btnGenerar = document.getElementById('btn-generar');
    if (btnGenerar && info.rol !== 'Master') btnGenerar.style.display = 'none';
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

async function isMaster() { return (await getMyInfo()).rol === 'Master'; }

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
