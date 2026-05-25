const nodemailer = require('nodemailer');

// Crea el transporter una sola vez usando las variables de entorno
function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para puerto 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const APP_URL  = () => process.env.APP_URL || 'http://localhost:3000';
const APP_FROM = () => process.env.SMTP_FROM || process.env.SMTP_USER;

// ── Correo de recuperación de contraseña ─────────────────────────────────────
async function enviarResetPassword(email, nombre, token) {
  const urlSi = `${APP_URL()}/api/auth/reset-password?token=${token}&accion=confirmar`;
  const urlNo = `${APP_URL()}/api/auth/reset-password?token=${token}&accion=cancelar`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family:sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <div style="background:#1a2236;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:22px">Nomify</h1>
      <p style="color:#8899aa;margin:4px 0 0;font-size:13px">Sistema de planilla</p>
    </div>
    <div style="padding:32px">
      <h2 style="color:#1a2236;margin:0 0 12px;font-size:18px">Solicitud de recuperación de contraseña</h2>
      <p style="color:#444;font-size:14px;line-height:1.6">
        Hola <strong>${nombre || email}</strong>,<br><br>
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en Nomify.
        Si fuiste tú quien la solicitó, haz clic en <strong>"Sí, restablecer"</strong>. Si no, ignora este mensaje o haz clic en <strong>"No fui yo"</strong>.
      </p>
      <div style="margin:28px 0;display:flex;gap:12px;flex-wrap:wrap">
        <a href="${urlSi}" style="background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
          ✅ Sí, restablecer contraseña
        </a>
        <a href="${urlNo}" style="background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block">
          ❌ No fui yo
        </a>
      </div>
      <p style="color:#888;font-size:12px;margin:0">
        Este enlace expira en <strong>1 hora</strong>. La contraseña se restablecerá a la predeterminada del sistema, que podrás cambiar desde Ajustes una vez que ingreses.
      </p>
    </div>
    <div style="background:#f0f4f8;padding:16px 32px;font-size:11px;color:#aaa;text-align:center">
      Nomify · Sistema de planilla · Solo personal autorizado
    </div>
  </div>
</body>
</html>`;

  const transport = createTransport();
  await transport.sendMail({
    from:    `"Nomify Sistema" <${APP_FROM()}>`,
    to:      email,
    subject: '🔑 Recuperación de contraseña — Nomify',
    html,
  });
}

// ── Correo de confirmación al cambiar contraseña ──────────────────────────────
async function enviarConfirmacionCambioPassword(email, nombre) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<body style="font-family:sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <div style="background:#1a2236;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:22px">Nomify</h1>
      <p style="color:#8899aa;margin:4px 0 0;font-size:13px">Sistema de planilla</p>
    </div>
    <div style="padding:32px">
      <h2 style="color:#1a2236;margin:0 0 12px;font-size:18px">Contraseña actualizada</h2>
      <p style="color:#444;font-size:14px;line-height:1.6">
        Hola <strong>${nombre || email}</strong>,<br><br>
        Tu contraseña de Nomify fue cambiada exitosamente el <strong>${new Date().toLocaleString('es-NI', { dateStyle:'long', timeStyle:'short' })}</strong>.
      </p>
      <p style="color:#444;font-size:14px;line-height:1.6">
        Si <strong>no fuiste tú</strong> quien realizó este cambio, comunícate inmediatamente con el administrador del sistema.
      </p>
    </div>
    <div style="background:#f0f4f8;padding:16px 32px;font-size:11px;color:#aaa;text-align:center">
      Nomify · Sistema de planilla · Solo personal autorizado
    </div>
  </div>
</body>
</html>`;

  const transport = createTransport();
  await transport.sendMail({
    from:    `"Nomify Sistema" <${APP_FROM()}>`,
    to:      email,
    subject: '🔒 Tu contraseña fue cambiada — Nomify',
    html,
  });
}

module.exports = { enviarResetPassword, enviarConfirmacionCambioPassword };
