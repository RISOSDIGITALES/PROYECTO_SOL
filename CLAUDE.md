# PROYECTO SOL — G54 Platform + Crating Express + Nomify

## REGLA ABSOLUTA — G54 Platform

> **NADA específico de ningún cliente puede estar hardcodeado en los agentes de G54.**
> Los workflows de G54 (`workflow-strategist-ai-g54-v3.json`, `workflow-ideas-ai-g54.json`, `workflow-rrss-n8n-v13.json` (Content AI), `workflow-distribution-ai-g54.json`, `workflow-community-ai-g54.json`, `workflow-sales-ai-motor-g54.json`, `workflow-analytics-ai-g54.json`, `workflow-analytics-v3-meta-reporte.json`, `workflow-image-generator-g54.json`) son de la **plataforma**, no de CE.
> Cualquier restricción, prompt, configuración o dato de un cliente específico (incluyendo CE) va en:
> - El perfil de empresa en G54 API (`/api/n8n/companies/{id}`)
> - Airtable del cliente (solo para workflows CE-específicos)
> - El nodo ⚙️ Config del workflow con `continueOnFail` leyendo de G54
>
> **Workflows exclusivos de CE** (sí pueden tener lógica CE): `workflow-marco-ce.json` (Alex/Marco, ID `zAhV8gEsXD8dCrXq`) y sus subworkflows (01-06, Voice Agent, Telegram), `workflow-rrss-automation-ce.json` (puente legacy pre-G54)
>
> **Corrección 2026-07-24 (ítem 170):** `workflow-rrss-n8n-v13.json` (Content AI) estaba mal listado acá como "exclusivo de CE" desde el origen de este archivo — quedó desactualizado desde que se hizo multiempresa el 02-jul (ítem 79). Confirmado hoy con una auditoría completa que sí es 100% plataforma — corregido en esta regla. `workflow-analytics-ai-mensual-g54.json` (el ID viejo `BrH8GNURlqynJK1H`) quedó retirado el mismo día — nunca se había hecho multiempresa, tenía un token real de Facebook hardcodeado, y su función ya la cumple `workflow-analytics-v3-meta-reporte.json`.

## REGLA ABSOLUTA — Sincronización con GitHub

> **Todo commit hecho en una sesión debe empujarse a `origin/master` (GitHub, `RISOSDIGITALES/PROYECTO_SOL`) antes de cerrar esa sesión — sin necesidad de pedirlo cada vez.**
> La usuaria trabaja desde dos computadoras distintas (oficina y casa), cada una con su propio Claude Code corriendo en local. Si los commits se quedan solo en el disco de una máquina, la otra máquina jamás los ve — este archivo (CLAUDE.md) y todo el código quedan desincronizados entre las dos, y una sesión nueva en la otra computadora "no encuentra nada" aunque el trabajo ya se haya hecho.
> **Instrucción permanente, autorizada por la usuaria el 2026-08-21:** al final de cada sesión (o en cualquier punto natural de cierre), correr `git push` sobre la rama activa si hay commits locales por delante del remoto — sin preguntar primero, esto ya cuenta como autorización de antemano. Antes de cada sesión nueva, correr `git pull` (o `git fetch` + revisar si hay commits nuevos del remoto) para no trabajar sobre una copia vieja.
> Esto no cubre otras acciones de git de mayor riesgo (force-push, rebase, reset --hard, etc.) — esas siguen requiriendo confirmación explícita como cualquier operación destructiva.

## REGLA ABSOLUTA — Nunca secretos reales en un commit (hook automático desde 2026-09-17)

> **Instalado tras un incidente real, no como medida preventiva teórica:** el token del bot de Telegram de Marco quedó expuesto en texto plano en 11 commits distintos del historial público de GitHub durante casi 2 meses (27-jul a 17-sep) — y se confirmó que alguien lo explotó de verdad, mandando spam directo a un chat real sin pasar por nuestra infraestructura (ver ítem 346). Redactar secretos "a mano" antes de sincronizar cada workflow ya falló 11 veces seguidas con este mismo secreto — no alcanza como única defensa.
> **Hook `.githooks/pre-commit`** (versionado en el repo, no en `.git/hooks/` que no viaja entre clones) bloquea cualquier commit que contenga un secreto real con formato reconocible: token de bot de Telegram, keys de Groq/Gemini/OpenRouter, tokens de Facebook, tokens personales de GitHub. No reemplaza la disciplina de redactar — es la red de seguridad para cuando esa disciplina falla.
> **En una máquina nueva o un clon fresco del repo, el hook NO se activa solo** — correr una sola vez: `git config core.hooksPath .githooks`. Sin ese paso, el archivo existe en el repo pero git sigue mirando `.git/hooks/` y lo ignora.
> **Actualizado 2026-09-28:** el `G54_AGENT_TOKEN` dejó de ser una excepción. Este repo es público, así que ningún secreto real vive en archivos versionados: el token de la API de n8n, el de Netlify, la key de VAPI, el `G54_AGENT_TOKEN` y la contraseña maestra de G54 están en **`.secrets.local.md`** (raíz del repo, en `.gitignore`, formato `NOMBRE=valor`). El hook también lee ese archivo y bloquea cualquier commit que contenga alguno de esos valores.

## Pruebas pendientes (lista viva, actualizada el 2026-10-05)

Cambios ya hechos y probados por partes (código de producción con entradas simuladas o flujos temporales), que todavía no se confirmaron con un caso real de punta a punta. Al confirmar uno, sacarlo de acá y anotarlo en el ítem del changelog que corresponda.

1. ~~Foto real a Marco por WhatsApp~~ — confirmada el 16-oct con la conversación real de Lu (ítem 440).
2. **Nota de voz y PDF a Marco por Telegram** (ítems 397, 399 y 405): la foto ya quedó confirmada por la usuaria el 02-oct. La nota de voz falló ese día (credencial de Groq Whisper mal ubicada) y se arregló el 05-oct: volver a mandar un audio y confirmar que Marco responda según lo que se dijo. El PDF todavía no se probó.
3. **"Ejecutar seguimiento IA" enviado de verdad** (ítems 397 y 406): solo se probó con números inventados y con la ruta de Telegram en local. Telegram confirmado el 05-oct (la usuaria apretó el botón en su trato 210 y le llegó el mensaje; ejecución 19:27 UTC sin errores). Falta: por WhatsApp, escribirle a Marco desde un número real y, antes de 24h, apretar el botón. Probar también dos clics seguidos (el segundo no manda). Ojo: G54 responde `ok:true` aunque no se envíe.
4. **Informe mensual del 28-oct** (ítem 398): tiene que comparar contra la línea base del campo `linea_base`, sin buscar el informe #34, que ya no existe.
5. **Logo en los correos de Camila** (ítem 398): cuando Walter haga la pantalla de carga de `logo_url`, mandar un correo de prueba y ver el logo en la cabecera.
6. **Botón "Ejecutar" de Prospección (paso 7):** bloqueado. El flujo `jg5SENgRpe2wLBTn` está apagado por falta de la key de Google Places; falta que la usuaria decida si se saca la key o se le pide a Walter ocultar el botón.
7. **Llamada real a Marco por teléfono (VAPI)** (encontrado el 01-oct): el asistente sigue con `groq / llama-3.3-70b-versatile`, y Groq ya responde 404 `model_not_found` a ese modelo con nuestra cuenta (confirmado por el relay de Bubble). La última llamada real, del 29-sep, salió bien, pero no se sabe si VAPI usa nuestra cuenta de Groq o la suya. Llamar al +1 786-788-0417: si Marco no contesta o corta, cambiar el modelo del asistente (por ejemplo a `openai/gpt-oss-120b` en Groq, si VAPI lo ofrece).

## Próxima sesión — por dónde seguir (actualizado el 2026-10-23)

**Cómo trabajar (pedido de la usuaria, 23-oct):** de a poco, un paso por vez, de lo más chico a lo más grande, enumerando qué se hace y reportando el % de uso (`mcp__ccd_session_mgmt__get_usage`) al terminar cada paso. El límite semanal cerró en 87 % el 23-oct (se reinicia el domingo 25-oct 14:00 UTC); si pasa el 90 %, parar y avisar.

**Orden de trabajo (lo nuestro):**
1. **Bubble — seguimiento a contactos calificados** (pedido de Don Marc, 22-oct): Bubble no hace llamadas en frío; solo atiende y llama a quien ya nos contactó, después de calificarlo. Hoy solo existen devolver llamadas perdidas y recordar citas (ítem 494 de Bubble). Armar cómo sería, o si no se puede ahora, cómo y cuándo para verlo con el ingeniero. Incluir que el CRM guarde la prueba de que la persona nos contactó y aceptó el seguimiento (fecha, canal, texto).
2. **Bubble — último detalle de la auditoría** (`Bubble-54/docs/auditoria-2026-10-21.md`): el #62, el agente inventó un dato en la llamada de ejemplo ("antes de las 3 p.m."). Los otros 17 quedaron resueltos el 23-oct (ítem 453). Después, probar en una llamada real los puntos 5 a 7 de "Pruebas pendientes" del CLAUDE.md de Bubble.
3. **Bubble — pendientes de seguridad del 15-oct** (sección "Pendientes" del CLAUDE.md de Bubble, punto 7), más que el horario de llamadas salientes usa la zona del negocio y no la del cliente.
4. **G54:** el lunes 26 revisar que corrió la tarea `g54-programar-semana-26oct`; el 28-oct, que el informe mensual compare contra `linea_base`.

**De la usuaria (no se pueden hacer desde acá):** probar "Probar mi agente" con el agente de voz encendido (lo hace ella); reconectar Instagram de Crating Express (token vencido el 13-oct); avisar al vendedor que el estimado de Lu ($159) se hizo con medidas equivocadas; esperar las respuestas de Don Marc a las 6 preguntas legales (van en el reporte del 23-oct en Notion, ítem 453); permisos de estadísticas de LinkedIn.

**Del ingeniero:** los 14 pedidos de `PROYECTO-SOL/2026/09-G54/exodo-g54-oct13.html`.

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
G54_AGENT_TOKEN = <G54_AGENT_TOKEN — ver .secrets.local.md>
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
2. ✅ **Strategist AI v3.0 (Tendencias)** — construye y guarda la estrategia (ya no genera ideas, ver ítem 120). ID: `S62o0wcXq8Wfj67S`. Archivo: `workflow-strategist-ai-g54-v3.json`
3. ✅ **Ideas AI** — genera las ideas semanales siguiendo la estrategia ya aprobada, keyword→idea forzado con validación de coherencia. Webhook `ideas-ai-g54` + trigger semanal propio (mismo patrón de auto-despacho que el puente de Distribution AI). ID: `nHawWPIIu51ABBgl`. Archivo: `workflow-ideas-ai-g54.json`
4. ✅ **Distribution AI v1.0** — publica FB/IG via Graph API directo. ID: `IRCoya91PKPjpT1T` (el ID original `nmOjyvdfTkEo5FVJ` de la creación quedó desactualizado — el workflow se recreó en algún momento antes del 1-jul, corregido en la tabla el 14-jul). Archivo: `workflow-distribution-ai-g54.json`
5. ✅ **Community AI v1.0** — responde comentarios y DMs de FB/IG. ID: `62tIvF0snsrMj0sM`. Archivo: `workflow-community-ai-g54.json`
6. ✅ **Sales AI / WA Engine Motor (G54)** — agente de chat genérico WA + FB/IG DM. ID: `otycsrxrMEMuxuwD`. Archivo: `workflow-sales-ai-motor-g54.json`
7. ✅ **Analytics AI Semanal** — reporte lunes 8am. ID: `EX9K1AZwKeouSJ9G`. Archivo: `workflow-analytics-ai-g54.json` — **corregido 2026-07-18 (ítem 149):** el ID viejo documentado acá (`ocQAzbiftXXOfjct`) resultó ser el duplicado real, no este — quedó desactivado ese día tras confirmar que `EX9K1AZwKeouSJ9G` es el que de verdad tiene el webhook dual-mode y las ejecuciones reales desde el ítem 85
8. ✅ **Analytics AI Mensual** — reporte día 1 de cada mes (vía webhook bajo demanda, el trigger automático mensual sigue desactivado a propósito, ver ítem 149) + modo "Compartir" bajo demanda. ID: `YI9EfJYcWJN4bbM9`. Archivo: `workflow-analytics-v3-meta-reporte.json` — **corregido 2026-07-24 (ítem 170):** el ID viejo documentado acá (`BrH8GNURlqynJK1H`, "ANALYTICS MENSUAL — Reporte Mensual RRSS") resultó ser un duplicado nunca actualizado a multiempresa — con `G54_COMPANY_ID` fijo en `1`, sin webhook (solo Schedule + trigger manual), y un token real de Facebook hardcodeado en texto plano. Retirado (`[DUPLICADO INACTIVO]`, desactivado, secretos borrados) — su función ya la cumple mejor este ID desde el ítem 148

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
- **✅ Conectado al CRM de G54** (2026-07-14, ítem 126): además de guardar el lead de WhatsApp, ahora crea/actualiza un deal en `/api/crm/deals` (busca por teléfono en `GET /api/crm/board`, requiere login de sesión — credenciales master en el Config node, autorizado explícitamente por el usuario)
- **✅ Bug de token corregido — no respondía comentarios reales de Facebook** (2026-07-14, ítem 127): el token de FB guardado en G54 para la página de Crating Express es un Token de Usuario, no un Token de Página — Meta rechaza publicar comentarios con ese tipo de token (`"(#3) Publishing comments through the API is only available for page access tokens"`), aunque sirve para otras lecturas. Agregado nodo `🔑 Intercambiar Page Token (FB)` que canjea el token de G54 por el token de página real (`GET /{page_id}?fields=access_token`, mismo patrón que Analytics Semanal desde el ítem 85) justo antes de `🏢 Aplicar Config Empresa`. Confirmado en vivo: el error cambió de "solo tokens de página" a "el objeto no existe" (esperado, con un ID de comentario de prueba falso) — confirma que el token ya pasa la validación de tipo. De paso se borró un token real de Facebook que estaba hardcodeado como respaldo en el Config node (preexistente, no agregado en esta sesión).

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
- **✅ Bug de sintaxis corregido en `messages`** (2026-07-14, ítem 126): faltaba el `[` de apertura y el spread `...` al construir el array de mensajes — nunca se había detectado porque este workflow tenía cero ejecuciones reales antes de esa fecha. El guardado del lead ahora persiste el historial de mensajes correctamente.
- **✅ Conectado al CRM de G54** (2026-07-14, ítem 126): mismo patrón que Community AI — crea/actualiza un deal en `/api/crm/deals` después de guardar el lead de WhatsApp

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
- **AGENT_TOKEN confirmado:** `<G54_AGENT_TOKEN — ver .secrets.local.md>` — usar en `G54_AGENT_TOKEN` del Config node

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
| ~~DeepSeek (fallback WA)~~ | API Key | ❌ Fuera de uso — confirmado 2026-07-15 que ningún workflow activo lo referencia ya (reemplazado por Gemini como fallback de Groq, ver ítem 104). Credencial vieja sin usar (ID: `YSdODZVNFGSB3Ih9`) |

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
- **Client ID:** `<LINKEDIN_CLIENT_ID — ver .secrets.local.md>`
- **Client Secret:** guardado en LinkedIn Developer Portal (Autenticación → Secreto principal del cliente) — NO commitear
- **Token anterior encontrado:** formato no estándar — puede ser token viejo o de prueba — NO commitear
- **OAuth callback configurado:** `https://n8n.mdarthurdigital.com/rest/oauth2-credential/callback`
- **Duración token:** 2 meses (5184000 segundos)
- **Creada:** 30 de marzo de 2026
- **Para obtener Access Token:** LinkedIn Developer Portal → app CE → pestaña Autenticación → generar token con OAuth 2.0, o usar la credencial OAuth2 en n8n (ya tiene el callback configurado)
- **Aprobación por email**: usa `$execution.resumeUrl` de n8n + nodo Wait con webhook para flujo pausado

## n8n — Acceso

- **URL:** https://n8n.mdarthurdigital.com
- **API Token:** <N8N_API_TOKEN — ver .secrets.local.md>

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
- Fallback de Marco cuando Groq falla: Gemini, y si también falla, Modo Contingencia sin IA (ver ítem 104) — DeepSeek ya no forma parte de la cadena, confirmado el 15-jul que ningún workflow lo referencia

## VAPI — Marco Voz

- **API Key:** `<VAPI_API_KEY — ver .secrets.local.md>` (token actualizado 2026-06-19)
- **Assistant ID:** `69fedf52-005f-4cde-a87d-5b421e7911b9`
- **Nombre:** MARCO
- **Modelo:** llama-3.3-70b-versatile (en Groq)
- **Voz ID:** `onwK4e9ZLuTAKqWW03F9` (ElevenLabs)
- **Primer mensaje:** "Gracias por llamar a Crating Express, soy Marco. ¿Con quién tengo el gusto?"
- **Comportamiento:** empieza en español, cambia a inglés si el cliente habla inglés; NO recopila datos por voz — redirige a WhatsApp para cotizaciones
- **Workflow n8n:** `📞 CE Voice Agent — Marco (Fusionado)` (ID: `FYKfTJBfgwsMpJV7`) — guarda en WhatsApp_Leads. Nombre corregido 2026-08-22 — se llamaba "Vapi Webhook", renombrado en algún momento antes del 25-jul (ya notado como cambio de nombre en el ítem 175, nunca propagado a esta sección de referencia).
- **Resumen diario:** `📞 CE Voice Agent — Resumen Diario de Llamadas` (ID: `FTa48iKiRIMW5BNB`) — **inactivo desde el 29-jul** (ítem 204, desactivado a propósito junto con otros 6 workflows que mandaban correos de reporte; no borrado, disponible para reactivar).
- **Número:** +1 786-788-0417 (Twilio) — solo llamadas telefónicas reales, NO llamadas de WhatsApp (peer-to-peer cifradas, sin API)

## Otros workflows activos

> **Nota 2026-08-22:** esta tabla se corrigió tras una auditoría completa contra el estado real de n8n — 2 IDs (puente temporal y WA Reply Manual) ya no existen (fueron borrados en alguna sesión sin que quedara documentado el borrado en sí), y `CE Mantenimiento Web` figuraba como activo pese a estar desactivado desde el 29-jul.

| Workflow | ID | Trigger | Estado |
|---|---|---|---|
| ~~CE Mantenimiento Web - Calendario Automático~~ | `T9J845yE4sd8Dde5` | Diario 13:00 | ⛔ **inactivo desde 2026-07-29** (ítem 204) — no borrado |
| 📬 CE Gmail Monitor — Detectar Respuestas de Leads | `cJZV7jcwlbFoW5qJ` | Cada hora | ✅ |
| 🎙️ Marco CE — 06 Procesador de Medios | `5GU89AeWsBZ86FWa` | Sub-workflow (executeWorkflowTrigger) | ✅ 27 nodos — el bug del Switch de ruteo se corrigió el 16-jul (ítem 137); las 4 ramas (audio/imagen/PDF-Excel/Word-PowerPoint) están resueltas sin depender de ninguna API externa salvo la imagen (OpenRouter, key propia de la usuaria) — ver ítems 224-226. Único límite que sigue sin confirmarse: no se puede generar un `media_id` real de WhatsApp desde este entorno para una prueba 100% de punta a punta. |
| 🌐 Analytics Semanal — Webhook Trigger | `ALchVw1UdgFHuDbm` | Webhook `analytics-semanal-g54` | ✅ existe, sin ejecuciones — wrapper que llama a `📊 Analytics AI Semanal — G54` |
| ~~WA Reply — Envío Manual desde G54~~ | `IzsQTrOI2SMUJ4xx` | Webhook `wa-reply-g54` | ❌ **ya no existe en n8n** (confirmado 404 el 22-ago) — borrado en algún momento sin que quede registro de cuándo ni por qué |
| CE Cotizaciones - CF7 → Airtable + Leads | `FU8QG1BVmT4r5Kjw` | Webhook (Contact Form 7) | ✅ existe, sin ejecuciones nunca — ver nota abajo |
| 👁️ Vigía G54 — Supervisor RRSS | `zTm4tMOV9vMfUDnG` | Cada 2 horas + webhook `vigia-g54` (manual) | ✅ activo desde 2026-07-23, ver ítem 162 |

**Encontrados en diagnóstico del 2026-07-09** (no documentados hasta ahora, backup agregado a `PROYECTO-SOL/2026/`):
- **06 Procesador de Medios** — recibe audio/imagen/PDF/Office, transcribe con Groq Whisper, analiza imágenes con Gemini Vision, lee PDFs y convierte Office a texto vía ConvertAPI. Diseñado para que Marco pueda procesar archivos adjuntos por WhatsApp, pero el engine principal (`zAhV8gEsXD8dCrXq`) todavía no tiene el nodo que lo llame — construido pero no conectado.
- **Analytics Semanal — Webhook Trigger** — solo reenvía la llamada al workflow real de Analytics Semanal. Puede ser el punto de entrada pensado para que G54 dispare el reporte semanal por botón, aunque hasta ahora el semanal se ha estado ejecutando directo, no a través de este wrapper.
- **WA Reply — Envío Manual** — pieza de soporte para cuando un humano necesita responder manualmente desde el panel en lugar del bot; conecta con la lógica `¿Bot puede responder?` del engine principal.

**Encontrado en diagnóstico del 2026-07-10:**
- **CE Cotizaciones - CF7 → Airtable + Leads** (`FU8QG1BVmT4r5Kjw`) — recibe envíos de un formulario de contacto (Contact Form 7, plugin de WordPress) del sitio web de CE y los guarda en un Google Sheet de leads. Nunca tuvo ninguna ejecución — parece un flujo de antes de que WhatsApp/Marco fuera el sistema de leads actual. Según el usuario probablemente nadie lo usa, pero se deja activo sin tocar por las dudas (no se borra ni se desactiva).

## Workflows inactivos sin documentar — encontrados en auditoría del 2026-08-08

Ninguno corre en producción, ninguno tiene secretos expuestos (ya revisados), ninguno se tocó — quedan documentados acá para no perderlos de vista.

| Workflow | ID | Creado | Última edición | Qué es |
|---|---|---|---|---|
| CE RAQ1 | `cQ4AaHdRRT1YB9X0` | 2026-05-28 | 2026-06-30 | Prototipo de RAG (Retrieval-Augmented Generation) para Crating Express — chat trigger + Pinecone como vector store + embeddings de OpenAI, con un trigger de horario que recarga un Google Doc cada 5 minutos y lo vuelve a indexar. Parece un enfoque alternativo probado para Marco antes de asentarse en el diseño actual (system prompt grande con catálogo/FAQs embebidos, sin vector search) — nunca llegó a activarse. |
| 🔍 WP — Identificador de Tipo de Contenido | `ccz0vWzzDFzL8WsW` | 2026-06-08 | 2026-06-30 | 9 nodos, sin activar. Nombre sugiere clasificación de contenido de WordPress — probable experimento del Módulo 2 (SEO/AEO/GEO) de la época en que todavía no estaba claro que ese módulo es responsabilidad de Walter, no nuestra (ver REGLA ABSOLUTA al inicio de este archivo). |
| ✏️ WP — Editor de Contenido + Imagen + SEO | `qiLE0xIO2TYwcGRv` | 2026-06-08 | 2026-06-30 | 29 nodos, sin activar. Mismo contexto que el anterior — construcción de contenido SEO para WordPress con imagen, probable experimento del Módulo 2. |
| 📄 CE Voice Agent — Prompt desde Google Doc | `dRZr4Wfle0kMWv1r` | 2026-05-14 | 2026-05-14 (nunca tocado desde su creación) | 7 nodos. Sugiere un intento de que el prompt de VAPI/Marco Voz se leyera dinámicamente desde un Google Doc en vez de estar fijo en el panel de VAPI — superado por el diseño actual (prompt configurado directo en VAPI, documentado en la sección "VAPI — Marco Voz"). |

## n8n Tags — Marco

Tag `Alex` (ID: `2CrVJWitAB77MgTJ`) — nombre del tag sin cambiar en n8n, pero el bot se llama Marco.

| Workflow | ID |
|---|---|
| CE WhatsApp Engine — Marco | `zAhV8gEsXD8dCrXq` |
| 📞 CE Voice Agent — Marco (Fusionado) | `FYKfTJBfgwsMpJV7` |
| 📞 CE Voice Agent — Resumen Diario de Llamadas | `FTa48iKiRIMW5BNB` (inactivo desde 29-jul) |
| 📞→💬 VAPI → WhatsApp Handoff | `6UWT1GHKZVvCDcc6` (ID corregido 22-ago — `jfoJDSidx1sJlOrr`, documentado desde el ítem 141, ya no existe en n8n; el workflow real activo hoy con este mismo nombre tiene este otro ID, sin que quede registro de cuándo se recreó) |

### Pendiente / próximas mejoras
- [x] ~~Integrar API del cotizador~~ ✅
- [x] ~~Precio estimado en WhatsApp~~ ✅
- [x] ~~Correo al vendedor cuando cliente acepta~~ ✅
- [x] ~~Cierre de conversación (¡Hasta luego!)~~ ✅
- [x] ~~Cierre prematuro con "no gracias" ante recomendación puntual (tipo de cajón, protección)~~ ✅ — corregido 2026-07-10 (ver ítem 108). Causa real: regla de cierre en el prompt aplicaba a cualquier negativa, no solo al rechazo de la cotización completa. Confirmado con conversación real de 8 turnos.
- [x] ~~tipo_cajon no se actualiza al cambiar de opinión a mitad de conversación~~ ✅ — corregido 2026-07-15 (ver ítem 129). Causa real: la fusión de datos solo guardaba tipo_cajon si el campo estaba vacío, nunca lo dejaba sobreescribir. Confirmado con conversación real completa por el webhook.
- [x] ~~Activar LinkedIn en workflow RRSS cuando se tenga token~~ ✅ — hecho desde el 08-ago (ítems 251-254/261/256): token real conectado, Distribution AI publica en LinkedIn con y sin imagen, y Content AI ya genera un `copy_linkedin` de tono profesional distinto al de Facebook. Casilla corregida el 22-ago tras la auditoría — llevaba semanas resuelta sin marcarse acá.
- [x] ~~Recargar saldo DeepSeek o reemplazar fallback~~ ✅ — ya no aplica, confirmado 2026-07-15: DeepSeek no aparece en ningún workflow activo, el fallback de Marco es Groq → Gemini → Modo Contingencia desde el ítem 104 (09-jul). Pendiente obsoleto, se deja documentado por si queda saldo en la cuenta vieja para otro uso.
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
- **Deploy CLI:** `NETLIFY_AUTH_TOKEN=<NETLIFY_AUTH_TOKEN — ver .secrets.local.md> netlify deploy --dir=planilla-web --functions=planilla-web/netlify/functions --site=b1f602d3-324e-41c0-a034-1da91cadb946` (sin --prod para draft, con --prod para producción — producción puede requerir publicar desde dashboard)
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
7. ~~Deploy Netlify~~ ✅ Vía CLI (sin consumir minutos de build) — token: `<NETLIFY_AUTH_TOKEN — ver .secrets.local.md>`
8. ~~Sistema de roles~~ ✅ Completado: Admin/Planillero/Empleado, me.js, mi-recibo.html
9. **PENDIENTE:** Ingresar empleados reales, eliminar registros de prueba (María García, Carlos López, Ana Martínez, Roberto Sánchez)
10. **PENDIENTE:** Invitar usuarios reales a Netlify Identity + asignar roles en Empleados
11. **PENDIENTE:** Confirmar aportaciones + marcador de huella con quien corresponda
12. **BLOQUEADO:** Reinicio de n8n → activa VAPI handoff (no afecta planilla, cálculo ya es independiente)
13. **EN PAUSA:** Backend local Node.js/Express + MariaDB — esperar acceso al servidor propio

---

# Bubble 54 — se mudó a su propio repositorio

> **Desde el 2026-09-28 Bubble 54 vive en el repo privado `RISOSDIGITALES/Bubble-54` (copia local: `C:\SOLANGE RESPALDOS\Bubble-54`), con sus 101 commits de historial.** Todo trabajo de Bubble se hace ahí, nunca en este repo: ahí está su propio `CLAUDE.md` con la arquitectura, cómo levantarlo, las credenciales demo y su historial de cambios. En este repo ya no queda código de Bubble; las entradas viejas del changelog de abajo que hablan de Bubble/Vox54 quedan solo como registro.

---

## Modelo de reporte diario

El reporte se escribe en primera persona, en tono conversacional, siguiendo el orden cronológico del día. Incluye contexto humano (reuniones, personas involucradas, interrupciones), no solo lo técnico. Se menciona qué salió mal y cómo se resolvió. Termina con dónde se paró y por qué. Sin bullets ni headers internos — todo en párrafos corridos.

**Voz — regla explícita (agregada 2026-07-31 tras confusión real, cuarta corrección seguida sobre este mismo pedido):** primera persona significa la usuaria narrando su propio día, no Claude narrándole a ella. Nada de "vos/te dije/me pediste" — es un relato de una sola voz ("hoy revisé...", "encontré...", "decidí..."), tratando el trabajo hecho con la herramienta como su propio trabajo, exactamente como en el ejemplo real de 2026-05-05 más abajo.

**Entrega — regla explícita (agregada 2026-07-31 tras confusión real, segunda vez que pasa):** guardarlo en este archivo NUNCA es suficiente por sí solo. Cada vez que se pide "haz el reporte" (o equivalente), el texto completo se pega directo en el chat, en la misma respuesta — no un resumen, no un aviso de que ya se guardó, el reporte entero y tal cual quedó escrito. Guardarlo en CLAUDE.md es necesario para la bitácora, pero es un paso aparte del pedido real: que la usuaria lo lea ahí mismo.

**Extensión — regla explícita (agregada 2026-07-31, mismo día, tercera corrección seguida sobre este mismo pedido):** máximo 2-3 párrafos, sin excepción, sin importar cuántas cosas pasaron en el día. No es un resumen de todo lo que se hizo con lujo de detalle — es el pulso del día. Se condensan varios hallazgos relacionados en una sola frase en vez de dedicarle un párrafo a cada uno; se prioriza el hilo humano de la conversación (qué pediste, qué encontré, cómo seguimos) sobre el detalle técnico de cada fix, que ya vive en el changelog numerado si hace falta consultarlo.

**Corte de día — regla explícita (agregada 2026-07-16 tras confusión real):** el usuario marca el inicio de un nuevo día saludando ("Buenos días" o equivalente) al arrancar la conversación de esa jornada. Ese mensaje es el corte — todo lo que se documenta o reporta como "hoy" empieza ahí, nunca antes, sin importar si la sesión de Claude Code sigue siendo la misma conversación técnica que la del día anterior (esta plataforma no reinicia sesión por medianoche). Al escribir una entrada nueva en el changelog numerado o en la bitácora de reportes, verificar contra este corte antes de fechar algo como el día en curso — no asumir por la fecha del sistema ni por continuidad de la conversación. Si hay duda real sobre dónde cae el corte, preguntar antes de fechar, no adivinar — fechar mal un ítem del changelog es peor que preguntar.

**Ejemplo real (2026-05-05):**

El dia de hoy comencé revisando que agentes corrían hoy y que resultado había de pormedio, siendo el que comparte el blog en todas las redes y correo, este dió error en cuanto a compartir por linkedin por un error en una letra de credencial, luego de corregir y probar quedó arreglado, luego inicié con ALEX, Lo primero fue sacar el prompt de Alex del nodo de n8n y moverlo a Airtable, para que se pueda editar el comportamiento del bot desde fuera sin tocar el workflow. Para esto creé una tabla nueva llamada WhatsApp_Config donde vive el system prompt completo con marcadores {{CATALOGO}} e {{INSTRUCCIONES}} que se reemplazan en tiempo real al llegar cada mensaje. estuve probando APIS diferentes para el fallback hata tener respuesta positiva y quedarme con deepseek, luego tuve un espacio de tiempo en el que don Walter me ayudó a instalar la base para la computadora y pantalla, al momento ya quedó yo le estaré informando sobre como me acostumbro a ella, luego de eso tuvimos una reunión algo larga donde nos inforamamos sobre los avances, coincidencias y limites de mis agentes en coordinanción con los de él, me mostró varios agentes, me hizo algunas indicaciones a corregir y quedó en consultar el resto y avisarme sobre como proseguir, luego de eso me dió la API del cotizador interno para ALEX WHATSAPP, integré la API del cotizador directamente en el flujo de WhatsApp. Ahora cuando Alex tiene todos los datos (producto, medidas, tipo de caja) hace una llamada automática a POST /api/cotizar y le devuelve al cliente el precio estimado en el mismo mensaje, con un disclaimer que aclara que es un estimado y que el precio final puede variar. que en caso de requerir una cotización formal y precio oficial se le contactará por gmail, siendo el punto de conexión con el vendedor. También se actualizó la tabla de leads de WhatsApp para guardar más información por conversación: origen del lead, descripción para el vendedor, nombre del contacto y timestamp de última actividad. Los correos de notificación al vendedor ahora se leen directamente desde el campo de Perfil de Empresa, y soporta múltiples correos separados por salto de línea esta era una de las correcciones de don walter, En cuanto a la Planilla Nicaragua: se agregó un campo INSS_Base por empleado que permite calcular el INSS sobre salario mínimo o sobre salario completo según corresponda a cada persona. El motor de cálculo en n8n ya tiene esta lógica incorporada, por el momento estoy haciendo las pruebas con datos hipotéticos, es decir empleados ficticios, La web app de la planilla quedó desplegada en Netlify en planilla-nicaragua.netlify.app con autenticación por invitación activa, hasta ahí mi avance por ya la hora.

---

**Ítems 143 a 322 del changelog (2026-07-17 al 2026-09-02) archivados en `PROYECTO-SOL/changelog-historico.md`** — se movieron ahí el 2026-09-18 porque este bloque solo representaba el 62% del tamaño total de este archivo, cargado entero en cada sesión nueva — la causa real de que las conversaciones se quedaran sin contexto en horas en vez de semanas. Nada se perdió, es el mismo texto exacto. Si hace falta ese historial (Distribution AI, Marco, Community AI, Sales AI Motor, Analytics, Ideas AI, Content AI, las primeras semanas de Bubble 54), leer ese archivo puntualmente con la herramienta Read — no hace falta cargarlo entero.

**Ítems 323 a 440 (2026-09-04 al 2026-10-16) archivados en `PROYECTO-SOL/changelog-historico-2.md`** el 2026-10-23, mismo criterio. Leer ese archivo puntualmente con Read si hace falta.

441. **Las 5 fallas de Marco del ítem 440 corregidas y probadas** (2026-10-16, a pedido de la usuaria). (1) **Medidas** (`🔍 Parsear Respuesta IA`, SW03 `J8qbKOF7t4GnhRDT`): acepta separadores x, ×, *, /, "by" y "por"; convierte centímetros, milímetros y metros a pulgadas y pide confirmación ("Convertí 40 × 25 × 25 cm a 15.7 × 9.8 × 9.8 in. ¿Está bien?"); las medidas que el cliente da en el mensaje actual reemplazan a las guardadas, y las dimensiones que van al cotizador se recalculan siempre desde las medidas finales. Formato guardado: "16 × 10 × 10 in" (en `📝 Armar Mensaje Final` de WhatsApp y Telegram se saca la comilla de más). (2) **Fecha:** se rechaza "N/N/N", se rechaza un "16/10" de la IA si en la conversación aparece seguido de otro número, y la búsqueda de fecha de respaldo borra las medidas antes de buscar. (3) **Idioma** (`🌐 Detectar Idioma Entrada`, WhatsApp y Telegram): si el mensaje no alcanza para decidir (una foto descrita en español, un correo, "Ok", unas medidas), se responde en el último idioma claro de ese cliente, guardado por teléfono durante 14 días; `🔀 ¿Mensaje EN?` ahora usa `traducirEntrada` (solo traduce la entrada si el texto en sí está en inglés). El traductor ES→EN tiene contexto: cajón = crate, nunca "drawer". (4) **Reacciones:** `🔧 Extraer Mensaje y Teléfono` ignora `type:"reaction"`. (5) **Correo falso y aviso repetido:** si la respuesta afirma que algo ya se envió al correo y no es la aceptación, se reemplaza por la pregunta de la cotización formal; el vendedor se avisa una sola vez (`vendedor_notificado` en los datos del lead, leído también por el SW01 `1PXcg3dOQBt8hrrT`), y una segunda aceptación responde "Tu pedido ya está con un especialista…". Probado: 11 casos del analizador con su código de producción, la detección de idioma por separado y dos conversaciones reales por el webhook `whatsapp-ce` con números falsos que repiten la de Lu: todo en inglés, la reacción ignorada, cm convertidos, corrección a 16 × 10 × 10 aplicada, sin fecha falsa, estimado real de $142 y un solo correo al vendedor. Contactos de prueba 348 y 349 borrados (cascada). Copias del repo actualizadas con los secretos tapados. Telegram recibió los cambios de idioma y de estimado, pero no se probó en vivo. **Pendiente de la usuaria:** avisarle al vendedor que el estimado de Lu ($159) se hizo con medidas equivocadas y que el caso tiene señales de estafa, y reconectar Instagram en el panel.

442. **Corte de día 19-oct — diagnóstico limpio, Lu volvió a escribir, Instagram sigue vencido y no hay nada programado** (2026-10-19): 33 workflows (32 activos), 0 errores desde el 16-oct. Vigía, Marco y Gmail Monitor sin errores; hoy corrieron solos Ideas AI (solo Crating Express: ideas 551-554, 2 FB, 1 LI, 1 IG, cada una en su pilar; Orison sin ideas nuevas) y Analytics Semanal, que dejó el informe #46 (12 al 19-oct). Las corridas de Marco del 16-oct 14:02-14:09 son mis pruebas del ítem 441. **Lu (lead 347) volvió a escribir el 18-oct 20:10** ("Yes. I would like you to pack it"): Marco respondió en inglés (la traducción funcionó) con el mensaje fijo de que un especialista le manda la cotización formal, y le llegó otro correo de lead caliente al vendedor, el quinto de esta clienta: los cuatro anteriores fueron antes del arreglo, así que la marca `vendedor_notificado` recién se guardó ahora; el próximo "sí" ya no avisa. El post 194 (Facebook) se publicó el 16-oct con ID de Meta. El 196 (Instagram) sigue aprobado con el motivo del token: el token de Instagram de Crating Express sigue vencido desde el 13-oct (Meta, código 190), aunque `social-targets` lo da como `listo:true`. **No hay ningún post programado**: quedan 4 borradores y el 196. G54 sano; bundle del panel (`index-DQOw7Ddq.js`) y las dos docs (comparadas contra la copia del 08-oct) sin cambios.

443. **Semana programada con las ideas del 19-oct, sin Instagram** (2026-10-19): a pedido de la usuaria aprobé las ideas 551-554 y generé sus posts con Content AI (198-201). Los 4 tienen imagen y el código de origen, y ninguno tiene el link de n8n; el idioma sigue la keyword (199 y 201 en inglés). Al #200 (LinkedIn) se le sacó la línea "Descubre más y solicita tu cotización aquí" que estaba repetida. Programados a las 14:00 UTC: 198 Facebook el mar 20, 200 LinkedIn el mié 21 y 199 Facebook el jue 22; las 3 alarmas exactas quedaron en espera, cada una con su `post_id`. El #201 (Instagram) quedó aprobado sin fecha hasta que se reconecte Instagram, junto al #196.

444. **Instagram con respaldo de emergencia: si el token del canal de Instagram no sirve, Distribution AI publica con el de Facebook de la misma empresa** (2026-10-19), a pedido de la usuaria. Hasta hoy el único respaldo (ítem 348) cambiaba de servidor con el mismo token, así que con el token de Instagram de Crating Express vencido desde el 13-oct no publicaba nada. En `🔧 Preparar Datos Post` de `IRCoya91PKPjpT1T`: si el token de Instagram no lee la cuenta por ningún camino, pide `social-targets` de la empresa, toma el canal de Facebook, lo canjea por el token de página (`instagram_business_account` incluido), comprueba que llega a la cuenta de Instagram y publica por `graph.facebook.com` con ese token. Nada fijo por empresa. Es un respaldo de emergencia: solo funciona si la cuenta de Instagram está vinculada a la página de Facebook como cuenta comercial; si no, falla como antes y el post vuelve a "aprobado" con su motivo. Campo nuevo `IG_TOKEN_ORIGEN` (`instagram` o `respaldo_facebook`). Probado primero fuera de n8n con datos reales y después en real: el #196 se publicó en Instagram el 19-oct 15:28 UTC (https://www.instagram.com/p/DerlLuxHG1g/, media `18011096676003694`). Las 3 alarmas de la semana siguieron en espera. Respaldo previo en el scratchpad de la sesión; copias del repo sincronizadas con los secretos tapados. Sigue siendo recomendable reconectar Instagram en el panel. Después, a pedido de la usuaria, el #201 (Instagram) quedó programado para el vie 23-oct 14:00 UTC, con su alarma en espera (4 alarmas esta semana).

445. **Corte de día 20-oct — diagnóstico limpio** (2026-10-20): 33 workflows (32 activos), 0 errores desde el 16-oct. Vigía, Gmail Monitor, Marco y el relay de Groq sin errores. Lu (lead 347) volvió a escribir hoy 11:09 UTC ("Standard, basic packaging is fine"): Marco respondió en inglés que un especialista le manda la cotización formal y no se volvió a avisar al vendedor (se sostiene la marca `vendedor_notificado` del ítem 441). Hay 4 posts programados (198 Facebook hoy, 200 LinkedIn el 21, 199 Facebook el 22, 201 Instagram el 23, 14:00 UTC) con sus 4 alarmas en espera. G54 sano. Bubble: el MySQL de Laragon estaba apagado otra vez (el backend no arrancaba); se prendió `mysqld` de `C:\laragonin\mysql\mysql-8.4.3-winx64` y quedaron arriba el backend (8010) y el panel (5173).

446. **Retirados el número de WhatsApp y el código P de los posts; el correo de prueba que vio la usuaria era mío** (2026-10-20): la usuaria preguntó de dónde sacó Lu el número de Marco: lo publicábamos nosotros desde el 08-oct (ítem 412) en todos los posts (193, 195, 194 y 196 ya publicados; Google ya indexa el de Instagram). Lu no trajo código, así que copió el número de algún lado. Decisión de la usuaria: quitar el método. Hecho: (1) quitada la línea de los 5 posts pendientes (197 borrador, 198-201 programados) con `PUT /api/rrss/posts/{id}`, confirmado con relectura que siguen programados con el link de la web al final; (2) Content AI (`🔍 Parsear Post Español`) y Reels AI (`✍️ Armar y Guardar Texto`) ya no agregan número ni código; (3) Community AI sigue invitando a WhatsApp en sus respuestas (decisión del 14-jul) pero sin el código. Los posts ya publicados 193-196 siguen con el número (no se tocaron). El detector de código de Marco/Sales AI/Telegram queda, sin efecto. **Correo `lu.prueba16oct@example.com`:** sale de mi prueba del 16-oct 14:06 UTC (ejecución 77380, número falso +15550004445, ítem 441), que mandó un aviso real de lead caliente al vendedor; no es de Lu. Lu sí es un contacto real (+39 388 482 9817, mensajes de Meta, correo italiashaoxing@163.com, trato 220).

447. **La conversación de WhatsApp en el panel quedaba ilegible: arreglado cómo Marco la guarda** (2026-10-20), por una captura de la usuaria. La conversación de Lu (contacto 347) tenía 250 mensajes para 19 turnos, 212 de ellos la misma línea de foto. Causa en `☁️ G54: Sync Conversación` (SW05 `PqbfMghL0E7xKflC`): armaba los mensajes partiendo el historial por líneas y mandando las que tenían `] `; (1) las líneas viejas de foto ("[Cliente envió imagen] …") también tienen `] `, así que se reenviaban en cada turno y se acumulaban; (2) de los mensajes de varias líneas (descripción de la foto, el estimado) solo llegaba la primera. Ahora manda solo el mensaje del cliente de este turno (`texto`) y la respuesta enviada (`mensajeRespuesta`), completos. Probado con una conversación falsa de 2 turnos por `whatsapp-ce` (4 mensajes guardados, completos; contacto 350 borrado). Además, la descripción de las fotos (`🔧 Preparar Body Imagen` del `06 Procesador de Medios`) ya no se escribe como si hablara Marco ("¡Hola! Soy Marco…"): se pide en tercera persona. La conversación de Lu ya guardada no se puede limpiar (no hay forma de borrar mensajes sueltos); se reconstruyó completa desde los registros de n8n en un archivo aparte, fuera del repo (datos personales). Al reconstruirla apareció que la factura de Lu es de una subasta en EE. UU., con envío a Gallarate (Italia): parece una compradora real de subasta, más que una estafa.

448. **Corte de día 21-oct — diagnóstico limpio** (2026-10-21): 33 workflows (32 activos), 0 errores desde el 16-oct. Desde el 20-oct: Distribution publicó el #198 (Facebook) el 20-oct 14:00 con ID de Meta; Vigía cada 2h, Gmail Monitor y el seguimiento de Marco cada hora sin errores; la única llegada al webhook de Marco (20-oct 19:20) fue un aviso de Meta sin mensaje. Quedan 3 posts programados (200 LinkedIn hoy, 199 Facebook el 22, 201 Instagram el 23, 14:00 UTC, con imagen y sin link crudo) con sus 3 alarmas en espera; 4 borradores en Crating Express, Orison sin posts. G54 sano; bundle del panel (`index-DQOw7Ddq.js`) y las dos docs (comparadas contra la copia del 08-oct) sin cambios.

449. **Corte 21-oct: Bubble compartido por ngrok, auditoría y comparativo con Dapta** (2026-10-21): el trabajo del día fue de Bubble (ítems 486-491 de su repo: script de ngrok, ver contraseña, auditoría de 65 detalles con 43 corregidos, las 4 decisiones y el diseño nuevo de los correos, pendiente de que la usuaria lo confirme). Documento comparativo Bubble frente a Dapta en Claude Docs: https://claude.ai/artifact/UiLPotyTkYZ3qqQy5dNpcD. El túnel de ngrok quedó abierto en esta computadora (https://shoplift-manly-traps.ngrok-free.dev) mientras corra la sesión.

450. **Corte de día 22-oct — diagnóstico limpio** (2026-10-22): 33 workflows (32 activos), 0 ejecuciones con error o sin terminar desde el 21-oct. Vigía cada 2h (20 corridas), Gmail Monitor y el chequeo horario de Marco (39 cada uno) sin errores; el seguimiento de 23h/72h encontró 0 candidatos en todas. No llegó ningún mensaje de cliente a Marco (WhatsApp ni Telegram) ni conversaciones nuevas en G54. Distribution publicó el #200 (LinkedIn, 21-oct, `urn:li:share:…`) y el #199 (Facebook, 22-oct, confirmado en Meta, sin link de n8n); Community AI solo recibió el eco, frenado por `¿Es la propia página?`. Las 8 llamadas al relay de Groq son las pruebas de Bubble del 21-oct. Queda el #201 (Instagram, vie 23-oct 14:00 UTC) con su alarma en espera: el token de Instagram sigue vencido desde el 13-oct, pero el respaldo por Facebook (ítem 444) llega a la cuenta `crating_express`; Facebook y LinkedIn con token válido. **Después del 23-oct no hay nada programado** (4 borradores; 15 ideas de CE sin revisar, la última del 19-oct). Orison sin posts ni ideas nuevas. CRM de CE: 210 (la usuaria) y 220 (Lu) abiertos, sin cambios. G54 sano; las dos docs idénticas byte a byte a la copia del 08-oct y bundle del panel sin cambios (`index-DQOw7Ddq.js`). Pedidos del Éxodo sin cambios: sin `logo_url` ni `whatsapp_numero`, `mejor_plataforma`/`mejor_tipo_contenido` en `null`, `pedidos-grabacion` 404, sin `social_idea_id` en los tratos, `run-prospeccion` 502 y el cotizador sigue cargando el chat de prueba.

451. **Día 22-oct: tarea programada para la semana del 26, preguntas de Don Marc sobre "Agencia" y llamadas salientes en Bubble** (2026-10-22). (1) Las 15 ideas pendientes de Crating Express son de estrategias anteriores a la del 12-oct, y las 8 de la estrategia actual ya están usadas. Decisión de la usuaria: respetar la estrategia, nada el fin de semana. Tarea local `g54-programar-semana-26oct` (lun 26-oct 7:30 Managua): aprueba las ideas que genere Ideas AI ese día, genera los posts y los programa uno por día del martes 27 al viernes 30 a las 14:00 UTC (solo corre con la app abierta). (2) Recuperado el pedido del comparativo con Dapta (21-oct) y entregado enriquecido para reusarlo. (3) Respondidas en el chat las preguntas de Don Marc sobre qué es "Agencia" en Bubble: es la cuenta que paga; recomendación de lanzar a pymes directo, usar G54/MDA como prueba interna y dejar marca blanca para una segunda etapa. (4) Bubble (ítems 492-494 de su repo): diseño de correos confirmado con el botón en píldora y aplicado a todos los correos; llamadas salientes de servicio (devolver perdidas y recordar citas) con frenos de horario, topes, intentos, "No llamar" y aviso de asistente virtual, apagadas por defecto. Sin probar con una llamada real: decisión de la usuaria, esperar a gastar en Twilio. (5) La llamada de prueba de la usuaria sonó sin que nadie hablara: el agente de voz no estaba corriendo en esta computadora. Ahora la prueba muestra en vivo cómo va, avisa si el agente no entra y se puede cortar (ítem 495 de Bubble). Pendiente para el 23-oct: verlo en pantalla y probarlo con el agente de voz encendido.

452. **Corte de día 23-oct — diagnóstico limpio y comentarios de Don Marc del 22-oct** (2026-10-23): 33 workflows (32 activos), 0 ejecuciones con error. Desde el 22-oct: Vigía (14), Gmail Monitor y el chequeo horario de Marco (27 cada uno) sin errores; Distribution corrió hoy 14:00 UTC sin errores y el #201 (Instagram) ya no figura como aprobado ni programado (salió por el respaldo de Facebook del ítem 444). 0 alarmas en espera y ningún post en cola hasta que corra la tarea `g54-programar-semana-26oct`. Las 8 llamadas al relay de Groq son pruebas de Bubble del 22-oct. G54 sano; bundle del panel sin cambios (`index-DQOw7Ddq.js`). **Don Marc en el reporte del 22-oct:** (1) Bubble no hace llamadas en frío: solo atender y dar seguimiento a contactos que ya nos contactaron, previa calificación; si eso no se puede hoy, verlo con el ingeniero (cómo y cuándo). La captación se hace con anuncios y marketing escrito (email a contactos calificados), que es parte de la estrategia de venta de Bubble. (2) El abogado es él: pidió el detalle de lo que hay que confirmar sobre las llamadas salientes.

453. **Día 23-oct: 17 de los 18 detalles de la auditoría de Bubble y respuesta legal a Don Marc** (2026-10-23). A pedido de la usuaria se fue de lo más chico a lo más grande, un paso por vez y con el uso reportado en cada uno (81 % → 87 %). Detalle completo en el ítem 496 del CLAUDE.md de Bubble y en `docs/auditoria-2026-10-21.md`: pantallas y formato en inglés (#5, #6, #26, #27, #28, #38, #39, #41), Registros (#37: el servidor no mandaba especialista, motivo de error ni dirección), Integraciones (#40), errores de validación con el campo y en el idioma (#51), citas del panel (#52 correo, #53 teléfono en E.164, #54 reconfirmar y revincular) y agente (#63 colgar tras despedirse, #64 aviso en el idioma del saludo, #65 reloj de 15 s). Pruebas al cierre: servidor 564, panel 244, agente 113. Queda el #62. **Pendiente de confirmar por la usuaria:** la semana en español sigue empezando en lunes (en inglés, domingo). **Respuesta a Don Marc** (pregunta del reporte del 22-oct, "dame los detalles de lo que necesitas confirmar con un abogado"): las 6 preguntas (TCPA y voz de IA, FTSA de Florida y su horario en la hora del cliente, consentimiento para transcribir, listas "No llamar", CRTC de Canadá y qué guardar como prueba de consentimiento) quedaron en la entrada del 23-oct de RESUMEN DIARIO en Notion, con la observación de que las llamadas en frío no son seguras aunque sigan pasando (TCPA: 500 a 1.500 dólares por llamada). Las salientes siguen apagadas hasta tener sus respuestas.

## Error conocido

`API Error: 400 messages: text content blocks must be non-empty` — ocurre en la interfaz web de Claude Code (no en n8n) cuando el historial de conversación tiene bloques de texto vacíos tras llamadas a herramientas. Es un bug de la plataforma. Si ocurre: iniciar nueva sesión; este archivo CLAUDE.md proporciona todo el contexto necesario automáticamente.

## Historial de cambios relevantes

Ítems 1 a 142 (hasta el 2026-07-16) y la sección vieja de Nomify (fuera de nuestro alcance) archivados en `PROYECTO-SOL/changelog-historico-2.md` el 2026-10-23.

---

## Reportes Diarios

> Los últimos 14 días. Anteriores archivados en `PROYECTO-SOL/reportes/`.

---

### 2026-10-23 (Viernes)

Arranqué con la rutina de G54, todo en orden, y seguí con los pendientes de Bubble de lo más chico a lo más grande, uno por uno, cuidando el uso. De los 18 detalles de la auditoría quedaron resueltos 17: varios de pantalla y de inglés, Registros que no marcaba cuando alguien pidió un especialista, citas que perdían el correo o duplicaban clientes, y tres del agente de voz (el aviso en el idioma del saludo, que no corte una reserva y que cuelgue después de despedirse).

Todo quedó subido y con las pruebas en verde; lo del agente falta probarlo en una llamada real y solo queda un detalle, un dato que inventó el agente. Paré con el uso en 87 % y en Notion dejé las seis preguntas legales para Don Marc (ítem 453).

---

### 2026-10-22 (Jueves)

Arranqué con la rutina de G54 pidiendo que fuera muy meticulosa, y todo estaba en orden: sin errores, se publicaron los posts de LinkedIn y Facebook y mañana sale el de Instagram con el respaldo de Facebook, porque el permiso de Instagram sigue vencido. Cuando quise programar el fin de semana resultó que no hay ideas nuevas de la estrategia actual (las 15 pendientes son de estrategias viejas), así que decidí respetar la estrategia y dejé una tarea programada para el lunes 26 que aprueba las ideas que salgan ese día, genera los posts y los programa de martes a viernes. También recuperé el pedido de ayer del comparativo con Dapta para tenerlo mejorado, y respondí las preguntas de Don Marc sobre qué significa "Agencia" dentro de Bubble.

Después confirmé el diseño nuevo de los correos de Bubble, dejando el botón como estaba, y pedí que ese estilo quedara en todos los correos; solo el resumen de llamada y el aviso de escalación tenían piezas propias y ahora se ven igual al resto. Luego pregunté si podíamos hacer llamadas automatizadas salientes a los clientes: se puede, pero por las leyes de EE. UU. y Canadá conviene solo para servicio a clientes que ya tienen relación con el negocio, así que construimos dos funciones, devolver llamadas perdidas y recordar citas, con horario, topes de llamadas e intentos, "No llamar", aviso de asistente virtual y detección de contestador, las dos apagadas por defecto.

Quedó todo subido y con las pruebas en verde, pero no lo probé con una llamada real porque decidí esperar a cuando gastemos en Twilio, y antes de lanzarlo conviene que un abogado confirme la parte legal. Al final probé yo misma la vista de negocio: en la llamada de prueba sonó mi teléfono pero nadie habló, porque el agente de voz no está corriendo en esta computadora, y además el aviso de "te estamos llamando" nunca se iba y no se podía cortar. Hicimos que la prueba muestre en vivo si está sonando, si atendí y si el agente entró, con un botón para cortarla, y lo dejé pendiente para mañana verlo en pantalla y probarlo con el agente de voz encendido.

---

### 2026-10-21 (Miércoles)

Arranqué con la rutina de G54, todo en orden, y seguí con lo de ayer: dejar Bubble listo para que Don Marc lo pruebe con ngrok. El comando del token se me partió en dos líneas y no funcionaba, pero ya quedó cargado y el link funcionó; la primera vez a Don Marc le salía el aviso de ngrok, después entró. Al verlo pedí el ojo para ver la contraseña, que quedó en todos los campos, y le pasé la cuenta de agencia que tiene todos los ejemplos para que viera cómo se ve con datos.

Después pedí una auditoría completa de Bubble para pulir detalles: recorrimos todas las pantallas en computadora y celular, más dos revisiones del código, y salieron 65 detalles en un registro. Se corrigieron 43: pantallas que se salían del borde en celular, duraciones y horas mal escritas, "bot" y "agente" mezclados, avisos de carga que faltaban, mensajes de error con nombres técnicos y varias cosas del agente de voz, como avisar y cortar cuando está pausado o despedirse antes de colgar. En el camino una coma de más dejó el panel con error por unos minutos, también en el link de Don Marc, y se arregló al momento. Después decidí las cuatro dudas que quedaron: cada número de llamadas dice qué cuenta, se ocultan los nombres de los proveedores, el aviso de compra ya no muestra el costo de Twilio y el número solo lo compra la agencia.

Cerré con dos pedidos más: un documento comparativo de Bubble con Dapta (estética, contenido, funciones y precios, con fuentes y con lo que no se pudo verificar, porque su panel pide cuenta), y el diseño de los correos, que ahora llevan burbujas en la cabecera, el título más delgado y botones más cuadrados. El diseño quedó guardado y lo confirmo mañana; lo del agente de voz sigue sin probarse en una llamada real.

---

### 2026-10-20 (Martes)

Arranqué con la rutina de G54, todo en orden, y levanté Bubble, que no arrancaba porque la base de datos estaba apagada otra vez. Me pregunté de dónde había sacado Lu el número de Marco, y resultó que lo publicábamos nosotros en todos los posts desde el 8 de octubre, junto con el código de origen; decidí quitar ese método porque no nos decía nada, y quedó fuera de los posts pendientes y de los agentes que los escriben. El correo de prueba que vi en su trato no era de ella, era de una prueba nuestra del 16. También vi que la conversación de Lu en el panel era ilegible, con la misma línea de foto repetida cientos de veces y los mensajes cortados; lo arreglamos para que Marco guarde cada mensaje completo una sola vez, y como lo ya guardado no se puede limpiar, me reconstruyeron la conversación completa aparte para poder leerla. Leyéndola, Lu parece una compradora real de una subasta y no una estafa.

Después pedí una Ayuda de Bubble mucho más completa, módulo por módulo, con accesos directos y capturas, y quedó reescrita con conceptos, pasos, un glosario, botones para ir directo a cada pantalla y capturas en español y en inglés con datos inventados. Revisándola salieron varias cosas que arreglamos: que se pueda mover una cita, editar el correo de un cliente, que el teléfono cuente en el perfil y que el operador no vea botones de crear, entre otras. También decidí que la prueba gratis dure 30 días y que, sin suscripción, se pierda el acceso. Actualicé la lista de pruebas con todo lo nuevo, y en el gráfico de Inicio cambiamos un punto rosado que nadie entendía por una segunda barra con las citas al lado de las llamadas.

Al final quise que Don Marc pueda probar Bubble antes de subirlo al servidor, y quedó todo listo para compartirlo con ngrok desde esta computadora, que ya lo tenía instalado; solo falta que cree la cuenta y cargue el token, cosa que dejé para mañana. En el camino se me bajaron los servidores cuando abrimos el navegador de la sesión para revisar el gráfico, y los volvimos a levantar. Cerré con todo subido a los dos repositorios.

---

### 2026-10-19 (Lunes)

Arranqué con la rutina de G54, todo en orden, aprobé las ideas nuevas y dejé la semana programada sin Instagram, porque el permiso de Instagram venció el 13. Pensé que ese permiso era permanente y que Facebook servía de respaldo, pero no estaba armado así; lo construimos como respaldo de emergencia y con eso se publicó el post del 15 que había quedado trabado, y dejé el de Instagram de esta semana para el viernes 23. Igual tengo que reconectar Instagram en el panel.

Después seguí con Bubble y la lista de pruebas. Lo de la invitación que no me dejaba no era por tener gente en el equipo: mi correo ya tenía una cuenta de agencia y otra de negocio, y cada correo solo puede tener una de cada tipo; ahora el mensaje lo explica. También quedó explicado el cobro extra, el CSV sale con la fecha del día, y armamos el historial completo de actividad del equipo; además Registros, Llamadas, Clientes y Agenda se pueden filtrar por fechas, descargar y mandar por correo a alguien del equipo.

En la tarde fui pidiendo cambios uno por uno: las burbujas de idioma también adentro del panel, que la configuración guiada no deje saltar pasos y avise que son las configuraciones básicas, y el menú lateral que se despliega hacia la derecha con los nombres, que me costó varias vueltas hasta que la "I" de Inicio dejó de verse cortada. Cerré con la página pública de Bubble con los tres planes, que lleva a un registro en pasos (plan, datos, pago y listo) y termina en el ingreso; el pago todavía no cobra y avisa que la cuenta empieza en prueba. Ahí paré por hoy, con todo subido.

---

### 2026-10-16 (Viernes)

Arranqué con la rutina de G54 y apareció algo importante: Marco atendió por WhatsApp a una clienta real, Lu, que quería embalar una escultura de coral para mandar a Hong Kong, y la conversación tuvo varias fallas. Le cotizó con las medidas equivocadas (tomó como pulgadas los centímetros que ella dio, y $159 salió de ahí), sacó una fecha falsa de las medidas, le contestó varias veces en español aunque ella escribía en inglés, respondió a sus reacciones con emoji, le dijo que el estimado ya se le había mandado por correo cuando no era cierto, y al vendedor le llegó el aviso cuatro veces. Además, Instagram no publicó el post del 15 porque el permiso de la cuenta venció el 13. Corregimos las cinco fallas de Marco y las probamos repitiendo la conversación de Lu con números falsos; ahora convierte los centímetros y pide confirmación, sigue en inglés todo el tiempo y avisa al vendedor una sola vez. Me quedan dos cosas: avisarle al vendedor que ese estimado está mal y que el caso tiene señales de estafa, y reconectar Instagram en el panel.

Después levanté Bubble para hacer las pruebas manuales de la lista, que primero no arrancaba porque la base de datos estaba apagada. Probando vi que el buscador de la Ayuda de la agencia no encontraba "silencio": no era el buscador, sino que a la agencia le faltaban todas las guías del agente de cada negocio, y quedaron agregadas. Terminé la primera vuelta de la lista con 30 pruebas que funcionan, 6 que fallan (sobre todo en Equipo, Planes y el CSV de llamadas) y 9 que no pude probar, y la lista quedó mostrando solo lo que falta.

Después seguí con las fallas. En Equipo, "Sacar" ahora aparece en todas las cuentas: si es la única persona de un negocio, explica por qué no se puede y ofrece invitar a otra, y quedó escrito dónde se cambia el rol, que no encontraba porque en mi equipo no había nadie a quien cambiárselo. En Planes decidí que al bajar de plan los negocios no se borren sino que se desactiven: guardan todos sus datos, su agente queda apagado, no cuentan para el límite y se reactivan desde su ficha; lo probamos bajando a Inicial y después dejamos todo como estaba. Ahí paré, todo subido; me queda contar qué pasó con la invitación que no me dejó hacer, y después siguen la explicación del cobro extra y el CSV.

---

### 2026-10-15 (Jueves)

Arranqué con la rutina de G54, todo en orden y sin novedades en la API, y retomé Bubble: saqué las palabras técnicas que quedaban en los textos y Registros dejó de contar las llamadas de prueba. Después pedí una revisión completa y una lista de novedades para probar con espacio para comentarios, y al mirar la pantalla de Agencia me pareció que no estaba a la altura de lo que tiene que ser: la convertimos en el tablero que maneja todo (minutos, lo que requiere atención, actividad del equipo y la cartera de negocios) y sumamos roles de verdad en el equipo (administrador, operador que solo ve sus negocios y persona del negocio). Moví la plata a Configuración › Facturación, cargué datos de demostración para ver cómo se ven los avisos, y arreglé el CSV de llamadas, que era ilegible, para que además diga el motivo de cada llamada con error.

En la tarde armé las formas de pago estilo Claude: tres planes por cuenta (Inicial sin agenda, Pro y Agencia) con límite de negocios y de minutos, cobro extra con tope si se pasan, avisos al 80 % y bloqueos de lo que no entra en cada plan; todo hipotético, sin cobro real todavía. Saqué el número de la burbuja de Agentes porque me estorbaba. Cerré con una nueva revisión de seguridad y datos que encontró cosas reales: los PDF de los negocios se podían bajar con un truco en la dirección, la clave propia de IA viajaba completa al panel, una cuenta en prueba podía subirse al plan más caro sin pagar y algunas acciones no tenían tope. Quedaron corregidas, y a mitad de camino pedí que todo se pudiera borrar a mano para no repetir lo de G54: ahora se borran llamadas, clientes y citas con confirmación, y borrar una llamada no baja los minutos del mes.

Dejé todas las pruebas automáticas en verde (503 del servidor, 87 del agente y 196 del panel), la lista de novedades actualizada a 66 pruebas y todo subido a los dos repositorios. Ahí paré: lo que sigue son las pruebas manuales con esa lista.

---

### 2026-10-14 (Miércoles)

Arranqué la mañana con Bubble en la otra computadora. Primero arreglé que las burbujas que están detrás del texto en el ingreso y en la Ayuda no reventaban al tocarlas. Después armé la llamada de ejemplo dentro de "Probar agente", que decidí que fuera con audio: la plataforma simula a un cliente con los datos reales del negocio, conversa con el agente de verdad, y el dueño la puede escuchar con las dos voces o leer antes de recibir su primera llamada. La primera prueba mostró que el cliente simulado cortaba antes de tiempo y que el agente avisaba al especialista en cada respuesta porque no recordaba lo que ya había hecho; lo corregí en la llamada de ejemplo y dejé para después hacer lo mismo en el chat de prueba.

Ya en la tarde retomé desde la otra computadora y encontré que acá no está la base de datos de desarrollo, así que las pruebas las corrimos sobre una base aparte y temporal sin tocar nada de lo mío. Le pasé al chat de prueba la memoria de lo que el agente hizo en cada turno, y para probarlo con la inteligencia artificial real tuve que apagar la VPN dos veces, porque Surfshark se volvía a conectar solo. Con la memoria, el agente pasó de avisar al especialista tres veces a una sola, pero al saber que ya había avisado empezó a contestar cosas que no estaban en sus datos, como que hacían entregas a 40 millas o que ofrecían degustaciones. Probando apareció además una falla de antes: cuando el negocio tiene los precios ocultos, el agente inventaba uno (dijo $45 por una torta que cuesta $25). Las dos quedaron corregidas y las comprobé varias veces: ahora dice que no tiene ese dato y que el equipo se lo confirma.

Cerré con todas las pruebas en verde (453 del servidor, 84 del agente y 183 del panel) y todo subido al repositorio. Paré ahí porque para seguir trabajando en esta computadora con los negocios de prueba primero hay que traer la base de datos de la otra máquina; de la lista quedan el repaso de los textos con palabras técnicas y decidir si Registros cuenta las llamadas de prueba.

---

### 2026-10-13 (Martes)

Con Bubble armé la agenda centralizada de la agencia, que hasta hoy solo se veía negocio por negocio: ahora hay una vista con calendario y agenda, colores por negocio y el detalle de cada cita en una ventanita, todo con la estética de burbujas. De ahí seguí con una revisión general completa: resumen de cada llamada al dueño por correo, un aviso urgente cuando una llamada no se pudo atender y nadie tenía forma de enterarse, completar un negocio leyendo su propia página web, webhooks para que la agencia conecte su CRM externo, invitar gente al equipo, que el agente atienda solo en ciertos horarios y pase el resto a una persona, y que todos esos avisos se puedan apagar uno por uno. Armé también un chat de prueba para hablarle al agente por escrito sin llamar, usando exactamente las mismas instrucciones y herramientas de una llamada real — y ahí salieron dos fallas reales: el agente leía toda la lista de precios de un tirón y avisaba al especialista de más. Las corregí, y de paso confirmé que el modelo chico (20b) fallaba preguntas de catálogo que el grande (120b) resuelve bien, así que pasé el 120b a ser el modelo por defecto. Seguí con un asistente de arranque en 4 pasos para dejar un negocio nuevo listo, y un resumen en Inicio de "qué hizo tu agente" — pero a mitad de camino paré y simplifiqué todo eso: la guía de 4 pasos pasó a ser una ventana que aparece sola solo mientras falte algo, y el resumen quedó en una sola frase, porque estábamos saturando el Inicio. Dejé todo subido al repositorio.

---

### 2026-10-12 (Lunes)

Arranqué con la rutina de G54, todo en orden y la semana pasada publicada completa. Aclaré que la mezcla de inglés y español en los posts es a propósito, porque el idioma lo decide la keyword, y lo dejamos así. Después quise probar qué tan bien sigue el Strategist una dirección muy específica: el primer intento no pasó porque el texto superaba los 2.000 caracteres sin que el panel lo avisara (lo pedí en el Éxodo con un contador), y por un error se regeneró una vez sin mi dirección. Con dos pruebas comparamos: la primera inventaba datos (un certificado en 24 horas, un código que no existe) y no respetaba el embudo ni los Reels; lo arreglamos por código, y con una segunda dirección distinta salió casi todo bien. Aprobé las ideas de la estrategia nueva y dejé programados cuatro posts, uno por día de martes a viernes.

Después retomé lo que quedó a medias el viernes: el cotizador de Crating Express no manda las cotizaciones al CRM y además les muestra a los clientes un chat de prueba, así que dejé listo de nuestro lado el flujo que las recibe, los QR del cajón y de la tarjeta, y los pedidos para el ingeniero en el Éxodo. También probamos el botón "Actualizar semana", que nunca había funcionado y además duplicaba la semana, e hicimos que las ideas partan de los pilares de la estrategia, que no repitan siempre las mismas palabras clave y que la idea de tendencia no fuerce noticias que no tienen nada que ver, como una sobre Bali.

Cerré con Bubble: pedí que hiciera todas las pruebas posibles sin mí. Simulando conversaciones encontramos seis fallas del agente (fechas mal calculadas, el PDF que nunca consultaba y un correo que agendaba sin repetir, que en una prueba le pudo llegar a otra persona, entre otras) y quedaron corregidas; con llamadas automáticas confirmamos que atiende llamadas entrantes en inglés, que corta al llegar al tiempo máximo y que se disculpa si falla la IA. Lo más urgente para seguir es el plan de Groq, porque el gratis ya no aguanta una sola llamada movida. Al final hice una revisión completa y todo quedó en orden y subido.

---

### 2026-10-08 (Jueves)

Arranqué con la rutina de G54, todo en orden, y la volví a revisar a fondo cuando dudé de que hubiera mirado bien las dos API. Me consultaron por qué no tenemos interacciones ni vistas si estamos siguiendo la estrategia, y encontramos que el tono de la estrategia no llegaba a los posts: el idioma lo decidía cada palabra clave, y por eso mezclábamos inglés y español, tú y usted. Ahora la voz de marca la decide el Strategist y la respetan las ideas y los posts; queda regenerar la estrategia de Crating Express el lunes, antes de los posts nuevos. Como sugerencia para tener más interacción y más rápido: que Don Marc comparta los posts de LinkedIn desde su perfil personal, pasar a Reels de 10 a 15 segundos grabados en el taller, escribirles a los clientes que ya tenemos para que sigan la página y dejen una reseña, hacer publicaciones en colaboración con clientes y empresas de envío (con su permiso) y participar desde la página en grupos de negocios de Doral y Miami.

Con eso me metí con los Reels. Cada publicación ahora lleva un código de origen que Marco y los demás agentes anotan en el CRM, para saber qué post trajo a cada cliente. Armé el agente que escribe el texto del Reel cuando se sube un video y el que arma los pedidos de grabación, que salen del plan de grabación de la estrategia: si se muestra la mercadería de un cliente, solo con su permiso por escrito, y nunca con reseñas inventadas. La estrategia también decide en qué redes va cada Reel. Lo que falta del panel (subir el video, el resultado en dinero por publicación, ver los pedidos de grabación) quedó en el Éxodo para el ingeniero. Revisé Kimi y no tiene uso gratis, así que sumé Zhipu como respaldo en los agentes nuevos y OpenAI como último respaldo en toda la plataforma y en Bubble, listo para cuando tengamos la clave.

En la tarde leí la nota de Don Marc en Notion: el inglés tiene que ser el idioma principal de Bubble y el español el alterno. Lo dejé así de punta a punta: el panel, las cuentas nuevas, la voz y las instrucciones del agente, la agenda, los correos y el CSV arrancan en inglés, las direcciones del panel pasaron a inglés y agregué dos pruebas automáticas para que ningún texto quede sin traducir. Falta que una persona nativa revise el inglés y probarlo en una llamada cuando haya saldo en Twilio. Cerré moviendo el idioma en Configuración para llenar el hueco y revisando la agenda: está completa dentro de Bubble, y falta probarla en una llamada, que el agente pueda mover o cancelar citas y avisarle al cliente. Dejé todo eso anotado como pendientes de mañana, y subido a los dos repositorios.

---

### 2026-10-07 (Miércoles)

Arranqué con la rutina de siempre en G54, todo en orden, y pedí el documento de números por país para Don Marc en HTML. Con la decisión de enfocar Bubble al 100 % en EE. UU. y Canadá me puse a refinar el inglés: encontramos que la voz del agente no cambiaba de idioma cuando el cliente hablaba en inglés y que nada le pedía a la IA contestar en inglés. Lo arreglamos junto con los códigos de desvío según la operadora (Verizon, AT&T, T-Mobile), y después tradujimos el panel completo con varios agentes en paralelo, sumando elegir el idioma al crear la cuenta y el resumen de llamadas, los correos y el SMS en inglés.

Al ver la pantalla de ingreso me di cuenta de que no había forma de crear una cuenta nueva, así que armamos el registro de agencias con confirmación de correo y una cuenta de prueba que no puede gastar en Twilio hasta que Growth54 la apruebe. Me registré con mi correo y llegaron los dos correos, así que pedí darles el estilo de Bubble, hacer más sencillo agregar productos y arreglar que el formulario de crear negocio se me cerró solo (se cerraba con cualquier clic afuera). El selector de idioma también quedó como burbujas de verdad.

Por la tarde pedí una revisión completa de Bubble: el código está bien conectado y los servicios responden, pero el agente de voz no está corriendo ni el sistema publicado, el saldo de Twilio está en 9.91 dólares y con el plan gratis de Groq solo alcanza para unas cinco llamadas al día (el plan pago cuesta menos de un centavo por llamada, eso lo comunico yo al equipo). Revisamos el inglés de punta a punta y las instrucciones del agente ahora van en inglés cuando atiende en inglés; arreglamos los puntos de facilidad de uso (zona horaria y voz al crear un negocio, la ficha en pestañas, borrar negocios, errores visibles y llamadas perdidas registradas), y cerré construyendo el correo de escalación con el estilo de Bubble, que avisa cuando el agente no puede resolver algo. Quedó todo subido; falta la llamada de prueba en inglés para escucharlo de verdad.

---

### 2026-10-06 (Martes)

Arranqué con la rutina de G54: todo en orden y nada nuevo del Éxodo; de paso confirmé que el post de Facebook del 8 de agosto ya no tiene el link técnico. Después retomé Bubble. En la tarjeta del número quedó primero mi número propio y el de EE. UU. como puente. La llamada de prueba no salía por dos errores nuestros (el interruptor activado sin guardar y una pieza de código que no existía); los corregimos y por fin el agente me llamó y conversamos, la primera llamada real de punta a punta. Le sacamos el "(demo)" a los negocios, las llamadas de prueba ahora aparecen marcadas en Registros y sin crear clientes, y las listas se actualizan solas.

Luego armamos el desvío: una ventana con los códigos según el país del número, opción de teléfono fijo, una guía completa en Ayuda y una comprobación automática que llama a mi número y avisa si funciona. Al probarlo con mi línea, la operadora aceptó el código pero no completó la llamada hacia el número de EE. UU. De paso encontramos un error grave nuestro de ayer: ninguna llamada entrante era atendida, porque el agente y la llamada se quedaban esperándose; ya quedó corregido.

Con eso investigamos números locales en Telnyx: abrí la cuenta, saqué la API y los precios reales mostraron que un número de Nicaragua cuesta $60 al mes, igual que Honduras, mientras EE. UU., Canadá, Europa y Brasil cuestan entre $0.50 y $3. La conclusión es que hoy Bubble es rentable sobre todo en EE. UU. (el mercado hispano), y que para Nicaragua hace falta una empresa local y negociar con Claro o Tigo. Lo dejé en un documento para Don Marc con las decisiones que necesitamos, y también respondí la consulta del ingeniero sobre anuncios pagados desde G54: se puede, pero no está construido. Ahí cerré el día, con todo subido a los dos repositorios.

---

### 2026-10-05 (Lunes)

Arranqué con la rutina de siempre: todo en orden en G54, el reporte semanal corrió solo por primera vez con la cadena nueva y confirmé que el seguimiento automático de 23 horas sale solo. Aprobé ideas y dejé la semana programada con 13 posts, dos por día hasta el domingo; borré un post de prueba y entendí por qué algunas imágenes salen con letras deformes (el modo de texto de los canales). Probé a Marco por Telegram: la foto funcionó, pero la nota de voz no, porque la transcripción estaba rota desde el 30 de septiembre, y quedó arreglada. Con el seguimiento de leads salió algo serio: al probar el botón sobre mi trato de Telegram se mandó un WhatsApp a un número ajeno de Montreal, que por suerte no se entregó. Ahora el botón usa el canal real del contacto, funciona también por Telegram (lo probé y me llegó) y el automático solo le escribe a quien dejó la conversación pendiente, no a los que ya pasaron a un especialista ni a las consultas.

En la tarde me fui a Bubble. Al verificar el número de Orison el SMS llegó como "AUTHMSG" y, al poner el código, la ventana se reiniciaba: la tecla Enter también guardaba todo el formulario. Quedó arreglado, con aviso de "Número verificado", el texto del SMS diciendo Bubble54 y un código nuevo en cada pedido. Después llamé a mi número esperando que contestara el bot y no pasó; tuvimos una discusión larga porque yo estaba segura de que con VAPI lo había hecho solo desde la plataforma, y resultó que aquella vez usé un número de Crating Express que ya es de la plataforma. Para un número propio hace falta activar el desvío con la operadora, en cualquier sistema. Con eso sumamos el botón "Probar mi agente: llamarme", para que el bot llame al número verificado, con Nicaragua habilitada en Twilio y un tope de 3 pruebas por día de 3 minutos.

Lo que más me preocupó fue descubrir que Twilio no vende números en Centroamérica, cuando lo elegimos justamente por su cobertura. Revisamos alternativas: Telnyx cubre más de 100 países, pero con cualquier proveedor cada país pide documentos por ley. Quedamos en que Growth54 presenta los documentos una vez por país, que cada cliente tenga su número puente sin ver ningún formulario, y que quien prefiera su número propio active el desvío con una ventana de pasos y comprobación automática en el panel. Dejé todo eso en un documento corto para Don Marc; falta abrir la cuenta de Telnyx para sacar la tabla real por país.

---

### 2026-10-01 (Jueves)

Arranqué el día pasándole al ingeniero las credenciales que me pidió para Bubble y con la revisión de siempre de G54, todo en orden. Después pedí una inspección de seguridad completa de Bubble y una comparación con la competencia, y salieron varios huecos reales: los códigos por SMS se podían pedir sin límite y los pagaba nuestra cuenta de Twilio, una agencia podía quedarse con el número de otro negocio y los PDF de los negocios quedaban públicos, entre otros. Los fuimos cerrando todos durante la mañana, junto con cifrar las transcripciones y dejar un registro de quién cambia qué. También encontré que la rama que el ingeniero iba a desplegar estaba vieja, así que eso se lo tengo que avisar. En G54 cerré los webhooks que podían mandar mensajes como si fuera Marco, cuidando que las respuestas manuales del panel siguieran funcionando.

Pregunté qué pasaría si diez empresas usan Bubble a la vez y apareció un error real: los números nuevos nunca se conectaban al puente de llamadas. Lo arreglamos, y una prueba de carga terminó sin errores con 100 llamadas al mismo tiempo, aunque los planes gratis de Groq y Cartesia siguen siendo el límite. Sumamos el aviso de "asistente virtual" en el saludo, que en Florida es obligatorio, y armé la agenda propia dentro de Bubble para que el agente reserve citas durante la llamada. De paso supimos que Groq retiró los modelos Llama y que Marco por teléfono todavía usa uno, así que tengo que llamarlo para confirmar que sigue contestando.

En la tarde revisé qué de lo que resolvió el ingeniero en el Éxodo sirvió. Generé una estrategia nueva para Crating Express y la línea base no se veía: resultó que sí se guarda y se muestra en el informe mensual, pero los números venían inflados por tratos de prueba, así que borramos 104, regeneré la estrategia y quedó limpia. Probamos el botón de seguimiento IA, el de Camila y el informe mensual, agregamos una revisión que frena los posts rotos antes de publicarlos, y dejé un lead de prueba para confirmar mañana a las 2:30 que el seguimiento automático sale solo. Cerré con una última revisión de seguridad sin hallazgos y el Éxodo con 6 pedidos listos para el ingeniero.

---

### 2026-09-29 (Martes)

Arranqué con la rutina de siempre en G54, todo en orden, borré los borradores viejos de Orison y me metí de lleno en Bubble. Conecté Deepgram, que por fin me dejó entrar, armé un catálogo real de voces en inglés y español con vista previa para escucharlas, y revisé unos cambios que el ingeniero había subido sin avisar: el único que servía era la corrección de un error de versión de Python, así que lo traje y dejé lo demás aparte. Después pedí tres cosas que me habían solicitado: un solo login donde la cuenta decide si entra como agencia o como negocio, que todo corriera sobre MySQL y no sobre SQLite (lo rehice entero, pruebas incluidas), y una sección de Ayuda con buscador tipo Google, guías paso a paso y preguntas frecuentes. De paso armé el documento técnico para programadores, reordené el menú, ensanché los campos y dejé la letra Fredoka en todo el sistema porque me encantó cómo se veía.

Por la tarde hicimos las primeras llamadas reales de punta a punta. La primera entró bien pero el bot nunca contestaba: esperaba 30 segundos de silencio antes de hablar, porque el corte por silencio estaba conectado donde no iba. Lo corregimos, y la VPN me estuvo bloqueando la inteligencia artificial varias veces hasta que la cerré del todo. Con eso salió una conversación completa, aunque Marco hablaba como en un chat, con listas y párrafos largos, así que le pusimos reglas para que hable corto, como por teléfono. Armé una floristería de prueba para ensayar con otro negocio y la llamada del pedido salió perfecta. También saqué de los paneles el botón de liberar número, porque eso es tarea nuestra, hice que el número para transferir a un humano se verifique con un código por SMS, y dejé el repositorio de Bubble limpio de datos de empresas reales para que otros lo puedan instalar desde cero.

Cerré con una revisión completa de G54, sobre todo de Marco, porque me daba miedo que fallara en las pruebas finales, y menos mal: desde el 4 de septiembre no le llegaba ningún aviso de cliente caliente al vendedor, porque en la migración al CRM ese paso quedó desconectado. Además Marco no reconocía un "sí" solo como aceptación de la cotización, y en cambio sí tomaba como aceptación un "no quiero por ahora"; el correo al vendedor se veía desarmado y sin el precio; por teléfono se presentaba como Alex, cosa que pasó en una llamada real de hoy; y las llamadas nunca se guardaban en G54. Quedaron las cinco corregidas y probadas con conversaciones reales por WhatsApp, Telegram y teléfono. Dejé todo respaldado y subido a los dos repositorios, y ahí terminé el día.

---

### 2026-09-28 (Lunes)

Arranqué con la rutina de siempre y encontré enseguida un bug real: el seguimiento automático de 23 horas de Marco llevaba días mandándole un WhatsApp por hora a unos contactos de prueba, porque el paso que marca "ya enviado" nunca podía guardar nada; lo arreglé en Marco y en el motor genérico, y de paso limpié esos contactos. También arreglé dos cosas de Marco que venían del martes pasado: el modo de emergencia sin inteligencia artificial nunca podía activarse aunque fallaran todos los proveedores, y la fecha de entrega a veces quedaba como "30 de ancho" sacada de las medidas; las dos quedaron probadas con una conversación completa. Revisé las novedades de G54 y programé la semana completa de posts, dos por día con plataformas mezcladas, y en el camino apareció otro problema de fondo: varios borradores salían cortados, vacíos o con el título repetido, porque los dos respaldos de inteligencia artificial de Content AI se quedaban sin espacio pensando antes de responder. Lo corregí, regeneré los posts rotos y completé el calendario hasta el domingo con las ideas nuevas que aprobé.

La parte más larga del día se la llevaron las métricas. Pregunté si los números del panel eran reales y resultó que no del todo: el reporte semanal guardaba Instagram siempre en cero, duplicaba cada semana y sumaba posts viejos sin importar la fecha. Lo reconstruí con datos reales de Meta, rehíce el historial de las últimas semanas y dejé el informe semanal visible en Informes; el primero que me armó no tenía el formato aprobado y lo rechacé, así que terminó usando el mismo motor del mensual. Ahora las métricas de cada post también alimentan a Ideas AI, y los clics de bots ya no se cuentan como clics reales. LinkedIn todavía no se puede medir: la cuenta no tiene los permisos de estadísticas y eso lo tengo que pedir yo en LinkedIn. Orison recibía informes armados con los datos de la página de Crating Express, así que la saqué también del reporte mensual y borré sus tres informes. Encontré además que el 22-sep dos posts se habían publicado duplicados por unas alarmas viejas (lo arreglé de raíz y borré la copia de Facebook; la de Instagram la tengo que borrar yo desde la app) y que varios posts públicos de Facebook tenían todavía el link técnico de n8n, que quedó corregido en 8 de 9. Con todo eso revisé el documento de pendientes para Walter, ajustamos juntos los pedidos que estaban mal planteados y se lo mandé.

Ya en la tarde saqué del repositorio los secretos que seguían a la vista (decidí que el repositorio sigue público y que no vamos a rotar tokens, porque no solo nosotros lo usamos), armé un análisis de audiencia para Don Marc que por ahora decidí no llevar a ninguna acción, y mudé Bubble a su propio repositorio, que compartí yo misma con el ingeniero. Pedí un análisis honesto del módulo de redes: la máquina produce y publica bien casi sola, pero lo que publica le llega a unas dos personas por post y todavía no deja ningún cliente, así que antes de pulir la interfaz hay que resolver eso. Cerré arreglando algo que me tenía confundida: en GitHub todo lo que subía salía a nombre de Guido, porque la computadora tenía guardada su cuenta; ya quedó a mi nombre de acá en adelante. También vi que al ingeniero le está costando trabajar con los permisos de Bubble: en una cuenta personal GitHub no deja elegir qué puede hacer cada colaborador, y para eso habría que pasar el repositorio a una organización. Dejé programadas dos revisiones automáticas: mañana reintentar el post de Facebook del 8 de agosto que todavía tiene el link técnico, y el lunes 5 confirmar que el reporte semanal corra solo. Ahí lo dejé por hoy, con todo subido.

---

### 2026-09-22 (Martes)

Arranqué revisando si había novedades en la documentación de G54, y encontré dos bugs reales en Camila (mis agentes de prospección y de nutrición de leads): uno descartaba en silencio cualquier negocio sin teléfono, justo el caso más común cuando se rastrea la web buscando leads; el otro tenía roto el modo de mandar el blog nuevo a mis contactos, pese a que ya lo había dado por arreglado hace unos días. Los dos quedaron corregidos de verdad esta vez. De paso limpié el documento de pendientes para Walter — tenía tres pedidos que en realidad no eran pedidos: uno era solo una maqueta sin ningún texto explicando qué quería, otro contaba el problema sin decir qué cambiar, y el tercero ya ni hacía falta pedírselo a él.

Seguí con Bubble 54: terminé la lista completa de usabilidad que veníamos armando (dos bugs de celular más corregidos), dejé la recuperación de contraseña por correo funcionando de punta a punta después de una discusión real sobre si la credencial guardada estaba bien o no — tenía razón yo, había que cambiarla — y construí el puente real de Twilio hacia LiveKit para las llamadas de voz, armado entero por API sin tener que tocar nada a mano. Conecté Cartesia (la voz del bot) sin pagar nada; Deepgram (el oído del bot) me lo sigue bloqueando un error genérico de verificación, así que quedó pendiente.

La segunda mitad del día me la pasé auditando a Marco de verdad, con conversaciones reales por WhatsApp y Telegram, cotizador incluido. El hallazgo grande: Marco por Telegram llevaba quién sabe cuánto tiempo sin recordar nada de la conversación — le preguntaba el nombre al cliente en cada mensaje nuevo, para siempre. Lo até y lo confirmé con una cotización real de $142. WhatsApp funcionó bien a ritmo normal, aunque encontré que si mis tres proveedores de inteligencia artificial fallan a la vez, el bot se queda mudo en vez de usar el respaldo sin IA que tengo pensado justo para eso. Sobre el final le pedí que probara imágenes, audio y video de verdad, y la primera respuesta que me dio fue floja — se lo dije de frente, y volvió con archivos reales: el PDF y el audio funcionan bien, pero la imagen realmente estaba rota, porque el modelo gratis que usaba se quedaba sin cupo todo el tiempo — lo cambié por uno pago que cuesta centavos y ya respondió bien. El video no lo puedo analizar todavía, pero al menos ya no se pierde: ahora se lo pasa directo a un especialista humano en vez de pedirle al cliente que lo describa por texto. En el camino encontré otro token real de Telegram expuesto, distinto al de hace unos días, ya guardado a salvo. Cerré el día con todo commiteado y subido al repositorio.

---

### 2026-09-21 (Lunes)

Arranqué con la rutina de siempre en G54 — todo limpio — y programé la semana completa de posts. Até a Camila para que ya no mande correo directo sino que arme un borrador que yo apruebo, corregí que las zonas horarias de mis dos empresas estaban invertidas, y sumé la función de pedir una idea sobre un tema puntual mío. Lo más importante fue Marco: encontré que cuando un vendedor tomaba control de una conversación para atender a un cliente él mismo, Marco le seguía respondiendo por encima como si nada — un bug real que llevaba semanas así, corregido junto con otros dos del mismo motivo de fondo (el teléfono se guardaba distinto en dos partes del sistema) y confirmado con conversaciones reales.

El resto del día fue Bubble 54. Até confirmación real a las acciones de configuración que todavía no la tenían (cambiar el plan de un negocio disparaba solo, sin preguntarme nada), terminé el cambio de nombre completo del proyecto que había quedado a medias, y volví a lo más difícil: la llamada de voz real. No existía ningún puente entre un número de teléfono y el bot, así que lo construí — y al probar el flujo real de asignarle un número a un negocio estuve a un clic de agarrar por error el número real de producción de Marco en vez del que estaba libre; lo revertí sin que tocara nada real y até la causa de fondo para que no pueda volver a pasar. De ahí le pedí que revisara nuestra seguridad de datos, y encontró tres huecos reales que até en el momento: el login sin ningún freno contra fuerza bruta, un secreto interno comparado de forma insegura, y un logo que se podía subir con código malicioso escondido adentro.

Aproveché para pedir tres funciones que nos faltaban — recuperar la cuenta por correo, exportar el historial de llamadas, y un CRM real de clientes — eligiendo entre opciones para cada una antes de construir nada. Quedaron las tres probadas en vivo con una llamada real. Le pedí que no diera nada por terminado sin la misma estética del resto de la app, y encontré dos pantallas que se veían rotas, corregidas con pruebas nuevas para que no se vuelvan a romper solas. Cerré pidiendo un análisis honesto de qué tan fácil es usar todo esto para un cliente real — probado en un celular de verdad, la app casi no se podía usar: el menú nunca se achicaba y los textos se pisaban. Quedó resuelto, con el menú convertido en una barra abajo como cualquier app de celular real, y guardé el resto de la lista para retomarla. Cerré el día con todo commiteado.

---

### 2026-09-19 (Sábado)

Arranqué con el corte de día de siempre en G54 y, cuando insistí en revisar si los posts de la semana pasada de Crating Express se habían publicado bien, confirmé que sí, sin ningún atascado desde hace semanas — y repasé uno por uno los bugs conocidos contra la plataforma real en vez de confiar en lo ya escrito. De ahí me metí con Camila, y terminé el día entero metida en la parte de telefonía de Bubble 54.

Encontré y corregí un problema real de rendimiento (la pantalla de Inicio se quedaba pegada cargando por llamadas duplicadas) y de ahí me puse a entender de punta a punta cómo funciona una llamada de voz real — pedí que me lo explicaran paso a paso hasta entenderlo del todo, porque no me servía seguir construyendo sobre algo que no entendía. Con eso ya claro, armé una estructura de planes real con precios pensados para que el negocio deje ganancia sin ser tan caro para el cliente — la corregí varias veces porque los primeros números me salían imposibles, casi lo mismo que le cobraría una agencia — y hasta construir la base real en el sistema (sin conectar ningún cobro todavía, eso es aparte).

Lo más importante del día fue un susto real: probando el flujo de activar el teléfono de un cliente, la opción de "usar mi número actual" me compró un número nuevo de verdad, sin preguntarme nada ni pedirme mi número — un bug serio, y se lo dije claro. Exigí que la verificación fuera real, no simulada, así que se construyó de cero con un código real por SMS antes de dejar activar un desvío de llamadas, más una confirmación explícita de costo antes de cualquier acción que gaste plata de verdad, y un sistema para que un número de un cliente que se va no se pierda, quede nuestro y se le pueda dar a otro. Cerré puliendo cómo se ve esa verificación — pasó de reemplazar toda la pantalla (que desconcertaba) a una ventanita flotante con la misma estética de burbuja de siempre, su botón de cerrar con el mismo sonido de siempre, y un texto que ya no suena a que le estoy diciendo ladrona al cliente. Todo probado en vivo contra la cuenta real de Twilio, sin ningún cobro de más después del susto inicial, y subido al repositorio.

---

### 2026-09-18 (Viernes)

Arranqué con el diagnóstico de siempre, todo limpio, y de ahí corregí un link que se iba a publicar mal en un post que salía en unas horas. Dejé Instagram de Crating Express publicando de nuevo — llevaba tiempo hablándole al servidor equivocado sin que nadie se diera cuenta, desde que migramos esa cuenta hace unas semanas — y avancé bastante con Camila: reactivé su correo real con una contraseña de aplicación nueva, le di el mismo diseño de marca que ya usamos en todos lados, y le corregí varios detalles para que hable de cada negocio real y no de una persona inventada.

Con eso cerrado, achiqué este mismo archivo a la mitad porque se me estaba llenando la ventana de contexto en una hora en vez de durarme semanas, y corregí que quedarme sin sesión mostrara un error crudo en pantalla en vez de mandarme directo al login.

El resto del día me lo llevó Bubble. Terminé el logo de la pestaña después de varias vueltas — encontré que el archivo tenía un error real de formato (no era la caché del navegador, como pensé al principio) y, después de probar ponerle las letras con la tipografía real de la marca, terminé decidiendo dejarlo sin ellas porque en el tamaño real de la pestaña no se leían bien; esa versión con letras la guardé aparte por si me sirve de logo más grande el día de mañana. Le pedí que probara todo el sistema a fondo y encontró y corrigió dos fallas reales — los interruptores de encendido tapaban el texto de al lado, y no se podía elegir el único proveedor de teléfono que ya tenemos funcionando de verdad. Cerré el día con lo más grande: me armó primero una vista de prueba para decidir cómo se sentiría conectar un número de teléfono real, y una vez que la aprobé me lo construyó de verdad en el sistema, en los dos lados — funciona, pero avisa honestamente que todavía falta que abra la cuenta con el proveedor de números para que empiece a dar números reales.

---

### 2026-09-17 (Jueves)

Empecé el día metida de lleno en Bubble, resolviendo el pedido de un resumen visible del documento que se sube y sugerencias de servicios con confirmación — quedó armado de punta a punta, con pruebas incluidas. En el medio subí un PDF real para probarlo y no pasó nada, así que me puse a investigar y encontré que no había ninguna clave de Groq configurada, pese a que en el resto del proyecto sí las tenemos funcionando — usé una prestada mientras tanto, con la idea de sacar una propia más adelante. Esa clave resultó estar bloqueada por la red desde acá, no por la clave en sí — lo comprobé a fondo, hasta descarté que fuera cosa de la VPN probando con dos direcciones distintas — y como la causa real no se pudo resolver, armé un desvío por uno de nuestros propios servidores para esquivar el bloqueo, que quedó terminado salvo un último paso que no pude activar yo misma por un permiso de la sesión, y ahí quedó pendiente de un clic mío. Cerré ese bloque cambiándole el ícono a la pestaña del navegador, que no pegaba nada con el resto del diseño de burbujas.

A media tarde me puse a revisar, a pedido del ingeniero, si nuestra parte del agente que busca leads y manda correos estaba completa del lado de la documentación de la plataforma — encontré dos cosas reales para dejarle anotadas. En el medio de eso apareció algo serio: al bot de Telegram de Marco le habían robado el token desde hace meses y alguien lo estaba usando de verdad para mandar spam en ruso, haciéndose pasar por él en la misma conversación. Lo revoqué, saqué uno nuevo, y de paso armé una protección automática para que un secreto real nunca más pueda quedar guardado por accidente en un commit.

Ya en la parte final del día corregí un error mío en el documento para el ingeniero — había escrito que un trato de prueba se había movido a una etapa que en realidad nunca se movió — y noté que me había quedado corta pidiéndole solo que los dos agentes se vieran en el panel, sin pedir ningún botón real para poder usarlos; me contestó que lo van a resolver cuando reorganicen esa parte, y de paso le puso nombre al agente de cara al cliente: Camila. Encontré los dos workflows reales detrás de eso, confirmé que están listos para cualquier empresa y no solo la nuestra, y les puse ese nombre. Intenté activar el envío de correos con una empresa real y me topé con una contraseña inválida que todavía no pude resolver. Cerré leyendo entero el documento grande que mandó el ingeniero, confirmando que un error viejo que veníamos arrastrando ya está resuelto de verdad, aplicándolo, y armando la lista de lo que necesita de nuestro lado para que ese agente se pueda ver y usar desde el panel — con dos correcciones más que fui haciendo sobre la marcha, después de que revisaran ese documento conmigo y me señalaran cosas reales que me faltaban.

Arranqué retomando la duda que había quedado abierta el otro día sobre un post que se veía con la imagen en inglés y el texto en español — investigué a fondo y encontré la causa real: cuando fallan los dos modelos principales, el tercero de respaldo a veces se pone a razonar en inglés a mitad de camino y el límite de tokens le corta la respuesta antes de que termine de corregirse solo al español. Lo até calculando el idioma yo misma en vez de dejar que el modelo lo adivine, y regeneré los tres posts que habían salido mal. En el medio noté algo raro en un link de un post real — mostraba el dominio interno de nuestra automatización en vez del link de la página — y decidí sacarlo, aceptando que perdemos el conteo de clics de esa parte del reporte.

Con eso resuelto me puse a aprobar ideas para programar esta semana, y como había muchas pendientes le pedí que armara un horario de dos publicaciones por día mezclando plataformas — se armaron ocho para el resto de la semana. Le pregunté por qué no había puesto nada para sábado y domingo, y decidí que sí se incluyeran, así que quedó corriendo seguido de jueves a domingo en vez de saltarse el fin de semana. Antes de cerrar dejé anotado un pedido nuevo para Walter: poder filtrar en el Banco de Ideas y en los Posts para ver solo lo que falta publicar sin que se mezcle con el historial — confirmé primero que esto no necesita nada nuevo de su lado, alcanza con un filtro del lado del panel sobre los datos que ya trae.

Cerré revisando que no quedara nada suelto de las pruebas del día — sin workflows de prueba olvidados, con los ocho posts confirmados en su horario real, y todo commiteado y subido al repositorio.

---

### 2026-09-08 (Martes)

Arranqué con el diagnóstico de rutina de siempre en G54 — todo limpio, sin nada nuevo desde el viernes. Insistí en que tenía que haber algo más y volví a revisarlo a fondo por otros dos caminos, sin encontrar nada tampoco; en el medio se me escapó pegar en el chat un token real de GitHub, y me avisaron ahí mismo que lo mejor era revocarlo por las dudas, ya que el repositorio es público. Con eso resuelto, le dije que quería arrancar de una vez con la primera versión funcional del módulo de voz.

Ahí me metí a fondo en qué cuentas hacían falta de verdad. Primero pensé en que nosotros compráramos y administráramos un número de teléfono por cada cliente, pero no me terminó de cerrar apenas lo pensé bien — no tiene ningún sentido que seamos la compañía telefónica de nadie, cada cliente tiene que seguir usando su número de siempre, el nuestro queda invisible por detrás. Ya con eso claro, encontré que ni LiveKit ni Deepgram piden tarjeta para su plan gratuito, así que armé las dos cuentas sin gastar nada. LiveKit quedó conectado de verdad — confirmé con el worker corriendo en vivo que se registra contra mi cuenta real. Con Deepgram me trabé feo — no me dejaba crear cuenta, entrar, ni resetear la contraseña — y resultó que ya tenía una cuenta armada con Google de antes, sin ninguna contraseña que resetear; en cuanto probé entrar por ahí en vez de pedir el reset, se resolvió.

Mientras esperaba que terminara con Deepgram, aproveché para resolver dos pendientes que ya tenía anotados: que un negocio pueda elegir su propio modelo de IA y su voz sin depender de la agencia (aclaré que agencia y negocio son los dos clientes reales, ninguno es nuestra vista de administrador), y sobre todo que el bot ya lea de verdad el contenido de los PDF que se suben — construido con búsqueda semántica real, corriendo local, sin sumar ninguna cuenta ni servicio nuevo. Los dos quedaron probados a fondo y confirmados en vivo contra el servidor real antes de darlos por buenos. Cerré el día con todo commiteado en dos partes bien separadas y subido al repositorio.

---

### 2026-09-07 (Lunes)

Arranqué con el diagnóstico de rutina de siempre en G54, todo en orden, y confirmé que el disparo semanal de Ideas AI ya corrió solo para las dos empresas, generando ideas reales sin ningún dato inventado. De ahí encontré que el reporte semanal de Analytics llevaba desde julio con su disparador de horario apagado por un bloqueo que ya no existe — lo reactivé, y en el camino descubrí que Orison comparte la misma página real de Facebook que Crating Express en el sistema, así que la excluí del disparo automático (tanto el semanal como el mensual) para no generarle un reporte con las métricas de otro cliente sin que nadie lo hubiera pedido.

Seguí con Bubble 54 — levanté los dos servidores locales (encontré que al backend le faltaba su propio lanzador, lo agregué) y de paso confirmé dos commits de esa misma mañana que nunca había documentado bien (el estado vacío de llamadas con las burbujas de siempre, y poder soltar el logo arrastrándolo). Armé una guía real para entender qué hace cada pantalla, y al revisarla junto con una captura del formulario del bot me di cuenta de que estaba mezclando lo que se toca seguido (número, modelo de IA, voz) con configuración técnica de una sola vez — lo separé en dos bloques, uno visible y uno plegado, sin tocar ningún permiso. De paso encontré un id crudo del catálogo apareciendo tal cual en el resumen de un negocio, en vez del nombre real del modelo, y lo até también.

Cerré el día resolviendo los dos pendientes que habían quedado abiertos de la sesión anterior: el botón de crear un negocio nuevo seguía apareciendo aunque ya hubiera negocios cargados, y el formulario de creación seguía pidiendo solo cuatro datos cuando lo que hace falta es toda la información real del negocio. Até el primero, y para el segundo tuve que agregar dos columnas nuevas a la base de datos (dirección y teléfono, que no existían todavía) — expandí el formulario completo, actualicé las pruebas que se rompían con el cambio, borré la base local y la volví a poblar para que tomara el esquema nuevo, y probé todo en vivo creando un negocio real de prueba con los cinco datos completos, confirmando que quedaban guardados de verdad antes de borrarlo. Terminé con 90 pruebas de backend y 35 de frontend en verde, todo commiteado y subido al repositorio.

---

### 2026-09-05 (Sábado)

Arranqué el día con el diagnóstico de siempre, todo en orden, y le di seguimiento a algo que había quedado abierto: probando con Orison encontré que Ideas AI me estaba inventando un precio de oferta y una playa que Managua ni tiene, sin ninguna regla que le impidiera hacerlo — la até, y de paso encontré que el respaldo de Groq de Content AI estaba roto con un modelo falso de una prueba vieja que nunca revertí, así que también lo dejé andando. Después me metí con algo que el ingeniero me había explicado sobre un bug viejo de WhatsApp que veníamos arrastrando hacía semanas — en vez de darle la razón sin más, lo probé en vivo con mensajes reales, y confirmé que tenía razón: no se perdía nada, yo estaba mirando la bandeja en vez del hilo completo de la conversación. Quedó cerrado del todo.

De ahí encontré algo que había construido mal — la línea base que uso para medir progreso se veía mezclada, sin ningún diseño, en la misma lista de informes que le llega al cliente. Lo hablé con el ingeniero en el momento: la dejamos donde está, pero le hice su propio diseño con la marca real, y le agregamos el pedido de que viva en un campo propio de la estrategia. En el camino cometí un error real que no puedo deshacer — borré 2 registros reales de Crating Express sin haberlos leído antes, así que esos dos puntos de partida quedaron perdidos para siempre. Con todo eso armé el nuevo documento de pendientes para el ingeniero, reemplazando al de hace dos semanas, y cuando me pidieron que probara cada ruta una por una en vez de confiar en lo ya escrito, encontré que uno de los bugs viejos (el origen "prospección" que reventaba siempre) ya se había resuelto solo. Actualicé también una copia vieja de la planilla de Nicaragua que había quedado 16 commits atrás.

Cerré el día con Bubble 54 — levanté el servidor real y entré al panel de agencia para confirmar que todo el rediseño de las últimas semanas sigue funcionando bien de punta a punta: el menú de burbujas, el inicio con el resumen real de mis agentes. Le subí un poco el volumen al sonido de cuando explota una burbuja, y antes de dar nada por bueno hice un clic real para confirmar que sonaba distinto y sin ningún error. Todo quedó commiteado y subido a los dos repositorios, y ahí terminé.

---

### 2026-09-04 (Viernes)

Arranqué construyendo el segundo agente de prospección de leads que le faltaba a la plataforma, dejándolo con toda la lógica lista pero apagado, porque todavía no tengo una clave real de Google Places para probarlo de verdad. De ahí hice una auditoría de seguridad completa y encontré algo serio: el token que uso para manejar todos nuestros flujos de automatización está expuesto en texto plano en un repositorio que confirmé que es público — lo dejé marcado sin tocarlo, porque rotarlo es una decisión mía tomar, no de la herramienta. Seguí con un repaso honesto de cada agente que tengo en producción, uno por uno, y aunque nada está caído hay huecos reales: dos agentes nuevos que no pueden operar todavía por falta de datos de configuración, y un problema de fondo donde las respuestas de mis bots no siempre quedan visibles en el historial que veo yo misma desde el panel.

El resto del día se me fue en el documento grande que me mandó el ingeniero con el estado de toda la plataforma. Lo leí completo la primera vez, pero cuando insistí en que había cosas nuevas que no estaba viendo — puntualmente algo sobre videos y reels en las publicaciones — lo volví a leer línea por línea, y tenía razón en parte: el documento se había actualizado ese mismo día con contenido que mi primera lectura nunca llegó a procesar. Sobre lo de reels investigué a fondo contra el código real y confirmé que ya lo tengo construido y funcionando desde hace semanas, sin nada roto — lo que sí encontré nuevo de verdad fueron cinco pendientes que el ingeniero cerró ese mismo día, cuatro preguntas suyas que necesitaban respuesta directa mía, y un pedido urgente de cambiar cómo mando correo que resultó ser algo que ya había resuelto sin darme cuenta al construir el agente nuevo de la mañana.

Antes de contestarle nada, probé en vivo cada cosa que el documento decía que ya funcionaba, con evidencia real, no de memoria. La mayoría estaba bien, pero encontré dos que no: guardar un lead con el origen de prospección real sigue reventando con el mismo error de siempre, y algo más serio — que un segundo mensaje se agregue a una conversación de WhatsApp ya existente, que había confirmado funcionando esta misma tarde, volvió a fallar en silencio unas horas después con el mismo método exacto. Armé toda la respuesta para el ingeniero con las cuatro preguntas contestadas y esos dos hallazgos con la petición y la respuesta real pegadas, la dejé lista para revisarla antes de mandarla, y cerré subiendo todo al repositorio.

---

### 2026-09-02 (Miércoles)

Arranqué con el diagnóstico de siempre en G54, todo en orden — el único aviso real (un error semanal recurrente en uno de los agentes) lo investigué a fondo antes de asumir que era un bug, y resultó ser el diseño correcto: una ejecución por cada empresa activa, solo el tiempo de espera estaba mal calibrado, lo até. Seguí con lo de ayer en Bubble 54: extendí las burbujas interactivas al menú de la agencia, y después llevé la misma estética de vidrio a toda la interfaz — botones, tarjetas, badges — acordando primero hasta dónde llevarlo para no terminar con tablas y formularios ilegibles.

Me tomó bastante encontrar el sonido correcto para cuando estalla una burbuja — probé varias versiones (un tono simple, después uno más ruidoso, después uno demasiado agudo) y ninguna me convencía, hasta que caí en la referencia real: el sonido del plástico de burbujas de embalaje, y ahí sí armé un chasquido con peso real. De ahí pasé a algo más grande: volví a poner el menú a la izquierda, esta vez sobre el fondo azul de verdad en vez del blanco donde las burbujas casi no se veían — corregido en agencia y en negocio por igual.

Con eso resuelto, construí un panel de Inicio nuevo para la agencia — saludo, una lista de primeros pasos que se marca sola según el estado real de los negocios, y un resumen de cuántos bots tengo activos, con cada paso pendiente llevando directo al negocio real al que le falta resolverlo. Cerré el día con dos ajustes de pulido — el saludo pasó a usar mi nombre de pila en vez del completo, y el formulario de configuración del bot se veía diminuto en pantallas anchas, así que lo rearmé en una grilla real de 2 columnas. Terminé revisando y actualizando toda la documentación del proyecto (había quedado desactualizada con tantos cambios de rutas y nombres de archivos) para que quede todo listo si necesito retomarlo desde otra máquina solo con lo que hay en GitHub.

---

### 2026-09-01 (Martes)

Arranqué con el diagnóstico de siempre en G54, todo en orden. Después me metí de lleno en Vox54 probándolo como si fuera un cliente real, y encontré un hueco serio: el formulario del negocio para configurar su bot era el mismo que el de la agencia, dejando a la vista datos que un cliente nunca debería tocar (proveedores, claves de IA). Lo até a nivel de servidor, no solo tapándolo en la pantalla, y de paso sumé que un cliente pueda ver sus llamadas reales, un repaso visual al panel que se había quedado atrás, y que pueda cambiar su propia contraseña.

El resto del día fue diseño. Le mostré dos propuestas de menú, eligió el de burbujas flotando abajo, y al llevarlo a producción encontré y até de raíz un bug real que dejaba una notificación tapando un botón. Rebrandeé la app a Bubble 54, rediseñé el login, y repetí todo del lado del negocio. Sobre el final pidió que las burbujas explotaran de verdad al tocarlas — mi primer intento solo las hacía desaparecer, así que lo corregí con un estallido real (destello, onda expansiva, partículas) que reaparece solo unos segundos después. Cerré subiendo todo al repositorio para seguir desde casa.

---

### 2026-08-31 (Lunes)

Arranqué el día con el diagnóstico de rutina de siempre en G54 — todo en orden, sin nada nuevo en la API. Cuestioné mi propia certeza sobre los pendientes del Éxodo cuando lo hablé y preferí pasarle a Marc la lista cruda tal cual está documentada en vez de darle por buena una lectura mía sin estar segura. Investigué tres herramientas que había visto mencionadas como mejoras para trabajar con Claude — dejé una (Task Observer) funcionando de forma permanente como parte propia del proyecto, y las otras dos (claude-mem y Never Stop Coding) quedaron pendientes de decidir en otro momento, sin apurar nada a medias.

El resto de la mañana me la pasé rehaciendo el reporte de Analytics siguiendo el marco de KPIs que compartió Don Marc — reorganizado por etapa real del embudo (atracción, consideración, conversión, retención) en vez de una lista suelta de métricas. En el camino encontré tres problemas reales, no cosméticos: una sección que comparaba el arranque de Orison contra el de Crating Express (dato que nunca debería cruzarse entre clientes, lo saqué apenas lo vi), un gráfico que rellenaba con números inventados cuando no había datos reales suficientes (ahora avisa honestamente que no hay datos, en vez de fabricar una curva), y el más serio: la tarjeta de «Negocios en el CRM» venía contando tratos ya perdidos como si fueran negocios activos, inflando el número real — encontrado solo porque insistí en revisar el mismo reporte con el mismo rigor para Orison, no solo para Crating Express, ya que cualquier cambio acá aplica como diseño para todos los clientes. Corregí los tres y a mano el dato ya guardado que había quedado mal, pisando sin querer un dato de prueba mío en el primer intento — lo noté y lo rehice limpio antes de darlo por cerrado.

A la tarde cambié de tema y seguí con Vox54, la plataforma de agentes de voz aparte de todo esto. Probé en vivo el panel de agencia que había dejado el día anterior — renombrar un negocio, los interruptores del bot, guardar cambios, crear un negocio nuevo, el login directo de un negocio — y todo seguía funcionando bien. Encontré que la pantalla de configuración de un negocio seguía siendo un solo formulario largo mezclando su identidad con la config completa del bot — la separé en tres pantallas propias (el negocio, su bot, y la configuración de la agencia en sí, esta última nueva) y actualicé la documentación del proyecto con todo lo de Vox54 (cómo levantarlo, credenciales de prueba, y un detalle molesto de esta máquina con un proceso pegado en el puerto 8000) para poder seguir mañana desde otra computadora sin perder tiempo.

---

### 2026-08-28 (Viernes)

Arranqué con el diagnóstico de rutina de siempre, y ahí mismo se me cuestionó con razón el resumen que había armado — no alcanzaba con decir "no hay marcadores nuevos en la documentación", tenía que probar cada uno de los 9 pendientes uno por uno contra la plataforma real. Lo hice, y en el camino encontré un bug de cron real: el seguimiento automático de leads de Sales AI Motor que armé ayer nunca había disparado ni una sola vez desde que lo dejé activo — até el mismo tipo de falla que ya me pasó antes con otros disparadores de horario. Minutos después me avisaron que Walter había hecho un despliegue nuevo, así que volví a probar los 9 de cero — comparé la documentación y el código real del panel byte a byte contra lo de la mañana, salió todo idéntico, así que reconfirmé que ninguno de los 8 pendientes reales había cambiado.

Pedí un repaso de en qué había quedado el día anterior y qué faltaba, y de ahí fui resolviendo los tres pendientes que sí eran míos, uno por uno. El primero — que un comentario o mensaje quedara registrado como lead aunque el bot esté en modo "solo avisar" y no responda — lo até bien, aunque en el camino se me coló un bug propio (una referencia mal armada que hacía que el modo "solo avisar" nunca se respetara) que corregí antes de dar el arreglo por bueno, probado dos veces en vivo. El segundo — que la alerta de conversación nueva solo cubriera mensajes privados y no comentarios — resultó ser una alegría rara: ya estaba resuelto, sin que nadie lo hubiera notado desde el rediseño de hace unos días; lo confirmé con una prueba real y no hizo falta tocar nada. El tercero — limpiar una nota de prueba vieja en el CRM — no se pudo: probé cuatro rutas distintas y confirmé que ese sistema no tiene ninguna forma de borrar una nota puntual una vez creada, es un límite real de la plataforma, no algo que se me haya escapado.

Antes de dar por cerrada la lista de pendientes probé un último camino sobre el más molesto de todos — que la segunda parte de una conversación de WhatsApp se pierde y nunca queda guardada — mandando el historial completo en vez de solo el mensaje nuevo, por si acaso. Tampoco funcionó, así que quedó confirmado que ese problema es más de fondo de lo que pensaba y no hay nada más que pueda hacer yo sola con eso. Cerré la tarde retomando la línea de los KPIs que se habló con Don Marc en la reunión de hoy — apenas fui a revisar el reporte real para seguir por ahí, se me trabó la conexión a n8n desde esta computadora (nada del lado del sitio, ya me había pasado antes), así que quedó ahí, pendiente de retomar.

---

### 2026-08-27 (Jueves)

Arranqué retomando el seguimiento automático de leads que había dejado pausado ayer, y encontré la causa real: el endpoint que debía traerme la lista de leads sin respuesta nunca sirvió para eso, siempre exigió un teléfono puntual. Reconstruyéndolo se me coló un incidente real — un bug en el paso que decide si mandar WhatsApp o avisar por correo hizo que una prueba mía terminara mandándome 19 correos reales a mi propia bandeja — lo até enseguida, limpié todo, y confirmé el mecanismo funcionando solo con ciclos reales durante toda la tarde. De ahí conecté dos funciones que el ingeniero ya había dejado listas de su lado (el interruptor de bot-solo vs. solo-avisar por canal, y la alerta de conversación nueva) — estaban armadas con el nombre de campo equivocado y nunca habían hecho nada, y de paso encontré que el correo de lead caliente llevaba semanas yéndose a la dirección equivocada.

Después entré por primera vez de verdad al panel con navegador — nunca había podido antes — y lo recorrí entero: encontré un agente duplicado en el tablero, nuestro propio link de rastreo expuesto crudo en tres posts reales de LinkedIn (corregido ahí mismo), residuos de prueba en el CRM y en competidores, y un bug real en el Generador de Imágenes donde el historial nunca responde a un clic. En el medio me señalaron que el correo de "conversación nueva" no tenía el diseño de marca — lo corregí, y en el camino encontré que esa alerta nunca podía sonar justo en el modo donde más hace falta — corregido también.

Hice un repaso general de todo lo pendiente contra la plataforma real — buena noticia, el borrado de métricas que veníamos pidiendo ya existe, pero al probarlo cometí un error real: sin acotarlo por fecha, borró 150 registros históricos reales de Facebook en vez de solo el dato de prueba que quería limpiar. Investigué el daño después — resultó ser en su mayoría contaminación vieja, no historia genuina — pero quedó documentado como advertencia; los otros nueve pendientes del documento para el ingeniero siguen exactamente iguales, esperando de su lado. Ayudé a aclarar la pregunta que Don Marc había dejado sobre los KPIs — repasé las seis por dentro y armé un documento corto con cómo se miden hoy y su estado real: cinco ya construidas, una a medias (la comparación de arranque entre proyectos, el dato ya se guarda pero falta la pantalla que las compare) — queda adjunto. Cerré el día aplicando el mismo diseño ya probado a Sales AI Motor, el motor de cualquier empresa que no sea Crating Express, que tenía exactamente el mismo mecanismo roto — reconstruido y confirmado sin ninguna conversación real en juego durante la prueba.

---

### 2026-08-26 (Miércoles)

Arranqué el día resolviendo una confusión chica (una copia duplicada de la conversación resultó ser solo una conexión de Git distinta, nada real) y retomé lo de los KPIs de Don Marc — como el desglose que tenía armado era solo una paráfrasis de un comentario suelto, insistí en buscar la fuente real y encontré que él mismo había dejado, en una página aparte de Notion, una tabla completa con los 6 KPIs reales que quiere medir: ventas por proyecto y canal, costo de adquisición vs. valor del cliente, conversión y tiempo de respuesta, supervisión real de la IA, comparación de arranque entre proyectos, y una meta definida para pasar a publicidad paga. Con eso construí los seis en el reporte real: las ventas cerradas ya se desglosan por canal, agregué el valor real de cada cliente y cuántos vuelven a comprar (dejando el costo de adquisición marcado honestamente como "no aplica todavía" en vez de inventar un número), sumé una sección de supervisión de IA (ideas rechazadas por un humano, veces que el bot supo pedir ayuda en vez de inventar algo, tiempo real de respuesta), y empecé a guardar la fecha real del primer lead y la primera venta de cada empresa para poder comparar el ritmo de arranque entre proyectos más adelante. En el camino se me coló un error propio — un signo de dólar mal puesto que duplicó 25 mil caracteres del archivo sin que me diera cuenta al toque — lo agarré antes de subirlo a producción. También encontré un bug real y serio de la plataforma: cuando Marco manda el mensaje del cliente y su propia respuesta juntos, G54 solo guarda el primero y descarta el segundo en silencio, así que la respuesta del bot nunca quedó registrada en el historial de ninguna conversación — ya lo reporté como urgente. Probé todo con Crating Express y con Orison a la vez para confirmar que nada se mezcla entre empresas, y quedó confirmado limpio.

Sobre el cierre quise terminar el rediseño del seguimiento automático que había dejado pausado ayer, y ahí aparecieron dos bugs más de la plataforma, ninguno mío: el endpoint que debería traerme la lista de leads sin respuesta en realidad exige un teléfono puntual y nunca sirvió para traer una lista completa, así que ese mecanismo nunca encontró un solo lead real desde que existe; y el campo que uso para marcar "ya le mandé el aviso" se descarta en silencio al guardarlo. Arreglar esto bien implica reconstruir la base entera del mecanismo, no solo ajustar el umbral de horas — con el tiempo ya encima, lo dejé documentado y en pausa para retomarlo con calma.

---

### 2026-08-25 (Martes)

Arranqué el día retomando un comentario que había dejado Don Marc sobre cómo medir los resultados reales de marketing y no solo las métricas de vanidad, y de ahí armé un mecanismo que captura una foto de los números (leads, interacciones, negocios) justo cuando arranca la estrategia de un cliente, para poder mostrar después "cuánto avanzamos desde el inicio" en el reporte periódico. Me equivoqué al principio queriendo construir algo nuevo para una necesidad parecida — marcar un evento puntual, tipo antes/después de una optimización — y me corrigieron a tiempo: terminé reusando el mismo mecanismo en vez de duplicar nada. Pulí el diseño varias veces según las capturas que me iban mandando, y me tocó investigar a fondo por qué una imagen se veía rota — resultaron ser tres causas mezcladas, y confirmé que todo funcionaba bien viéndolo directo en el panel real de G54.

Después agregué una tarjeta de "Ventas cerradas" real, en dinero, tras cuestionar si tenía sentido medir likes en vez de plata de verdad, y quedó claro algo importante: Marco nunca debe cerrar una venta solo, siempre tiene que reafirmar el precio una persona. Probando eso a mano en el CRM encontré un bug real del panel ("último contacto: hace 25 años"), y como Marco sí calcula un precio real al cotizar, hice que ese precio viaje al CRM sin tocar nunca la etapa del negocio — confirmado con una cotización real de $142. Aproveché para revisar la salud general de Marco y ahí, sin buscarlo, me topé con un error real de WhatsApp sobre la ventana de 24 horas que me dejó con la duda de si el seguimiento automático de leads sin respuesta realmente sirve — investigué en serio y confirmé que no, está condenado a fallar de raíz porque dispara justo cuando WhatsApp ya no permite texto libre. Decidí rediseñarlo (aviso a las 23 horas, el segundo solo como alerta para que decida una persona, disparado desde el botón que ya existe en el CRM) pero lo dejé en pausa para el resto del día.

El resto se me fue en pruebas generales, donde salió de todo: el Strategist parecía no haber actualizado la estrategia (sí lo había hecho, era el panel sin refrescar), el Banco de Ideas le mostraba al cliente el estado interno de "ya usada" de cada idea (el filtro ya existe en la API, falta que el panel lo use), seguía apareciendo una alerta falsa de "Content AI no configurado", pedí una confirmación antes de dejar correr una estrategia nueva sobre una en marcha, y limpié el editor de ocho posteos viejos. Cerré revisando si Walter había subido algo nuevo a la API, y sí: agregó los campos de guardados, compartidos, visitas al perfil y seguidores nuevos que veníamos pidiendo, más el desglose semanal de calificados y negocios cerrados — los probé en vivo y funcionan, aunque dejé un valor de prueba sin forma de borrar todavía. También encontré que el token de Instagram ya llega, pero la cuenta conectada en el panel de Crating Express es un usuario genérico, no el real — intenté reconectarla pero el límite fue real, eso exige el login de Meta del cliente, así que quedó pendiente para otro día.

---

### 2026-08-24 (Lunes)

Después del diagnóstico de rutina, lo primero que hice fue retomar algo que Don Marc me había hecho llegar — un análisis de un marketer real sobre cómo se deberían medir los resultados de redes sociales, con la idea de que las métricas de vanidad (alcance, impresiones) no dicen nada del negocio si no se traducen en ventas. Comparé ese análisis contra nuestro propio reporte y contra la propuesta que le mandamos a Walter hace unas semanas para rediseñar la sección de Métricas del panel — la que separa "resultados reales" (leads, calificados, negocios cerrados) de las métricas de referencia. Confirmé algo que ya sospechaba pero que seguía sin resolverse: de los cinco pedidos concretos que le hicimos a Walter para que esa vista funcione con números reales, tres siguen sin ninguna respuesta de su lado — los campos de guardados, compartidos y visitas al perfil, los seguidores nuevos, y el desglose semanal de calificados y negocios cerrados. Evalué si podíamos avanzar igual construyéndolo dentro de nuestro propio reporte, sin depender de él, y entre esperarlo a él o meterle la misma idea a lo que ya controlamos, decidí no resolver nada a medias y dejarlo para analizarlo mañana directamente con el ingeniero.

El resto del día lo dediqué a confirmar que los últimos cambios de la planilla de vacaciones funcionaran de verdad antes de que Walter hiciera el despliegue real — levanté el servidor local con datos reales y probé cada camino a mano. Encontré y corregí dos bugs reales: el recibo mostraba C$0.00 en el neto pagado cuando sí había un pago real, y el diseño se veía como dos documentos separados por un color mal puesto. Confirmé también que el correo real sale bien. Cuando Walter avisó que ya había desplegado la planilla en el dominio real, entré solo a mirar y confirmé que carga bien; probando con cuidado noté que un rango de cuatro días marcaba tres — investigué y encontré el error real: el cálculo asumía que trabajamos de lunes a viernes, cuando en realidad trabajamos de lunes a sábado. Lo corregí, lo probé con las mismas fechas, y lo dejé listo y subido para que Walter lo despliegue — se lo voy a avisar yo. Ahí cerré el día.

De G54, conecté a Ideas AI y Content AI dos campos nuevos que Walter ya desplegó, y le agregué a esos dos y a Strategist AI el mismo respaldo de inteligencia artificial que ya tenían Marco y los demás. Probándolo con una falla real de cuota, sin darme cuenta sobrescribí la estrategia real de Crating Express con contenido de prueba — la detecté a tiempo y la restauré del respaldo que había guardado antes de probar, quedando idéntica a la original. También encontré y saqué dos secretos reales más que seguían expuestos, un token de Instagram y una contraseña de WordPress. Todo commiteado y pusheado en los dos repositorios.

---

---
