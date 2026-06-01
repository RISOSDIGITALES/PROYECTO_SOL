require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const { requireAuth, requireAdmin } = require('./auth');

// ── Migraciones automáticas al arrancar ───────────────────────────────────────
(async () => {
  const run = async (sql) => { try { await db.query(sql); } catch (_) {} };
  // Asegurar que columnas sean VARCHAR (no ENUM) — soporta todos los valores
  await run("ALTER TABLE prestamos  MODIFY COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'Activo'");
  await run("ALTER TABLE empleados  MODIFY COLUMN rol    VARCHAR(50) NOT NULL DEFAULT 'Empleado'");
  await run("ALTER TABLE usuarios   MODIFY COLUMN rol    VARCHAR(50) NOT NULL DEFAULT 'Planillero'");
  // Renombrar Colaborador → Planillero en datos existentes
  await run("UPDATE usuarios  SET rol='Planillero' WHERE rol='Colaborador'");
  await run("UPDATE empleados SET rol='Planillero' WHERE rol='Colaborador'");
  // Agregar columna concepto a deducciones si no existe
  await run("ALTER TABLE deducciones ADD COLUMN IF NOT EXISTS concepto VARCHAR(100) DEFAULT NULL AFTER empleado_id");
  // ── v1.1: empresas, empresa_id, ir_tipo, ir_fijo, empresas_acceso ─────────
  await run("CREATE TABLE IF NOT EXISTS empresas (id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await run("ALTER TABLE empleados  ADD COLUMN IF NOT EXISTS empresa_id INT DEFAULT NULL");
  await run("ALTER TABLE empleados  ADD COLUMN IF NOT EXISTS ir_tipo VARCHAR(20) DEFAULT 'Sin IR'");
  await run("ALTER TABLE empleados  ADD COLUMN IF NOT EXISTS ir_fijo DECIMAL(12,2) DEFAULT NULL");
  await run("ALTER TABLE planillas  ADD COLUMN IF NOT EXISTS empresa_id INT DEFAULT NULL");
  await run("ALTER TABLE usuarios   ADD COLUMN IF NOT EXISTS empresas_acceso TEXT DEFAULT NULL");
  // ── v1.3: folio secuencial por empresa ───────────────────────────────────
  const [folioCol] = await db.query('SHOW COLUMNS FROM planillas LIKE "folio"').catch(() => [[]]);
  if (folioCol.length === 0) await run("ALTER TABLE planillas ADD COLUMN folio INT DEFAULT NULL");

  // ── v1.4: perfil completo de empresa ─────────────────────────────────────
  await run("ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ruc        VARCHAR(30)   DEFAULT NULL");
  await run("ALTER TABLE empresas ADD COLUMN IF NOT EXISTS correo     VARCHAR(150)  DEFAULT NULL");
  await run("ALTER TABLE empresas ADD COLUMN IF NOT EXISTS telefono   VARCHAR(30)   DEFAULT NULL");
  await run("ALTER TABLE empresas ADD COLUMN IF NOT EXISTS direccion  TEXT          DEFAULT NULL");
  await run("ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo       MEDIUMTEXT    DEFAULT NULL");

  // ── v1.5: cédula y cumpleaños en empleados ────────────────────────────────
  await run("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS cedula           VARCHAR(16) DEFAULT NULL");
  await run("ALTER TABLE empleados ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE        DEFAULT NULL");

  // ── v1.6: INSS patronal e INATEC en planillas ────────────────────────────
  await run("ALTER TABLE planillas ADD COLUMN IF NOT EXISTS total_inss_patronal DECIMAL(12,2) DEFAULT 0.00");
  await run("ALTER TABLE planillas ADD COLUMN IF NOT EXISTS total_inatec        DECIMAL(12,2) DEFAULT 0.00");
  await run("ALTER TABLE planillas ADD COLUMN IF NOT EXISTS costo_total_empresa DECIMAL(12,2) DEFAULT 0.00");
  await run("ALTER TABLE planillas ADD COLUMN IF NOT EXISTS estado              VARCHAR(50)   DEFAULT 'Borrador'");
  await run("ALTER TABLE detalle_planilla ADD COLUMN IF NOT EXISTS inss_patronal    DECIMAL(10,2) DEFAULT 0.00");
  await run("ALTER TABLE detalle_planilla ADD COLUMN IF NOT EXISTS inatec           DECIMAL(10,2) DEFAULT 0.00");
  await run("ALTER TABLE detalle_planilla ADD COLUMN IF NOT EXISTS meses_trabajados DECIMAL(4,2)  DEFAULT NULL");
  // UNIQUE(planilla_id, empleado_id) — evitar duplicados
  await run("ALTER TABLE detalle_planilla ADD UNIQUE KEY uq_planilla_empleado (planilla_id, empleado_id)");

  // ── v1.7: campo notas en préstamos ────────────────────────────────────────
  await run("ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT NULL");

  // ── v1.8: tablas de liquidación e historial de salarios ──────────────────
  await run(`CREATE TABLE IF NOT EXISTS liquidaciones (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id          INT NOT NULL,
    empresa_id           INT DEFAULT NULL,
    fecha_baja           DATE NOT NULL,
    motivo               VARCHAR(100) DEFAULT 'Renuncia voluntaria',
    salario_mensual      DECIMAL(12,2) DEFAULT 0,
    fecha_ingreso        DATE DEFAULT NULL,
    anios_servicio       DECIMAL(6,2)  DEFAULT 0,
    meses_servicio       DECIMAL(6,2)  DEFAULT 0,
    dias_vacaciones      DECIMAL(6,2)  DEFAULT 0,
    monto_vacaciones     DECIMAL(12,2) DEFAULT 0,
    meses_aguinaldo      DECIMAL(4,2)  DEFAULT 0,
    monto_aguinaldo      DECIMAL(12,2) DEFAULT 0,
    aplica_indemnizacion TINYINT(1)    DEFAULT 0,
    monto_indemnizacion  DECIMAL(12,2) DEFAULT 0,
    aplica_preaviso      TINYINT(1)    DEFAULT 0,
    dias_preaviso        INT           DEFAULT 0,
    monto_preaviso       DECIMAL(12,2) DEFAULT 0,
    total                DECIMAL(12,2) DEFAULT 0,
    notas                TEXT          DEFAULT NULL,
    estado               VARCHAR(50)   DEFAULT 'Pendiente',
    created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await run(`CREATE TABLE IF NOT EXISTS historial_salarios (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id      INT NOT NULL,
    salario_anterior DECIMAL(12,2) NOT NULL,
    salario_nuevo    DECIMAL(12,2) NOT NULL,
    fecha            DATE NOT NULL,
    usuario          VARCHAR(150) DEFAULT NULL,
    motivo           VARCHAR(200) DEFAULT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  console.log('[migrations] OK');
})();

const app = express();
app.use(cors());
app.use(express.json());

// Servir el frontend estático
app.use(express.static(path.join(__dirname, '../ft_nomify')));

// Rutas API
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/empleados',  require('./routes/empleadosRoutes'));
app.use('/api/prestamos',  require('./routes/prestamosRoutes'));
app.use('/api/adelantos',  require('./routes/adelantosRoutes'));
app.use('/api/extras',     require('./routes/extrasRoutes'));
app.use('/api/deducciones',require('./routes/deduccionesRoutes'));
app.use('/api/vacaciones', require('./routes/vacacionesRoutes'));
app.use('/api/planillas',  require('./routes/planillasRoutes'));
app.use('/api/detalle',   require('./routes/detalleRoutes'));
app.use('/api/recibo',    require('./routes/reciboRoutes'));
app.use('/api/usuarios',  require('./routes/usuariosRoutes'));
app.use('/api/empresas',     require('./routes/empresasRoutes'));
app.use('/api/reportes',     require('./routes/reportesRoutes'));
app.use('/api/liquidaciones',require('./routes/liquidacionRoutes'));
app.use('/api/export',       require('./routes/exportRoutes'));

// Todas las demás rutas devuelven el HTML correspondiente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../ft_nomify/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Planilla server corriendo en http://localhost:${PORT}`));
