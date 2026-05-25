const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireMaster } = require('../auth');

const GET_SQL = `
  SELECT a.id, e.nombre AS Empleado,
    a.monto AS Monto,
    DATE_FORMAT(a.descontar_en, '%Y-%m-%d') AS \`Descontar en quincena\`,
    a.estado AS Estado,
    a.pausado AS Pausado,
    DATE_FORMAT(a.fecha_registro, '%Y-%m-%d') AS \`_createdTime\`,
    a.empleado_id
  FROM adelantos a
  JOIN empleados e ON a.empleado_id = e.id`;

router.get('/', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.query.empleado_id) { conds.push('a.empleado_id = ?'); params.push(req.query.empleado_id); }
    if (req.empresaId) { conds.push('(e.empresa_id = ? OR e.empresa_id IS NULL)'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
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

router.post('/', requireAuth, requireMaster, async (req, res) => {
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

router.patch('/', requireAuth, requireMaster, patchHandler);
router.patch('/:id', requireAuth, requireMaster, patchHandler);

module.exports = router;
