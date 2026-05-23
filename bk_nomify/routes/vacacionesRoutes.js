const router = require('express').Router();
const db = require('../db');
const { requireAuth, requireMaster } = require('../auth');

const GET_SQL = `
  SELECT v.id, e.nombre AS Empleado,
    v.tipo AS Tipo,
    v.dias AS Dias,
    v.monto AS Monto,
    v.fecha_inicio AS Fecha_Inicio,
    v.fecha_fin AS Fecha_Fin,
    v.estado AS Estado,
    v.notas AS Notas,
    v.empleado_id
  FROM vacaciones v
  JOIN empleados e ON v.empleado_id = e.id`;

router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE v.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    const [rows] = await db.query(`${GET_SQL} ${where} ORDER BY v.id DESC`, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function resolveEmpleadoId(db, body) {
  if (body.empleado_id) return body.empleado_id;
  if (body['Empleado']) {
    const [rows] = await db.query('SELECT id FROM empleados WHERE nombre = ?', [body['Empleado']]);
    if (rows.length) return rows[0].id;
  }
  return null;
}

router.post('/', requireAuth, requireMaster, async (req, res) => {
  const b = req.body;
  const empleado_id = await resolveEmpleadoId(db, b);
  if (!empleado_id) return res.status(400).json({ error: 'Empleado requerido' });
  const tipo = b.tipo ?? b['Tipo'];
  const dias = b.dias ?? b['Dias'];
  const monto = b.monto ?? b['Monto'] ?? 0;
  const fecha_inicio = b.fecha_inicio ?? b['Fecha_Inicio'];
  const fecha_fin = b.fecha_fin ?? b['Fecha_Fin'];
  const estado = b.estado ?? b['Estado'] ?? 'Aprobada';
  const notas = b.notas ?? b['Notas'];
  const fecha_registro = b.fecha_registro ?? new Date().toISOString().split('T')[0];
  try {
    const [r] = await db.query(
      'INSERT INTO vacaciones (empleado_id, tipo, dias, monto, fecha_inicio, fecha_fin, estado, notas, fecha_registro) VALUES (?,?,?,?,?,?,?,?,?)',
      [empleado_id, tipo, dias, monto, fecha_inicio, fecha_fin, estado, notas, fecha_registro]
    );
    const [rows] = await db.query(`${GET_SQL} WHERE v.id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  const b = req.body;
  const mapping = {
    tipo:        b.tipo        ?? b['Tipo'],
    dias:        b.dias        ?? b['Dias'],
    monto:       b.monto       ?? b['Monto'],
    fecha_inicio: b.fecha_inicio ?? b['Fecha_Inicio'],
    fecha_fin:   b.fecha_fin   ?? b['Fecha_Fin'],
    estado:      b.estado      ?? b['Estado'],
    notas:       b.notas       ?? b['Notas'],
  };
  const sets = [], vals = [];
  for (const [col, val] of Object.entries(mapping)) {
    if (val !== undefined) { sets.push(`${col} = ?`); vals.push(val); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(id);
  try {
    await db.query(`UPDATE vacaciones SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(`${GET_SQL} WHERE v.id = ?`, [id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function deleteHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  try {
    await db.query('DELETE FROM vacaciones WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.patch('/', requireAuth, requireMaster, patchHandler);
router.patch('/:id', requireAuth, requireMaster, patchHandler);
router.delete('/', requireAuth, requireMaster, deleteHandler);
router.delete('/:id', requireAuth, requireMaster, deleteHandler);

module.exports = router;
