const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const GET_SQL = `
  SELECT x.id, e.nombre AS Empleado,
    x.tipo AS Tipo,
    x.descripcion AS Concepto,
    x.monto AS Monto,
    x.pagar_en AS \`Pagar en quincena\`,
    x.empleado_id
  FROM extras x
  JOIN empleados e ON x.empleado_id = e.id`;

router.get('/', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.query.empleado_id) { conds.push('x.empleado_id = ?'); params.push(req.query.empleado_id); }
    if (req.query.tipo) { conds.push('x.tipo = ?'); params.push(req.query.tipo); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`${GET_SQL} ${where} ORDER BY x.id DESC`, params);
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
  const tipo = b.tipo ?? b['Tipo'];
  const descripcion = b.descripcion ?? b['Descripcion'] ?? b['Concepto'];
  const monto = b.monto ?? b['Monto'];
  const pagar_en = b.pagar_en ?? b['Pagar en quincena'];
  try {
    const [r] = await db.query(
      'INSERT INTO extras (empleado_id, tipo, descripcion, monto, pagar_en) VALUES (?,?,?,?,?)',
      [empleado_id, tipo, descripcion, monto, pagar_en]
    );
    const [rows] = await db.query(`${GET_SQL} WHERE x.id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  const b = req.body;
  const mapping = {
    tipo:        b.tipo        ?? b['Tipo'],
    descripcion: b.descripcion ?? b['Concepto'] ?? b['Descripcion'],
    monto:       b.monto       ?? b['Monto'],
    pagar_en:    b.pagar_en    ?? b['Pagar en quincena'],
  };
  const sets = [], vals = [];
  for (const [col, val] of Object.entries(mapping)) {
    if (val !== undefined) { sets.push(`${col} = ?`); vals.push(val); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(id);
  try {
    await db.query(`UPDATE extras SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(`${GET_SQL} WHERE x.id = ?`, [id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function deleteHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  try {
    await db.query('DELETE FROM extras WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.patch('/', requireAuth, patchHandler);
router.patch('/:id', requireAuth, patchHandler);
router.delete('/', requireAuth, deleteHandler);
router.delete('/:id', requireAuth, deleteHandler);

module.exports = router;
