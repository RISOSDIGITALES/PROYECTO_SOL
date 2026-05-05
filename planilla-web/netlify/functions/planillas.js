const { atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  try {
    const records = await atAll('planillas', {
      sort: '[{field: "Fecha de pago", direction: "desc"}]',
    });
    return resp(200, records.map(r => ({ id: r.id, ...r.fields })));
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
