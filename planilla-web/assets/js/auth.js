// Netlify Identity auth helpers
const identity = window.netlifyIdentity;

function requireAuth() {
  identity.on('init', user => {
    if (!user) window.location.href = '/login.html';
  });
  identity.init();
}

function initLayout() {
  const user = identity.currentUser();
  const el = document.getElementById('user-email');
  if (el && user) el.textContent = user.email;

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    identity.logout();
  });

  identity.on('logout', () => {
    window.location.href = '/login.html';
  });
}

// Get JWT token for API calls
async function getToken() {
  const user = identity.currentUser();
  if (!user) return null;
  const jwt = await user.jwt();
  return jwt;
}

// Fetch wrapper that adds auth header
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

// Format currency C$
function fmt(n) {
  return 'C$ ' + Number(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Show/hide alert
function showAlert(id, msg, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 3500);
}

window.AppAuth = { requireAuth, initLayout, getToken, apiFetch, fmt, showAlert };
