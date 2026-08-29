# Vox54 (nombre provisorio — pendiente de decidir el nombre real)

Plataforma de gestión multiempresa para agentes de voz — panel de agencia (nosotros)
y panel de negocio (cada cliente), con proveedor de voz y proveedor de IA
intercambiables por negocio.

## Arquitectura

- **Backend:** Python + FastAPI + SQLAlchemy (SQLite en desarrollo, migrable a
  Postgres/MySQL sin tocar código). JWT para auth, dos roles separados
  (`agency` / `business`), cada uno con sus propios endpoints protegidos.
- **Frontend:** React + Vite, sin framework de estilos — colores y tipografía
  tomados de `PROYECTO-SOL/2026/sops/plataforma/design-system-reportes-g54.html`
  (paleta real de G54: `#2D5BFF` / `#1E45D6`). El logo dice "Vox", no "Growth" —
  mismo estilo visual que la familia de productos, nombre propio.
- **El motor de voz en tiempo real (VAPI u otro) NO vive acá** — esta plataforma
  es la capa de configuración/gestión. La llamada real de audio la maneja el
  proveedor externo; nosotros guardamos qué proveedor y qué modelo de IA usa
  cada negocio.
- **Catálogo de proveedores** (`backend/app/catalog.py`): lista real de modelos
  de IA por proveedor (Groq, OpenAI, Anthropic, Gemini) y voces de muestra por
  proveedor de voz — alimenta los desplegables en cascada del formulario de
  configuración. Las voces son de muestra a propósito (etiquetadas como tal) —
  no hay ningún proveedor de voz conectado todavía, así que no se simula un
  catálogo real.

## Modelo de datos

```
Agency ──< AgencyUser         (login de agencia)
Agency ──< Business ──< BusinessUser   (login de negocio)
                    └─── BotConfig     (voz + IA + comportamiento del agente)
```

`BotConfig` guarda: proveedor y voz elegidos, número de teléfono asignado,
proveedor y modelo de IA elegidos, API key propia opcional (si el negocio
quiere usar su propia cuenta en vez de la compartida), prompt del sistema,
mensaje de bienvenida, correo de escalación, idioma, y estado (activo/pausado).

## Correr en local

### Backend

```bash
cd vox54/backend
python -m venv venv
./venv/Scripts/python.exe -m pip install -r requirements.txt
cp .env.example .env   # editar JWT_SECRET antes de producción
./venv/Scripts/python.exe seed.py   # crea datos de prueba (solo la primera vez)
./venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
```

Credenciales de prueba creadas por `seed.py`:
- Agencia: `admin@growth54.com` / `agencia123`
- Negocio 1 (Crating Express): `admin@cratingexpress-demo.com` / `negocio123`
- Negocio 2 (Orison Managua): `admin@orison-demo.com` / `negocio123`

Docs interactivas de la API: `http://localhost:8000/docs`

### Frontend

```bash
cd vox54/frontend
npm install
npm run dev
```

Abre en `http://localhost:5173` — redirige a `/agencia/login` por defecto.
El negocio entra por `/negocio/login`.

## Estado actual

- [x] Login de agencia y de negocio, con JWT y roles separados
- [x] Panel de agencia — lista de negocios, crear negocio nuevo (formulario real,
      confirmado creando uno de punta a punta), entrar al detalle de cualquiera
      de los suyos para ver/editar su configuración completa
- [x] Panel de negocio — formulario completo del agente: proveedor de voz + voz
      (desplegable en cascada), teléfono asignado, proveedor de IA + modelo
      (desplegable en cascada), API key propia opcional, idioma, mensaje de
      bienvenida, correo de escalación, prompt del sistema, estado activo/pausado
      — todo confirmado que persiste de verdad en la base, no solo en pantalla
- [x] Catálogo de proveedores real (`GET /catalog`), no hardcodeado en el frontend
- [ ] Conexión real con un proveedor de voz (VAPI u otro) — hoy todo el flujo de
      configuración está listo, pero no dispara ninguna llamada real
- [ ] Borrar un negocio (no existe el endpoint todavía — fuera de alcance hasta
      que se pida)
