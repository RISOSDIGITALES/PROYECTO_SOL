# Nomify — Sistema de Planilla Nicaragua

Sistema de nómina quincenal para empresa en Managua, Nicaragua.  
Stack: **Node.js + Express + MariaDB** — sin dependencias de servicios externos.

---

## Requisitos

- Node.js 18+
- MariaDB 10.6+ (o MySQL 8+)
- npm

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/WX-MDA/Nomify.git
cd Nomify
```

### 2. Instalar dependencias

```bash
cd planilla-server
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los datos de la base de datos:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=planilla_nicaragua
JWT_SECRET=cadena_aleatoria_segura
PORT=3000
```

### 4. Crear la base de datos

En phpMyAdmin o cliente MariaDB:

```sql
CREATE DATABASE planilla_nicaragua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Luego ejecutar el script de tablas:

```sql
-- Importar planilla-server/schema.sql en la base planilla_nicaragua
```

### 5. Crear el primer usuario Master

```bash
cd planilla-server
node create-admin.js
```

Esto crea el usuario `risosadmi@gmail.com` con contraseña `admin123`.  
**Cambiar la contraseña desde la app en Usuarios después del primer login.**

### 6. Ejecutar el servidor

```bash
node server.js
```

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

---

## Roles de usuario

| Rol | Acceso |
|---|---|
| **Master** | Acceso total — empleados, planillas, usuarios, todos los módulos |
| **Colaborador** | Ve solo los empleados del tipo de planilla que le fue asignado |

El Master gestiona los usuarios desde el módulo **Usuarios** dentro de la app.  
Al crear un Colaborador se indica si tiene acceso a `Con Seguro` o `Sin Seguro`.

---

## Módulos del sistema

| Módulo | Descripción |
|---|---|
| Dashboard | Estadísticas generales, próximos feriados |
| Empleados | CRUD de empleados activos |
| Planillas | Generar quincena, historial de planillas generadas |
| Préstamos | Control de préstamos con historial de pagos |
| Adelantos | Adelantos quincenales con opción de pausar |
| Extras | Bonos, feriados trabajados, turnos extra |
| Otras Deducciones | Descuentos manuales (uniforme, daño, etc.) |
| Vacaciones | Saldo acumulado y registro de días |
| Calendario | Vista mensual con feriados, quincenas y vacaciones |
| Usuarios | Gestión de acceso al sistema (solo Master) |

---

## Despliegue en servidor

### Variables de entorno en producción

Configurar las mismas variables del `.env` directamente en el servidor o en el panel del servicio de hosting.

El `JWT_SECRET` debe ser una cadena larga y aleatoria:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Con PM2 (recomendado)

```bash
npm install -g pm2
cd planilla-server
pm2 start server.js --name nomify
pm2 save
pm2 startup
```

### Con systemd

Crear `/etc/systemd/system/nomify.service`:

```ini
[Unit]
Description=Nomify Planilla Server
After=network.target

[Service]
WorkingDirectory=/ruta/al/proyecto/planilla-server
ExecStart=/usr/bin/node server.js
Restart=always
User=www-data
EnvironmentFile=/ruta/al/proyecto/planilla-server/.env

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable nomify
systemctl start nomify
```

### Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name nomina.orison.us;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Operación sin internet

El sistema opera completamente en red local. Una vez levantado el servidor y la base de datos, no requiere conexión a internet para ninguna funcionalidad principal.

---

## Estructura del proyecto

```
Nomify/
├── planilla-server/          # Backend Node.js + Express
│   ├── server.js             # Punto de entrada
│   ├── auth.js               # JWT middleware
│   ├── db.js                 # Pool de conexión MariaDB
│   ├── schema.sql            # Script de creación de tablas
│   ├── create-admin.js       # Script inicial de usuario Master
│   ├── .env.example          # Variables de entorno de ejemplo
│   └── routes/               # Rutas de la API
└── planilla-web/             # Frontend HTML/JS/CSS
    ├── assets/
    │   ├── css/app.css
    │   └── js/
    │       ├── auth.js       # Auth helpers (JWT, onReady, apiFetch)
    │       └── feriados.js   # Feriados Nicaragua
    ├── login.html
    ├── index.html            # Dashboard
    ├── empleados.html
    ├── planillas.html
    ├── prestamos.html
    ├── adelantos.html
    ├── extras.html
    ├── deducciones.html
    ├── vacaciones.html
    ├── calendario.html
    ├── usuarios.html         # Gestión de acceso (solo Master)
    ├── planilla-detalle.html
    └── recibo.html
```
