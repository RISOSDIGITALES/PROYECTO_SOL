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

const GET_SQL = `
  SELECT id, nombre AS Nombre, cargo AS Cargo,
    salario_bruto AS \`Salario bruto mensual\`,
    tipo_planilla AS Tipo_Planilla,
    DATE_FORMAT(fecha_ingreso, '%Y-%m-%d') AS \`Fecha de ingreso\`,
    inss_base AS INSS_Base, ir_fijo AS IR, ir_tipo AS IR_Tipo,
    activo AS Activo, email AS Email, rol AS Rol,
    empresa_id AS Empresa_ID
  FROM empleados`;

function mapBody(b) {
  return {
    nombre:        b.nombre        ?? b['Nombre'],
    cargo:         b.cargo         ?? b['Cargo'],
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
    if (req.empresaId) { conds.push('(empresa_id = ? OR empresa_id IS NULL)'); params.push(req.empresaId); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await db.query(`${GET_SQL} ${where} ORDER BY nombre ASC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, requireMaster, async (req, res) => {
  const m = mapBody(req.body);
  if (!m.nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    // Verificar correo duplicado antes de insertar
    if (m.email) {
      const [dup] = await db.query('SELECT id FROM empleados WHERE email = ?', [m.email]);
      if (dup.length) return res.status(400).json({ error: 'Ese correo ya está registrado, por favor usa otro' });
    }
    const empresaId = m.empresa_id || req.empresaId || null;
    const [r] = await db.query(
      'INSERT INTO empleados (nombre, cargo, tipo_planilla, salario_bruto, inss_base, ir_fijo, ir_tipo, email, rol, fecha_ingreso, activo, empresa_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [m.nombre, m.cargo, m.tipo_planilla || 'Con Seguro', m.salario_bruto || 0,
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
  const MYSQL_NAMES = ['nombre','cargo','tipo_planilla','salario_bruto','inss_base','ir_fijo','ir_tipo','email','rol','fecha_ingreso','activo','planillas_acceso','empresa_id'];
  const sets = [], vals = [];
  for (const c of MYSQL_NAMES) {
    if (m[c] !== undefined) { sets.push(`${c} = ?`); vals.push(m[c] !== '' ? m[c] : null); }
  }
  if (req.body.planillas_acceso !== undefined) { sets.push('planillas_acceso = ?'); vals.push(req.body.planillas_acceso); }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });

  vals.push(id);
  try {
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

module.exports = router;
