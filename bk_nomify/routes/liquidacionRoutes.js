'use strict';
const router = require('express').Router();
const db     = require('../db');
const { requireAuth, requireMaster } = require('../auth');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Diferencia en meses completos entre dos fechas */
function diffMeses(desde, hasta) {
  const d = new Date(desde), h = new Date(hasta);
  return Math.max(0,
    (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth())
  );
}

/** Días de preaviso según meses de servicio (Código del Trabajo Nicaragua) */
function diasPreaviso(mesesServicio) {
  if (mesesServicio < 3)  return 7;    // menos de 3 meses → 1 semana
  if (mesesServicio < 6)  return 15;   // 3–6 meses → 15 días
  if (mesesServicio < 12) return 30;   // 6–12 meses → 1 mes
  return 60;                            // más de 1 año → 2 meses
}

/**
 * Calcula todos los componentes de la liquidación.
 * @param {object} emp          - Fila de empleados
 * @param {string} fechaBaja    - YYYY-MM-DD
 * @param {boolean} indemnizar  - Si aplica indemnización
 * @param {boolean} preaviso    - Si aplica preaviso
 * @param {number}  diasVacTomadas - Días de vacaciones ya gozadas
 */
function calcLiquidacion(emp, fechaBaja, indemnizar, preaviso, diasVacTomadas = 0) {
  const salarioMensual = parseFloat(emp.salario_bruto || 0);
  const salarioDiario  = Math.round(salarioMensual / 30 * 100) / 100;
  const fechaIngreso   = emp.fecha_ingreso ? new Date(emp.fecha_ingreso) : new Date(fechaBaja);
  const fechaBajaObj   = new Date(fechaBaja);
  const anioActual     = fechaBajaObj.getFullYear();

  const mesesServicio  = diffMeses(fechaIngreso, fechaBajaObj);
  const aniosServicio  = Math.round(mesesServicio / 12 * 100) / 100;

  // ── Vacaciones acumuladas ─────────────────────────────────────────────────
  // Nicaragua: 15 días laborales/año = 1.25 días/mes
  const diasAcumulados = Math.round(mesesServicio * 1.25 * 100) / 100;
  const diasPendientes = Math.max(0, Math.round((diasAcumulados - (diasVacTomadas || 0)) * 100) / 100);
  const montoVac       = Math.round(diasPendientes * salarioDiario * 100) / 100;

  // ── Aguinaldo proporcional ────────────────────────────────────────────────
  const inicioAnio     = new Date(anioActual, 0, 1);
  const desdeAguinaldo = fechaIngreso > inicioAnio ? fechaIngreso : inicioAnio;
  const mesesAguinaldo = diffMeses(desdeAguinaldo, fechaBajaObj);
  const montoAguinaldo = Math.round(salarioMensual * (mesesAguinaldo / 12) * 100) / 100;

  // ── Indemnización ─────────────────────────────────────────────────────────
  // Nicaragua: 1 mes de salario por año de servicio (proporcional)
  const montoIndem = indemnizar
    ? Math.round(salarioMensual * (mesesServicio / 12) * 100) / 100
    : 0;

  // ── Preaviso ──────────────────────────────────────────────────────────────
  const diasPrev  = preaviso ? diasPreaviso(mesesServicio) : 0;
  const montoPrev = Math.round(diasPrev * salarioDiario * 100) / 100;

  const total = Math.round(
    (montoVac + montoAguinaldo + montoIndem + montoPrev) * 100
  ) / 100;

  return {
    salario_mensual: salarioMensual,
    fecha_ingreso:   emp.fecha_ingreso,
    anios_servicio:  aniosServicio,
    meses_servicio:  mesesServicio,
    // Vacaciones
    dias_vacaciones:  diasPendientes,
    monto_vacaciones: montoVac,
    // Aguinaldo
    meses_aguinaldo:  mesesAguinaldo,
    monto_aguinaldo:  montoAguinaldo,
    // Indemnización
    aplica_indemnizacion: indemnizar ? 1 : 0,
    monto_indemnizacion:  montoIndem,
    // Preaviso
    aplica_preaviso: preaviso ? 1 : 0,
    dias_preaviso:   diasPrev,
    monto_preaviso:  montoPrev,
    total,
  };
}

// ── GET /api/liquidaciones — listar todas ────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('l.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT l.*, e.nombre AS empleado_nombre, e.cargo
      FROM liquidaciones l
      JOIN empleados e ON l.empleado_id = e.id
      ${where}
      ORDER BY l.fecha_baja DESC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/liquidaciones/calcular — preview sin guardar ───────────────────
router.post('/calcular', requireAuth, requireMaster, async (req, res) => {
  const { empleado_id, fecha_baja, indemnizar, preaviso } = req.body;
  if (!empleado_id || !fecha_baja)
    return res.status(400).json({ error: 'Se requiere empleado_id y fecha_baja' });
  try {
    const [[emp]] = await db.query('SELECT * FROM empleados WHERE id = ?', [empleado_id]);
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });

    // Días de vacaciones ya gozadas (estado = Aprobada)
    const [[{ diasGozados }]] = await db.query(
      `SELECT COALESCE(SUM(dias), 0) AS diasGozados
       FROM vacaciones WHERE empleado_id = ? AND estado = 'Aprobada'`,
      [empleado_id]
    );

    const calculo = calcLiquidacion(emp, fecha_baja, !!indemnizar, !!preaviso, parseFloat(diasGozados));
    res.json({ ...calculo, empleado: emp.nombre, cargo: emp.cargo });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/liquidaciones — guardar y dar de baja al empleado ──────────────
router.post('/', requireAuth, requireMaster, async (req, res) => {
  const { empleado_id, fecha_baja, motivo, indemnizar, preaviso, notas } = req.body;
  if (!empleado_id || !fecha_baja)
    return res.status(400).json({ error: 'Se requiere empleado_id y fecha_baja' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[emp]] = await conn.query('SELECT * FROM empleados WHERE id = ?', [empleado_id]);
    if (!emp) throw new Error('Empleado no encontrado');

    const [[{ diasGozados }]] = await conn.query(
      `SELECT COALESCE(SUM(dias), 0) AS diasGozados
       FROM vacaciones WHERE empleado_id = ? AND estado = 'Aprobada'`,
      [empleado_id]
    );

    const c = calcLiquidacion(emp, fecha_baja, !!indemnizar, !!preaviso, parseFloat(diasGozados));
    const empresaId = req.empresaId || emp.empresa_id || null;

    const [r] = await conn.query(`
      INSERT INTO liquidaciones
        (empleado_id, empresa_id, fecha_baja, motivo, salario_mensual, fecha_ingreso,
         anios_servicio, meses_servicio, dias_vacaciones, monto_vacaciones,
         meses_aguinaldo, monto_aguinaldo, aplica_indemnizacion, monto_indemnizacion,
         aplica_preaviso, dias_preaviso, monto_preaviso, total, notas, estado)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Pendiente')`,
      [empleado_id, empresaId, fecha_baja, motivo || 'Renuncia voluntaria',
       c.salario_mensual, c.fecha_ingreso, c.anios_servicio, c.meses_servicio,
       c.dias_vacaciones, c.monto_vacaciones, c.meses_aguinaldo, c.monto_aguinaldo,
       c.aplica_indemnizacion, c.monto_indemnizacion,
       c.aplica_preaviso, c.dias_preaviso, c.monto_preaviso, c.total, notas || null]
    );

    // Marcar empleado como inactivo
    await conn.query(
      'UPDATE empleados SET activo = 0 WHERE id = ?', [empleado_id]
    );

    await conn.commit(); conn.release();
    res.status(201).json({ ok: true, liquidacion_id: r.insertId, ...c });
  } catch (e) {
    await conn.rollback(); conn.release();
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH /api/liquidaciones/:id/estado ─────────────────────────────────────
router.patch('/:id/estado', requireAuth, requireMaster, async (req, res) => {
  const { estado } = req.body;
  const ESTADOS = ['Pendiente', 'Pagada'];
  if (!ESTADOS.includes(estado))
    return res.status(400).json({ error: 'Estado inválido' });
  try {
    await db.query('UPDATE liquidaciones SET estado = ? WHERE id = ?', [estado, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
