// Vigía Web (24-nov): agente independiente que vigila cualquier sitio web. Acciones por webhook:
//  revisar   {url, modo?: 'rapido'|'profundo', max_paginas?, avisar?, idioma?}  → revisa ya y devuelve el informe
//  inscribir {url, avisar, nombre?, idioma?}  → lo suma a la lista que se revisa sola (cada hora rápido, cada día profundo)
//  quitar    {url}   ·   lista {}
const body = $input.first().json.body || {};
const st = $getWorkflowStaticData('global');
st.sitios = st.sitios || [];
// El sandbox de n8n no tiene URL(): lectura y resolución de direcciones propias.
const U = {
  parse(u) { const m = /^(https?):\/\/([^\/?#:@]+)(:\d+)?([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(String(u || '').trim()); if (!m) return null; return { protocol: m[1].toLowerCase() + ':', hostname: m[2].toLowerCase(), port: m[3] || '', pathname: m[4] || '/', search: m[5] || '', origin: m[1].toLowerCase() + '://' + m[2].toLowerCase() + (m[3] || '') }; },
  resolve(rel, base) {
    rel = String(rel || '').trim(); const b = U.parse(base); if (!b) return '';
    if (/^https?:\/\//i.test(rel)) return rel.replace(/#.*$/, '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(rel)) return '';
    if (rel.startsWith('//')) return b.protocol + rel.replace(/#.*$/, '');
    rel = rel.replace(/#.*$/, ''); if (!rel) return b.origin + b.pathname + b.search;
    if (rel.startsWith('?')) return b.origin + b.pathname + rel;
    let path = rel.startsWith('/') ? rel : b.pathname.replace(/[^\/]*$/, '') + rel;
    const q = path.indexOf('?'); const query = q >= 0 ? path.slice(q) : ''; if (q >= 0) path = path.slice(0, q);
    const out = []; for (const seg of path.split('/')) { if (seg === '..') out.pop(); else if (seg !== '.') out.push(seg); }
    let p = out.join('/'); if (!p.startsWith('/')) p = '/' + p;
    return b.origin + p + query;
  },
};
const norm = (u) => { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; const x = U.parse(u); if (!x || !/\./.test(x.hostname)) return ''; return x.origin + (x.pathname === '/' ? '/' : x.pathname.replace(/\/$/, '')); };
const correoOk = (c) => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(String(c || '').trim());
const accion = String(body.accion || 'revisar').toLowerCase();
const url = norm(body.url);
const resp = (o) => [{ json: Object.assign({ revisar: false }, o) }];
if (accion === 'lista') return resp({ ok: true, sitios: st.sitios });
if (!url) return resp({ ok: false, error: 'Falta una url válida (por ejemplo, ejemplo.com).' });
if (accion === 'quitar') {
  const antes = st.sitios.length; st.sitios = st.sitios.filter(s => s.url !== url);
  return resp({ ok: true, quitado: antes !== st.sitios.length, sitios: st.sitios });
}
const avisar = String(body.avisar || '').split(/[,;\s]+/).filter(correoOk).join(',');
const idioma = body.idioma === 'en' ? 'en' : 'es';
if (accion === 'inscribir') {
  if (!avisar) return resp({ ok: false, error: 'Para inscribir un sitio hace falta al menos un correo válido en "avisar".' });
  const otro = st.sitios.filter(s => s.url !== url);
  otro.push({ url, avisar, nombre: String(body.nombre || '').slice(0, 80), idioma, inscripto: new Date().toISOString() });
  st.sitios = otro;
  return resp({ ok: true, inscripto: url, sitios: st.sitios, nota: 'Se revisa cada hora (rápido) y cada día a las 6:00 de Miami (completo). Para una revisión ya, usar accion "revisar".' });
}
if (accion !== 'revisar') return resp({ ok: false, error: 'Acción desconocida. Usar: revisar, inscribir, quitar o lista.' });
const modo = body.modo === 'rapido' ? 'rapido' : 'profundo';
const max_paginas = Math.min(60, Math.max(1, parseInt(body.max_paginas, 10) || 25));
return [{ json: { revisar: true, url, modo, max_paginas, avisar, idioma, nombre: String(body.nombre || '').slice(0, 80), origen: 'webhook' } }];
