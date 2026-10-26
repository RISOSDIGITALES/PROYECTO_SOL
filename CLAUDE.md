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
5. ~~Logo en los correos de Camila~~: cargado y visto en el correo armado con el código de producción el 26-oct (ítem 461); falta solo verlo en un correo real enviado.
8. **Primer Reel real** (ítems 456 y 458): grabar uno de los pedidos de grabación (1 o 2 de Crating Express) y subir el video desde el panel; confirmar que Reels AI escribe el texto y si G54 le manda `pedido_id` (la doc no lo dice).
6. **Botón "Ejecutar" de Prospección (paso 7):** bloqueado. El flujo `jg5SENgRpe2wLBTn` está apagado por falta de la key de Google Places; falta que la usuaria decida si se saca la key o se le pide a Walter ocultar el botón.
7. **Llamada real a Marco por teléfono (VAPI)** (encontrado el 01-oct): el asistente sigue con `groq / llama-3.3-70b-versatile`, y Groq ya responde 404 `model_not_found` a ese modelo con nuestra cuenta (confirmado por el relay de Bubble). La última llamada real, del 29-sep, salió bien, pero no se sabe si VAPI usa nuestra cuenta de Groq o la suya. Llamar al +1 786-788-0417: si Marco no contesta o corta, cambiar el modelo del asistente (por ejemplo a `openai/gpt-oss-120b` en Groq, si VAPI lo ofrece).

## Próxima sesión — por dónde seguir (actualizado el 2026-10-23)

**Cómo trabajar (pedido de la usuaria, 23-oct):** de a poco, un paso por vez, de lo más chico a lo más grande, enumerando qué se hace y reportando el % de uso (`mcp__ccd_session_mgmt__get_usage`) al terminar cada paso. El límite semanal cerró en 87 % el 23-oct (se reinicia el domingo 25-oct 14:00 UTC); si pasa el 90 %, parar y avisar.

**Orden de trabajo (lo nuestro):**
1. ~~**Bubble — seguimiento a contactos calificados**~~: hecho el 26-oct (ítems 503 y 505 de Bubble; ítem 462 de acá). Falta probarlo con una llamada real.
2. **Bubble — último detalle de la auditoría** (`Bubble-54/docs/auditoria-2026-10-21.md`): el #62, el agente inventó un dato en la llamada de ejemplo ("antes de las 3 p.m."). Los otros 17 quedaron resueltos el 23-oct (ítem 453). Después, probar en una llamada real los puntos 5 a 7 de "Pruebas pendientes" del CLAUDE.md de Bubble.
3. **Bubble — pendientes de seguridad del 15-oct** (sección "Pendientes" del CLAUDE.md de Bubble, punto 7), más que el horario de llamadas salientes usa la zona del negocio y no la del cliente.
4. **G54:** el 28-oct, revisar que el informe mensual compare contra `linea_base`. **Rotación de horarios (pedido de la usuaria, 26-oct), cada lunes hasta la semana del 30-nov:** aprobar las ideas nuevas, generar los posts y programarlos en hora de Miami (`fecha_programada` sin "Z"): martes Facebook, miércoles LinkedIn, jueves Facebook, viernes Instagram. Horas por semana: 2-nov 12/17/19/08 · 9-nov 17/19/08/12 · 16-nov 19/08/12/17 · 23-nov 08/12/17/19 · 30-nov 12/17/19/08 (mar/mié/jue/vie). Con 6 semanas, cada horario junta 6 posts. Después, armar en Analytics el cálculo de `sugerencia-horario` con un piso mínimo: al menos 3 horarios con 5 posts medidos cada uno y una diferencia clara; si no lo alcanza, se deja la sugerencia vacía con su motivo.

**De la usuaria (no se pueden hacer desde acá):** probar "Probar mi agente" con el agente de voz encendido (lo hace ella); reconectar Instagram de Crating Express (token vencido el 13-oct); avisar al vendedor que el estimado de Lu ($159) se hizo con medidas equivocadas; permisos de estadísticas de LinkedIn.

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
454. **Corte de día 26-oct — diagnóstico con un solo script** (2026-10-26): para gastar menos uso, la rutina ahora corre `PROYECTO-SOL/scripts/diag-rutina.py [desde]` (lee los tokens de `.secrets.local.md`; correr con `python -I -X utf8`): cuenta workflows, ejecuciones por workflow, las que fallaron y la cola de G54. Resultado desde el 23-oct 14:00 UTC: 33 workflows (32 activos); 6 errores de Marco, uno por hora del 24-oct 20:00 al 25-oct 01:00 UTC, todos en `🔐 G54: Login (Follow-up)` con 500 vacío de G54: fue una caída de G54, no nuestra, y desde entonces sin errores. Ideas AI corrió hoy (2 ejecuciones). G54 sin posts en cola, como se esperaba. La tarea `g54-programar-semana-26oct` todavía no había corrido a las 7:28 Managua (está para las 7:30). **Novedades de G54** (vistas el mismo día): `/docs/rrss` sin cambios, pero `/docs/api` creció unos 12 KB y el panel tiene un bundle nuevo (`index-wpoZAdm_.js`). Walter entregó casi todo el Éxodo: un perfil de empresa editable con subida de logo (`POST /api/company-profile/logo`), la sugerencia de horario (`PUT /api/agent/companies/{id}/sugerencia-horario`), subida de videos de Reels (`POST /api/videos/upload`), pedidos de grabación (`/api/rrss/pedidos-grabacion` y `/api/agent/rrss/pedidos-grabacion`), el resultado en dinero por post (`/api/rrss/posts/{id}/resultado`), `top-ventas` y `social_idea_id` en los tratos (solo en el alta); además, las métricas ahora reemplazan la fila de la misma semana en vez de duplicarla, y en artículos se agregó `POST /api/articulos`, el endpoint real `sync-wordpress` y el idioma explícito. Todo esto aparece marcado como "New · 13-oct", aunque la copia del 22-oct no lo tenía. Probado en vivo, solo lecturas: todas las rutas responden (pedidos y top-ventas vacíos, el resultado del #199 en 0, y la ruta del agente devuelve "no existe el pedido", ya no 404 de ruta); `logo_url` y `whatsapp_numero` ya vienen en `/api/n8n/companies/1`, pero vacíos; `sugerencia_horario`, `mejor_plataforma` y `mejor_tipo_contenido` no aparecen ahí. Sigue pendiente que el cotizador deje de cargar el chat de prueba de n8n. Copias de las docs para la próxima comparación: `PROYECTO-SOL/2026/g54-docs/`.

455. **Tarea `g54-programar-semana-26oct`: ideas aprobadas y posts generados, pero nada programado porque el generador de imágenes está caído** (2026-10-26). Ideas AI corrió a las 11:00 UTC sin errores y dejó las ideas 555-558 de Crating Express (555 Facebook, 556 LinkedIn, 557 Instagram y 558 Facebook de tendencia). Revisadas (ninguna promete algo fuera del perfil) y aprobadas; las ideas viejas 503-518 no se tocaron. Content AI generó los posts 202 (FB, idea 555), 203 (LI, 556), 204 (IG, 557) y 205 (FB, 558) sin errores; los textos están completos, sin link de n8n, sin `wa.me` y sin código, y lo que afirman (ISPM-15, entrega el mismo día, sin costos ocultos) está en el perfil. **Pero ninguno tiene imagen:** las 4 corridas del `🖼️ Generador de Imágenes` (`1rsqmFabW5PjnlHy`) fallaron en `🎨 OpenAI: Generar Imagen` con "The model 'gpt-image-1' does not exist", y un reintento directo al webhook `generar-imagen` (post 202) falló igual. El workflow no cambia desde el 19-ago y generó bien el 19-oct, así que el problema es de la cuenta o la key de OpenAI, no del flujo. Siguiendo la tarea, ningún post quedó aprobado ni programado (0 alarmas): siguen como borradores con su texto, listos para programar cuando haya imagen. Otros detalles: el `copy_linkedin` de 202 y 205 repite la línea "Descubre más y solicita tu cotización aquí", y el 205 trae hashtags mal armados (`#PaletsADMedida`, `#EntregaSameDay`). **Pendiente de la usuaria:** revisar la cuenta de OpenAI (o volver a Pollinations/flux, que el Config del flujo todavía tiene), y después generar la imagen de los 4 y programarlos.
456. **Pedidos de grabación guardados en G54 de verdad** (2026-10-26), a pedido de la usuaria. `🎥 Pedidos de Grabación AI` (`17mc8CJkKH2qzsdA`) ya mandaba los pedidos a `POST /api/agent/rrss/pedidos-grabacion` desde el 13-oct, pero G54 respondía 422: exige `codigo` en cada pedido y el agente lo dejaba vacío cuando el pedido no sale de una idea aprobada. Ahora usa el código de la idea y, si no hay idea, uno propio (`R` + fecha + número, por ejemplo `R261026-1`); el error de G54 muestra el detalle que devuelve. Probado en real: los pedidos 1 y 2 de Crating Express (Instagram, 4 tomas cada uno) quedaron `pendiente`, se ven en `GET /api/rrss/pedidos-grabacion` y Reels AI los lee por `GET /api/agent/rrss/pedidos-grabacion/{id}`. Reels AI (`Xqb5sXsFDRz0Diys`) ya usaba el pedido cuando llega `pedido_id`; la doc no dice si el aviso `rrss_reel` de `subir-video` lo manda, y eso se confirma con el primer video real. **Horario sugerido (`PUT /api/agent/companies/{id}/sugerencia-horario`): no se conectó todavía.** De 55 posts publicados, 51 salieron a las 10:00 o a las 14:00 de Miami, y el mejor de los 10 con más alcance llegó a 5 personas, así que cualquier sugerencia sería ruido; queda a decisión de la usuaria. De paso: el nodo `📈 Obtener Métricas G54` de Analytics Semanal pide `/api/n8n/companies/{id}/rrss/metricas`, una ruta que no existe. Respaldo previo en el scratchpad de la sesión; la copia del repo está actualizada con los secretos tapados.
457. **Semana del 26-oct programada en horarios nuevos para juntar datos, y generador de imágenes arreglado** (2026-10-26), a pedido de la usuaria ("programa los posts de las próximas semanas en horarios distintos para juntar datos, y después armamos el cálculo con piso mínimo"). (1) **Imágenes:** el generador (`1rsqmFabW5PjnlHy`) fallaba porque OpenAI ya no acepta `gpt-image-1` ("does not exist", aunque sigue en la lista de modelos de la cuenta). Con un flujo temporal (borrado después) se vio que la cuenta tiene `gpt-image-1.5`, `gpt-image-2` y `gpt-image-2.5-*`; se pasó a `gpt-image-1.5`. Imágenes nuevas para 202-205; la del 204 se regeneró una vez porque traía faltas ("Sabemos cue", "exportació"). (2) **Textos:** se quitó la línea repetida de LinkedIn en 202 y 205 y se corrigieron hashtags (`#PaletsAMedida`, `#EntregaElMismoDía`, `#LogísticaSinSorpresas`, `#CajasPersonalizadas`). (3) **Programados en horarios que no se habían probado** (hora de Miami; antes casi todo salía a las 10:00 o 14:00): 202 Facebook mar 27 08:00, 203 LinkedIn mié 28 12:00, 205 Facebook jue 29 17:00 y 204 Instagram vie 30 19:00 (12:00, 16:00, 21:00 y 23:00 UTC). Las 4 alarmas quedaron en espera con su `post_id`. (4) **Rotación de las próximas semanas:** ver "Próxima sesión", punto 4. Con el permiso aprobado por la usuaria quedó creada la tarea local `g54-programar-semana-rotacion` (lunes 7:36 Managua, modo Auto, solo corre con la app abierta), que aplica la rotación hasta la semana del 30-nov y después avisa que hay que desactivarla. Respaldo del generador en el scratchpad de la sesión.
458. **Revisión de lo nuevo de la API de G54 contra nuestros agentes** (2026-10-26). (1) **Atribución por post:** `/api/rrss/posts/{id}/resultado` y `top-ventas` dependen de `social_idea_id` en el trato. Community AI ya lo manda en el alta cuando el comentario es sobre un post nuestro (busca el post por `post_id_platform`), así que esos clientes sí quedan atribuidos. Los de WhatsApp no, porque ya no hay código ni número en los posts (decisión de la usuaria del 20-oct, ítem 446) y WhatsApp no trae ninguna señal del post. Para atribuirlos hace falta otro método, que es decisión de la usuaria. (2) `📈 Obtener Métricas G54` de Analytics Semanal pide una ruta que no existe, pero nadie usa su salida y está con `continueRegularOutput`: se deja. (3) `🧹 Borrar semana ya guardada` quedó de más desde que G54 reemplaza la fila de la misma semana; se deja porque no rompe nada. (4) El logo y el primer Reel real pasaron a "Pruebas pendientes".
459. **Pie con los datos de la empresa en los correos de Camila** (2026-10-26), a pedido de la usuaria. En `🔍 Filtrar y Armar Emails` de `📧 Camila G54 — Nurture & Outreach` (`fahn0L68z5czTocE`), el pie "Generado automáticamente por Camila · …", que lo leía el cliente, se reemplazó por un pie con el logo (o el nombre si no hay logo), la dirección, el teléfono, el correo, la web y el horario, todo leído de G54 (`address`, `phones`, `emails`, `website`, `business_hours`, `logo_url`); lo que no esté cargado no aparece. Lleva la dirección física y una forma de darse de baja ("responde con la palabra BAJA"), que pide la ley de EE. UU. (CAN-SPAM). El texto plano del correo lleva el mismo pie. Probado fuera de n8n con el código de producción y los datos reales de Crating Express, en modo outreach y blog. No se corrió en real porque el flujo no tiene modo de prueba y crearía borradores para contactos reales. **Ojo:** el `logo_url` de Crating Express sigue vacío en G54 (revisado el 26-oct), así que el pie muestra el nombre hasta que se suba el logo. Además, hoy nadie procesa las respuestas "BAJA": quien apruebe los borradores tiene que respetarlas a mano (la ley da 10 días hábiles) hasta que se automatice. Respaldo previo en el scratchpad de la sesión; copia del repo sincronizada con los secretos tapados.
460. **Baja de los correos de Camila con un enlace firmado** (2026-10-26), a pedido de la usuaria ("que cuando alguien responda BAJA quede marcado y Camila no le vuelva a escribir"). Leer las respuestas "BAJA" no se puede hoy: llegan a la casilla de cada empresa, G54 todavía no las lee ("la entrada de correos como conversaciones llega después") y la contraseña de esa casilla nunca sale de G54. Por eso, en vez de pedir que respondan BAJA, el pie lleva un enlace "Si no quieres recibir más correos de X, puedes darte de baja aquí" (también en el texto plano). (1) Flujo nuevo `✉️ Camila — Baja de correos (G54)` (`FXRpSFH9ESdVah1P`, webhook GET `baja-correo-g54?c=empresa&d=trato&t=firma`): verifica la firma (HMAC-SHA256 en JavaScript puro, porque n8n no permite `require('crypto')`; probado igual al de Node en 3 casos), busca el trato en el tablero de esa empresa, le agrega `no_contactar_email <fecha> (baja desde el correo)` al principio de las notas (una sola vez) y muestra una página "Listo, no te vamos a enviar más correos de X". El secreto de las firmas es `CAMILA_BAJA_SECRET` en `.secrets.local.md`. (2) Camila (`fahn0L68z5czTocE`) arma el enlace firmado por trato y saltea los tratos con `no_contactar_email` en los dos modos. Probado en real con un trato de prueba (224, borrado después): el enlace válido marcó el trato y repetirlo no duplicó la marca; un enlace con otro número de trato o con firma falsa da "Enlace no válido"; el enlace que arma Camila es aceptado; y un trato marcado queda afuera en outreach y en blog. Los "BAJA" que lleguen por respuesta igual hay que respetarlos a mano. **Para Walter:** cuando G54 lea la casilla de la empresa, se puede marcar también a quien responda BAJA. Copias del repo con los secretos tapados.
461. **Logo de Crating Express cargado en G54** (2026-10-26), a pedido de la usuaria, para el pie y la cabecera de los correos de Camila. Las dos versiones del logo que publica cratingexpress.com (`LOGOS.-Photoroom.png` del menú y `Cratig-Expressdd.png` del schema) tienen el texto "Crating Express" en blanco, pensadas para fondo oscuro: sobre el recuadro blanco de la cabecera y el gris claro del pie solo se veían las cajas. Se armó una versión para fondo claro: el mismo logo del menú, recortado al borde y con el texto en gris oscuro (#1F2937), sin tocar las cajas (`PROYECTO-SOL/2026/10-QR-CRATING-EXPRESS/logo-ce-fondo-claro.png`). Se subió con `POST /api/company-profile/logo`; `logo_url` = `https://api.growth54.com/storage/logos/1/54ba1f29-….png`, y ya lo leen los agentes en `/api/n8n/companies/1`. Por pedido de la usuaria, el logo va **solo en el pie**: la cabecera de los correos de Camila lleva siempre la marca Growth54ai (antes ponía el logo de la empresa si existía). Se probó armando el correo con el código de producción: Growth54ai arriba y el logo una sola vez, en el pie. Esto también cierra la prueba pendiente 5. Si la empresa tiene un logo oficial para fondo claro, conviene reemplazarlo desde el panel.
462. **Bubble: seguimiento a contactos calificados y respuestas legales de Don Marc** (2026-10-26). Hecho en el repo de Bubble (ítems 503 a 505). El agente le da seguimiento solo a quien llamó y pidió que lo llamen después por algo concreto. La prueba queda en el CRM: texto, fecha, IP, navegador y llamada de origen si aceptó en el enlace del correo, o la transcripción si aceptó de palabra. Que el permiso se pida por correo es un interruptor por negocio, prendido por defecto. Todas las salientes respetan ahora el horario del cliente según su número (librería nueva `phonenumbers`). Don Marc respondió las 6 preguntas legales: no hace falta un permiso aparte, pero siempre tiene que haber forma de darse de baja; llamar en un horario oportuno; no hace falta avisar que se transcribe; la lista nacional de "No llamar" es solo para llamadas en frío; con EE. UU. alcanza al inicio. Se le planteó a la usuaria el riesgo de la TCPA con voz de IA antes de decidir, y por eso el correo quedó opcional y no se quitó. En el día también se le pasaron a Don Walter las versiones de Bubble para el servidor y un documento con las variables de entorno (sin las claves: las claves reales van en los `.env`, que la usuaria mandó aparte).

## Error conocido

`API Error: 400 messages: text content blocks must be non-empty` — ocurre en la interfaz web de Claude Code (no en n8n) cuando el historial de conversación tiene bloques de texto vacíos tras llamadas a herramientas. Es un bug de la plataforma. Si ocurre: iniciar nueva sesión; este archivo CLAUDE.md proporciona todo el contexto necesario automáticamente.

## Historial de cambios relevantes

Ítems 1 a 142 (hasta el 2026-07-16) y la sección vieja de Nomify (fuera de nuestro alcance) archivados en `PROYECTO-SOL/changelog-historico-2.md` el 2026-10-23.

---

## Reportes Diarios

> Solo los últimos 7 días (regla cambiada el 2026-10-26 para gastar menos uso: CLAUDE.md se carga entero en cada sesión). Al agregar un reporte, mover a `PROYECTO-SOL/reportes/` los de más de 7 días.

---

### 2026-10-24 (Sábado)

Arranqué levantando Bubble para revisarlo, con la consigna de cuidar el uso de Claude porque la semana ya venía en 90 %. Llamé al número que habíamos dejado desviado y solo repicaba: el desvío estaba bien, lo que pasaba era que el agente de voz no estaba prendido en ninguna parte. Lo prendí, volví a llamar y Sofía atendió, tomó un pedido de tulipanes para el 30 de octubre y dejó el resumen en Registros. De paso me llegó un rebote de Gmail: era el aviso al especialista, que el agente mandó porque pedí fotos, y salió a la dirección inventada de la Floristería demo, así que no es una falla de Bubble.

Después me dediqué a cómo se ve el panel. La agenda del negocio ahora tiene las mismas vistas que la de la agencia, Agenda y Calendario, con la ventana de cada cita y la opción de moverla. La configuración de la agenda y la prueba del agente pasaron adentro de Agente, porque siguen siendo configuración del agente. También saqué los huecos que dejaban las tarjetas estiradas y los topes de ancho que dejaban todo en una columna angosta con márgenes enormes, para que el panel llene la pantalla como G54; en Inicio tuve que corregir porque los cuadros quedaron desparejos y los acomodé en dos columnas parejas. Todo quedó con sus pruebas y subido.

Cerré con la primera misión que salió de la conversación con el ingeniero: Bubbli, la mascota de Bubble, un pez betta en una burbuja en la esquina que funcione como guía y consultor con accesos directos. Quedó analizada y anotada en pendientes; el 3D lo vamos a hacer nosotros en código el lunes, primero en computadora, con un estilo de marca y no fotorrealista. Paré con el uso semanal en 93 % para dejar el cupo del lunes completo; las demás misiones del ingeniero quedan para anotar, y el agente de voz quedó apagado.

---

### 2026-10-23 (Viernes)

Arranqué con la rutina de G54, todo en orden y sin nada programado hasta que corra la tarea del lunes 26. Después revisé la lista de pendientes y decidí ir de lo más chico a lo más grande, uno por uno, mirando el uso de Claude en cada paso porque la semana ya iba en 81 %. Empecé por los 18 detalles que quedaban de la auditoría de Bubble, primero los de pantalla: la hora de fin de una llamada que repetía la fecha, el reloj de arriba que en inglés salía en 24 horas, los precios sin formato de dólares, la etiqueta de Inicio tapada por una burbuja en el celular y la semana de la agenda, que ahora en inglés empieza en domingo como se usa en EE. UU. (en español la dejé en lunes).

Revisando Registros apareció algo más serio que lo anotado: el servidor no mandaba si la llamada pidió un especialista, el motivo de los errores ni si la llamada era saliente, así que las salientes iban a aparecer como entrantes. Con las citas pasaba algo parecido: un correo mal escrito se descartaba sin avisar y la confirmación nunca le llegaba al cliente, y un teléfono escrito con paréntesis creaba un cliente repetido; ahora el panel avisa, guarda el número igual que las llamadas, y volver a confirmar una cita cancelada manda el correo. Además los mensajes de error ya dicen qué campo está mal y en el idioma del panel, e Integraciones explica en palabras qué pasó con el último envío al CRM.

Cerré con tres cosas del agente de voz: el aviso de asistente virtual sale en el idioma del saludo, el reloj de 15 segundos ya no corta una reserva que encadena pasos, y el agente puede colgar solo después de despedirse en vez de esperar el corte por silencio. Quedaron 17 de los 18 detalles resueltos, con todas las pruebas en verde y subido; lo del agente falta probarlo en una llamada real, y solo queda el dato que inventó en la llamada de ejemplo. Paré con el uso semanal en 87 % para no pasar el 90 %, y respondo abajo la pregunta de Don Marc sobre lo legal.

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
