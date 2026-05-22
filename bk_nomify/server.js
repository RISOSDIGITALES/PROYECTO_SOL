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

// Todas las demás rutas devuelven el HTML correspondiente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../ft_nomify/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Planilla server corriendo en http://localhost:${PORT}`));
