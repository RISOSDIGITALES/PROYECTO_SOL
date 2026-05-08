# RRSS Automation — Crating Express

## Qué es este proyecto

Automatización completa de redes sociales para **Crating Express** (empresa de embalaje/crating industrial en Miami, FL). Funciona en **n8n** con dos workflows JSON importables.

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
- **Token:** en Netlify → Planilla-nicaragua → Variables ambientales → `AIRTABLE_TOKEN` (empieza con `pat8DWg`)

| Tabla | ID |
|---|---|
| Empleados | `tblwEpef3eoKtSmQe` |
| Préstamos | `tbln3xy9hbjtzRGPa` |
| Adelantos | `tblEz4M50EUw7vT0U` |
| Extras | `tblb8OlnW60ItErxe` |
| Planillas | `tblZj3F2T5aoSKGEV` |
| Detalle Planilla | `tblxmAaz0k0Bv6r1y` |

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

### Motor de cálculo n8n
- **Workflow:** `🧮 Planilla Nicaragua — Motor de Cálculo` (ID: `jkFucDKb7JSe32ze`)
- **Webhook path:** `planillanica` (POST)
- **Nodos:** 14 — lee Empleados + Préstamos + Adelantos + Extras → calcula → guarda en Planillas + Detalle Planilla → actualiza estados
- **Lógica:** salario quincenal = bruto/2, INSS según INSS_Base, IR C$0, deduce préstamos y adelantos, suma extras
- **Estado:** ⚠️ Bloqueado — n8n necesita reinicio del servidor para registrar webhooks nuevos en memoria. Una vez reiniciado queda funcionando solo.

### Netlify — Planilla Web App
- **URL:** https://planilla-nicaragua.netlify.app
- **Repo:** `risosdigitales/rrss-automatizaci-n` → carpeta `planilla-web/`
- **Build:** Base dir: `planilla-web`, Publish: `.`, Functions: `netlify/functions`
- **Auth:** Netlify Identity (invite-only, confirmación por email activa)
- **Env var pendiente:** `N8N_PLANILLA_WEBHOOK` = URL real del webhook (actualizar tras reinicio n8n)
- **Estado:** ✅ App desplegada, Identity activo — pendiente invitar usuarios reales y activar webhook

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

### Siguiente paso Planilla
1. ~~Meter empleados reales en Airtable~~ ⏳ Sol cargada como prueba, faltan 7 reales
2. ~~Construir motor de cálculo en n8n~~ ✅ Listo
3. ~~Construir web app en Netlify~~ ✅ Desplegada
4. **EN PROCESO:** Construir backend local Node.js/Express en `planilla-backend`
5. **BLOQUEADO:** Reinicio de n8n → activa webhook planilla + VAPI handoff
6. Actualizar `N8N_PLANILLA_WEBHOOK` en Netlify tras reinicio
7. Confirmar: aportaciones + marcador de huella
8. Ingresar empleados reales, eliminar registros de prueba (María García, Carlos López, Ana Martínez, Roberto Sánchez)
9. Invitar usuarios reales a Netlify Identity

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
