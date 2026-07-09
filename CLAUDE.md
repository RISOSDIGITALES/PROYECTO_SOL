# PROYECTO SOL — G54 Platform + Crating Express + Nomify

## REGLA ABSOLUTA — G54 Platform

> **NADA específico de ningún cliente puede estar hardcodeado en los agentes de G54.**
> Los workflows de G54 (`workflow-strategist-ai-g54-v3.json`, `workflow-distribution-ai-g54.json`, `workflow-community-ai-g54.json`, `workflow-sales-ai-motor-g54.json`, `workflow-analytics-ai-g54.json`, `workflow-analytics-ai-mensual-g54.json`) son de la **plataforma**, no de CE.
> Cualquier restricción, prompt, configuración o dato de un cliente específico (incluyendo CE) va en:
> - El perfil de empresa en G54 API (`/api/n8n/companies/{id}`)
> - Airtable del cliente (solo para workflows CE-específicos)
> - El nodo ⚙️ Config del workflow con `continueOnFail` leyendo de G54
>
> **Workflows exclusivos de CE** (sí pueden tener lógica CE): `workflow-rrss-n8n-v13.json`, `workflow-wa-engine-g54.json` (Alex, ID `zAhV8gEsXD8dCrXq`)

## Qué es este proyecto

Tres líneas de trabajo en un mismo repositorio:
1. **G54 Platform** — plataforma de adquisición digital multi-módulo (ver sección G54 abajo)
2. **Crating Express** — cliente piloto de G54 (embalaje de madera a medida, Miami FL)
3. **Nomify** — sistema de planilla para Nicaragua (Express + MariaDB)

---

# G54 — Plataforma de Adquisición Digital

## Arquitectura G54

G54 es una plataforma completa de adquisición digital. Tiene 4 módulos, cada uno con agentes IA especializados en n8n.

```
SOCIAL MEDIA → TRAFFIC → WEBSITE → LEADS → SALES → RETARGETING (SEM)
     ↑              ↑         ↑           ↑
  Módulo 1       Módulo 2   Módulo 4   Módulo 3
```

| Módulo | Nombre | Estado | Agentes IA |
|---|---|---|---|
| **1** | **Social Media (RRSS)** | ✅ v1.4 listo | Strategist ✅ v3.0, Content ✅ v1.4, Distribution ✅ v1.0, Community, Sales, Analytics |
| **2** | **SEO / AEO / GEO** | 🔜 Próximo | SEO Strategist, Content SEO, Technical SEO, Analytics SEO |
| **3** | **SEM (Paid Ads)** | ⏳ Pendiente | Ads Strategist, Ads Creative, Campaign Manager, Ads Analytics |
| **4** | **Web Development** | ⏳ Pendiente | UX/UI, Web Builder, Conversion Optimizer |

**Flujo estratégico:** RRSS genera demanda → SEO captura → Website convierte → SEM acelera → Analytics retroalimenta

## G54 API — Conexión verificada

- **API Base URL:** `https://apigrowth.mdarthurdigital.com` (test/dev activo)
- **Producción:** `https://api.growth54.com` (no activa aún)
- **Auth:** `N8N_API_TOKEN` (read) y `AGENT_API_TOKEN` (write) via Bearer — **en dev mode, tokens vacíos funcionan sin auth**
- **Admin panel:** `https://growth.mdarthurdigital.com/admin`
- **Comprobado en vivo 2026-05-27**: endpoints responden sin tokens

### Endpoints n8n (read — N8N_TOKEN):

| Endpoint | Respuesta |
|---|---|
| `GET /api/n8n/companies/{id}` | Perfil empresa completo |
| `GET /api/n8n/companies/{id}/productos-servicios` | Servicios activos |
| `GET /api/n8n/companies/{id}/rrss/estrategia` | Estrategia RRSS (lo llena el Strategist AI) |
| `GET /api/n8n/companies/{id}/rrss/ideas` | Ideas aprobadas en cola |
| `GET /api/n8n/companies/{id}/rrss/posts` | Posts generados |

### Endpoints agent (write — AGENT_TOKEN):

| Endpoint | Uso |
|---|---|
| `POST /api/agent/rrss/posts` | Guardar post generado |
| `POST /api/agent/rrss/ideas` | Guardar ideas nuevas |
| `POST /api/agent/rrss/estrategia` | Guardar estrategia (Strategist AI) |
| `PUT /api/rrss/ideas/{id}/status` | Actualizar estado idea |
| `PUT /api/rrss/posts/{id}/status` | Actualizar estado post |

### Config node n8n (⚙️ Config Growth54):
```
G54_BASE_URL    = https://apigrowth.mdarthurdigital.com
G54_N8N_TOKEN   = ""  (vacío = dev mode, acepta sin auth)
G54_AGENT_TOKEN = g54_agent_produccion_2026
G54_COMPANY_ID  = 1   (Crating Express)
```

### Datos en G54 para Crating Express (company_id=1):
- **Empresa:** nombre, descripción, value_proposition, base_city, website, emails[], phones[]
- **7 productos/servicios** cargados (name, description, keywords[])
- **Email empresa:** cratingexpress01@gmail.com
- **Estrategia:** `null` — la llenará el Strategist AI (agente separado, por construir)
- **Ideas:** `[]` — se agregan desde el panel admin o via Strategist AI

### Patrón de integración (mismo para todos los módulos):
```
⚙️ Config G54 → 🎯 Obtener [Datos Módulo] → 🔧 Preparar Contexto
→ 🤖 Generar contenido (Gemini + Groq fallback)
→ 💾 POST /api/agent/[módulo]/[recurso]
→ Estado updates via PUT /api/[módulo]/[recurso]/{id}/status
```

**Regla clave:** todo lo configurable (prompts, instrucciones, parámetros) viene de la API de G54, no hardcodeado en n8n.

## G54 — Módulo 1: Social Media (RRSS)

**Workflow n8n:** `RRSS Automation — Crating Express v1.3 (G54)` (ID: `wyO1f93A66imn9qw`)
**Archivo:** `workflow-rrss-n8n-v13.json`

### Agentes del módulo — Estado completo:
1. ✅ **Content AI v1.4** — genera posts con framework 8 pasos SEO/AEO/GEO. ID: `wyO1f93A66imn9qw`. Archivo: `workflow-rrss-n8n-v13.json`
2. ✅ **Strategist AI v3.0** — define estrategia + trend finder (NewsAPI). ID: `cT1SS300CjujIyHS`. Archivo: `workflow-strategist-ai-g54-v3.json`
3. ✅ **Distribution AI v1.0** — publica FB/IG via Graph API directo. ID: `nmOjyvdfTkEo5FVJ`. Archivo: `workflow-distribution-ai-g54.json`
4. ✅ **Community AI v1.0** — responde comentarios y DMs de FB/IG. ID: `WYGmQcPSOzpvn6yv`. Archivo: `workflow-community-ai-g54.json`
5. ✅ **Sales AI / WA Engine Motor (G54)** — agente de chat genérico WA + FB/IG DM. ID: `otycsrxrMEMuxuwD`. Archivo: `workflow-sales-ai-motor-g54.json`
6. ✅ **Analytics AI Semanal** — reporte lunes 8am. ID: `ocQAzbiftXXOfjct`. Archivo: `workflow-analytics-ai-g54.json`
7. ✅ **Analytics AI Mensual** — reporte día 1 de cada mes. ID: `BrH8GNURlqynJK1H`. Archivo: `workflow-analytics-ai-mensual-g54.json`

**Todos activos en n8n** (2026-06-25). Alex CE (`zAhV8gEsXD8dCrXq`, path `whatsapp-ce`) es independiente e intocable.

> **Nota equipo:** G54 y este proyecto son desarrollados por dos personas: el usuario (risosadmi@gmail.com) y Walter (ingeniero). NO hay un equipo externo. El frontend del panel admin de G54 (`growth.mdarthurdigital.com/admin`) no está en ningún repositorio conocido — pendiente confirmar con Walter dónde vive ese código.

### Framework 8 pasos (Content AI v1.3):
1. Intención de búsqueda (informacional/comercial/transaccional/local)
2. Keywords secundarias (3-5)
3. AEO — respuesta directa para búsqueda por IA
4. Hook con keyword principal
5. Desarrollo (datos + prueba social)
6. GEO (Miami, South Florida, Miami-Dade)
7. Adaptación tono redes sociales
8. CTA con URL obligatorio + hashtags

### Estado actual v1.4:
- ✅ Lee empresa y servicios desde G54 API
- ✅ Lee ideas aprobadas desde G54
- ✅ Guarda posts generados en G54
- ✅ Email de aprobación (español únicamente, referencias al parseo ES)
- ✅ Al aprobar → status `aprobado` en G54 → Distribution AI lo recoge
- ✅ Distribution AI publica FB/IG directo via Graph API (sin Make.com)
- ✅ 0 tokens hardcodeados

### Community AI v1.0 — Detalles
- **ID n8n:** `62tIvF0snsrMj0sM` — activo ✅
- Webhook: `community-ai-g54` — recibe comentarios FB/IG y DMs
- **Nodo GET de verificación:** `🔔 Webhook GET: Verificación Meta` en mismo path — responde `hub.challenge` para registro en Meta ✅
- Extrae: plataforma, tipo (comentario/dm), mensaje, usuarioId, pageId
- Multi-tenant: lee `?company=N` del query param
- **Lookup dinámico de página:** llama `GET /api/n8n/pages/{page_id}` → obtiene `fb_access_token` e `ig_user_id` desde G54 en lugar de valores hardcodeados
- Nodo `🏢 Aplicar Config Empresa` hace merge: query param > respuesta G54 > fallback CE
- Groq llama-3.3-70b-versatile → respuesta pública máx 3 oraciones
- Output estructurado: INTENCIÓN / RESPUESTA / LEAD / PREGUNTA / SIGUIENTE PASO
- Si lead != frío → guarda en G54 via `POST /api/agent/wa/leads`
- Rutas de respuesta: FB comentario → `/{id}/comments`, IG → `/{id}/replies`, DM → `/me/messages`
- **✅ Webhook registrado en Meta** (2026-06-25): app "CRATING EXPRESS RRSS" → Page webhooks → URL `https://n8n.mdarthurdigital.com/webhook/community-ai-g54?company=1` — campos suscritos: `feed`, `messages`

### Sales AI / WA Engine Motor — Detalles
- **ID:** `otycsrxrMEMuxuwD` — activo en n8n ✅ (ID original `eCOX3ogMjToxZsh9` de la creación 2026-06-04 quedó desactualizado — el workflow se recreó en algún momento, ID corregido 2026-07-09)
- **Archivo:** `workflow-sales-ai-motor-g54.json`
- Webhook WA: `wa-engine-g54` (genérico — NO es el de Alex que usa `whatsapp-ce`)
- Webhook FB/IG DM: `sales-ai-social`
- Agente de chat 100% genérico: comportamiento definido por `system_prompt` en G54 WA Config
- Sin cotizador, sin campos CE-específicos (medidas, tipo_cajon, ISPM-15, etc.)
- `datos_actualizados` es objeto libre — el prompt define qué recolectar según el negocio
- Groq llama-3.3-70b-versatile + Gemini 1.5 Flash fallback + fallback estático de emergencia
- Multi-tenant: `?company=N` → Preparar Resolución → Resolver Empresa (G54) → Aplicar Config Empresa
- Estados de lead: `Nuevo` → `En calificación` → `Calificado` → `Vendedor notificado`
- Si clasificacion=caliente → email al vendedor via Gmail (emails desde perfil G54)
- Follow-up horario: lee leads sin respuesta → envía mensajes 24h/72h desde WA Config G54
- Token WA y FB/IG vienen de G54 API — 0 hardcodeados
- **✅ Community AI webhook registrado** en Meta (2026-06-25) con `?company=1`
- **PENDIENTE:** registrar webhook WA (`wa-engine-g54`) en Meta cuando sea necesario

**Alex vs Sales AI Motor — diferencia clave:**
| | Alex (`zAhV8gEsXD8dCrXq`) | Sales AI Motor (`otycsrxrMEMuxuwD`) |
|---|---|---|
| Path WA | `whatsapp-ce` | `wa-engine-g54` |
| Para quién | Solo Crating Express | Cualquier cliente G54 |
| Lógica | CE-específica (cotizador, cajones) | 100% genérica via prompt |
| Tocar | ❌ NUNCA | ✅ Motor de la plataforma |

## G54 — Arquitectura Multi-tenant (2026-06-04)

### Decisión arquitectural
G54 es una plataforma para múltiples clientes simultáneos. La resolución de qué empresa es cuál se hace por **query param en el webhook URL**, no hardcodeado.

**Setup por cliente:**
1. Cliente crea su Meta App en developers.facebook.com
2. Registra webhook apuntando a la URL con su company_id:
   - Community AI: `https://n8n.mdarthurdigital.com/webhook/community-ai-g54?company=N`
   - Sales AI WA: `https://n8n.mdarthurdigital.com/webhook/wa-engine-g54?company=N`
   - Sales AI FB/IG DM: `https://n8n.mdarthurdigital.com/webhook/sales-ai-social?company=N`
3. Cliente genera Page Access Token desde Meta Business Suite y lo sube al panel G54
4. Distribution AI lee el token desde G54 — sin hardcode

**Patrón implementado en workflows:**
```
Webhook (con ?company=N)
→ ⚙️ Config G54 (base URL + tokens + fallback company=1)
→ 🔍 Preparar Resolución (lee query.company + extrae phone_number_id o page_id)
→ 🏢 Resolver Empresa (G54) — GET /api/n8n/wa-phones/{id} o /pages/{id} [continueOnFail]
→ 🏢 Aplicar Config Empresa (merge: query param > API response > fallback CE)
→ resto del flujo con company_id dinámico
```

**Fallback actual:** mientras G54 no implementa los endpoints de resolución, todos usan company_id=1 (CE). El query param ya funciona hoy.

### Endpoints confirmados G54 (2026-06-25)
- ✅ `GET /api/n8n/pages/{page_id}` → `{ company_id, fb_access_token, ig_user_id }` — **EXISTE y responde**. Para CE: `GET /api/n8n/pages/1713965015486703`. Nota: `ig_user_id` devuelve `null` actualmente — pendiente que Walter lo pobla en el panel admin. El IG publishing de CE funciona igual porque el Content AI usa el token directamente.
- **PENDIENTE Walter:** `GET /api/n8n/wa-phones/{phone_number_id}` → para resolver empresa por número WA
- **PENDIENTE Walter:** poblar `ig_user_id` en el registro de la página CE en panel admin G54
- **AGENT_TOKEN confirmado:** `g54_agent_produccion_2026` — usar en `G54_AGENT_TOKEN` del Config node

### Meta Tech Provider — Proceso necesario para escalar
Para que G54 maneje FB/IG de múltiples empresas con UNA sola App (en lugar de una App por cliente), se necesita verificación como Tech Provider en Meta:

**Qué resuelve el Tech Provider:**
- Clientes conectan su página a G54 via OAuth ("Conectar con Facebook") — sin crear App propia
- Un solo flujo de autorización cubre: WhatsApp (`whatsapp_business_messaging`), comentarios (`pages_read_engagement`, `instagram_manage_comments`), publicaciones (`pages_manage_posts`, `instagram_content_publish`)
- Tokens se obtienen automáticamente vía Business Login — cliente no toca ningún portal

**Qué se necesita preparar antes de iniciar:**
- Política de privacidad pública de G54
- Demo en video del flujo OAuth completo
- Descripción de caso de uso por cada permiso solicitado

**Tiempo estimado:** 1-3 semanas de revisión por parte de Meta

**Por ahora:** cada cliente crea su propia App (15 min) y usa el query param `?company=N`. Funciona para los primeros clientes mientras se tramita el Tech Provider.

### Dos formas de conectar Meta en el panel G54 — prioridad definida (2026-07-08)

El panel admin de G54 tiene (o tendrá) dos formas de guardar credenciales de FB/IG por empresa:
1. **Configuración manual** (`Conexión de Redes Sociales` → pega token de página + Page ID a mano) — la única forma activa hoy. CE tiene FB e IG configurados así (tokens activos, actualizados 2026-07-07).
2. **Conexión por canal vía OAuth** (`Conectar con Meta`, botón "CONECTAR CON META" en la config de canal FB/IG del embudo) — pensada para cuando G54 tenga la verificación de Tech Provider de Meta (ver sección anterior). Hoy aparece "Sin conectar" para todos los canales, no está en uso.

**Decisión de prioridad (si una empresa llega a tener ambas configuradas):** se busca primero en la configuración de canal por OAuth; si no está conectada, se usa como fallback la configuración manual. Ninguna de las dos es descartable — el fallback existe porque el Tech Provider tomará tiempo en aprobarse y muchos clientes van a seguir en modo manual por un buen tiempo.

**Nota de implementación:** esta prioridad todavía no está codificada en ningún workflow n8n porque el endpoint `GET /api/n8n/pages/{page_id}` de G54 hoy devuelve un solo token, sin distinguir su origen (manual vs OAuth). **Confirmado (2026-07-08):** la próxima actualización de G54 va a exponer ambas fuentes por separado en el endpoint — quedó este punto documentado de antemano para que, cuando eso pase, el nodo `🏢 Aplicar Config Empresa` de cada workflow (Community AI, Distribution AI, Sales AI Motor) implemente el merge con esta prioridad: OAuth primero, manual como fallback.

### Workflows duplicados — nota histórica
- `zAhV8gEsXD8dCrXq` "CE WhatsApp Engine - Sistema de Conversión doble" — DESACTIVADO. Era un duplicado del workflow de Alex que bloqueaba la activación del Sales AI Motor. Alex original sigue intacto.
- Alex CE (`zAhV8gEsXD8dCrXq` nombre correcto: "CE WhatsApp Engine - Sistema de Conversión") usa path `whatsapp-ce` y es independiente de la plataforma G54 genérica. NO tocar.

---

# RRSS Automation — Crating Express

## Archivos

- `workflow-rrss-n8n.json` — Workflow principal: genera posts semanales, crea diseños, envía para aprobación, publica en FB/IG
- `workflow-generador-temas.json` — Workflow auxiliar: genera temas semanales con IA y los guarda en Airtable

## Stack

| Servicio | Uso |
|---|---|
| **n8n** | Orquestador de workflows |
| **Gemini 1.5 Flash** | IA primaria RRSS (gratuita) |
| **Groq llama-3.3-70b** | IA fallback RRSS / IA primaria WhatsApp |
| **Airtable** | Base de datos (empresa, servicios, temas, contenidos, leads, planilla) |
| **Google Drive** | Almacenamiento de imágenes exportadas |
| **Gmail OAuth2** | Emails de aprobación y notificaciones |
| **Facebook Graph API** | Publicación en FB Page |
| **Instagram Graph API** | Publicación en IG (vía FB) |
| **LinkedIn API** | Desactivado (listo para activar) |

## Credenciales n8n requeridas

| Nombre en n8n | Tipo | Estado |
|---|---|---|
| `cuenta de Gmail` / `Gmail account` | Gmail OAuth2 | ✅ Configurado (ID: TESHSjzjMCpCxBBk) |
| `Cuenta de Google Drive` | Google Drive OAuth2 | ✅ Configurado (ID: 5UKwJtdnQeutQ6mg) |
| Groq (WhatsApp/Voz) | API Key | ✅ Actualizada 2026-05-05 (ID: `jORffbRhRNohHT1B`) — ver credencial en n8n |
| DeepSeek (fallback WA) | API Key | ⚠️ Sin saldo — cuenta vacía (ID: `YSdODZVNFGSB3Ih9`) |

## Variables n8n requeridas (`$vars`)

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio — IA primaria RRSS |
| `GROQ_API_KEY` | Groq — IA fallback RRSS / primaria WhatsApp |
| `AIRTABLE_TOKEN` | Token personal de Airtable |
| `FB_PAGE_ID` | `1713965015486703` |
| `FB_ACCESS_TOKEN` | Token larga duración Facebook |
| `IG_ACCOUNT_ID` | `17841402206774619` |
| `IG_ACCESS_TOKEN` | Mismo que FB_ACCESS_TOKEN |
| `EMAIL_APROBACION` | `risosadmi@gmail.com` |

## IDs Airtable

- **Base CE Central Hub:** `appUOYi54iBfaDcLn`
- **Perfil Empresa:** `tblkmBqXrpmGcTNUM`
- **Servicios:** `tbl2mwlJ149CLlMcd`
- **Temas Semanales:** `tblgrYurnqCg8uKtG`
- **Contenidos:** `tbl3ThftAg1Q36roD`
- **WhatsApp_Leads:** `tblGQXzr1zL1T57lS`
- **WhatsApp_Config:** `tblj4radGXHN7HBJi` ← nueva tabla (ver sección abajo)
- **PRODUCTOS Y SERVICIO:** tabla de catálogo de productos CE

## Flujo principal (`workflow-rrss-n8n.json`)

```
Trigger (Lunes 9am)
  → Obtener Empresa + Servicios + Tema pendiente de Airtable
  → Preparar Contexto (nodo Code)
  → Generar Post ES con Gemini  →  fallback Groq si falla
  → Parsear Post ES
  → Generar Versiones EN (FB/IG/LinkedIn) con Gemini  →  fallback Groq
  → Parsear Versiones EN
  → Crear registro en Airtable (estado: Revisión)
  → Tema → "En Proceso" en Airtable
  → Obtener PLANTILLA 1 de Drive
  → Construir URL Imagen
  → Actualizar URLs en Airtable
  → Email de Aprobación (con botones Aprobar/Rechazar)
  → Marcar email enviado
  → PAUSA — espera webhook de aprobación
  → Si Aprobado → Publicar FB + IG → Estado "Publicado" → Tema "Completado"
  → Si Rechazado → Estado "Pendiente" (para edición manual)
```

## Flujo generador de temas (`workflow-generador-temas.json`)

```
Trigger Manual o Domingo 8am
  → Obtener Empresa + Servicios + Temas existentes de Airtable
  → Preparar Contexto (calcula cuántos temas faltan para llegar a 6 pendientes)
  → Si necesita más temas:
      → Generar con Gemini  →  fallback Groq
      → Parsear temas (genera N items, uno por tema)
      → Guardar cada tema en Airtable (estado: Pendiente)
      → Email de notificación por cada tema creado
  → Si ya hay ≥6 pendientes → Email "ya hay suficientes"
```

## Canva (opcional / en pausa)

- Template ID: `DAHD9ElXhl0`
- Campos: `titulo_post`, `descripcion_post`
- OAuth2: Client ID `OC-AZ0BiE2LEhaf`
- Drive Folder: `10A-FlyJeHtO6Fi50o3uzabr9LseqIH1f`
- El workflow actual usa Drive directamente (sin Canva activo)

## Decisiones de diseño importantes

- **Gemini primario + Groq fallback**: patrón `continueOnFail: true` en Gemini → nodo IF verifica `candidates?.length > 0` → si falla, va a Groq
- **Parseo robusto**: los nodos Code de parseo soportan respuesta de Gemini (`candidates[0].content.parts[0].text`) Y de Groq/OpenAI (`choices[0].message.content`)
- **LinkedIn desactivado**: nodo `post-linkedin` tiene `"disabled": true` — se puede activar sin cambios de lógica añadiendo `LI_ACCESS_TOKEN` y `LI_COMPANY_ID` como variables

### LinkedIn App — Crating Express
- **App name:** Crating Express - La empresa de embalaje de Miami
- **Client ID:** `787d1cbkqo9gbo`
- **Client Secret:** guardado en LinkedIn Developer Portal (Autenticación → Secreto principal del cliente) — NO commitear
- **Token anterior encontrado:** formato no estándar — puede ser token viejo o de prueba — NO commitear
- **OAuth callback configurado:** `https://n8n.mdarthurdigital.com/rest/oauth2-credential/callback`
- **Duración token:** 2 meses (5184000 segundos)
- **Creada:** 30 de marzo de 2026
- **Para obtener Access Token:** LinkedIn Developer Portal → app CE → pestaña Autenticación → generar token con OAuth 2.0, o usar la credencial OAuth2 en n8n (ya tiene el callback configurado)
- **Aprobación por email**: usa `$execution.resumeUrl` de n8n + nodo Wait con webhook para flujo pausado

## n8n — Acceso

- **URL:** https://n8n.mdarthurdigital.com
- **API Token:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjg3ZGY5NzMtOTgzOC00ZjFmLWI1ZjktM2E5MzlmY2U5OTljIiwiaWF0IjoxNzc3NzQyNDMxfQ.o8WeA87-KQjr3gbWSoqMqqNpjaQN9rjYzO4Xuer-P7E

Para listar workflows: `GET /api/v1/workflows` con header `X-N8N-API-KEY: <token>`

**Nota importante:** Usar siempre `X-N8N-API-KEY` como header (NO `Authorization: Bearer`). Si el PUT retorna 401 con GET funcionando, es porque el token anterior fue invalidado — generar uno nuevo en Settings → API.

## WhatsApp — Crating Express (Marco)

> **Nombre del bot:** Marco (renombrado de Alex en 2026-06-19). VAPI también usa MARCO.

- **Número:** +1 786-788-0417 (Twilio, registrado en Meta WhatsApp Cloud API)
- **Phone Number ID:** `1083260611538246`
- **WABA ID:** `1449711680212677`
- **Display Name:** Crating Express (aprobado)
- **Workflow principal:** `CE WhatsApp Engine — Marco` (ID: `zAhV8gEsXD8dCrXq`)
- **Webhook path:** `/whatsapp-ce`
- **Cotizador app:** https://cratingcotiza.mdarthurdigital.com/cotizar-caja
- **Cotizador API:** `POST https://cratingcotiza.mdarthurdigital.com/api/cotizar` — integrada ✅
- **Airtable tabla leads:** `WhatsApp_Leads` en base `appUOYi54iBfaDcLn`

### Arquitectura de sub-workflows (versión estable 2026-06-19)

| ID | Nombre | Función |
|---|---|---|
| `zAhV8gEsXD8dCrXq` | CE WhatsApp Engine — Marco | Orquestador principal |
| `1PXcg3dOQBt8hrrT` | Alex CE — 01 Clasificador | State machine: calcProximoPaso, sistemaIA, usuarioIA |
| (02) | Alex CE — 02 Contexto y Lead | Carga perfil empresa, WA config, productos, lead existente |
| `J8qbKOF7t4GnhRDT` | Alex CE — 03 Generador IA | Llama a Groq, parsea JSON, merge datosRecolectados, clasificación |
| (04 reemplazado) | ~~04 Cotizador~~ | **ELIMINADO** — reemplazado por nodos nativos en workflow principal |
| `PqbfMghL0E7xKflC` | Alex CE — 05 Guardar Lead | POST/PATCH Airtable con todos los campos |

**Nodos que reemplazaron a 04 Cotizador (en workflow principal):**
- `💰 API Cotizador` — HTTP Request nativo, `onError: continueErrorOutput`
- `📝 Armar Mensaje Final` — Code node: construye el mensaje con precio o pasa el mensaje de IA si no es momento de cotizar

**IMPORTANTE:** Los nodos `🔀 ¿Lead Caliente?` y `📧 Notificar Vendedor` leen de `$('📝 Armar Mensaje Final')`, NO de `$('▶️ 04 Cotizador')` (que ya no existe).

**Nota (confirmado 2026-07-09):** en n8n siguen existiendo dos workflows viejos que NO forman parte de la arquitectura actual y no hay que confundir con lo de arriba:
- `vQUztiEMB8dXfNwo` "Marco CE — 00 Orquestador" — **INACTIVO**. Es el predecesor directo de `zAhV8gEsXD8dCrXq` (mismo webhook `whatsapp-ce`, mismos nodos base) pero sin el layer de traducción EN↔ES, la respuesta manual (`marco-manual-ce`) ni el cotizador nativo — todo eso se agregó después en la versión actual. Quedó desactivado y sin usar, seguro de borrar si se confirma que no hace falta como referencia.
- `jDEYno22WuE0QVwJ` "Marco CE — 04 Cotizador" — sigue **activo en n8n pero sin ninguna ejecución nunca**, confirma que efectivamente nadie lo llama (el `▶️ 04 Cotizador` mencionado arriba es de este ID). Candidato a desactivar/borrar junto con el de arriba.

### Flujo actual del bot
```
Webhook → Extraer Mensaje → ⏱️ Esperar anti-race
  → ▶️ 02 Contexto y Lead → ▶️ 01 Clasificador → ▶️ 03 Generador IA
  → 💰 API Cotizador (si todosRecolectados=true)
  → 📝 Armar Mensaje Final (agrega precio al mensaje o lo pasa tal cual)
  → 📤 Enviar Mensaje WhatsApp
  → ▶️ 05 Guardar Lead
  → 🔀 ¿Lead Caliente? (lee clasificacion de 📝 Armar Mensaje Final)
      ✅ Sí → 📧 Notificar Vendedor
```

### State machine — calcProximoPaso (01 Clasificador) ⚠️ SAGRADO — NO CAMBIAR EL ORDEN
```
POST_COTIZACION       → si cotizacion_enviada=true en Notas
PRIMER_CONTACTO       → lead nuevo sin nombre
PEDIR_NOMBRE          → lead existente sin nombre
IDENTIFICAR_NECESIDAD → sin tipo_flujo
FLUJO_CONSULTA        → tipo_flujo='consulta'
PEDIR_PRODUCTO        → sin producto
PEDIR_MEDIDAS         → sin medidas
PEDIR_CORREO          → sin correo_contacto   ← correo SIEMPRE después de medidas
PEDIR_TIPO_CAJON      → sin tipo_cajon
PEDIR_PROTECCION      → proteccion_extra=null
PEDIR_FECHA           → sin fecha
LISTO_PARA_COTIZAR    → todos los datos presentes
```

### Datos recolectados (en Notas JSON de Airtable)
```json
{
  "tipo_cajon": "cajones_cerrados",
  "proteccion_extra": false,
  "correo_contacto": "cliente@email.com",
  "nombre_cliente": "Nombre",
  "fecha": "el viernes",
  "tipo_flujo": "cotizacion",
  "cotizacion_enviada": true
}
```
`cotizacion_enviada: true` se setea en 05 Guardar Lead cuando el cotizador corrió exitosamente. Es la bandera que activa POST_COTIZACION en la siguiente vuelta.

### Clasificación de leads (03 Parsear)
- `clasificacion = 'Caliente'` **SOLO** cuando cliente acepta cotización formal en POST_COTIZACION (regex sobre texto del cliente)
- `nuevoEstado = 'Vendedor notificado'` → dispara email
- `nuevoEstado = 'Calificado'` → cuando todosRecolectados pero aún no aceptó
- `nuevoEstado = 'En calificación'` → en proceso

### Correo al vendedor
- Lee emails de `WA_Email_Vendedor` en PERFIL DE EMPRESA (`tblkmBqXrpmGcTNUM`), separados por `\n`
- Fallback: `risosadmi@gmail.com`
- Formato HTML con tabla estructurada (header rojo, datos del lead)
- Se envía cuando `clasificacion = 'Caliente'` vía nodo `📧 Notificar Vendedor` en workflow principal

### Comportamiento de Marco (IA)
- **Nombre:** Marco (NO Alex — todo en n8n, VAPI y Airtable dice Marco)
- **Idioma:** detecta ES/EN del historial + mensaje actual, responde en el mismo
- **Tono:** directo, coloquial, Miami — NUNCA "Genial", "Excelente elección", "Un placer"
- **Confirmaciones:** varía entre "Listo.", "Anotado.", "Ok.", "Entendido.", "Perfecto." — nunca repite la misma dos veces seguidas
- **Saludo con hora Miami (UTC-4):** buenos días 6-11, buenas tardes 12-18, buenas noches 19-5
- **Primer mensaje:** SIEMPRE se presenta — "Buenos días, soy Marco de Crating Express."
- **Preguntas off-script:** responde en 1 oración y continúa con el dato pendiente
- **NUNCA pregunta:** recogida, entrega, dirección, método de envío, logística
- **Fecha:** si el cliente la menciona en el primer mensaje, el fallback regex en 03 Parsear la extrae aunque el AI no la ponga en el JSON
- **Cotizador:** llama a `POST /api/cotizar` cuando todos los datos están listos; el precio aparece DENTRO del chat de WA con disclaimer de estimado
- **Post-cotización:** pregunta si quiere cotización formal por correo → si acepta → confirma y cierra; si se despide → "¡Hasta luego! 👋"
- Medidas SIEMPRE en pulgadas — NUNCA centímetros

### Cotizador API
- **Endpoint:** `POST https://cratingcotiza.mdarthurdigital.com/api/cotizar`
- **Body:** `{ "tipo_caja": "cajones_cerrados", "cant": 1, "largo": 30, "ancho": 20, "alto": 25 }`
- **Response:** `{ "success": true, "data": { "precio_total": 142 } }`
- **Valores válidos tipo_caja:** `cajones_cerrados`, `jaulas`, `palets_medida`, `cunas`, `plataformas_contenedor`, `embalaje_ferias`, `mayor`
- Medidas en pulgadas tal como el cliente las da

### WhatsApp_Leads — Campos actuales
| Campo | Tipo | Descripción |
|---|---|---|
| `Nombre_Contacto` | Text | Nombre del cliente |
| `Articulo` | Text | Producto de interés |
| `Medidas y Peso` | Text | Medidas en pulgadas |
| `Notas` | Text | JSON con todos los datos recolectados + cotizacion_enviada |
| `Historial_Mensajes` | Text | Conversación completa |
| `Estado` | Select | Nuevo / En calificación / Calificado / Vendedor notificado / Cerrado |
| `Origen` | Select | IA de ventas |
| `Descripcion_Lead` | Multiline | Resumen para el vendedor |
| `Clasificacion` | Select | Frío / Tibio / Caliente |
| `Tipo_Interaccion` | Select | Cotización / Consulta / Mixta |
| `Ultima_Actividad` | DateTime | Timestamp último mensaje |

### Límites de APIs
- Groq llama-3.3-70b-versatile: límite diario — se resetea a medianoche Miami
- DeepSeek: ⚠️ sin saldo — fallback no disponible

## VAPI — Marco Voz

- **API Key:** `bb9c6bf5-a4ca-4707-8476-310ad6cab539` (token actualizado 2026-06-19)
- **Assistant ID:** `69fedf52-005f-4cde-a87d-5b421e7911b9`
- **Nombre:** MARCO
- **Modelo:** llama-3.3-70b-versatile (en Groq)
- **Voz ID:** `onwK4e9ZLuTAKqWW03F9` (ElevenLabs)
- **Primer mensaje:** "Gracias por llamar a Crating Express, soy Marco. ¿Con quién tengo el gusto?"
- **Comportamiento:** empieza en español, cambia a inglés si el cliente habla inglés; NO recopila datos por voz — redirige a WhatsApp para cotizaciones
- **Workflow n8n:** `📞 CE Voice Agent — Vapi Webhook` (ID: `FYKfTJBfgwsMpJV7`) — guarda en WhatsApp_Leads
- **Resumen diario:** `📞 CE Voice Agent — Resumen Diario de Llamadas` (ID: `FTa48iKiRIMW5BNB`)
- **Número:** +1 786-788-0417 (Twilio) — solo llamadas telefónicas reales, NO llamadas de WhatsApp (peer-to-peer cifradas, sin API)

## Otros workflows activos

| Workflow | ID | Trigger | Estado |
|---|---|---|---|
| CE Mantenimiento Web - Calendario Automático | `T9J845yE4sd8Dde5` | Diario 13:00 | ✅ |
| 📬 CE Gmail Monitor — Detectar Respuestas de Leads | `cJZV7jcwlbFoW5qJ` | Cada hora | ✅ |
| 🎙️ Marco CE — 06 Procesador de Medios | `5GU89AeWsBZ86FWa` | Sub-workflow (executeWorkflowTrigger) | ✅ existe, sin ejecuciones — **no está conectado todavía desde el engine principal** |
| 🌐 Analytics Semanal — Webhook Trigger | `ALchVw1UdgFHuDbm` | Webhook `analytics-semanal-g54` | ✅ existe, sin ejecuciones — wrapper que llama a `📊 Analytics AI Semanal — G54` |
| 📤 WA Reply — Envío Manual desde G54 | `IzsQTrOI2SMUJ4xx` | Webhook `wa-reply-g54` | ✅ existe, sin ejecuciones — permite mandar una respuesta manual de WhatsApp desde el panel (bypass del bot) |

**Encontrados en diagnóstico del 2026-07-09** (no documentados hasta ahora, backup agregado a `PROYECTO-SOL/2026/`):
- **06 Procesador de Medios** — recibe audio/imagen/PDF/Office, transcribe con Groq Whisper, analiza imágenes con Gemini Vision, lee PDFs y convierte Office a texto vía ConvertAPI. Diseñado para que Marco pueda procesar archivos adjuntos por WhatsApp, pero el engine principal (`zAhV8gEsXD8dCrXq`) todavía no tiene el nodo que lo llame — construido pero no conectado.
- **Analytics Semanal — Webhook Trigger** — solo reenvía la llamada al workflow real de Analytics Semanal. Puede ser el punto de entrada pensado para que G54 dispare el reporte semanal por botón, aunque hasta ahora el semanal se ha estado ejecutando directo, no a través de este wrapper.
- **WA Reply — Envío Manual** — pieza de soporte para cuando un humano necesita responder manualmente desde el panel en lugar del bot; conecta con la lógica `¿Bot puede responder?` del engine principal.

## n8n Tags — Marco

Tag `Alex` (ID: `2CrVJWitAB77MgTJ`) — nombre del tag sin cambiar en n8n, pero el bot se llama Marco.

| Workflow | ID |
|---|---|
| CE WhatsApp Engine — Marco | `zAhV8gEsXD8dCrXq` |
| 📞 CE Voice Agent — Vapi Webhook | `FYKfTJBfgwsMpJV7` |
| 📞 CE Voice Agent — Resumen Diario de Llamadas | `FTa48iKiRIMW5BNB` |
| 📞→💬 VAPI → WhatsApp Handoff | `jfoJDSidx1sJlOrr` |

### Pendiente / próximas mejoras
- [x] ~~Integrar API del cotizador~~ ✅
- [x] ~~Precio estimado en WhatsApp~~ ✅
- [x] ~~Correo al vendedor cuando cliente acepta~~ ✅
- [x] ~~Cierre de conversación (¡Hasta luego!)~~ ✅
- [ ] Activar LinkedIn en workflow RRSS cuando se tenga token
- [ ] Recargar saldo DeepSeek o reemplazar fallback
- [ ] Probar VAPI → WhatsApp Handoff con llamada real
- [ ] **Sugerencia futura — Módulo de audio:** Evaluar Text-to-Speech para convertir posts/artículos en audio (estilo podcast) similar a OpenClaw Voice AI. Complementaría el Módulo 1 RRSS sin reemplazar nada del stack actual. Integración posible: ElevenLabs (ya tenemos cuenta por VAPI) → generar MP3 desde el post aprobado → subir a Drive → opcional: publicar como Reel/Story con audio.

## Planilla Nicaragua

Sistema de nómina quincenal para empresa en Managua, Nicaragua.
- **Frecuencia:** Quincenal — día 15 y último día del mes
- **Empleados:** 8 activos (tabla dinámica)
- **IR:** C$0 (todos por debajo del umbral)
- **INSS empleado:** 7% — base de cálculo configurable por empleado (ver INSS_Base)
- **Adelantos:** límite C$2,000 — se descuenta en la quincena indicada
- **Préstamos:** autorizados por Don Marc — cuota quincenal acordada caso por caso
- **Pagos:** siempre en efectivo
- **Frontend:** ✅ Desplegado en Netlify — `planilla-nicaragua.netlify.app`
- **Pendiente:** definición de "aportaciones" y destino del marcador de huella

### Airtable — Base Planilla Nicaragua
- **Base ID:** `appApxnaZKJKDUBR6`
- **Workspace:** `wsphYNKZSHpRek4EJ` (mismo que CE Central Hub)
- **Token:** guardado en `planilla-backend/.env` (excluido de git via .gitignore) — empieza con `pat8DWgbBJQsCZOY2`

| Tabla | ID |
|---|---|
| Empleados | `tblwEpef3eoKtSmQe` |
| Préstamos | `tbln3xy9hbjtzRGPa` |
| Adelantos | `tblEz4M50EUw7vT0U` |
| Extras | `tblb8OlnW60ItErxe` |
| Planillas | `tblZj3F2T5aoSKGEV` |
| Detalle Planilla | `tblxmAaz0k0Bv6r1y` |
| Deducciones | `tblf4FpWvxQdepOgb` |

**Campos adicionales creados via API (2026-05-08):**
| Tabla | Campo | Tipo | Field ID |
|---|---|---|---|
| Préstamos | `Historial_Pagos` | multilineText | `fld6feyYH26jWLr6v` |
| Adelantos | `Pausado` | checkbox | `fldCVvnPwZTWfiJ6H` |
| Deducciones | `Pausado` | checkbox | `fldapUW2ibbXMy30L` |

### Campo INSS_Base por empleado
- **Campo Airtable:** `INSS_Base` (ID: `fldTCQ7uo35Enx7Vl`) — singleSelect
- **Valores:** `Salario Completo` (default) | `Salario Mínimo`
- **Lógica en motor de cálculo:**
  - Si `Tipo_Planilla = Sin Seguro` → INSS = 0
  - Si `INSS_Base = Salario Mínimo` → INSS = (7000/2) × 7% = C$245 fijos
  - Si `INSS_Base = Salario Completo` → INSS = (salario_bruto/2) × 7%
- **Salario mínimo:** `C$10,913.54` mensual (confirmado 2026-05-08)
- **Empleados cargados:**
  - Sol (Solange Torrez): Salario Mínimo, C$12,000 bruto
  - María García: Salario Completo (prueba)
  - Ana Martínez: Salario Mínimo (prueba)
  - Roberto / Carlos: Sin Seguro (campo en blanco)

### Motor de cálculo — Netlify Function (reemplaza n8n)
- **Archivo:** `planilla-web/netlify/functions/calcular.js`
- **Endpoint:** `POST /.netlify/functions/calcular`
- **Body:** `{ periodo: "YYYY-MM-DD", tipo: "Con Seguro" | "Sin Seguro" | undefined }`
- **Lógica completa en código:** salario quincenal = bruto/2, INSS según Tipo_Planilla + INSS_Base, IR fijo por empleado, deduce préstamos (activos) + adelantos (Pendiente + NO Pausado) + deducciones (Pendiente + NO Pausado), suma extras del período
- **Al generar planilla:** crea registro en Planillas + registros en Detalle, marca adelantos como Descontado, marca deducciones como Descontado, decrementa cuotas restantes en préstamos, agrega entrada en Historial_Pagos del préstamo
- **n8n workflow anterior:** `jkFucDKb7JSe32ze` — **ELIMINADO** (2026-05-09), el cálculo está 100% en código

### Netlify — Planilla Web App
- **URL:** https://planilla-nicaragua.netlify.app
- **Repo:** `risosdigitales/PROYECTO_SOL` → carpeta `planilla-web/`
- **Build:** Base dir: `planilla-web`, Publish: `.`, Functions: `netlify/functions`
- **Auth:** Netlify Identity (invite-only, confirmación por email activa)
- **Auto-deploy:** ⛔ DESACTIVADO — acumular commits y deployar manualmente vía CLI para no gastar minutos (plan gratuito: 300/mes)
- **Deploy CLI:** `NETLIFY_AUTH_TOKEN=nfp_5M7C84VijySQ7PTEeWADhMCTCTANhGcx0ae3 netlify deploy --dir=planilla-web --functions=planilla-web/netlify/functions --site=b1f602d3-324e-41c0-a034-1da91cadb946` (sin --prod para draft, con --prod para producción — producción puede requerir publicar desde dashboard)
- **Estado:** ✅ App desplegada y actualizada
- **Env var `N8N_PLANILLA_WEBHOOK`:** ya no es necesaria — cálculo en código local

### Páginas de la web app (planilla-web/)
| Página | Función |
|---|---|
| `index.html` | Dashboard |
| `empleados.html` | CRUD empleados — con modal de confirmación antes de editar |
| `planillas.html` | Historial + botón **Generar planilla** (llama calcular.js) |
| `planilla-detalle.html` | Detalle de empleados de una quincena |
| `prestamos.html` | CRUD préstamos + historial de pagos por préstamo + registro pago directo |
| `adelantos.html` | CRUD adelantos + Pausar/Reactivar + fecha de registro + filtro empleado |
| `extras.html` | CRUD bonos/feriados/turnos extra + filtro tipo y empleado |
| `deducciones.html` | CRUD deducciones manuales + Pausar/Reactivar + fecha de registro |
| `recibo.html` | Recibo de pago imprimible por empleado/quincena |

### Netlify Functions (planilla-web/netlify/functions/)
| Función | Métodos | Descripción |
|---|---|---|
| `empleados.js` | GET/POST/PATCH | CRUD empleados |
| `prestamos.js` | GET/POST/PATCH | CRUD préstamos (incluye Historial_Pagos) |
| `adelantos.js` | GET/POST/PATCH | CRUD adelantos (GET devuelve todos, filtro por empleado opcional) |
| `extras.js` | GET/POST/PATCH/DELETE | CRUD extras/bonos |
| `deducciones.js` | GET/POST/PATCH/DELETE | CRUD deducciones manuales |
| `planillas.js` | GET | Lista planillas con conteo de empleados |
| `detalle.js` | GET | Detalle por planilla/período |
| `calcular.js` | POST | Motor de cálculo completo de planilla |
| `recibo.js` | GET | Datos del recibo por empleado+período |

### Bug conocido — n8n webhook registration
Webhooks creados/modificados vía API no se registran en memoria hasta que n8n reinicia.
El toggle desde la UI actualiza la DB pero NO la memoria del servidor.
**Fix:** `sudo systemctl restart n8n` (pedir a quien tiene acceso al servidor).
Afecta también: `📞→💬 VAPI → WhatsApp Handoff` (ID: `jfoJDSidx1sJlOrr`).

### Backend local — Planilla Nicaragua (2026-05-08)
API REST local en Windows para gestión de planilla, conecta con MariaDB local y expone endpoints para el frontend Netlify.

- **Ruta:** `C:\Users\Orison3\Desktop\planilla-backend`
- **Stack:** Node.js 24 (via NVM) + Express + mysql2 + cors + dotenv
- **DB:** MariaDB 11.4.10 en Windows (HeidiSQL como cliente)
- **Estado:** ⚙️ En construcción — npm install en proceso (2026-05-08)
- **Nota NVM:** Usar `nvm use 24` antes de correr npm en esa máquina — había conflicto con v20.16.0 vieja

**Schema DB — 10 tablas:**
`empleados`, `planillas`, `detalle_planilla`, `prestamos`, `pagos_prestamo`, `adelantos`, `extras`, `vacaciones`, `historial_cambios`, `recibos`

**Detalles clave:**
- Préstamos: pueden ser varios activos por empleado simultáneamente
- Vacaciones: sección propia, marcar si son pagadas o días libres
- Recibo PDF por quincena por empleado con todo el detalle
- Pagos préstamo: incluye abonos extras en efectivo + fechas + concepto

### Sistema de roles — Planilla Nicaragua (2026-05-10)
Implementado con dos capas separadas:

- **Autenticación (login):** Netlify Identity — invite-only, confirmación por email
- **Roles (permisos):** Airtable tabla `empleados` → campos `Email` (flde0AWKl2BbqCwDO) y `Rol` (fldghugx86Ny89ouH)

| Rol | Acceso |
|---|---|
| `Admin` | Todo — crear/editar empleados, salarios, roles |
| `Planillero` | Todo excepto: no puede crear empleados, campos salario/INSS/IR/Email/Rol bloqueados |
| `Empleado` | Solo `/mi-recibo.html` — ve sus propias quincenas |
| Sin registro en Airtable | Se trata como Admin (compatibilidad hacia atrás) |

**Flujo de creación de usuario:**
1. Netlify dashboard → Identity → Invite users → email del empleado
2. En la app → Empleados → editar el registro → llenar Email (mismo que en Netlify) y Rol
3. El sistema cruza el JWT de Netlify con Airtable vía `/.netlify/functions/me`

**Archivos clave:**
- `planilla-web/netlify/functions/me.js` — devuelve `{ email, rol, nombre, id }` desde Airtable
- `planilla-web/assets/js/auth.js` — `requireAuthRole()`, `getMyInfo()`, `isAdmin()`, `canEdit()`
- `planilla-web/mi-recibo.html` — vista de empleado (solo sus recibos)

### Migración de auth al salir de Netlify
Cuando se migre a servidor propio (Node.js + Express + MariaDB), el login de Netlify Identity se reemplaza pero **la lógica de roles no cambia**.

**Plan de migración:**

1. Agregar tabla `usuarios` en MariaDB:
   ```sql
   CREATE TABLE usuarios (
     id INT AUTO_INCREMENT PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     rol ENUM('Admin','Planillero','Empleado') DEFAULT 'Empleado',
     empleado_id INT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. Agregar endpoints al backend Express:
   - `POST /auth/login` → verifica email+password, emite JWT propio (librería `jsonwebtoken`)
   - `GET /auth/me` → verifica JWT, devuelve `{ email, rol, nombre, id }` — mismo formato que `me.js` actual

3. Reemplazar en `auth.js` del frontend:
   - `netlifyIdentity.currentUser()` → leer JWT de `localStorage`
   - `user.jwt()` → devolver el JWT guardado
   - `requireAuth()` / `requireAuthRole()` → verificar JWT local en vez de Netlify
   - El resto de la lógica (roles, redirecciones, `isAdmin()`, `canEdit()`) queda **igual**

4. Contraseñas: usar `bcrypt` en Express para hashear. Al migrar, generar contraseñas temporales y forzar cambio en primer login.

**Lo que NO cambia al migrar:** todas las páginas HTML, la lógica de roles, `mi-recibo.html`, las restricciones de Planillero en `empleados.html` — solo cambia quién firma el JWT.

### Siguiente paso Planilla
1. ~~Meter empleados reales en Airtable~~ ⏳ Sol cargada como prueba, faltan 7 reales
2. ~~Construir motor de cálculo en n8n~~ ✅ Reemplazado por calcular.js (sin n8n)
3. ~~Construir web app en Netlify~~ ✅ Desplegada
4. ~~Bloque 1~~ ✅ Completado: extras.html, generar planilla UI, confirmación editar empleado
5. ~~Bloque 2~~ ✅ Completado: historial pagos préstamos, pausar adelantos/deducciones, fechas registro
6. ~~Bloque 3~~ ✅ Completado: dashboard con 5 stats + montos C$, feriados Nicaragua, selector feriados en extras, recibo corregido
7. ~~Deploy Netlify~~ ✅ Vía CLI (sin consumir minutos de build) — token: `nfp_5M7C84VijySQ7PTEeWADhMCTCTANhGcx0ae3`
8. ~~Sistema de roles~~ ✅ Completado: Admin/Planillero/Empleado, me.js, mi-recibo.html
9. **PENDIENTE:** Ingresar empleados reales, eliminar registros de prueba (María García, Carlos López, Ana Martínez, Roberto Sánchez)
10. **PENDIENTE:** Invitar usuarios reales a Netlify Identity + asignar roles en Empleados
11. **PENDIENTE:** Confirmar aportaciones + marcador de huella con quien corresponda
12. **BLOQUEADO:** Reinicio de n8n → activa VAPI handoff (no afecta planilla, cálculo ya es independiente)
13. **EN PAUSA:** Backend local Node.js/Express + MariaDB — esperar acceso al servidor propio

## Modelo de reporte diario

El reporte se escribe en primera persona, en tono conversacional, siguiendo el orden cronológico del día. Incluye contexto humano (reuniones, personas involucradas, interrupciones), no solo lo técnico. Se menciona qué salió mal y cómo se resolvió. Termina con dónde se paró y por qué. Sin bullets ni headers internos — todo en párrafos corridos.

**Ejemplo real (2026-05-05):**

El dia de hoy comencé revisando que agentes corrían hoy y que resultado había de pormedio, siendo el que comparte el blog en todas las redes y correo, este dió error en cuanto a compartir por linkedin por un error en una letra de credencial, luego de corregir y probar quedó arreglado, luego inicié con ALEX, Lo primero fue sacar el prompt de Alex del nodo de n8n y moverlo a Airtable, para que se pueda editar el comportamiento del bot desde fuera sin tocar el workflow. Para esto creé una tabla nueva llamada WhatsApp_Config donde vive el system prompt completo con marcadores {{CATALOGO}} e {{INSTRUCCIONES}} que se reemplazan en tiempo real al llegar cada mensaje. estuve probando APIS diferentes para el fallback hata tener respuesta positiva y quedarme con deepseek, luego tuve un espacio de tiempo en el que don Walter me ayudó a instalar la base para la computadora y pantalla, al momento ya quedó yo le estaré informando sobre como me acostumbro a ella, luego de eso tuvimos una reunión algo larga donde nos inforamamos sobre los avances, coincidencias y limites de mis agentes en coordinanción con los de él, me mostró varios agentes, me hizo algunas indicaciones a corregir y quedó en consultar el resto y avisarme sobre como proseguir, luego de eso me dió la API del cotizador interno para ALEX WHATSAPP, integré la API del cotizador directamente en el flujo de WhatsApp. Ahora cuando Alex tiene todos los datos (producto, medidas, tipo de caja) hace una llamada automática a POST /api/cotizar y le devuelve al cliente el precio estimado en el mismo mensaje, con un disclaimer que aclara que es un estimado y que el precio final puede variar. que en caso de requerir una cotización formal y precio oficial se le contactará por gmail, siendo el punto de conexión con el vendedor. También se actualizó la tabla de leads de WhatsApp para guardar más información por conversación: origen del lead, descripción para el vendedor, nombre del contacto y timestamp de última actividad. Los correos de notificación al vendedor ahora se leen directamente desde el campo de Perfil de Empresa, y soporta múltiples correos separados por salto de línea esta era una de las correcciones de don walter, En cuanto a la Planilla Nicaragua: se agregó un campo INSS_Base por empleado que permite calcular el INSS sobre salario mínimo o sobre salario completo según corresponda a cada persona. El motor de cálculo en n8n ya tiene esta lógica incorporada, por el momento estoy haciendo las pruebas con datos hipotéticos, es decir empleados ficticios, La web app de la planilla quedó desplegada en Netlify en planilla-nicaragua.netlify.app con autenticación por invitación activa, hasta ahí mi avance por ya la hora.

---

## Error conocido

`API Error: 400 messages: text content blocks must be non-empty` — ocurre en la interfaz web de Claude Code (no en n8n) cuando el historial de conversación tiene bloques de texto vacíos tras llamadas a herramientas. Es un bug de la plataforma. Si ocurre: iniciar nueva sesión; este archivo CLAUDE.md proporciona todo el contexto necesario automáticamente.

## Historial de cambios relevantes

1. OpenAI → Gemini 1.5 Flash (gratuito) como IA principal RRSS
2. Gemini + Grok (xAI) como fallback → reemplazado por Gemini + **Groq** (más estable)
3. Gmail: migrado de `emailSend` a `gmail` OAuth2
4. Airtable: variables `$vars.AIRTABLE_TOKEN` en lugar de token hardcodeado
5. Canva: OAuth2 Generic configurado pero flujo actual usa Drive directamente
6. Gemini fallback WhatsApp → reemplazado por **DeepSeek deepseek-chat** (mismo formato OpenAI, sin adaptador)
7. Groq model: llama-3.3-70b → **llama-3.1-8b-instant** (500k TPD gratuito)
8. Tag `Alex` creado en n8n y aplicado a los 4 workflows del agente
9. Base Airtable `Planilla Nicaragua` creada con 6 tablas — motor de cálculo listo, pendiente reinicio n8n
10. **Prompt de Alex externalizado** a Airtable `WhatsApp_Config` — editable sin tocar n8n; usa placeholders `{{CATALOGO}}` e `{{INSTRUCCIONES}}`
11. **Nueva tabla `WhatsApp_Config`** (`tblj4radGXHN7HBJi`) — centraliza configuración del bot WA
12. **WhatsApp_Leads**: nuevos campos Origen, Descripcion_Lead, Nombre_Contacto, Ultima_Actividad
13. **Cotizador API integrada** en flujo WhatsApp — `POST /api/cotizar` devuelve precio estimado con disclaimer
14. **INSS_Base** por empleado en Planilla Nicaragua — algunos calculan sobre salario mínimo, otros sobre salario completo
15. **Planilla web app desplegada** en Netlify (`planilla-nicaragua.netlify.app`) con Netlify Identity invite-only
16. **Bug corregido:** conexiones "Gemini: Fallback IA" → renombradas a "DeepSeek: Fallback IA" en workflow WA (causaba que Alex no respondiera)
17. **Bug corregido:** `promptSistema` se calculaba antes de `catalogoProductos` → ReferenceError; movido al lugar correcto en Code node
18. **Bug corregido (echo):** lead recN4rjYTSXsM3VeF tenía datos de prueba viejos que confundían a la IA; reseteado
19. **Groq API key actualizada** (2026-05-05) — credential `jORffbRhRNohHT1B` con nueva key
20. **Emails de notificación**: leen de `WA_Email_Vendedor` en PERFIL DE EMPRESA, soportan múltiples emails separados por `\n`
21. **Bug corregido (LinkedIn RRSS):** (2026-05-06) credencial de LinkedIn tenía un error de tipeo — corregida y publicación probada exitosamente
22. **Salario mínimo actualizado** (2026-05-08): C$10,913.54 mensual (confirmado)
23. **Backend planilla iniciado** (2026-05-08): Node.js/Express + MariaDB local en `C:\Users\Orison3\Desktop\planilla-backend`, schema 10 tablas diseñado
24. **NVM conflicto resuelto** (2026-05-08): máquina tiene NVM for Windows con v20.16.0 vieja — usar `nvm use 24` antes de correr npm
25. **Nuevos workflows identificados**: CE Mantenimiento Web (diario 13:00) y CE Gmail Monitor (horario) — ambos activos y en success
26. **Motor de cálculo planilla migrado a código** (2026-05-08): `calcular.js` reemplaza el workflow de n8n completamente — sin dependencia de n8n para generar planillas
27. **Bloque 1 completado** (2026-05-08): `extras.html` + `extras.js`, botón Generar Planilla en `planillas.html`, modal confirmación editar en `empleados.html`, nav actualizado en todas las páginas
28. **Bloque 2 completado** (2026-05-08): historial de pagos por préstamo en `Historial_Pagos` (campo multilineText), pagos directos registrables desde UI, Pausar/Reactivar en adelantos y deducciones vía campo `Pausado` (checkbox), fechas de creación en adelantos/deducciones
29. **Campos Airtable creados via API**: `Historial_Pagos` en Préstamos, `Pausado` en Adelantos y Deducciones
30. **`.gitignore` creado**: excluye `planilla-backend/.env` y archivos `.env` con credenciales
31. **Token Airtable guardado** en `planilla-backend/.env` (local, no en git) y documentado en CLAUDE.md
32. **Branch activo:** `claude/review-session-context-ohQ2R` — todos los cambios de Bloque 1 + 2 están commiteados y pusheados, pendiente deploy manual en Netlify
33. **Bloque 3 completado** (2026-05-09): `assets/js/feriados.js` (módulo feriados Nicaragua, algoritmo Pascua), dashboard renovado con 5 tarjetas de stats + montos C$, panel próximos feriados con caja calendario y cuenta regresiva, selector de feriados en extras.html al elegir "Feriado trabajado"
34. **Workflow n8n planilla eliminado** (2026-05-09): `jkFucDKb7JSe32ze` borrado vía API — ya no existe en n8n
35. **Bug fix recibo** (2026-05-09): `recibo.js` — campos adelantos (`{Quincena_Descuento}` → `{Descontar en quincena}`), extras (`{Período}` → `{Pagar en quincena}`), deducciones manuales añadidas; `recibo.html` — salario (`Salario bruto mensual`), tipos extras (`Feriado trabajado`, `Otro`), totalDesc incluye IR + deducciones
36. **Cunas/amarras añadidas** (2026-05-09): catálogo de All Estimados en Segundos actualizado con variación de precios para cunas/amarras
37. **Sistema de roles implementado** (2026-05-10): `me.js` + `auth.js` actualizado + `mi-recibo.html` creada — Admin/Planillero/Empleado con restricciones por página; campos Email y Rol en tabla Empleados de Airtable
38. **Deploy via CLI documentado** (2026-05-10): `NETLIFY_AUTH_TOKEN=... netlify deploy --dir=planilla-web --functions=planilla-web/netlify/functions --site=b1f602d3-...` — no consume minutos de build
39. **Deducciones renombrada** (2026-05-10): "Otras Deducciones" en nav y página para distinguirla de préstamos y adelantos
40. **Plan de migración de auth documentado** (2026-05-10): cuando se salga de Netlify, reemplazar Netlify Identity con JWT propio en Express + tabla `usuarios` en MariaDB — lógica de roles no cambia
41. **Vacaciones pagadas implementadas** (2026-05-10): `vacaciones.html` — tasa corregida a 2.5 días/mes (Art. 76), columna "Valor saldo (neto)" con cálculo bruto − INSS 7%, preview de pago en modal para tipo Pagadas, campo `Monto` guardado al registrar; `recibo.js` — incluye vacaciones pagadas filtradas por rango de quincena; `recibo.html` — muestra vacaciones pagadas en sección Extras
42. **Repo renombrado** (2026-05-10): GitHub repo `rrss-automatizaci-n` → `PROYECTO_SOL` por indicación de Don Walter; GitHub redirige automáticamente URLs antiguas
43. **Documento CE reorganizado** (2026-05-11): documento de referencia de Crating Express reorganizado en 8 secciones limpias (perfil, catálogo, interiores, ISPM-15, logística, cotización, pagos, FAQs) — datos bancarios removidos por seguridad, duplicados eliminados; guardado como nuevo Google Doc para revisión
44. **Bug fix Alex "Hola de nuevo"** (2026-05-11): `Instrucciones_IA` en Airtable `WhatsApp_Config` reemplazado — contenido RRSS removido, sustituido por reglas de comportamiento del bot WA: manejo de cliente nuevo vs conocido, prioridad del MENSAJE ACTUAL, prohibición de repetir/parafrasear el mensaje del cliente
45. **Reestructuración completa prompts Alex** (2026-05-11): `Prompt_Sistema` e `Instrucciones_IA` reescritos desde cero — eliminada regla contradictoria de "Hola de nuevo" en Prompt_Sistema que conflictuaba con Instrucciones_IA; corregido MAPEO TIPO_CAJA_API (valores incorrectos: `cajon_cerrado`, `jaula_abierta`, `plataforma`, etc. → correctos: `cajones_cerrados`, `jaulas`, `plataformas_contenedor`, etc.); estructura limpia sin instrucciones duplicadas ni fragmentadas
46. **Migración Nomify completada** (2026-05-21): todo el stack de Planilla Nicaragua migrado de Netlify/Airtable a Express+MariaDB+JWT; todos los HTML actualizados con `onReady(roles,fn)` JWT, `netlify/functions/` eliminado, `usuarios.html` creado, backend completo en `planilla-server/`; pendiente push a `WX-MDA/Nomify` rama `sol/feature-inicial`
47. **Carpetas renombradas Nomify** (2026-05-22): frontend `planilla-web/` → `ft_nomify/`, backend ya era `bk_nomify/`; `server.js` debe usar `'../ft_nomify'` en `express.static()`; CLAUDE.md actualizado para reflejar nueva estructura
48. **Bugs detectados en sesión perdida** (2026-05-22): `index.html` limpiado de referencias Netlify; columnas/tablas faltantes añadidas en MariaDB; bug: botón de Usuarios/Configuración no visible en la UI; bug: `usuarios.html` selector de rol solo muestra "Master", no permite asignar "Colaborador"
49. **G54 RRSS v1.3 deployada** (2026-05-27): workflow `wyO1f93A66imn9qw` migrado completamente a G54 API — framework 8 pasos SEO/AEO/GEO, 0 tokens Airtable hardcodeados, lee empresa/servicios/ideas desde G54, guarda posts en G54, estados vía G54 API. Conexión verificada en vivo sin tokens (dev mode). Arquitectura G54 documentada: 4 módulos (RRSS ✅, SEO 🔜, SEM ⏳, Web ⏳).
50. **G54 WhatsApp Engine migrado** (2026-05-27): workflow `eCOX3ogMjToxZsh9` migrado completamente a G54 API — 0 Airtable, 0 tokens hardcodeados, 0 tokens externos en `$vars`. Todo desde G54: empresa y productos activos (`/api/n8n/companies/{id}` y `/productos-servicios`); credenciales Meta WA, prompts, nombre agente configurable, follow-up desde `GET /api/n8n/companies/{id}/whatsapp/config` (campo `agent_name`, `wa_access_token`, `phone_number_id`, `system_prompt`, etc.); leads desde `GET /api/n8n/companies/{id}/wa/leads` y `POST/PATCH /api/agent/wa/leads` — todos con `continueOnFail: true` hasta que G54 implemente los endpoints. Solo vars n8n: `G54_N8N_TOKEN`, `G54_AGENT_TOKEN`, `G54_COMPANY_ID`. Archivo: `workflow-wa-engine-g54.json`.
51. **Alex bugs corregidos** (2026-05-29): workflow `zAhV8gEsXD8dCrXq` — (1) loop medidas: instrucción ahora verifica si el mensaje actual tiene dígitos antes de pedir; (2) loop fecha: mismo patrón condicional; (3) fallback tipo_caja cotizador: `cajon_cerrado` → `cajones_cerrados`; (4) extracción numérica de dimensiones desde texto cuando todos_recolectados=true; (5) estado Airtable: `Lead Caliente` → `Calificado` — era la causa raíz de POST_COTIZACION: el PATCH fallaba con 422 porque "Lead Caliente" no es opción válida en el SingleSelect, perdiendo cotizacion_enviada y fecha.
52. **Strategist AI v1.1** (2026-05-29): workflow `gPGiAG9dSlSwtbRp` — (1) nuevo nodo `🔍 Obtener Keywords G54` lee `/api/n8n/companies/1/keywords` (35 keywords activas por intención: local/comercial/informacional/transaccional); (2) Preparar Contexto las agrupa por intención y las incluye en el prompt con instrucción explícita de usarlas en vez de inventar nuevas; (3) eliminado fallback `|| 'risosadmi@gmail.com'` — email viene solo del perfil G54. Archivo: `workflow-strategist-ai-g54.json`.
53. **Strategist AI v2.0** (2026-06-01): workflow `gPGiAG9dSlSwtbRp` — rediseño completo con plan temporal configurable. Nuevos campos en ⚙️ Config: `G54_PLAN_HORIZONTE` ('1 mes'…'12 meses') y `G54_FRECUENCIA_SEMANAL` (posts/semana); Preparar Contexto calcula semanas (1m=4, 3m=13, 6m=26, 12m=52), total_ideas y distribución TOFU 50% / MOFU 30% / BOFU 20%; lee `competitors_known` desde perfil G54; genera output completo con 14 campos: objetivo, audiencia, tono, frecuencia, director_cta, embudo, plataformas, pilares, kpis, resumen_estrategico, keyword_strategy, mapa_preguntas_aeo, faqs, clusters, plan_publicacion, ideas_plan (array con una idea por semana para todo el período). Archivo: `workflow-strategist-ai-g54.json`.
54. **RRSS Content AI v1.4** (2026-06-01): workflow `wyO1f93A66imn9qw` — (1) Make.com removido como intermediario de publicación (nodo `mk-apr` eliminado, también `at-get` que era órfano); (2) status del post al aprobar cambiado de `"publicado"` → `"aprobado"` para que Distribution AI lo recoja; ahora el flujo de aprobación va directo a G54 con estado aprobado sin pasar por Make.com. Archivo: `workflow-rrss-n8n-v13.json`.
55. **Distribution AI v1.0** (2026-06-01): nuevo workflow `nmOjyvdfTkEo5FVJ` — publica directamente a FB/IG Graph API sin intermediarios. Config node tiene: G54 params + `FB_PAGE_ID`, `FB_ACCESS_TOKEN`, `IG_USER_ID` (configurar con tokens del cliente). Flujo: trigger horario → GET `/rrss/posts?status=aprobado` desde G54 → si tiene imagen: POST a `/{page_id}/photos` (FB) + 2-step container/publish en IG; si no tiene imagen: POST a `/{page_id}/feed` (FB) solo → PUT status `"publicado"` en G54. Archivo: `workflow-distribution-ai-g54.json`.
56. **Strategist AI v2.0 commiteado como primera versión funcional** (2026-06-03): genera plan 13 semanas / 39 ideas, guarda estrategia e ideas en G54 confirmado via panel (`ok:true`). Campos reflejados en panel: objetivo, audiencia, tono, plataformas, pilares, KPIs, embudo. Commiteado en `claude/vibrant-volta-zUwsV`.
57. **Bug fix Content AI — campos vacíos en G54** (2026-06-03): nodo `🖼️ Obtener URL de Imagen` (Set node) solo emitía `{imagen_url:""}` borrando todo el contexto del post. Nodo `💾 Crear Registro en G54` usaba `$json` que quedaba vacío. Fix: jsonBody ahora referencia explícitamente `$('🔍 Parsear Versiones Inglés')` y `$('🔍 Parsear Post Español')`. Post llega completo a G54 con copy Instagram y Facebook.
58. **Pendiente para mañana** (2026-06-03): consultar con el equipo G54 (1) idioma de los posts — actualmente en inglés, definir si debe ser español o bilingüe; (2) plataforma predeterminada de ideas generadas por el Strategist.
59. **Strategist AI v3.0** (2026-06-04): nuevo workflow `cT1SS300CjujIyHS`, webhook `strategist-g54-v3`. Agrega trend finder: nodo `📰 Google News RSS` con User-Agent para bypass de bloqueo de Google → `📋 Extraer Titulares RSS` (Code node extrae `<title>` tags con regex, salta título de canal) → `🧠 Gemini: Analizar Tendencias` → `🔍 Parsear Tema Tendencia` → `🗂️ Preparar Ideas Batch v3` (N-1 evergreen + 1 trend por semana). Bug fixes: multi-company (company_id desde webhook, sin hardcode), Groq reemplazado por Gemini para tendencias (evita rate limit doble). Archivo: `workflow-strategist-ai-g54-v3.json`.
60. **Multi-tenancy G54 implementada** (2026-06-04): patrón `?company=N` query param implementado en Community AI y Sales AI Motor. Patrón: `⚙️ Config G54 → 🔍 Preparar Resolución → 🏢 Resolver Empresa (continueOnFail) → 🏢 Aplicar Config Empresa (merge: query param > API > fallback CE)`. Decisión: Meta Tech Provider necesario para escalar pero por ahora cada cliente crea su App y usa query param. Pendiente G54: endpoints `GET /api/n8n/pages/{id}` y `GET /api/n8n/wa-phones/{id}`.
61. **Sales AI Motor reconstruido limpio** (2026-06-04): workflow `eCOX3ogMjToxZsh9` reconstruido desde cero sin lógica CE. Webhook WA: `wa-engine-g54`, FB/IG: `sales-ai-social`. Eliminado: cotizador, cajones, medidas, tipo_cajón, ISPM-15, modo contingencia rule-based. `datos_actualizados` es objeto libre. IA: Groq llama-3.3-70b + Gemini fallback. Estados: Nuevo → En calificación → Calificado → Vendedor notificado. Alex (`zAhV8gEsXD8dCrXq`, `whatsapp-ce`) intocable. Activo en n8n. Archivo: `workflow-sales-ai-motor-g54.json`.
62. **Banner CE aplicado a workflows CE-específicos** (2026-06-10): banner/footer aprobado de CE (imagen `lh3.googleusercontent.com/d/14EmfG1bLlmxbvvRFyVFaHyehs-_9r5Lh`) agregado a nodos de email en CE Blog, RRSS Automation CE y RRSS Generador de Temas. Los workflows de plataforma G54 NO tienen el banner (viola la regla de no hardcodear datos de cliente).
63. **Reportes por email eliminados de G54** (2026-06-10): removidos todos los nodos de email-reporte de workflows G54 — Analytics semanal/mensual (`📧 Enviar Reporte por Email`), Strategist v2/v3 (`📧 Notificación: Estrategia Lista`), RRSS Content AI v1.3 (toda la cadena: email aprobación + webhook aprobar/rechazar + estados + respuestas + reporte, 11 nodos). Todo se verá en la interfaz G54. Sales AI Motor conserva `📧 Notificar Vendedor` (alerta operacional, no reporte).
65. **Credenciales G54 limpiadas** (2026-06-25): eliminadas todas las credenciales CE hardcodeadas de workflows de plataforma G54. `GEMINI_API_KEY` y `GROQ_API_KEY` reemplazadas con `={{ $vars.GEMINI_API_KEY }}` y `={{ $vars.GROQ_API_KEY }}` en Content AI y Strategist AI. `FB_PAGE_ID` e `IG_USER_ID` de CE reemplazados con placeholders en archivos JSON del repo; valores reales permanecen directamente en n8n.
66. **Lookup dinámico de página en Community AI y Distribution AI** (2026-06-25): ambos workflows ahora llaman `GET /api/n8n/pages/{page_id}` de G54 para obtener `fb_access_token` e `ig_user_id` dinámicamente. Nodo `🏢 Aplicar Config Empresa` hace merge con prioridad: respuesta G54 > query param > fallback CE. Endpoint confirmado existente y funcionando.
67. **Community AI webhook registrado en Meta** (2026-06-25): agregado nodo `🔔 Webhook GET: Verificación Meta` al Community AI para responder el `hub.challenge` de Meta. Registrado en developers.facebook.com → app "CRATING EXPRESS RRSS" → Webhooks → URL con `?company=1`. Campos suscritos: `feed` y `messages`. Verificación pasó exitosamente. ID n8n Community AI corregido: era `WYGmQcPSOzpvn6yv`, correcto es `62tIvF0snsrMj0sM`.
68. **Duplicado Analytics Semanal desactivado** (2026-06-25): workflow `EX9K1AZwKeouSJ9G` (📊 Analytics AI Semanal — G54) desactivado. El correcto y activo es `ocQAzbiftXXOfjct` (Analytics AI — RRSS G54).
69. **AGENT_TOKEN confirmado** (2026-06-25): `g54_agent_produccion_2026` — documentado en Config node de todos los workflows G54.
70. **G54 frontend sin repo conocido** (2026-06-25): el panel admin de G54 (`growth.mdarthurdigital.com/admin`) no está en `risosdigitales/PROYECTO_SOL` ni en ninguna otra rama conocida. Pendiente confirmar con Walter dónde vive ese código para poder agregar campos de credenciales de WhatsApp y otros.
71. **Ideas Instagram bloqueadas** (2026-07-01): 2 ideas con `status=idea` en Instagram no se aprueban intencionalmente — sin campo `image_url` en el editor del panel, los posts de IG no pueden publicarse (Graph API rechaza sin imagen). Se esperará hasta que Walter implemente el campo.
72. **Error Reporter fix permanente** (2026-07-01): workflow `CKOju9JVnSMymfKv` migrado de Gmail OAuth2 a SMTP con App Password — credencial `Gmail SMTP — risosadmi` (ID: `iWBBSSe5AWsCMo89`), nodo cambiado de `n8n-nodes-base.gmail` → `n8n-nodes-base.emailSend`. Gmail OAuth expiraba cada 7 días igual que el bug de Blog Publisher. SMTP con App Password no expira nunca. Testeado y confirmado 2026-07-01.
73. **Migración masiva Gmail OAuth2 → SMTP** (2026-07-01): todos los nodos de envío de correo en todos los workflows migrados a credencial SMTP `iWBBSSe5AWsCMo89`. Workflows actualizados: `1RHpMk3iKHjLXGgb` (Generador Temas), `38fO1D5uJpVUDMqm` (Blog Todas las Redes), `FTa48iKiRIMW5BNB` (Voice Agent Resumen), `HqKUsOwwguIYQbsU` (RRSS Automation CE), `T9J845yE4sd8Dde5` (CE Mantenimiento Web), `bFjarbrGigp90UCL` (Email Outreach), `otycsrxrMEMuxuwD` (Sales AI), `rtyrpJJsXD2xHINU` (Lead Generation), `vQUztiEMB8dXfNwo` (Alex Orquestador), `zAhV8gEsXD8dCrXq` (CE WhatsApp Engine Marco), `cJZV7jcwlbFoW5qJ` (Gmail Monitor — solo nodo de envío; nodo de lectura permanece en OAuth2 porque SMTP no puede leer bandeja). Archivados y workflows de Módulo 2/3/4 no tocados.
74. **Distribution AI — routing por plataforma corregido** (2026-07-01): el workflow `IRCoya91PKPjpT1T` publicaba posts de Instagram en Facebook porque el nodo `¿Tiene imagen?` solo verificaba si había imagen pero nunca leía el campo `platform`. Fix: nodo IF reemplazado por Switch con 4 ramas (IG con imagen → container/publish IG, IG sin imagen → revertir a aprobado, FB con imagen → photo post, FB sin imagen → text post). También se agregó `platform` al output de `Preparar Datos Post`. Archivo: `workflow-distribution-ai-g54.json`.
75. **Bug detectado — imagen_url no persiste en panel G54** (2026-07-01): el campo URL de imagen en el editor de posts del panel acepta input y muestra preview, pero al dar Guardar Cambios el valor no se guarda en el backend. La API devuelve siempre `imagen_url: null`. Pendiente corrección por Walter — bloquea publicación en Instagram.
76. **Bug detectado — ig_user_id null en API de páginas** (2026-07-01): `GET /api/n8n/pages/{pageId}` devuelve `ig_user_id: null` para company_id=1. El valor correcto para Crating Express es `17841402206774619` (corregido después a `17841446392201293`, ver ítem 84). Pendiente que Walter lo configure en el panel o directamente en la DB.
77. **Posts 42 y 46 eliminados** (2026-07-01): ambos eliminados via `DELETE /api/agent/rrss/posts/{id}` para limpiar estados atascados. Post 42 estaba en "programado" desde Jun 26; post 46 quedó con `fecha_programada` después de una prueba fallida de Instagram. El campo `fecha_programada` no se puede limpiar con AGENT_TOKEN (solo soporta DELETE en posts individuales).
78. **Genesis G54 Jul 01 creado** (2026-07-01): `genesis-g54-jul01.html` — estado actualizado de los 6 ítems del Genesis anterior + 3 nuevos: imagen_url no persiste (bloqueante), ig_user_id null (bloqueante), wa/leads sin implementar (P0).
79. **Content AI v1.4 — multi-empresa** (2026-07-02): `wyO1f93A66imn9qw` — Config node `G54_COMPANY_ID` cambiado de hardcoded `"1"` a `={{ $('🔔 Webhook G54').item.json.body.company_id || '1' }}`. Ahora cualquier empresa puede llamar al webhook y el Content AI genera posts para esa empresa, no siempre para Crating Express. Confirmado con ejecución de empresa 6 (Orison).
80. **Subworkflow 02 — wa/leads con phone param** (2026-07-02): `s1Z7jKoFzy5x7XvC` — nodo `📋 Buscar Lead` URL actualizada de `/wa/leads` a `/wa/leads?phone={{ encodeURIComponent($('Recibir Datos').first().json.telefono) }}`. Endpoint requiere parámetro phone.
81. **Subworkflow 01 — historial desde G54** (2026-07-02): `1PXcg3dOQBt8hrrT` — Clasificador corregido para leer historial desde `inp.historial` (G54) y datos estructurados desde `inp.datosRecolectados`. Antes leía campos Airtable vacíos, causando que Marco saludara a clientes recurrentes como nuevos. Formato G54: `"Cliente: texto\nAgente: texto"`. `datos = {}` en G54 — la API no persiste datos estructurados de la conversación (superado luego, ver ítem 89).
82. **Analytics AI V3 — Meta Reporte creado** (2026-07-03): nuevo workflow `YI9EfJYcWJN4bbM9` ("ANALYTICS MENSUAL V3-META REPORTE") — copia del Analytics AI mensual (`ocQAzbiftXXOfjct`) con tres cambios: (1) `FB_ACCESS_TOKEN` e `IG_USER_ID` removidos del Config node — ahora vienen dinámicamente de G54 via nuevo nodo `🔑 Obtener Tokens Sociales G54` (`GET /api/n8n/pages/{FB_PAGE_ID}`); (2) nodos FB e IG reemplazados de post-level a account-level insights; (3) Groq migrado a credencial nativa `jORffbRhRNohHT1B` (fix del bug de `$vars`). `ig_user_id` tiene fallback hardcodeado por bug conocido de Walter (null en G54 pages API). Archivo: `workflow-analytics-v3-meta-reporte.json`.
83. **Image Generator AI activado** (2026-07-07): workflow `1rsqmFabW5PjnlHy` — diagnosticado y corregido. Bugs: token hardcodeado en JS, nombres de campos incorrectos (`idea_descripcion` → `tema`/`hook`/`copy_instagram`), paralelismo mal configurado en cadena de nodos, nodo HTTP save con `authentication: genericCredentialType` sin credencial. Fix: arquitectura lineal de 9 nodos, modelo Pollinations `flux` (mejor que `sana`), `continueOnFail: true` en save (endpoint PUT devuelve 401 — mismo comportamiento en Distribution AI). Webhook `POST /webhook/generar-imagen` con `{post_id, company_id, platform, style}` retorna `{"ok": true, "image_url": "..."}`. Archivado en `workflow-image-generator-g54.json`.
84. **Analytics V3 mensual activado** (2026-07-07): workflow `YI9EfJYcWJN4bbM9` — schedule trigger estaba `disabled: true`, habilitado y cambiado a mensual día 1 a las 8am. `Preparar Datos Analytics` reescrito para leer métricas account-level correctamente con `sumMetric()`. `Guardar Métricas en G54` corregido al formato real: `{company_id, metricas: [{platform, period_start, period_end, alcance_total, ...}]}`. Confirmado: ejecución 14655 → `{"ok": true, "created": 2}`.
85. **Analytics Semanal G54 refactorizado** (2026-07-07): workflow `EX9K1AZwKeouSJ9G` — (1) endpoint cambiado de `/posts` a `/published_posts` con métricas válidas; (2) nodo `🔑 Obtener Tokens Sociales G54` agrega dinámicamente el user token desde G54 pages API; (3) nuevo nodo `🔑 Obtener Page Token FB` intercambia user token → page token via `/{page_id}?fields=access_token` — necesario para post insights; (4) modo dual por webhook: sin `post_id` = métricas semanales agregadas, con `post_id` = métricas de ese post individual; (5) email y HTML nodes eliminados (solo mensual manda email); (6) G54_AGENT_TOKEN corregido en Config node. Archivo: `workflow-analytics-semanal-g54.json`.
86. **FB token renovado** (2026-07-07): token de larga duración (~60 días) generado con App ID `804995982222393`. Actualizado en G54. IG User ID correcto confirmado: `17841446392201293`. El endpoint `GET /api/n8n/pages/{pageId}` aún devuelve `ig_user_id: null` — pendiente que se corrija en G54 backend para que el Analytics IG funcione automáticamente.
87. **Post insights con permiso `instagram_manage_insights`** (2026-07-07): permiso confirmado activo en la app de Meta. IG insights funcionan con page token cuando `ig_user_id` esté disponible desde G54.
88. **Marco memoria — diagnóstico incorrecto corregido** (2026-07-08): el POST `/api/agent/whatsapp/inbound` SÍ funciona y persiste datos/mensajes (confirmado con documentación G54 y ejemplo de Carlos Medina). El diagnóstico anterior era erróneo. La causa raíz real era un phone format mismatch (ver ítem 90).
89. **SW02 filter revertido** (2026-07-08): `s1Z7jKoFzy5x7XvC` — revertido de `'Bot: [D:'` a `'Agente: [D:'` (3 ocurrencias). El cambio del día anterior era incorrecto: G54 reconstruye historial con prefijo `Agente:` para mensajes de bot.
90. **Marco memoria — causa raíz y fix definitivo** (2026-07-08): SW05 (`☁️ G54: Sync Conversación`) guardaba el lead con `phone: '+' + $json.telefono` (ej: `+50576560734`) pero SW02 (`📋 Buscar Lead`) buscaba con `$json.telefono` sin `+` (ej: `50576560734`). G54 no encontraba el lead → retornaba vacío → Marco siempre arrancaba de cero. **Fix 1:** URL y queryParam de SW02 ahora usan `'+' + telefono` para coincidir con formato E.164. **Fix 2:** el snapshot `[D:{...}]` ya no sobreescribe los `datos` reales de G54 — hace merge y solo rellena campos vacíos. Aplicado en n8n a las 17:22 UTC.
91. **Marco — loop de venta post-cotización corregido** (2026-07-08): con la memoria ya funcionando, apareció un bug distinto: Marco quedaba atascado repitiendo "recomienda cajones cerrados" sin importar lo que el cliente respondiera, porque el SW01 Clasificador veía `tipo_cajon=null` en los `datos` recuperados de G54 y forzaba el paso `PEDIR_TIPO_CAJON` sin detectar intenciones post-venta. Fix (commit `f58dc61`): nueva detección de intent ANTES de la máquina de estados — si el mensaje es una consulta de seguimiento ("estado del pedido", "ya hice el pedido", etc.), Marco responde con datos de contacto de ventas en vez de continuar el flujo de cotización. Aplicado en n8n a las 17:31 UTC.
92. **Marco — regex de intent post-venta ampliada** (2026-07-08): la primera versión de la detección (ítem 91) no capturaba typos ("hcie" por "hice") ni variantes cortas ("su estado" vs "estado del pedido"). Commit `d30ff83` amplía la regex a múltiples cláusulas (estado/seguimiento/cómo va, typos de hice/pedí, rechazo explícito de recomendaciones) y refuerza la instrucción `CONSULTA_ESTADO_PEDIDO` con una prohibición explícita de mencionar cajones/productos. Aplicado en n8n a las 17:37 UTC. **Limitación conocida:** no existe endpoint DELETE para leads de prueba en G54 — para probar con historial limpio hay que usar un número de teléfono distinto; lead de prueba ID 3 quedó con historial contaminado de las pruebas anteriores.
93. **Consolidación de ramas dispersas en master** (2026-07-08): mergeadas `claude/charming-dirac-a8o0jf`, `claude/check-claude-md-file-EC9xe`, `claude/determined-curie-8emmm8`, `claude/vibrant-volta-zUwsV`, `claude/vigilant-edison-zluWe` a `master`. Se resolvieron 7 marcadores de conflicto sin resolver que habían quedado commiteados en CLAUDE.md (merge previo mal hecho). Se llevaron a la raíz del repo las versiones más recientes/activas de todos los workflows G54 (antes solo vivían archivadas en `PROYECTO-SOL/2026/`, desactualizadas). Se encontraron y redactaron credenciales reales hardcodeadas que venían de la rama origen: token FB/Meta en 3 workflows (Community AI, Marco CE, Sales AI Motor), API keys de Gemini y Groq en Strategist v2, y una API key de Pollinations en el Image Generator — todas reemplazadas por placeholders o `$vars`. Las 5 ramas quedaron pendientes de borrado manual en GitHub (el `git push --delete` fue bloqueado por el proxy del entorno con 403 en las 5).
94. **Image Generator — regla anti-logo** (2026-07-08): agregada a la lista de negativos del prompt (nodo `🎨 Construir Prompt`, aplica a las 3 plataformas porque el prompt se construye una sola vez antes de bifurcar): "never invent, create, fabricate or hallucinate a brand logo or emblem... absolutely no logo generation under any circumstance". Pusheado directo a n8n (workflow `1rsqmFabW5PjnlHy`) vía API además de al repo.
95. **Pollinations — formato de imagen confirmado JPEG** (2026-07-08): se probó en vivo el endpoint `image.pollinations.ai/prompt/...` con los 4 modelos gratuitos usados (`flux`, `zimage`, `klein`, `nova-canvas`, también `sana`) — todos devuelven `Content-Type: image/jpeg` de forma consistente, confirmado con `file` sobre el binario descargado. Hoy el workflow no sube ningún binario a G54, solo guarda la URL de Pollinations como `imagen_url`. **Aclaración del usuario:** el plan real es que la imagen SÍ se suba como archivo al servidor de G54 (no solo la URL externa) — Walter construirá ese endpoint de subida del lado de G54. Como Pollinations ya entrega JPEG y el nodo `🌐 Pollinations: Generar Imagen` ya trae el binario (`responseFormat: file`), cuando ese endpoint exista no hará falta ninguna conversión — alcanza con reenviar ese mismo binario en vez de descartarlo y mandar solo la URL como hace hoy `🔗 Preparar URL Final`. Pendiente: adaptar ese nodo para pasar el binario en cuanto Walter tenga el endpoint de subida listo.
96. **Éxodo G54 Jul 08 creado** (2026-07-08): `exodo-g54-jul08.html` — 11 requerimientos para Walter (mismo estilo visual que los Genesis anteriores). Incluye: `ig_user_id` null (carry-over, bloqueante), habilitar Analytics Mensual+Semanal activos simultáneamente (hoy G54 solo permite 1), campo `meta_post_id` en posts publicados (necesario para que Analytics Semanal en modo individual pueda pedir métricas de un post específico — la parte que nos toca a nosotros, actualizar Distribution AI para mandarlo, queda pendiente internamente y no en el documento), endpoint DELETE de leads (opcional en UI, al menos vía API para pruebas), Distribution AI sin registrar en panel de agentes (carry-over), botones sin estilo (Content AI y Métricas), renombrar botón Content AI → "Generar Post", opción de generar ideas sueltas sin correr el Strategist completo, reloj visible, huso horario Londres → ciudad de empresa, espacio en el editor de post para disparar el Image Generator AI (hoy solo funciona por webhook). El ítem "imagen_url no persiste al guardar manualmente" del Genesis del 01 jul se confirmó resuelto y no se incluyó.

64. **Census n8n + limpieza** (2026-06-10): 32 workflows totales, 11 activos, 21 inactivos. Alex renombrado (estaba como "doble"). Borrados 4 workflows obsoletos: Generador Temas v1.2, CE WA Engine v1.2, CE Blog v1.2, CE Email Outreach v1.2. RRSS Automation CE (`HqKUsOwwguIYQbsU`) reactivado como puente — el content generator de RRSS para CE no estaba corriendo (G54 inactivo + viejo inactivo). Nomify confirmado fuera de nuestro alcance, lo continúa otra persona.
  .gitignore
  README.md
```

El servidor Express sirve el frontend con:
```js
app.use(express.static(path.join(__dirname, '../ft_nomify')));
```
**La app SOLO funciona en `http://localhost:3000`** — NO abrir desde Netlify ni desde el sistema de archivos directamente.

### Comandos para arrancar

```bash
# En PowerShell dentro de bk_nomify\
nvm use 24           # ← OBLIGATORIO antes de node/npm (NVM for Windows, versión 24)
npm install          # solo la primera vez o al agregar dependencias
node server.js       # o: npm start

# Si el puerto 3000 está ocupado:
netstat -ano | findstr :3000
taskkill /PID <número> /F
```

### Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js 24 + Express 4 |
| Auth | JWT (`jsonwebtoken` + `bcryptjs`), token en `localStorage` como `planilla_token` |
| Base de datos | MariaDB 11 (local Windows), base `planilla_nicaragua` |
| Frontend | HTML/CSS/JS puro, sin framework |
| ORM/driver | `mysql2/promise` con pool de conexiones |

### Sistema de roles

| Rol | Acceso |
|---|---|
| `Master` | Todo — empleados, salarios, usuarios, todas las planillas |
| `Colaborador` | Solo ve/edita su tipo de planilla asignada (`planillas_acceso`) |
| ~~`Empleado`~~ | (en código) Solo `mi-recibo.html` — sus propios recibos |

`planillas_acceso` en tabla `usuarios` = `'Con Seguro'` o `'Sin Seguro'` para Colaborador.

### .env requerido en bk_nomify/

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=planilla_nicaragua
JWT_SECRET=cambia_esto_por_un_secreto_seguro
PORT=3000
```
`.env` está en `.gitignore` — NUNCA commitear.

### Crear primer usuario admin

```bash
node create-admin.js
# Crea: risosadmi@gmail.com / admin123 con rol Master
# Cambiar contraseña desde Usuarios en la app después del primer login
```

### Archivos del backend (en bk_nomify/)

| Archivo | Descripción |
|---|---|
| `server.js` | Entry point — monta rutas, sirve frontend estático |
| `auth.js` | `signToken()`, `requireAuth`, `requireMaster` |
| `db.js` | Pool de conexión MariaDB (`mysql2/promise`) |
| `create-admin.js` | CLI para crear usuario inicial Master |
| `schema.sql` | DDL completo — crear todas las tablas |
| `package.json` | Deps: express, cors, dotenv, mysql2, jsonwebtoken, bcryptjs |
| `routes/authRoutes.js` | `POST /api/auth/login`, `GET /api/auth/me` |
| `routes/empleadosRoutes.js` | GET/POST/PATCH empleados |
| `routes/prestamosRoutes.js` | GET/POST/PATCH préstamos |
| `routes/adelantosRoutes.js` | GET/POST/PATCH adelantos |
| `routes/extrasRoutes.js` | GET/POST/PATCH/DELETE extras/bonos |
| `routes/deduccionesRoutes.js` | GET/POST/PATCH/DELETE deducciones |
| `routes/vacacionesRoutes.js` | GET/POST/PATCH/DELETE vacaciones |
| `routes/planillasRoutes.js` | GET lista + `POST /calcular` (motor completo) |
| `routes/detalleRoutes.js` | GET detalle por período/tipo o por empleado |
| `routes/reciboRoutes.js` | GET recibo por empleado_id + período |
| `routes/usuariosRoutes.js` | GET/POST/PATCH/DELETE usuarios (Master only) |

### Schema de base de datos (tablas)

```sql
empleados      — id, nombre, cargo, tipo_planilla, salario_bruto, inss_base,
                 ir_fijo, email, rol, planillas_acceso, fecha_ingreso, activo
planillas      — id, periodo, tipo, estado, total_bruto, total_deducciones, total_neto
detalle_planilla — id, planilla_id, empleado_id, periodo, tipo_planilla,
                   salario_quincenal, inss, ir, desc_prestamo, desc_adelanto,
                   extras, desc_deducciones, total_deducciones, neto
prestamos      — id, empleado_id, monto_total, cuota_quincenal, cuotas_restantes,
                 estado, historial_pagos, notas
adelantos      — id, empleado_id, monto, descontar_en, estado, pausado, fecha_registro
extras         — id, empleado_id, tipo, descripcion, monto, pagar_en
deducciones    — id, empleado_id, concepto, descripcion, monto, descontar_en,
                 estado, pausado, fecha_registro
vacaciones     — id, empleado_id, tipo, dias, monto, fecha_inicio, fecha_fin,
                 estado, notas
usuarios       — id, nombre, email, password_hash, rol, planillas_acceso, empleado_id
```

**Notas de lógica clave:**
- `inss_base = 'Salario Minimo'` → INSS = (10913.54/2) × 7% = C$381.97
- `inss_base = 'Salario Completo'` → INSS = (salario_bruto/2) × 7%
- `tipo_planilla = 'Sin Seguro'` → INSS = 0
- Motor de cálculo está en `planillasRoutes.js → POST /api/planillas/calcular`

### Archivos del frontend (en ft_nomify/)

| Archivo | `onReady` | Descripción |
|---|---|---|
| `login.html` | — (sin auth, es la pantalla de login) | Formulario JWT |
| `index.html` | `onReady(['Master','Colaborador'], fn)` | Dashboard 5 stats + feriados |
| `empleados.html` | `onReady(['Master','Colaborador'], fn)` | CRUD empleados |
| `planillas.html` | `onReady(['Master','Colaborador'], fn)` | Historial + generar planilla |
| `planilla-detalle.html` | `onReady(['Master','Colaborador'], fn)` | Detalle por período |
| `prestamos.html` | `onReady(['Master','Colaborador'], fn)` | CRUD préstamos + historial pagos |
| `adelantos.html` | `onReady(['Master','Colaborador'], fn)` | CRUD adelantos + Pausar |
| `extras.html` | `onReady(['Master','Colaborador'], fn)` | CRUD extras/bonos/feriados |
| `deducciones.html` | `onReady(['Master','Colaborador'], fn)` | CRUD deducciones + Pausar |
| `calendario.html` | `onReady(['Master','Colaborador'], fn)` | Calendario feriados/quincenas/vac |
| `vacaciones.html` | `onReady(['Master','Colaborador'], fn)` | Vacaciones 2.5 días/mes |
| `recibo.html` | `onReady(['Master','Colaborador'], fn)` | Recibo imprimible |
| `mi-recibo.html` | `onReady(null, fn)` | Vista empleado — sus recibos |
| `usuarios.html` | `onReady(['Master'], fn)` | Gestión usuarios (solo Master) |
| `assets/js/auth.js` | — (librería) | JWT auth, `onReady`, `apiFetch`, etc. |
| `assets/js/feriados.js` | — (librería) | Feriados Nicaragua + algoritmo Pascua |

**`auth.js` expone globalmente:** `onReady`, `initLayout`, `getToken`, `apiFetch`, `getMyInfo`, `isMaster`, `fmt`, `showAlert` (también como `window.AppAuth`).

**Estructura del nav (TODAS las páginas excepto mi-recibo.html):**
```html
<nav>
  <a href="/index.html"><span class="icon">📊</span> Dashboard</a>
  <a href="/empleados.html"><span class="icon">👥</span> Empleados</a>
  <a href="/planillas.html"><span class="icon">📋</span> Planillas</a>
  <a href="/prestamos.html"><span class="icon">💰</span> Préstamos</a>
  <a href="/adelantos.html"><span class="icon">⚡</span> Adelantos</a>
  <a href="/extras.html"><span class="icon">⭐</span> Extras</a>
  <a href="/deducciones.html"><span class="icon">➖</span> Otras Deducciones</a>
  <a href="/calendario.html"><span class="icon">📅</span> Calendario</a>
  <a href="/vacaciones.html"><span class="icon">🏖</span> Vacaciones</a>
  <a href="/usuarios.html" id="link-usuarios"><span class="icon">👤</span> Usuarios</a>
</nav>
```
`id="link-usuarios"` es ocultado por `initLayout()` si el rol es Colaborador.

**Sidebar logo en TODAS las páginas:** `<div class="sidebar-logo"><h2>🧮 Nomify</h2><p>Planilla Nicaragua</p></div>`

### Estado actual del repo WX-MDA/Nomify (rama sol/feature-inicial)

El repo tiene código viejo (versión Netlify/Airtable). El código correcto (Express/MariaDB/JWT) está en este repositorio en:
- Backend: `/home/user/RRSS-AUTOMATIZACI-N/planilla-server/`
- Frontend: `/home/user/RRSS-AUTOMATIZACI-N/planilla-web/`

**Qué hacer en una nueva sesión conectada a `WX-MDA/Nomify`:**

1. Leer todos los archivos de `/home/user/RRSS-AUTOMATIZACI-N/planilla-server/` y `planilla-web/`
2. Pushear el backend a `bk_nomify/` en rama `sol/feature-inicial`:
   - `bk_nomify/server.js`, `auth.js`, `db.js`, `create-admin.js`, `schema.sql`, `package.json`
   - `bk_nomify/.env.example` (con placeholders, NO el .env real)
   - `bk_nomify/routes/` (11 archivos: auth, empleados, prestamos, adelantos, extras, deducciones, vacaciones, planillas, detalle, recibo, usuarios)
3. Pushear el frontend a `ft_nomify/` en misma rama:
   - `ft_nomify/assets/js/auth.js` y `feriados.js`
   - Todos los HTML: login, index, empleados, planillas, planilla-detalle, prestamos, adelantos, extras, deducciones, calendario, vacaciones, recibo, mi-recibo, usuarios
4. Asegurarse de que NO existe `ft_nomify/netlify/` ni `netlify.toml` que apunte a Netlify functions
5. En la máquina local: `git pull origin sol/feature-inicial` para bajar los cambios

**IMPORTANTE — Bug conocidos pendientes de fix:**
- `usuarios.html`: el selector de rol solo permite asignar "Master" — no aparece "Colaborador" como opción; la opción existe en HTML pero algo en el JS la deshabilita/oculta
- Botón de configuración/usuarios no visible en la UI para ciertos roles — verificar que `initLayout()` en `auth.js` oculta correctamente solo para Colaborador y no para Master

### Pendientes Nomify

> **FUERA DE NUESTRO ALCANCE (2026-06-10)** — lo continúa otra persona. No incluir en planificación.

---

## Reportes Diarios

> Los últimos 14 días. Anteriores archivados en `PROYECTO-SOL/reportes/`.

---

### 2026-07-08 (Miércoles)

El día arrancó revisando un video que Don Marc mandó en la mañana sobre salesads.ai, para ver si había algo aprovechable para lo que ya tenemos armado. De ahí pasamos a retomar las pruebas de WhatsApp con Marco, donde logramos corregir el bug de memoria que hacía que no recordara datos de conversaciones anteriores. El problema fue que, una vez arreglado, no pudimos seguir probando a fondo porque el lead de prueba que veníamos usando ya estaba muy contaminado con datos de pruebas viejas, y no existe forma de borrarlo ni resetearlo desde ningún lado. Quedó anotado en el archivo de puntos pendientes para el ingeniero, porque es algo que vamos a seguir necesitando mientras probemos cambios.

Después de eso nos movimos al generador de imágenes de contenido. Se agregó una regla nueva para que nunca invente o dibuje un logo de la marca, algo que podía pasar sin que lo pidiéramos. También confirmamos que las imágenes ya se están generando en formato JPEG desde el origen, así que no hace falta ninguna conversión extra de nuestro lado cuando se implemente la subida al servidor. Y quedó definido cómo priorizar entre las dos formas que va a tener el panel para conectar las redes sociales de un cliente — cuál se usa primero si llegan a estar las dos configuradas.

Para cerrar el día armamos el documento de pendientes para el ingeniero con todo lo que se fue detectando estos últimos días — bugs, campos que faltan y mejoras de interfaz — para tener todo en un solo lugar y poder revisarlo con él cuando tenga espacio.

---

### 2026-07-07 (Lunes)

El día estuvo centrado en hacer que los dos workflows de Analytics funcionen de punta a punta con datos reales en G54, luego en activar y estabilizar el Image Generator AI que hasta hoy no había sido probado nunca en vivo, y al cierre se identificó y resolvió el bug de memoria de Marco que llevaba días sin solución.

Arrancamos con el Analytics V3 mensual, que era el más simple de los dos porque ya tenía la lógica correcta pero tenía el schedule trigger con `disabled: true`, así que nunca había corrido de forma automática. Se habilitó y se cambió a mensual el día 1. Lo que tomó más tiempo fue reescribir el nodo de preparación de datos, porque estaba intentando leer métricas account-level con la misma lógica que se usaría para posts individuales, siempre devolviendo cero. Se corrigió con una función `sumMetric()` que lee el array de valores de la Graph API correctamente. El formato del cuerpo de guardado en G54 también estaba mal estructurado. Con esas tres correcciones el V3 corrió limpio y respondió `{"ok": true, "created": 2}`, confirmando que los datos llegaron a G54.

El Analytics Semanal requirió más trabajo. El endpoint `/posts` que usaba está deprecado en versiones modernas de Meta y devuelve métricas obsoletas, así que se migró a `/published_posts` con las métricas de post actuales. El token en el Config node estaba redactado por un push anterior a GitHub, así que en lugar de volverlo a poner ahí se aprovechó para agregar un nodo que lo lee dinámicamente desde G54 cada vez, igual que hacen los otros workflows. Pero ahí apareció algo que no habíamos contemplado: para leer insights de posts individuales Meta requiere un Page Access Token específicamente, no el User Token que devuelve G54. Eso causaba un error `Invalid OAuth 2.0 Access Token` con subcódigo 2069032. La solución fue agregar un segundo nodo que llama a `GET /{page_id}?fields=access_token` para hacer el intercambio automáticamente antes de consultar cualquier insight de post. También se aprovechó para hacer el workflow dual: si el webhook recibe un `post_id`, corre en modo individual para ese post; si no recibe ninguno, corre el flujo semanal completo. Ambos modos terminan guardando en G54. Junto a todo esto se renovó el FB token de larga duración porque el anterior ya tenía meses, y se confirmó que el IG User ID correcto de Crating Express es `17841446392201293`, distinto al que teníamos antes. El permiso `instagram_manage_insights` ya estaba activo en la app de Meta, así que una vez que Walter conecte el `ig_user_id` en el endpoint de páginas de G54, los datos de Instagram llegarán solos.

Ya en la tarde se pasó al Image Generator AI, el workflow `1rsqmFabW5PjnlHy` que meses atrás se había construido en código pero nunca se había probado realmente en vivo. Al ejecutarlo por primera vez salieron cinco bugs en cadena. El primero era que el AGENT TOKEN de G54 estaba hardcodeado directamente dentro del código JavaScript del nodo en lugar de leerlo del Config node, lo cual viola la regla de no credenciales en código. El segundo era que el código intentaba leer campos del post que no existen en la API de G54, usaba nombres como `idea_descripcion` y `contenido` cuando los campos reales son `tema`, `hook` y `copy_instagram`. El tercero era un problema de paralelismo en la cadena de nodos: el nodo de construcción del prompt recibía input desde el webhook Y desde el nodo de consulta a G54 simultáneamente, creando una condición de carrera. El cuarto era que el nodo de guardado tenía configurado `authentication: genericCredentialType` sin ninguna credencial asignada, tirando "Credentials not found" siempre. El quinto era el modelo de Pollinations: estaba usando `sana` que no funciona bien para este tipo de imágenes industriales y de producto. Se simplificó toda la arquitectura a nueve nodos lineales, se pasó al modelo `flux` que tiene mucho mejor resultado, se agregó `continueOnFail: true` en el guardado porque el endpoint `PUT` de G54 devuelve 401 para el agent token (mismo comportamiento ya conocido del Distribution AI), y se implementaron parámetros de calidad específicos por plataforma: Instagram usa proporciones cuadradas y estética más limpia, Facebook permite más texto visual, y se restringen descripciones demasiado genéricas para evitar imágenes sin relevancia. El workflow ahora recibe `{post_id, company_id, platform, style}` vía webhook y devuelve `{"ok": true, "image_url": "..."}` con la URL de Pollinations. Se probó exitosamente con el post 49 de Crating Express. Lo que queda pendiente y es el desafío real es que actualmente la imagen se genera desde los campos generales del post (tema, hook, copy), y eso da resultados aceptables pero no perfectos porque la descripción visual viene de un contenido pensado para texto. La forma ideal sería que el Strategist AI o el Content AI generen también un campo `prompt_imagen` específico para la generación visual, pero eso implica cambios en el panel de G54 y en múltiples workflows que por ahora no podemos hardcodear porque el sistema es multiempresa.

Al cierre del día, ya casi de noche, se identificó y resolvió el bug de memoria de Marco que llevaba días manifestándose. El diagnóstico había señalado que el problema estaba en el SW03, pero al revisar el código con calma resultó que SW03 ya tenía la lógica de merge correcta. El bug real estaba una capa antes: el SW02 (Contexto y Lead) lee el historial de G54 y busca los snapshots de datos que SW03 embebe al final de cada turno con el formato `Bot: [D:{...}]`, pero el filtro en SW02 buscaba `'Agente: [D:'` — una cadena que nunca aparece en el historial porque SW03 siempre escribe "Bot:", no "Agente:". El resultado era que cada turno arrancaba con `datosGuardados` vacío, sin importar lo que el cliente había dicho antes. Se corrigieron las tres ocurrencias en el SW02 (el filtro de lectura, el regex de extracción del JSON, y el filtro de limpieza antes de pasar el historial a la IA), se actualizó en n8n y se reactivó el workflow. Con esto Marco debería recordar todos los datos acumulados de la conversación a partir de la próxima prueba.

---

### 2026-07-02 (Jueves)

El día comenzó con una reunión a primera hora con el Ing. Walter donde revisamos el flujo completo de RRSS de punta a punta — desde que el Strategist AI genera la estrategia hasta que el Distribution AI publica en redes — para detectar cualquier detalle que pudiera estar fallando o que no fuera claro para el usuario. Fue una revisión bastante minuciosa porque no solo se trató de que las piezas funcionen técnicamente, sino de que el flujo completo sea entendible y cómodo para quien lo usa desde el panel. Walter hizo varias observaciones sobre la interfaz: cosas que visualmente no son intuitivas, pasos donde el usuario podría perderse, y oportunidades de hacer la experiencia más fluida y agradable. Esa conversación marcó la dirección del resto del día.

A raíz de eso se trabajó en varias cosas. Lo primero fue el Analytics AI V3 — una copia del analytics mensual existente pero que en lugar de recoger métricas post por post, llama directamente a la API de Meta para obtener datos a nivel de cuenta: impresiones, alcance, usuarios activos, seguidores ganados, visitas al perfil y clics al sitio, tanto para Facebook como para Instagram. Los tokens ya no van hardcodeados en el workflow, vienen dinámicamente de G64 usando el ID real de la página de Facebook (`GET /api/n8n/pages/{FB_PAGE_ID}`). Luego ese workflow se conectó con un nodo de correo que manda el reporte como HTML al cliente. El diseño del email pasó por varias iteraciones: primero salió en azul oscuro tipo navy que no era el estilo de G54, se hizo una versión alternativa en blanco y se aprobó esa — fondo claro `#eef0f4`, logos de Growth54, Facebook e Instagram embebidos como SVG sin depender de URLs externas, una gráfica lineal que muestra el alcance diario de los últimos 30 días con datos reales de la Graph API (fallback generativo si no hay datos suficientes), y cada tarjeta de métricas muestra el nombre exacto del campo de la API para que sea educativo para el cliente. Aparte de eso se preparó un archivo de design system completo para Walter con todos los tokens de diseño, colores, tipografías, tamaños y estructura del email para que los módulos 2, 3 y 4 tengan la misma estética cuando los implemente.

Al final del día apareció algo que había que corregir: en el panel se notó que las ideas generadas por el Strategist AI no tenían coherencia con sus keywords — una idea sobre piscina emparejada con una keyword de hospital militar, y el negocio no tiene piscina. La causa era que el AI primero inventaba una idea libre y luego le "asignaba" una keyword de la lista, que es exactamente al revés de como debería funcionar. Se corrigió el prompt del Strategist AI v2.1 para que el proceso sea keyword → idea: primero toma una keyword real de G54, identifica qué intención tiene esa búsqueda, y solo entonces crea un título que responda esa intención. Se agregó también un campo de verificación (`angulo`) que obliga al AI a justificar que el contenido de la idea corresponde a algo que la empresa realmente ofrece — si no puede justificarlo, descarta esa keyword y toma otra. Queda pendiente ejecutar el Strategist para un cliente real y verificar que las ideas salgan coherentes de principio a fin.

Estructura de subworkflows Alex CE (G54) — documentado hoy:
- `vQUztiEMB8dXfNwo` — 00 Orquestador: webhook, extraer mensaje, llamar 02→01→03→04→05
- `s1Z7jKoFzy5x7XvC` — 02 Contexto y Lead: lee empresa/config/productos/KB de G54, busca lead por phone en G54
- `1PXcg3dOQBt8hrrT` — 01 Clasificador: construye `sistemaIA`, `usuarioIA`, `proximoPaso`
- `J8qbKOF7t4GnhRDT` — 03 Generador IA: llama Groq/Gemini con sistemaIA+usuarioIA, parsea respuesta JSON
- `jDEYno22WuE0QVwJ` — 04 Cotizador
- `PqbfMghL0E7xKflC` — 05 Guardar Lead: llama `POST /api/agent/whatsapp/inbound` con mensajes

---

### 2026-07-01 (Miércoles)

El día comenzó retomando el problema de Marco: el bot saludaba a clientes recurrentes como si fueran nuevos ("Hola, ¿en qué puedo ayudarte?") a pesar de que ayer se había corregido el endpoint de búsqueda de leads en el subworkflow 02 para incluir el parámetro `?phone=...`. Al rastrear el flujo completo de los subworkflows de Alex CE se identificó la causa raíz: el subworkflow 01 Clasificador (`1PXcg3dOQBt8hrrT`) estaba construyendo el historial desde `leadFields.Historial_Mensajes` (campo de Airtable, siempre vacío) en lugar de `inp.historial` que sí viene de G54. El Clasificador también inicializaba `datosRecolectados` desde campos Airtable-style (`leadFields.Articulo`, `leadFields.Nombre_Contacto`, etc.) ignorando `inp.datosRecolectados` de G54.

Se aplicaron 4 correcciones al Clasificador: (1) agregar `const g54Data = inp.datosRecolectados || {}` para leer datos G54; (2) cambiar `historialRaw = leadFields.Historial_Mensajes || ''` por `historialRaw = inp.historial || leadFields.Historial_Mensajes || ''`; (3) usar g54Data como fallback en todos los campos de datosRecolectados (producto, medidas, fecha, tipo_cajon, proteccion_extra, correo_contacto, nombre_cliente, tipo_flujo); (4) leer estado desde `inp.estado` primero. Se pusheó via API: actualizado a las 19:25:09 UTC.

Se confirmó el formato del historial en G54: `"Cliente: Hola\nAgente: Buenos días\n..."` — texto plano por líneas, compatible con el template `usuarioIA`. También se confirmó que `datos = {}` en la respuesta de G54 (el endpoint `POST /api/agent/whatsapp/inbound` solo recibe mensajes, no persiste los datos estructurados). Esto significa que la lógica `calcProximoPaso` no puede reconstruir el estado exacto de la conversación entre sesiones, pero sí tiene el historial para que el AI derive contexto. Pendiente: evaluar si Walter puede agregar soporte para `datos` en el endpoint de leads.

---

### 2026-07-01 (Martes)

El día comenzó retomando la sesión del día anterior con la tarea de revisar el Analytics AI y confirmar si lo nuevo encontrado en la API de G54 tenía algo aplicable. Para Analytics AI, el fix del Groq credential se había aplicado el 30 de junio pero la última ejecución programada fue el 29 (antes del fix), así que la próxima ejecución para confirmar es el 6 de julio. El Blog Publisher sí se pudo confirmar de inmediato: corrió hoy a las 13:00 en success, igual que el 29 y 30 de junio, con lo cual el fix del OAuth de "Testing" a "Production" quedó verificado.

En cuanto a los nuevos endpoints de G54 para nuestro scope, no había nada nuevo aplicable. `wa/leads` sigue sin implementarse por parte del Ing. Walter. Los únicos endpoints nuevos encontrados en sesiones anteriores eran los de artículos SEO, que son responsabilidad de Walter y no nos toca.

Lo que sí apareció fue un hallazgo importante: al listar los workflows encontré el Strategist AI v3.0 ("Tendencias", ID: `S62o0wcXq8Wfj67S`) que no estaba documentado en el CLAUDE.md. Es una versión más avanzada que v2.0 con integración de NewsAPI para detectar tendencias del sector, análisis con Groq, y disparo por webhook desde G54. Tenía tres errores críticos: la URL de G54 apuntaba a producción (`api.growth54.com`) en lugar del entorno dev, y dos nodos Groq tenían la API key `gsk_*` hardcodeada directamente en los headers, violando la regla de no datos hardcodeados. El nodo de Gemini también tenía la key hardcodeada en la URL. Se corrigieron los tres problemas: URL a dev, Groq a credencial nativa `jORffbRhRNohHT1B`, Gemini a referencia desde el Config node. Al intentar pushear al repo, GitHub rechazó el commit porque detectó la `gsk_*` en el historial de commits anteriores. Se tuvo que hacer `git reset --soft` para reescribir los dos commits problemáticos en uno solo sin la key antes de poder pushear limpio.

También se revisó el Community AI: tenía el mismo bug de `$vars.GROQ_API_KEY` que los demás, y además se confirmó que el endpoint `/api/n8n/pages/{pageId}` de G54 sí existe y responde con los tokens de FB/IG. Los errores alternados en ese workflow son comportamiento normal (webhooks vacíos de Facebook que se saltean correctamente). El Sales AI estaba perfecto desde el inicio con credencial nativa y todas las ejecuciones en success. Al cierre, los seis agentes de Módulo 1 están activos y con sus credenciales correctas. Queda pendiente confirmar Analytics AI el 6 de julio.

La segunda parte del día estuvo enfocada en el Distribution AI y el Strategist AI v3.0. En el Distribution AI se presentó el caso del post 42 que estaba atascado en estado "programado" desde el 26 de junio — no había lógica de recuperación. Se discutió la solución correcta: que si el Distribution AI falla al publicar, el post debe volver a "aprobado" para que el usuario lo reprograme desde el panel cuando quiera, en lugar de quedar en un estado sin salida. Se implementó eso renombrando el nodo de error a `♻️ G54: Revertir → Aprobado` con `status: aprobado`. El post 42 se eliminó directamente via `DELETE /api/agent/rrss/posts/42`, con lo que se confirmó que ese endpoint está activo.

En el Strategist AI v3.0 se encontró que la NewsAPI key había sido redactada por el secret scanning de GitHub al pushear — tanto en el repo como en n8n aparecía como `NEWSAPI_KEY_REDACTED`. Se restauró la key `de29024eefed4c2d813c639e92f73dd6` en n8n y se ejecutó el workflow via webhook. Completó exitosamente en 10 segundos y actualizó la estrategia en G54, aunque `trend_topic` quedó null porque no había suficiente cobertura de noticias recientes sobre embalaje industrial (comportamiento correcto). También se revisó el Genesis de G54 del 26 de junio verificando el estado real de los 6 requerimientos para Walter: 3 ya están listos por el lado del backend (DELETE posts, campos image_url/hook/cta existen en la API), 1 endpoint sigue sin implementar (GET wa/leads), y 2 son cambios de panel UI que Walter está revisando. Las 2 ideas de Instagram se dejaron en estado "idea" intencionalmente porque sin campo imagen en el panel no se pueden publicar en IG.

Hacia el final del día se trabajó en dos frentes más. Primero se hizo una migración masiva de todas las credenciales de Gmail OAuth2 a SMTP con App Password en los 11 workflows activos — mismo fix que se hizo al Error Reporter, para evitar que el token expire cada 7 días. Se migró cada nodo de envío de correo (gmail → emailSend) con la credencial SMTP `iWBBSSe5AWsCMo89`. El único nodo que se dejó en OAuth2 fue el de lectura de bandeja del Gmail Monitor, porque SMTP no puede leer correos, solo enviarlos.

Después se intentó publicar por primera vez un post real de Instagram (post 46, tema ISPM-15) usando el Distribution AI ya corregido. Ahí se descubrieron dos problemas nuevos: el primero es que el campo `imagen_url` en el editor del panel de G54 aparece visualmente y muestra preview, pero al dar Guardar Cambios el valor no se persiste en el backend — la API siempre devuelve `imagen_url: null`. El segundo es que `ig_user_id` también llega null desde el endpoint de páginas de G54. Ambos son bugs del backend de Walter. Como no había imagen válida, el Distribution AI revirtió el post correctamente a "aprobado", pero el panel lo seguía mostrando como "programado" porque la fecha programada quedó guardada. Se eliminó el post 46 via DELETE para limpiar el panel, igual que se hizo antes con el 42. Se preparó un Genesis actualizado (`genesis-g54-jul01.html`) con el estado de los 6 ítems anteriores más los 3 nuevos: bug de imagen_url, ig_user_id null, y el endpoint de wa/leads que sigue sin implementarse.

---

### 2026-06-30 (Lunes)

El día comenzó revisando el estado general de los workflows y encontré que el Analytics AI llevaba dos semanas fallando. Al comparar una ejecución exitosa del 20 de junio contra las fallidas del 22 y 29 se identificó la causa raíz: en la ejecución exitosa la credencial de Groq mostraba la key real, en las fallidas mostraba `None`. Esto confirmó que `$vars.GROQ_API_KEY` dejó de funcionar en n8n alrededor del 20-22 de junio porque la licencia del servidor dejó de soportar el feature de variables. Se corrigió el nodo Groq del Analytics AI para usar la credencial nativa en lugar del header manual con `$vars`.

Luego se investigó el Community AI que estaba marcado como pendiente. Al revisar las ejecuciones se encontró que los errores alternados no eran el problema reportado de "mensaje vacío" que me habían dicho, sino que son el comportamiento correcto: Facebook manda webhooks para eventos que no tienen texto (ediciones, likes) y el workflow los detecta y los salta limpiamente. No era un bug, era defensive code funcionando bien. Lo que sí necesitaba fix era que el nodo Groq de ese workflow tenía el mismo problema de `$vars` que el Analytics AI, pero eso se dejó para el 1 de julio.

Durante la revisión también se construyó un Content SEO AI para el Módulo 2, pensando que era responsabilidad nuestra. El usuario aclaró que el Módulo 2 y todo lo de SEO es responsabilidad exclusiva del Ing. Walter. El workflow quedó en n8n como referencia para Walter pero no entra en nuestro trabajo.

El avance más importante del día fue identificar y resolver la raíz del problema con el Blog Publisher, que venía fallando periódicamente cada siete días desde hace semanas. Se descubrió que el OAuth consent screen del proyecto `crating-express-seo` en Google Cloud Console estaba en modo "Testing", que es un modo de desarrollo donde todos los tokens OAuth se revocan automáticamente cada siete días. El usuario publicó la app al estado "Production" desde Google Cloud Console y desde las 18:00 del día el Blog Publisher corrió sin error. Lo confirmamos el 1 de julio cuando volvió a correr en success a las 13:00.

---

### 2026-06-25 (Miércoles)

El día arrancó porque Walter avisó que ya tenía lista su parte del archivo génesis y que algunas cosas que habíamos implementado no eran necesarias porque él ya las había resuelto por su lado. Con eso, lo primero fue verificar esa información para entender qué seguía en pie y qué había cambiado, y a partir de ahí revisar, corregir y probar cada agente uno por uno.

Lo que se hizo principalmente fue limpiar los agentes de la plataforma G54 que tenían información específica de Crating Express metida directamente en el código cuando no debería estar ahí. Las API keys de Gemini y Groq se reemplazaron con variables de entorno, y los IDs de página de CE quedaron como placeholders en el repo con los valores reales en n8n. También se implementó en Community AI y Distribution AI un sistema para que consulten automáticamente los datos de cada empresa desde G54 en lugar de tenerlos fijos, lo que es necesario para que la plataforma funcione con múltiples clientes. Además se registró el webhook del Community AI en Meta — se agregó un nodo que responde la verificación de Facebook, se configuró en developers.facebook.com apuntando a la URL con `?company=1`, y quedó verificado y funcionando con los campos `feed` y `messages` suscritos.

Al final se investigó si `ig_user_id` llegaba correctamente desde G54 API (devuelve null, pendiente que Walter lo rellene en el panel admin), pero resultó que no es un problema real porque el Content AI lleva semanas publicando en Instagram sin inconvenientes. Se desactivó un workflow duplicado de Analytics que estaba corriendo dos veces la misma tarea. También se confirmó que el frontend del panel admin de G54 no está en ningún repositorio conocido — pendiente confirmar con Walter dónde está ese código, porque se mencionó la posibilidad de agregar campos de credenciales de WhatsApp desde ahí. Todos los cambios quedaron commiteados y pusheados en la rama `claude/determined-curie-8emmm8`.

---

### 2026-06-19 (Jueves)

El día estuvo dedicado a estabilizar y completar el flujo de Marco (bot WhatsApp CE), retomando una sesión anterior donde el precio estimado ya aparecía en el chat pero quedaban bugs pendientes.

Se resolvió primero que Marco no se presentaba en el primer mensaje — solo preguntaba "¿Con quién tengo el gusto?" sin decir su nombre. Se hizo la instrucción de PRIMER_CONTACTO más prescriptiva: la respuesta debe comenzar con "Buenos días, soy Marco de Crating Express." y en el mismo mensaje confirmar los datos ya dados y preguntar lo que falta.

Luego se encontró que la fecha se perdía entre turnos. El cliente podía decir "para el viernes" en el primer mensaje, Marco lo mencionaba en su respuesta pero no lo ponía en el campo fecha del JSON — así el sistema nunca lo guardaba en Airtable y lo volvía a preguntar después. Se agregó un fallback en 03 Parsear: si fecha sigue nula después del merge del JSON de la IA, el código extrae la fecha del historial+mensaje usando regex (mañana, hoy, días de la semana, formatos de fecha numéricos, etc.).

Se corrigió PEDIR_CORREO para que después de confirmar el correo el AI pregunte inmediatamente el siguiente dato pendiente en el mismo mensaje, en lugar de detenerse en "Anotado." y esperar al cliente.

PEDIR_PROTECCION recibió una lista explícita de negativos: "que no", "no gracias", "sin protección", "solo el cajón", "nada extra", "así está bien" — cualquiera de esos extrae proteccion_extra=false y avanza. También se agregó al sistemaIA la regla de que preguntas fuera del flujo se responden en 1 oración y luego se continúa con el dato pendiente.

LISTO_PARA_COTIZAR fue hecho más prescriptivo: "Di EXACTAMENTE este texto y nada más: 'Dame un momento para calcular el precio... 🔄'." Esto evitó que el AI preguntara "¿quieres proceder con la cotización?" antes de mostrar el precio.

POST_COTIZACION recibió tres ramas: cliente acepta → confirma y cierra; cliente se despide → "¡Hasta luego! 👋"; cliente no ha respondido → pregunta si quiere cotización formal. También se actualizó el regex de clienteAcepta en 03 Parsear para capturar "sisi" y variantes sin word boundary.

El correo al vendedor no llegaba porque los nodos `¿Lead Caliente?` y `📧 Notificar Vendedor` leían de `$('▶️ 04 Cotizador')` que fue eliminado en una sesión anterior. Se actualizaron para leer de `$('📝 Armar Mensaje Final')` que es el nodo correcto en la arquitectura actual.

Se varió el vocabulario de confirmaciones: antes siempre decía "Anotado", ahora alterna entre "Listo.", "Anotado.", "Ok.", "Entendido.", "Perfecto."

Al cierre el flujo completo funciona: presentación ✅, extracción de datos del primer mensaje ✅, orden correcto (medidas→correo→tipo→protección→fecha) ✅, estimado en WhatsApp ✅, cierre limpio ✅, correo al vendedor ✅. Esta es la versión estable de referencia.

---

### 2026-06-17 (Martes)

El día estuvo completamente enfocado en estabilizar y completar Alex WhatsApp CE. Se retomó la sesión con varios bugs pendientes de sesiones anteriores y se resolvieron uno por uno.

El primer problema fue que el VAPI voice agent guardaba las llamadas en Google Sheets mientras que Alex WhatsApp usaba Airtable — se migró el nodo de guardado en el workflow `FYKfTJBfgwsMpJV7` para que guarde en `WhatsApp_Leads` con los mismos campos (Nombre_Contacto, Estado, Descripcion_Lead, Origen="IA de ventas", Historial_Mensajes, Ultima_Actividad). De paso se reemplazó la Groq API key hardcodeada que tenía ese workflow por `$vars.GROQ_API_KEY`.

Luego se trabajó en Airtable — se identificaron columnas sin uso en WhatsApp_Leads: `Nombre` (vacía, sin uso), `Fecha_Inicio` y `Ultima_Interaccion` (redundantes con `Ultima_Actividad`). Se confirmó que ningún workflow las referencia y se indicó borrarlas manualmente. Los campos `Clasificacion` (Frío/Tibio/Caliente) y `Tipo_Interaccion` (Consulta/Cotización/Mixta) sí debían usarse — se actualizó el workflow `05-guardar-lead` para poblarlos: Clasificacion viene de `ctx.clasificacion`, Tipo_Interaccion de `d.tipo_flujo` con mapeo de valores.

El bug más importante del día fue el token de Airtable: el workflow `05-guardar-lead` tenía `Bearer AIRTABLE_TOKEN_PLACEHOLDER` literal en los nodos HTTP Request de crear y actualizar lead. Eso causaba que todos los POSTs fallaran silenciosamente, nunca se creaba el leadId, `esNuevo` siempre era `true` y Alex repetía el saludo en cada mensaje. Se descubrió que n8n Community no soporta `$vars` (requiere licencia de pago), así que se seteó el token directamente en n8n vía API igual que el resto de los workflows.

Junto a eso se corrigió el idioma: Alex respondía en español a clientes en inglés porque la instrucción de `PRIMER_CONTACTO` tenía "¿Con quién tengo el gusto?" hardcodeado y el `saludo` siempre era "Buenos días/tardes/noches". Se agregó `saludoEN` y se hizo el bloque `PRIMER_CONTACTO` condicional según `idiomaConversacion`. Hubo un bug de syntax (backslash sobrante antes del backtick de cierre de template literal) que se resolvió con manipulación de bytes directamente.

También se corrigió el mensaje de cotización: "Precio estimado: $414 USD" y el disclaimer salían en español aunque el cliente fuera en inglés. Se hizo bilingüe usando `ctx.idiomaConversacion` en el nodo `📝 Enriquecer con Precio` del workflow `04-cotizador`.

El email de notificación al vendedor llegaba con todos los datos en una sola línea. Se migró el nodo Gmail de texto plano a HTML con tabla estructurada: header rojo, filas por dato, separador de sección "Solicitud". Se usó `contentType: html` en las options del nodo.

Al cierre se limpió el perfil de WhatsApp de Alex (foto de ejecutivo, nombre CE ALEX, descripción, dirección, correo y web). Se investigó por qué no respondía llamadas — resultado: quien llamó usó WhatsApp call, no llamada telefónica real. VAPI solo maneja llamadas telefónicas al +1 786-788-0417. Se explicó que las llamadas de WhatsApp son peer-to-peer cifradas y Meta no expone API para interceptarlas — no es técnicamente posible conectar VAPI ahí. Se optimizó y subió el prompt de VAPI alineándolo con la personalidad de Alex WhatsApp: mismas políticas, catálogo completo, medidas en pulgadas, manejo de reclamos, cierre cálido bilingüe. Al equipo no le gustó la personalidad de Alex — quedaron en pasar instrucciones de corrección más adelante.

**Estado de Alex al cierre:** arquitectura blindada, lógica estable, guardado en Airtable funcionando, clasificación y tipo de interacción poblados, email HTML al vendedor, cotización bilingüe, saludo bilingüe. Pendiente: ajustes de personalidad según instrucciones del equipo.

---

### 2026-06-10 (Martes)

El día estuvo enfocado en limpieza, correcciones y orden general de los workflows de n8n. Se retomó una tarea pendiente de la sesión anterior: aplicar el banner y footer aprobado de Crating Express a todos los agentes que mandan correos. Se identificaron 10 workflows con nodos de email, se generaron los archivos corregidos y se pushearon a n8n. Sin embargo al revisar lo que se había hecho se detectó que varios de esos workflows son de la plataforma G54 y por regla no pueden tener nada hardcodeado de un cliente específico — el banner de CE en esos agentes significaría que si mañana se usa el mismo agente con otro cliente, el correo saldría con la imagen de Crating Express. Se corrigió el error: el banner quedó solo en los workflows exclusivos de CE (CE Blog, RRSS viejo, Generador de Temas) y se removió de los 6 workflows de plataforma G54.

Luego se trabajó en eliminar todos los reportes por correo de los workflows G54, ya que esa información se verá directamente en la interfaz de la plataforma. Se removieron nodos de email en Analytics semanal y mensual, Strategist v2 y v3, y en el RRSS Content AI v1.3 se eliminó toda la cadena de aprobación por email — el flujo ahora termina al guardar el post en G54 y la aprobación se gestiona desde el panel. El nodo de notificación al vendedor en Sales AI Motor se conservó porque es una alerta operacional, no un reporte.

Se verificó que los 8 workflows de G54 estén desactivados, confirmando que ninguno está en producción. Se hizo un censo completo de los 32 workflows en n8n: 11 activos y 21 inactivos. Durante ese proceso se encontró que Alex estaba renombrado como "Sistema de Conversión doble" por un problema de una sesión anterior — se corrigió el nombre a "CE WhatsApp Engine - Sistema de Conversión". También se detectó que el RRSS content generator para CE no estaba corriendo (el viejo inactivo y el G54 apagado), así que se reactivó el RRSS Automation original como puente mientras G54 no entra en producción. Se borraron 4 workflows que eran versiones obsoletas reemplazadas: Generador de Temas v1.2, CE WhatsApp Engine v1.2, CE Blog v1.2 y CE Email Outreach v1.2.

Al cierre hubo una conversación sobre el estado del marketing de CE en general. La conclusión fue que las herramientas están funcionando pero el canal orgánico de redes sociales tiene retorno muy bajo para un negocio industrial B2B en Miami, y que Google My Business es probablemente el canal con mayor potencial inmediato. Quedó pendiente conseguir las instrucciones de lo que se necesita hacer en GMB para ver qué parte se puede automatizar desde n8n. Nomify se confirmó fuera de nuestro alcance — lo continúa otra persona.

---

### 2026-06-06 (Viernes)

El día arrancó revisando los errores de los workflows que tenían que correr esa mañana. Dos habían fallado: el Sales AI Motor y el CE Mantenimiento Web. El Sales AI Motor caía porque el nodo de follow-ups intentaba acceder a la configuración WA pero ese nodo no siempre está en el camino de ejecución, así que se envolvió en try/catch con fallback vacío. El CE Mantenimiento Web fallaba en el email de reporte porque el nodo de Config Empresa no está en el path de ejecución normal, se resolvió con una función inmediata con try/catch y fallback al email de admin.

Luego se revisaron los Analytics AI, que estaban funcionando pero con la Groq key vieja. Se actualizó la key en ambos (semanal y mensual) y se agregó continueOnFail en los nodos de Graph API de Facebook e Instagram para que si las métricas de Meta no están disponibles el reporte igual se genere. Se actualizaron los cuatro agentes restantes (Content AI, Strategist, Community AI, Sales AI Motor) con el G54_AGENT_TOKEN correcto y los headers de Groq en formato válido para n8n.

Se corrigió el Content AI para que el company_id sea dinámico desde el webhook en lugar de estar fijo en el Config node, y se eliminó la URL de Crating Express que quedaba hardcodeada en el CTA. En el Strategist se corrigió el formato del header de Authorization de Groq que estaba malformado y causaba ERR_INVALID_CHAR. El Community AI tenía un error más profundo: el objeto de conexiones apuntaba a un nodo con nombre inexistente, lo que causaba code:0 "Workflow could not be started" en cada ejecución. Se corrigió la referencia y el webhook pasó de GET a POST, quedando operativo.

Se probaron todos los agentes que tienen webhook con datos reales o ficticios. Content AI generó un post completo con Groq (Gemini falló por rate limit), lo guardó en G54 con ok:true y envió el email de aprobación, aunque ese último falló por OAuth de Gmail expirado — pendiente reconexión manual desde n8n UI. El Analytics AI se probó con datos ficticios realistas de Crating Express y generó el reporte completo con las secciones SEO/AEO/GEO, top contenido, bajo rendimiento y recomendaciones. En ese proceso se identificó que el agente recomendaba formatos como carrusel que G54 no publica automáticamente, así que se actualizó el prompt de ambos Analytics para que marque esas recomendaciones con la etiqueta "Recomendación manual — fuera de G54". El Sales AI Motor se probó con un mensaje WA simulado y procesó correctamente: extrae el mensaje, llama a G54 por empresa y productos, construye el prompt, genera respuesta con Groq y clasifica el lead. Falló el envío WA y el guardado del lead porque esos endpoints de G54 no existen aún, lo cual era esperado.

En la tarde llegó el documento Genesis RRSS G54 del desarrollador Walter, que es el plan maestro de lo que viene de su lado. Se revisó en detalle y se identificaron varias correcciones: el Distribution AI debía usar /posts/to-publish en lugar de filtrar por status, y /mark-published en lugar de PUT /status; el Analytics AI tenía el schema de métricas mal estructurado (G54 espera un array por plataforma con period_start y period_end, no un objeto plano); el Sales AI Motor estaba apuntando al endpoint equivocado para resolver la empresa, el correcto es /api/agent/wa/empresa-by-phone/{phone_number_id}; y los leads del bot WA deben ir a /api/agent/whatsapp/inbound que ya existe en G54. Se corrigieron los cuatro workflows, se verificó el schema de métricas en vivo (devolvió ok:true, created:2) y se subieron todos a n8n y al repo.

Al cierre se generó el documento genesis-agentes-g54.html para Walter, con el estado de los 7 agentes: descripción, webhook URLs, endpoints que usa cada uno, qué falta construir con el motivo técnico explicado, checklist de lo completado de nuestra parte y el patrón multi-tenant implementado. El documento queda como referencia técnica para coordinar el trabajo entre el equipo de backend y los agentes n8n.

---

### 2026-06-04 (Miércoles)

El día comenzó resolviendo un problema que se descubrió al probar el agente de estrategia con otra empresa: todo lo que generaba se guardaba siempre en Crating Express sin importar desde qué empresa se activara. Eso era porque el número de empresa estaba escrito fijo en el código. Se corrigió para que el agente reciba el número de empresa como parte del mensaje que lo activa, y se aplicó el mismo fix al agente de contenido. También se notó que al aprobar una idea desde el panel de G54 el sistema no estaba enviando correctamente el ID de esa idea — eso es un bug del lado de G54 que el equipo debe corregir; mientras tanto se dejó un parche para que el agente use la primera idea disponible.

En la tarde se construyó la versión 3 del Strategist AI, que ahora incluye un módulo para detectar temas de tendencia real en lugar de inventarlos. La idea es que por cada semana del plan se generen varias ideas de contenido normal y una basada en algo que esté pasando en el sector en ese momento. Para lograrlo se conectó a NewsAPI, un servicio que provee noticias reales en tiempo real. La IA revisa los titulares, elige el más relevante para la empresa, y luego hace una segunda consulta para verificar que ese tema tenga al menos 5 artículos publicados en los últimos 3 días — si no los tiene, la idea sale como contenido normal sin marcarse como tendencia. Se probó en vivo y funcionó: eligió el tema de "entregas el mismo día para manufactura" basado en una noticia real, la verificación encontró 145 artículos recientes sobre ese tema, y quedó guardado en G54. Pendiente para mañana: definir en qué idioma deben generarse los posts y cuál es la plataforma que el Strategist debe asignar por defecto a las ideas.

En la segunda parte del día se trabajó en multi-tenancy de G54. Se implementó el patrón de resolución de empresa via query param (`?company=N`) en Community AI y Sales AI Motor — ambos leen el param del webhook y lo usan como company_id, con fallback a company_id=1 (CE) mientras G54 no implemente los endpoints de resolución automática. Se discutió el proceso de Meta Tech Provider (necesario para manejar múltiples clientes con una sola App de Meta) y se decidió que por ahora cada cliente configura su propia App y usa el query param. Se documentaron los pasos y prerequisitos para iniciar ese proceso cuando haya muestras de funcionamiento.

Se reconstruyó el Sales AI Motor (`eCOX3ogMjToxZsh9`) desde cero como agente genérico limpio: eliminada toda lógica de CE (cotizador, cajones, medidas, tipo_cajón, ISPM-15, modo contingencia rule-based). El nuevo motor tiene webhook `wa-engine-g54` (WA) y `sales-ai-social` (FB/IG DM), `datos_actualizados` como objeto libre definido por el system_prompt del cliente, Groq + Gemini fallback, y estados de lead genéricos. Alex (`zAhV8gEsXD8dCrXq`, path `whatsapp-ce`) se mantuvo intocable. Workflow subido a n8n y activado. Todos los archivos commiteados en rama `claude/vibrant-volta-zUwsV`.

---

### 2026-06-03 (Martes)

Empecé revisando workflows del lunes y martes: CE Blog, Voice Agent Resumen y Gmail Monitor caídos por OAuth Google expirado. Se reconectaron las credenciales y quedaron operativos.

Luego confirmé que la estrategia del Strategist AI v2.0 está reflejándose correctamente en el panel G54 con todos sus campos. Se commiteó como "primera versión funcional". También evaluamos Open Claw y Hermes como herramientas externas — no aportan nada que no tengamos, solo se anotó el módulo de audio como sugerencia futura usando ElevenLabs.

Probamos el Content AI: el post llegaba vacío a G54. El bug era que el nodo `🖼️ Obtener URL de Imagen` borraba todo el contexto y el nodo de guardado leía `$json` vacío. Fix: referenciar los nodos de parseo directamente. Después del fix el post llegó completo con copy de Instagram y Facebook.

Pendiente para mañana: consultar idioma de posts (actualmente inglés) y plataforma predeterminada de las ideas.

---

### 2026-05-29 (Jueves)

El día estuvo enfocado en dos frentes: primero terminar de estabilizar Alex WhatsApp (el bot de Crating Express) y luego actualizar el Strategist AI para que lea las keywords de G54 en vez de generarlas por su cuenta.

Con Alex, se retomó la sesión con varios bugs activos. El primero era el loop de medidas: el nodo de instrucciones le decía literalmente "Pide las medidas" sin verificar si el usuario ya las había dado, así que Alex las pedía una y otra vez sin importar lo que dijera el cliente. Se corrigió con una instrucción condicional que primero revisa si el mensaje actual tiene algún dígito y si es así lo guarda, y solo si no hay dígitos pregunta. El mismo patrón se aplicó para el loop de fecha, donde el cliente decía "para el primero" y Alex no lo reconocía porque la instrucción no verificaba el mensaje actual antes de actuar.

El tercer bug fue el más profundo: la cotización nunca disparaba el paso POST_COTIZACION aunque el cotizador sí devolvía el precio. Se rastreó via la API de ejecuciones de n8n y se encontró que el nodo PATCH de Airtable devolvía 422 INVALID_MULTIPLE_CHOICE_OPTIONS porque el estado "Lead Caliente" no existe como opción válida en el campo Estado. Al fallar ese PATCH, el campo cotizacion_enviada nunca se guardaba en Notas, así que el flujo nunca avanzaba. La corrección fue cambiar "Lead Caliente" por "Calificado", que sí es válido. Junto a eso se corrigió el fallback del tipo de caja en el cotizador que usaba "cajon_cerrado" en vez de "cajones_cerrados".

Luego se discutió la estrategia de marketing para Crating Express. El Strategist AI ya existía pero tenía dos problemas: email hardcodeado como fallback aunque G54 ya tiene el correo correcto del cliente, y el agente generaba sus propias keywords en vez de usar las que ya están en G54 (35 keywords activas con intención categorizada). Se actualizó el workflow a v1.1: nuevo nodo que lee las keywords de G54, el contexto las agrupa por intención y las pasa a Gemini con instrucción explícita de usarlas sin inventar nuevas, y se quitó el fallback de email. El workflow se subió a n8n via API y el JSON quedó actualizado en el repo.

Quedó pendiente ejecutar el Strategist AI por primera vez para generar la estrategia real. Para que pueda guardarla en G54 se necesita el AGENT_TOKEN del panel admin. Una vez que exista la estrategia, el Content AI la usará automáticamente y el ciclo completo del Módulo 1 (RRSS) quedará operativo.

---

### 2026-05-22 (Jueves)

El día estuvo dedicado a atender las indicaciones del correo que mandó Don Walter ayer, donde señalaba los puntos de corrección necesarios para la entrega del proyecto. Antes de arrancar con los cambios, Don Walter se dio el tiempo de explicar cada punto con detalle para que no hubiera confusiones ni errores en la implementación.

Con eso claro, se trabajó en Nomify: se completaron ajustes pendientes en los archivos HTML del frontend, se eliminaron archivos obsoletos de Netlify que ya no se usan, y se corrigió una página que había quedado sin actualizar de la migración anterior. También se resolvieron dos bugs que estaban pendientes y se actualizó la documentación general del proyecto.

Por la tarde se intentó levantar el servidor en Windows para probar el estado actual, pero una cadena de obstáculos menores no lo permitió y se dejó para mañana con calma.

Si Dios quiere, esta semana Nomify estará terminado y listo para uso real.

---


---

### 2026-05-11 (Domingo)

El día inició con un correo de error del workflow RRSS - Generador de Temas Semanales: el nodo "GSC: Top Keywords" falló porque el token OAuth de Google Search Console había expirado. Se diagnosticó el problema y se indicó el procedimiento para reconectar la credencial en n8n Settings → Credentials. El usuario lo resolvió por su cuenta y confirmó que el workflow volvió a correr correctamente.

Luego iniciamos la jornada con Alex, retomando el bot de WhatsApp después de haber pausado la planilla. La primera tarea fue reorganizar el documento de referencia de Crating Express que alguien había pedido organizar — se leyó el documento original desde Google Drive, se identificaron los problemas (sección de términos duplicada, datos bancarios sensibles expuestos, estructura caótica mezclando catálogo con FAQs) y se produjo una versión reorganizada en 8 secciones claras. Los datos bancarios fueron removidos deliberadamente por razones de seguridad. El documento reorganizado quedó guardado como nuevo Google Doc para revisión mañana lunes antes de reemplazar el original.

También se discutió la estrategia para conectar este documento con Alex: reemplazar el catálogo de Airtable con el contenido del documento en WhatsApp_Config, manteniendo el perfil de empresa en Airtable. Eso queda pendiente para cuando el documento sea aprobado.

Finalmente se acordó una nueva práctica: usar CLAUDE.md como bitácora de reportes diarios para que haya contexto completo en cada sesión nueva, con los últimos 14 días activos y el resto archivado en GitHub. Se configuró la sección en este mismo archivo.

Durante las pruebas de Alex se detectaron dos bugs: el bug de echo (Alex repite el mensaje del cliente al inicio de su respuesta) y el bug de "Hola de nuevo" (Alex responde con saludo genérico ignorando el mensaje actual cuando el cliente ya tiene un lead registrado). Ambos fueron diagnosticados — causa raíz: el campo `Instrucciones_IA` en Airtable `WhatsApp_Config` contenía guías de estilo de RRSS completamente equivocadas para el bot de WhatsApp, y el nodo Groq solo tenía instrucción para el caso `esNuevo=true`. Se reemplazó el contenido de `Instrucciones_IA` con reglas de comportamiento correctas para el bot WA, incluyendo manejo explícito de cliente conocido y prohibición de repetir el mensaje del cliente.

Más tarde se hicieron nuevas pruebas y el comportamiento seguía siendo inconsistente. Se hizo un análisis profundo del prompt completo y se encontraron dos bugs estructurales: (1) el `Prompt_Sistema` tenía una regla que decía explícitamente "di Hola de nuevo" para clientes que regresan, contradiciendo directamente lo que `Instrucciones_IA` indicaba; (2) el MAPEO TIPO_CAJA_API usaba valores incorrectos (`cajon_cerrado`, `jaula_abierta`, `plataforma`, etc.) que no coinciden con los que acepta la API del cotizador (`cajones_cerrados`, `jaulas`, `plataformas_contenedor`, etc.). Se reestructuraron ambos campos completamente: `Prompt_Sistema` limpio sin reglas contradictorias, TIPO_CAJA_API corregido, `Instrucciones_IA` con comportamiento de cliente nuevo/conocido unificado y sin duplicaciones.

Pendiente al cierre: probar Alex con las nuevas instrucciones, publicar el draft de Netlify a producción desde el dashboard, y conectar el documento CE reorganizado con Alex una vez aprobado.

---

### 2026-05-10 (Sábado)

El día estuvo enfocado en cerrar varios bloques de la planilla Nicaragua y en organizar el respaldo en GitHub. Se implementó el sistema de roles completo para la web app: tres niveles (Admin, Planillero, Empleado), con autenticación por Netlify Identity y permisos por Airtable. Se creó la función me.js que cruza el JWT de Netlify con el campo Email y Rol en la tabla de empleados, y se actualizó auth.js con requireAuthRole(), isAdmin() y canEdit(). Se creó mi-recibo.html como vista exclusiva para empleados que solo pueden ver sus propias quincenas. En empleados.html se bloquearon los campos sensibles (salario, tipo, INSS, IR, email, rol) para el rol Planillero y se ocultó el botón de crear empleado.

También se corrigió el recibo de pago: el fallback de adelantos ahora muestra los registros individuales cuando existen, y se agregó la firma de "Quien entrega". Se renombró la sección "Deducciones" a "Otras Deducciones" en toda la navegación para distinguirla de préstamos y adelantos. Se documentó el plan de migración de auth para cuando se salga de Netlify hacia servidor propio con Express y MariaDB.

Por indicación de Don Walter se creó el respaldo de todos los workflows en GitHub bajo la carpeta PROYECTO-SOL/2026/, con 16 workflows organizados en 7 categorías, cada uno con su workflow.json y descripcion.txt. Durante el proceso GitHub bloqueó el push por un token de Airtable hardcodeado en los JSONs — se limpió con sed y se reescribió el historial con git reset --soft antes de poder pushear. También por indicación de Don Walter se renombró el repositorio de rrss-automatizaci-n a PROYECTO_SOL.

Al final del día se implementaron las vacaciones pagadas según ley nicaragüense: tasa corregida a 2.5 días/mes (Art. 76 CT), calculadora de pago en el modal con preview de bruto/INSS/neto, campo Monto guardado en Airtable al registrar vacaciones pagadas, y las vacaciones pagadas aparecen reflejadas en el recibo de pago filtradas por rango de quincena. El deploy quedó como draft en Netlify porque el token CLI no tiene permiso para --prod; queda pendiente publicar desde el dashboard.
