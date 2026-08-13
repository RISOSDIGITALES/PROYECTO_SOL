const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// GET /api/detalle?periodo=X&tipo=Y   → detalle de una planilla (planilla-detalle.html)
// GET /api/detalle?empleado_id=X      → historial de quincenas de un empleado (mi-recibo.html)
router.get('/', requireAuth, async (req, res) => {
  const { periodo, tipo, empleado_id } = req.query;

  try {
    if (empleado_id) {
      const [rows] = await db.query(
        `SELECT d.*, e.nombre, e.tipo_planilla as emp_tipo_planilla
         FROM detalle_planilla d
         JOIN empleados e ON d.empleado_id = e.id
         WHERE d.empleado_id = ?
         ORDER BY d.periodo DESC`,
        [empleado_id]
      );
      return res.json(rows);
    }

    if (!periodo) return res.status(400).json({ error: 'Se requiere ?periodo= o ?empleado_id=' });

    const conds = ['d.periodo = ?'];
    const params = [periodo];
<<<<<<< HEAD
    const tipoFiltro = (req.user.rol === 'Colaborador' && req.user.planillas_acceso)
      ? req.user.planillas_acceso
      : (tipo && tipo !== '—' && tipo !== '') ? tipo : null;
    if (tipoFiltro) {
      conds.push('d.tipo_planilla = ?');
      params.push(tipoFiltro);
=======
    if (tipo && tipo !== '—' && tipo !== '') {
      conds.push('d.tipo_planilla = ?');
      params.push(tipo);
>>>>>>> origin/claude/check-claude-md-file-EC9xe
    }

    const [rows] = await db.query(
      `SELECT d.*, e.nombre
       FROM detalle_planilla d
       JOIN empleados e ON d.empleado_id = e.id
       WHERE ${conds.join(' AND ')}
       ORDER BY e.nombre ASC`,
      params
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
