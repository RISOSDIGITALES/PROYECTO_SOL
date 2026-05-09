const { atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  const { empleado, periodo } = event.queryStringParameters || {};
  if (!empleado || !periodo) return resp(400, { error: 'Se requiere ?empleado= y ?periodo=' });

  try {
    const [detalles, empleados, adelantos, prestamos, extras, deducciones] = await Promise.all([
      atAll('detalle', {
        filterByFormula: `AND({Período}="${periodo}",{Empleado}="${empleado}")`,
      }),
      atAll('empleados', {
        filterByFormula: `{Nombre}="${empleado}"`,
      }),
      atAll('adelantos', {
        filterByFormula: `AND({Empleado}="${empleado}",{Descontar en quincena}="${periodo}")`,
      }),
      atAll('prestamos', {
        filterByFormula: `AND({Empleado}="${empleado}",{Estado}="Activo")`,
      }),
      atAll('extras', {
        filterByFormula: `AND({Empleado}="${empleado}",{Pagar en quincena}="${periodo}")`,
      }),
      atAll('deducciones', {
        filterByFormula: `AND({Empleado}="${empleado}",{Descontar en quincena}="${periodo}")`,
      }),
    ]);

    return resp(200, {
      empleado: empleados[0]?.fields || {},
      detalle: detalles[0]?.fields || {},
      adelantos: adelantos.map(r => ({ id: r.id, ...r.fields })),
      prestamos: prestamos.map(r => ({ id: r.id, ...r.fields })),
      extras: extras.map(r => ({ id: r.id, ...r.fields })),
      deducciones: deducciones.map(r => ({ id: r.id, ...r.fields })),
    });
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
