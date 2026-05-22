# NOMIFY — Estado del proyecto (22 mayo 2026)

> **Documento de handoff para continuar en cualquier máquina.**
> Branch activa: `sol/feature-inicial` · Último commit: `3e7f5e5`

---

## 1. Cómo correr el proyecto localmente

```bash
# Backend (puerto 3000)
cd bk_nomify
nvm use 24        # NVM for Windows
npm start         # o: node server.js

# Frontend — servir desde ft_nomify con cualquier servidor estático
# Opción A: VS Code Live Server apuntando a ft_nomify/
# Opción B: npx serve ft_nomify
```

**Requisitos del entorno:**
- MariaDB local corriendo, base de datos: `planilla_nicaragua`
- Archivo `bk_nomify/.env` ya configurado con credenciales DB + JWT_SECRET
- `node_modules` ya instalado en `bk_nomify/`

---

## 2. Arquitectura general

```
ft_nomify/           ← Frontend HTML/CSS/JS vanilla (sin frameworks)
  assets/
    css/app.css      ← Estilos globales dark mode con CSS variables
    js/auth.js       ← Funciones globales: getToken, apiFetch, initLayout,
                        onReady, getMyInfo, showAlert, fmt
    js/feriados.js   ← Lista de feriados nacionales de Nicaragua
  index.html         ← Dashboard admin
  empleados.html
  planillas.html
  planilla-detalle.html
  prestamos.html
  adelantos.html
  extras.html
  deducciones.html
  vacaciones.html
  calendario.html
  recibo.html        ← Recibo de pago individual (admin + empleado)
  mi-recibo.html     ← Portal del empleado (solo rol Empleado)
  login.html
  usuarios.html

bk_nomify/           ← Backend Node.js + Express + mysql2
  server.js          ← Entry point + migraciones automáticas al arrancar
  db.js              ← Pool de conexión MariaDB
  auth.js            ← Middleware requireAuth, requireMaster
  schema.sql         ← Definición de tablas (referencia, no se re-ejecuta)
  routes/
    authRoutes.js    ← POST /api/auth/login, GET /api/auth/me, PATCH /api/auth/perfil
    empleadosRoutes.js
    planillasRoutes.js
    detalleRoutes.js
    prestamosRoutes.js
    adelantosRoutes.js
    extrasRoutes.js
    deduccionesRoutes.js
    vacacionesRoutes.js
    usuariosRoutes.js
    reciboRoutes.js
```

---

## 3. Sistema de roles (DEFINITIVO)

| Rol | Acceso |
|-----|--------|
| **Master** | Admin total. Ve y edita todo. Única cuenta que puede administrar usuarios y acceder a /usuarios.html |
| **Planillero** | Gestiona planillas del tipo asignado en `planillas_acceso` (Con Seguro / Sin Seguro). Puede registrar préstamos, adelantos, extras, deducciones. No edita empleados ni administra usuarios. |
| **Empleado** | Solo ve su portal personal (`/mi-recibo.html`): sus quincenas, préstamos, adelantos, extras, deducciones. No accede al admin. |

**⚠️ Nota migración:** El rol "Colaborador" fue renombrado a "Planillero". Hay un shim en `ft_nomify/assets/js/auth.js` línea ~204 que convierte tokens JWT viejos con rol 'Colaborador' a 'Planillero' automáticamente.

---

## 4. Flujo de autenticación

1. **Login** (`/api/auth/login`) → devuelve `{ token, user: { id, nombre, email, rol, empleado_id, planillas_acceso } }`
2. Token se guarda en `localStorage.planilla_token`, user en `localStorage.planilla_user`
3. Cada página llama `onReady(rolesPermitidos, fn)` al cargar
4. `onReady` verifica token → si no hay, redirige a login; verifica rol → si no permitido, redirige a /mi-recibo.html
5. `apiFetch(path, options)` agrega `Authorization: Bearer <token>` automáticamente y maneja 401 (sesión expirada → logout + redirect)
6. `initLayout()` en auth.js inyecta el botón ⚙️ Ajustes, el modal de perfil y el botón de logout en el sidebar

**Redirecciones especiales:**
- Login → usuario Master/Planillero: `/index.html`
- Login → usuario Empleado: `/mi-recibo.html`
- Empleado que intenta acceder a página admin → redirige a `/mi-recibo.html`

---

## 5. Estado de cada archivo — qué hace cada uno

### Backend

#### `bk_nomify/server.js`
Entry point. Al arrancar ejecuta migraciones automáticas silenciosas:
```js
ALTER TABLE prestamos  MODIFY COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'Activo'
ALTER TABLE empleados  MODIFY COLUMN rol    VARCHAR(50) NOT NULL DEFAULT 'Empleado'
ALTER TABLE usuarios   MODIFY COLUMN rol    VARCHAR(50) NOT NULL DEFAULT 'Empleado'
UPDATE usuarios  SET rol='Planillero' WHERE rol='Colaborador'
UPDATE empleados SET rol='Planillero' WHERE rol='Colaborador'
```
Esto arregla columnas ENUM que tenía la DB real (vs VARCHAR en schema.sql).

#### `bk_nomify/routes/empleadosRoutes.js`
- GET `/api/empleados` — si rol=Planillero, filtra por `planillas_acceso`
- POST `/api/empleados` — crea empleado. Valida email duplicado antes de insertar (error amigable). Auto-crea usuario si tiene email+rol (función `syncUsuario`)
- PATCH `/api/empleados/:id` — edita empleado. Sincroniza usuario asociado automáticamente
- `syncUsuario(empleadoId, nombre, email, rol, tipoPlanilla)` — crea o actualiza el usuario del sistema vinculado al empleado. Si es Planillero, asigna `planillas_acceso = tipoPlanilla`

#### `bk_nomify/routes/prestamosRoutes.js`
- GET `/api/prestamos` — con `?empleado_id=X` para filtrar por empleado
- POST — nuevo préstamo
- PATCH — edita o registra pago directo (body: `{id, monto_pagado, fecha}`) o cambia estado (body: `{id, Estado:'Suspendido'}`)
- Los estados válidos son: `Activo`, `Pagado`, `Suspendido`
- Saldo calculado como `monto_total - SUM(pagos_prestamos.monto)` (fuente de verdad)

#### `bk_nomify/routes/planillasRoutes.js`
- GET `/api/planillas` — Planillero solo ve su tipo
- POST `/api/planillas/calcular` — genera planilla. Planillero solo puede generar su tipo. Aplica INSS, IR, adelantos, cuotas de préstamos (no suspendidos), extras, deducciones. Usa transacción DB.

#### `bk_nomify/routes/detalleRoutes.js`
- GET `/api/detalle?planilla_id=X` — detalle de planilla específica
- GET `/api/detalle?empleado_id=X` — historial de quincenas de un empleado (para portal empleado)
- GET `/api/detalle?periodo=YYYY-MM-DD&tipo=Y` — legacy

#### `bk_nomify/routes/reciboRoutes.js`
- GET `/api/recibo?empleado_id=X&periodo=YYYY-MM-DD`
- Si el usuario tiene rol Empleado, verifica que `req.user.empleado_id === empleado_id` (seguridad)

#### `bk_nomify/routes/usuariosRoutes.js`
- Solo accesible para Master (`requireMaster`)
- Roles válidos: `Master`, `Planillero`, `Empleado`
- Si rol=Planillero, requiere `planillas_acceso`
- Contraseña por defecto al crear: `Nomify2026`

#### `bk_nomify/auth.js` (middleware)
```js
requireAuth  — verifica JWT, adjunta req.user = { id, email, rol, empleado_id, planillas_acceso }
requireMaster — verifica que req.user.rol === 'Master'
```

---

### Frontend

#### `ft_nomify/assets/js/auth.js`
Funciones globales disponibles en todas las páginas:
```js
getToken()                      // token del localStorage
apiFetch(path, options)         // fetch con Bearer token, maneja 401
getMyInfo()                     // GET /api/auth/me con caché (_myInfo)
onReady(roles, fn)              // verifica auth+rol antes de ejecutar
requireAuth()                   // solo verifica token
requireAuthRole(roles)          // verifica token+rol
initLayout()                    // inyecta Ajustes, logout, oculta link-usuarios si no es Master
isMaster() / isAdmin()          // async, retorna bool
canEdit()                       // Master o Planillero
fmt(n)                          // formato 'C$ 1,234.56'
showAlert(id, msg, type)        // muestra alerta con fade-out automático en success
```
Shim de migración en `getMyInfo()`:
```js
if (_myInfo.rol === 'Admin')       _myInfo.rol = 'Master';
if (_myInfo.rol === 'Colaborador') _myInfo.rol = 'Planillero'; // compatibilidad
```

#### `ft_nomify/assets/css/app.css`
CSS variables dark mode:
```css
--navy: #1e2a3a     /* fondo principal */
--navy2: #263447    /* sidebar, cards */
--green: #27ae60
--green2: #2ecc71   /* acentos, activo */
--red: #e74c3c
--orange: #e67e22   /* advertencias, pendiente */
--text: #ecf0f1
--muted: #95a5a6
--border: #34495e
--card: #243040
--input: #1a2535
```
Incluye: layout, sidebar, topbar, tablas, modales, badges, spinners, forms.
**Importante:** `input[type="date"] { color-scheme: dark; }` — para que el ícono del calendario sea blanco en modo oscuro.

---

#### Páginas Admin

**`index.html`** — Dashboard con métricas: total empleados, próxima quincena, últimas planillas.
`onReady(['Master', 'Planillero'], ...)`

**`empleados.html`** — CRUD de empleados. Solo Master puede crear/editar. Planillero solo lee.
- Campos: nombre, cargo, tipo_planilla (Con Seguro / Sin Seguro), salario_bruto, inss_base, ir_fijo, fecha_ingreso, email, rol, activo
- Roles disponibles en el form: (vacío=sin acceso), Master, Planillero, Empleado
- `onReady(['Master', 'Planillero'], ...)`

**`planillas.html`** — Lista de planillas generadas. Botón "Generar planilla".
`onReady(['Master', 'Planillero'], ...)`

**`planilla-detalle.html`** — Detalle de una planilla: tabla con todos los empleados, sus deducciones, neto. Botón para ver recibo individual.
`onReady(['Master', 'Planillero'], ...)`

**`prestamos.html`** — Lista de préstamos con tabs: Todos / Activos / Pagados / Suspendidos.
- Botones por fila: 📋 Detalle (historial de pagos) | ✏️ Editar (solo Master) | + Pago | ⏸ Pausar (solo Master, si Activo) | ▶ Reactivar (solo Master, si Suspendido)
- Modal "Registrar pago directo": fecha + monto + notas → backend recalcula saldo
- `onReady(['Master', 'Planillero'], ...)`

**`adelantos.html`** — CRUD adelantos. Botones Pausar/Reactivar (pausado=1 no descuenta en planilla).
`onReady(['Master', 'Planillero'], ...)`

**`extras.html`** — CRUD extras (Bono, Feriado trabajado, Otro). Se pagan en la quincena elegida.
`onReady(['Master', 'Planillero'], ...)`

**`deducciones.html`** — Otras deducciones manuales. Similar a adelantos.
`onReady(['Master', 'Planillero'], ...)`

**`vacaciones.html`** — Registro de vacaciones.
- Tabla resumen: días acumulados (2.5/mes) - días tomados = saldo, valor monetario del saldo
- Historial de registros con filtro por empleado
- **DOS botones:** `+ Registrar días` (tipo=Descanso) y `💵 Pagar vacaciones` (tipo=Pagadas)
- Modal con tipo selector + preview de cálculo cuando es Pagadas (salario diario × días − INSS 7%)
- `onReady(['Master', 'Planillero'], ...)`

**`calendario.html`** — Vista de calendario mensual.
- Filtros: 🎌 Feriados | 📋 Quincenas | 🏖 Vacaciones | ⚡ Adelantos | ⭐ Extras
- Feriados cargados desde `feriados.js` (lista estática de Nicaragua)
- Quincenas marcadas en día 15 y último día del mes
- Vacaciones muestran nombre del empleado (coloreado por empleado)
- Adelantos pendientes (no descontados): tag rojo ⚡ con nombre
- Extras: tag amarillo ⭐ con nombre
- `onReady(['Master', 'Planillero'], ...)`

**`usuarios.html`** — Solo Master. CRUD de usuarios del sistema.
- Roles: Master / Planillero (gestiona planillas) / Empleado (solo ve su recibo)
- Si rol=Planillero: campo "Planilla asignada" (Con Seguro / Sin Seguro) se muestra y es obligatorio
- Contraseña por defecto al crear: `Nomify2026`
- `onReady(['Master'], ...)`

---

#### Páginas Empleado

**`mi-recibo.html`** — Portal del empleado. Layout con sidebar izquierdo (igual al admin).
- Nav lateral: 📋 Mis Quincenas | 💰 Mis Préstamos | ⚡ Mis Adelantos | ⭐ Mis Extras | ➖ Mis Deducciones
- Carga datos con `?empleado_id={info.empleado_id}` en cada sección (lazy loading)
- Si `info.empleado_id` es null → muestra error "Contacta al administrador"
- Si rol no es Empleado → redirige a /index.html
- `onReady(null, ...)` (acepta cualquier rol autenticado, valida internamente)

**`recibo.html`** — Recibo de pago individual (imprimible/PDF).
- Accesible para Master, Planillero y Empleado (empleado solo puede ver su propio recibo — validación en backend)
- Sidebar se adapta según rol: Empleado ve solo "Mi Portal", admin ve el menú completo
- Botón volver: Empleado → `/mi-recibo.html`; Admin → `/planilla-detalle.html?periodo=X`
- Impresión CSS: oculta sidebar, topbar y botones
- `onReady(['Master', 'Planillero', 'Empleado'], ...)`

**`login.html`** — Formulario de login.
- Si ya hay token activo, redirige a /mi-recibo.html (Empleado) o /index.html (otros)
- POST `/api/auth/login` → guarda token y user en localStorage

---

## 6. Cálculo de planilla (lógica de negocio)

```
salario_quincenal = salario_mensual / 2

INSS (si tipo_planilla !== 'Sin Seguro'):
  base = (inss_base === 'Salario Minimo') ? 10913.54 : salario_mensual
  inss = base / 2 * 0.07

Préstamos:
  - Solo aplican los que tienen estado = 'Activo' (los Suspendidos NO descuentan)
  - Frecuencia Quincenal: descuenta cada quincena
  - Frecuencia Mensual: descuenta solo en la quincena elegida (día 15 o fin de mes)
  - Se descuenta min(cuota_quincenal, saldo_pendiente) — no más de lo que queda

Total deducciones = inss + ir_fijo + desc_adelanto + desc_prestamo + desc_deducciones
neto = salario_quincenal + extras - total_deducciones

Después de generar:
  - Adelantos → estado = 'Descontado'
  - Deducciones → estado = 'Descontado'
  - Préstamos → se inserta en pagos_prestamos, saldo se recalcula desde monto_total - SUM(pagos)
```

---

## 7. Errores resueltos en esta sesión

| Error | Causa | Solución |
|-------|-------|----------|
| "Data truncated for column 'estado'" al pausar préstamo | Columna ENUM en DB real vs VARCHAR en schema | ALTER TABLE en server.js startup |
| "Data truncated for column 'rol'" al crear empleado | Mismo problema en empleados.rol | ALTER TABLE en server.js startup |
| `planillas_acceso` quedaba en null para Planillero | `syncUsuario` no recibía el tipoPlanilla | Agregado parámetro `tipoPlanilla` a la función |
| Recibo no cargaba para Empleado | `onReady(['Master','Planillero'])` sin Empleado | Agregado 'Empleado' a la lista de roles |
| Login en loop para Empleado | Redirigía siempre a /index.html que luego redirigía | Verificar rol en login antes de redirigir |
| Email duplicado en empleado: error genérico 500 | Sin validación previa | Verificar existencia antes del INSERT |

---

## 8. Qué falta por hacer (backlog a futuro)

- [ ] **Empleado puede ver historial de pagos de su préstamo** (actualmente solo admin lo ve en el Detalle)
- [ ] **Calendario muestra cuotas de préstamos activos** en el día de quincena (actualmente solo adelantos/extras)
- [ ] **Reporte exportable** — PDF o Excel de la planilla completa
- [ ] **Notificaciones** — email o push al empleado cuando se genera su quincena
- [ ] **Filtro por periodo en mi-recibo** — el empleado puede ver datos de un mes específico
- [ ] **Editar recibo** — corregir un error en la planilla sin regenerar todo
- [ ] **Dashboard con gráficas** — evolución del gasto en planilla por mes
- [ ] **Backup automático de DB**

---

## 9. Convenciones de código importantes

### Frontend JS
```js
// Toda página tiene este patrón:
onReady(['Master', 'Planillero'], async () => {
  initLayout();           // siempre primero
  const info = await getMyInfo();
  const _esMaster = info.rol === 'Master';
  // ... carga de datos
});

// Formateo monetario
fmt(1234.5)  // → 'C$ 1,234.50'

// Alertas
showAlert('alert-id', 'mensaje', 'success' | 'error');

// API calls
const data = await apiFetch('/api/ruta', {
  method: 'POST',
  body: JSON.stringify({ campo: valor })
});
```

### Backend routes
```js
// Patrón GET con filtros opcionales
router.get('/', requireAuth, async (req, res) => {
  const conds = [], params = [];
  // Planillero solo ve su tipo
  if (req.user.rol === 'Planillero' && req.user.planillas_acceso) {
    conds.push('tabla.tipo = ?');
    params.push(req.user.planillas_acceso);
  }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const [rows] = await db.query(`SELECT ... FROM tabla ${where}`, params);
  res.json(rows);
});

// Patrón nombres de columnas en GET_SQL: alias con mayúscula inicial o backticks
// Los campos que devuelve la API se acceden así desde el frontend:
//   row['Nombre'], row['Salario bruto mensual'], row.id, row.Activo
```

### CSS — estructura de página
```html
<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-logo"><h2>Nomify</h2></div>
    <nav>
      <a href="..." class="active"><span class="icon">📊</span> Sección</a>
    </nav>
    <div class="sidebar-footer">
      <span id="user-email"></span>
      <button class="btn-logout" id="btn-logout">Cerrar sesión</button>
    </div>
  </aside>
  <div class="main">
    <div class="topbar">...</div>
    <div class="content">...</div>
  </div>
</div>
```

---

## 10. Archivos modificados en la sesión de hoy

```
bk_nomify/server.js              + migraciones automáticas al arrancar
bk_nomify/schema.sql             + default rol cambiado a 'Empleado'
bk_nomify/routes/planillasRoutes.js   Colaborador→Planillero
bk_nomify/routes/detalleRoutes.js     Colaborador→Planillero
bk_nomify/routes/empleadosRoutes.js   Colaborador→Planillero + validación email duplicado
bk_nomify/routes/usuariosRoutes.js    Colaborador→Planillero
ft_nomify/assets/js/auth.js      Colaborador→Planillero + shim compatibilidad
ft_nomify/assets/css/app.css     + color-scheme:dark para input[type=date]
ft_nomify/adelantos.html         onReady Colaborador→Planillero
ft_nomify/extras.html            onReady Colaborador→Planillero
ft_nomify/deducciones.html       onReady Colaborador→Planillero
ft_nomify/planillas.html         onReady Colaborador→Planillero
ft_nomify/index.html             onReady Colaborador→Planillero
ft_nomify/planilla-detalle.html  onReady Colaborador→Planillero
ft_nomify/vacaciones.html        onReady + botón "💵 Pagar vacaciones" + abrirModal(tipo)
ft_nomify/calendario.html        onReady + adelantos/extras en calendario + 2 checkboxes nuevos
ft_nomify/empleados.html         onReady + option value Planillero en selector de rol
ft_nomify/prestamos.html         onReady + tab Suspendidos
ft_nomify/recibo.html            onReady + sidebar adaptativo según rol Empleado
ft_nomify/usuarios.html          Colaborador→Planillero en toda la página
ft_nomify/mi-recibo.html         Reescrito: sidebar izquierdo con 5 secciones (antes: tabs horizontales)
```

---

## 11. Cómo continuar desde casa (Claude Desktop)

1. Clona o actualiza el repo: `git pull origin sol/feature-inicial`
2. Inicia el backend: `cd bk_nomify && nvm use 24 && npm start`
3. Sirve el frontend desde `ft_nomify/` con Live Server
4. Cuando abras Claude Desktop, el contexto de memoria se carga automáticamente desde los archivos `.claude/projects/.../memory/`
5. Si el contexto no carga, puedes pegar este documento directamente en el chat como contexto inicial

**Frase de arranque sugerida para la próxima sesión:**
> "Continuamos con Nomify. Branch: sol/feature-inicial. El último commit fue el renombramiento Colaborador→Planillero con mejoras en el portal del empleado y el calendario. ¿Qué sigue del backlog?"

---

*Generado el 22 mayo 2026 · Claude Sonnet 4.6*
