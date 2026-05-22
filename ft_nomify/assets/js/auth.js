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

  // Inyectar botón Ajustes en el sidebar footer (antes del btn-logout)
  const footer = document.querySelector('.sidebar-footer');
  if (footer && !document.getElementById('btn-ajustes')) {
    const btnAjustes = document.createElement('button');
    btnAjustes.id = 'btn-ajustes';
    btnAjustes.className = 'btn-ajustes';
    btnAjustes.textContent = '⚙️ Ajustes';
    const btnLogout = footer.querySelector('#btn-logout');
    if (btnLogout) footer.insertBefore(btnAjustes, btnLogout);
    else footer.appendChild(btnAjustes);
  }

  // Inyectar modal de Ajustes (una sola vez en el body)
  if (!document.getElementById('modal-ajustes')) {
    document.body.insertAdjacentHTML('beforeend', `
<div class="overlay" id="modal-ajustes">
  <div class="modal" style="max-width:420px">
    <div class="modal-header">
      <h3>⚙️ Ajustes de perfil</h3>
      <button class="modal-close" id="close-ajustes">×</button>
    </div>
    <div class="modal-body">
      <div id="alert-ajustes" class="alert"></div>
      <div class="form-group" style="margin-bottom:14px">
        <label>Nombre</label>
        <input type="text" id="ajustes-nombre" placeholder="Tu nombre completo" style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:8px 12px;font-size:14px;box-sizing:border-box" />
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label>Correo electrónico</label>
        <input type="email" id="ajustes-email" disabled style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:6px;color:var(--text-muted);padding:8px 12px;font-size:14px;box-sizing:border-box;opacity:0.65;cursor:not-allowed" />
      </div>
      <div class="form-group" style="margin-bottom:14px">
        <label>Nueva contraseña</label>
        <input type="password" id="ajustes-password" placeholder="Dejar vacío para no cambiar" style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:8px 12px;font-size:14px;box-sizing:border-box" />
      </div>
      <div class="form-group" style="margin-bottom:8px">
        <label>Confirmar contraseña</label>
        <input type="password" id="ajustes-password2" placeholder="Repetir nueva contraseña" style="width:100%;background:var(--input);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:8px 12px;font-size:14px;box-sizing:border-box" />
      </div>
      <div id="ajustes-master-section" style="display:none;margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
        <a href="/usuarios.html" class="btn btn-ghost" style="width:100%;text-align:center;display:block">👤 Administrar usuarios</a>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="cancel-ajustes">Cancelar</button>
      <button class="btn btn-primary" id="save-ajustes">Guardar cambios</button>
    </div>
  </div>
</div>`);

    // Cerrar modal
    ['close-ajustes', 'cancel-ajustes'].forEach(id => {
      document.getElementById(id).addEventListener('click', () => {
        document.getElementById('modal-ajustes').classList.remove('open');
      });
    });

    // Guardar cambios
    document.getElementById('save-ajustes').addEventListener('click', async () => {
      const nombre = document.getElementById('ajustes-nombre').value.trim();
      const pass   = document.getElementById('ajustes-password').value;
      const pass2  = document.getElementById('ajustes-password2').value;

      if (pass && pass !== pass2) {
        showAlert('alert-ajustes', 'Las contraseñas no coinciden', 'error');
        return;
      }
      if (pass && pass.length < 6) {
        showAlert('alert-ajustes', 'La contraseña debe tener mínimo 6 caracteres', 'error');
        return;
      }

      const body = {};
      if (nombre) body.nombre = nombre;
      if (pass)   body.password = pass;
      if (!Object.keys(body).length) {
        showAlert('alert-ajustes', 'No hay cambios que guardar', 'error');
        return;
      }

      const btn = document.getElementById('save-ajustes');
      btn.disabled = true;
      btn.textContent = 'Guardando...';
      try {
        await apiFetch('/api/auth/perfil', { method: 'PATCH', body: JSON.stringify(body) });
        _myInfo = null; // limpiar caché
        if (nombre) {
          const stored = JSON.parse(localStorage.getItem('planilla_user') || '{}');
          stored.nombre = nombre;
          localStorage.setItem('planilla_user', JSON.stringify(stored));
        }
        document.getElementById('ajustes-password').value  = '';
        document.getElementById('ajustes-password2').value = '';
        showAlert('alert-ajustes', '✅ Cambios guardados correctamente', 'success');
      } catch (e) {
        showAlert('alert-ajustes', 'Error: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar cambios';
      }
    });
  }

  // Abrir modal al hacer clic en Ajustes
  document.getElementById('btn-ajustes')?.addEventListener('click', async () => {
    const myInfo = await getMyInfo();
    document.getElementById('ajustes-nombre').value      = myInfo.nombre || '';
    document.getElementById('ajustes-email').value       = myInfo.email  || '';
    document.getElementById('ajustes-password').value    = '';
    document.getElementById('ajustes-password2').value   = '';
    document.getElementById('alert-ajustes').className   = 'alert';
    const masterSection = document.getElementById('ajustes-master-section');
    if (masterSection) masterSection.style.display = myInfo.rol === 'Master' ? '' : 'none';
    document.getElementById('modal-ajustes').classList.add('open');
  });

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
    if (_myInfo.rol === 'Admin')      _myInfo.rol = 'Master';
    if (_myInfo.rol === 'Colaborador') _myInfo.rol = 'Planillero'; // migración
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
async function canEdit()  { const r = (await getMyInfo()).rol; return r === 'Master' || r === 'Planillero'; }

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
