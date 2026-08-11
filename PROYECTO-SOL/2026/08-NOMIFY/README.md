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
| **Planillero** | Genera planillas, solo lectura en el resto |
| **Empleado** | Solo ve su propio recibo de pago |

---

## Despliegue en servidor (producción)

Esta sección explica cómo publicar Nomify en un servidor Linux con un subdominio propio, por ejemplo `nomina.orison.us`.

### Requisitos del servidor

- Ubuntu 20.04 / 22.04 (o Debian equivalente)
- Acceso SSH con usuario con privilegios `sudo`
- Un dominio o subdominio apuntando a la IP del servidor (registro DNS tipo A)

---

### 1. Instalar Node.js en el servidor

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # debe mostrar v20.x.x
```

---

### 2. Instalar MariaDB

```bash
sudo apt update
sudo apt install -y mariadb-server
sudo mysql_secure_installation   # seguir el asistente: poner contraseña root, responder Y a todo
```

Crear la base de datos y el usuario de la app:

```sql
sudo mariadb -u root -p

CREATE DATABASE planilla_nicaragua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nomify'@'localhost' IDENTIFIED BY 'una_contraseña_segura';
GRANT ALL PRIVILEGES ON planilla_nicaragua.* TO 'nomify'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Importar el respaldo SQL incluido en el repositorio:

```bash
sudo mariadb -u nomify -p planilla_nicaragua < /ruta/al/repo/bk_nomify/resp\ db/NOMIFY\ DB.sql
```

---

### 3. Clonar el repositorio

```bash
cd /var/www
sudo git clone https://github.com/WX-MDA/Nomify.git
sudo chown -R $USER:$USER /var/www/Nomify
cd /var/www/Nomify/bk_nomify
```

---

### 4. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Ajustar con los valores reales de producción:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=nomify
DB_PASSWORD=una_contraseña_segura
DB_NAME=planilla_nicaragua
JWT_SECRET=cadena_larga_y_aleatoria_minimo_32_caracteres
PORT=3000
APP_URL=https://nomina.orison.us
```

> **Importante:** el `JWT_SECRET` debe ser una cadena larga y aleatoria. Podés generar una con:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

> **`APP_URL`** debe ser el dominio público real (con `https://`) — se usa para armar los enlaces del correo de recuperación de contraseña.

---

### 4.1 Variables de correo (SMTP) — **no te la saltes**

`.env` está en `.gitignore` a propósito (nunca se sube a GitHub), así que **cada servidor nuevo empieza sin SMTP configurado**. Si no agregás estas variables, el sistema sigue funcionando pero cualquier botón de "Enviar por correo" (reporte de planilla, recibo individual, recuperación de contraseña, notificación de planilla pagada) devuelve el error `SMTP no configurado en el servidor. Agrega las variables de correo en .env`.

Agregá esto al mismo `.env` del paso anterior:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicación_16_caracteres
SMTP_FROM=tucorreo@gmail.com
```

- `SMTP_PASS` es una **contraseña de aplicación** de Gmail, no la contraseña normal de la cuenta. Se genera en `myaccount.google.com` → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones.
- **Usá el puerto 465 (`SMTP_SECURE=true`), no el 587.** Muchos servidores/ISP bloquean el puerto 587 (SMTP con STARTTLS) por defecto y la conexión falla con `ETIMEDOUT`, aunque la contraseña esté bien. El puerto 465 usa SSL directo y no tiene ese problema. Si igual falla, probá:
  ```bash
  # Desde el servidor, confirmar qué puerto está abierto de salida:
  node -e "const n=require('net');[587,465].forEach(p=>{const s=n.createConnection(p,'smtp.gmail.com');s.setTimeout(5000,()=>{console.log(p,'TIMEOUT');s.destroy()});s.on('connect',()=>{console.log(p,'OK');s.destroy()})})"
  ```
- Si al probar el envío el error es de tipo `Invalid login` / `535-5.7.8` / `EAUTH`, ahí sí es la contraseña de aplicación (venció, se revocó, o se copió mal) — regenerala en Gmail y actualizá `SMTP_PASS`.
- Tras cualquier cambio en `.env`, reiniciar con `pm2 restart nomify` (los cambios de `.env` no se aplican solos).

---

### 5. Instalar dependencias del backend

```bash
cd /var/www/Nomify/bk_nomify
npm install --production
```

---

### 6. Instalar PM2 y levantar el backend

PM2 es un gestor de procesos que mantiene el servidor corriendo aunque se reinicie la máquina.

```bash
sudo npm install -g pm2

# Iniciar la app
pm2 start server.js --name nomify

# Guardar la configuración para que arranque automáticamente al reiniciar el servidor
pm2 save
pm2 startup   # ejecutar el comando que PM2 indique en pantalla
```

Comandos útiles de PM2:

```bash
pm2 status          # ver si la app está corriendo
pm2 logs nomify     # ver logs en tiempo real
pm2 restart nomify  # reiniciar la app (por ejemplo, tras un cambio)
pm2 stop nomify     # detener la app
```

---

### 7. Instalar y configurar Nginx

Nginx actúa como proxy inverso: recibe las peticiones del dominio y las redirige al puerto 3000 donde corre Node.js.

```bash
sudo apt install -y nginx
```

Crear el archivo de configuración del sitio:

```bash
sudo nano /etc/nginx/sites-available/nomify
```

Pegar el siguiente contenido (reemplazá `nomina.orison.us` con tu subdominio real):

```nginx
server {
    listen 80;
    server_name nomina.orison.us;

    # Frontend — archivos estáticos
    location / {
        root /var/www/Nomify/ft_nomify;
        index login.html;
        try_files $uri $uri/ /login.html;
    }

    # Backend — proxy al puerto 3000
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar el sitio y recargar Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/nomify /etc/nginx/sites-enabled/
sudo nginx -t          # verificar que la config no tenga errores
sudo systemctl reload nginx
```

---

### 8. Activar HTTPS con Let's Encrypt (recomendado)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d nomina.orison.us
```

Certbot modifica automáticamente la configuración de Nginx para usar HTTPS. Los certificados se renuevan solos.

---

### 9. Verificar que todo funciona

1. Abrir el navegador en `http://nomina.orison.us` (o `https://` si configuraste SSL)
2. Debe aparecer la pantalla de login de Nomify
3. Iniciar sesión con el usuario Master
4. Si es la primera vez, crear el usuario Master desde el servidor:

```bash
cd /var/www/Nomify/bk_nomify
node create-admin.js
```

---

### Resumen del stack en producción

```
Internet
    │
    ▼
 Nginx (puerto 80/443)
    │
    ├── /          → ft_nomify/  (archivos estáticos HTML/CSS/JS)
    │
    └── /api/      → Node.js : 3000  (backend Express)
                          │
                          └── MariaDB : 3306
```
