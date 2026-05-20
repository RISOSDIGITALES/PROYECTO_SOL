const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

// GET /api/usuarios — lista empleados con sus datos de acceso
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, cargo, email, rol, planillas_acceso FROM empleados WHERE activo = 1 ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/usuarios/:id — actualiza email, rol, planillas_acceso
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const campos = ['email', 'rol', 'planillas_acceso'];
  const sets = [], vals = [];
  for (const c of campos) {
    if (req.body[c] !== undefined) { sets.push(`${c} = ?`); vals.push(req.body[c]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE empleados SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query('SELECT id, nombre, cargo, email, rol, planillas_acceso FROM empleados WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
