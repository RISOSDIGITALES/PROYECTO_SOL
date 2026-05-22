const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// GET /api/recibo?empleado_id=X&periodo=Y
router.get('/', requireAuth, async (req, res) => {
  const { empleado_id, periodo } = req.query;
  if (!empleado_id || !periodo) {
    return res.status(400).json({ error: 'Se requiere ?empleado_id= y ?periodo=' });
  }
  // Empleado solo puede ver su propio recibo
  if (req.user.rol === 'Empleado' && String(req.user.empleado_id) !== String(empleado_id)) {
    return res.status(403).json({ error: 'No autorizado para ver este recibo' });
  }

  const [anio, mes, dia] = periodo.split('-').map(Number);
  const esQ1 = dia <= 15;
  const fechaIni = `${anio}-${String(mes).padStart(2, '0')}-${esQ1 ? '01' : '16'}`;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const fechaFin  = `${anio}-${String(mes).padStart(2, '0')}-${esQ1 ? '15' : String(ultimoDia).padStart(2, '0')}`;

  try {
    const [[empleado], [detalle], [adelantos], [prestamos], [extras], [deducciones], [vacaciones]] = await Promise.all([
      db.query('SELECT * FROM empleados WHERE id = ?', [empleado_id]),
      db.query('SELECT * FROM detalle_planilla WHERE empleado_id = ? AND periodo = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM adelantos WHERE empleado_id = ? AND descontar_en = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM prestamos WHERE empleado_id = ? AND estado = ?', [empleado_id, 'Activo']),
      db.query('SELECT * FROM extras WHERE empleado_id = ? AND pagar_en = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM deducciones WHERE empleado_id = ? AND descontar_en = ?', [empleado_id, periodo]),
      db.query(
        `SELECT * FROM vacaciones
         WHERE empleado_id = ? AND tipo = 'Pagadas'
         AND fecha_inicio >= ? AND fecha_inicio <= ?`,
        [empleado_id, fechaIni, fechaFin]
      ),
    ]);

    res.json({
      empleado:   empleado[0]   || {},
      detalle:    detalle[0]    || {},
      adelantos,
      prestamos,
      extras,
      deducciones,
      vacaciones,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
