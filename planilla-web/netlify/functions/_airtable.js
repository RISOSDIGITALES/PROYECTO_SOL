// Shared Airtable helper
const BASE = 'appApxnaZKJKDUBR6';
const TOKEN = process.env.AIRTABLE_TOKEN;

const TABLES = {
  empleados:   'tblwEpef3eoKtSmQe',
  prestamos:   'tbln3xy9hbjtzRGPa',
  adelantos:   'tblEz4M50EUw7vT0U',
  extras:      'tblb8OlnW60ItErxe',
  planillas:   'tblZj3F2T5aoSKGEV',
  detalle:     'tblxmAaz0k0Bv6r1y',
  deducciones: 'tblf4FpWvxQdepOgb',
};

async function atFetch(table, opts = {}) {
  const { method = 'GET', params = {}, body } = opts;
  let url = `https://api.airtable.com/v0/${BASE}/${TABLES[table]}`;

  if (method === 'GET' && Object.keys(params).length) {
    const parts = [];
    for (const [k, v] of Object.entries(params)) {
      if (k === 'sort' && Array.isArray(v)) {
        v.forEach((s, i) => {
          parts.push(`sort%5B${i}%5D%5Bfield%5D=${encodeURIComponent(s.field)}`);
          parts.push(`sort%5B${i}%5D%5Bdirection%5D=${encodeURIComponent(s.direction)}`);
        });
      } else {
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
      }
    }
    url += '?' + parts.join('&');
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Airtable error');
  return data;
}

// Fetch all records handling pagination
async function atAll(table, params = {}) {
  let records = [];
  let offset;
  do {
    const p = offset ? { ...params, offset } : params;
    const data = await atFetch(table, { params: p });
    records = records.concat(data.records || []);
    offset = data.offset;
  } while (offset);
  return records;
}

function authCheck(context) {
  return !!(context?.clientContext?.user);
}

function resp(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

module.exports = { atFetch, atAll, authCheck, resp, TABLES };
