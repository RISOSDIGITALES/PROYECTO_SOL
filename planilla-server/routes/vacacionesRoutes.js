const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE v.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    const [rows] = await db.query(
      `SELECT v.*, e.nombre as empleado_nombre, e.salario_bruto FROM vacaciones v
       JOIN empleados e ON v.empleado_id = e.id ${where} ORDER BY v.id DESC`, params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  const { empleado_id, tipo, dias, monto, fecha_inicio, fecha_fin, fecha_registro, notas } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO vacaciones (empleado_id, tipo, dias, monto, fecha_inicio, fecha_fin, fecha_registro, notas) VALUES (?,?,?,?,?,?,?,?)',
      [empleado_id, tipo, dias, monto || 0, fecha_inicio, fecha_fin, fecha_registro, notas]
    );
    const [rows] = await db.query('SELECT * FROM vacaciones WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const campos = ['tipo','dias','monto','fecha_inicio','fecha_fin','notas'];
  const sets = [], vals = [];
  for (const c of campos) {
    if (req.body[c] !== undefined) { sets.push(`${c} = ?`); vals.push(req.body[c]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE vacaciones SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM vacaciones WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM vacaciones WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
