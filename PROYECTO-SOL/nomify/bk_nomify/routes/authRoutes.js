const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db = require('../db');
const { signToken, requireAuth } = require('../auth');
let enviarResetPassword = async () => {};
let enviarConfirmacionCambioPassword = async () => {};
try {
  const mailer = require('../mailer');
  enviarResetPassword = mailer.enviarResetPassword;
  enviarConfirmacionCambioPassword = mailer.enviarConfirmacionCambioPassword;
} catch (_) { /* nodemailer no disponible — correos desactivados */ }

const SECRET = process.env.JWT_SECRET || 'dev_secret';
const DEFAULT_PASS = 'Nomify2026';

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
      empresas_acceso: user.empresas_acceso || null,
    });
    res.json({
      token,
      rol: user.rol,
      nombre: user.nombre,
      email: user.email,
      planillas_acceso: user.planillas_acceso || null,
      empresas_acceso: user.empresas_acceso || null,
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
    empresas_acceso: req.user.empresas_acceso || null,
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
    // Enviar email de confirmación si se cambió la contraseña
    if (password && process.env.SMTP_HOST) {
      enviarConfirmacionCambioPassword(req.user.email, req.user.nombre).catch(() => {});
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Recuperación de contraseña ────────────────────────────────────────────────

// POST /api/auth/forgot-password — solicitar reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  // Siempre responder OK aunque el email no exista (seguridad: no revelar si existe)
  res.json({ ok: true, mensaje: 'Si ese correo existe en el sistema, recibirás un enlace en breve.' });

  // Proceso async sin bloquear la respuesta
  (async () => {
    try {
      if (!process.env.SMTP_HOST) return; // SMTP no configurado — modo silencioso
      const [rows] = await db.query('SELECT id, nombre, email FROM usuarios WHERE email = ?', [email]);
      if (!rows.length) return; // email no existe — no hacer nada

      const user = rows[0];
      // Token JWT de un solo uso con propósito específico (expira en 1h)
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, purpose: 'password-reset' },
        SECRET,
        { expiresIn: '1h' }
      );
      await enviarResetPassword(user.email, user.nombre, resetToken);
    } catch (_) { /* silencioso — no exponer errores internos */ }
  })();
});

// GET /api/auth/reset-password?token=X&accion=confirmar|cancelar
router.get('/reset-password', async (req, res) => {
  const { token, accion } = req.query;

  function htmlResp(titulo, color, mensaje, submensaje = '') {
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo} — Nomify</title>
<style>
  body{font-family:sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .box{background:#1e293b;border-radius:12px;padding:40px 48px;max-width:440px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.4)}
  h2{color:${color};margin:0 0 12px;font-size:22px}
  p{color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px}
  a{display:inline-block;background:${color};color:#fff;padding:11px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px}
  small{display:block;color:#64748b;font-size:11px;margin-top:20px}
</style></head>
<body>
  <div class="box">
    <h2>${titulo}</h2>
    <p>${mensaje}</p>
    ${submensaje ? `<p style="font-size:12px;color:#64748b">${submensaje}</p>` : ''}
    <a href="/login.html">Ir al inicio de sesión</a>
    <small>Nomify · Sistema de planilla</small>
  </div>
</body></html>`;
  }

  if (!token) return res.status(400).send(htmlResp('Enlace inválido', '#ef4444', 'El enlace de recuperación es inválido o está incompleto.'));

  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.purpose !== 'password-reset') throw new Error('Token inválido');

    if (accion === 'cancelar') {
      return res.send(htmlResp(
        '✅ Cuenta segura',
        '#22c55e',
        'Tu contraseña <strong>no fue modificada</strong>. Si recibiste este correo por error, puedes ignorarlo.',
        'Te recomendamos revisar quién tiene acceso a tu correo electrónico.'
      ));
    }

    if (accion === 'confirmar') {
      const newHash = bcrypt.hashSync(DEFAULT_PASS, 10);
      await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newHash, payload.userId]);
      return res.send(htmlResp(
        '🔑 Contraseña restablecida',
        '#3b82f6',
        `Tu contraseña fue restablecida a la predeterminada: <strong style="color:#fff">${DEFAULT_PASS}</strong><br><br>Ingresa con esa contraseña y cámbiala desde <em>Ajustes</em>.`,
      ));
    }

    res.status(400).send(htmlResp('Acción inválida', '#ef4444', 'El enlace no tiene una acción válida.'));
  } catch (e) {
    res.status(400).send(htmlResp(
      '⏰ Enlace expirado',
      '#f97316',
      'Este enlace de recuperación ya expiró o no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.',
    ));
  }
});

module.exports = router;
