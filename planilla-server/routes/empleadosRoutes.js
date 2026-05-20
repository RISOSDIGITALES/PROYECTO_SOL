const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// GET /api/empleados
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados WHERE activo = 1 ORDER BY nombre ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/empleados
router.post('/', requireAuth, async (req, res) => {
  const { nombre, cargo, tipo_planilla, salario_bruto, inss_base, ir_fijo, email, rol } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO empleados (nombre, cargo, tipo_planilla, salario_bruto, inss_base, ir_fijo, email, rol) VALUES (?,?,?,?,?,?,?,?)',
      [nombre, cargo, tipo_planilla || 'Con Seguro', salario_bruto || 0, inss_base || 'Salario Completo', ir_fijo || 0, email, rol || 'Empleado']
    );
    const [rows] = await db.query('SELECT * FROM empleados WHERE id = ?', [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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

module.exports = router;
