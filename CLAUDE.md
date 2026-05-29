# PROYECTO SOL — G54 Platform + Crating Express + Nomify

## Qué es este proyecto

Tres líneas de trabajo en un mismo repositorio:
1. **G54 Platform** — plataforma de adquisición digital multi-módulo (ver sección G54 abajo)
2. **Crating Express** — cliente piloto de G54 (embalaje industrial, Miami FL)
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
| **1** | **Social Media (RRSS)** | ✅ v1.3 listo | Strategist ✅, Content ✅, Distribution, Community, Sales, Analytics |
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
G54_BASE_URL   = https://apigrowth.mdarthurdigital.com
G54_N8N_TOKEN  = ""  (vacío = dev mode, acepta sin auth)
G64_AGENT_TOKEN = "" (vacío = dev mode, acepta sin auth)
G54_COMPANY_ID = 1   (Crating Express)
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

### Agentes del módulo (a construir secuencialmente):
1. ✅ **Content AI** — genera posts con framework 8 pasos SEO/AEO/GEO (hecho)
2. ✅ **Strategist AI** — define estrategia RRSS (9 pasos SEO/AEO/GEO), llena `estrategia` en G54. ID: `gPGiAG9dSlSwtbRp`. Archivo: `workflow-strategist-ai-g54.json`
3. ⏳ **Distribution AI** — publica en plataformas
4. ⏳ **Community AI** — responde comentarios/mensajes
5. ⏳ **Sales AI** — identifica oportunidades de venta
6. ⏳ **Analytics AI** — reportes de métricas

### Framework 8 pasos (Content AI v1.3):
1. Intención de búsqueda (informacional/comercial/transaccional/local)
2. Keywords secundarias (3-5)
3. AEO — respuesta directa para búsqueda por IA
4. Hook con keyword principal
5. Desarrollo (datos + prueba social)
6. GEO (Miami, South Florida, Miami-Dade)
7. Adaptación tono redes sociales
8. CTA con URL obligatorio + hashtags

### Estado actual v1.3:
- ✅ Lee empresa y servicios desde G54 API
- ✅ Lee ideas aprobadas desde G54
- ✅ Guarda posts generados en G54
- ✅ Email de aprobación con botones Aprobar/Rechazar
- ✅ Publica FB/IG via Make.com al aprobar
- ✅ Actualiza estados en G54 (procesando/publicado/rechazado/completado)
- ✅ 0 tokens hardcodeados de Airtable
- ⚠️ Estrategia usa fallbacks (primary_goal, target_market) hasta que Strategist AI la llene
- ⚠️ Ideas queue vacía — necesita ideas aprobadas en el panel G54

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
- **Aprobación por email**: usa `$execution.resumeUrl` de n8n + nodo Wait con webhook para flujo pausado

## n8n — Acceso

- **URL:** https://n8n.mdarthurdigital.com
- **API Token:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MGQxYjQ2MS1kNGI3LTRjOGMtOGMwZi1kNTNkOWExMjRjNzMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjg3ZGY5NzMtOTgzOC00ZjFmLWI1ZjktM2E5MzlmY2U5OTljIiwiaWF0IjoxNzc3NzQyNDMxfQ.o8WeA87-KQjr3gbWSoqMqqNpjaQN9rjYzO4Xuer-P7E

Para listar workflows: `GET /api/v1/workflows` con header `X-N8N-API-KEY: <token>`

**Nota importante:** Usar siempre `X-N8N-API-KEY` como header (NO `Authorization: Bearer`). Si el PUT retorna 401 con GET funcionando, es porque el token anterior fue invalidado — generar uno nuevo en Settings → API.

## WhatsApp — Crating Express

- **Número:** +1 786-788-0417 (comprado en Twilio, registrado en Meta WhatsApp Cloud API)
- **Phone Number ID:** `1083260611538246`
- **WABA ID:** `1449711680212677`
- **OTP de Twilio:** completado
- **Display Name:** Crating Express (aprobado)
- **Workflow n8n:** `CE WhatsApp Engine - Sistema de Conversión` (ID: `eCOX3ogMjToxZsh9`)
- **Webhook path:** `/whatsapp-ce`
- **Cotizador app:** https://cratingcotiza.mdarthurdigital.com/cotizar-caja
- **Cotizador API:** `POST https://cratingcotiza.mdarthurdigital.com/api/cotizar` — integrada ✅
- **Airtable tabla leads:** `WhatsApp_Leads` en base `appUOYi54iBfaDcLn`

### Flujo actual del bot (v IA híbrida + fallback triple + cotizador)
```
Webhook WhatsApp → Extraer Mensaje → Obtener Config Empresa (PERFIL DE EMPRESA)
  → Obtener WA Config (WhatsApp_Config) → Buscar Lead Existente
  → Obtener Productos (Airtable PRODUCTOS Y SERVICIO)
  → Preparar Contexto IA (promptSistema desde Airtable, hora Miami, historial)
  → Groq llama-3.1-8b-instant (continueOnFail) → ¿Groq OK?
      ✅ Sí → Parsear Respuesta IA
      ❌ No → DeepSeek deepseek-chat (continueOnFail) → ¿DeepSeek OK?
                  ✅ Sí → Parsear Respuesta IA
                  ❌ No → 🆘 Modo Contingencia (rule-based) → Parsear Respuesta IA
  → ¿Cotizar? (todos_recolectados=true AND dimensiones completas)
      ✅ Sí → API Cotizador → Enriquecer mensaje con precio + disclaimer
      ❌ No → continuar sin precio
  → ¿Lead Caliente? → Notificar Vendedor (emails desde WA_Email_Vendedor en PERFIL DE EMPRESA)
  → Enviar Mensaje WhatsApp
  → ¿Crear o Actualizar? → POST / PATCH Airtable (con Origen, Descripcion_Lead, Nombre_Contacto, Ultima_Actividad)
```

**Modo Contingencia** (si ambas IAs fallan): pregunta producto → medidas → fecha usando reglas simples, luego manda email al vendedor y le dice al cliente que será contactado.

Datos recolectados: producto, medidas, fecha, tipo_cajon, proteccion_extra, direccion
Campos Airtable: Respuesta_1 (producto), Respuesta_2 (medidas), Respuesta_3 (fecha), Notas (JSON: tipo_cajon, proteccion_extra, direccion)

### WhatsApp_Config — Tabla de configuración externa (tblj4radGXHN7HBJi)
Permite editar el comportamiento de Alex desde fuera de n8n sin tocar el workflow.

| Campo | Descripción |
|---|---|
| `Nombre_Config` | Identificador del registro (ej: "Crating Express — WhatsApp Bot Alex") |
| `Prompt_Sistema` | System prompt completo con placeholders `{{CATALOGO}}` e `{{INSTRUCCIONES}}` |
| `Instrucciones_IA` | Instrucciones adicionales que se insertan en `{{INSTRUCCIONES}}` |
| `WA_Mensaje_Bienvenida` | Mensaje de bienvenida para nuevos leads |
| `Emails_Notificacion` | Emails extra para alertas (no usado actualmente) |
| `WA_Palabras_Lead_Caliente` | Keywords para detectar lead listo para cerrar |
| `WA_FollowUp_24h` | Mensaje de seguimiento a 24h |
| `WA_FollowUp_72h` | Mensaje de seguimiento a 72h |
| `WA_FAQs` | Preguntas frecuentes para enriquecer respuestas |

**Record activo:** `recLR54SP26jEroCG` — "Crating Express — WhatsApp Bot Alex"

El nodo `⚙️ Obtener WA Config` lee esta tabla antes de Preparar Contexto IA.
El `Prompt_Sistema` se usa como base; `{{CATALOGO}}` se reemplaza en el nodo Code con el catálogo real de Airtable.

### Cotizador API — Integración
- **Endpoint:** `POST https://cratingcotiza.mdarthurdigital.com/api/cotizar`
- **Body:** `{ "tipo_caja": "cajones_cerrados", "cant": 1, "largo": 100, "ancho": 50, "alto": 60 }`
- **Response:** `{ "precio_total": 285.00, "dimensiones_calc": { ... } }`
- **Valores válidos para tipo_caja:** `cajones_cerrados`, `jaulas`, `palets_medida`, `cunas`, `plataformas_contenedor`, `embalaje_ferias`, `mayor`
- Alex extrae `tipo_caja_api` y `dimensiones` (largo/ancho/alto en cm) durante la conversación
- La cotización solo se solicita cuando `todos_recolectados === true` y las dimensiones están completas
- El precio se adjunta al mensaje con un disclaimer: *"Este es un estimado... precio final puede variar..."*

### WhatsApp_Leads — Campos actuales
| Campo | Tipo | Descripción |
|---|---|---|
| `Respuesta_1` | Text | Producto de interés |
| `Respuesta_2` | Text | Medidas |
| `Respuesta_3` | Text | Fecha requerida |
| `Notas` | Text | JSON: tipo_cajon, proteccion_extra, direccion |
| `Historial_Mensajes` | Text | Conversación completa |
| `Estado` | Select | Nuevo / Activo / Lead Caliente / Completado / Inactivo |
| `Origen` | Select | RRSS / Sitio web / QR / IA de ventas / Referido / Desconocido |
| `Descripcion_Lead` | Multiline | Resumen del lead para el vendedor |
| `Nombre_Contacto` | Text | Nombre del cliente (si se identifica) |
| `Ultima_Actividad` | DateTime | Timestamp último mensaje |

### Emails de notificación al vendedor
- Vienen del campo `WA_Email_Vendedor` en PERFIL DE EMPRESA (`tblkmBqXrpmGcTNUM`)
- Soporta múltiples emails separados por salto de línea (`\n`)
- El nodo `📧 Notificar Vendedor` hace `sendTo = emailVendedor.split('\n').join(',')`
- Fallback: `risosadmi@gmail.com` si el campo está vacío

### Comportamiento de Alex (IA)
- **Prompt vive en:** Airtable `WhatsApp_Config` → campo `Prompt_Sistema` (editable sin tocar n8n)
- **Idioma**: detecta el idioma del cliente y responde en el mismo (ES o EN)
- Saludo con hora Miami (UTC-4): buenos días 6-11, buenas tardes 12-18, buenas noches 19-5
- Orden de recopilación: producto → medidas (si no sabe → pregunta modelo → busca specs) → fecha → tipo_cajón (pregunta preferencia primero) → protección extra (aclarar que es costo adicional) → dirección (solo si acepta visita)
- NUNCA repite datos ya confirmados en mensajes posteriores
- NUNCA pregunta método de envío (aéreo/marítimo/terrestre) — no es relevante
- Lee el mensaje del cliente antes de avanzar al siguiente dato
- Al dar el link del cotizador: mencionar que pueden enviar foto por WhatsApp al +1 786 558-6007
- Catálogo real de Airtable: Cajones cerrados, Jaulas, Palets a medida, Cunas, Plataformas en contenedor, Embalaje para ferias, Al por mayor
- Groq credential ID en n8n: `jORffbRhRNohHT1B` — key actualizada 2026-05-05 (ver en n8n Settings → Credentials)
- DeepSeek API key: `sk-035f6eddd6fd4602b7d91c6e9ff03dfe` (credential n8n ID: `YSdODZVNFGSB3Ih9`) — **⚠️ sin saldo**

### Info de empresa que Alex conoce
- Servicio mismo día disponible — sin costo adicional por urgencia
- Descuentos por volumen para pedidos de 2+ unidades
- Servicio on-site en Miami-Dade y alrededores
- Protección interior (foam, burbuja, esquineras) = servicio adicional con costo extra
- ISPM-15 / NIMF-15 incluido en todos los cajones para exportación

### Límites de APIs
- Groq llama-3.1-8b-instant: 500,000 tokens/día (plan gratuito) — se resetea a medianoche Miami
- DeepSeek deepseek-chat: ⚠️ **sin saldo** — si Groq falla → Contingencia activa directamente
- Si Groq se agota → Modo Contingencia activa automáticamente (recopila datos básicos + email al vendedor)

## VAPI — Alex Voz

- **API Key:** `9ff54869-33de-4f84-a8b7-2801afc3d355`
- **Assistant ID:** `69fedf52-005f-4cde-a87d-5b421e7911b9`
- **Nombre:** ALEX
- **Modelo:** llama-3.3-70b-versatile (en Groq)
- **Voz ID:** `onwK4e9ZLuTAKqWW03F9` (ElevenLabs)
- **Workflow n8n:** `📞 CE Voice Agent — Vapi Webhook` (ID: `FYKfTJBfgwsMpJV7`)
- **Resumen diario:** `📞 CE Voice Agent — Resumen Diario de Llamadas` (ID: `FTa48iKiRIMW5BNB`)
- **Número de llamadas:** +1 786-788-0417 (mismo Twilio)

## Otros workflows activos (descubiertos 2026-05-08)

| Workflow | ID | Trigger | Estado |
|---|---|---|---|
| CE Mantenimiento Web - Calendario Automático | `T9J845yE4sd8Dde5` | Diario 13:00 | ✅ Corre todos los días — publica/comparte contenido web. Destinatarios incluyen emails externos; `webmaster@omegacb.com` rebota (eliminar) |
| 📬 CE Gmail Monitor — Detectar Respuestas de Leads | `cJZV7jcwlbFoW5qJ` | Cada hora | ✅ Monitorea Gmail en busca de respuestas de leads |

## n8n Tags — Alex

Tag `Alex` (ID: `2CrVJWitAB77MgTJ`) aplicado a los 4 workflows del agente:

| Workflow | ID | Tags |
|---|---|---|
| CE WhatsApp Engine - Sistema de Conversión | `eCOX3ogMjToxZsh9` | Alex, whatsapp |
| 📞 CE Voice Agent — Vapi Webhook | `FYKfTJBfgwsMpJV7` | Alex |
| 📞 CE Voice Agent — Resumen Diario de Llamadas | `FTa48iKiRIMW5BNB` | Alex |
| 📞→💬 VAPI → WhatsApp Handoff | `jfoJDSidx1sJlOrr` | Alex |

### Diferencias voz vs WhatsApp
| Voz | WhatsApp |
|---|---|
| Recopila: medidas + peso + descripción (3 datos) | Recopila: producto + medidas + fecha + tipo_cajón + protección + dirección (6 datos) |
| Bilingual ES/EN automático | Bilingual ES/EN automático |
| Manejo de silencio + fin de llamada | No aplica |
| Sin recomendación de tipo de cajón | Recomienda tipo específico del catálogo |

### Pendiente / próximas mejoras
- [x] ~~Integrar API del cotizador~~ ✅ Integrada — `POST /api/cotizar`
- [ ] Activar LinkedIn en workflow RRSS cuando se tenga token
- [ ] Probar VAPI → WhatsApp Handoff con llamada real (bloqueado por reinicio n8n)
- [ ] Probar planilla Nicaragua completa (bloqueado por reinicio n8n)
- [ ] Recargar saldo DeepSeek o reemplazar con otro fallback
- [ ] Confirmar aportaciones + marcador de huella en Planilla Nicaragua

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

## Nomify — Planilla Nicaragua (Express + MariaDB)

### CRÍTICO: Repositorio correcto

> **SIEMPRE** usar `WX-MDA/Nomify`, rama `sol/feature-inicial`.
> El repo `risosdigitales/rrss-automatizaci-n` (también llamado `PROYECTO_SOL`) es el repo de RRSS/Crating Express — la planilla NO va ahí.
> En sesiones donde el MCP de GitHub está conectado solo a `risosdigitales`, no se puede pushear a `WX-MDA/Nomify` directamente — abrir nueva sesión con acceso al repo correcto.

### Estructura local en Windows

```
C:\Users\Orison3\Documents\PROYECTO SOL\2026\Nomify\
  bk_nomify\         ← Express backend (git repo → WX-MDA/Nomify, rama sol/feature-inicial)
  ft_nomify\         ← HTML/CSS/JS frontend (carpeta hermana, NO repo git separado)
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

- [ ] Ingresar los 8 empleados reales (eliminar: María García, Carlos López, Ana Martínez, Roberto Sánchez)
- [ ] Crear usuario admin real: `node create-admin.js` y cambiar contraseña desde la app
- [ ] Invitar usuarios reales con sus roles
- [ ] Confirmar definición de "aportaciones" y marcador de huella con quien corresponda
- [ ] Probar flujo completo: login → empleados → generar planilla → recibo

---

## Reportes Diarios

> Los últimos 14 días. Anteriores archivados en `PROYECTO-SOL/reportes/`.

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

### 2026-05-21 (Miércoles)

El día estuvo dedicado a migrar la Planilla Nicaragua del stack Netlify/Airtable al nuevo stack Express + MariaDB, que vive en el repositorio `WX-MDA/Nomify` (rama `sol/feature-inicial`). Se descubrió durante la sesión un problema crítico de repositorio: el MCP de GitHub estaba conectado únicamente a `risosdigitales/rrss-automatizaci-n` (PROYECTO_SOL), que es el repo de Crating Express, y todos los pushes de código de planilla iban a ese repo equivocado. El código correcto de Nomify debe vivir en `WX-MDA/Nomify`, que tiene la estructura `bk_nomify/` (Express backend) + `planilla-web/` (frontend HTML/CSS/JS) como carpetas hermanas.

Se realizó la migración completa de auth: se eliminó toda dependencia de Netlify Identity (`netlifyIdentity`) de los 13 archivos HTML, se reemplazó con el sistema JWT propio, y se unificó el patrón `onReady(roles, fn)` como punto de entrada de todas las páginas. Se eliminaron los 12 archivos de `netlify/functions/` que apuntaban a Airtable. Se creó `usuarios.html` con CRUD completo de usuarios del sistema (solo Master). Se agregó `id="link-usuarios"` al nav de todas las páginas que lo faltaban.

El motor de cálculo de planilla quedó completamente en código Express (`planillasRoutes.js → POST /api/planillas/calcular`), con soporte de INSS_Base, pausado de adelantos/deducciones, descuento de cuotas de préstamos y registro de historial.

Al cierre se documentó todo en CLAUDE.md (esta sección) para que en una nueva sesión conectada a `WX-MDA/Nomify` se puedan pushear todos los archivos correctamente. El código listo para pushear está en `/home/user/RRSS-AUTOMATIZACI-N/planilla-server/` (backend) y `/home/user/RRSS-AUTOMATIZACI-N/planilla-web/` (frontend, carpeta local renombrada a `ft_nomify/` — ver estructura). Queda pendiente hacer ese push y luego ingresar los 8 empleados reales.

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
