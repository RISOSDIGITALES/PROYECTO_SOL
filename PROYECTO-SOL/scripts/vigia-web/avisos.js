// Decide si se manda correo y lo arma. Revisión por webhook: manda el informe si vino "avisar".
// Revisión automática: avisa solo problemas nuevos (o repetidos después de 24 h) y avisa cuando un problema crítico se resolvió.
const st = $getWorkflowStaticData('global'); st.avisados = st.avisados || {};
const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = {
  es: { titulo: 'Vigía Web', critico: 'Problema crítico', aviso: 'Avisos', ok: 'Todo en orden', resuelto: 'Resuelto', en: 'en', revisado: 'Revisado', donde: 'Dónde', resueltos: 'Ya no aparecen (resueltos)', datos: 'Datos', pie: 'Aviso automático de Vigía Web. Se repite solo si el problema sigue después de 24 horas.' },
  en: { titulo: 'Website Watch', critico: 'Critical issue', aviso: 'Warnings', ok: 'All good', resuelto: 'Resolved', en: 'on', revisado: 'Checked', donde: 'Where', resueltos: 'No longer found (resolved)', datos: 'Data', pie: 'Automatic alert from Website Watch. It repeats only if the problem is still there after 24 hours.' },
};
const salida = [];
for (const it of $input.all()) {
  const r = it.json;
  if (!r.revisar || !r.ok) { salida.push({ json: Object.assign({}, r, { enviar: false }) }); continue; }
  const t = T[r.idioma] || T.es;
  const clave = (p) => p.tipo + '|' + String(p.detalle).slice(0, 160);
  const prev = st.avisados[r.host] || {};
  const ahora = Date.now();
  let mandar = [], resueltos = [];
  if (r.origen === 'webhook') mandar = r.problemas;
  else {
    mandar = r.problemas.filter(p => { const k = clave(p); return !prev[k] || ahora - prev[k].ts > 86400000; });
    // en la revisión rápida solo se avisa lo crítico; lo demás va en la completa
    if (r.modo === 'rapido') mandar = mandar.filter(p => p.nivel === 'critico');
    const actuales = new Set(r.problemas.map(clave));
    // un problema crítico que ya no aparece en una revisión que lo podría ver (la completa ve todo; la rápida, lo de la portada)
    resueltos = Object.entries(prev).filter(([k, v]) => v.nivel === 'critico' && !actuales.has(k) && (r.modo === 'profundo' || v.portada)).map(([k, v]) => v);
  }
  // memoria de lo avisado
  if (r.origen !== 'webhook') {
    const nuevo = {};
    const portadaTipos = ['caido', 'certificado', 'lento', 'redireccion', 'sin_https', 'iframe_oculto', 'codigo_ofuscado', 'spam', 'script_nuevo'];
    for (const p of r.problemas) { const k = clave(p); const enviado = mandar.some(m => clave(m) === k); nuevo[k] = { ts: enviado ? ahora : (prev[k] ? prev[k].ts : ahora), nivel: p.nivel, detalle: p.detalle, portada: portadaTipos.includes(p.tipo) && p.donde === (r.datos && r.datos.url_final) }; }
    // lo que no se pudo ver en la rápida (enlaces, Sucuri, dominio) se conserva hasta la completa
    if (r.modo === 'rapido') for (const [k, v] of Object.entries(prev)) if (!nuevo[k] && !v.portada) nuevo[k] = v;
    st.avisados[r.host] = nuevo;
  }
  const enviar = !!r.avisar && (mandar.length > 0 || resueltos.length > 0 || (r.origen === 'webhook'));
  const nivelMail = mandar.some(p => p.nivel === 'critico') ? 'critico' : (mandar.length ? 'aviso' : (resueltos.length ? 'resuelto' : 'ok'));
  const color = { critico: '#c81e1e', aviso: '#b45309', resuelto: '#15803d', ok: '#15803d' }[nivelMail];
  const etiqueta = { critico: t.critico, aviso: t.aviso, resuelto: t.resuelto, ok: t.ok }[nivelMail];
  const nombre = r.nombre || r.host;
  const asunto = (nivelMail === 'critico' ? '🔴 ' : nivelMail === 'aviso' ? '🟠 ' : '✅ ') + t.titulo + ': ' + etiqueta + ' ' + t.en + ' ' + nombre;
  const fila = (p) => '<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top;"><span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:11px;color:#fff;background:' + (p.nivel === 'critico' ? '#c81e1e' : '#b45309') + ';">' + esc(p.nivel) + '</span></td><td style="padding:6px 8px;border-bottom:1px solid #eee;">' + esc(p.detalle) + (p.donde ? '<br><span style="color:#6b7280;font-size:12px;">' + esc(t.donde) + ': ' + esc(p.donde) + '</span>' : '') + '</td></tr>';
  const d = r.datos || {};
  const datosHtml = [['HTTP', d.status], ['ms', d.tiempo_ms], ['CMS', d.cms], ['SSL', d.cert_vence], ['Domain', d.dominio_vence], ['Sucuri', d.sucuri], ['Pages', d.paginas_revisadas], ['Links', d.enlaces_revisados != null ? d.enlaces_revisados + ' (' + (d.enlaces_rotos || 0) + ' ✗)' : null]].filter(x => x[1] != null && x[1] !== '').map(x => esc(x[0]) + ': <b>' + esc(x[1]) + '</b>').join(' · ');
  const html = '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;">'
    + '<div style="background:' + color + ';color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;"><b style="font-size:16px;">' + esc(t.titulo) + ' · ' + esc(etiqueta) + '</b><br><span style="font-size:13px;">' + esc(nombre) + ' — ' + esc(r.url) + '</span></div>'
    + '<div style="border:1px solid #e5e7eb;border-top:none;padding:12px 18px;border-radius:0 0 8px 8px;">'
    + (mandar.length ? '<table style="width:100%;border-collapse:collapse;font-size:14px;">' + mandar.map(fila).join('') + '</table>' : '<p style="font-size:14px;">' + esc(nivelMail === 'ok' ? t.ok : '') + '</p>')
    + (resueltos.length ? '<p style="margin-top:14px;font-size:14px;"><b>' + esc(t.resueltos) + '</b></p><ul style="font-size:13px;">' + resueltos.map(v => '<li>' + esc(v.detalle) + '</li>').join('') + '</ul>' : '')
    + '<p style="font-size:12px;color:#374151;margin-top:14px;">' + esc(t.datos) + ': ' + datosHtml + '</p>'
    + '<p style="font-size:11px;color:#9ca3af;">' + esc(t.revisado) + ': ' + esc(r.revisado_en) + ' · ' + esc(r.modo) + '. ' + esc(t.pie) + '</p></div></div>';
  salida.push({ json: Object.assign({}, r, { enviar, asunto, html, avisados: mandar.length, resueltos: resueltos.length }) });
}
return salida;
