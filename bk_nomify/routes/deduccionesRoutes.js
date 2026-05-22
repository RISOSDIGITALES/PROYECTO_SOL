const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const GET_SQL = `
  SELECT d.id, e.nombre AS Empleado,
    IFNULL(d.concepto, d.descripcion) AS Concepto,
    IF(d.concepto IS NULL OR d.concepto = '', '', d.descripcion) AS \`Descripción\`,
    d.monto AS Monto,
    DATE_FORMAT(d.descontar_en, '%Y-%m-%d') AS \`Descontar en quincena\`,
    d.estado AS Estado,
    d.pausado AS Pausado,
    DATE_FORMAT(d.fecha_registro, '%Y-%m-%d') AS \`_createdTime\`,
    d.empleado_id
  FROM deducciones d
  JOIN empleados e ON d.empleado_id = e.id`;

router.get('/', requireAuth, async (req, res) => {
  try {
    const where = req.query.empleado_id ? 'WHERE d.empleado_id = ?' : '';
    const params = req.query.empleado_id ? [req.query.empleado_id] : [];
    let rows;
    try {
      [rows] = await db.query(`${GET_SQL} ${where} ORDER BY d.id DESC`, params);
    } catch (colErr) {
      // concepto column may not exist yet — fallback to descripcion only
      const FALLBACK = GET_SQL
        .replace("IFNULL(d.concepto, d.descripcion) AS Concepto,", 'd.descripcion AS Concepto,')
        .replace("IF(d.concepto IS NULL OR d.concepto = '', '', d.descripcion) AS `Descripción`,", "'' AS `Descripción`,");
      [rows] = await db.query(`${FALLBACK} ${where} ORDER BY d.id DESC`, params);
    }
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

router.post('/', requireAuth, async (req, res) => {
  const b = req.body;
  const empleado_id = await resolveEmpleadoId(db, b);
  if (!empleado_id) return res.status(400).json({ error: 'Empleado requerido' });
  const concepto = b.concepto ?? b['Concepto'];
  const descripcion = b.descripcion ?? b['Descripción'];
  const monto = b.monto ?? b['Monto'];
  const descontar_en = b.descontar_en ?? b['Descontar en quincena'];
  const estado = b.estado ?? b['Estado'] ?? 'Pendiente';
  const fecha_registro = b.fecha_registro ?? new Date().toISOString().split('T')[0];
  try {
    const [r] = await db.query(
      'INSERT INTO deducciones (empleado_id, concepto, descripcion, monto, descontar_en, estado, fecha_registro) VALUES (?,?,?,?,?,?,?)',
      [empleado_id, concepto, descripcion, monto, descontar_en, estado, fecha_registro]
    );
    const [rows] = await db.query(`${GET_SQL} WHERE d.id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function patchHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  const b = req.body;
  const mapping = {
    concepto:     b.concepto     ?? b['Concepto'],
    descripcion:  b.descripcion  ?? b['Descripción'],
    monto:        b.monto        ?? b['Monto'],
    descontar_en: b.descontar_en ?? b['Descontar en quincena'],
    estado:       b.estado       ?? b['Estado'],
    pausado:      b.pausado      !== undefined ? b.pausado : b['Pausado'],
  };
  const sets = [], vals = [];
  for (const [col, val] of Object.entries(mapping)) {
    if (val !== undefined) { sets.push(`${col} = ?`); vals.push(val); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(id);
  try {
    await db.query(`UPDATE deducciones SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(`${GET_SQL} WHERE d.id = ?`, [id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

async function deleteHandler(req, res) {
  const id = req.params.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Se requiere id' });
  try {
    await db.query('DELETE FROM deducciones WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

router.patch('/', requireAuth, patchHandler);
router.patch('/:id', requireAuth, patchHandler);
router.delete('/', requireAuth, deleteHandler);
router.delete('/:id', requireAuth, deleteHandler);

module.exports = router;
