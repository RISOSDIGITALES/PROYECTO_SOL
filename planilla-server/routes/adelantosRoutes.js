const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const GET_SQL = `
  SELECT a.id, e.nombre AS Empleado,
    a.monto AS Monto,
    a.descontar_en AS \`Descontar en quincena\`,
    a.estado AS Estado,
    a.pausado AS Pausado,
    a.fecha_registro AS \`_createdTime\`,
    a.empleado_id
  FROM adelantos a
  JOIN empleados e ON a.empleado_id = e.id`;

router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE a.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    const [rows] = await db.query(`${GET_SQL} ${where} ORDER BY a.id DESC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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
  const monto = b.monto ?? b['Monto'];
  const descontar_en = b.descontar_en ?? b['Descontar en quincena'];
  const fecha_registro = b.fecha_registro ?? new Date().toISOString().split('T')[0];
  try {
    const [r] = await db.query(
      'INSERT INTO adelantos (empleado_id, monto, descontar_en, fecha_registro) VALUES (?,?,?,?)',
      [empleado_id, monto, descontar_en, fecha_registro]
    );
    const [rows] = await db.query(`${GET_SQL} WHERE a.id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  const b = req.body;
  const mapping = {
    monto:        b.monto        ?? b['Monto'],
    descontar_en: b.descontar_en ?? b['Descontar en quincena'],
    estado:       b.estado       ?? b['Estado'],
    pausado:      b.pausado      !== undefined ? b.pausado : b['Pausado'],
  };
  const sets = [], vals = [];
  for (const [col, val] of Object.entries(mapping)) {
    if (val !== undefined) { sets.push(`${col} = ?`); vals.push(val); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(id);
  try {
    await db.query(`UPDATE adelantos SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(`${GET_SQL} WHERE a.id = ?`, [id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.patch('/', requireAuth, patchHandler);
router.patch('/:id', requireAuth, patchHandler);

module.exports = router;
