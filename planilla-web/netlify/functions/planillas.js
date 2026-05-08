const { atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  try {
    const planillas = await atAll('planillas', {
      sort: [{ field: 'Fecha de pago', direction: 'desc' }],
    });

    // Contar empleados por período+tipo desde detalle
    const detalles = await atAll('detalle', {});
    const conteo = {};
    detalles.forEach(r => {
      const key = `${r.fields['Período']}|${r.fields['Tipo_Planilla'] || ''}`;
      conteo[key] = (conteo[key] || 0) + 1;
    });

    return resp(200, planillas.map(r => {
      const f = r.fields;
      const key = `${f['Período']}|${f['Tipo'] || ''}`;
      return {
        id: r.id,
        ...f,
        'Total empleados': conteo[key] || 0,
      };
    }));
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
