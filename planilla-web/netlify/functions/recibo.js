const { atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  const { empleado, periodo } = event.queryStringParameters || {};
  if (!empleado || !periodo) return resp(400, { error: 'Se requiere ?empleado= y ?periodo=' });

  // Calcular rango de fechas de la quincena para filtrar vacaciones pagadas
  const [anio, mes, dia] = periodo.split('-').map(Number);
  const esQ1 = dia <= 15;
  const fechaIni = `${anio}-${String(mes).padStart(2,'0')}-${esQ1 ? '01' : '16'}`;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const fechaFin  = `${anio}-${String(mes).padStart(2,'0')}-${esQ1 ? '15' : String(ultimoDia).padStart(2,'0')}`;

  try {
    const [detalles, empleados, adelantos, prestamos, extras, deducciones, vacaciones] = await Promise.all([
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
      atAll('vacaciones', {
        filterByFormula: `AND({Empleado}="${empleado}",{Tipo}="Pagadas",IS_AFTER({Fecha_Inicio},"${fechaIni}"),IS_BEFORE({Fecha_Inicio},"${fechaFin}"))`,
      }),
    ]);

    return resp(200, {
      empleado: empleados[0]?.fields || {},
      detalle: detalles[0]?.fields || {},
      adelantos: adelantos.map(r => ({ id: r.id, ...r.fields })),
      prestamos: prestamos.map(r => ({ id: r.id, ...r.fields })),
      extras: extras.map(r => ({ id: r.id, ...r.fields })),
      deducciones: deducciones.map(r => ({ id: r.id, ...r.fields })),
      vacaciones: vacaciones.map(r => ({ id: r.id, ...r.fields })),
    });
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
