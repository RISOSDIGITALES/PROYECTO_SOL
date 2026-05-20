const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.query.empleado_id) { conds.push('x.empleado_id = ?'); params.push(req.query.empleado_id); }
    if (req.query.tipo) { conds.push('x.tipo = ?'); params.push(req.query.tipo); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(
      `SELECT x.*, e.nombre as empleado_nombre FROM extras x
       JOIN empleados e ON x.empleado_id = e.id ${where} ORDER BY x.id DESC`, params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  const { empleado_id, tipo, descripcion, monto, pagar_en, fecha_registro } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO extras (empleado_id, tipo, descripcion, monto, pagar_en, fecha_registro) VALUES (?,?,?,?,?,?)',
      [empleado_id, tipo, descripcion, monto, pagar_en, fecha_registro]
    );
    const [rows] = await db.query('SELECT * FROM extras WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const campos = ['tipo','descripcion','monto','pagar_en'];
  const sets = [], vals = [];
  for (const c of campos) {
    if (req.body[c] !== undefined) { sets.push(`${c} = ?`); vals.push(req.body[c]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE extras SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM extras WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM extras WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
