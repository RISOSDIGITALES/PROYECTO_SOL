const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SALARIO_MINIMO = 10913.54;
const INSS_RATE = 0.07;

// ─── HEALTH ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, db: 'MariaDB' }));

// ─── EMPLEADOS ─────────────────────────────────────────────────
app.get('/api/empleados', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados WHERE activo = 1 ORDER BY nombre');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/empleados/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/empleados', async (req, res) => {
  try {
    const { nombre, cargo, salario_mensual, tipo_planilla, inss_base, ir, email, rol } = req.body;
    const [result] = await db.query(
      'INSERT INTO empleados (nombre, cargo, salario_mensual, tipo_planilla, inss_base, ir_manual, email, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, cargo, salario_mensual, tipo_planilla || 'Con Seguro', inss_base || 'Salario Completo', ir || 0, email || '', rol || 'Empleado']
    );
    res.json({ id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/empleados/:id', async (req, res) => {
  try {
    const { nombre, cargo, salario_mensual, tipo_planilla, inss_base, ir, email, rol, activo } = req.body;
    await db.query(
      'UPDATE empleados SET nombre=?, cargo=?, salario_mensual=?, tipo_planilla=?, inss_base=?, ir_manual=?, email=?, rol=?, activo=? WHERE id=?',
      [nombre, cargo, salario_mensual, tipo_planilla, inss_base, ir || 0, email || '', rol || 'Empleado', activo ?? 1, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PRÉSTAMOS ─────────────────────────────────────────────────
app.get('/api/prestamos', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, e.nombre AS empleado_nombre
       FROM prestamos p JOIN empleados e ON p.empleado_id = e.id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/prestamos', async (req, res) => {
  try {
    const { empleado_id, monto_total, cuota_quincenal, cuotas_restantes, descripcion, fecha_inicio } = req.body;
    const [result] = await db.query(
      'INSERT INTO prestamos (empleado_id, monto_total, saldo_pendiente, cuota_quincenal, cuotas_restantes, descripcion, fecha_inicio) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [empleado_id, monto_total, monto_total, cuota_quincenal, cuotas_restantes || 0, descripcion || '', fecha_inicio || new Date().toISOString().split('T')[0]]
    );
    res.json({ id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/prestamos/:id', async (req, res) => {
  try {
    const campos = req.body;
    const sets = Object.keys(campos).map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE prestamos SET ${sets} WHERE id = ?`, [...Object.values(campos), req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ADELANTOS ─────────────────────────────────────────────────
app.get('/api/adelantos', async (req, res) => {
  try {
    const { empleado_id } = req.query;
    const where = empleado_id ? 'WHERE a.empleado_id = ?' : '';
    const params = empleado_id ? [empleado_id] : [];
    const [rows] = await db.query(
      `SELECT a.*, e.nombre AS empleado_nombre
       FROM adelantos a JOIN empleados e ON a.empleado_id = e.id
       ${where} ORDER BY a.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/adelantos', async (req, res) => {
  try {
    const { empleado_id, monto, quincena_descuento, descripcion } = req.body;
    if (monto > 2000) return res.status(400).json({ error: 'Adelanto máximo C$2,000' });
    const [result] = await db.query(
      'INSERT INTO adelantos (empleado_id, monto, quincena_descuento, descripcion) VALUES (?, ?, ?, ?)',
      [empleado_id, monto, quincena_descuento, descripcion || '']
    );
    res.json({ id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/adelantos/:id', async (req, res) => {
  try {
    const campos = req.body;
    const sets = Object.keys(campos).map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE adelantos SET ${sets} WHERE id = ?`, [...Object.values(campos), req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── EXTRAS ────────────────────────────────────────────────────
app.get('/api/extras', async (req, res) => {
  try {
    const { empleado_id } = req.query;
    const where = empleado_id ? 'WHERE x.empleado_id = ?' : '';
    const params = empleado_id ? [empleado_id] : [];
    const [rows] = await db.query(
      `SELECT x.*, e.nombre AS empleado_nombre
       FROM extras x JOIN empleados e ON x.empleado_id = e.id
       ${where} ORDER BY x.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/extras', async (req, res) => {
  try {
    const { empleado_id, tipo, descripcion, monto, pagar_quincena } = req.body;
    const [result] = await db.query(
      'INSERT INTO extras (empleado_id, tipo, descripcion, monto, pagar_quincena) VALUES (?, ?, ?, ?, ?)',
      [empleado_id, tipo || 'Otro', descripcion || '', monto, pagar_quincena]
    );
    res.json({ id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/extras/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM extras WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DEDUCCIONES ───────────────────────────────────────────────
app.get('/api/deducciones', async (req, res) => {
  try {
    const { empleado_id } = req.query;
    const where = empleado_id ? 'WHERE d.empleado_id = ?' : '';
    const params = empleado_id ? [empleado_id] : [];
    const [rows] = await db.query(
      `SELECT d.*, e.nombre AS empleado_nombre
       FROM deducciones d JOIN empleados e ON d.empleado_id = e.id
       ${where} ORDER BY d.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/deducciones', async (req, res) => {
  try {
    const { empleado_id, descripcion, monto, quincena_descuento } = req.body;
    const [result] = await db.query(
      'INSERT INTO deducciones (empleado_id, descripcion, monto, quincena_descuento) VALUES (?, ?, ?, ?)',
      [empleado_id, descripcion, monto, quincena_descuento]
    );
    res.json({ id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/deducciones/:id', async (req, res) => {
  try {
    const campos = req.body;
    const sets = Object.keys(campos).map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE deducciones SET ${sets} WHERE id = ?`, [...Object.values(campos), req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/deducciones/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM deducciones WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── VACACIONES ────────────────────────────────────────────────
app.get('/api/vacaciones', async (req, res) => {
  try {
    const { empleado_id } = req.query;
    const where = empleado_id ? 'WHERE v.empleado_id = ?' : '';
    const params = empleado_id ? [empleado_id] : [];
    const [rows] = await db.query(
      `SELECT v.*, e.nombre AS empleado_nombre
       FROM vacaciones v JOIN empleados e ON v.empleado_id = e.id
       ${where} ORDER BY v.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/vacaciones', async (req, res) => {
  try {
    const { empleado_id, fecha_inicio, fecha_fin, dias, pagadas, monto } = req.body;
    const [result] = await db.query(
      'INSERT INTO vacaciones (empleado_id, fecha_inicio, fecha_fin, dias, pagadas, monto) VALUES (?, ?, ?, ?, ?, ?)',
      [empleado_id, fecha_inicio, fecha_fin, dias, pagadas ? 1 : 0, monto || null]
    );
    res.json({ id: result.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PLANILLAS ─────────────────────────────────────────────────
app.get('/api/planillas', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, COUNT(dp.id) AS num_empleados
       FROM planillas p LEFT JOIN detalle_planilla dp ON p.id = dp.planilla_id
       GROUP BY p.id ORDER BY p.created_at DESC LIMIT 30`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/planillas/:id/detalle', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT dp.*, e.nombre AS empleado_nombre
       FROM detalle_planilla dp JOIN empleados e ON dp.empleado_id = e.id
       WHERE dp.planilla_id = ?`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── RECIBO ────────────────────────────────────────────────────
app.get('/api/recibo', async (req, res) => {
  try {
    const { empleado_id, planilla_id } = req.query;
    if (!empleado_id || !planilla_id) return res.status(400).json({ error: 'Se requiere empleado_id y planilla_id' });

    const [[planilla]] = await db.query('SELECT * FROM planillas WHERE id = ?', [planilla_id]);
    const [[detalle]] = await db.query(
      'SELECT * FROM detalle_planilla WHERE planilla_id = ? AND empleado_id = ?',
      [planilla_id, empleado_id]
    );
    const [[empleado]] = await db.query('SELECT * FROM empleados WHERE id = ?', [empleado_id]);

    if (!detalle) return res.status(404).json({ error: 'Recibo no encontrado' });

    res.json({ planilla, empleado, detalle });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── CALCULAR PLANILLA ─────────────────────────────────────────
app.post('/api/planillas/calcular', async (req, res) => {
  const { periodo, tipo } = req.body;
  if (!periodo) return res.status(400).json({ error: 'Se requiere periodo (YYYY-MM-DD)' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Empleados activos, opcionalmente filtrados por tipo
    let query = 'SELECT * FROM empleados WHERE activo = 1';
    const params = [];
    if (tipo) { query += ' AND tipo_planilla = ?'; params.push(tipo); }
    const [empleados] = await conn.query(query, params);
    if (!empleados.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'No hay empleados activos' });
    }

    // 2. Cargar todos los datos del período de una sola vez
    const [adelantos]   = await conn.query('SELECT * FROM adelantos   WHERE quincena_descuento = ? AND estado = "Pendiente" AND pausado = 0', [periodo]);
    const [prestamos]   = await conn.query('SELECT * FROM prestamos   WHERE estado = "Activo" AND saldo_pendiente > 0');
    const [extras]      = await conn.query('SELECT * FROM extras      WHERE pagar_quincena = ?', [periodo]);
    const [deducciones] = await conn.query('SELECT * FROM deducciones WHERE quincena_descuento = ? AND estado = "Pendiente" AND pausado = 0', [periodo]);

    // Indexar por empleado_id
    const idx = arr => arr.reduce((m, r) => { (m[r.empleado_id] = m[r.empleado_id] || []).push(r); return m; }, {});
    const adelantosPor  = idx(adelantos);
    const prestamosPor  = idx(prestamos);
    const extrasPor     = idx(extras);
    const deduccPor     = idx(deducciones);

    // 3. Calcular por empleado
    const detalles = [];
    let totalBruto = 0, totalDesc = 0, totalNeto = 0;

    for (const emp of empleados) {
      const salarioQuincenal = Math.round(parseFloat(emp.salario_mensual) / 2 * 100) / 100;

      // INSS
      let inss = 0;
      if (emp.tipo_planilla !== 'Sin Seguro') {
        const base = emp.inss_base === 'Salario Mínimo' ? SALARIO_MINIMO : parseFloat(emp.salario_mensual);
        inss = Math.round((base / 2) * INSS_RATE * 100) / 100;
      }

      const ir            = parseFloat(emp.ir_manual || 0);
      const empAdelantos  = adelantosPor[emp.id] || [];
      const empPrestamos  = prestamosPor[emp.id] || [];
      const empExtras     = extrasPor[emp.id] || [];
      const empDeduc      = deduccPor[emp.id] || [];

      const descAdelanto  = empAdelantos.reduce((s, a) => s + parseFloat(a.monto), 0);
      const descPrestamo  = empPrestamos.reduce((s, p) => s + Math.min(parseFloat(p.cuota_quincenal), parseFloat(p.saldo_pendiente)), 0);
      const totalExtras   = empExtras.reduce((s, x) => s + parseFloat(x.monto), 0);
      const descDed       = empDeduc.reduce((s, d) => s + parseFloat(d.monto), 0);

      const subtotal      = Math.round((salarioQuincenal + totalExtras) * 100) / 100;
      const descTotal     = Math.round((inss + ir + descAdelanto + descPrestamo + descDed) * 100) / 100;
      const neto          = Math.round((subtotal - descTotal) * 100) / 100;

      totalBruto += subtotal;
      totalDesc  += descTotal;
      totalNeto  += neto;

      detalles.push({
        empleado_id: emp.id,
        tipo_planilla: emp.tipo_planilla,
        salario_quincenal: salarioQuincenal,
        extras: totalExtras,
        subtotal,
        inss, ir,
        desc_adelantos: descAdelanto,
        desc_prestamos: descPrestamo,
        desc_deducciones: descDed,
        total_descuentos: descTotal,
        neto_pagar: neto,
        _adelantosIds: empAdelantos.map(a => a.id),
        _deduccionesIds: empDeduc.map(d => d.id),
        _prestamosData: empPrestamos.map(p => ({
          id: p.id,
          cuota: parseFloat(p.cuota_quincenal),
          saldo: parseFloat(p.saldo_pendiente),
          cuotas_restantes: p.cuotas_restantes || 0,
          historial_pagos: p.historial_pagos || ''
        })),
      });
    }

    // Calcular rango de fechas del período
    const fechaFin = new Date(periodo + 'T12:00:00');
    const dia = fechaFin.getDate();
    const fechaInicio = new Date(fechaFin);
    fechaInicio.setDate(dia === 15 ? 1 : 16);
    const toDate = d => d.toISOString().split('T')[0];

    // 4. Crear encabezado de planilla
    const [planRes] = await conn.query(
      'INSERT INTO planillas (periodo, tipo, fecha_inicio, fecha_fin, estado, total_bruto, total_deducciones, total_neto) VALUES (?, ?, ?, ?, "Borrador", ?, ?, ?)',
      [periodo, tipo || '', toDate(fechaInicio), toDate(fechaFin),
       Math.round(totalBruto * 100) / 100,
       Math.round(totalDesc * 100) / 100,
       Math.round(totalNeto * 100) / 100]
    );
    const planillaId = planRes.insertId;

    // 5. Insertar detalle por empleado
    for (const d of detalles) {
      await conn.query(
        `INSERT INTO detalle_planilla
          (planilla_id, empleado_id, tipo_planilla, salario_quincenal, extras, subtotal,
           inss, ir, desc_adelantos, desc_prestamos, desc_deducciones, total_descuentos, neto_pagar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [planillaId, d.empleado_id, d.tipo_planilla, d.salario_quincenal, d.extras, d.subtotal,
         d.inss, d.ir, d.desc_adelantos, d.desc_prestamos, d.desc_deducciones, d.total_descuentos, d.neto_pagar]
      );
    }

    // 6. Marcar adelantos y deducciones como Descontado
    const adelIds = detalles.flatMap(d => d._adelantosIds);
    if (adelIds.length) await conn.query(`UPDATE adelantos SET estado = "Descontado" WHERE id IN (${adelIds.map(() => '?').join(',')})`, adelIds);

    const dedIds = detalles.flatMap(d => d._deduccionesIds);
    if (dedIds.length) await conn.query(`UPDATE deducciones SET estado = "Descontado" WHERE id IN (${dedIds.map(() => '?').join(',')})`, dedIds);

    // 7. Actualizar préstamos: saldo, cuotas restantes, historial
    for (const d of detalles) {
      for (const p of d._prestamosData) {
        const cuota = Math.min(p.cuota, p.saldo);
        const nuevoSaldo = Math.max(0, p.saldo - cuota);
        const nuevasCuotas = Math.max(0, (p.cuotas_restantes || 1) - 1);
        const entrada = `${periodo} | C$${cuota.toFixed(2)} | Descuento quincena`;
        const nuevoHistorial = p.historial_pagos ? `${p.historial_pagos}\n${entrada}` : entrada;
        await conn.query(
          'UPDATE prestamos SET saldo_pendiente = ?, cuotas_restantes = ?, estado = ?, historial_pagos = ? WHERE id = ?',
          [nuevoSaldo, nuevasCuotas, nuevoSaldo <= 0 ? 'Pagado' : 'Activo', nuevoHistorial, p.id]
        );
      }
    }

    await conn.query('UPDATE planillas SET estado = "Generada" WHERE id = ?', [planillaId]);
    await conn.commit();

    res.json({
      ok: true,
      planilla_id: planillaId,
      periodo,
      tipo: tipo || 'Todos',
      num_empleados: detalles.length,
      total_bruto: Math.round(totalBruto * 100) / 100,
      total_deducciones: Math.round(totalDesc * 100) / 100,
      total_neto: Math.round(totalNeto * 100) / 100,
    });

  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// ─── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Planilla backend corriendo en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
