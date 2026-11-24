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
