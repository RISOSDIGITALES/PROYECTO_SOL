const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireMaster } = require('../auth');

// GET /api/empresas — todos los usuarios autenticados pueden listar empresas
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre FROM empresas ORDER BY nombre ASC');
    // Si el usuario es Planillero con empresas_acceso, filtrar solo las suyas
    if (req.user.rol === 'Planillero' && req.user.empresas_acceso) {
      try {
        const allowed = JSON.parse(req.user.empresas_acceso);
        const filtradas = rows.filter(e => allowed.includes(e.id));
        return res.json(filtradas);
      } catch (_) {}
    }
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/empresas — solo Master
router.post('/', requireAuth, requireMaster, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const [result] = await db.query('INSERT INTO empresas (nombre) VALUES (?)', [nombre.trim()]);
    res.status(201).json({ id: result.insertId, nombre: nombre.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/empresas/:id — solo Master
router.patch('/:id', requireAuth, requireMaster, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    await db.query('UPDATE empresas SET nombre = ? WHERE id = ?', [nombre.trim(), req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/empresas/:id — solo Master
router.delete('/:id', requireAuth, requireMaster, async (req, res) => {
  try {
    await db.query('DELETE FROM empresas WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
