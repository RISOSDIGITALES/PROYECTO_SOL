const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

// Lazy-load PDF y mailer
let generarReciboEmpleado = null;
let pdfFormatPeriodo = null;
try {
  const pdf = require('../pdfGenerator');
  generarReciboEmpleado = pdf.generarReciboEmpleado;
  pdfFormatPeriodo      = pdf.formatPeriodo;
} catch (_) {}

let enviarReciboEmpleado = async () => { throw new Error('Mailer no disponible'); };
try { enviarReciboEmpleado = require('../mailer').enviarReciboEmpleado; } catch (_) {}

// GET /api/recibo?empleado_id=X&periodo=Y
router.get('/', requireAuth, async (req, res) => {
  const { empleado_id, periodo } = req.query;
  if (!empleado_id || !periodo) {
    return res.status(400).json({ error: 'Se requiere ?empleado_id= y ?periodo=' });
  }
  // Empleado solo puede ver su propio recibo
  if (req.user.rol === 'Empleado' && String(req.user.empleado_id) !== String(empleado_id)) {
    return res.status(403).json({ error: 'No autorizado para ver este recibo' });
  }

  const [anio, mes, dia] = periodo.split('-').map(Number);
  const esQ1 = dia <= 15;
  const fechaIni = `${anio}-${String(mes).padStart(2, '0')}-${esQ1 ? '01' : '16'}`;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const fechaFin  = `${anio}-${String(mes).padStart(2, '0')}-${esQ1 ? '15' : String(ultimoDia).padStart(2, '0')}`;

  try {
    const [[empleado], [detalle], [adelantos], [prestamos], [extras], [deducciones], [vacaciones]] = await Promise.all([
      db.query('SELECT * FROM empleados WHERE id = ?', [empleado_id]),
      db.query('SELECT * FROM detalle_planilla WHERE empleado_id = ? AND periodo = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM adelantos WHERE empleado_id = ? AND descontar_en = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM prestamos WHERE empleado_id = ? AND estado = ?', [empleado_id, 'Activo']),
      db.query('SELECT * FROM extras WHERE empleado_id = ? AND pagar_en = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM deducciones WHERE empleado_id = ? AND descontar_en = ?', [empleado_id, periodo]),
      db.query(
        `SELECT * FROM vacaciones
         WHERE empleado_id = ? AND tipo = 'Pagadas'
         AND fecha_inicio >= ? AND fecha_inicio <= ?`,
        [empleado_id, fechaIni, fechaFin]
      ),
    ]);

    res.json({
      empleado:   empleado[0]   || {},
      detalle:    detalle[0]    || {},
      adelantos,
      prestamos,
      extras,
      deducciones,
      vacaciones,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/recibo/descargar?empleado_id=X&periodo=Y — devuelve PDF como archivo descargable
router.get('/descargar', requireAuth, async (req, res) => {
  const { empleado_id, periodo } = req.query;
  if (!empleado_id || !periodo)
    return res.status(400).json({ error: 'Se requiere ?empleado_id= y ?periodo=' });
  if (!generarReciboEmpleado)
    return res.status(500).json({ error: 'pdfkit no instalado — ejecuta npm install en bk_nomify/' });

  if (req.user.rol === 'Empleado' && String(req.user.empleado_id) !== String(empleado_id))
    return res.status(403).json({ error: 'No autorizado para descargar este recibo' });

  const [anio, mes, dia] = periodo.split('-').map(Number);
  const esQ1     = dia <= 15;
  const mm       = String(mes).padStart(2, '0');
  const ultDia   = new Date(anio, mes, 0).getDate();
  const fechaIni = `${anio}-${mm}-${esQ1 ? '01' : '16'}`;
  const fechaFin = `${anio}-${mm}-${esQ1 ? '15' : String(ultDia).padStart(2, '0')}`;

  try {
    const [[empRows], [detRows], [adelantos], [extras], [deducciones], [vacaciones]] = await Promise.all([
      db.query(`SELECT e.*, emp.nombre AS empresa_nombre
                FROM empleados e LEFT JOIN empresas emp ON e.empresa_id = emp.id
                WHERE e.id = ?`, [empleado_id]),
      db.query('SELECT * FROM detalle_planilla WHERE empleado_id = ? AND periodo = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM adelantos WHERE empleado_id = ? AND descontar_en = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM extras WHERE empleado_id = ? AND pagar_en = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM deducciones WHERE empleado_id = ? AND descontar_en = ?', [empleado_id, periodo]),
      db.query(`SELECT * FROM vacaciones WHERE empleado_id = ? AND tipo = 'Pagadas'
                AND fecha_inicio >= ? AND fecha_inicio <= ?`, [empleado_id, fechaIni, fechaFin]),
    ]);

    const empleado = empRows[0];
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });
    const detalle  = detRows[0] || {};
    const empresa  = empleado.empresa_id
      ? { id: empleado.empresa_id, nombre: empleado.empresa_nombre }
      : null;

    const pdfBuffer = await generarReciboEmpleado({ empresa, empleado, detalle, extras, adelantos, deducciones, vacaciones, periodo });
    const slug      = (empleado.nombre || 'empleado').replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const filename  = `recibo-${slug}-${periodo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/recibo/enviar — genera PDF del recibo y lo envía por correo
router.post('/enviar', requireAuth, async (req, res) => {
  const { email, empleado_id, periodo } = req.body;
  if (!email || !empleado_id || !periodo)
    return res.status(400).json({ error: 'Se requiere email, empleado_id y periodo' });
  if (!process.env.SMTP_HOST)
    return res.status(400).json({ error: 'SMTP no configurado en el servidor. Agrega las variables de correo en .env' });
  if (!generarReciboEmpleado)
    return res.status(500).json({ error: 'pdfkit no instalado — ejecuta npm install en bk_nomify/' });

  // Empleado solo puede enviar su propio recibo
  if (req.user.rol === 'Empleado' && String(req.user.empleado_id) !== String(empleado_id))
    return res.status(403).json({ error: 'No autorizado para enviar este recibo' });

  const [anio, mes, dia] = periodo.split('-').map(Number);
  const esQ1     = dia <= 15;
  const mm       = String(mes).padStart(2, '0');
  const ultDia   = new Date(anio, mes, 0).getDate();
  const fechaIni = `${anio}-${mm}-${esQ1 ? '01' : '16'}`;
  const fechaFin = `${anio}-${mm}-${esQ1 ? '15' : String(ultDia).padStart(2, '0')}`;

  try {
    const [[empRows], [detRows], [adelantos], [extras], [deducciones], [vacaciones]] = await Promise.all([
      db.query(`
        SELECT e.*, emp.nombre AS empresa_nombre
        FROM empleados e
        LEFT JOIN empresas emp ON e.empresa_id = emp.id
        WHERE e.id = ?`, [empleado_id]),
      db.query('SELECT * FROM detalle_planilla WHERE empleado_id = ? AND periodo = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM adelantos WHERE empleado_id = ? AND descontar_en = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM extras WHERE empleado_id = ? AND pagar_en = ?', [empleado_id, periodo]),
      db.query('SELECT * FROM deducciones WHERE empleado_id = ? AND descontar_en = ?', [empleado_id, periodo]),
      db.query(
        `SELECT * FROM vacaciones WHERE empleado_id = ? AND tipo = 'Pagadas'
         AND fecha_inicio >= ? AND fecha_inicio <= ?`,
        [empleado_id, fechaIni, fechaFin]
      ),
    ]);

    const empleado = empRows[0];
    if (!empleado) return res.status(404).json({ error: 'Empleado no encontrado' });
    const detalle = detRows[0] || {};
    const empresa = empleado.empresa_id
      ? { id: empleado.empresa_id, nombre: empleado.empresa_nombre }
      : null;

    const pdfBuffer  = await generarReciboEmpleado({ empresa, empleado, detalle, extras, adelantos, deducciones, vacaciones, periodo });
    const periodoStr = pdfFormatPeriodo ? pdfFormatPeriodo(periodo) : periodo;
    await enviarReciboEmpleado(email, empleado.nombre, pdfBuffer, periodoStr);

    res.json({ ok: true, mensaje: `Recibo enviado a ${email}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
