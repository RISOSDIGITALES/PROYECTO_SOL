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

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ─── EMPLEADOS ────────────────────────────────────────────────
app.get('/api/empleados', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados WHERE activo = 1 ORDER BY nombre');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/empleados/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/empleados', async (req, res) => {
  try {
    const { nombre, cargo, salario_mensual, tipo_planilla, inss_base } = req.body;
    const [result] = await db.query(
      'INSERT INTO empleados (nombre, cargo, salario_mensual, tipo_planilla, inss_base) VALUES (?, ?, ?, ?, ?)',
      [nombre, cargo, salario_mensual, tipo_planilla || 'Con Seguro', inss_base || 'Salario Completo']
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/empleados/:id', async (req, res) => {
  try {
    const { nombre, cargo, salario_mensual, tipo_planilla, inss_base, activo } = req.body;
    await db.query(
      'UPDATE empleados SET nombre=?, cargo=?, salario_mensual=?, tipo_planilla=?, inss_base=?, activo=? WHERE id=?',
      [nombre, cargo, salario_mensual, tipo_planilla, inss_base, activo ?? 1, req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PRÉSTAMOS ────────────────────────────────────────────────
app.get('/api/prestamos', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, e.nombre as empleado_nombre FROM prestamos p JOIN empleados e ON p.empleado_id = e.id WHERE p.saldo_pendiente > 0 ORDER BY p.fecha_inicio DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/prestamos/:empleadoId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM prestamos WHERE empleado_id = ? ORDER BY fecha_inicio DESC',
      [req.params.empleadoId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/prestamos', async (req, res) => {
  try {
    const { empleado_id, monto_total, cuota_quincenal, descripcion } = req.body;
    const [result] = await db.query(
      'INSERT INTO prestamos (empleado_id, monto_total, saldo_pendiente, cuota_quincenal, descripcion) VALUES (?, ?, ?, ?, ?)',
      [empleado_id, monto_total, monto_total, cuota_quincenal, descripcion || '']
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── ADELANTOS ────────────────────────────────────────────────
app.get('/api/adelantos/:empleadoId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM adelantos WHERE empleado_id = ? ORDER BY created_at DESC',
      [req.params.empleadoId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/adelantos', async (req, res) => {
  try {
    const { empleado_id, monto, quincena_descuento } = req.body;
    if (monto > 2000) return res.status(400).json({ error: 'Adelanto máximo C$2,000' });
    const [result] = await db.query(
      'INSERT INTO adelantos (empleado_id, monto, quincena_descuento, descontado) VALUES (?, ?, ?, 0)',
      [empleado_id, monto, quincena_descuento]
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── EXTRAS ───────────────────────────────────────────────────
app.get('/api/extras/:empleadoId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM extras WHERE empleado_id = ? ORDER BY created_at DESC',
      [req.params.empleadoId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/extras', async (req, res) => {
  try {
    const { empleado_id, concepto, monto, quincena } = req.body;
    const [result] = await db.query(
      'INSERT INTO extras (empleado_id, concepto, monto, quincena) VALUES (?, ?, ?, ?)',
      [empleado_id, concepto, monto, quincena]
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── VACACIONES ───────────────────────────────────────────────
app.get('/api/vacaciones/:empleadoId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM vacaciones WHERE empleado_id = ? ORDER BY fecha_inicio DESC',
      [req.params.empleadoId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/vacaciones', async (req, res) => {
  try {
    const { empleado_id, fecha_inicio, fecha_fin, dias, pagadas } = req.body;
    const [result] = await db.query(
      'INSERT INTO vacaciones (empleado_id, fecha_inicio, fecha_fin, dias, pagadas) VALUES (?, ?, ?, ?, ?)',
      [empleado_id, fecha_inicio, fecha_fin, dias, pagadas ? 1 : 0]
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── PLANILLAS ────────────────────────────────────────────────
app.get('/api/planillas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM planillas ORDER BY created_at DESC LIMIT 20');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/planillas/:id/detalle', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT dp.*, e.nombre as empleado_nombre FROM detalle_planilla dp JOIN empleados e ON dp.empleado_id = e.id WHERE dp.planilla_id = ?',
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/planillas/calcular', async (req, res) => {
  const { periodo } = req.body; // periodo: "2026-05-15" | "2026-05-31"
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [empleados] = await conn.query('SELECT * FROM empleados WHERE activo = 1');

    // Calcular fecha_inicio y fecha_fin según el periodo
    const fechaFin = new Date(periodo);
    const dia = fechaFin.getDate();
    const fechaInicio = new Date(fechaFin);
    if (dia === 15) {
      fechaInicio.setDate(1);
    } else {
      fechaInicio.setDate(16);
    }
    const toDate = d => d.toISOString().split('T')[0];

    // Crear encabezado de planilla
    const [planResult] = await conn.query(
      'INSERT INTO planillas (periodo, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, "Borrador")',
      [periodo, toDate(fechaInicio), toDate(fechaFin)]
    );
    const planillaId = planResult.insertId;

    const detalles = [];

    for (const emp of empleados) {
      const salarioQuincenal = parseFloat(emp.salario_mensual) / 2;

      // Calcular INSS
      let inss = 0;
      if (emp.tipo_planilla !== 'Sin Seguro') {
        if (emp.inss_base === 'Salario Mínimo') {
          inss = (SALARIO_MINIMO / 2) * INSS_RATE;
        } else {
          inss = salarioQuincenal * INSS_RATE;
        }
      }

      // Préstamos activos — sumar cuotas
      const [prestamos] = await conn.query(
        'SELECT * FROM prestamos WHERE empleado_id = ? AND saldo_pendiente > 0',
        [emp.id]
      );
      let totalPrestamos = 0;
      for (const p of prestamos) {
        const cuota = Math.min(parseFloat(p.cuota_quincenal), parseFloat(p.saldo_pendiente));
        totalPrestamos += cuota;
      }

      // Adelantos pendientes para esta quincena
      const [adelantos] = await conn.query(
        'SELECT * FROM adelantos WHERE empleado_id = ? AND quincena_descuento = ? AND descontado = 0',
        [emp.id, periodo]
      );
      const totalAdelantos = adelantos.reduce((s, a) => s + parseFloat(a.monto), 0);

      // Extras para esta quincena
      const [extras] = await conn.query(
        'SELECT * FROM extras WHERE empleado_id = ? AND quincena = ?',
        [emp.id, periodo]
      );
      const totalExtras = extras.reduce((s, x) => s + parseFloat(x.monto), 0);

      const netoAPagar = salarioQuincenal + totalExtras - inss - totalPrestamos - totalAdelantos;

      const subtotalQuincena = salarioQuincenal + totalExtras;
      const totalDescuentos = inss + totalPrestamos + totalAdelantos;

      await conn.query(
        `INSERT INTO detalle_planilla
          (planilla_id, empleado_id, salario_bruto, otros_ingresos, subtotal_quincena,
           inss, ir, total_adelantos, total_prestamos, total_descuentos, neto_pagar)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [planillaId, emp.id, salarioQuincenal, totalExtras, subtotalQuincena,
         inss, totalAdelantos, totalPrestamos, totalDescuentos, netoAPagar]
      );

      // Marcar adelantos como descontados
      for (const a of adelantos) {
        await conn.query('UPDATE adelantos SET descontado = 1 WHERE id = ?', [a.id]);
      }

      // Reducir saldo de préstamos
      for (const p of prestamos) {
        const cuota = Math.min(parseFloat(p.cuota_quincenal), parseFloat(p.saldo_pendiente));
        const nuevoSaldo = parseFloat(p.saldo_pendiente) - cuota;
        await conn.query('UPDATE prestamos SET saldo_pendiente = ? WHERE id = ?', [nuevoSaldo, p.id]);
      }

      detalles.push({ empleado: emp.nombre, neto: netoAPagar.toFixed(2) });
    }

    await conn.query('UPDATE planillas SET estado = "Generada" WHERE id = ?', [planillaId]);
    await conn.commit();

    res.json({ planilla_id: planillaId, periodo, empleados: detalles });
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
});
