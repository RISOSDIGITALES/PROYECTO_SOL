const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth, requireMaster } = require('../auth');

const CAMPOS = ['nombre', 'ruc', 'correo', 'telefono', 'direccion', 'logo', 'inatec_activo', 'notif_usuarios'];

// GET /api/empresas — lista todas (sin logo para no inflar la respuesta)
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, ruc, correo, telefono, direccion, inatec_activo FROM empresas ORDER BY nombre ASC'
    );
    if (req.user.rol === 'Planillero' && req.user.empresas_acceso) {
      try {
        const allowed = JSON.parse(req.user.empresas_acceso);
        return res.json(rows.filter(e => allowed.includes(e.id)));
      } catch (_) {}
    }
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/empresas/:id — detalle completo incluyendo logo
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [[row]] = await db.query(
      'SELECT id, nombre, ruc, correo, telefono, direccion, logo, inatec_activo FROM empresas WHERE id = ?',
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Empresa no encontrada' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/empresas — solo Master
router.post('/', requireAuth, requireMaster, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'Razón social requerida' });
    const vals = CAMPOS.map(c => {
      const v = req.body[c];
      if (c === 'logo') return v ?? null;
      if (c === 'inatec_activo') return v !== undefined ? Number(v) : 1;
      return v?.trim?.() ?? v ?? null;
    });
    const [result] = await db.query(
      `INSERT INTO empresas (${CAMPOS.join(', ')}) VALUES (${CAMPOS.map(() => '?').join(', ')})`,
      vals
    );
    const [[created]] = await db.query(
      'SELECT id, nombre, ruc, correo, telefono, direccion, inatec_activo FROM empresas WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(created);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/empresas/:id — solo Master
router.patch('/:id', requireAuth, requireMaster, async (req, res) => {
  try {
    const sets = [], vals = [];
    for (const c of CAMPOS) {
      if (req.body[c] !== undefined) {
        sets.push(`${c} = ?`);
        const v = req.body[c];
        vals.push((c === 'logo') ? (v ?? null) : (v?.trim?.() ?? v ?? null));
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
    vals.push(req.params.id);
    await db.query(`UPDATE empresas SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [[updated]] = await db.query(
      'SELECT id, nombre, ruc, correo, telefono, direccion, inatec_activo FROM empresas WHERE id = ?',
      [req.params.id]
    );
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/empresas/:id/notif — obtener destinatarios de notificación
router.get('/:id/notif', requireAuth, requireMaster, async (req, res) => {
  try {
    const [[emp]] = await db.query('SELECT notif_usuarios FROM empresas WHERE id = ?', [req.params.id]);
    if (!emp) return res.status(404).json({ error: 'Empresa no encontrada' });
    const ids = emp.notif_usuarios ? JSON.parse(emp.notif_usuarios) : [];
    res.json({ notif_usuarios: ids });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/empresas/:id/notif — guardar destinatarios de notificación
router.patch('/:id/notif', requireAuth, requireMaster, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.notif_usuarios) ? req.body.notif_usuarios : [];
    await db.query('UPDATE empresas SET notif_usuarios = ? WHERE id = ?', [JSON.stringify(ids), req.params.id]);
    res.json({ ok: true, notif_usuarios: ids });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/empresas/:id — solo Master
router.delete('/:id', requireAuth, requireMaster, async (req, res) => {
  try {
    await db.query('DELETE FROM empresas WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
