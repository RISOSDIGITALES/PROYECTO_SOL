/**
 * exportXlsx — descarga un Excel desde el backend usando autenticación JWT.
 * @param {string} endpoint  - Ruta relativa, ej: '/api/export/empleados'
 * @param {string} filename  - Nombre sugerido para el archivo (sin extensión)
 */
async function exportXlsx(endpoint, filename) {
  const btn = event?.currentTarget;
  const origText = btn?.textContent;
  if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }

  try {
    const token     = localStorage.getItem('planilla_token');
    const empresaId = localStorage.getItem('planilla_empresa_id');
    const res = await fetch(endpoint, {
      headers: {
        ...(token     ? { Authorization: `Bearer ${token}` }  : {}),
        ...(empresaId ? { 'X-Empresa-ID': empresaId }         : {}),
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Error al generar el archivo');
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = filename + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Error al exportar: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
}
