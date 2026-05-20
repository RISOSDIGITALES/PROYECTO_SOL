const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE p.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    const [rows] = await db.query(
      `SELECT p.*, e.nombre as empleado_nombre FROM prestamos p
       JOIN empleados e ON p.empleado_id = e.id ${where} ORDER BY p.id DESC`, params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  const { empleado_id, monto_total, cuota_quincenal, cuotas_restantes, fecha_registro, notas } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO prestamos (empleado_id, monto_total, cuota_quincenal, cuotas_restantes, fecha_registro, notas) VALUES (?,?,?,?,?,?)',
      [empleado_id, monto_total, cuota_quincenal, cuotas_restantes || Math.ceil(monto_total / cuota_quincenal), fecha_registro, notas]
    );
    const [rows] = await db.query('SELECT * FROM prestamos WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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

module.exports = router;
