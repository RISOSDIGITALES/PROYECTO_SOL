'use strict';
// Carga pdfkit de forma lazy — si no está instalado, las funciones lanzan error descriptivo
let PDFDocument;
try { PDFDocument = require('pdfkit'); } catch (_) { PDFDocument = null; }

// ── Paleta ─────────────────────────────────────────────────────────────────────
const PRIMARY  = '#1a2236';
const LIGHT    = '#f0f4f8';
const TEXT     = '#1e293b';
const MUTED    = '#64748b';
const RED      = '#dc2626';
const GREEN_DK = '#166534';

// ── Helpers ────────────────────────────────────────────────────────────────────
function cs(n) {
  return 'C$ ' + parseFloat(n || 0).toLocaleString('es-NI', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function formatPeriodo(iso) {
  if (!iso) return '—';
  const s = String(iso).substring(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return s;
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const diaInicio = d <= 15 ? 1 : 16;
  return `${diaInicio} al ${d} de ${meses[m - 1]} de ${y}`;
}

function hline(doc, x1, x2, y, color = '#e2e8f0') {
  doc.save().strokeColor(color).lineWidth(0.4).moveTo(x1, y).lineTo(x2, y).stroke().restore();
}

function checkFallback() {
  if (!PDFDocument) throw new Error('pdfkit no instalado — ejecuta npm install en bk_nomify/');
}

// ── Reporte de Planilla (landscape) ───────────────────────────────────────────
/**
 * @param {object} opts
 * @param {{ nombre?: string }|null} opts.empresa
 * @param {object} opts.planilla  — fila de la tabla planillas
 * @param {Array}  opts.detalles  — filas de detalle_planilla JOIN empleados
 * @returns {Promise<Buffer>}
 */
function generarReportePlanilla({ empresa, planilla, detalles }) {
  checkFallback();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'LETTER', layout: 'landscape' });
    const bufs = [];
    doc.on('data', d => bufs.push(d));
    doc.on('end', () => resolve(Buffer.concat(bufs)));
    doc.on('error', reject);

    const W  = doc.page.width;   // 792 landscape
    const M  = 36;
    const CW = W - M * 2;        // 720
    const pf = v => parseFloat(v) || 0;

    const periodo    = planilla.periodo || planilla['Período'] || planilla.Período;
    const periodoStr = formatPeriodo(periodo);
    const tipo       = planilla.tipo || planilla.Tipo || '';
    const tipoStr    = tipo ? `Planilla ${tipo}` : 'Todos los tipos';

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.rect(M, M, CW, 52).fill(PRIMARY);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('Nomify', M + 16, M + 11);
    doc.fillColor('#8899aa').font('Helvetica').fontSize(9).text('Sistema de planilla', M + 16, M + 31);

    const subtitle = tipoStr + (empresa?.nombre ? `  ·  ${empresa.nombre}` : '');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13)
       .text(`Reporte de Planilla · ${periodoStr}`, M + 210, M + 12, { width: CW - 225 });
    doc.fillColor('#8899aa').font('Helvetica').fontSize(9)
       .text(subtitle, M + 210, M + 28, { width: CW - 225 });

    let y = M + 68;

    // ── CARDS RESUMEN ────────────────────────────────────────────────────────
    const totBruto = detalles.reduce((s, d) => s + pf(d.salario_quincenal) + pf(d.extras), 0);
    const totDesc  = detalles.reduce((s, d) => s + pf(d.total_deducciones), 0);
    const totNeto  = detalles.reduce((s, d) => s + pf(d.neto), 0);

    const cards = [
      { label: 'Empleados',         value: String(detalles.length), color: '#1d4ed8' },
      { label: 'Total Bruto',       value: cs(totBruto),            color: TEXT },
      { label: 'Total Deducciones', value: cs(totDesc),             color: RED },
      { label: 'Total Neto',        value: cs(totNeto),             color: '#15803d' },
    ];
    const cardW = (CW - 24) / 4;
    cards.forEach((card, i) => {
      const cx = M + i * (cardW + 8);
      doc.rect(cx, y, cardW, 44).fill(LIGHT);
      doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(card.label, cx + 8, y + 7, { width: cardW - 16 });
      doc.fillColor(card.color).font('Helvetica-Bold').fontSize(13).text(card.value, cx + 8, y + 20, { width: cardW - 16 });
    });
    y += 58;

    // ── TABLA ────────────────────────────────────────────────────────────────
    // Anchos: suma = 720
    const cols = [
      { label: 'Empleado',    width: 150, align: 'left' },
      { label: 'Salario Q.',  width: 75,  align: 'right' },
      { label: 'INSS',        width: 64,  align: 'right' },
      { label: 'IR',          width: 60,  align: 'right' },
      { label: 'Préstamo',    width: 76,  align: 'right' },
      { label: 'Adelanto',    width: 74,  align: 'right' },
      { label: 'Extras',      width: 70,  align: 'right' },
      { label: 'Total Desc.', width: 77,  align: 'right' },
      { label: 'Neto',        width: 74,  align: 'right' },
    ]; // 150+75+64+60+76+74+70+77+74 = 720

    function drawTableHeader(yy) {
      doc.rect(M, yy, CW, 20).fill(PRIMARY);
      let cx = M;
      cols.forEach(col => {
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5)
           .text(col.label, cx + 4, yy + 6, { width: col.width - 8, align: col.align });
        cx += col.width;
      });
      return yy + 20;
    }

    y = drawTableHeader(y);
    const ROW_H = 17;

    detalles.forEach((d, idx) => {
      if (y + ROW_H > doc.page.height - 50) {
        doc.addPage({ layout: 'landscape' });
        y = M;
        y = drawTableHeader(y);
      }
      doc.rect(M, y, CW, ROW_H).fill(idx % 2 === 0 ? '#f8fafc' : '#ffffff');

      const vals = [
        d.nombre || '—',
        cs(d.salario_quincenal),
        cs(d.inss),
        cs(d.ir),
        cs(d.desc_prestamo),
        cs(d.desc_adelanto),
        cs(d.extras),
        cs(d.total_deducciones),
        cs(d.neto),
      ];
      let cx = M;
      vals.forEach((val, i) => {
        const isNeto = i === vals.length - 1;
        doc.fillColor(isNeto ? GREEN_DK : TEXT)
           .font(isNeto ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(7.5)
           .text(val, cx + 4, y + 5, { width: cols[i].width - 8, align: cols[i].align });
        cx += cols[i].width;
      });
      hline(doc, M, M + CW, y + ROW_H);
      y += ROW_H;
    });

    // Fila totales
    if (y + 22 > doc.page.height - 50) { doc.addPage({ layout: 'landscape' }); y = M; }
    doc.rect(M, y, CW, 22).fill(PRIMARY);
    const totVals = [
      'TOTALES',
      cs(detalles.reduce((s, d) => s + pf(d.salario_quincenal), 0)),
      cs(detalles.reduce((s, d) => s + pf(d.inss), 0)),
      cs(detalles.reduce((s, d) => s + pf(d.ir), 0)),
      cs(detalles.reduce((s, d) => s + pf(d.desc_prestamo), 0)),
      cs(detalles.reduce((s, d) => s + pf(d.desc_adelanto), 0)),
      cs(detalles.reduce((s, d) => s + pf(d.extras), 0)),
      cs(totDesc),
      cs(totNeto),
    ];
    let cx = M;
    totVals.forEach((val, i) => {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8)
         .text(val, cx + 4, y + 7, { width: cols[i].width - 8, align: cols[i].align });
      cx += cols[i].width;
    });
    y += 30;

    // Footer
    doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
       .text(`Nomify · Sistema de planilla · Generado el ${new Date().toLocaleString('es-NI')}`,
             M, doc.page.height - 26, { width: CW, align: 'center' });

    doc.end();
  });
}

// ── Recibo individual (portrait) ───────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {{ nombre?: string }|null} opts.empresa
 * @param {object} opts.empleado
 * @param {object} opts.detalle    — fila de detalle_planilla
 * @param {Array}  opts.extras
 * @param {Array}  opts.adelantos
 * @param {Array}  opts.deducciones
 * @param {Array}  opts.vacaciones
 * @param {string} opts.periodo    — YYYY-MM-DD
 * @returns {Promise<Buffer>}
 */
function generarReciboEmpleado({ empresa, empleado, detalle, extras = [], adelantos = [], deducciones = [], vacaciones = [], periodo }) {
  checkFallback();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'LETTER' });
    const bufs = [];
    doc.on('data', d => bufs.push(d));
    doc.on('end', () => resolve(Buffer.concat(bufs)));
    doc.on('error', reject);

    const W  = doc.page.width;  // 612
    const M  = 36;
    const CW = W - M * 2;       // 540
    const pf = v => parseFloat(v) || 0;
    const periodoStr = formatPeriodo(periodo);

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.rect(M, M, CW, 60).fill(PRIMARY);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(20).text('Nomify', M + 18, M + 13);
    doc.fillColor('#8899aa').font('Helvetica').fontSize(10).text('Sistema de planilla', M + 18, M + 35);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13)
       .text('RECIBO DE PAGO', M + 210, M + 13, { width: CW - 220 });
    doc.fillColor('#a0b0c0').font('Helvetica').fontSize(9)
       .text(periodoStr, M + 210, M + 30, { width: CW - 220 });
    if (empresa?.nombre) {
      doc.fillColor('#8899aa').font('Helvetica').fontSize(9)
         .text(empresa.nombre, M + 210, M + 45, { width: CW - 220 });
    }

    let y = M + 76;

    // ── Helpers de sección/fila ──────────────────────────────────────────────
    function seccion(titulo) {
      doc.rect(M, y, CW, 16).fill(LIGHT);
      doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(7.5)
         .text(titulo, M + 8, y + 4, { characterSpacing: 0.5 });
      y += 16;
    }
    function fila(label, value, color = TEXT, bold = false) {
      doc.rect(M, y, CW, 20).fill('#ffffff');
      doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(label, M + 10, y + 6);
      doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
         .text(value, M + 10, y + 6, { width: CW - 20, align: 'right' });
      hline(doc, M, M + CW, y + 20);
      y += 20;
    }

    // ── EMPLEADO ─────────────────────────────────────────────────────────────
    seccion('INFORMACIÓN DEL EMPLEADO');
    fila('Nombre',           empleado.nombre || '—');
    fila('Tipo de planilla', empleado.tipo_planilla || 'Con Seguro');
    fila('Salario mensual',  cs(empleado.salario_bruto));
    y += 8;

    // ── INGRESOS ─────────────────────────────────────────────────────────────
    const salQ = pf(detalle.salario_quincenal) || pf(empleado.salario_bruto) / 2;
    seccion('INGRESOS');
    fila('Salario quincenal', cs(salQ), TEXT, true);
    (extras || []).filter(e => e.tipo === 'Bono').forEach(e => fila('Bono', cs(e.monto)));
    (extras || []).filter(e => e.tipo === 'Feriado trabajado').forEach(e => fila('Feriado trabajado', cs(e.monto)));
    (extras || []).filter(e => e.tipo === 'Otro').forEach(e => fila('Turno / Extra', cs(e.monto)));
    (vacaciones || []).filter(v => pf(v.monto) > 0).forEach(v =>
      fila(`Vacaciones pagadas (${v.dias} días)`, cs(v.monto))
    );
    y += 8;

    // ── DESCUENTOS ───────────────────────────────────────────────────────────
    const inss      = pf(detalle.inss);
    const ir        = pf(detalle.ir);
    const descPrest = pf(detalle.desc_prestamo);
    const descAdel  = pf(detalle.desc_adelanto);
    const hasDesc   = inss > 0 || ir > 0 || descAdel > 0 || descPrest > 0 || (deducciones || []).length > 0;

    if (hasDesc) {
      seccion('DESCUENTOS');
      if (inss > 0)      fila('INSS Laboral (7%)', `- ${cs(inss)}`,    RED);
      if (ir > 0)        fila('IR',                `- ${cs(ir)}`,      RED);
      if (descAdel > 0)  fila('Adelanto',          `- ${cs(descAdel)}`, RED);
      (deducciones || []).forEach(d =>
        fila(d.concepto || 'Deducción', `- ${cs(d.monto)}`, RED)
      );
      if (descPrest > 0) fila('Abono préstamo', `- ${cs(descPrest)}`, RED);
      y += 4;
    }

    // ── NETO ─────────────────────────────────────────────────────────────────
    const neto = pf(detalle.neto);
    doc.rect(M, y, CW, 34).fill(PRIMARY);
    doc.fillColor('#8899aa').font('Helvetica').fontSize(10).text('Neto a recibir', M + 16, y + 10);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
       .text(cs(neto), M + 16, y + 8, { width: CW - 32, align: 'right' });
    y += 46;

    // ── FIRMA ────────────────────────────────────────────────────────────────
    if (y + 80 < doc.page.height - 36) {
      doc.fillColor(MUTED).font('Helvetica').fontSize(9)
         .text(`He recibido la suma de ${cs(neto)} Córdobas Netos`, M, y, { width: CW });
      doc.text(`correspondiente a la quincena del período ${periodoStr}.`, M, y + 13, { width: CW });
      y += 44;

      doc.moveTo(M, y + 28).lineTo(M + 180, y + 28).strokeColor('#555').lineWidth(0.5).stroke();
      doc.fillColor(TEXT).font('Helvetica').fontSize(8.5).text('Firma del empleado', M, y + 32);

      doc.moveTo(M + CW - 180, y + 28).lineTo(M + CW, y + 28).strokeColor('#555').lineWidth(0.5).stroke();
      doc.fillColor(TEXT).font('Helvetica').fontSize(8.5)
         .text('Quien entrega', M + CW - 180, y + 32, { width: 180, align: 'right' });
    }

    // Footer
    doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
       .text(`Nomify · Sistema de planilla · ${new Date().toLocaleString('es-NI')}`,
             M, doc.page.height - 26, { width: CW, align: 'center' });

    doc.end();
  });
}

module.exports = { generarReportePlanilla, generarReciboEmpleado, formatPeriodo };
