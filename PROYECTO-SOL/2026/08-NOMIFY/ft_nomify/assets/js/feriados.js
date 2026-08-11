// Feriados nacionales de Nicaragua
// Fijos + Semana Santa (calculada) + feriados de Managua

function pascuaAnio(anio) {
  // Algoritmo de Meeus/Jones/Butcher
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia); // Domingo de Pascua
}

function feriadosAnio(anio) {
  const pascua = pascuaAnio(anio);
  const juevesSanto = new Date(pascua); juevesSanto.setDate(pascua.getDate() - 3);
  const viernesSanto = new Date(pascua); viernesSanto.setDate(pascua.getDate() - 2);

  const fmt = d => `${anio}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  return [
    { fecha: `${anio}-01-01`, nombre: 'Año Nuevo',                    tipo: 'nacional' },
    { fecha: fmt(juevesSanto), nombre: 'Jueves Santo',                tipo: 'nacional' },
    { fecha: fmt(viernesSanto), nombre: 'Viernes Santo',              tipo: 'nacional' },
    { fecha: `${anio}-05-01`, nombre: 'Día del Trabajo',              tipo: 'nacional' },
    { fecha: `${anio}-05-30`, nombre: 'Día de las Madres',            tipo: 'nacional' },
    { fecha: `${anio}-07-19`, nombre: 'Aniversario de la Revolución', tipo: 'nacional' },
    { fecha: `${anio}-08-01`, nombre: 'Descenso de Santo Domingo',    tipo: 'managua'  },
    { fecha: `${anio}-08-10`, nombre: 'Subida de Santo Domingo',      tipo: 'managua'  },
    { fecha: `${anio}-09-14`, nombre: 'Batalla de San Jacinto',       tipo: 'nacional' },
    { fecha: `${anio}-09-15`, nombre: 'Independencia de Centroamérica', tipo: 'nacional' },
    { fecha: `${anio}-11-02`, nombre: 'Día de los Difuntos',          tipo: 'nacional' },
    { fecha: `${anio}-12-08`, nombre: 'Inmaculada Concepción',        tipo: 'nacional' },
    { fecha: `${anio}-12-25`, nombre: 'Navidad',                      tipo: 'nacional' },
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Devuelve todos los feriados de este año + el próximo, filtrados desde hoy en adelante
function proximosFeriados(cantidad = 5) {
  const hoy = new Date().toISOString().split('T')[0];
  const anio = new Date().getFullYear();
  const lista = [...feriadosAnio(anio), ...feriadosAnio(anio + 1)];
  return lista.filter(f => f.fecha >= hoy).slice(0, cantidad);
}

// Feriados dentro de un rango de fechas [inicio, fin] (strings YYYY-MM-DD)
function feriadosEnRango(inicio, fin) {
  const anio = new Date(inicio).getFullYear();
  const lista = [...feriadosAnio(anio), ...feriadosAnio(anio + 1)];
  return lista.filter(f => f.fecha >= inicio && f.fecha <= fin);
}

// Días que faltan desde hoy hasta una fecha (string YYYY-MM-DD)
function diasHasta(fechaStr) {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const d = new Date(fechaStr + 'T00:00:00');
  return Math.round((d - hoy) / 86400000);
}

// Nombre corto del mes
function nomMes(fechaStr) {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const d = new Date(fechaStr + 'T00:00:00');
  return `${d.getDate()} ${meses[d.getMonth()]}`;
}
