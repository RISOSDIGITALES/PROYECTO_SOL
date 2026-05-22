const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireMaster } = require('../auth');

// GET /api/usuarios — lista usuarios del sistema
router.get('/', requireAuth, requireMaster, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, email, rol, planillas_acceso, created_at
       FROM usuarios ORDER BY nombre ASC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/usuarios — crear usuario
router.post('/', requireAuth, requireMaster, async (req, res) => {
  const { nombre, email, rol, planillas_acceso } = req.body;
  let { password } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es requerido' });
  // Contraseña estándar si no se especifica
  if (!password) password = 'Nomify2026';
  if (!['Master', 'Colaborador'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
  if (rol === 'Colaborador' && !planillas_acceso)
    return res.status(400).json({ error: 'Colaborador requiere planillas_acceso' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, planillas_acceso) VALUES (?,?,?,?,?)',
      [nombre || null, email, hash, rol, planillas_acceso || null]
    );
    const [rows] = await db.query(
      'SELECT id, nombre, email, rol, planillas_acceso, created_at FROM usuarios WHERE id = ?', [r.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Ese email ya existe' });
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/usuarios/:id — editar usuario
router.patch('/:id', requireAuth, requireMaster, async (req, res) => {
  const { nombre, email, password, rol, planillas_acceso } = req.body;
  const sets = [], vals = [];
  if (nombre !== undefined) { sets.push('nombre = ?'); vals.push(nombre); }
  if (email !== undefined) { sets.push('email = ?'); vals.push(email); }
  if (rol !== undefined) { sets.push('rol = ?'); vals.push(rol); }
  if (planillas_acceso !== undefined) { sets.push('planillas_acceso = ?'); vals.push(planillas_acceso || null); }
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    sets.push('password_hash = ?'); vals.push(hash);
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);
  try {
    await db.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [rows] = await db.query(
      'SELECT id, nombre, email, rol, planillas_acceso, created_at FROM usuarios WHERE id = ?', [req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/usuarios/:id
router.delete('/:id', requireAuth, requireMaster, async (req, res) => {
  if (req.user.id == req.params.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  try {
    await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
