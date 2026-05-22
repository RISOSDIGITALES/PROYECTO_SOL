const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// Saldo y cuotas siempre calculados desde pagos_prestamos (fuente de verdad)
const GET_SQL = `
  SELECT p.id, e.nombre AS Empleado,
    p.monto_total AS \`Monto total\`,
    p.cuota_quincenal AS \`Cuota quincenal\`,
    COALESCE(p.frecuencia, 'Quincenal') AS Frecuencia,
    COALESCE(p.frecuencia_dia, '15') AS Frecuencia_Dia,
    p.estado AS Estado,
    p.notas, p.empleado_id,
    GREATEST(0, ROUND(p.monto_total - COALESCE(pg_sum.total_pagado, 0), 2)) AS \`Saldo pendiente\`,
    COALESCE(pg_sum.num_pagos, 0) AS \`Num pagos\`,
    CASE WHEN p.cuota_quincenal > 0
      THEN CEIL(GREATEST(0, p.monto_total - COALESCE(pg_sum.total_pagado, 0)) / p.cuota_quincenal)
      ELSE 0 END AS \`Cuotas restantes\`
  FROM prestamos p
  JOIN empleados e ON p.empleado_id = e.id
  LEFT JOIN (
    SELECT prestamo_id,
           SUM(monto)  AS total_pagado,
           COUNT(*)    AS num_pagos
    FROM pagos_prestamos
    GROUP BY prestamo_id
  ) pg_sum ON pg_sum.prestamo_id = p.id`;

// GET /api/prestamos
router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE p.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    const [rows] = await db.query(`${GET_SQL} ${where} ORDER BY p.id DESC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/prestamos/:id/pagos — historial real de la tabla pagos_prestamos
router.get('/:id/pagos', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, fecha, monto, tipo, concepto, created_at
       FROM pagos_prestamos
       WHERE prestamo_id = ?
       ORDER BY fecha DESC, id DESC`,
      [req.params.id]
    );
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

// POST /api/prestamos
router.post('/', requireAuth, async (req, res) => {
  const b = req.body;
  const empleado_id = await resolveEmpleadoId(db, b);
  if (!empleado_id) return res.status(400).json({ error: 'Empleado requerido' });
  const monto_total      = b.monto_total     ?? b['Monto total'];
  const cuota_quincenal  = b.cuota_quincenal ?? b['Cuota quincenal'];
  const cuotas_restantes = b.cuotas_restantes ?? b['Cuotas restantes'] ?? Math.ceil(monto_total / cuota_quincenal);
  const frecuencia       = b.frecuencia      ?? b['Frecuencia']     ?? 'Quincenal';
  const frecuencia_dia   = b.frecuencia_dia  ?? b['Frecuencia_Dia'] ?? '15';
  const estado           = b.estado          ?? b['Estado']         ?? 'Activo';
  const notas            = b.notas           ?? b['Concepto'];
  try {
    const [r] = await db.query(
      'INSERT INTO prestamos (empleado_id, monto_total, cuota_quincenal, cuotas_restantes, frecuencia, frecuencia_dia, saldo_pendiente, estado, notas) VALUES (?,?,?,?,?,?,?,?,?)',
      [empleado_id, monto_total, cuota_quincenal, cuotas_restantes, frecuencia, frecuencia_dia, monto_total, estado, notas]
    );
    const [rows] = await db.query(`${GET_SQL} WHERE p.id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  const b = req.body;

  // ── PAGO DIRECTO ──────────────────────────────────────────────────────────
  if (b.monto_pagado !== undefined) {
    try {
      const fecha    = b.fecha    || new Date().toISOString().substring(0, 10);
      const tipo     = b.tipo     || 'Abono directo';
      const concepto = b.concepto || '';

      // 1. Registrar el pago en la tabla de pagos
      await db.query(
        'INSERT INTO pagos_prestamos (prestamo_id, fecha, monto, tipo, concepto) VALUES (?,?,?,?,?)',
        [id, fecha, parseFloat(b.monto_pagado), tipo, concepto]
      );

      // 2. Recalcular saldo desde la suma real de pagos
      const [[{ total_pagado }]] = await db.query(
        'SELECT COALESCE(SUM(monto), 0) AS total_pagado FROM pagos_prestamos WHERE prestamo_id = ?',
        [id]
      );
      const [[prestamo]] = await db.query(
        'SELECT monto_total, cuota_quincenal FROM prestamos WHERE id = ?', [id]
      );
      const newSaldo  = Math.max(0, Math.round((parseFloat(prestamo.monto_total) - parseFloat(total_pagado)) * 100) / 100);
      const newCuotas = newSaldo > 0 ? Math.ceil(newSaldo / parseFloat(prestamo.cuota_quincenal)) : 0;
      const newEstado = newSaldo <= 0 ? 'Pagado' : 'Activo';

      // 3. Actualizar campos cacheados en prestamos (para que la planilla los use)
      await db.query(
        'UPDATE prestamos SET saldo_pendiente = ?, cuotas_restantes = ?, estado = ? WHERE id = ?',
        [newSaldo, newCuotas, newEstado, id]
      );

      const [rows] = await db.query(`${GET_SQL} WHERE p.id = ?`, [id]);
      return res.json(rows[0]);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── EDICIÓN REGULAR ───────────────────────────────────────────────────────
  const mapping = {
    cuotas_restantes: b.cuotas_restantes ?? b['Cuotas restantes'],
    saldo_pendiente:  b.saldo_pendiente  ?? b['Saldo pendiente'],
    estado:           b.estado           ?? b['Estado'],
    cuota_quincenal:  b.cuota_quincenal  ?? b['Cuota quincenal'],
    frecuencia:       b.frecuencia       ?? b['Frecuencia'],
    frecuencia_dia:   b.frecuencia_dia   ?? b['Frecuencia_Dia'],
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
