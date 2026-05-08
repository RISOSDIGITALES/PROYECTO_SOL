const { atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  const { empleado, periodo } = event.queryStringParameters || {};
  if (!empleado || !periodo) return resp(400, { error: 'Se requiere ?empleado= y ?periodo=' });

  try {
    // Detalle de planilla para este empleado y periodo
    const detalles = await atAll('detalle', {
      filterByFormula: `AND({Período}="${periodo}",{Empleado}="${empleado}")`,
    });
    const detalle = detalles[0]?.fields || {};

    // Datos del empleado
    const empleados = await atAll('empleados', {
      filterByFormula: `{Nombre}="${empleado}"`,
    });
    const emp = empleados[0]?.fields || {};

    // Adelantos del empleado descontados en este periodo
    const adelantos = await atAll('adelantos', {
      filterByFormula: `AND({Empleado}="${empleado}",{Descontar en quincena}="${periodo}")`,
    });

    // Préstamos activos del empleado
    const prestamos = await atAll('prestamos', {
      filterByFormula: `AND({Empleado}="${empleado}",{Estado}="Activo")`,
    });

    // Extras del periodo
    const extras = await atAll('extras', {
      filterByFormula: `AND({Empleado}="${empleado}",{Pagar en quincena}="${periodo}")`,
    });

    return resp(200, {
      empleado: emp,
      detalle,
      adelantos: adelantos.map(r => ({ id: r.id, ...r.fields })),
      prestamos: prestamos.map(r => ({ id: r.id, ...r.fields })),
      extras: extras.map(r => ({ id: r.id, ...r.fields })),
    });
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
