const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireMaster } = require('../auth');

// Lazy-load generador de PDF y mailer — no crashea si no están instalados
let generarReportePlanilla = null;
let pdfFormatPeriodo = null;
try {
  const pdf = require('../pdfGenerator');
  generarReportePlanilla = pdf.generarReportePlanilla;
  pdfFormatPeriodo       = pdf.formatPeriodo;
} catch (_) {}

let enviarReportePlanilla = async () => { throw new Error('Mailer no disponible'); };
try { enviarReportePlanilla = require('../mailer').enviarReportePlanilla; } catch (_) {}

const SALARIO_MINIMO = 10913.54;
const INSS_RATE = 0.07;

// ── Cálculo IR progresivo DGI Nicaragua (sobre ingreso anual neto de INSS) ──
function calcularIRAnual(ingresoAnual) {
  if (ingresoAnual <= 100000) return 0;
  if (ingresoAnual <= 200000) return (ingresoAnual - 100000) * 0.15;
  if (ingresoAnual <= 350000) return 15000 + (ingresoAnual - 200000) * 0.20;
  if (ingresoAnual <= 500000) return 45000 + (ingresoAnual - 350000) * 0.25;
  return 82500 + (ingresoAnual - 500000) * 0.30;
}

// GET /api/planillas
router.get('/', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('p.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(
      `SELECT p.id,
        p.folio AS folio,
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
  let { periodo, tipo, forzar } = req.body;
  if (!periodo) return res.status(400).json({ error: 'Se requiere periodo (YYYY-MM-DD)' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const empresaId = req.empresaId || null;

    // ── Verificar si ya existe planilla para este período y empresa ───────────
    if (!forzar) {
      const tipoFiltro = tipo || null;
      const [[dup]] = await conn.query(
        `SELECT id, folio FROM planillas
         WHERE DATE(periodo) = ? AND empresa_id <=> ?
           AND (? IS NULL OR tipo = ?)`,
        [periodo.substring(0, 10), empresaId, tipoFiltro, tipoFiltro]
      );
      if (dup) {
        await conn.rollback(); conn.release();
        return res.status(409).json({
          error: `Ya existe la planilla #${dup.folio} para este período. Envía { forzar: true } para generar de todas formas.`,
          planilla_existente: dup.id,
          folio: dup.folio,
        });
      }
    }

    let empQuery = 'SELECT * FROM empleados WHERE activo = 1';
    const empParams = [];
    if (tipo) { empQuery += ' AND tipo_planilla = ?'; empParams.push(tipo); }
    if (empresaId) { empQuery += ' AND empresa_id = ?'; empParams.push(empresaId); }
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

      // ── IR según ir_tipo (solo aplica Con Seguro) ─────────────────────────
      let ir = 0;
      const irTipo = emp.ir_tipo || 'Sin IR';
      if (emp.tipo_planilla !== 'Sin Seguro') {
        if (irTipo === 'Fijo') {
          // ir_fijo es mensual → dividir entre 2 para quincenal
          ir = Math.round(parseFloat(emp.ir_fijo || 0) / 2 * 100) / 100;
        } else if (irTipo === 'Automático') {
          // Base para INSS (la misma usada arriba)
          const baseInss = emp.inss_base === 'Salario Minimo' ? SALARIO_MINIMO : salarioMensual;
          const inssLaboral = baseInss * INSS_RATE;
          const salarioNetoMensual = salarioMensual - inssLaboral;
          const ingresoAnual = salarioNetoMensual * 12;
          const irAnual = calcularIRAnual(ingresoAnual);
          ir = Math.round(irAnual / 24 * 100) / 100; // ÷12 meses ÷2 quincenas
        }
      }
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

    // Folio secuencial por empresa (o global si empresa_id es NULL)
    // NULL-safe: empresa_id <=> ? permite comparar con NULL correctamente
    const [[folioRow]] = await conn.query(
      'SELECT COALESCE(MAX(folio), 0) + 1 AS next_folio FROM planillas WHERE empresa_id <=> ?',
      [empresaId]
    );
    const nextFolio = folioRow.next_folio || 1;

    const [planillaResult] = await conn.query(
      'INSERT INTO planillas (periodo, tipo, estado, total_bruto, total_deducciones, total_neto, empresa_id, folio) VALUES (?,?,?,?,?,?,?,?)',
      [periodo, tipo || '', 'Borrador', totalBruto, totalDesc, totalNeto, empresaId, nextFolio]
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

// PATCH /api/planillas/:id/estado — cambia el estado de una planilla
router.patch('/:id/estado', requireAuth, requireMaster, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const ESTADOS = ['Borrador', 'Pagada', 'Anulada'];
  if (!estado || !ESTADOS.includes(estado))
    return res.status(400).json({ error: `Estado inválido. Usa: ${ESTADOS.join(', ')}` });
  try {
    await db.query('UPDATE planillas SET estado = ? WHERE id = ?', [estado, id]);
    const [[row]] = await db.query('SELECT estado, folio FROM planillas WHERE id = ?', [id]);
    res.json({ ok: true, estado: row?.estado, folio: row?.folio });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/planillas/:id/enviar-reporte — genera PDF y lo envía por correo
router.post('/:id/enviar-reporte', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email destinatario requerido' });
  if (!process.env.SMTP_HOST)
    return res.status(400).json({ error: 'SMTP no configurado en el servidor. Agrega las variables de correo en .env' });
  if (!generarReportePlanilla)
    return res.status(500).json({ error: 'pdfkit no instalado — ejecuta npm install en bk_nomify/' });

  try {
    const [[planillaRows], [detalles]] = await Promise.all([
      db.query(`
        SELECT p.*, emp.nombre AS empresa_nombre
        FROM planillas p
        LEFT JOIN empresas emp ON p.empresa_id = emp.id
        WHERE p.id = ?`, [id]),
      db.query(`
        SELECT d.*, e.nombre
        FROM detalle_planilla d
        JOIN empleados e ON d.empleado_id = e.id
        WHERE d.planilla_id = ?
        ORDER BY e.nombre ASC`, [id]),
    ]);

    const planilla = planillaRows[0];
    if (!planilla) return res.status(404).json({ error: 'Planilla no encontrada' });

    const empresa = planilla.empresa_id
      ? { id: planilla.empresa_id, nombre: planilla.empresa_nombre }
      : null;

    const pdfBuffer  = await generarReportePlanilla({ empresa, planilla, detalles });
    const periodoStr = pdfFormatPeriodo ? pdfFormatPeriodo(planilla.periodo) : String(planilla.periodo).substring(0, 10);
    await enviarReportePlanilla(email, null, pdfBuffer, periodoStr);

    res.json({ ok: true, mensaje: `Reporte enviado a ${email}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
