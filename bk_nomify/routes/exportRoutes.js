'use strict';
const router = require('express').Router();
const db     = require('../db');
const XLSX   = require('xlsx');
const { requireAuth } = require('../auth');

// ── Helper: crea y envía el archivo XLSX ────────────────────────────────────
function sendXlsx(res, sheetData, filename, sheetName = 'Datos') {
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  // Autofit de columnas (ancho según contenido)
  const colWidths = sheetData[0]?.map((_, ci) => ({
    wch: Math.min(50, Math.max(10,
      ...sheetData.map(row => String(row[ci] ?? '').length)
    ))
  })) || [];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.xlsx"`);
  res.setHeader('Content-Length', buf.length);
  res.end(buf);
}

const cs = n => parseFloat(n || 0).toFixed(2);

// ── GET /api/export/empleados ────────────────────────────────────────────────
router.get('/empleados', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('e.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT e.nombre, e.cedula, e.cargo,
        e.salario_bruto, e.tipo_planilla, e.inss_base, e.ir_tipo, e.ir_fijo,
        DATE_FORMAT(e.fecha_ingreso,'%Y-%m-%d') AS fecha_ingreso,
        DATE_FORMAT(e.fecha_nacimiento,'%Y-%m-%d') AS fecha_nacimiento,
        e.email, e.rol,
        IF(e.activo=1,'Activo','Inactivo') AS estado,
        em.nombre AS empresa
      FROM empleados e
      LEFT JOIN empresas em ON e.empresa_id = em.id
      ${where} ORDER BY e.nombre ASC`, params);

    const headers = ['Nombre','Cédula','Cargo','Salario mensual','Tipo planilla',
      'Base INSS','Tipo IR','IR fijo','Fecha ingreso','Fecha nacimiento',
      'Email','Rol','Estado','Empresa'];
    const data = [headers, ...rows.map(r => [
      r.nombre, r.cedula||'', r.cargo||'', cs(r.salario_bruto), r.tipo_planilla||'',
      r.inss_base||'', r.ir_tipo||'', cs(r.ir_fijo), r.fecha_ingreso||'',
      r.fecha_nacimiento||'', r.email||'', r.rol||'', r.estado, r.empresa||''
    ])];
    sendXlsx(res, data, 'Empleados', 'Empleados');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/export/planillas ────────────────────────────────────────────────
router.get('/planillas', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('p.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT p.folio, DATE_FORMAT(p.periodo,'%Y-%m-%d') AS periodo,
        p.tipo, p.estado, p.total_bruto, p.total_deducciones, p.total_neto,
        p.total_inss_patronal, p.total_inatec, p.costo_total_empresa,
        COUNT(d.id) AS empleados
      FROM planillas p
      LEFT JOIN detalle_planilla d ON d.planilla_id = p.id
      ${where} GROUP BY p.id ORDER BY p.periodo DESC, p.id DESC`, params);

    const headers = ['#Folio','Período','Tipo','Estado','Empleados',
      'Total bruto','Total deducciones','Total neto',
      'INSS Patronal','INATEC','Costo total empresa'];
    const data = [headers, ...rows.map(r => [
      r.folio, r.periodo, r.tipo||'—', r.estado||'Borrador', r.empleados,
      cs(r.total_bruto), cs(r.total_deducciones), cs(r.total_neto),
      cs(r.total_inss_patronal), cs(r.total_inatec), cs(r.costo_total_empresa)
    ])];
    sendXlsx(res, data, 'Planillas', 'Planillas');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/export/planilla/:id — detalle de una planilla ──────────────────
router.get('/planilla/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.nombre, d.tipo_planilla, d.salario_quincenal, d.inss, d.ir,
        d.desc_prestamo, d.desc_adelanto, d.desc_deducciones, d.extras,
        d.total_deducciones, d.neto, d.inss_patronal, d.inatec,
        d.meses_trabajados,
        DATE_FORMAT(d.periodo,'%Y-%m-%d') AS periodo
      FROM detalle_planilla d
      JOIN empleados e ON d.empleado_id = e.id
      WHERE d.planilla_id = ?
      ORDER BY e.nombre ASC`, [req.params.id]);

    const [[plan]] = await db.query(
      'SELECT folio, tipo, DATE_FORMAT(periodo,\'%Y-%m-%d\') AS periodo FROM planillas WHERE id = ?',
      [req.params.id]);

    const esAguinaldo = plan?.tipo === 'Aguinaldo';
    const headers = esAguinaldo
      ? ['Empleado','Tipo planilla','Período','Meses trabajados','Aguinaldo']
      : ['Empleado','Tipo planilla','Período','Salario quincenal','INSS (7%)',
         'Desc. préstamo','Desc. adelanto','Otras deducciones','Extras',
         'Total deducciones','Neto a recibir','INSS Patronal (21.5%)','INATEC (2%)'];

    const data = [headers, ...rows.map(r => esAguinaldo
      ? [r.nombre, r.tipo_planilla, r.periodo, cs(r.meses_trabajados), cs(r.neto)]
      : [r.nombre, r.tipo_planilla, r.periodo, cs(r.salario_quincenal),
         cs(r.inss), cs(r.desc_prestamo), cs(r.desc_adelanto), cs(r.desc_deducciones),
         cs(r.extras), cs(r.total_deducciones), cs(r.neto),
         cs(r.inss_patronal), cs(r.inatec)]
    )];

    const fname = `Planilla-${plan?.folio||req.params.id}-${plan?.periodo||''}`;
    sendXlsx(res, data, fname, plan?.tipo || 'Detalle');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/export/prestamos ────────────────────────────────────────────────
router.get('/prestamos', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('e.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT e.nombre, p.monto_total, p.cuota_quincenal,
        GREATEST(0, ROUND(p.monto_total - COALESCE(pg.total,0),2)) AS saldo,
        COALESCE(pg.num_pagos,0) AS pagos,
        p.frecuencia, p.estado, p.notas,
        DATE_FORMAT(p.fecha_inicio,'%Y-%m-%d') AS fecha_inicio
      FROM prestamos p
      JOIN empleados e ON p.empleado_id = e.id
      LEFT JOIN (SELECT prestamo_id, SUM(monto) AS total, COUNT(*) AS num_pagos
                 FROM pagos_prestamos GROUP BY prestamo_id) pg ON pg.prestamo_id = p.id
      ${where} ORDER BY e.nombre, p.id DESC`, params);

    const headers = ['Empleado','Monto total','Cuota quincenal','Saldo pendiente',
      'Pagos realizados','Frecuencia','Estado','Concepto','Fecha inicio'];
    const data = [headers, ...rows.map(r => [
      r.nombre, cs(r.monto_total), cs(r.cuota_quincenal), cs(r.saldo),
      r.pagos, r.frecuencia||'Quincenal', r.estado, r.notas||'', r.fecha_inicio||''
    ])];
    sendXlsx(res, data, 'Prestamos', 'Préstamos');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/export/adelantos ────────────────────────────────────────────────
router.get('/adelantos', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('e.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT e.nombre, a.monto, DATE_FORMAT(a.descontar_en,'%Y-%m-%d') AS descontar_en,
        CASE WHEN a.pausado THEN 'Pausado' ELSE COALESCE(a.estado,'Pendiente') END AS estado,
        DATE_FORMAT(a.fecha_registro,'%Y-%m-%d') AS fecha_registro, a.notas
      FROM adelantos a
      JOIN empleados e ON a.empleado_id = e.id
      ${where} ORDER BY a.id DESC`, params);

    const headers = ['Empleado','Monto','Descontar en','Estado','Registrado','Notas'];
    const data = [headers, ...rows.map(r => [
      r.nombre, cs(r.monto), r.descontar_en||'', r.estado,
      r.fecha_registro||'', r.notas||''
    ])];
    sendXlsx(res, data, 'Adelantos', 'Adelantos');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/export/extras ───────────────────────────────────────────────────
router.get('/extras', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('e.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT e.nombre, x.tipo, x.descripcion, x.monto,
        DATE_FORMAT(x.pagar_en,'%Y-%m-%d') AS pagar_en
      FROM extras x
      JOIN empleados e ON x.empleado_id = e.id
      ${where} ORDER BY x.pagar_en DESC, e.nombre`, params);

    const headers = ['Empleado','Tipo','Descripción','Monto','Pagar en'];
    const data = [headers, ...rows.map(r => [
      r.nombre, r.tipo||'', r.descripcion||'', cs(r.monto), r.pagar_en||''
    ])];
    sendXlsx(res, data, 'Extras', 'Extras');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/export/vacaciones ───────────────────────────────────────────────
router.get('/vacaciones', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('e.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT e.nombre, v.tipo, v.dias, v.monto,
        DATE_FORMAT(v.fecha_inicio,'%Y-%m-%d') AS fecha_inicio,
        DATE_FORMAT(v.fecha_fin,'%Y-%m-%d') AS fecha_fin,
        v.estado, v.notas
      FROM vacaciones v
      JOIN empleados e ON v.empleado_id = e.id
      ${where} ORDER BY v.fecha_inicio DESC, e.nombre`, params);

    const headers = ['Empleado','Tipo','Días','Monto','Fecha inicio','Fecha fin','Estado','Notas'];
    const data = [headers, ...rows.map(r => [
      r.nombre, r.tipo||'', cs(r.dias), cs(r.monto),
      r.fecha_inicio||'', r.fecha_fin||'', r.estado||'', r.notas||''
    ])];
    sendXlsx(res, data, 'Vacaciones', 'Vacaciones');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/export/liquidaciones ───────────────────────────────────────────
router.get('/liquidaciones', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('l.empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT e.nombre, l.fecha_baja, l.motivo, l.salario_mensual,
        l.anios_servicio, l.dias_vacaciones, l.monto_vacaciones,
        l.meses_aguinaldo, l.monto_aguinaldo, l.monto_indemnizacion,
        l.dias_preaviso, l.monto_preaviso, l.total, l.estado, l.notas
      FROM liquidaciones l
      JOIN empleados e ON l.empleado_id = e.id
      ${where} ORDER BY l.fecha_baja DESC`, params);

    const headers = ['Empleado','Fecha baja','Motivo','Salario mensual',
      'Años servicio','Días vacaciones','Monto vacaciones',
      'Meses aguinaldo','Monto aguinaldo','Indemnización',
      'Días preaviso','Monto preaviso','TOTAL','Estado','Notas'];
    const data = [headers, ...rows.map(r => [
      r.nombre, r.fecha_baja||'', r.motivo||'', cs(r.salario_mensual),
      cs(r.anios_servicio), cs(r.dias_vacaciones), cs(r.monto_vacaciones),
      cs(r.meses_aguinaldo), cs(r.monto_aguinaldo), cs(r.monto_indemnizacion),
      r.dias_preaviso||0, cs(r.monto_preaviso), cs(r.total), r.estado||'', r.notas||''
    ])];
    sendXlsx(res, data, 'Liquidaciones', 'Liquidaciones');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
