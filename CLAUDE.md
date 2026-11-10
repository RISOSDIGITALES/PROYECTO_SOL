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
4. ~~Informe mensual del 28-oct~~ — confirmado el 28-oct: compara contra `linea_base` (ítem 467).
5. ~~Logo en los correos de Camila~~: cargado y visto en el correo armado con el código de producción el 26-oct (ítem 461); falta solo verlo en un correo real enviado.
8. **Primer Reel real** (ítems 456 y 458): grabar uno de los pedidos de grabación (1 o 2 de Crating Express) y subir el video desde el panel; confirmar que Reels AI escribe el texto y si G54 le manda `pedido_id` (la doc no lo dice).
6. **Botón "Ejecutar" de Prospección (paso 7):** el flujo `jg5SENgRpe2wLBTn` quedó rehecho y activo el 28-oct (ítem 474), con Foursquare y Tavily en vez de Google. Corrida real confirmada el 28-oct (tratos 226 y 227 de Crating Express). El 6-nov (ítem 528) Hunter se consultó en una corrida real y respondió bien, pero no tenía correo para ese dominio. Falta ver un correo encontrado por Hunter: va a salir solo en las corridas reales (Hunter cobra solo cuando encuentra).
7. ~~**Llamada real a Marco por teléfono (VAPI)**~~ — confirmada el 04-nov: una llamada transferida desde Bubble llegó al +1 786 y Marco contestó con `groq / llama-3.3-70b-versatile` ("Gracias por llamar a Creating Express. Soy Marco…", 43 s, US$0,085). Detalles vistos: la voz dice "Creating/Krating Express" y se despidió en inglés aunque le hablaron en español.

## Próxima sesión — por dónde seguir (actualizado el 2026-10-23)

**Cómo trabajar (pedido de la usuaria, 23-oct):** de a poco, un paso por vez, de lo más chico a lo más grande, enumerando qué se hace y reportando el % de uso (`mcp__ccd_session_mgmt__get_usage`) al terminar cada paso. Si el uso semanal pasa el 90 %, parar y avisar.

**Para gastar menos uso (revisado el 30-oct):** este archivo se carga entero en cada sesión y en cada mensaje, así que su tamaño es lo que más pesa. (1) Aquí quedan solo los ítems del changelog de los últimos 2 días; los demás van a `PROYECTO-SOL/historial/changelog-N-....md`. (2) Cada ítem nuevo, en 5 líneas o menos: qué se hizo, por qué y qué falta; el detalle técnico va en el mensaje del commit. (3) Solo los últimos 3 reportes diarios. (4) La referencia que casi no se usa va en su propio archivo con un puntero (por ejemplo, `PROYECTO-SOL/nomify/planilla-nicaragua.md`). (5) En Bubble, su CLAUDE.md guarda solo los últimos 10 ítems; el resto, en `docs/changelog-historico.md`. (6) Una sesión larga encarece cada mensaje: un tema grande y distinto (por ejemplo, el diseño de una mascota) va en su propia sesión. (7) Capturas de pantalla chicas (zoom o escala 0,5), sin repetirlas, y los ajustes de diseño pedidos juntos en un solo mensaje cuando se pueda.

**Orden de trabajo (lo nuestro):**
1. ~~**Bubble — seguimiento a contactos calificados**~~: hecho el 26-oct (ítems 503 y 505 de Bubble; ítem 462 de acá). Falta probarlo con una llamada real.
2. ~~**Bubble — último detalle de la auditoría**~~: el #62 se cerró el 27-oct: el dato sí estaba en el perfil del negocio demo (la auditoría se equivocó), y quedó igual una regla contra inventar plazos y condiciones. Después, probar en una llamada real los puntos 5 a 7 de "Pruebas pendientes" del CLAUDE.md de Bubble.
3. **Bubble — pendientes de seguridad del 15-oct** (sección "Pendientes" del CLAUDE.md de Bubble, punto 7). El tope de descargas CSV quedó hecho el 27-oct; el horario de las salientes ya usa la zona del cliente (ítem 462). El cifrado del resumen, la escalación y las notas quedó hecho el 27-oct (ítem 515 de Bubble; en el servidor de Walter hay que correr `python -m scripts.encrypt_existing` una vez). La conversación limpia en el panel quedó hecha el 27-oct (ítem 516 de Bubble). Bubbli fase 3 (sugerencias con datos reales) quedó hecha el 27-oct (ítem 517 de Bubble), y Bubbli en el celular, el 29-oct (ítem 537 de Bubble). Queda solo la confirmación por SMS (en espera porque cuesta plata). Comprar números: solo la agencia (decidido el 27-oct; ya estaba aplicado desde el 21-oct).
4. **G54:** ~~revisar el informe mensual del 28-oct~~ (hecho, ítem 467). **Rotación de horarios (pedido de la usuaria, 26-oct), cada lunes hasta la semana del 30-nov:** aprobar las ideas nuevas, generar los posts y programarlos en hora de Miami (`fecha_programada` sin "Z"): martes Facebook, miércoles LinkedIn, jueves Facebook, viernes Instagram. Horas por semana: 2-nov 12/17/19/08 · 9-nov 17/19/08/12 · 16-nov 19/08/12/17 · 23-nov 08/12/17/19 · 30-nov 12/17/19/08 (mar/mié/jue/vie). Con 6 semanas, cada horario junta 6 posts. El cálculo de `sugerencia-horario` con el piso mínimo ya quedó hecho el 29-oct (ítem 487) y se activa solo cuando haya datos.

**Pedido del ingeniero (27-oct):** ~~animación de Jelly basada en Bubbli~~: hecha y entregada el 28-oct (ítem 469); las correcciones que hagan falta las hace el ingeniero.

**De la usuaria (no se pueden hacer desde acá):** probar "Probar mi agente" con el agente de voz encendido (lo hace ella); permisos de estadísticas de LinkedIn.

**Del ingeniero:** los 14 pedidos del Éxodo (5-nov: 4 resueltos el 4-nov y probados en vivo) (el 5-nov, tras la reunión con el ingeniero, el cotizador y lo legal pasaron a `g54/exodo/tarea-adicional-*.html`; revisado el 27-oct contra el panel `index-wpoZAdm_.js`: se sacaron 7 resueltos; el 28-oct se sumaron 6 de Correo y 2 de Backend, ítems 479 y 480) de `PROYECTO-SOL/g54/exodo/exodo-g54-VIGENTE.html`.

## Qué es este proyecto

**Dónde está cada cosa:** `PROYECTO-SOL/INDICE.md` (repo ordenado el 2026-11-03). La copia de todos los agentes de n8n está en `PROYECTO-SOL/agentes-n8n/` (se regenera con `python PROYECTO-SOL/scripts/exportar-agentes.py`); los nombres de archivo `workflow-*.json` que aparecen en este archivo son los de antes del orden.

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
| ~~📬 CE Gmail Monitor — Detectar Respuestas de Leads~~ | `cJZV7jcwlbFoW5qJ` | Cada hora | ⛔ **inactivo desde 2026-10-31** (ítem 504) — no borrado |
| 🎙️ Marco CE — 06 Procesador de Medios | `5GU89AeWsBZ86FWa` | Sub-workflow (executeWorkflowTrigger) | ✅ 27 nodos — el bug del Switch de ruteo se corrigió el 16-jul (ítem 137); las 4 ramas (audio/imagen/PDF-Excel/Word-PowerPoint) están resueltas sin depender de ninguna API externa salvo la imagen (OpenRouter, key propia de la usuaria) — ver ítems 224-226. Único límite que sigue sin confirmarse: no se puede generar un `media_id` real de WhatsApp desde este entorno para una prueba 100% de punta a punta. |
| 🌐 Analytics Semanal — Webhook Trigger | `ALchVw1UdgFHuDbm` | Webhook `analytics-semanal-g54` | ✅ existe, sin ejecuciones — wrapper que llama a `📊 Analytics AI Semanal — G54` |
| ~~WA Reply — Envío Manual desde G54~~ | `IzsQTrOI2SMUJ4xx` | Webhook `wa-reply-g54` | ❌ **ya no existe en n8n** (confirmado 404 el 22-ago) — borrado en algún momento sin que quede registro de cuándo ni por qué |
| CE Cotizaciones - CF7 → Airtable + Leads | `FU8QG1BVmT4r5Kjw` | Webhook (Contact Form 7) | ✅ en uso desde el 26-oct; desde el 31-oct guarda solo en el CRM de G54, sin Google Sheet (ítem 504) |
| 👁️ Vigía G54 — Supervisor RRSS | `zTm4tMOV9vMfUDnG` | Cada 2 horas + webhook `vigia-g54` (manual) | ✅ activo desde 2026-07-23, ver ítem 162 |

**Encontrados en diagnóstico del 2026-07-09** (no documentados hasta ahora, copia en `PROYECTO-SOL/agentes-n8n/`):
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

Toda la referencia (Airtable, Netlify, funciones, roles, migración) está en `PROYECTO-SOL/nomify/planilla-nicaragua.md`. Leerla con Read cuando se trabaje en la planilla.

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

**Ítems 143 a 322 del changelog (2026-07-17 al 2026-09-02) archivados en `PROYECTO-SOL/historial/changelog-1-items-143-322-2026-07-17-a-09-02.md`** — se movieron ahí el 2026-09-18 porque este bloque solo representaba el 62% del tamaño total de este archivo, cargado entero en cada sesión nueva — la causa real de que las conversaciones se quedaran sin contexto en horas en vez de semanas. Nada se perdió, es el mismo texto exacto. Si hace falta ese historial (Distribution AI, Marco, Community AI, Sales AI Motor, Analytics, Ideas AI, Content AI, las primeras semanas de Bubble 54), leer ese archivo puntualmente con la herramienta Read — no hace falta cargarlo entero.

**Ítems 323 a 440 (2026-09-04 al 2026-10-16) archivados en `PROYECTO-SOL/historial/changelog-2-items-1-142-y-323-440-hasta-2026-10-16.md`** el 2026-10-23, mismo criterio. Leer ese archivo puntualmente con Read si hace falta.

**Ítems 441 a 505 (2026-10-16 al 2026-10-31) archivados en `PROYECTO-SOL/historial/changelog-3-items-441-505-2026-10-16-a-10-31.md`** el 2026-10-30 (los 489 a 505, el 2026-11-03), mismo criterio. Leer ese archivo puntualmente con Read si hace falta.

**Ítems 506 en adelante (desde 2026-11-03) archivados en `PROYECTO-SOL/historial/changelog-4-items-506-en-adelante-desde-2026-11-03.md`** a medida que pasan los 2 días, mismo criterio.

532. **Corte de día 7-nov — diagnóstico limpio** (2026-11-07): 35 flujos (34 activos), 0 errores desde el 6-nov 12:00 UTC. La única corrida de Distribution es la del **209 en Instagram** (6-nov 13:00 UTC). No queda nada en cola en ninguna empresa: la rotación sigue el lunes 9-nov. Panel sin cambios (`index-D7b4wdqV.js`) y docs de G54 iguales a las copias del 5-nov y del 26-oct. Las corridas de Camila (Prospección 2, Nurture 5, Baja 6) son las pruebas del 6-nov; las 47 del Groq Relay, las pruebas de Bubble. Marco: 27 corridas del seguimiento horario. Telegram sin mensajes: sigue pendiente la prueba del ítem 512. Orison sin nada. **API reprobada en vivo, a pedido de la usuaria** (el diagnóstico solo compara la doc y el panel): sin cambios en los 14 pedidos. `/api/n8n/pages/{id}` y `companies/1` siguen respondiendo sin token (con los tokens de Facebook e Instagram); pie, plantilla, importar CSV, contactos, motivos de pérdida y lista de bajas, 404; `GET /api/crm/deals/merge` sigue en 500; `rrss/tokens` sin token de renovación de LinkedIn (el de publicación vence el 29-dic, lo renueva nuestro flujo); los borradores ya traen `scheduled_at`, `motivo` y `origen` como campos, y `email/config` trae `ultima_prueba_ok`. En Bubble se corrigió un pendiente viejo: Inworld ya está hecho (ítem 569), falta solo la llamada real. Uso semanal: 43 %.

533. **Bubble: la voz de Inworld tiene a Cartesia de respaldo** (2026-11-07), mientras la llamada real con Inworld queda para más tarde (detalle en el ítem 571 de Bubble). Antes, si Inworld fallaba o se quedaba sin crédito, la llamada quedaba muda: la IA tenía respaldo y la voz no. Probado con las claves reales: con una clave de Inworld rota, en el mismo pedido habló Cartesia. **Para el reporte:** el plan gratis de Inworld trae unos 70 minutos de audio (2-3 horas de llamadas de prueba) y después cobra US$15 por millón de caracteres; no dice si se renueva cada mes, y el consumo solo se ve en su portal.

534. **Bubble: Inworld pasa a ser la voz inicial, y la voz y el transcriptor tienen respaldo** (2026-11-07), a pedido de la usuaria (detalle en el ítem 572 de Bubble). Los negocios nuevos arrancan con Inworld; Inworld y Cartesia se cubren entre sí, y si Deepgram falla transcribe Inworld. Todo probado con claves rotas a propósito. **Para el reporte:** el transcriptor de Inworld cuesta ~US$0,15 la hora contra ~US$0,55 de Deepgram y entendió igual o mejor, pero tarda 2-3 s más en cerrar cada frase; por eso queda de respaldo y no de principal. La política de privacidad ya nombra a Inworld.

535. **Costo real por llamada de Bubble según la facturación** (2026-11-07), a pedido de la usuaria. Llamadas de la base: 52 con duración, promedio 78 s; con ~US$0,035/min sale ~US$0,046 por llamada (era ~0,061 con Cartesia). **Twilio (API de uso, real):** en noviembre, 46 llamadas entrantes a Bubble = 64 minutos cobrados (redondea al minuto) = US$0,2176, o sea **~US$0,0047 por llamada**, igual a lo calculado; las transferencias cobran el tramo saliente a ~US$0,014/min (4 veces la entrada); el número, US$1,15/mes. **Saldo de Twilio: US$5,80** (la cuenta también tiene el +1 786 de Marco). Deepgram no se pudo leer: la clave no tiene permiso de uso ni de saldo. LiveKit, Groq, Cartesia e Inworld solo muestran el consumo en sus portales. **Portales leídos el mismo día, con la sesión de la usuaria:** LiveKit está en el plan gratis Build (1.000 min SIP y 5.000 de WebRTC al mes incluidos; 5 sesiones de agente a la vez): noviembre 41 min SIP, octubre 6, **US$0**. El cobro de US$0,01/min por agente es solo para agentes alojados en LiveKit Cloud, y el nuestro corre aparte: **el ítem 520 sobreestimaba LiveKit** (~US$0,014/min); pasado lo gratis, con el plan Ship (US$50/mes) serían ~US$0,0045/min. Con eso, tener LiveKit propio ahorra mucho menos de lo calculado. Deepgram: 57,7 min desde septiembre por US$0,34 (**~US$0,0059/min**, no 0,0092), pagados del crédito gratis: quedan US$199,66. **Costo real por minuto, a precio de lista:** Twilio 0,0034 + LiveKit ~0,0045 + Deepgram 0,0059 + Groq ~0,002 + Inworld 0,006 ≈ **US$0,022/min, ~US$0,028 por llamada promedio**. **Lo que se paga hoy de verdad: solo Twilio, ~US$0,005 por llamada**; el resto sale de planes gratis y créditos.

536. **Bubble: precios frente a la competencia** (2026-11-07), a pedido de la usuaria. Informe en `docs/precios-competencia-2026-11-07.md` del repo de Bubble (3 investigaciones en paralelo; Trillet y Upfirst verificados a mano). El ancla es **Trillet Agency: US$299, 3.000 min, negocios ilimitados, dominio propio y reventa con Stripe**, minuto extra 0,12 + telefonía 0,014. Nuestros planes provisorios (`plans.py`, hechos con 0,073/min de costo) quedan peor: Agencia US$349 por 3.000 min y 15 negocios. **Para el reporte:** propuesta Starter US$79 (1.000 min, 3 negocios), Agency US$249 (3.000, ilimitados), Scale US$549 (8.000), con agenda, transferencia, CRM y telefonía incluidos en todos (~60-65 % de margen usando todo). Lo que nos falta para competir de verdad: que la agencia cobre a sus negocios desde Bubble y su marca propia. El ángulo durable: agentes bilingües para agencias con clientes hispanos (cambio de idioma en plena llamada, que ningún competidor confirma). Nada cambiado en `plans.py`: decide la usuaria.

537. **Bubble: paquetes para negocio independiente y para agencias** (2026-11-07), a pedido de la usuaria (sección 6 del informe de precios). Negocio: Básico US$49 (400 min), Plus 99 (1.000), Pro 179 (2.000, 2 números). Agencias: Starter 99 (1.000 min, 3 negocios), Agency 249 (3.000, ilimitados), Scale 549 (8.000). Márgenes de 60-76 % usando todo y 76-85 % usando la mitad. Mes gratis con tope de ~100 min. **Ojo:** riesgo de que un negocio salte la agencia y contrate directo, hasta que exista la marca propia. `plans.py` sin tocar.

538. **Bubble: los planes nuevos ya están en el código** (2026-11-07), a pedido de la usuaria (ítem 573 de Bubble). Los seis paquetes del ítem 537 en `plans.py`, todos con todas las funciones; la página pública y el registro los muestran en dos grupos ("Para tu negocio" y "Para agencias"). Pruebas en verde y página vista en el navegador. **Falta:** el mes gratis con tope de ~100 min y que el registro de un negocio independiente no diga "agencia".

539. **Bubble: mes gratis y registro para negocios** (2026-11-07), a pedido de la usuaria (ítem 574 de Bubble). Al aprobar una cuenta arranca un mes gratis con 100 minutos, sin cobro extra ni cobro del plan; pasado el tope, el agente transfiere o avisa y cuelga. El registro con un plan de negocio ya no dice "agencia". Pruebas en verde. **Falta:** que el negocio independiente no tenga que crear su negocio a mano al entrar.

540. **Rotación de horarios, semana del 9-nov** (2026-11-10), tarea programada. Corrió un día tarde (el lunes 9 no se ejecutó), así que usé las 4 ideas que Ideas AI creó el lunes 9-nov 12:00 UTC (corrida sin error), no ideas viejas. Aprobadas 563-566; posts programados en hora de Miami: **210 Facebook mar 10-nov 17:00**, **212 LinkedIn mié 11-nov 19:00**, **211 Facebook jue 12-nov 08:00**, **213 Instagram vie 13-nov 12:00**. Ninguna fecha había pasado. Las 4 alarmas en espera en `sNNhTEH8IzJsOIm3` (una por post, con la hora UTC correcta). Textos sanos, sin precios ni datos fuera del perfil. La imagen del 213 decía "SHIPPING INSOICE": regenerada una vez con `solo_titulo`; el título quedó bien, pero el papel del fondo sigue con letras chicas mal formadas ("SHIPPNG"). Se programó igual (rehecha el mismo día, ítem 543).

541. **Corte de día 10-nov — diagnóstico limpio** (2026-11-10): 35 flujos (34 activos), 0 errores desde el 7-nov 12:00 UTC. En cola los 4 posts del ítem 540 con la hora UTC correcta: **210 Facebook** hoy 22:00 UTC (17:00 Miami), **212 LinkedIn** 12-nov 00:00, **211 Facebook** 12-nov 13:00 y **213 Instagram** 13-nov 17:00, con sus 4 alarmas en espera. Corrieron solas Ideas AI (2), Analytics Semanal (2), Analytics Mensual (1), la renovación del token de LinkedIn (1), Vigía (37) y el seguimiento horario de Marco (74), sin errores. Panel sin cambios (`index-D7b4wdqV.js`) y docs de G54 iguales a las copias del 5-nov y del 26-oct. Orison sin nada. Ítems 523-531 (6-nov) archivados en el historial. Uso semanal: 1 %.

542. **Revisión a fondo de pendientes y de la guía de la API** (2026-11-10), a pedido de la usuaria. Los 14 pedidos del Éxodo, reprobados en vivo: **ninguno cambió** (mismo detalle que el 6-nov; anotado en el historial del Éxodo). Guía y panel iguales al 5-nov. **Encontrado:** la guía enlaza desde octubre `/planes.html`, una guía interna del ingeniero sobre planes y suscripciones (modificada el 5-nov, dice "Mayo 2026"): propone Free Trial, Starter US$29, Pro 79, Agency 149 y Enterprise, con Stripe, pero en la API hay **un solo plan activo**, "Plan Full Premium" (US$80 cada 29 días, todos los módulos) y no existen las rutas de suscripción; la guía además se contradice (dice 4 planes y muestra 5, y la tabla de módulos no trae Agency). No es pedido nuestro: queda anotado. **Pruebas pendientes:** ninguna se cumplió sola desde el 7-nov (las 74 corridas de Marco son el chequeo horario; sin mensajes de Telegram, Reels ni Prospección). Los borradores 7 y 8 del 28-oct siguen pendientes en Correo.

543. **Imagen del 213 rehecha y regla nueva en el generador** (2026-11-10), a pedido de la usuaria (pendiente del ítem 540). Los papeles del fondo salían con letras mal formadas porque el prompt solo controlaba el título. En `🎨 Construir Prompt` (`1rsqmFabW5PjnlHy`), en los modos con título (`solo_titulo`, `titulo_subtitulo`, `titulo_sub_detalles`) se suma que el título es el único texto y que papeles, etiquetas, cajas y carteles van en blanco; vale para todas las empresas. Regenerada la del 213 (Instagram): título bien escrito, papel en blanco y calculadora sin números. Sigue programado para el vie 13-nov 12:00 Miami. Respaldo previo en el scratchpad (`img-gen-antes-2026-11-10.json`); copia del repo actualizada.

544. **Bubble: el negocio independiente entra con su negocio ya creado** (2026-11-10), a pedido de la usuaria (ítem 575 de Bubble). Con un plan de negocio, el registro crea el negocio con su nombre, su agente y la voz inicial, y los resúmenes van al correo del registro. Servidor 664 en verde. Panel ajustado en el ítem 545.

545. **Bubble: el panel habla de "tu negocio" en las cuentas de negocio** (2026-11-10), a pedido de la usuaria (ítem 576 de Bubble). Menú con "Mi cuenta" y "Mi negocio"; en Inicio, el primer paso es completar los datos del negocio (horario y productos, lo que usa el agente para contestar), sin tarjeta de agencia ni "Volver a negocios". Probado en el navegador con una cuenta de prueba (ya borrada). Bubbli y la Ayuda, en el ítem 546.

546. **Bubble: Bubbli y la Ayuda para la cuenta de negocio** (2026-11-10), a pedido de la usuaria (ítem 577 de Bubble). Ayuda propia (presentación, primeros pasos, plan, facturación, número y las guías del agente, sin lo que es solo de agencias), Bubbli con sugerencias para "Mi negocio", y los atajos abren directo el negocio. **De paso:** la guía de planes de las agencias seguía con los precios de octubre; corregida. Probado en el navegador con la cuenta demo; pruebas en verde. "Mi cuenta", en el ítem 547.

547. **Bubble: "Mi cuenta" en la cuenta de negocio** (2026-11-10), a pedido de la usuaria (ítem 578 de Bubble). Sin perfil de agencia: Configuración pasa a llamarse "Mi cuenta" (acceso, idioma, contraseña, facturación e integraciones) y el perfil de agencia lleva ahí. Probado en el navegador; pruebas en verde. Equipo, en el ítem 548.

548. **Bubble: Equipo en "Mi cuenta" de la cuenta de negocio** (2026-11-10), a pedido de la usuaria (ítem 579 de Bubble). Invita a un administrador o a un operador (por ejemplo, la recepcionista: maneja el agente, la agenda y las llamadas, sin facturación ni equipo), asignado solo a su negocio. Probado en el navegador (invitar y sacar); pruebas en verde. **Ojo:** el servidor local manda correos reales desde la casilla de la usuaria; la invitación de prueba fue a un dominio inexistente y rebotó.

549. **Bubble: Configuración con tarjetas desplegables** (2026-11-10), a pedido de la usuaria (ítem 580 de Bubble). Cada tarjeta se abre tocando su título; arrancan abiertas solo las chicas (cuenta, idioma, apariencia) y el panel recuerda lo que dejaste abierto. Apariencia pasó al lado de la contraseña, en el hueco de la derecha. Vale para agencias y negocios. Visto en el navegador; pruebas en verde.

## Error conocido

`API Error: 400 messages: text content blocks must be non-empty` — ocurre en la interfaz web de Claude Code (no en n8n) cuando el historial de conversación tiene bloques de texto vacíos tras llamadas a herramientas. Es un bug de la plataforma. Si ocurre: iniciar nueva sesión; este archivo CLAUDE.md proporciona todo el contexto necesario automáticamente.

## Historial de cambios relevantes

Ítems 1 a 142 (hasta el 2026-07-16) y la sección vieja de Nomify (fuera de nuestro alcance) archivados en `PROYECTO-SOL/historial/changelog-2-items-1-142-y-323-440-hasta-2026-10-16.md` el 2026-10-23.

---

## Reportes Diarios

> Solo los últimos 3 reportes (regla cambiada el 2026-10-30, antes 7 días, para gastar menos uso: CLAUDE.md se carga entero en cada sesión). Al agregar uno, mover el más viejo a `PROYECTO-SOL/historial/reportes/AAAA-MM-DD.md`.

---

### 2026-11-07 (Sábado)

Arranqué con la rutina de G54, todo limpio, y revisé la API a fondo en vivo: ninguno de los pedidos del Éxodo cambió. Después seguí con Bubble mientras la llamada real con Inworld queda para más tarde: le puse respaldo a la voz y al transcriptor, para que si Inworld, Cartesia o Deepgram fallan la llamada no quede muda, y dejé a Inworld como voz inicial de los negocios nuevos porque empieza a hablar más rápido y cuesta un tercio. Luego saqué el costo real por llamada con la facturación de Twilio, LiveKit y Deepgram (tabla abajo); LiveKit lo tenía sobreestimado y su plan gratis nos alcanza.

| Pieza | Costo por minuto (precio de lista) | Cómo se paga |
| --- | --- | --- |
| Twilio (la línea telefónica) | US$0,0034 | Por uso, más US$1,15 al mes por número |
| LiveKit (el audio de la llamada) | US$0,0045 | Plan Ship: US$50 al mes, más el uso pasado lo incluido |
| Deepgram (pasa la voz a texto) | US$0,0059 | Por uso, sin cuota fija |
| Groq (la IA) | US$0,002 | Por uso, sin cuota fija |
| Inworld (la voz del agente) | US$0,006 | Por uso: US$15 por millón de caracteres |
| **Total** | **US$0,022 por minuto; US$0,028 por llamada promedio** | **US$0,028 por llamada, más US$50 al mes de LiveKit y US$1,15 por número** |

Con esos números hice el análisis de la competencia y vi que nuestros planes provisorios quedaban peor que Trillet, el competidor directo. Rearmé los paquetes en dos líneas: para el negocio independiente, Básico de US$49 con 400 minutos, Plus de US$99 y Pro de US$179; para agencias, US$99, US$249 y US$549, todos con agenda, transferencia y CRM incluidos y márgenes de 60 a 85 %. Los dejé en el código junto con un mes gratis de 100 minutos que arranca cuando Growth54 aprueba la cuenta, y con un registro que ya no habla de agencias cuando el plan es de negocio; todas las pruebas pasaron. El riesgo que dejo anotado es que un negocio se salte a su agencia y contrate directo mientras no exista la marca propia.

En la tarde resumí el método de validación de G54 porque Don Marc lo encontró muy largo: quedó en un esquema con una sola tabla de criterios, corregí dos datos que estaban viejos (OM en pausa y el CRM con montos ya entregado) y saqué los riesgos, los pendientes y el calendario; el documento queda al final. Además el ingeniero me dio la tarea de probar y configurar el nuevo reloj de marcación y añadir a los empleados. Ahí paré con todo subido y el uso semanal en 50 %.

**Resumen del método de validación de G54:** https://claude.ai/artifact/KJyBMsi9N8LncFNUybdvrH

---

### 2026-11-06 (Viernes)

Arranqué con la rutina de G54, todo limpio: salieron los posts de Facebook e Instagram, y el de Facebook confirmó el arreglo de ayer en Distribution. Revisé la API a fondo contra los 14 pedidos del Éxodo y ninguno había cambiado; de paso encontré que unir tratos duplicados da error y que la API acepta un campo que no existe sin avisar. Con lo que encontré hice que Camila respete la baja de correos con el campo nuevo de G54, lo probé dos veces con tratos falsos, y dejé el diagnóstico avisando solo cuando G54 cambia algo. También corrí Prospección con Hunter: respondió bien pero no tenía correo para ese negocio, y ahora, si Hunter falla o se queda sin búsquedas, el resumen lo avisa en vez de tragárselo.

En Bubble dejé hecha la conexión con Google Calendar por negocio: lo ocupado en Google tapa esos horarios para el agente y las citas se copian allá. Queda esperando que cree el proyecto en Google Cloud y, para clientes reales, que Google verifique la app. Escribí la política de privacidad, y como promete que una persona puede pedir una copia de sus datos o que los borren, agregué las dos cosas en la ficha del cliente. También ordené la tarjeta de Integraciones y corregí la guía que mezclaba español e inglés. Los términos y la política quedan como borrador hasta que los revise un abogado.

En la tarde quise probar DeepSeek e Inworld para bajar el costo de las llamadas. DeepSeek no da crédito gratis y la cuenta estaba en cero, así que decidí no cargarle saldo. Inworld sí: escuché muestras, descarté a Valeria y lo sumé a Bubble como segundo proveedor de voz con 9 voces. Empieza a hablar en 0,24 segundos contra 0,53 de Cartesia, cuesta un tercio, y en una llamada de ejemplo el transcriptor entendió el 95 %. Esa misma llamada mostró que la IA inventaba una hora límite de entrega y pedía todos los datos de un pedido en una sola pregunta; lo corregí y lo medí antes y después, y pasó de fallar casi siempre a no fallar ninguna vez. Falta una llamada telefónica real con Inworld. Ahí paré con todo subido y el uso semanal en 42 %.

---

### 2026-11-05 (Jueves)

Arranqué con la rutina de G54, todo limpio, y el post de LinkedIn salió a su hora. Después revisé los comentarios del reporte de ayer y Don Marc pidió comparar las IAs chinas contra Groq para la voz de Bubble; hice la comparación con precios oficiales y también la del costo por minuto de una llamada, que dejo abajo. En G54 arreglé un error que se repetía en Distribution con los posts de LinkedIn y les puse candado a los webhooks de VAPI, que confirmé con llamadas reales. Luego levanté Bubble y seguí las pruebas de ayer: el seguimiento sin correo, pasar a una persona cuando el cliente lo pide, que sin el aviso al especialista no prometa que alguien lo va a llamar, los avisos a otros sistemas por internet, cuánto gasta la IA en cada respuesta (menos de lo que tenía anotado) y el despliegue con Docker, donde corregí que el modelo de búsqueda en documentos se bajaba en cada arranque.

Me preguntaron si Bubble ya estaba listo y la respuesta honesta fue que todavía no para venderlo, sí para un piloto controlado. Con eso armé la página de términos y condiciones, que deja claro que el permiso de las personas a las que llama el agente es responsabilidad del negocio y que con otros sistemas solo damos el puente, y la casilla para aceptarlos al registrarse; falta que la revise un abogado. También dejé un correo de alerta si el agente de voz se cae y las migraciones de la base para el servidor, y vi que dos de los pendientes técnicos ya estaban resueltos desde octubre.

En la tarde tuve la reunión con el ingeniero sobre el Éxodo: reescribí el pedido de Métricas para explicar bien qué es cada pieza y por qué importa, saqué el cotizador y lo legal a dos archivos aparte, y dejé claro que la plantilla de los correos la crea G54 dentro de Camila. Después revisé la API y él ya había subido cambios el 4-nov; los probé en vivo con datos de prueba y funcionan: videos de más de 2 MB, teléfonos en un solo formato, monto y motivo al cerrar o perder un trato, duplicados, descarga en CSV y correos programados. El Éxodo quedó en 14 pedidos, y Camila ya manda en cada borrador por qué se le escribe a esa persona y de dónde salió su contacto. Ahí paré con todo subido y el uso semanal en 25 %.

**Para Don Marc — IAs chinas vs. Groq para la voz de Bubble**
Precios oficiales de noviembre, por llamada de unas 10 respuestas.
- Groq (el que usamos): unos US$0,004 por llamada.
- DeepSeek: unos US$0,001 a 0,002; ahorra US$2-3 cada 1.000 llamadas, pero tarda más en empezar a hablar y guarda los datos en China.
- Qwen (US$0,024) y Kimi (US$0,033): más caros que Groq.
- La IA es solo el 4 % del costo de un minuto de llamada (unos US$0,047); la voz es el 39 %.
- Cambiar la voz a Inworld ahorraría unos US$24 cada 1.000 llamadas, diez veces más que DeepSeek, pero falta probarla en español.
Recomendación: seguir con Groq; cualquier cambio queda en espera hasta que se decidan los gastos de Bubble.
