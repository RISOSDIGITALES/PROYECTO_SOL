const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev_secret';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, SECRET);
    // Extraer empresa seleccionada del header
    const rawEmpresa = req.headers['x-empresa-id'];
    req.empresaId = rawEmpresa ? parseInt(rawEmpresa) : null;
    // Planillero: validar/forzar empresa según su lista de acceso
    if (req.user.rol === 'Planillero' && req.user.empresas_acceso) {
      try {
        const allowed = JSON.parse(req.user.empresas_acceso);
        if (!req.empresaId || !allowed.includes(req.empresaId)) {
          req.empresaId = allowed[0] || null;
        }
      } catch (_) {}
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function requireMaster(req, res, next) {
  const rol = req.user?.rol;
  if (rol !== 'Master' && rol !== 'Admin') return res.status(403).json({ error: 'Solo Master' });
  next();
}

module.exports = { signToken, requireAuth, requireMaster };
