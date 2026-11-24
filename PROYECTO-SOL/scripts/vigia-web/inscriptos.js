// Sitios inscriptos (los guarda la acción "inscribir" del webhook). Cada hora: revisión rápida; a las 6:00: completa.
const st = $getWorkflowStaticData('global');
const sitios = st.sitios || [];
let modo = 'rapido';
try { if ($('⏰ Cada día (completo)').isExecuted) modo = 'profundo'; } catch (e) {}
if (!sitios.length) return [{ json: { revisar: false, motivo: 'No hay sitios inscriptos.' } }];
return sitios.map(s => ({ json: { revisar: true, url: s.url, modo, max_paginas: 25, avisar: s.avisar, idioma: s.idioma || 'es', nombre: s.nombre || '', origen: 'horario' } }));
