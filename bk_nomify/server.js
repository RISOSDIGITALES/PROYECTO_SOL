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
  // Usar SHOW COLUMNS porque ADD COLUMN IF NOT EXISTS no está soportado en MySQL < 5.8
  const [folioCol] = await db.query('SHOW COLUMNS FROM planillas LIKE "folio"').catch(() => [[]]);
  if (folioCol.length === 0) await run("ALTER TABLE planillas ADD COLUMN folio INT DEFAULT NULL");
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
