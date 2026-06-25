const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

<<<<<<< HEAD
const GET_SQL = `
  SELECT p.id, e.nombre AS Empleado,
    p.monto_total AS \`Monto total\`,
    p.cuota_quincenal AS \`Cuota quincenal\`,
    p.cuotas_restantes AS \`Cuotas restantes\`,
    p.estado AS Estado,
    p.historial_pagos AS Historial_Pagos,
    p.notas, p.empleado_id
  FROM prestamos p
  JOIN empleados e ON p.empleado_id = e.id`;

=======
>>>>>>> origin/claude/check-claude-md-file-EC9xe
router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE p.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
<<<<<<< HEAD
    const [rows] = await db.query(`${GET_SQL} ${where} ORDER BY p.id DESC`, params);
=======
    const [rows] = await db.query(
      `SELECT p.*, e.nombre as empleado_nombre FROM prestamos p
       JOIN empleados e ON p.empleado_id = e.id ${where} ORDER BY p.id DESC`, params
    );
>>>>>>> origin/claude/check-claude-md-file-EC9xe
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

<<<<<<< HEAD
async function resolveEmpleadoId(db, body) {
  if (body.empleado_id) return body.empleado_id;
  if (body['Empleado']) {
    const [rows] = await db.query('SELECT id FROM empleados WHERE nombre = ?', [body['Empleado']]);
    if (rows.length) return rows[0].id;
  }
  return null;
}

router.post('/', requireAuth, async (req, res) => {
  const b = req.body;
  const empleado_id = await resolveEmpleadoId(db, b);
  if (!empleado_id) return res.status(400).json({ error: 'Empleado requerido' });
  const monto_total = b.monto_total ?? b['Monto total'];
  const cuota_quincenal = b.cuota_quincenal ?? b['Cuota quincenal'];
  const cuotas_restantes = b.cuotas_restantes ?? b['Cuotas restantes'] ?? Math.ceil(monto_total / cuota_quincenal);
  const estado = b.estado ?? b['Estado'] ?? 'Activo';
  const notas = b.notas ?? b['Concepto'];
  try {
    const [r] = await db.query(
      'INSERT INTO prestamos (empleado_id, monto_total, cuota_quincenal, cuotas_restantes, estado, notas) VALUES (?,?,?,?,?,?)',
      [empleado_id, monto_total, cuota_quincenal, cuotas_restantes, estado, notas]
    );
    const [rows] = await db.query(`${GET_SQL} WHERE p.id = ?`, [r.insertId]);
=======
router.post('/', requireAuth, async (req, res) => {
  const { empleado_id, monto_total, cuota_quincenal, cuotas_restantes, fecha_registro, notas } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO prestamos (empleado_id, monto_total, cuota_quincenal, cuotas_restantes, fecha_registro, notas) VALUES (?,?,?,?,?,?)',
      [empleado_id, monto_total, cuota_quincenal, cuotas_restantes || Math.ceil(monto_total / cuota_quincenal), fecha_registro, notas]
    );
    const [rows] = await db.query('SELECT * FROM prestamos WHERE id = ?', [r.insertId]);
>>>>>>> origin/claude/check-claude-md-file-EC9xe
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

<<<<<<< HEAD
async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  const b = req.body;
  const mapping = {
    historial_pagos:  b.historial_pagos  ?? b['Historial_Pagos'],
    cuotas_restantes: b.cuotas_restantes ?? b['Cuotas restantes'],
    estado:           b.estado           ?? b['Estado'],
    cuota_quincenal:  b.cuota_quincenal  ?? b['Cuota quincenal'],
    notas:            b.notas,
  };
  const sets = [], vals = [];
  for (const [col, val] of Object.entries(mapping)) {
    if (val !== undefined) { sets.push(`${col} = ?`); vals.push(val); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(id);
  try {
    await db.query(`UPDATE prestamos SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(`${GET_SQL} WHERE p.id = ?`, [id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.patch('/', requireAuth, patchHandler);
router.patch('/:id', requireAuth, patchHandler);
=======
router.patch('/:id', requireAuth, async (req, res) => {
  const campos = ['cuota_quincenal','cuotas_restantes','estado','historial_pagos','notas'];
  const sets = [], vals = [];
  for (const c of campos) {
    if (req.body[c] !== undefined) { sets.push(`${c} = ?`); vals.push(req.body[c]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE prestamos SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM prestamos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
>>>>>>> origin/claude/check-claude-md-file-EC9xe

module.exports = router;
