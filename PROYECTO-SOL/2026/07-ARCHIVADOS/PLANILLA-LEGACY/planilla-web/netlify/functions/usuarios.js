const { atAll, atFetch, authCheck, resp, TABLES } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  // Solo Admin
  const email = context.clientContext.user.email;
  const me = await atAll('empleados', { filterByFormula: `{Email}="${email}"` });
  const rol = me.length ? (me[0].fields.Rol || 'Admin') : 'Admin';
  if (rol !== 'Admin') return resp(403, { error: 'Solo Admin puede gestionar usuarios' });

  // GET — lista todos los empleados
  if (event.httpMethod === 'GET') {
    try {
      const records = await atAll('empleados', {
        sort: [{ field: 'Nombre', direction: 'asc' }],
      });
      const users = records.map(r => ({
        id: r.id,
        nombre: r.fields.Nombre || '',
        cargo: r.fields.Cargo || '',
        email: r.fields.Email || '',
        rol: r.fields.Rol || '',
        planillas_acceso: r.fields.Planillas_Acceso || 'Todas',
        activo: r.fields.Activo !== false,
      }));
      return resp(200, users);
    } catch (e) {
      return resp(500, { error: e.message });
    }
  }

  // PATCH — actualizar email, rol, planillas_acceso
  if (event.httpMethod === 'PATCH') {
    const id = event.path.split('/').pop();
    const body = JSON.parse(event.body || '{}');
    const fields = {};
    if (body.email     !== undefined) fields['Email']            = body.email;
    if (body.rol       !== undefined) fields['Rol']              = body.rol;
    if (body.planillas_acceso !== undefined) fields['Planillas_Acceso'] = body.planillas_acceso;
    try {
      await atFetch('empleados', {
        method: 'PATCH',
        body: { records: [{ id, fields }] },
      });
      return resp(200, { ok: true });
    } catch (e) {
      return resp(500, { error: e.message });
    }
  }

  return resp(405, { error: 'Método no permitido' });
};
