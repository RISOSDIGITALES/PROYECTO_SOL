const { atFetch, atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  const method = event.httpMethod;

  try {
    // GET — list all
    if (method === 'GET') {
      const records = await atAll('empleados', {
        sort: [{ field: 'Nombre', direction: 'asc' }],
      });
      return resp(200, records.map(r => ({ id: r.id, ...r.fields })));
    }

    // POST — create
    if (method === 'POST') {
      const fields = JSON.parse(event.body);
      const data = await atFetch('empleados', {
        method: 'POST',
        body: { records: [{ fields }] },
      });
      const r = data.records[0];
      return resp(201, { id: r.id, ...r.fields });
    }

    // PATCH — update
    if (method === 'PATCH') {
      const { id, ...fields } = JSON.parse(event.body);
      const data = await atFetch('empleados', {
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
