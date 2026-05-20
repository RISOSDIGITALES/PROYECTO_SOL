// Ejecutar UNA VEZ para crear el usuario admin inicial:
//   node create-admin.js
// Luego eliminar este archivo si quieres.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

const EMAIL    = 'risosadmi@gmail.com';
const PASSWORD = 'admin123';

(async () => {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'planilla_nicaragua',
  });

  const hash = bcrypt.hashSync(PASSWORD, 10);
  await db.query(
    'INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = ?, rol = ?',
    [EMAIL, hash, 'Admin', hash, 'Admin']
  );
  console.log(`Usuario admin creado: ${EMAIL} / ${PASSWORD}`);
  await db.end();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
