const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireMaster } = require('../auth');

const SALARIO_MINIMO = 10913.54;
const INSS_RATE = 0.07;

// GET /api/planillas
router.get('/', requireAuth, async (req, res) => {
  try {
    const conds = [];
    const params = [];
    if (req.user.rol === 'Planillero' && req.user.planillas_acceso) {
      conds.push('p.tipo = ?');
      params.push(req.user.planillas_acceso);
    }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(
      `SELECT p.id,
        DATE_FORMAT(p.periodo, '%Y-%m-%d') AS \`Período\`,
        p.tipo AS Tipo,
        p.estado AS Estado,
        p.total_bruto AS \`Total bruto\`,
        p.total_deducciones AS \`Total deducciones\`,
        p.total_neto AS \`Total neto\`,
        p.created_at AS \`Fecha de pago\`,
        COUNT(d.id) AS \`Total empleados\`
       FROM planillas p
       LEFT JOIN detalle_planilla d ON p.id = d.planilla_id
       ${where}
       GROUP BY p.id
       ORDER BY p.periodo DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/planillas/calcular — solo Master puede generar planilla global; Planillero solo su tipo
router.post('/calcular', requireAuth, async (req, res) => {
  let { periodo, tipo } = req.body;
  if (!periodo) return res.status(400).json({ error: 'Se requiere periodo (YYYY-MM-DD)' });
  // Planillero solo puede generar su tipo asignado
  if (req.user.rol === 'Planillero' && req.user.planillas_acceso) {
    tipo = req.user.planillas_acceso;
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    let empQuery = 'SELECT * FROM empleados WHERE activo = 1';
    const empParams = [];
    if (tipo) { empQuery += ' AND tipo_planilla = ?'; empParams.push(tipo); }
    const [empleados] = await conn.query(empQuery, empParams);
    if (!empleados.length) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'No hay empleados activos para este tipo' });
    }

    const [adelantos] = await conn.query(
      `SELECT * FROM adelantos WHERE descontar_en = ? AND estado = 'Pendiente' AND pausado = 0`, [periodo]
    );
    // Detectar si es primera quincena del mes (día 15) para préstamos mensuales
    const diaperiodo = parseInt(periodo.slice(-2));
    const isFirstQuincena = diaperiodo <= 15;

    const [prestamos] = await conn.query(`SELECT * FROM prestamos WHERE estado = 'Activo'`);
    const [extras] = await conn.query(`SELECT * FROM extras WHERE pagar_en = ?`, [periodo]);
    const [deducciones] = await conn.query(
      `SELECT * FROM deducciones WHERE descontar_en = ? AND estado = 'Pendiente' AND pausado = 0`, [periodo]
    );

    const byEmp = (arr) => arr.reduce((m, r) => {
      if (!m[r.empleado_id]) m[r.empleado_id] = [];
      m[r.empleado_id].push(r);
      return m;
    }, {});

    const adelantosPor = byEmp(adelantos);
    const prestamosPor = byEmp(prestamos);
    const extrasPor    = byEmp(extras);
    const deduccPor    = byEmp(deducciones);

    const detalles = [];
    let totalBruto = 0, totalDesc = 0, totalNeto = 0;

    for (const emp of empleados) {
      const salarioMensual   = parseFloat(emp.salario_bruto || 0);
      const salarioQuincenal = Math.round(salarioMensual / 2 * 100) / 100;

      let inss = 0;
      if (emp.tipo_planilla !== 'Sin Seguro') {
        const base = emp.inss_base === 'Salario Minimo' ? SALARIO_MINIMO : salarioMensual;
        inss = Math.round(base / 2 * INSS_RATE * 100) / 100;
      }

      const ir           = parseFloat(emp.ir_fijo || 0);
      const empAdel      = adelantosPor[emp.id] || [];
      const descAdelanto = Math.round(empAdel.reduce((s, a) => s + parseFloat(a.monto || 0), 0) * 100) / 100;
      const empPrest     = prestamosPor[emp.id] || [];
      // Préstamos mensuales: descuentan solo en la quincena elegida (día 15 o fin de mes)
      const prestActivos = empPrest.filter(p => {
        if ((p.frecuencia || 'Quincenal') !== 'Mensual') return true;
        const dia = p.frecuencia_dia || '15';
        return dia === '15' ? isFirstQuincena : !isFirstQuincena;
      });
      const descPrestamo = Math.round(prestActivos.reduce((s, p) => {
        const saldo = parseFloat(p.saldo_pendiente ?? p.monto_total ?? 0);
        const cuota = parseFloat(p.cuota_quincenal || 0);
        return s + Math.min(cuota, saldo); // no descontar más de lo que queda
      }, 0) * 100) / 100;
      const empExtras    = extrasPor[emp.id] || [];
      const totalExtras  = Math.round(empExtras.reduce((s, x) => s + parseFloat(x.monto || 0), 0) * 100) / 100;
      const empDed       = deduccPor[emp.id] || [];
      const descDed      = Math.round(empDed.reduce((s, d) => s + parseFloat(d.monto || 0), 0) * 100) / 100;

      const totalDeducciones = Math.round((inss + ir + descAdelanto + descPrestamo + descDed) * 100) / 100;
      const neto             = Math.round((salarioQuincenal + totalExtras - totalDeducciones) * 100) / 100;

      totalBruto += salarioQuincenal + totalExtras;
      totalDesc  += totalDeducciones;
      totalNeto  += neto;

      detalles.push({
        empleado_id: emp.id,
        tipo_planilla: emp.tipo_planilla || 'Con Seguro',
        salario_quincenal: salarioQuincenal, inss, ir,
        desc_adelanto: descAdelanto, desc_prestamo: descPrestamo,
        extras: totalExtras, desc_deducciones: descDed,
        total_deducciones: totalDeducciones, neto,
        adelantosIds:  empAdel.map(a => a.id),
        prestamosData: prestActivos.map(p => ({
          id: p.id,
          cuotas_restantes: p.cuotas_restantes || 0,
          cuota_quincenal:  parseFloat(p.cuota_quincenal  || 0),
          saldo_pendiente:  parseFloat(p.saldo_pendiente ?? p.monto_total ?? 0),
          frecuencia:       p.frecuencia     || 'Quincenal',
          frecuencia_dia:   p.frecuencia_dia || '15',
          historial_pagos:  p.historial_pagos  || '',
        })),
        deduccionesIds: empDed.map(d => d.id),
      });
    }

    totalBruto = Math.round(totalBruto * 100) / 100;
    totalDesc  = Math.round(totalDesc  * 100) / 100;
    totalNeto  = Math.round(totalNeto  * 100) / 100;

    const [planillaResult] = await conn.query(
      'INSERT INTO planillas (periodo, tipo, estado, total_bruto, total_deducciones, total_neto) VALUES (?,?,?,?,?,?)',
      [periodo, tipo || '', 'Borrador', totalBruto, totalDesc, totalNeto]
    );
    const planillaId = planillaResult.insertId;

    for (const d of detalles) {
      await conn.query(
        `INSERT INTO detalle_planilla
         (planilla_id, empleado_id, periodo, tipo_planilla, salario_quincenal, inss, ir,
          desc_prestamo, desc_adelanto, extras, desc_deducciones, total_deducciones, neto)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [planillaId, d.empleado_id, periodo, d.tipo_planilla, d.salario_quincenal,
         d.inss, d.ir, d.desc_prestamo, d.desc_adelanto, d.extras,
         d.desc_deducciones, d.total_deducciones, d.neto]
      );
    }

    const allAdelIds = detalles.flatMap(d => d.adelantosIds);
    if (allAdelIds.length) {
      await conn.query('UPDATE adelantos SET estado = ? WHERE id IN (?)', ['Descontado', allAdelIds]);
    }

    const allDedIds = detalles.flatMap(d => d.deduccionesIds);
    if (allDedIds.length) {
      await conn.query('UPDATE deducciones SET estado = ? WHERE id IN (?)', ['Descontado', allDedIds]);
    }

    for (const d of detalles) {
      for (const p of d.prestamosData) {
        const pagoReal = Math.min(p.cuota_quincenal, p.saldo_pendiente);

        // Registrar el pago en pagos_prestamos (fuente de verdad)
        await conn.query(
          'INSERT INTO pagos_prestamos (prestamo_id, fecha, monto, tipo, concepto) VALUES (?,?,?,?,?)',
          [p.id, periodo, pagoReal, 'Quincena', `Planilla ${periodo}`]
        );

        // Recalcular saldo desde monto_total - suma real de pagos
        const [[{ total_pagado, monto_total }]] = await conn.query(
          `SELECT COALESCE(SUM(pp.monto), 0) AS total_pagado, pr.monto_total
           FROM prestamos pr
           LEFT JOIN pagos_prestamos pp ON pp.prestamo_id = pr.id
           WHERE pr.id = ?
           GROUP BY pr.id`,
          [p.id]
        );
        const saldoFinal   = Math.max(0, Math.round((parseFloat(monto_total) - parseFloat(total_pagado)) * 100) / 100);
        const nuevasCuotas = saldoFinal > 0 ? Math.ceil(saldoFinal / p.cuota_quincenal) : 0;

        await conn.query(
          'UPDATE prestamos SET cuotas_restantes = ?, saldo_pendiente = ?, estado = ? WHERE id = ?',
          [nuevasCuotas, saldoFinal, saldoFinal <= 0 ? 'Pagado' : 'Activo', p.id]
        );
      }
    }

    await conn.commit(); conn.release();

    res.json({ ok: true, planillaId, periodo, tipo: tipo || 'Todos',
      empleados: detalles.length, totalBruto, totalDeducciones: totalDesc, totalNeto });

  } catch (e) {
    await conn.rollback(); conn.release();
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
