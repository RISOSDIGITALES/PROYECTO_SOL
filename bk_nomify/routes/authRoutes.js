const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?', [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const token = signToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      empleado_id: user.empleado_id,
      planillas_acceso: user.planillas_acceso || null,
    });
    res.json({
      token,
      rol: user.rol,
      nombre: user.nombre,
      email: user.email,
      planillas_acceso: user.planillas_acceso || null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    email: req.user.email,
    rol: req.user.rol,
    nombre: req.user.nombre,
    empleado_id: req.user.empleado_id,
    planillas_acceso: req.user.planillas_acceso || null,
  });
});

// PATCH /api/auth/perfil — actualizar propio nombre y/o contraseña
router.patch('/perfil', requireAuth, async (req, res) => {
  const { nombre, password } = req.body;
  const sets = [], vals = [];
  if (nombre !== undefined) { sets.push('nombre = ?'); vals.push(nombre); }
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });
    sets.push('password_hash = ?');
    vals.push(bcrypt.hashSync(password, 10));
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.user.id);
  try {
    await db.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
