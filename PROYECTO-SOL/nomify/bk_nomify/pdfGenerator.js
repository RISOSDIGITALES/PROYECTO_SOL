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
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diaInicio = d <= 15 ? 1 : 16;
  return `${diaInicio}-${d} de ${meses[m - 1]} ${y}`;
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

// ── Lista genérica (landscape) ─────────────────────────────────────────────────
/**
 * @param {object}  opts
 * @param {string}  opts.titulo        — Ej: "Historial de Préstamos"
 * @param {string}  [opts.subtitulo]   — Ej: "Todos los empleados"
 * @param {Array}   opts.columnas      — [{ label, width, align }]
 * @param {Array}   opts.filas         — [[val, val, ...], ...]
 * @param {Array}   [opts.totales]     — fila de pie opcional
 * @returns {Promise<Buffer>}
 */
function generarListaPDF({ titulo, subtitulo, columnas, filas, totales = null }) {
  checkFallback();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'LETTER', layout: 'landscape' });
    const bufs = [];
    doc.on('data', d => bufs.push(d));
    doc.on('end', () => resolve(Buffer.concat(bufs)));
    doc.on('error', reject);

    const W  = doc.page.width;  // 792 landscape
    const M  = 36;
    const CW = W - M * 2;       // 720

    // Header
    doc.rect(M, M, CW, 52).fill(PRIMARY);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('Nomify', M + 16, M + 11);
    doc.fillColor('#8899aa').font('Helvetica').fontSize(9).text('Sistema de planilla', M + 16, M + 31);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13)
       .text(titulo, M + 210, M + 12, { width: CW - 225 });
    if (subtitulo) {
      doc.fillColor('#8899aa').font('Helvetica').fontSize(9)
         .text(subtitulo, M + 210, M + 28, { width: CW - 225 });
    }

    let y = M + 64;

    // Escalar columnas para que sumen exactamente CW
    const totalW = columnas.reduce((s, c) => s + c.width, 0);
    const scale  = CW / totalW;
    const cols   = columnas.map(c => ({ ...c, w: Math.floor(c.width * scale) }));
    const usedW  = cols.reduce((s, c) => s + c.w, 0);
    cols[cols.length - 1].w += CW - usedW; // corregir redondeo

    function drawHeader(yy) {
      doc.rect(M, yy, CW, 20).fill(PRIMARY);
      let cx = M;
      cols.forEach(col => {
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5)
           .text(col.label, cx + 4, yy + 6, { width: col.w - 8, align: col.align || 'left' });
        cx += col.w;
      });
      return yy + 20;
    }

    y = drawHeader(y);
    const ROW_H = 17;

    (filas || []).forEach((fila, idx) => {
      if (y + ROW_H > doc.page.height - 50) {
        doc.addPage({ layout: 'landscape' });
        y = M;
        y = drawHeader(y);
      }
      doc.rect(M, y, CW, ROW_H).fill(idx % 2 === 0 ? '#f8fafc' : '#ffffff');
      let cx = M;
      fila.forEach((val, i) => {
        const col = cols[i];
        if (!col) return;
        doc.fillColor(TEXT).font('Helvetica').fontSize(7.5)
           .text(String(val ?? '—'), cx + 4, y + 5, { width: col.w - 8, align: col.align || 'left' });
        cx += col.w;
      });
      hline(doc, M, M + CW, y + ROW_H);
      y += ROW_H;
    });

    // Fila totales
    if (totales && totales.length) {
      if (y + 22 > doc.page.height - 50) { doc.addPage({ layout: 'landscape' }); y = M; }
      doc.rect(M, y, CW, 22).fill(PRIMARY);
      let cx = M;
      totales.forEach((val, i) => {
        const col = cols[i];
        if (!col) return;
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8)
           .text(String(val ?? ''), cx + 4, y + 7, { width: col.w - 8, align: col.align || 'left' });
        cx += col.w;
      });
    }

    // Footer
    doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
       .text(`Nomify · Sistema de planilla · Generado el ${new Date().toLocaleString('es-NI')}`,
             M, doc.page.height - 26, { width: CW, align: 'center' });

    doc.end();
  });
}

/**
 * Genera un PDF de calendario mensual con grilla 7 columnas.
 * @param {number} opts.mes       — 1-12
 * @param {number} opts.anio
 * @param {Array}  opts.eventos   — [
 *   { fecha:'YYYY-MM-DD', tipo, texto }            ← evento puntual
 *   { fecha:'YYYY-MM-DD', fechaFin:'YYYY-MM-DD', tipo, texto } ← rango (vacaciones)
 * ]
 * @returns {Promise<Buffer>}
 */
function generarCalendarioPDF({ mes, anio, eventos = [] }) {
  checkFallback();
  return new Promise((resolve, reject) => {
    // bottom: 0 → pdfkit no agrega páginas automáticas al colocar pie
    const doc  = new PDFDocument({ size: 'LETTER', margins: { top: 30, bottom: 0, left: 30, right: 30 } });
    const bufs = [];
    doc.on('data', d => bufs.push(d));
    doc.on('end', () => resolve(Buffer.concat(bufs)));
    doc.on('error', reject);

    const W  = doc.page.width;   // 612
    const H  = doc.page.height;  // 792
    const M  = 30;
    const CW = W - M * 2;        // 552

    // Espacio reservado: más para actividades, grid más compacto
    const EVLIST_RESERVE = 210;
    const FOOTER_RESERVE = 22;

    const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const DOW_ES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const mesNombre = MESES_ES[(mes - 1) % 12] || '';

    // Separar eventos de rango (vacaciones) de eventos puntuales
    const rangeEvs   = [];   // [{fecha, fechaFin, tipo, texto}]
    const pointEvMap = {};   // {dStr: [{tipo, texto}]}

    eventos.forEach(ev => {
      if (ev.fechaFin) {
        rangeEvs.push(ev);
      } else {
        if (!pointEvMap[ev.fecha]) pointEvMap[ev.fecha] = [];
        pointEvMap[ev.fecha].push({ tipo: ev.tipo || '', texto: ev.texto || '' });
      }
    });

    // Devuelve todos los eventos (puntuales + rangos) para una celda
    function getCellEvs(dStr) {
      const evs = [...(pointEvMap[dStr] || [])];
      rangeEvs.forEach(ev => {
        if (dStr >= ev.fecha && dStr <= ev.fechaFin)
          evs.push({ tipo: ev.tipo || '', texto: ev.texto || '' });
      });
      return evs;
    }

    // ── HEADER — estilo limpio (fondo blanco, texto oscuro) ─────────────────────
    // Fondo blanco del área del header
    doc.rect(M, M, CW, 56).fill('#ffffff');
    // Nombre del mes grande a la izquierda
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(28)
       .text(mesNombre.toUpperCase(), M, M + 6, { lineBreak: false });
    // Año grande a la derecha
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(28)
       .text(String(anio), M, M + 6, { width: CW, align: 'right', lineBreak: false });
    // Subtítulo
    doc.fillColor(MUTED).font('Helvetica').fontSize(8)
       .text('Nomify · Sistema de planilla', M, M + 38, { lineBreak: false });
    // Línea separadora
    doc.save().strokeColor(PRIMARY).lineWidth(1.5)
       .moveTo(M, M + 52).lineTo(M + CW, M + 52).stroke().restore();

    let y = M + 60;

    // ── CABECERAS DE DÍAS ──────────────────────────────────────────────────────
    const DOW_H   = 16;
    const cellW   = Math.floor(CW / 7);
    const lastExt = CW - cellW * 7;
    const cX = c => M + c * cellW;
    const cW = c => c === 6 ? cellW + lastExt : cellW;

    DOW_ES.forEach((d, c) => {
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7)
         .text(d.toUpperCase(), cX(c), y + 4, { width: cW(c), align: 'center', lineBreak: false });
    });
    // Línea debajo de cabeceras
    hline(doc, M, M + CW, y + DOW_H - 1, '#cbd5e1');
    y += DOW_H;

    // ── CUADRÍCULA ───────────────────────────────────────────────────────────
    const firstDow    = new Date(anio, mes - 1, 1).getDay();
    const daysInMonth = new Date(anio, mes, 0).getDate();
    const numRows     = Math.ceil((firstDow + daysInMonth) / 7);
    const GRID_H      = H - y - EVLIST_RESERVE - FOOTER_RESERVE - M;
    const cellH       = Math.floor(GRID_H / numRows);

    const todayStr = new Date().toISOString().substring(0, 10);
    const TYPE_CLR = {
      quincena: '#16a34a', feriado:  '#7c3aed',
      vacacion: '#2563eb', adelanto: '#dc2626', extra: '#d97706',
      cumple:   '#db2777',
    };
    // Colores de fondo de celda para tipos especiales (opacidad real)
    const TYPE_BG = {
      quincena: [22, 163, 74,  0.08],  // verde muy suave
      feriado:  [124, 58, 237, 0.08],  // violeta muy suave
    };

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < 7; c++) {
        const idx = r * 7 + c;
        const day = idx - firstDow + 1;
        const cx  = cX(c);
        const cy  = y + r * cellH;
        const cw  = cW(c);

        // Celda vacía
        if (day < 1 || day > daysInMonth) {
          doc.save().strokeColor('#e2e8f0').lineWidth(0.3)
             .roundedRect(cx + 1, cy + 1, cw - 2, cellH - 2, 4).stroke().restore();
          continue;
        }

        const mm   = String(mes).padStart(2, '0');
        const dd   = String(day).padStart(2, '0');
        const dStr = `${anio}-${mm}-${dd}`;
        const evs  = getCellEvs(dStr);

        const isQui = evs.some(e => e.tipo === 'quincena');
        const isFer = evs.some(e => e.tipo === 'feriado');
        const isHoy = dStr === todayStr;

        // Fondo + borde redondeado de celda
        const RR = 4; // radio de esquinas
        const bClr = isHoy ? '#16a34a' : isQui ? '#86efac' : isFer ? '#c4b5fd' : '#e2e8f0';
        const bW   = isHoy ? 1.5 : 0.4;
        const bgFill = isQui ? [22,163,74,0.08] : isFer ? [124,58,237,0.08] : null;

        doc.save();
        // Fondo
        if (bgFill) {
          const [r2, g2, b2, a2] = bgFill;
          doc.fillOpacity(a2).fillColor(`rgb(${r2},${g2},${b2})`)
             .roundedRect(cx + 1, cy + 1, cw - 2, cellH - 2, RR).fill();
        } else {
          doc.fillOpacity(1).fillColor('#ffffff')
             .roundedRect(cx + 1, cy + 1, cw - 2, cellH - 2, RR).fill();
        }
        // Borde
        doc.fillOpacity(1).strokeColor(bClr).lineWidth(bW)
           .roundedRect(cx + 1, cy + 1, cw - 2, cellH - 2, RR).stroke();
        doc.restore();

        // Número del día
        const numClr = isHoy ? '#16a34a' : isQui ? '#15803d' : isFer ? '#6d28d9' : '#1e293b';
        doc.fillColor(numClr).font('Helvetica-Bold').fontSize(8.5)
           .text(String(day), cx + 3, cy + 3, { width: 16, align: 'left', lineBreak: false });

        // Etiquetas de eventos (texto con punto de color, sin rectángulo de fondo)
        let ey = cy + 14;
        evs.forEach(ev => {
          if (ey > cy + cellH - 5 || !ev.texto) return;
          const clr = TYPE_CLR[ev.tipo] || MUTED;
          const txt = ev.texto.length > 10 ? ev.texto.substring(0, 9) + '…' : ev.texto;
          // Punto de color sólido
          doc.save().fillOpacity(1).fillColor(clr).circle(cx + 4, ey + 3, 2).fill().restore();
          // Texto
          doc.fillColor(clr).font('Helvetica').fontSize(5.8)
             .text(txt, cx + 8, ey, { width: cw - 10, lineBreak: false });
          ey += 8;
        });
      }
    }

    // ── ACTIVIDADES DEL MES ───────────────────────────────────────────────────
    const gridBottom = y + numRows * cellH;
    const listTop    = gridBottom + 8;
    const MAX_EV_Y   = H - FOOTER_RESERVE - 4;

    const TYPE_LABEL = {
      quincena: 'Quincena', feriado: 'Feriado',
      vacacion: 'Vacación', adelanto: 'Adelanto', extra: 'Extra',
      cumple:   'Cumpleaños',
    };
    const MESES_ES2 = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                       'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const evList = [];

    // Vacaciones (rangos) — una fila por empleado
    const seenRange = new Set();
    rangeEvs.forEach(ev => {
      const key = `${ev.tipo}|${ev.texto}|${ev.fecha}|${ev.fechaFin}`;
      if (seenRange.has(key)) return;
      seenRange.add(key);
      const [, m1, d1] = ev.fecha.split('-').map(Number);
      const [, m2, d2] = ev.fechaFin.split('-').map(Number);
      const dateLabel = m1 === m2
        ? `${d1}–${d2} de ${MESES_ES2[m1 - 1]}`
        : `${d1} ${MESES_ES2[m1 - 1]} – ${d2} ${MESES_ES2[m2 - 1]}`;
      evList.push({ dateLabel, tipo: ev.tipo, texto: ev.texto, sortKey: ev.fecha });
    });

    // Eventos puntuales
    const seenPoint = new Set();
    [...new Set(Object.keys(pointEvMap))].sort().forEach(dStr => {
      const [, md, dd] = dStr.split('-').map(Number);
      const dateLabel  = `${dd} de ${MESES_ES2[md - 1]}`;
      pointEvMap[dStr].forEach(ev => {
        const key = `${dStr}|${ev.tipo}|${ev.texto}`;
        if (seenPoint.has(key)) return;
        seenPoint.add(key);
        evList.push({ dateLabel, tipo: ev.tipo, texto: ev.texto, sortKey: dStr });
      });
    });

    evList.sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0));

    if (evList.length > 0 && listTop + 20 < MAX_EV_Y) {
      // Título sección
      hline(doc, M, M + CW, listTop, '#cbd5e1');
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(7)
         .text('ACTIVIDADES DEL MES', M, listTop + 4,
               { characterSpacing: 0.6, lineBreak: false });

      // Tarjetas en dos columnas — más grandes y espaciadas
      const CARD_H   = 28;
      const CARD_GAP = 5;
      const colW2    = Math.floor(CW / 2) - 4;
      const lx1      = M;
      const lx2      = M + Math.floor(CW / 2) + 4;
      let ly1 = listTop + 14, ly2 = listTop + 14;

      evList.forEach((ev, idx) => {
        const isRight = idx % 2 === 1;
        const lx = isRight ? lx2 : lx1;
        const ly = isRight ? ly2 : ly1;
        if (ly + CARD_H > MAX_EV_Y) return;

        const clr = TYPE_CLR[ev.tipo] || MUTED;
        const lbl = TYPE_LABEL[ev.tipo] || ev.tipo;

        // Fondo de tarjeta con esquinas redondeadas
        doc.save()
           .fillOpacity(0.06).fillColor(clr)
           .roundedRect(lx, ly, colW2, CARD_H, 4).fill()
           .restore();
        // Borde izquierdo de color
        doc.save()
           .fillOpacity(1).fillColor(clr)
           .roundedRect(lx, ly, 3, CARD_H, 2).fill()
           .restore();
        // Badge tipo (arriba)
        doc.fillColor(clr).font('Helvetica-Bold').fontSize(6.5)
           .text(lbl, lx + 8, ly + 5, { lineBreak: false });
        // Nombre en negrita
        const nombre = ev.texto || '';
        if (nombre) {
          const badgeW = doc.widthOfString(lbl, { fontSize: 6.5 });
          doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(7)
             .text(nombre, lx + 10 + badgeW, ly + 4.5,
                   { width: colW2 - 14 - badgeW, lineBreak: false });
        }
        // Fecha / detalle (abajo)
        doc.fillColor(MUTED).font('Helvetica').fontSize(6.5)
           .text(ev.dateLabel, lx + 8, ly + 16, { lineBreak: false });

        if (isRight) ly2 += CARD_H + CARD_GAP;
        else         ly1 += CARD_H + CARD_GAP;
      });
    }

    // ── PIE DE PÁGINA ─────────────────────────────────────────────────────────
    doc.fillColor(MUTED).font('Helvetica').fontSize(6.5)
       .text(`Nomify · Sistema de planilla · Generado el ${new Date().toLocaleDateString('es-NI')}`,
             M, H - FOOTER_RESERVE + 6, { width: CW, align: 'center', lineBreak: false });

    doc.end();
  });
}

module.exports = { generarReportePlanilla, generarReciboEmpleado, generarListaPDF, generarCalendarioPDF, formatPeriodo };
