# Nomify — Sistema de Planilla

App web de gestión de planilla para Nicaragua. Backend Node.js + Express + MariaDB, frontend HTML/CSS/JS puro.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior (o NVM for Windows)
- [MariaDB](https://mariadb.org/) / MySQL corriendo localmente (Laragon lo incluye)

---

## Cómo correr el proyecto

### 1. Clonar el repo

```bash
git clone https://github.com/WX-MDA/Nomify.git
cd Nomify
git checkout sol/feature-inicial
```

### 2. Configurar el backend

```bash
cd bk_nomify
npm install
cp .env.example .env
```

Abre `.env` y ajusta las credenciales de tu MariaDB local:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=planilla_nicaragua
JWT_SECRET=cualquier_cadena_secreta_larga
```

### 3. Crear e importar la base de datos

En HeidiSQL, phpMyAdmin o desde consola:

```sql
CREATE DATABASE IF NOT EXISTS planilla_nicaragua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Luego importa el archivo de respaldo:

```
bk_nomify/resp db/NOMIFY DB.sql
```

> Las tablas también se crean automáticamente al arrancar el servidor si no existen.

### 4. Arrancar el servidor

```bash
# desde bk_nomify/
npm start
# o: node server.js
```

El backend queda en `http://localhost:3000`

### 5. Abrir el frontend

Abre la carpeta `ft_nomify/` con **VS Code Live Server** (click derecho → "Open with Live Server" sobre `login.html`), o con cualquier servidor estático:

```bash
npx serve ft_nomify
```

### 6. Primer acceso

Crea el usuario Master inicial ejecutando (una sola vez):

```bash
node create-admin.js
```

Luego entra con las credenciales que configuraste en ese script.

---

## Estructura del proyecto

```
Nomify/
├── bk_nomify/          # Backend — Node.js + Express
│   ├── routes/         # Endpoints de la API
│   ├── server.js       # Punto de entrada
│   ├── db.js           # Conexión a MariaDB
│   ├── auth.js         # Middleware JWT
│   ├── resp db/        # Respaldo SQL de la base de datos
│   └── .env.example    # Plantilla de variables de entorno
└── ft_nomify/          # Frontend — HTML/CSS/JS
    ├── assets/
    │   ├── css/app.css
    │   └── js/auth.js
    └── *.html          # Páginas de la app
```

---

## Roles del sistema

| Rol | Acceso |
|-----|--------|
| **Master** | Acceso total — empleados, planillas, usuarios |
| **Planillero** | Gestiona planillas (Con Seguro y Sin Seguro) |
| **Empleado** | Solo ve su propio recibo de pago |
