const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, COUNT(d.id) as total_empleados FROM planillas p LEFT JOIN detalle_planilla d ON p.id = d.planilla_id GROUP BY p.id ORDER BY p.periodo DESC'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
