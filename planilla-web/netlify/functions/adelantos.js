const { atFetch, atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const records = await atAll('adelantos', {
        filterByFormula: '{Estado}="Pendiente"',
        sort: [{ field: 'Empleado', direction: 'asc' }],
      });
      return resp(200, records.map(r => ({ id: r.id, ...r.fields })));
    }

    if (method === 'POST') {
      const fields = JSON.parse(event.body);
      const data = await atFetch('adelantos', {
        method: 'POST',
        body: { records: [{ fields: { ...fields, Estado: 'Pendiente' } }] },
      });
      const r = data.records[0];
      return resp(201, { id: r.id, ...r.fields });
    }

    if (method === 'PATCH') {
      const { id, ...fields } = JSON.parse(event.body);
      const data = await atFetch('adelantos', {
        method: 'PATCH',
        body: { records: [{ id, fields }] },
      });
      const r = data.records[0];
      return resp(200, { id: r.id, ...r.fields });
    }

    return resp(405, { error: 'Método no permitido' });
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
