const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireMaster } = require('../auth');

// Sincroniza (crea o actualiza) el usuario de un empleado cuando tiene email + rol
async function syncUsuario(empleadoId, nombre, email, rol, tipoPlanilla) {
  if (!email || !rol) return null;
  const planillasAcceso = null; // planillas_acceso ya no restringe — Planillero ve todas
  const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existing.length) {
    await db.query(
      'UPDATE usuarios SET nombre = ?, rol = ?, empleado_id = ?, planillas_acceso = ? WHERE email = ?',
      [nombre, rol, empleadoId, planillasAcceso, email]
    );
    return { created: false };
  } else {
    const hash = bcrypt.hashSync('Nomify2026', 10);
    await db.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, empleado_id, planillas_acceso) VALUES (?,?,?,?,?,?)',
      [nombre, email, hash, rol, empleadoId, planillasAcceso]
    );
    return { created: true };
  }
}

// Cédula nicaragüense: ###-######-####L
const CEDULA_RE = /^\d{3}-\d{6}-\d{4}[A-Za-z]$/;

// Extrae la fecha de nacimiento de los 6 dígitos centrales de la cédula (DDMMYY)
function parseBirthFromCedula(cedula) {
  if (!cedula || !CEDULA_RE.test(cedula)) return null;
  const mid  = cedula.split('-')[1];            // DDMMYY
  const dd   = parseInt(mid.substring(0, 2));
  const mm   = parseInt(mid.substring(2, 4));
  const yy   = parseInt(mid.substring(4, 6));
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
  const thisYY = new Date().getFullYear() % 100; // 26 en 2026
  const yyyy   = yy <= thisYY ? 2000 + yy : 1900 + yy;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getMonth() !== mm - 1) return null;     // fecha inválida (ej: 31 feb)
  return `${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
}

const GET_SQL = `
  SELECT id, nombre AS Nombre, cedula AS Cedula,
    DATE_FORMAT(fecha_nacimiento, '%Y-%m-%d') AS Fecha_Nacimiento,
    cargo AS Cargo,
    salario_bruto AS \`Salario bruto mensual\`,
    tipo_planilla AS Tipo_Planilla,
    DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') AS \`Fecha de ingreso\`,
    inss_base AS INSS_Base, ir_fijo AS IR, ir_tipo AS IR_Tipo,
    activo AS Activo, email AS Email, rol AS Rol,
    empresa_id AS Empresa_ID
  FROM empleados`;

function mapBody(b) {
  return {
    nombre:           b.nombre           ?? b['Nombre'],
    cedula:           b.cedula           ?? b['Cedula'],
    fecha_nacimiento: b.fecha_nacimiento ?? b['Fecha_Nacimiento'],
    cargo:            b.cargo            ?? b['Cargo'],
    tipo_planilla: b.tipo_planilla ?? b['Tipo_Planilla'],
    salario_bruto: b.salario_bruto ?? b['Salario bruto mensual'],
    inss_base:     b.inss_base     ?? b['INSS_Base'],
    ir_fijo:       b.ir_fijo       ?? b['IR'],
    ir_tipo:       b.ir_tipo       ?? b['IR_Tipo'],
    email:         b.email         ?? b['Email'],
    rol:           b.rol           ?? b['Rol'],
    fecha_ingreso: b.fecha_ingreso ?? b['Fecha de ingreso'],
    activo:        b.activo        !== undefined ? b.activo : b['Activo'],
    empresa_id:    b.empresa_id    ?? b['Empresa_ID'],
  };
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const conds = [], params = [];
    if (req.empresaId) { conds.push('empresa_id = ?'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`${GET_SQL} ${where} ORDER BY nombre ASC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, requireMaster, async (req, res) => {
  const m = mapBody(req.body);
  if (!m.nombre) return res.status(400).json({ error: 'Nombre requerido' });
  if (m.cedula && !CEDULA_RE.test(m.cedula))
    return res.status(400).json({ error: 'Formato de cédula inválido. Usa ###-######-####L (ej: 001-010590-0012A)' });
  // Auto-calcular cumpleaños desde la cédula si no viene explícito
  if (m.cedula && !m.fecha_nacimiento) m.fecha_nacimiento = parseBirthFromCedula(m.cedula);
  try {
    // Verificar correo duplicado antes de insertar
    if (m.email) {
      const [dup] = await db.query('SELECT id FROM empleados WHERE email = ?', [m.email]);
      if (dup.length) return res.status(400).json({ error: 'Ese correo ya está registrado, por favor usa otro' });
    }
    // Verificar cédula duplicada
    if (m.cedula) {
      const [dupC] = await db.query('SELECT id FROM empleados WHERE cedula = ?', [m.cedula.toUpperCase()]);
      if (dupC.length) return res.status(400).json({ error: 'Esa cédula ya está registrada en otro empleado' });
    }
    const empresaId = m.empresa_id || req.empresaId || null;
    const [r] = await db.query(
      'INSERT INTO empleados (nombre, cedula, fecha_nacimiento, cargo, tipo_planilla, salario_bruto, inss_base, ir_fijo, ir_tipo, email, rol, fecha_ingreso, activo, empresa_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [m.nombre, m.cedula ? m.cedula.toUpperCase() : null, m.fecha_nacimiento || null,
       m.cargo, m.tipo_planilla || 'Con Seguro', m.salario_bruto || 0,
       m.inss_base || 'Salario Completo', m.ir_fijo || null, m.ir_tipo || 'Sin IR', m.email, m.rol || 'Empleado',
       m.fecha_ingreso || null, m.activo !== undefined ? (m.activo ? 1 : 0) : 1, empresaId]
    );
    const empId = r.insertId;
    // Auto-crear usuario si tiene email y rol
    const sync = await syncUsuario(empId, m.nombre, m.email, m.rol, m.tipo_planilla);
    const [rows] = await db.query(GET_SQL + ' WHERE id = ?', [empId]);
    res.status(201).json({ ...rows[0], usuario_creado: sync?.created ?? false });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ese correo ya está registrado, por favor usa otro' });
    res.status(500).json({ error: e.message });
  }
});

async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });

  const m = mapBody(req.body);
  if (m.cedula && !CEDULA_RE.test(m.cedula))
    return res.status(400).json({ error: 'Formato de cédula inválido. Usa ###-######-####L (ej: 001-010590-0012A)' });
  if (m.cedula) {
    m.cedula = m.cedula.toUpperCase();
    const [dupC] = await db.query('SELECT id FROM empleados WHERE cedula = ? AND id != ?', [m.cedula, id]);
    if (dupC.length) return res.status(400).json({ error: 'Esa cédula ya está registrada en otro empleado' });
    // Auto-calcular cumpleaños si no se envió explícito
    if (!m.fecha_nacimiento) m.fecha_nacimiento = parseBirthFromCedula(m.cedula);
  }
  const MYSQL_NAMES = ['nombre','cedula','fecha_nacimiento','cargo','tipo_planilla','salario_bruto','inss_base','ir_fijo','ir_tipo','email','rol','fecha_ingreso','activo','planillas_acceso','empresa_id'];
  const sets = [], vals = [];
  for (const c of MYSQL_NAMES) {
    if (m[c] !== undefined) { sets.push(`${c} = ?`); vals.push(m[c] !== '' ? m[c] : null); }
  }
  if (req.body.planillas_acceso !== undefined) { sets.push('planillas_acceso = ?'); vals.push(req.body.planillas_acceso); }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });

  vals.push(id);
  try {
    // Si viene salario_bruto, guardar el anterior antes de actualizar
    if (m.salario_bruto !== undefined) {
      const [[empActual]] = await db.query('SELECT salario_bruto FROM empleados WHERE id = ?', [id]);
      const salAnterior = parseFloat(empActual?.salario_bruto || 0);
      const salNuevo    = parseFloat(m.salario_bruto || 0);
      if (salAnterior !== salNuevo) {
        const usuario = req.user?.email || req.user?.nombre || null;
        const motivo  = req.body.motivo_cambio || null;
        await db.query(
          'INSERT INTO historial_salarios (empleado_id, salario_anterior, salario_nuevo, fecha, usuario, motivo) VALUES (?,?,?,CURDATE(),?,?)',
          [id, salAnterior, salNuevo, usuario, motivo]
        );
      }
    }

    await db.query(`UPDATE empleados SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(GET_SQL + ' WHERE id = ?', [id]);
    const emp = rows[0];
    // Sincronizar usuario si el empleado tiene email y rol
    if (emp && emp.Email && emp.Rol) {
      await syncUsuario(id, emp.Nombre, emp.Email, emp.Rol, emp.Tipo_Planilla);
    }
    res.json(emp);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.patch('/', requireAuth, requireMaster, patchHandler);
router.patch('/:id', requireAuth, requireMaster, patchHandler);

// GET /api/empleados/:id/historial-salarios
router.get('/:id/historial-salarios', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.*, DATE_FORMAT(h.fecha,'%Y-%m-%d') AS fecha_fmt
       FROM historial_salarios h
       WHERE h.empleado_id = ?
       ORDER BY h.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/empleados/:id/historial — todas las transacciones del empleado
router.get('/:id/historial', requireAuth, async (req, res) => {
  const id = req.params.id;
  try {
    const [quincenas] = await db.query(`
      SELECT 'Quincena' AS tipo, DATE_FORMAT(p.periodo,'%Y-%m-%d') AS fecha,
             d.neto AS monto,
             CONCAT('Planilla #', p.folio, ' (', p.tipo, ') — Bruto: C$',
               FORMAT(d.salario_quincenal,2), ' | INSS: C$', FORMAT(d.inss,2),
               IF(d.ir>0, CONCAT(' | IR: C$', FORMAT(d.ir,2)), ''),
               IF(d.desc_prestamo>0, CONCAT(' | Préstamo: C$', FORMAT(d.desc_prestamo,2)), ''),
               IF(d.desc_adelanto>0, CONCAT(' | Adelanto: C$', FORMAT(d.desc_adelanto,2)), ''),
               IF(d.extras>0, CONCAT(' | Extras: C$', FORMAT(d.extras,2)), ''),
               ' | Neto: C$', FORMAT(d.neto,2)) AS descripcion,
             p.estado AS estado_ref
      FROM detalle_planilla d
      JOIN planillas p ON d.planilla_id = p.id
      WHERE d.empleado_id = ?`, [id]);

    const [prestamos] = await db.query(`
      SELECT 'Préstamo' AS tipo, DATE_FORMAT(fecha_inicio,'%Y-%m-%d') AS fecha,
             monto_total AS monto,
             CONCAT('Préstamo de C$', FORMAT(monto_total,2),
               ' — cuota C$', FORMAT(cuota_quincenal,2),
               ' | Saldo: C$', FORMAT(saldo_pendiente,2),
               ' | Estado: ', estado,
               IF(notas IS NOT NULL AND notas != '', CONCAT(' | ', notas), '')) AS descripcion,
             estado AS estado_ref
      FROM prestamos WHERE empleado_id = ?`, [id]);

    const [adelantos] = await db.query(`
      SELECT 'Adelanto' AS tipo, DATE_FORMAT(descontar_en,'%Y-%m-%d') AS fecha,
             monto, CONCAT('Adelanto de C$', FORMAT(monto,2),
               ' — Estado: ', estado) AS descripcion,
             estado AS estado_ref
      FROM adelantos WHERE empleado_id = ?`, [id]);

    const [extras] = await db.query(`
      SELECT 'Extra' AS tipo, DATE_FORMAT(pagar_en,'%Y-%m-%d') AS fecha,
             monto, CONCAT(COALESCE(descripcion,'Extra'), ': C$', FORMAT(monto,2)) AS descripcion,
             'Aplicado' AS estado_ref
      FROM extras WHERE empleado_id = ?`, [id]);

    const [deducciones] = await db.query(`
      SELECT 'Deducción' AS tipo, DATE_FORMAT(descontar_en,'%Y-%m-%d') AS fecha,
             monto, CONCAT(COALESCE(descripcion,'Deducción'), ': C$', FORMAT(monto,2),
               ' — Estado: ', estado) AS descripcion,
             estado AS estado_ref
      FROM deducciones WHERE empleado_id = ?`, [id]);

    const [vacaciones] = await db.query(`
      SELECT 'Vacaciones' AS tipo, DATE_FORMAT(fecha_inicio,'%Y-%m-%d') AS fecha,
             dias AS monto,
             CONCAT(tipo, ' — ', dias, ' días',
               IF(fecha_fin IS NOT NULL, CONCAT(' (hasta ', DATE_FORMAT(fecha_fin,'%d/%m/%Y'), ')'), ''),
               ' | Estado: ', estado) AS descripcion,
             estado AS estado_ref
      FROM vacaciones WHERE empleado_id = ?`, [id]);

    const [liquidaciones] = await db.query(`
      SELECT 'Liquidación' AS tipo, DATE_FORMAT(fecha_baja,'%Y-%m-%d') AS fecha,
             total AS monto,
             CONCAT(motivo, ' — Total: C$', FORMAT(total,2),
               IF(monto_vacaciones>0, CONCAT(' | Vac: C$', FORMAT(monto_vacaciones,2)), ''),
               IF(monto_aguinaldo>0, CONCAT(' | Agui: C$', FORMAT(monto_aguinaldo,2)), ''),
               IF(monto_indemnizacion>0, CONCAT(' | Indem: C$', FORMAT(monto_indemnizacion,2)), '')) AS descripcion,
             estado AS estado_ref
      FROM liquidaciones WHERE empleado_id = ?`, [id]);

    const todo = [
      ...quincenas, ...prestamos, ...adelantos,
      ...extras, ...deducciones, ...vacaciones, ...liquidaciones,
    ].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

    res.json(todo);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
