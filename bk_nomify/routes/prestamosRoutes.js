const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const GET_SQL = `
  SELECT p.id, e.nombre AS Empleado,
    p.monto_total AS \`Monto total\`,
    p.cuota_quincenal AS \`Cuota quincenal\`,
    p.cuotas_restantes AS \`Cuotas restantes\`,
    COALESCE(p.saldo_pendiente, p.monto_total) AS \`Saldo pendiente\`,
    COALESCE(p.frecuencia, 'Quincenal') AS Frecuencia,
    p.estado AS Estado,
    p.historial_pagos AS Historial_Pagos,
    p.notas, p.empleado_id
  FROM prestamos p
  JOIN empleados e ON p.empleado_id = e.id`;

router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE p.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    const [rows] = await db.query(`${GET_SQL} ${where} ORDER BY p.id DESC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function resolveEmpleadoId(db, body) {
  if (body.empleado_id) return body.empleado_id;
  if (body['Empleado']) {
    const [rows] = await db.query('SELECT id FROM empleados WHERE nombre = ?', [body['Empleado']]);
    if (rows.length) return rows[0].id;
  }
  return null;
}

router.post('/', requireAuth, async (req, res) => {
  const b = req.body;
  const empleado_id = await resolveEmpleadoId(db, b);
  if (!empleado_id) return res.status(400).json({ error: 'Empleado requerido' });
  const monto_total     = b.monto_total     ?? b['Monto total'];
  const cuota_quincenal = b.cuota_quincenal ?? b['Cuota quincenal'];
  const cuotas_restantes = b.cuotas_restantes ?? b['Cuotas restantes'] ?? Math.ceil(monto_total / cuota_quincenal);
  const frecuencia      = b.frecuencia      ?? b['Frecuencia'] ?? 'Quincenal';
  const estado          = b.estado          ?? b['Estado']     ?? 'Activo';
  const notas           = b.notas           ?? b['Concepto'];
  try {
    const [r] = await db.query(
      'INSERT INTO prestamos (empleado_id, monto_total, cuota_quincenal, cuotas_restantes, frecuencia, saldo_pendiente, estado, notas) VALUES (?,?,?,?,?,?,?,?)',
      [empleado_id, monto_total, cuota_quincenal, cuotas_restantes, frecuencia, monto_total, estado, notas]
    );
    const [rows] = await db.query(`${GET_SQL} WHERE p.id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  const b = req.body;

  // Flujo de PAGO DIRECTO: si viene monto_pagado, recalcular saldo y cuotas
  if (b.monto_pagado !== undefined) {
    try {
      const [curr] = await db.query(
        'SELECT cuota_quincenal, saldo_pendiente, monto_total FROM prestamos WHERE id = ?', [id]
      );
      if (!curr.length) return res.status(404).json({ error: 'Préstamo no encontrado' });
      const cuota        = parseFloat(curr[0].cuota_quincenal);
      const saldoActual  = parseFloat(curr[0].saldo_pendiente ?? curr[0].monto_total);
      const newSaldo     = Math.max(0, Math.round((saldoActual - parseFloat(b.monto_pagado)) * 100) / 100);
      const newCuotas    = newSaldo > 0 ? Math.ceil(newSaldo / cuota) : 0;
      const newEstado    = newSaldo <= 0 ? 'Pagado' : 'Activo';

      const sets = ['saldo_pendiente = ?', 'cuotas_restantes = ?', 'estado = ?'];
      const vals = [newSaldo, newCuotas, newEstado];
      if (b.historial_pagos !== undefined) { sets.push('historial_pagos = ?'); vals.push(b.historial_pagos); }
      vals.push(id);

      await db.query(`UPDATE prestamos SET ${sets.join(', ')} WHERE id = ?`, vals);
      const [rows] = await db.query(`${GET_SQL} WHERE p.id = ?`, [id]);
      return res.json(rows[0]);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Edición regular de datos del préstamo
  const mapping = {
    historial_pagos:  b.historial_pagos  ?? b['Historial_Pagos'],
    cuotas_restantes: b.cuotas_restantes ?? b['Cuotas restantes'],
    saldo_pendiente:  b.saldo_pendiente  ?? b['Saldo pendiente'],
    estado:           b.estado           ?? b['Estado'],
    cuota_quincenal:  b.cuota_quincenal  ?? b['Cuota quincenal'],
    frecuencia:       b.frecuencia       ?? b['Frecuencia'],
    notas:            b.notas,
  };
  const sets = [], vals = [];
  for (const [col, val] of Object.entries(mapping)) {
    if (val !== undefined) { sets.push(`${col} = ?`); vals.push(val); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(id);
  try {
    await db.query(`UPDATE prestamos SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(`${GET_SQL} WHERE p.id = ?`, [id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.patch('/', requireAuth, patchHandler);
router.patch('/:id', requireAuth, patchHandler);

module.exports = router;
