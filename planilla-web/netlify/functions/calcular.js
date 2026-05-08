const { atFetch, atAll, authCheck, resp } = require('./_airtable');

const SALARIO_MINIMO = 10913.54;
const INSS_RATE = 0.07;

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });
  if (event.httpMethod !== 'POST') return resp(405, { error: 'Método no permitido' });

  const { periodo, tipo } = JSON.parse(event.body || '{}');
  if (!periodo) return resp(400, { error: 'Se requiere periodo (YYYY-MM-DD)' });

  try {
    // 1. Empleados activos filtrados por tipo
    let formula = '{Activo}=TRUE()';
    if (tipo) formula = `AND(${formula},{Tipo_Planilla}="${tipo}")`;
    const empleados = await atAll('empleados', { filterByFormula: formula });
    if (empleados.length === 0) return resp(400, { error: 'No hay empleados activos para este tipo' });

    // 2. Cargar datos del período en paralelo
    const [adelantos, prestamos, extras, deducciones] = await Promise.all([
      atAll('adelantos', { filterByFormula: `AND({Descontar en quincena}="${periodo}",{Estado}="Pendiente",NOT({Pausado}=TRUE()))` }),
      atAll('prestamos', { filterByFormula: '{Estado}="Activo"' }),
      atAll('extras', { filterByFormula: `{Pagar en quincena}="${periodo}"` }),
      atAll('deducciones', { filterByFormula: `AND({Descontar en quincena}="${periodo}",{Estado}="Pendiente",NOT({Pausado}=TRUE()))` }),
    ]);

    // Indexar por empleado
    const idx = (arr, key = 'Empleado') => arr.reduce((m, r) => {
      const k = r.fields[key];
      if (!m[k]) m[k] = [];
      m[k].push(r);
      return m;
    }, {});

    const adelantosPor  = idx(adelantos);
    const prestamosPor  = idx(prestamos);
    const extrasPor     = idx(extras);
    const deduccPor     = idx(deducciones);

    // 3. Calcular por empleado
    const detalles = [];
    let totalBruto = 0, totalDesc = 0, totalNeto = 0;

    for (const emp of empleados) {
      const f = emp.fields;
      const nombre = f.Nombre;
      const tipoPlanilla = f.Tipo_Planilla || 'Con Seguro';
      const salarioMensual = parseFloat(f['Salario bruto mensual'] || 0);
      const salarioQuincenal = Math.round(salarioMensual / 2 * 100) / 100;

      // INSS
      let inss = 0;
      if (tipoPlanilla !== 'Sin Seguro') {
        const base = f.INSS_Base === 'Salario Mínimo' ? SALARIO_MINIMO : salarioMensual;
        inss = Math.round((base / 2) * INSS_RATE * 100) / 100;
      }

      // IR fijo del empleado
      const ir = parseFloat(f.IR || 0);

      // Adelantos
      const empAdel = adelantosPor[nombre] || [];
      const descAdelanto = empAdel.reduce((s, r) => s + parseFloat(r.fields.Monto || 0), 0);

      // Préstamos activos
      const empPrest = prestamosPor[nombre] || [];
      const descPrestamo = empPrest.reduce((s, r) => s + parseFloat(r.fields['Cuota quincenal'] || 0), 0);

      // Extras
      const empExtras = extrasPor[nombre] || [];
      const totalExtras = empExtras.reduce((s, r) => s + parseFloat(r.fields.Monto || 0), 0);

      // Deducciones manuales
      const empDed = deduccPor[nombre] || [];
      const descDed = empDed.reduce((s, r) => s + parseFloat(r.fields.Monto || 0), 0);

      const descTotal = Math.round((inss + ir + descAdelanto + descPrestamo + descDed) * 100) / 100;
      const neto = Math.round((salarioQuincenal + totalExtras - descTotal) * 100) / 100;

      totalBruto += salarioQuincenal + totalExtras;
      totalDesc  += descTotal;
      totalNeto  += neto;

      detalles.push({
        nombre, tipoPlanilla, salarioQuincenal, inss, ir,
        descAdelanto, descPrestamo, totalExtras, descDed, descTotal, neto,
        adelantosIds: empAdel.map(r => r.id),
        prestamosData: empPrest.map(r => ({
        id: r.id,
        cuotasRest: r.fields['Cuotas restantes'] || 0,
        cuota: r.fields['Cuota quincenal'] || 0,
        historial: r.fields['Historial_Pagos'] || '',
      })),
        deduccionesIds: empDed.map(r => r.id),
      });
    }

    // 4. Crear registro Planilla
    const planillaRes = await atFetch('planillas', {
      method: 'POST',
      body: { records: [{ fields: {
        'Período': periodo,
        'Tipo': tipo || '',
        'Fecha de pago': periodo,
        'Estado': 'Borrador',
        'Total bruto': Math.round(totalBruto * 100) / 100,
        'Total deducciones': Math.round(totalDesc * 100) / 100,
        'Total neto': Math.round(totalNeto * 100) / 100,
      }}] },
    });
    const planillaId = planillaRes.records[0].id;

    // 5. Crear registros Detalle (max 10 por request)
    const detalleRecords = detalles.map(d => ({ fields: {
      'Período': periodo,
      'Empleado': d.nombre,
      'Tipo_Planilla': d.tipoPlanilla,
      'Salario quincenal bruto': d.salarioQuincenal,
      'INSS (7%)': d.inss,
      'IR': d.ir,
      'Descuento préstamo': d.descPrestamo,
      'Descuento adelanto': d.descAdelanto,
      'Extras': d.totalExtras,
      'Neto a recibir': d.neto,
      'Fecha de pago': periodo,
    }}));

    for (let i = 0; i < detalleRecords.length; i += 10) {
      await atFetch('detalle', { method: 'POST', body: { records: detalleRecords.slice(i, i + 10) } });
    }

    // 6. Marcar adelantos como Descontado
    const adelUpd = detalles.flatMap(d => d.adelantosIds.map(id => ({ id, fields: { Estado: 'Descontado' } })));
    for (let i = 0; i < adelUpd.length; i += 10) {
      await atFetch('adelantos', { method: 'PATCH', body: { records: adelUpd.slice(i, i + 10) } });
    }

    // 7. Marcar deducciones como Descontado
    const dedUpd = detalles.flatMap(d => d.deduccionesIds.map(id => ({ id, fields: { Estado: 'Descontado' } })));
    for (let i = 0; i < dedUpd.length; i += 10) {
      await atFetch('deducciones', { method: 'PATCH', body: { records: dedUpd.slice(i, i + 10) } });
    }

    // 8. Decrementar cuotas restantes de préstamos
    const prestUpd = detalles.flatMap(d => d.prestamosData.map(p => {
      const nuevasCuotas = Math.max(0, p.cuotasRest - 1);
      const entry = `${periodo} | C$${p.cuota.toFixed(2)} | Descuento quincena`;
      const nuevoHistorial = p.historial ? `${p.historial}\n${entry}` : entry;
      return {
        id: p.id,
        fields: {
          'Cuotas restantes': nuevasCuotas,
          'Estado': nuevasCuotas <= 0 ? 'Pagado' : 'Activo',
          'Historial_Pagos': nuevoHistorial,
        },
      };
    }));
    for (let i = 0; i < prestUpd.length; i += 10) {
      await atFetch('prestamos', { method: 'PATCH', body: { records: prestUpd.slice(i, i + 10) } });
    }

    return resp(200, {
      ok: true, planillaId, periodo,
      tipo: tipo || 'Todos',
      empleados: detalles.length,
      totalBruto: Math.round(totalBruto * 100) / 100,
      totalDeducciones: Math.round(totalDesc * 100) / 100,
      totalNeto: Math.round(totalNeto * 100) / 100,
    });

  } catch (e) {
    return resp(500, { error: e.message });
  }
};
