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
  (paleta real de G54: `#2D5BFF` / `#1E45D6`).
- **El motor de voz en tiempo real (VAPI u otro) NO vive acá** — esta plataforma
  es la capa de configuración/gestión. La llamada real de audio la maneja el
  proveedor externo; nosotros guardamos qué proveedor y qué modelo de IA usa
  cada negocio.

## Modelo de datos

```
Agency ──< AgencyUser         (login de agencia)
Agency ──< Business ──< BusinessUser   (login de negocio)
                    └─── BotConfig     (proveedor de voz + proveedor de IA + prompt)
```

## Correr en local

### Backend

```bash
cd voice-platform/backend
python -m venv venv
./venv/Scripts/python.exe -m pip install -r requirements.txt
cp .env.example .env   # editar JWT_SECRET antes de producción
./venv/Scripts/python.exe seed.py   # crea datos de prueba (solo la primera vez)
./venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
```

Credenciales de prueba creadas por `seed.py`:
- Agencia: `admin@growth54.com` / `agencia123`
- Negocio: `admin@cratingexpress-demo.com` / `negocio123`

Docs interactivas de la API: `http://localhost:8000/docs`

### Frontend

```bash
cd voice-platform/frontend
npm install
npm run dev
```

Abre en `http://localhost:5173` — redirige a `/agencia/login` por defecto.
El negocio entra por `/negocio/login`.

## Estado actual

- [x] Login de agencia y de negocio, con JWT y roles separados
- [x] Panel de agencia — lista de negocios (lectura)
- [x] Panel de negocio — ver y editar configuración del bot (proveedor de IA,
      modelo, prompt) — confirmado que persiste de verdad en la base
- [ ] Crear negocios nuevos desde el panel de agencia (el endpoint ya existe,
      falta la pantalla)
- [ ] Conexión real con un proveedor de voz (VAPI u otro)
- [ ] Guardado de API keys propias por negocio (hoy `ai_provider_config` existe
      en el modelo pero no se usa desde ningún formulario)
