const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// GET /api/detalle?planilla_id=X      → detalle de una planilla específica (más preciso)
// GET /api/detalle?periodo=X&tipo=Y   → detalle por periodo (legacy)
// GET /api/detalle?empleado_id=X      → historial de quincenas de un empleado
router.get('/', requireAuth, async (req, res) => {
  const { planilla_id, periodo, tipo, empleado_id } = req.query;

  try {
    // ── Historial de empleado ──────────────────────────────────────────────
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

    // ── Por planilla_id (preferido) ────────────────────────────────────────
    if (planilla_id) {
      const tipoFiltro = (req.user.rol === 'Colaborador' && req.user.planillas_acceso)
        ? req.user.planillas_acceso : null;
      const conds = ['d.planilla_id = ?'];
      const params = [planilla_id];
      if (tipoFiltro) { conds.push('d.tipo_planilla = ?'); params.push(tipoFiltro); }
      const [rows] = await db.query(
        `SELECT d.*, e.nombre
         FROM detalle_planilla d
         JOIN empleados e ON d.empleado_id = e.id
         WHERE ${conds.join(' AND ')}
         ORDER BY e.nombre ASC`,
        params
      );
      return res.json(rows);
    }

    // ── Por periodo (legacy, normalizado a YYYY-MM-DD) ─────────────────────
    if (!periodo) return res.status(400).json({ error: 'Se requiere ?planilla_id=, ?periodo= o ?empleado_id=' });
    const periodoNorm = String(periodo).substring(0, 10);
    const conds = ['DATE(d.periodo) = ?'];
    const params = [periodoNorm];
    const tipoFiltro = (req.user.rol === 'Colaborador' && req.user.planillas_acceso)
      ? req.user.planillas_acceso
      : (tipo && tipo !== '—' && tipo !== '') ? tipo : null;
    if (tipoFiltro) { conds.push('d.tipo_planilla = ?'); params.push(tipoFiltro); }
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
