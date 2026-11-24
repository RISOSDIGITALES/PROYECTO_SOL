// Revisa cada sitio. Rápido: que responda, tiempo, HTTPS, redirecciones y código sospechoso en la portada.
// Completo: además recorre páginas (sitemap o enlaces), prueba sus enlaces, consulta Sucuri SiteCheck (malware,
// listas negras, certificado) y RDAP (vencimiento del dominio). Todo gratis y sin claves.
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
const UA = 'Mozilla/5.0 (compatible; VigiaWeb/1.0; +site-monitor)';
const req = async (url, o = {}) => {
  const t = Date.now();
  try {
    const r = await this.helpers.httpRequest(Object.assign({ url, method: 'GET', timeout: 20000, returnFullResponse: true, ignoreHttpStatusErrors: true, disableFollowRedirect: true, json: false, headers: { 'User-Agent': UA, 'Accept': '*/*' } }, o));
    return { status: r.statusCode, headers: r.headers || {}, body: typeof r.body === 'string' ? r.body : (r.body ? JSON.stringify(r.body) : ''), ms: Date.now() - t };
  } catch (e) {
    return { status: 0, error: String((e && (e.code || e.message)) || e).slice(0, 160), ms: Date.now() - t, headers: {}, body: '' };
  }
};
const seguir = async (url, o = {}) => {  // sigue hasta 6 redirecciones y anota la cadena
  const cadena = []; let r, actual = url;
  for (let i = 0; i < 7; i++) {
    r = await req(actual, o);
    const loc = r.headers && (r.headers.location || r.headers.Location);
    if (r.status >= 300 && r.status < 400 && loc) { cadena.push(actual); actual = U.resolve(loc, actual); if (!actual) break; continue; }
    break;
  }
  return Object.assign(r, { final: actual, cadena });
};
const base = (h) => String(h || '').toLowerCase().replace(/^www\./, '');
const hostDe = (u) => { const x = U.parse(u); return x ? base(x.hostname) : ''; };
const pool = async (lista, n, fn) => { const out = new Array(lista.length); let i = 0; await Promise.all(Array.from({ length: Math.min(n, lista.length) }, async () => { while (i < lista.length) { const k = i++; out[k] = await fn(lista[k], k); } })); return out; };
const dias = (f) => Math.floor((new Date(f).getTime() - Date.now()) / 86400000);
const SPAM = ['viagra', 'cialis', 'levitra', 'tadalafil', 'sildenafil', 'casino online', 'online casino', 'slot gacor', 'judi online', 'togel', 'payday loan', 'replica watches', 'porn', 'xxx video', 'escort service', 'buy followers', 'essay writing service', 'crypto doubler', 'bitcoin doubler'];
const sospechoso = (html, pagina, propio) => {
  const p = [];
  if (!html) return p;
  const h = html.slice(0, 2000000);
  if (/<iframe[^>]+(width\s*=\s*["']?0["'\s>]|height\s*=\s*["']?0["'\s>]|display\s*:\s*none|visibility\s*:\s*hidden)/i.test(h)) p.push({ tipo: 'iframe_oculto', nivel: 'critico', detalle: 'Hay un iframe oculto (tamaño 0 o invisible), una técnica común de malware.', donde: pagina });
  if (/eval\s*\(\s*(atob|unescape|String\.fromCharCode|function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e)/i.test(h) || /document\.write\s*\(\s*unescape/i.test(h)) p.push({ tipo: 'codigo_ofuscado', nivel: 'critico', detalle: 'Hay JavaScript ofuscado (eval/unescape), típico de código inyectado.', donde: pagina });
  // palabras completas: "cialis" no tiene que saltar con "especialistas"
  const texto = ' ' + h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').toLowerCase().replace(/[^a-z0-9áéíóúñü]+/g, ' ') + ' ';
  const enc = SPAM.filter(w => texto.includes(' ' + w + ' ') && !propio.includes(w.split(' ')[0]));
  if (enc.length) p.push({ tipo: 'spam', nivel: enc.length >= 2 ? 'critico' : 'aviso', detalle: 'Aparecen palabras de spam: ' + enc.slice(0, 5).join(', ') + '.', donde: pagina });
  return p;
};
const enlacesDe = (html, pagina) => {
  const out = new Set();
  const re = /<(a|img|script|link|iframe|source)\b[^>]*?\s(href|src)\s*=\s*["']([^"'#][^"']*)["']/gi; let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase(), u = m[3].trim().replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|javascript:|data:|sms:|whatsapp:)/i.test(u)) continue;
    if (tag === 'link' && !/rel\s*=\s*["'][^"']*(stylesheet|icon)/i.test(m[0])) continue;
    const x = U.resolve(u, pagina); if (x) out.add(x);
  }
  return [...out];
};
const scriptsExternos = (html, host) => {
  const s = new Set(); const re = /<script\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi; let m;
  while ((m = re.exec(html))) { const h = hostDe(U.resolve(m[1], 'https://' + host + '/')); if (h && h !== base(host) && !h.endsWith('.' + base(host))) s.add(h); }
  return [...s];
};
const st = $getWorkflowStaticData('global'); st.scripts = st.scripts || {};
const salida = [];
for (const it of $input.all()) {
  const s = it.json;
  if (!s.revisar) { salida.push({ json: s }); continue; }
  const problemas = []; const datos = {};
  const inicio = Date.now();
  const host = hostDe(s.url);
  const propio = host + ' ' + String(s.nombre || '').toLowerCase();
  // 1) portada (si HTTPS no responde y no es por el certificado, se prueba por HTTP)
  let r = await seguir(s.url);
  if (!r.status && /^https:/i.test(s.url) && !/CERT|SSL|TLS|self.signed|unable to verify/i.test(r.error || '')) {
    const rh = await seguir(s.url.replace(/^https:/i, 'http:'));
    if (rh.status) r = rh;
  }
  datos.status = r.status; datos.tiempo_ms = r.ms; datos.url_final = r.final; datos.redirecciones = r.cadena.length;
  if (!r.status) {
    const cert = /CERT|SSL|TLS|self.signed|unable to verify/i.test(r.error || '');
    problemas.push({ tipo: cert ? 'certificado' : 'caido', nivel: 'critico', detalle: cert ? 'El certificado HTTPS no es válido (' + r.error + ').' : 'El sitio no responde (' + r.error + ').', donde: s.url });
  } else if (r.status >= 500) problemas.push({ tipo: 'caido', nivel: 'critico', detalle: 'La portada responde con error del servidor ' + r.status + '.', donde: r.final });
  else if (r.status >= 400) problemas.push({ tipo: 'caido', nivel: 'critico', detalle: 'La portada responde ' + r.status + ' (no se puede ver).', donde: r.final });
  else if (r.ms > 8000) problemas.push({ tipo: 'lento', nivel: 'aviso', detalle: 'La portada tardó ' + (r.ms / 1000).toFixed(1) + ' s en responder.', donde: r.final });
  const hostFinal = hostDe(r.final) || host;
  if (r.status && hostFinal !== host) problemas.push({ tipo: 'redireccion', nivel: 'critico', detalle: 'La portada redirige a otro dominio: ' + hostFinal + '. Si no fue a propósito, puede ser un secuestro del sitio.', donde: s.url });
  if (r.status && /^http:/i.test(r.final)) problemas.push({ tipo: 'sin_https', nivel: 'aviso', detalle: 'El sitio se sirve sin HTTPS.', donde: r.final });
  const portada = r.status >= 200 && r.status < 300 ? r.body : '';
  problemas.push(...sospechoso(portada, r.final, propio));
  // scripts de dominios nuevos (la primera vez solo se anota la base)
  const ext = portada ? scriptsExternos(portada, hostFinal) : [];
  const prev = st.scripts[host];
  if (portada) {
    if (prev) { const nuevos = ext.filter(d => !prev.includes(d)); if (nuevos.length) problemas.push({ tipo: 'script_nuevo', nivel: 'aviso', detalle: 'La portada carga scripts de dominios nuevos: ' + nuevos.slice(0, 5).join(', ') + '. Si nadie los agregó, revisar.', donde: r.final }); }
    st.scripts[host] = [...new Set([...(prev || []), ...ext])].slice(0, 200);
  }
  datos.scripts_externos = ext;
  // 2) revisión completa
  if (s.modo === 'profundo' && portada) {
    const origen = U.parse(r.final).origin;
    let paginas = [];
    for (const sm of ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml']) {
      const x = await seguir(origen + sm);
      if (x.status === 200 && /<(urlset|sitemapindex)/i.test(x.body)) {
        let locs = [...x.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
        if (/<sitemapindex/i.test(x.body)) {
          const sub = await pool(locs.slice(0, 4), 4, async u => (await seguir(u)).body || '');
          locs = sub.flatMap(b => [...b.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]));
        }
        paginas = locs.filter(u => hostDe(u) === hostFinal);
        datos.sitemap = sm; break;
      }
    }
    if (!paginas.length) paginas = enlacesDe(portada, r.final).filter(u => hostDe(u) === hostFinal && !/\.(jpe?g|png|gif|webp|svg|pdf|zip|css|js|ico|mp4|mp3)(\?|$)/i.test(U.parse(u).pathname));
    paginas = [...new Set([r.final, ...paginas])].slice(0, s.max_paginas);
    const vistas = await pool(paginas, 4, async u => ({ u, r: u === r.final ? r : await seguir(u) }));
    const enlaces = new Map();  // enlace -> página donde aparece
    for (const v of vistas) {
      if (v.r.status >= 400 || !v.r.status) { if (v.u !== r.final) problemas.push({ tipo: 'pagina_rota', nivel: 'aviso', detalle: 'Una página del sitio responde ' + (v.r.status || v.r.error) + '.', donde: v.u }); continue; }
      if (v.u !== r.final) problemas.push(...sospechoso(v.r.body, v.u, propio));
      for (const e of enlacesDe(v.r.body || '', v.r.final || v.u)) if (!enlaces.has(e) && !paginas.includes(e)) enlaces.set(e, v.u);
    }
    const lista = [...enlaces.keys()].sort((a, b) => (hostDe(a) === hostFinal ? 0 : 1) - (hostDe(b) === hostFinal ? 0 : 1)).slice(0, 250);
    const NO_VERIFICABLE = [401, 403, 405, 406, 429, 999];
    const res = await pool(lista, 8, async u => {
      let x = await req(u, { method: 'HEAD', disableFollowRedirect: false, timeout: 15000 });
      if (!x.status || x.status >= 400) x = await req(u, { method: 'GET', disableFollowRedirect: false, timeout: 15000 });
      return { u, status: x.status, error: x.error };
    });
    const rotos = res.filter(x => (x.status >= 400 && !NO_VERIFICABLE.includes(x.status)) || (!x.status && !/ETIMEDOUT|ECONNABORTED|timeout/i.test(x.error || '')));
    datos.paginas_revisadas = vistas.length; datos.enlaces_revisados = res.length; datos.enlaces_rotos = rotos.length;
    for (const x of rotos.slice(0, 40)) {
      const interno = hostDe(x.u) === hostFinal;
      problemas.push({ tipo: interno ? 'enlace_roto_interno' : 'enlace_roto_externo', nivel: 'aviso', detalle: (interno ? 'Enlace interno roto' : 'Enlace a otro sitio roto') + ' (' + (x.status || x.error) + '): ' + x.u, donde: enlaces.get(x.u) });
    }
    // Sucuri SiteCheck: malware, listas negras y certificado
    const su = await req('https://sitecheck.sucuri.net/api/v3/?scan=' + encodeURIComponent(hostFinal), { disableFollowRedirect: false, timeout: 60000 });
    let j = null; try { j = JSON.parse(su.body); } catch (e) {}
    if (j) {
      const w = j.warnings || {};
      for (const k of Object.keys(w)) {
        const lw = Array.isArray(w[k]) ? w[k] : [w[k]];
        for (const x of lw.slice(0, 5)) {
          const msg = (typeof x === 'string' ? x : (x.msg || x.message || x.type || JSON.stringify(x))).slice(0, 200);
          const grave = /malware|blacklist|spam|injected|defac|phish|iframe|redirect/i.test(k + ' ' + msg);
          problemas.push({ tipo: 'sucuri_' + k, nivel: grave ? 'critico' : 'aviso', detalle: 'Sucuri: ' + msg, donde: hostFinal });
        }
      }
      for (const b of (j.blacklists || [])) problemas.push({ tipo: 'lista_negra', nivel: 'critico', detalle: 'Figura en una lista negra: ' + String(b.vendor || b.name || JSON.stringify(b)).slice(0, 120), donde: hostFinal });
      if (j.tls && j.tls.cert_expires) { datos.cert_vence = j.tls.cert_expires; const d = dias(j.tls.cert_expires); if (d <= 14) problemas.push({ tipo: 'certificado', nivel: d <= 3 ? 'critico' : 'aviso', detalle: 'El certificado HTTPS vence en ' + d + ' días (' + j.tls.cert_expires + ').', donde: hostFinal }); }
      if (j.software && j.software.cms && j.software.cms[0]) datos.cms = j.software.cms[0].name + (j.software.cms[0].version ? ' ' + j.software.cms[0].version : '');
      datos.sucuri = (j.ratings && j.ratings.total && j.ratings.total.rating) || 'ok';
    } else datos.sucuri = 'sin respuesta';
    // RDAP: vencimiento del dominio
    const dom = hostFinal.split('.').slice(-2).join('.');
    const rd = await req('https://rdap.org/domain/' + dom, { disableFollowRedirect: false, timeout: 20000 });
    try { const jj = JSON.parse(rd.body); const ev = (jj.events || []).find(e => e.eventAction === 'expiration'); if (ev) { datos.dominio_vence = ev.eventDate.slice(0, 10); const d = dias(ev.eventDate); if (d <= 30) problemas.push({ tipo: 'dominio', nivel: d <= 7 ? 'critico' : 'aviso', detalle: 'El dominio ' + dom + ' vence en ' + d + ' días (' + ev.eventDate.slice(0, 10) + ').', donde: dom }); } } catch (e) {}
  }
  const nivel = problemas.some(p => p.nivel === 'critico') ? 'critico' : (problemas.length ? 'aviso' : 'ok');
  salida.push({ json: Object.assign({}, s, { ok: true, host, nivel, problemas, datos, revisado_en: new Date().toISOString(), duracion_s: Math.round((Date.now() - inicio) / 1000) }) });
}
return salida;
