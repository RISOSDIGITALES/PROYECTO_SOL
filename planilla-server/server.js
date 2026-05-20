require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { requireAuth, requireAdmin } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

// Servir el frontend estático
app.use(express.static(path.join(__dirname, '../planilla-web')));

// Rutas API
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/empleados',  require('./routes/empleadosRoutes'));
app.use('/api/prestamos',  require('./routes/prestamosRoutes'));
app.use('/api/adelantos',  require('./routes/adelantosRoutes'));
app.use('/api/extras',     require('./routes/extrasRoutes'));
app.use('/api/deducciones',require('./routes/deduccionesRoutes'));
app.use('/api/vacaciones', require('./routes/vacacionesRoutes'));
app.use('/api/planillas',  require('./routes/planillasRoutes'));

// Todas las demás rutas devuelven el HTML correspondiente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../planilla-web/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Planilla server corriendo en http://localhost:${PORT}`));
