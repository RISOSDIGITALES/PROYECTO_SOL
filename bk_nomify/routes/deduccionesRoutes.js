const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE d.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    const [rows] = await db.query(
      `SELECT d.*, e.nombre as empleado_nombre FROM deducciones d
       JOIN empleados e ON d.empleado_id = e.id ${where} ORDER BY d.id DESC`, params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  const { empleado_id, descripcion, monto, descontar_en, fecha_registro } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO deducciones (empleado_id, descripcion, monto, descontar_en, fecha_registro) VALUES (?,?,?,?,?)',
      [empleado_id, descripcion, monto, descontar_en, fecha_registro]
    );
    const [rows] = await db.query('SELECT * FROM deducciones WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', requireAuth, async (req, res) => {
  const campos = ['descripcion','monto','descontar_en','estado','pausado'];
  const sets = [], vals = [];
  for (const c of campos) {
    if (req.body[c] !== undefined) { sets.push(`${c} = ?`); vals.push(req.body[c]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE deducciones SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT * FROM deducciones WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM deducciones WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
