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
let enviarNotifPlanillaPagada = async () => {};
try {
  const mailer = require('../mailer');
  enviarReportePlanilla    = mailer.enviarReportePlanilla;
  enviarNotifPlanillaPagada = mailer.enviarNotifPlanillaPagada;
} catch (_) {}

const SALARIO_MINIMO      = 10913.54;
const INSS_RATE           = 0.07;   // laboral (empleado)
const INSS_PATRONAL_RATE  = 0.215;  // patronal (empresa) — tasa vigente Nicaragua
const INATEC_RATE         = 0.02;   // aporte patronal al INATEC

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
    const conds = ["p.estado != 'Papelera'"], params = [];
    if (req.empresaId) { conds.push('p.empresa_id = ?'); params.push(req.empresaId); }
    const where = 'WHERE ' + conds.join(' AND ');
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
       ORDER BY p.periodo DESC, p.id DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Calcula meses trabajados en el año para aguinaldo ────────────────────────
function calcMesesAguinaldo(fechaIngreso, anio) {
  const anioNum  = parseInt(anio);
  const refInicio = new Date(anioNum, 0, 1);   // 1 ene del año
  const refFin    = new Date(anioNum, 11, 1);  // 1 dic del año (base de cálculo)
  const desde     = fechaIngreso ? new Date(fechaIngreso) : refInicio;
  const inicioReal = desde > refInicio ? desde : refInicio;
  if (inicioReal > refFin) return 0;
  // Meses completos entre inicioReal y 1-dic
  const meses = (refFin.getFullYear() - inicioReal.getFullYear()) * 12
    + refFin.getMonth() - inicioReal.getMonth();
  return Math.min(12, Math.max(0, meses));
}

// POST /api/planillas/calcular — solo Master puede generar planilla global; Planillero solo su tipo
router.post('/calcular', requireAuth, async (req, res) => {
  let { periodo, tipo, forzar } = req.body;
  if (!periodo) return res.status(400).json({ error: 'Se requiere periodo (YYYY-MM-DD)' });

  // ── Desviar a rutas especiales ───────────────────────────────────────────────
  if (tipo === 'Aguinaldo') return calcularAguinaldo(req, res, periodo, forzar);
  if (tipo === 'Mensual' || (tipo || '').endsWith('Mensual')) return calcularMensual(req, res, periodo, tipo, forzar);

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
           AND (? IS NULL OR tipo = ?) AND estado = 'Pagada'`,
        [periodo.substring(0, 10), empresaId, tipoFiltro, tipoFiltro]
      );
      if (dup) {
        await conn.rollback(); conn.release();
        return res.status(409).json({
          error: `Ya existe la planilla pagada #${dup.folio} para este período. No se puede regenerar.`,
          planilla_existente: dup.id,
          folio: dup.folio,
        });
      }
    }

    // Leer config de la empresa (inatec_activo)
    let inatecActivo = true;
    if (empresaId) {
      const [[empCfg]] = await conn.query('SELECT inatec_activo FROM empresas WHERE id = ?', [empresaId]);
      if (empCfg && empCfg.inatec_activo === 0) inatecActivo = false;
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

      // ── Costo patronal (no afecta el neto del empleado) ──────────────────
      let inss_patronal = 0, inatec = 0;
      if (emp.tipo_planilla !== 'Sin Seguro') {
        const basePatronal = emp.inss_base === 'Salario Minimo' ? SALARIO_MINIMO : salarioMensual;
        inss_patronal = Math.round(basePatronal / 2 * INSS_PATRONAL_RATE * 100) / 100;
      }
      inatec = inatecActivo ? Math.round(salarioQuincenal * INATEC_RATE * 100) / 100 : 0;
      const costoEmpresa = Math.round((salarioQuincenal + inss_patronal + inatec) * 100) / 100;

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
        inss_patronal, inatec, costo_empresa: costoEmpresa,
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
    const totalInssPatronal = Math.round(detalles.reduce((s,d) => s + (d.inss_patronal||0), 0) * 100) / 100;
    const totalInatec       = Math.round(detalles.reduce((s,d) => s + (d.inatec||0), 0) * 100) / 100;
    const costoTotalEmpresa = Math.round((totalBruto + totalInssPatronal + totalInatec) * 100) / 100;

    // Folio secuencial por empresa
    const [[folioRow]] = await conn.query(
      'SELECT COALESCE(MAX(folio), 0) + 1 AS next_folio FROM planillas WHERE empresa_id <=> ?',
      [empresaId]
    );
    const nextFolio = folioRow.next_folio || 1;

    const [planillaResult] = await conn.query(
      `INSERT INTO planillas
       (periodo, tipo, estado, total_bruto, total_deducciones, total_neto,
        total_inss_patronal, total_inatec, costo_total_empresa, empresa_id, folio)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [periodo, tipo || '', 'Borrador', totalBruto, totalDesc, totalNeto,
       totalInssPatronal, totalInatec, costoTotalEmpresa, empresaId, nextFolio]
    );
    const planillaId = planillaResult.insertId;

    for (const d of detalles) {
      await conn.query(
        `INSERT INTO detalle_planilla
         (planilla_id, empleado_id, periodo, tipo_planilla, salario_quincenal, inss, ir,
          desc_prestamo, desc_adelanto, extras, desc_deducciones, total_deducciones, neto,
          inss_patronal, inatec, adelantos_ids, deducciones_ids, prestamos_data)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [planillaId, d.empleado_id, periodo, d.tipo_planilla, d.salario_quincenal,
         d.inss, d.ir, d.desc_prestamo, d.desc_adelanto, d.extras,
         d.desc_deducciones, d.total_deducciones, d.neto, d.inss_patronal, d.inatec,
         JSON.stringify(d.adelantosIds),
         JSON.stringify(d.deduccionesIds),
         JSON.stringify(d.prestamosData)]
      );
    }

    await conn.commit(); conn.release();

    res.json({ ok: true, planillaId, periodo, tipo: tipo || 'Todos',
      empleados: detalles.length, totalBruto, totalDeducciones: totalDesc, totalNeto,
      totalInssPatronal, totalInatec, costoTotalEmpresa });

  } catch (e) {
    await conn.rollback(); conn.release();
    res.status(500).json({ error: e.message });
  }
});

// ── Aguinaldo (13° mes) ────────────────────────────────────────────────────────
async function calcularAguinaldo(req, res, periodo, forzar) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const empresaId = req.empresaId || null;
    const anio = String(periodo).substring(0, 4);

    // Verificar duplicado (tipo='Aguinaldo' para este año y empresa)
    if (!forzar) {
      const [[dup]] = await conn.query(
        `SELECT id, folio FROM planillas
         WHERE YEAR(periodo) = ? AND tipo = 'Aguinaldo' AND empresa_id <=> ? AND estado = 'Pagada'`,
        [anio, empresaId]
      );
      if (dup) {
        await conn.rollback(); conn.release();
        return res.status(409).json({
          error: `Ya existe el aguinaldo pagado #${dup.folio} para ${anio}. No se puede regenerar.`,
          planilla_existente: dup.id, folio: dup.folio,
        });
      }
    }

    let empQuery = 'SELECT * FROM empleados WHERE activo = 1';
    const empParams = [];
    if (empresaId) { empQuery += ' AND empresa_id = ?'; empParams.push(empresaId); }
    const [empleados] = await conn.query(empQuery, empParams);
    if (!empleados.length) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'No hay empleados activos' });
    }

    const detalles = [];
    let totalAguinaldo = 0;

    for (const emp of empleados) {
      const salarioMensual = parseFloat(emp.salario_bruto || 0);
      const meses = calcMesesAguinaldo(emp.fecha_ingreso, anio);
      if (meses <= 0) continue; // no trabajó en este año

      const aguinaldo = Math.round(salarioMensual * (meses / 12) * 100) / 100;
      totalAguinaldo += aguinaldo;

      detalles.push({
        empleado_id: emp.id,
        tipo_planilla: emp.tipo_planilla || 'Con Seguro',
        salario_quincenal: aguinaldo,  // reutilizamos el campo para el monto
        inss: 0, ir: 0,
        desc_prestamo: 0, desc_adelanto: 0,
        extras: 0, desc_deducciones: 0,
        total_deducciones: 0,
        neto: aguinaldo,
        inss_patronal: 0, inatec: 0,
        meses_trabajados: meses,
      });
    }

    if (!detalles.length) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'Ningún empleado tiene meses trabajados en ' + anio });
    }

    totalAguinaldo = Math.round(totalAguinaldo * 100) / 100;

    const [[folioRow]] = await conn.query(
      'SELECT COALESCE(MAX(folio), 0) + 1 AS next_folio FROM planillas WHERE empresa_id <=> ?',
      [empresaId]
    );

    const [r] = await conn.query(
      `INSERT INTO planillas
       (periodo, tipo, estado, total_bruto, total_deducciones, total_neto,
        total_inss_patronal, total_inatec, costo_total_empresa, empresa_id, folio)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [`${anio}-12-01`, 'Aguinaldo', 'Borrador',
       totalAguinaldo, 0, totalAguinaldo, 0, 0, totalAguinaldo,
       empresaId, folioRow.next_folio || 1]
    );
    const planillaId = r.insertId;

    for (const d of detalles) {
      await conn.query(
        `INSERT INTO detalle_planilla
         (planilla_id, empleado_id, periodo, tipo_planilla, salario_quincenal, inss, ir,
          desc_prestamo, desc_adelanto, extras, desc_deducciones, total_deducciones, neto,
          inss_patronal, inatec, meses_trabajados)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [planillaId, d.empleado_id, `${anio}-12-01`, d.tipo_planilla,
         d.salario_quincenal, 0, 0, 0, 0, 0, 0, 0, d.neto, 0, 0, d.meses_trabajados]
      );
    }

    await conn.commit(); conn.release();
    res.json({
      ok: true, planillaId, anio, tipo: 'Aguinaldo',
      empleados: detalles.length, totalAguinaldo,
    });
  } catch (e) {
    await conn.rollback(); conn.release();
    res.status(500).json({ error: e.message });
  }
}

// ── Planilla Mensual ──────────────────────────────────────────────────────────
async function calcularMensual(req, res, periodo, tipo, forzar) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const empresaId = req.empresaId || null;
    const [anioStr, mesStr] = (periodo || '').substring(0, 7).split('-');
    const anio = parseInt(anioStr);
    const mes  = parseInt(mesStr);
    if (!anio || !mes) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'Período inválido. Usa formato YYYY-MM o YYYY-MM-DD' });
    }
    const periodoNorm = `${anio}-${String(mes).padStart(2,'0')}-01`;

    // Determinar tipo base (Con Seguro / Sin Seguro / null) y tipo a guardar
    const tipoBase   = (tipo && tipo !== 'Mensual') ? tipo.replace(' Mensual', '') : null;
    const tipoGuardar = tipoBase ? `${tipoBase} Mensual` : 'Mensual';

    // ── Duplicado mensual: mismo año+mes+tipo ────────────────────────────────
    if (!forzar) {
      const [[dup]] = await conn.query(
        `SELECT id, folio FROM planillas
         WHERE YEAR(periodo) = ? AND MONTH(periodo) = ?
         AND empresa_id <=> ? AND tipo = ? AND estado = 'Pagada'`,
        [anio, mes, empresaId, tipoGuardar]
      );
      if (dup) {
        await conn.rollback(); conn.release();
        return res.status(409).json({
          error: `Ya existe la planilla mensual pagada #${dup.folio} para ${String(mes).padStart(2,'0')}/${anio}. No se puede regenerar.`,
          planilla_existente: dup.id, folio: dup.folio,
        });
      }
    }

    // ── Config empresa (INATEC) ───────────────────────────────────────────────
    let inatecActivo = true;
    if (empresaId) {
      const [[empCfg]] = await conn.query('SELECT inatec_activo FROM empresas WHERE id = ?', [empresaId]);
      if (empCfg && empCfg.inatec_activo === 0) inatecActivo = false;
    }

    // ── Empleados activos ─────────────────────────────────────────────────────
    let empQuery = 'SELECT * FROM empleados WHERE activo = 1';
    const empParams = [];
    if (tipoBase)   { empQuery += ' AND tipo_planilla = ?'; empParams.push(tipoBase); }
    if (empresaId)  { empQuery += ' AND empresa_id = ?';    empParams.push(empresaId); }
    const [empleados] = await conn.query(empQuery, empParams);
    if (!empleados.length) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'No hay empleados activos para este tipo' });
    }

    // ── Cargar deducciones del mes completo ───────────────────────────────────
    const [adelantos] = await conn.query(
      `SELECT * FROM adelantos
       WHERE YEAR(descontar_en) = ? AND MONTH(descontar_en) = ?
       AND estado = 'Pendiente' AND pausado = 0`,
      [anio, mes]
    );
    const [prestamos] = await conn.query(`SELECT * FROM prestamos WHERE estado = 'Activo'`);
    const [extras] = await conn.query(
      `SELECT * FROM extras WHERE YEAR(pagar_en) = ? AND MONTH(pagar_en) = ?`,
      [anio, mes]
    );
    const [deducciones] = await conn.query(
      `SELECT * FROM deducciones
       WHERE YEAR(descontar_en) = ? AND MONTH(descontar_en) = ?
       AND estado = 'Pendiente' AND pausado = 0`,
      [anio, mes]
    );

    const byEmp = (arr) => arr.reduce((m, r) => {
      if (!m[r.empleado_id]) m[r.empleado_id] = [];
      m[r.empleado_id].push(r); return m;
    }, {});

    const adelantosPor = byEmp(adelantos);
    const prestamosPor = byEmp(prestamos);
    const extrasPor    = byEmp(extras);
    const deduccPor    = byEmp(deducciones);

    const detalles = [];
    let totalBruto = 0, totalDesc = 0, totalNeto = 0;

    for (const emp of empleados) {
      const salarioMensual = parseFloat(emp.salario_bruto || 0);

      // INSS mensual completo (no /2)
      let inss = 0;
      if (emp.tipo_planilla !== 'Sin Seguro') {
        const base = emp.inss_base === 'Salario Minimo' ? SALARIO_MINIMO : salarioMensual;
        inss = Math.round(base * INSS_RATE * 100) / 100;
      }

      // IR mensual (÷12, no ÷24)
      let ir = 0;
      const irTipo = emp.ir_tipo || 'Sin IR';
      if (emp.tipo_planilla !== 'Sin Seguro') {
        if (irTipo === 'Fijo') {
          ir = Math.round(parseFloat(emp.ir_fijo || 0) * 100) / 100;
        } else if (irTipo === 'Automático') {
          const baseInss = emp.inss_base === 'Salario Minimo' ? SALARIO_MINIMO : salarioMensual;
          const inssLaboral = baseInss * INSS_RATE;
          const ingresoAnual = (salarioMensual - inssLaboral) * 12;
          ir = Math.round(calcularIRAnual(ingresoAnual) / 12 * 100) / 100;
        }
      }

      // Adelantos del mes
      const empAdel      = adelantosPor[emp.id] || [];
      const descAdelanto = Math.round(empAdel.reduce((s, a) => s + parseFloat(a.monto || 0), 0) * 100) / 100;

      // Préstamos: quincenal → 2 cuotas/mes, mensual → 1 cuota/mes
      const empPrest     = prestamosPor[emp.id] || [];
      const descPrestamo = Math.round(empPrest.reduce((s, p) => {
        const saldo      = parseFloat(p.saldo_pendiente ?? p.monto_total ?? 0);
        const cuota      = parseFloat(p.cuota_quincenal || 0);
        const cuotasMes  = (p.frecuencia || 'Quincenal') === 'Mensual' ? 1 : 2;
        return s + Math.min(cuota * cuotasMes, saldo);
      }, 0) * 100) / 100;

      const empExtras    = extrasPor[emp.id] || [];
      const totalExtras  = Math.round(empExtras.reduce((s, x) => s + parseFloat(x.monto || 0), 0) * 100) / 100;
      const empDed       = deduccPor[emp.id] || [];
      const descDed      = Math.round(empDed.reduce((s, d) => s + parseFloat(d.monto || 0), 0) * 100) / 100;

      const totalDeducciones = Math.round((inss + ir + descAdelanto + descPrestamo + descDed) * 100) / 100;
      const neto             = Math.round((salarioMensual + totalExtras - totalDeducciones) * 100) / 100;

      // Patronal mensual completo
      let inss_patronal = 0, inatec = 0;
      if (emp.tipo_planilla !== 'Sin Seguro') {
        const basePatronal = emp.inss_base === 'Salario Minimo' ? SALARIO_MINIMO : salarioMensual;
        inss_patronal = Math.round(basePatronal * INSS_PATRONAL_RATE * 100) / 100;
      }
      inatec = inatecActivo ? Math.round(salarioMensual * INATEC_RATE * 100) / 100 : 0;
      const costoEmpresa = Math.round((salarioMensual + inss_patronal + inatec) * 100) / 100;

      totalBruto += salarioMensual + totalExtras;
      totalDesc  += totalDeducciones;
      totalNeto  += neto;

      detalles.push({
        empleado_id: emp.id,
        tipo_planilla: emp.tipo_planilla || 'Con Seguro',
        salario_quincenal: salarioMensual, // campo reutilizado para monto mensual
        inss, ir,
        desc_adelanto: descAdelanto, desc_prestamo: descPrestamo,
        extras: totalExtras, desc_deducciones: descDed,
        total_deducciones: totalDeducciones, neto,
        inss_patronal, inatec, costo_empresa: costoEmpresa,
        adelantosIds:  empAdel.map(a => a.id),
        prestamosData: empPrest.map(p => ({
          id: p.id,
          cuota_quincenal:  parseFloat(p.cuota_quincenal  || 0),
          saldo_pendiente:  parseFloat(p.saldo_pendiente ?? p.monto_total ?? 0),
          frecuencia:       p.frecuencia || 'Quincenal',
        })),
        deduccionesIds: empDed.map(d => d.id),
      });
    }

    totalBruto = Math.round(totalBruto * 100) / 100;
    totalDesc  = Math.round(totalDesc  * 100) / 100;
    totalNeto  = Math.round(totalNeto  * 100) / 100;
    const totalInssPatronal = Math.round(detalles.reduce((s,d) => s + (d.inss_patronal||0), 0) * 100) / 100;
    const totalInatec       = Math.round(detalles.reduce((s,d) => s + (d.inatec||0), 0) * 100) / 100;
    const costoTotalEmpresa = Math.round((totalBruto + totalInssPatronal + totalInatec) * 100) / 100;

    const [[folioRow]] = await conn.query(
      'SELECT COALESCE(MAX(folio), 0) + 1 AS next_folio FROM planillas WHERE empresa_id <=> ?',
      [empresaId]
    );

    const [planillaResult] = await conn.query(
      `INSERT INTO planillas
       (periodo, tipo, estado, total_bruto, total_deducciones, total_neto,
        total_inss_patronal, total_inatec, costo_total_empresa, empresa_id, folio)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [periodoNorm, tipoGuardar, 'Borrador', totalBruto, totalDesc, totalNeto,
       totalInssPatronal, totalInatec, costoTotalEmpresa, empresaId, folioRow.next_folio || 1]
    );
    const planillaId = planillaResult.insertId;

    for (const d of detalles) {
      await conn.query(
        `INSERT INTO detalle_planilla
         (planilla_id, empleado_id, periodo, tipo_planilla, salario_quincenal, inss, ir,
          desc_prestamo, desc_adelanto, extras, desc_deducciones, total_deducciones, neto,
          inss_patronal, inatec, adelantos_ids, deducciones_ids, prestamos_data)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [planillaId, d.empleado_id, periodoNorm, d.tipo_planilla, d.salario_quincenal,
         d.inss, d.ir, d.desc_prestamo, d.desc_adelanto, d.extras,
         d.desc_deducciones, d.total_deducciones, d.neto, d.inss_patronal, d.inatec,
         JSON.stringify(d.adelantosIds),
         JSON.stringify(d.deduccionesIds),
         JSON.stringify(d.prestamosData)]
      );
    }

    await conn.commit(); conn.release();
    res.json({
      ok: true, planillaId, periodo: periodoNorm, tipo: tipoGuardar,
      empleados: detalles.length, totalBruto, totalDeducciones: totalDesc, totalNeto,
      totalInssPatronal, totalInatec, costoTotalEmpresa,
    });
  } catch (e) {
    await conn.rollback(); conn.release();
    res.status(500).json({ error: e.message });
  }
}

// PATCH /api/planillas/:id/estado — cambia el estado de una planilla
router.patch('/:id/estado', requireAuth, requireMaster, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const ESTADOS = ['Borrador', 'Pagada', 'Anulada'];
  if (!estado || !ESTADOS.includes(estado))
    return res.status(400).json({ error: `Estado inválido. Usa: ${ESTADOS.join(', ')}` });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[planilla]] = await conn.query('SELECT estado, periodo, tipo FROM planillas WHERE id = ?', [id]);
    if (!planilla) { await conn.rollback(); conn.release(); return res.status(404).json({ error: 'Planilla no encontrada' }); }
    if (planilla.estado === 'Pagada') { await conn.rollback(); conn.release(); return res.status(400).json({ error: 'La planilla ya está pagada y no puede modificarse' }); }

    // Al marcar Pagada: aplicar todos los descuentos guardados en el snapshot
    if (estado === 'Pagada') {
      const [detalles] = await conn.query(
        'SELECT * FROM detalle_planilla WHERE planilla_id = ?', [id]
      );
      const periodo = planilla.periodo instanceof Date
        ? planilla.periodo.toISOString().substring(0, 10)
        : String(planilla.periodo).substring(0, 10);
      const esMensual = (planilla.tipo || '').includes('Mensual');
      const concepto  = esMensual
        ? `Planilla Mensual ${periodo.substring(0, 7)}`
        : `Planilla ${periodo}`;

      const allAdelIds = [], allDedIds = [];
      for (const d of detalles) {
        const adelIds = d.adelantos_ids  ? JSON.parse(d.adelantos_ids)  : [];
        const dedIds  = d.deducciones_ids ? JSON.parse(d.deducciones_ids) : [];
        allAdelIds.push(...adelIds);
        allDedIds.push(...dedIds);

        const presData = d.prestamos_data ? JSON.parse(d.prestamos_data) : [];
        const descTotal = parseFloat(d.desc_prestamo || 0);

        // Distribuir desc_prestamo (puede haber sido editado) proporcionalmente
        const sumaCuotas = presData.reduce((s, p) => s + Math.min(parseFloat(p.cuota_quincenal || 0), parseFloat(p.saldo_pendiente || 0)), 0);
        for (const p of presData) {
          const cuota     = parseFloat(p.cuota_quincenal || 0);
          const saldo     = parseFloat(p.saldo_pendiente || 0);
          const cuotaBase = Math.min(cuota, saldo);
          const pagoReal  = sumaCuotas > 0
            ? Math.round(descTotal * (cuotaBase / sumaCuotas) * 100) / 100
            : 0;
          if (pagoReal <= 0) continue;

          await conn.query(
            'INSERT INTO pagos_prestamos (prestamo_id, fecha, monto, tipo, concepto) VALUES (?,?,?,?,?)',
            [p.id, periodo, pagoReal, esMensual ? 'Mensual' : 'Quincena', concepto]
          );
          const [[{ total_pagado, monto_total }]] = await conn.query(
            `SELECT COALESCE(SUM(pp.monto),0) AS total_pagado, pr.monto_total
             FROM prestamos pr LEFT JOIN pagos_prestamos pp ON pp.prestamo_id = pr.id
             WHERE pr.id = ? GROUP BY pr.id`, [p.id]
          );
          const saldoFinal   = Math.max(0, Math.round((parseFloat(monto_total) - parseFloat(total_pagado)) * 100) / 100);
          const nuevasCuotas = saldoFinal > 0 ? Math.ceil(saldoFinal / cuota) : 0;
          await conn.query(
            'UPDATE prestamos SET cuotas_restantes = ?, saldo_pendiente = ?, estado = ? WHERE id = ?',
            [nuevasCuotas, saldoFinal, saldoFinal <= 0 ? 'Pagado' : 'Activo', p.id]
          );
        }
      }

      if (allAdelIds.length)
        await conn.query('UPDATE adelantos SET estado = ? WHERE id IN (?)', ['Descontado', allAdelIds]);
      if (allDedIds.length)
        await conn.query('UPDATE deducciones SET estado = ? WHERE id IN (?)', ['Descontado', allDedIds]);
    }

    await conn.query('UPDATE planillas SET estado = ? WHERE id = ?', [estado, id]);
    await conn.commit(); conn.release();
    const [[row]] = await db.query('SELECT estado, folio, periodo, tipo, empresa_id FROM planillas WHERE id = ?', [id]);

    // Notificar usuarios configurados cuando se marca Pagada
    if (estado === 'Pagada' && row?.empresa_id) {
      try {
        const [[emp]] = await db.query('SELECT notif_usuarios FROM empresas WHERE id = ?', [row.empresa_id]);
        const notifIds = emp?.notif_usuarios ? JSON.parse(emp.notif_usuarios) : [];
        if (notifIds.length) {
          const [usuarios] = await db.query(`SELECT nombre, email FROM usuarios WHERE id IN (?) AND email IS NOT NULL`, [notifIds]);
          const periodoStr = String(row.periodo).substring(0, 10);
          for (const u of usuarios) {
            try {
              await enviarNotifPlanillaPagada(u.email, u.nombre, { folio: row.folio, tipo: row.tipo, periodo: periodoStr });
            } catch(_) {}
          }
        }
      } catch(_) {}
    }

    res.json({ ok: true, estado: row?.estado, folio: row?.folio });
  } catch (e) {
    await conn.rollback(); conn.release();
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/planillas/:id — mover a Papelera (solo si está en Borrador)
router.delete('/:id', requireAuth, requireMaster, async (req, res) => {
  const { id } = req.params;
  try {
    const [[planilla]] = await db.query('SELECT estado, folio FROM planillas WHERE id = ?', [id]);
    if (!planilla) return res.status(404).json({ error: 'Planilla no encontrada' });
    if (planilla.estado !== 'Borrador')
      return res.status(400).json({ error: 'Solo se pueden eliminar planillas en estado Borrador' });
    await db.query("UPDATE planillas SET estado = 'Papelera' WHERE id = ?", [id]);
    res.json({ ok: true, mensaje: `Planilla #${planilla.folio} enviada a la papelera` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/planillas/papelera — planillas en la papelera
router.get('/papelera', requireAuth, requireMaster, async (req, res) => {
  try {
    const params = [];
    const conds = ["p.estado = 'Papelera'"];
    if (req.empresaId) { conds.push('p.empresa_id = ?'); params.push(req.empresaId); }
    const [rows] = await db.query(
      `SELECT p.id, p.folio, DATE_FORMAT(p.periodo,'%Y-%m-%d') AS periodo,
              p.tipo, p.total_bruto, p.total_neto, p.created_at
       FROM planillas p
       WHERE ${conds.join(' AND ')}
       ORDER BY p.id DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/planillas/:id — datos de una planilla específica
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT p.*, emp.nombre AS empresa_nombre
       FROM planillas p LEFT JOIN empresas emp ON p.empresa_id = emp.id
       WHERE p.id = ?`, [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Planilla no encontrada' });
    res.json(row);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/planillas/:id/detalle/:detalleId — editar fila de detalle (solo Borrador)
router.patch('/:id/detalle/:detalleId', requireAuth, requireMaster, async (req, res) => {
  const { id, detalleId } = req.params;
  const { desc_prestamo, desc_adelanto, extras, desc_deducciones } = req.body;
  try {
    const [[planilla]] = await db.query('SELECT estado FROM planillas WHERE id = ?', [id]);
    if (!planilla) return res.status(404).json({ error: 'Planilla no encontrada' });
    if (planilla.estado !== 'Borrador')
      return res.status(400).json({ error: 'Solo se puede editar una planilla en estado Borrador' });

    const [[det]] = await db.query('SELECT * FROM detalle_planilla WHERE id = ? AND planilla_id = ?', [detalleId, id]);
    if (!det) return res.status(404).json({ error: 'Fila de detalle no encontrada' });

    const p  = (v, fallback) => v !== undefined ? Math.round(parseFloat(v) * 100) / 100 : parseFloat(fallback || 0);
    const dPrest = p(desc_prestamo,  det.desc_prestamo);
    const dAdel  = p(desc_adelanto,  det.desc_adelanto);
    const dExtra = p(extras,         det.extras);
    const dDed   = p(desc_deducciones, det.desc_deducciones);
    const totalDesc = Math.round((parseFloat(det.inss||0) + parseFloat(det.ir||0) + dPrest + dAdel + dDed) * 100) / 100;
    const neto      = Math.round((parseFloat(det.salario_quincenal||0) + dExtra - totalDesc) * 100) / 100;

    await db.query(
      `UPDATE detalle_planilla SET desc_prestamo=?, desc_adelanto=?, extras=?, desc_deducciones=?, total_deducciones=?, neto=?
       WHERE id = ?`,
      [dPrest, dAdel, dExtra, dDed, totalDesc, neto, detalleId]
    );

    // Recalcular totales de la planilla cabecera
    const [[totales]] = await db.query(
      `SELECT SUM(salario_quincenal+extras) AS bruto, SUM(total_deducciones) AS total_desc, SUM(neto) AS neto,
              SUM(inss_patronal) AS patronal, SUM(inatec) AS inatec
       FROM detalle_planilla WHERE planilla_id = ?`, [id]
    );
    const tBruto  = Math.round((parseFloat(totales.bruto      ||0)) * 100) / 100;
    const tDesc   = Math.round((parseFloat(totales.total_desc ||0)) * 100) / 100;
    const tNeto   = Math.round((parseFloat(totales.neto   ||0)) * 100) / 100;
    const tPatr   = Math.round((parseFloat(totales.patronal||0)) * 100) / 100;
    const tInatec = Math.round((parseFloat(totales.inatec ||0)) * 100) / 100;
    await db.query(
      `UPDATE planillas SET total_bruto=?, total_deducciones=?, total_neto=?, total_inss_patronal=?, total_inatec=?, costo_total_empresa=? WHERE id=?`,
      [tBruto, tDesc, tNeto, tPatr, tInatec, Math.round((tBruto+tPatr+tInatec)*100)/100, id]
    );

    res.json({ ok: true, desc_prestamo: dPrest, desc_adelanto: dAdel, extras: dExtra, desc_deducciones: dDed, total_deducciones: totalDesc, neto });
  } catch(e) { res.status(500).json({ error: e.message }); }
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
