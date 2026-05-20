const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE a.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    const [rows] = await db.query(
      `SELECT a.*, e.nombre as empleado_nombre FROM adelantos a
       JOIN empleados e ON a.empleado_id = e.id ${where} ORDER BY a.id DESC`, params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  const { empleado_id, monto, descontar_en, fecha_registro, notas } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO adelantos (empleado_id, monto, descontar_en, fecha_registro, notas) VALUES (?,?,?,?,?)',
      [empleado_id, monto, descontar_en, fecha_registro, notas]
    );
    const [rows] = await db.query('SELECT * FROM adelantos WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const campos = ['monto','descontar_en','estado','pausado','notas'];
  const sets = [], vals = [];
  for (const c of campos) {
    if (req.body[c] !== undefined) { sets.push(`${c} = ?`); vals.push(req.body[c]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE adelantos SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM adelantos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
