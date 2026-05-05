const { atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  const periodo = event.queryStringParameters?.periodo;
  const tipo    = event.queryStringParameters?.tipo;
  if (!periodo) return resp(400, { error: 'Se requiere ?periodo=' });

  try {
    let formula = `{Período}="${periodo}"`;
    if (tipo) formula = `AND(${formula},{Tipo_Planilla}="${tipo}")`;

    const records = await atAll('detalle', {
      filterByFormula: formula,
      sort: '[{field: "Empleado", direction: "asc"}]',
    });
    return resp(200, records.map(r => ({ id: r.id, ...r.fields })));
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
