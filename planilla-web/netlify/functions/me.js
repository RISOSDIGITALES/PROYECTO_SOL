const { atAll, authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });

  const email = context.clientContext.user.email;

  try {
    const records = await atAll('empleados', {
      filterByFormula: `{Email}="${email}"`,
    });

    if (!records.length) {
      // No employee record → treat as Admin (backwards compat for existing users)
      return resp(200, { email, rol: 'Admin', nombre: null, id: null });
    }

    const f = records[0].fields;
    return resp(200, {
      email,
      rol:    f.Rol    || 'Admin',
      nombre: f.Nombre || null,
      id:     records[0].id,
    });
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
