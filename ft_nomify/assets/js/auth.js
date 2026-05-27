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

  // Inyectar botón Ajustes + menú desplegable en el sidebar footer
  const footer = document.querySelector('.sidebar-footer');
  if (footer && !document.getElementById('btn-ajustes')) {
    // Menú popup (aparece hacia arriba)
    const menu = document.createElement('div');
    menu.id = 'ajustes-menu';
    menu.style.cssText = `
      display:none;position:absolute;bottom:calc(100% + 6px);left:0;right:0;
      background:var(--navy, #1e2a3a);border:1px solid var(--border);
      border-radius:8px;overflow:hidden;box-shadow:0 -4px 16px rgba(0,0,0,.35);z-index:200`;
    menu.innerHTML = `
      <button id="menu-ajustes-perfil" style="width:100%;background:none;border:none;color:var(--text);padding:11px 16px;text-align:left;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:10px">
        👤 Mi perfil
      </button>`;
    // Hover effect vía JS (sin depender de CSS externo)
    menu.querySelector('#menu-ajustes-perfil').addEventListener('mouseenter', function(){ this.style.background='var(--hover, rgba(255,255,255,.07))'; });
    menu.querySelector('#menu-ajustes-perfil').addEventListener('mouseleave', function(){ this.style.background='none'; });

    const btnAjustes = document.createElement('button');
    btnAjustes.id = 'btn-ajustes';
    btnAjustes.className = 'btn-ajustes';
    btnAjustes.textContent = '⚙️ Ajustes';

    // Wrapper con position:relative para anclar el menú
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative';
    wrap.appendChild(menu);
    wrap.appendChild(btnAjustes);

    const btnLogout = footer.querySelector('#btn-logout');
    if (btnLogout) footer.insertBefore(wrap, btnLogout);
    else footer.appendChild(wrap);

    // Toggle menú al hacer clic en Ajustes
    btnAjustes.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display !== 'none';
      menu.style.display = isOpen ? 'none' : 'block';
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', () => { menu.style.display = 'none'; });
    menu.addEventListener('click', (e) => e.stopPropagation());
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

  // Abrir modal de perfil desde el ítem del menú
  document.getElementById('menu-ajustes-perfil')?.addEventListener('click', async () => {
    document.getElementById('ajustes-menu').style.display = 'none';
    const myInfo = await getMyInfo();
    document.getElementById('ajustes-nombre').value      = myInfo.nombre || '';
    document.getElementById('ajustes-email').value       = myInfo.email  || '';
    document.getElementById('ajustes-password').value    = '';
    document.getElementById('ajustes-password2').value   = '';
    document.getElementById('alert-ajustes').className   = 'alert';
    document.getElementById('modal-ajustes').classList.add('open');
  });

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    _myInfo = null;
    localStorage.removeItem('planilla_token');
    localStorage.removeItem('planilla_user');
    localStorage.removeItem('planilla_empresa_id');
    window.location.href = '/login.html';
  });

  getMyInfo().then(info => {
    const link = document.getElementById('link-usuarios');
    if (link && info.rol !== 'Master') link.style.display = 'none';
    // Cargar selector de empresa en el sidebar
    _loadEmpresaSelector();
  });
}

async function _loadEmpresaSelector() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  // Evitar duplicados
  if (document.getElementById('empresa-selector-wrap')) return;

  try {
    const info = await getMyInfo().catch(() => ({}));
    // Obtener empresas disponibles para este usuario
    const empresas = await apiFetch('/api/empresas');
    if (!empresas || empresas.length === 0) {
      // Sin empresas: si es Master, mostrar solo el botón de crear
      if (info.rol === 'Master') {
        const wrap = document.createElement('div');
        wrap.id = 'empresa-selector-wrap';
        wrap.style.cssText = 'padding:8px 16px 4px;border-bottom:1px solid var(--border);margin-bottom:4px';
        wrap.innerHTML = `<button id="btn-gestionar-empresas" style="width:100%;background:none;border:1px dashed var(--border);color:var(--text-muted);border-radius:6px;font-size:12px;cursor:pointer;padding:6px 8px">🏢 Crear primera empresa</button>`;
        const logo = sidebar.querySelector('.sidebar-logo');
        if (logo && logo.nextSibling) sidebar.insertBefore(wrap, logo.nextSibling);
        else sidebar.appendChild(wrap);
        document.getElementById('btn-gestionar-empresas').addEventListener('click', _abrirModalEmpresas);
      }
      return;
    }

    const saved = localStorage.getItem('planilla_empresa_id');
    // Si no hay seleccionada o la guardada ya no existe en la lista, usar la primera
    const validIds = empresas.map(e => String(e.id));
    const currentId = (saved && validIds.includes(saved)) ? saved : String(empresas[0].id);
    if (!saved || !validIds.includes(saved)) {
      localStorage.setItem('planilla_empresa_id', currentId);
    }

    const selectedNombre = (empresas.find(e => String(e.id) === currentId) || empresas[0]).nombre;

    // Empleado: sólo texto estático, sin dropdown ni gestionar
    if (info.rol === 'Empleado') {
      const wrap = document.createElement('div');
      wrap.id = 'empresa-selector-wrap';
      wrap.style.cssText = 'padding:8px 16px 4px;border-bottom:1px solid var(--border);margin-bottom:4px';
      wrap.innerHTML = `
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#95a5a6;margin-bottom:4px">Empresa</div>
        <div style="font-size:13px;font-weight:600;color:var(--text);padding:4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${selectedNombre}</div>`;
      const logo = sidebar.querySelector('.sidebar-logo');
      if (logo && logo.nextSibling) sidebar.insertBefore(wrap, logo.nextSibling);
      else sidebar.appendChild(wrap);
      return;
    }

    const esMaster = info.rol === 'Master';

    // ── Custom dropdown (100% CSS controlado, sin nativo del OS) ──────────────
    const wrap = document.createElement('div');
    wrap.id = 'empresa-selector-wrap';
    wrap.style.cssText = 'padding:8px 16px 4px;border-bottom:1px solid var(--border);margin-bottom:4px';
    wrap.innerHTML = `
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#95a5a6;margin-bottom:4px">Empresa</div>
      <div id="empresa-custom-dd" style="position:relative;width:100%">
        <div id="empresa-dd-trigger" style="
          display:flex;justify-content:space-between;align-items:center;
          background:#263447;border:1px solid #34495e;color:#ecf0f1;
          border-radius:6px;padding:7px 10px;font-size:13px;cursor:pointer;
          user-select:none;transition:border-color .15s;
        ">
          <span id="empresa-dd-text" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${selectedNombre}</span>
          <span style="font-size:10px;margin-left:8px;opacity:.6;flex-shrink:0">▾</span>
        </div>
        <ul id="empresa-dd-list" style="
          display:none;position:absolute;top:calc(100% + 3px);left:0;right:0;
          background:#1e2d3d;border:1px solid #34495e;border-radius:6px;
          list-style:none;padding:4px 0;margin:0;z-index:1000;
          box-shadow:0 8px 24px rgba(0,0,0,.55);max-height:220px;overflow-y:auto;
        ">
          ${empresas.map(e => `
            <li data-value="${e.id}" style="
              padding:8px 12px;font-size:13px;cursor:pointer;
              color:${String(e.id) === currentId ? '#2ecc71' : '#ecf0f1'};
              font-weight:${String(e.id) === currentId ? '600' : 'normal'};
            ">${e.nombre}</li>
          `).join('')}
        </ul>
      </div>
      ${esMaster ? `<button id="btn-gestionar-empresas" style="width:100%;margin-top:4px;background:none;border:none;color:#95a5a6;font-size:11px;cursor:pointer;text-align:left;padding:2px 0">⚙ Gestionar empresas</button>` : ''}`;

    // Insertar justo después del .sidebar-logo
    const logo = sidebar.querySelector('.sidebar-logo');
    if (logo && logo.nextSibling) sidebar.insertBefore(wrap, logo.nextSibling);
    else sidebar.appendChild(wrap);

    const ddTrigger = document.getElementById('empresa-dd-trigger');
    const ddList    = document.getElementById('empresa-dd-list');

    // Hover en opciones
    ddList.querySelectorAll('li').forEach(li => {
      li.addEventListener('mouseenter', () => { li.style.background = 'rgba(255,255,255,.08)'; });
      li.addEventListener('mouseleave', () => { li.style.background = 'transparent'; });
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        ddList.style.display = 'none';
        ddTrigger.style.borderColor = '#34495e';
        localStorage.setItem('planilla_empresa_id', li.dataset.value);
        window.location.reload();
      });
    });

    // Abrir/cerrar al hacer clic en el trigger
    ddTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = ddList.style.display !== 'none';
      ddList.style.display = isOpen ? 'none' : 'block';
      ddTrigger.style.borderColor = isOpen ? '#34495e' : '#2ecc71';
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', () => {
      ddList.style.display = 'none';
      ddTrigger.style.borderColor = '#34495e';
    });
    ddList.addEventListener('click', e => e.stopPropagation());

    if (esMaster) {
      document.getElementById('btn-gestionar-empresas')?.addEventListener('click', () => {
        _abrirModalEmpresas();
      });
    }
  } catch (_) {
    // Si falla (sin empresas, error de red) no bloquear la UI
  }
}

async function _abrirModalEmpresas() {
  // Inyectar modal una sola vez
  if (!document.getElementById('modal-empresas')) {
    document.body.insertAdjacentHTML('beforeend', `
<div class="overlay" id="modal-empresas">
  <div class="modal" style="max-width:420px">
    <div class="modal-header">
      <h3>🏢 Gestionar empresas</h3>
      <button class="modal-close" id="close-modal-empresas">×</button>
    </div>
    <div class="modal-body">
      <div id="alert-empresas" class="alert"></div>
      <ul id="lista-empresas" style="list-style:none;padding:0;margin:0 0 12px"></ul>
      <div style="display:flex;gap:8px">
        <input type="text" id="inp-empresa-nombre" placeholder="Nombre de nueva empresa"
          style="flex:1;background:var(--input);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:8px 12px;font-size:13px" />
        <button class="btn btn-primary" id="btn-add-empresa">Agregar</button>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" id="close-modal-empresas2">Cerrar</button>
    </div>
  </div>
</div>`);

    ['close-modal-empresas', 'close-modal-empresas2'].forEach(id =>
      document.getElementById(id).addEventListener('click', () =>
        document.getElementById('modal-empresas').classList.remove('open'))
    );

    document.getElementById('btn-add-empresa').addEventListener('click', async () => {
      const nombre = document.getElementById('inp-empresa-nombre').value.trim();
      if (!nombre) return;
      try {
        await apiFetch('/api/empresas', { method: 'POST', body: JSON.stringify({ nombre }) });
        document.getElementById('inp-empresa-nombre').value = '';
        showAlert('alert-empresas', '✅ Empresa agregada', 'success');
        await _refreshListaEmpresas();
        // Recargar selector en sidebar
        window.location.reload();
      } catch (e) { showAlert('alert-empresas', 'Error: ' + e.message, 'error'); }
    });
  }

  await _refreshListaEmpresas();
  document.getElementById('modal-empresas').classList.add('open');
}

async function _refreshListaEmpresas() {
  try {
    const lista = await apiFetch('/api/empresas');
    const ul = document.getElementById('lista-empresas');
    if (!lista.length) {
      ul.innerHTML = '<li style="color:var(--text-muted);font-size:13px">No hay empresas registradas</li>';
      return;
    }
    ul.innerHTML = lista.map(em => `
      <li style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:13px">${em.nombre}</span>
        <button onclick="_deleteEmpresa(${em.id})" style="background:none;border:none;cursor:pointer;color:var(--red);font-size:16px" title="Eliminar">🗑</button>
      </li>`).join('');
  } catch (_) {}
}

async function _deleteEmpresa(id) {
  if (!confirm('¿Eliminar esta empresa? Los empleados vinculados quedarán sin empresa asignada.')) return;
  try {
    await apiFetch(`/api/empresas/${id}`, { method: 'DELETE' });
    showAlert('alert-empresas', '✅ Empresa eliminada', 'success');
    await _refreshListaEmpresas();
    window.location.reload();
  } catch (e) { showAlert('alert-empresas', 'Error: ' + e.message, 'error'); }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const empresaId = localStorage.getItem('planilla_empresa_id');
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(empresaId ? { 'X-Empresa-ID': empresaId } : {}),
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

// Convierte YYYY-MM-DD → "1-15 de Mayo 2026" o "16-31 de Mayo 2026"
function fmtPeriodo(isoDate) {
  if (!isoDate) return '—';
  const s = String(isoDate).substring(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return s;
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diaInicio = d <= 15 ? 1 : 16;
  return `${diaInicio}-${d} de ${meses[m - 1]} ${y}`;
}

function showAlert(id, msg, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 3500);
}

window.AppAuth = { onReady, requireAuth, requireAuthRole, initLayout, getToken, apiFetch, getMyInfo, isMaster, isAdmin, canEdit, fmt, fmtPeriodo, showAlert };
