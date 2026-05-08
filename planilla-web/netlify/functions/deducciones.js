const { atFetch, atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const { empleado } = event.queryStringParameters || {};
      const opts = { sort: [{ field: 'Empleado', direction: 'asc' }] };
      if (empleado) opts.filterByFormula = `{Empleado}="${empleado}"`;
      const records = await atAll('deducciones', opts);
      return resp(200, records.map(r => ({ id: r.id, ...r.fields })));
    }

    if (method === 'POST') {
      const fields = JSON.parse(event.body);
      const data = await atFetch('deducciones', {
        method: 'POST',
        body: { records: [{ fields: { ...fields, Estado: 'Pendiente' } }] },
      });
      const r = data.records[0];
      return resp(201, { id: r.id, ...r.fields });
    }

    if (method === 'PATCH') {
      const { id, ...fields } = JSON.parse(event.body);
      const data = await atFetch('deducciones', {
        method: 'PATCH',
        body: { records: [{ id, fields }] },
      });
      const r = data.records[0];
      return resp(200, { id: r.id, ...r.fields });
    }

    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await atFetch(`deducciones/${id}`, { method: 'DELETE' });
      return resp(200, { ok: true });
    }

    return resp(405, { error: 'Método no permitido' });
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
