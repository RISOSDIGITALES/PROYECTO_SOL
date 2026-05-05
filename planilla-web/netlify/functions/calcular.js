const { authCheck, resp } = require('./_airtable');

exports.handler = async (event, context) => {
  if (!authCheck(context)) return resp(401, { error: 'No autorizado' });
  if (event.httpMethod !== 'POST') return resp(405, { error: 'Método no permitido' });

  const { fecha_pago } = JSON.parse(event.body || '{}');
  if (!fecha_pago) return resp(400, { error: 'Se requiere fecha_pago (YYYY-MM-DD)' });

  try {
    const n8nUrl = process.env.N8N_PLANILLA_WEBHOOK;
    if (!n8nUrl) return resp(503, { error: 'Webhook no configurado' });

    const res = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha_pago }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`n8n respondió ${res.status}: ${text}`);
    }

    const data = await res.json().catch(() => ({ ok: true }));
    return resp(200, { ok: true, ...data });
  } catch (e) {
    return resp(500, { error: e.message });
  }
};
