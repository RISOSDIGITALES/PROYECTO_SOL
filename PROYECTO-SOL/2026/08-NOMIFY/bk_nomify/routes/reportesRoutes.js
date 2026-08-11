'use strict';
const router = require('express').Router();
const db     = require('../db');
const { requireAuth } = require('../auth');

let generarListaPDF     = null;
let generarCalendarioPDF = null;
try {
  const pdf = require('../pdfGenerator');
  generarListaPDF      = pdf.generarListaPDF;
  generarCalendarioPDF = pdf.generarCalendarioPDF;
} catch (_) {}

let enviarReporteLista = async () => { throw new Error('Mailer no disponible'); };
try { enviarReporteLista = require('../mailer').enviarReporteLista; } catch (_) {}

const cs = n => 'C$ ' + parseFloat(n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// POST /api/reportes/enviar
router.post('/enviar', requireAuth, async (req, res) => {
  const { categoria, email, empleado } = req.body;
  if (!email || !categoria)
    return res.status(400).json({ error: 'Se requiere email y categoria' });
  if (!process.env.SMTP_HOST)
    return res.status(400).json({ error: 'SMTP no configurado en .env' });
  if (!generarListaPDF)
    return res.status(500).json({ error: 'pdfkit no instalado — ejecuta npm install en bk_nomify/' });

  const empId = req.empresaId;

  try {
    let titulo, columnas, filas, totales;

    // ── PLANILLAS ────────────────────────────────────────────────────────────
    if (categoria === 'planillas') {
      const conds = [], params = [];
      if (empId)         { conds.push('p.empresa_id = ?'); params.push(empId); }
      if (req.body.tipo) { conds.push('p.tipo = ?');       params.push(req.body.tipo); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const [rows] = await db.query(`
        SELECT p.folio, p.periodo, p.tipo,
          p.total_bruto, p.total_deducciones, p.total_neto,
          p.estado,
          COUNT(dp.id) AS empleados
        FROM planillas p
        LEFT JOIN detalle_planilla dp ON dp.planilla_id = p.id
        ${where}
        GROUP BY p.id
        ORDER BY p.periodo DESC`, params);

      titulo = 'Historial de Planillas';
      columnas = [
        { label: '#',           width:  55, align: 'center' },
        { label: 'Período',     width: 130, align: 'left' },
        { label: 'Tipo',        width:  95, align: 'left' },
        { label: 'Empleados',   width:  70, align: 'center' },
        { label: 'Bruto',       width: 110, align: 'right' },
        { label: 'Deducciones', width: 110, align: 'right' },
        { label: 'Neto',        width: 110, align: 'right' },
        { label: 'Estado',      width:  40, align: 'left' },
      ];
      const { formatPeriodo: fp } = require('../pdfGenerator');
      filas = rows.map(r => [
        r.folio != null ? `#${r.folio}` : '',
        fp(r.periodo),
        r.tipo || '—',
        r.empleados || 0,
        cs(r.total_bruto),
        cs(r.total_deducciones),
        cs(r.total_neto),
        r.estado || 'Borrador',
      ]);
      totales = [
        'TOTALES', '', '',
        rows.reduce((s, r) => s + (parseInt(r.empleados) || 0), 0),
        cs(rows.reduce((s, r) => s + parseFloat(r.total_bruto || 0), 0)),
        cs(rows.reduce((s, r) => s + parseFloat(r.total_deducciones || 0), 0)),
        cs(rows.reduce((s, r) => s + parseFloat(r.total_neto || 0), 0)),
        '',
      ];

    // ── PRÉSTAMOS ────────────────────────────────────────────────────────────
    } else if (categoria === 'prestamos') {
      const conds = [], params = [];
      if (empId)    { conds.push('e.empresa_id = ?'); params.push(empId); }
      if (empleado) { conds.push('e.nombre = ?');     params.push(empleado); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const [rows] = await db.query(`
        SELECT e.nombre,
          p.monto_total, p.cuota_quincenal,
          GREATEST(0, ROUND(p.monto_total - COALESCE(pg.total, 0), 2)) AS saldo,
          COALESCE(pg.num_pagos, 0) AS pagos,
          COALESCE(p.frecuencia, 'Quincenal') AS frecuencia,
          p.estado
        FROM prestamos p
        JOIN empleados e ON p.empleado_id = e.id
        LEFT JOIN (
          SELECT prestamo_id, SUM(monto) AS total, COUNT(*) AS num_pagos
          FROM pagos_prestamos GROUP BY prestamo_id
        ) pg ON pg.prestamo_id = p.id
        ${where} ORDER BY e.nombre, p.id DESC`, params);

      titulo = 'Historial de Préstamos';
      columnas = [
        { label: 'Empleado',    width: 190, align: 'left' },
        { label: 'Monto total', width: 105, align: 'right' },
        { label: 'Cuota quin.', width: 100, align: 'right' },
        { label: 'Saldo',       width: 105, align: 'right' },
        { label: 'Pagos',       width: 55,  align: 'center' },
        { label: 'Frecuencia',  width: 85,  align: 'left' },
        { label: 'Estado',      width: 80,  align: 'left' },
      ];
      filas = rows.map(r => [
        r.nombre, cs(r.monto_total), cs(r.cuota_quincenal),
        cs(r.saldo), r.pagos, r.frecuencia || 'Quincenal', r.estado || 'Activo',
      ]);
      const totMonto = rows.reduce((s, r) => s + parseFloat(r.monto_total || 0), 0);
      const totSaldo = rows.reduce((s, r) => s + parseFloat(r.saldo || 0), 0);
      totales = ['TOTALES', cs(totMonto), '', cs(totSaldo), '', '', ''];

    // ── ADELANTOS ────────────────────────────────────────────────────────────
    } else if (categoria === 'adelantos') {
      const conds = [], params = [];
      if (empId)    { conds.push('e.empresa_id = ?'); params.push(empId); }
      if (empleado) { conds.push('e.nombre = ?');     params.push(empleado); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const [rows] = await db.query(`
        SELECT e.nombre, a.monto, a.descontar_en,
          CASE WHEN a.pausado THEN 'Pausado'
               ELSE COALESCE(a.estado, 'Pendiente') END AS estado,
          DATE_FORMAT(a.fecha_registro, '%Y-%m-%d') AS creado
        FROM adelantos a
        JOIN empleados e ON a.empleado_id = e.id
        ${where} ORDER BY a.id DESC`, params);

      titulo = 'Historial de Adelantos';
      columnas = [
        { label: 'Empleado',    width: 200, align: 'left' },
        { label: 'Monto (C$)',  width: 120, align: 'right' },
        { label: 'Descontar en', width: 120, align: 'left' },
        { label: 'Registrado',  width: 110, align: 'left' },
        { label: 'Estado',      width: 170, align: 'left' },
      ];
      filas = rows.map(r => [
        r.nombre, cs(r.monto), r.descontar_en || '—', r.creado || '—', r.estado,
      ]);
      totales = ['TOTALES', cs(rows.reduce((s, r) => s + parseFloat(r.monto || 0), 0)), '', '', ''];

    // ── EXTRAS ───────────────────────────────────────────────────────────────
    } else if (categoria === 'extras') {
      const conds = [], params = [];
      if (empId)    { conds.push('e.empresa_id = ?'); params.push(empId); }
      if (empleado) { conds.push('e.nombre = ?');     params.push(empleado); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const [rows] = await db.query(`
        SELECT e.nombre, x.tipo, x.descripcion, x.monto, x.pagar_en
        FROM extras x
        JOIN empleados e ON x.empleado_id = e.id
        ${where} ORDER BY x.pagar_en DESC, e.nombre`, params);

      titulo = 'Historial de Extras';
      columnas = [
        { label: 'Empleado',   width: 185, align: 'left' },
        { label: 'Tipo',       width: 110, align: 'left' },
        { label: 'Concepto',   width: 215, align: 'left' },
        { label: 'Monto (C$)', width: 110, align: 'right' },
        { label: 'Pagar en',   width: 100, align: 'left' },
      ];
      filas = rows.map(r => [r.nombre, r.tipo || '—', r.descripcion || '—', cs(r.monto), r.pagar_en || '—']);
      totales = ['TOTALES', '', '', cs(rows.reduce((s, r) => s + parseFloat(r.monto || 0), 0)), ''];

    // ── DEDUCCIONES ──────────────────────────────────────────────────────────
    } else if (categoria === 'deducciones') {
      const conds = [], params = [];
      if (empId)    { conds.push('e.empresa_id = ?'); params.push(empId); }
      if (empleado) { conds.push('e.nombre = ?');     params.push(empleado); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const [rows] = await db.query(`
        SELECT e.nombre,
          COALESCE(d.concepto, d.descripcion, '—') AS concepto,
          d.monto, d.descontar_en
        FROM deducciones d
        JOIN empleados e ON d.empleado_id = e.id
        ${where} ORDER BY d.descontar_en DESC, e.nombre`, params);

      titulo = 'Otras Deducciones';
      columnas = [
        { label: 'Empleado',    width: 200, align: 'left' },
        { label: 'Concepto',    width: 240, align: 'left' },
        { label: 'Monto (C$)',  width: 130, align: 'right' },
        { label: 'Descontar en', width: 150, align: 'left' },
      ];
      filas = rows.map(r => [r.nombre, r.concepto, cs(r.monto), r.descontar_en || '—']);
      totales = ['TOTALES', '', cs(rows.reduce((s, r) => s + parseFloat(r.monto || 0), 0)), ''];

    // ── VACACIONES ───────────────────────────────────────────────────────────
    } else if (categoria === 'vacaciones') {
      const conds = [], params = [];
      if (empId)    { conds.push('e.empresa_id = ?'); params.push(empId); }
      if (empleado) { conds.push('e.nombre = ?');     params.push(empleado); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const [rows] = await db.query(`
        SELECT e.nombre,
          DATE_FORMAT(v.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
          DATE_FORMAT(v.fecha_fin,    '%Y-%m-%d') AS fecha_fin,
          v.dias, v.tipo, v.estado, v.notas
        FROM vacaciones v
        JOIN empleados e ON v.empleado_id = e.id
        ${where} ORDER BY v.fecha_inicio DESC, e.nombre`, params);

      titulo = 'Historial de Vacaciones';
      columnas = [
        { label: 'Empleado', width: 175, align: 'left' },
        { label: 'Desde',    width: 88,  align: 'left' },
        { label: 'Hasta',    width: 88,  align: 'left' },
        { label: 'Días',     width: 55,  align: 'center' },
        { label: 'Tipo',     width: 95,  align: 'left' },
        { label: 'Estado',   width: 95,  align: 'left' },
        { label: 'Notas',    width: 124, align: 'left' },
      ];
      filas = rows.map(r => [
        r.nombre, r.fecha_inicio || '—', r.fecha_fin || '—',
        r.dias ?? '—', r.tipo || '—', r.estado || '—', r.notas || '',
      ]);
      const totDias = rows.reduce((s, r) => s + parseFloat(r.dias || 0), 0);
      totales = ['TOTALES', '', '', totDias, '', '', ''];

    } else {
      return res.status(400).json({ error: `Categoría desconocida: ${categoria}` });
    }

    const subtitulo = empleado ? `Empleado: ${empleado}` : 'Todos los empleados';
    const pdfBuffer = await generarListaPDF({ titulo, subtitulo, columnas, filas, totales });
    await enviarReporteLista(email, null, pdfBuffer, titulo);

    res.json({ ok: true, mensaje: `${titulo} enviado a ${email}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const MESES_SLUG = ['enero','febrero','marzo','abril','mayo','junio',
                    'julio','agosto','septiembre','octubre','noviembre','diciembre'];

// Helper: genera el PDF del calendario
async function _buildCalPDF(mes, anio, eventos) {
  return generarCalendarioPDF({ mes: parseInt(mes), anio: parseInt(anio), eventos: eventos || [] });
}

// POST /api/reportes/calendario — descarga directa del PDF
router.post('/calendario', requireAuth, async (req, res) => {
  if (!generarCalendarioPDF)
    return res.status(500).json({ error: 'pdfkit no instalado — ejecuta npm install en bk_nomify/' });
  const { mes, anio, eventos = [] } = req.body;
  if (!mes || !anio)
    return res.status(400).json({ error: 'Se requiere mes y anio' });
  try {
    const pdfBuffer = await _buildCalPDF(mes, anio, eventos);
    const filename  = `calendario-${MESES_SLUG[(parseInt(mes) - 1) % 12]}-${anio}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/reportes/calendario/enviar — envía el calendario por correo
router.post('/calendario/enviar', requireAuth, async (req, res) => {
  if (!generarCalendarioPDF)
    return res.status(500).json({ error: 'pdfkit no instalado' });
  if (!process.env.SMTP_HOST)
    return res.status(400).json({ error: 'SMTP no configurado en .env' });

  const { email, mes, anio, eventos = [] } = req.body;
  if (!email || !mes || !anio)
    return res.status(400).json({ error: 'Se requiere email, mes y anio' });

  try {
    const pdfBuffer = await _buildCalPDF(mes, anio, eventos);
    const mesNombre = MESES_SLUG[(parseInt(mes) - 1) % 12];
    mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);
    const titulo    = `Calendario ${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)} ${anio}`;
    await enviarReporteLista(email, null, pdfBuffer, titulo);
    res.json({ ok: true, mensaje: `Calendario enviado a ${email}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
