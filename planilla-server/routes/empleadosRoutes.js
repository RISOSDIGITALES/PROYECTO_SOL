const router = require('express').Router();
const db = require('../db');
<<<<<<< HEAD
const { requireAuth, requireMaster } = require('../auth');

const GET_SQL = `
  SELECT id, nombre AS Nombre, cargo AS Cargo,
    salario_bruto AS \`Salario bruto mensual\`,
    tipo_planilla AS Tipo_Planilla,
    DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') AS \`Fecha de ingreso\`,
    inss_base AS INSS_Base, ir_fijo AS IR, activo AS Activo,
    email AS Email, rol AS Rol
  FROM empleados`;

function mapBody(b) {
  return {
    nombre:        b.nombre        ?? b['Nombre'],
    cargo:         b.cargo         ?? b['Cargo'],
    tipo_planilla: b.tipo_planilla ?? b['Tipo_Planilla'],
    salario_bruto: b.salario_bruto ?? b['Salario bruto mensual'],
    inss_base:     b.inss_base     ?? b['INSS_Base'],
    ir_fijo:       b.ir_fijo       ?? b['IR'],
    email:         b.email         ?? b['Email'],
    rol:           b.rol           ?? b['Rol'],
    fecha_ingreso: b.fecha_ingreso ?? b['Fecha de ingreso'],
    activo:        b.activo        !== undefined ? b.activo : b['Activo'],
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    let sql = GET_SQL;
    const params = [];
    // Colaborador solo ve su tipo de planilla
    if (req.user.rol === 'Colaborador' && req.user.planillas_acceso) {
      sql += ' WHERE tipo_planilla = ?';
      params.push(req.user.planillas_acceso);
    }
    sql += ' ORDER BY nombre ASC';
    const [rows] = await db.query(sql, params);
=======
const { requireAuth } = require('../auth');

// GET /api/empleados
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados WHERE activo = 1 ORDER BY nombre ASC');
>>>>>>> origin/claude/check-claude-md-file-EC9xe
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

<<<<<<< HEAD
router.post('/', requireAuth, requireMaster, async (req, res) => {
  const m = mapBody(req.body);
  if (!m.nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const [r] = await db.query(
      'INSERT INTO empleados (nombre, cargo, tipo_planilla, salario_bruto, inss_base, ir_fijo, email, rol, fecha_ingreso, activo) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [m.nombre, m.cargo, m.tipo_planilla || 'Con Seguro', m.salario_bruto || 0,
       m.inss_base || 'Salario Completo', m.ir_fijo || 0, m.email, m.rol || 'Empleado',
       m.fecha_ingreso || null, m.activo !== undefined ? (m.activo ? 1 : 0) : 1]
    );
    const [rows] = await db.query(GET_SQL.replace('ORDER BY nombre ASC', 'WHERE id = ?'), [r.insertId]);
=======
// POST /api/empleados
router.post('/', requireAuth, async (req, res) => {
  const { nombre, cargo, tipo_planilla, salario_bruto, inss_base, ir_fijo, email, rol } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO empleados (nombre, cargo, tipo_planilla, salario_bruto, inss_base, ir_fijo, email, rol) VALUES (?,?,?,?,?,?,?,?)',
      [nombre, cargo, tipo_planilla || 'Con Seguro', salario_bruto || 0, inss_base || 'Salario Completo', ir_fijo || 0, email, rol || 'Empleado']
    );
    const [rows] = await db.query('SELECT * FROM empleados WHERE id = ?', [r.insertId]);
>>>>>>> origin/claude/check-claude-md-file-EC9xe
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

<<<<<<< HEAD
async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });

  const m = mapBody(req.body);
  const MYSQL_NAMES = ['nombre','cargo','tipo_planilla','salario_bruto','inss_base','ir_fijo','email','rol','fecha_ingreso','activo','planillas_acceso'];
  const sets = [], vals = [];
  for (const c of MYSQL_NAMES) {
    if (m[c] !== undefined) { sets.push(`${c} = ?`); vals.push(m[c] !== '' ? m[c] : null); }
  }
  if (req.body.planillas_acceso !== undefined) { sets.push('planillas_acceso = ?'); vals.push(req.body.planillas_acceso); }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });

  vals.push(id);
  try {
    await db.query(`UPDATE empleados SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(GET_SQL.replace('ORDER BY nombre ASC', 'WHERE id = ?'), [id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.patch('/', requireAuth, patchHandler);
router.patch('/:id', requireAuth, patchHandler);
=======
// PATCH /api/empleados/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const campos = ['nombre','cargo','tipo_planilla','salario_bruto','inss_base','ir_fijo','email','rol','planillas_acceso','activo'];
  const sets = [], vals = [];
  for (const c of campos) {
    if (req.body[c] !== undefined) { sets.push(`${c} = ?`); vals.push(req.body[c]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE empleados SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM empleados WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
>>>>>>> origin/claude/check-claude-md-file-EC9xe

module.exports = router;
