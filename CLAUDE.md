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
| **Gemini 1.5 Flash** | IA primaria (gratuita) |
| **Groq llama-3.3-70b** | IA fallback automático |
| **Airtable** | Base de datos (empresa, servicios, temas, contenidos) |
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

## Variables n8n requeridas (`$vars`)

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio — IA primaria |
| `GROQ_API_KEY` | Groq — IA fallback automático |
| `AIRTABLE_TOKEN` | Token personal de Airtable |
| `FB_PAGE_ID` | `1713965015486703` |
| `FB_ACCESS_TOKEN` | Token larga duración Facebook |
| `IG_ACCOUNT_ID` | `17841402206774619` |
| `IG_ACCESS_TOKEN` | Mismo que FB_ACCESS_TOKEN |
| `EMAIL_APROBACION` | `risosadmi@gmail.com` |

## IDs Airtable

- **Base:** `appUOYi54iBfaDcLn`
- **Perfil Empresa:** `tblkmBqXrpmGcTNUM`
- **Servicios:** `tbl2mwlJ149CLlMcd`
- **Temas Semanales:** `tblgrYurnqCg8uKtG`
- **Contenidos:** `tbl3ThftAg1Q36roD`

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
- **Cotizador app:** https://cratingcotiza.mdarthurdigital.com/cotizar-caja (API pendiente de recibir)
- **Airtable tabla leads:** `WhatsApp_Leads` en base `appUOYi54iBfaDcLn`

### Flujo actual del bot (v IA híbrida + fallback triple)
```
Webhook WhatsApp → Extraer Mensaje → Obtener Config Empresa
  → Buscar Lead Existente → Obtener Productos (Airtable PRODUCTOS Y SERVICIO)
  → Preparar Contexto IA (lee Respuesta_1/2/3 + Notas + saludoHora Miami)
  → Groq llama-3.1-8b-instant (continueOnFail) → ¿Groq OK?
      ✅ Sí → Parsear Respuesta IA
      ❌ No → DeepSeek deepseek-chat (continueOnFail) → ¿DeepSeek OK?
                  ✅ Sí → Parsear Respuesta IA
                  ❌ No → 🆘 Modo Contingencia (rule-based) → Parsear Respuesta IA
  → ¿Lead Caliente? → Notificar Vendedor (email con dirección si aplica)
  → Enviar Mensaje WhatsApp
  → ¿Crear o Actualizar? → POST / PATCH Airtable
```

**Modo Contingencia** (si ambas IAs fallan): pregunta producto → medidas → fecha usando reglas simples, luego manda email al vendedor y le dice al cliente que será contactado.

Datos recolectados: producto, medidas, fecha, tipo_cajon, proteccion_extra, direccion
Campos Airtable: Respuesta_1 (producto), Respuesta_2 (medidas), Respuesta_3 (fecha), Notas (JSON: tipo_cajon, proteccion_extra, direccion)

### Comportamiento de Alex (IA)
- **Idioma**: detecta el idioma del cliente y responde en el mismo (ES o EN)
- Saludo con hora Miami (UTC-4): buenos días 6-11, buenas tardes 12-18, buenas noches 19-5
- Orden de recopilación: producto → medidas (si no sabe → pregunta modelo → busca specs) → fecha → tipo_cajón (pregunta preferencia primero) → protección extra (aclarar que es costo adicional) → dirección (solo si acepta visita)
- NUNCA repite datos ya confirmados en mensajes posteriores
- NUNCA pregunta método de envío (aéreo/marítimo/terrestre) — no es relevante
- Lee el mensaje del cliente antes de avanzar al siguiente dato
- Al dar el link del cotizador: mencionar que pueden enviar foto por WhatsApp al +1 786 558-6007
- Catálogo real de Airtable: Cajones cerrados, Jaulas, Palets a medida, Cunas, Plataformas en contenedor, Embalaje para ferias, Al por mayor
- Groq credential ID en n8n: `jORffbRhRNohHT1B`
- DeepSeek API key hardcodeada: `sk-035f6eddd6fd4602b7d91c6e9ff03dfe` (credential n8n ID: `YSdODZVNFGSB3Ih9`)

### Info de empresa que Alex conoce
- Servicio mismo día disponible — sin costo adicional por urgencia
- Descuentos por volumen para pedidos de 2+ unidades
- Servicio on-site en Miami-Dade y alrededores
- Protección interior (foam, burbuja, esquineras) = servicio adicional con costo extra
- ISPM-15 / NIMF-15 incluido en todos los cajones para exportación

### Límites de APIs
- Groq llama-3.1-8b-instant: 500,000 tokens/día (plan gratuito) — se resetea a medianoche Miami
- DeepSeek deepseek-chat: cuota generosa (plan gratuito, muy barato si se paga) — fallback secundario
- Si ambas se agotan → Modo Contingencia activa automáticamente (recopila datos básicos + email al vendedor)

## VAPI — Alex Voz

- **API Key:** `9ff54869-33de-4f84-a8b7-2801afc3d355`
- **Assistant ID:** `69fedf52-005f-4cde-a87d-5b421e7911b9`
- **Nombre:** ALEX
- **Modelo:** llama-3.3-70b-versatile (en Groq)
- **Voz ID:** `onwK4e9ZLuTAKqWW03F9` (ElevenLabs)
- **Workflow n8n:** `📞 CE Voice Agent — Vapi Webhook` (ID: `FYKfTJBfgwsMpJV7`)
- **Resumen diario:** `📞 CE Voice Agent — Resumen Diario de Llamadas` (ID: `FTa48iKiRIMW5BNB`)
- **Número de llamadas:** +1 786-788-0417 (mismo Twilio)

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
- [ ] Integrar API del cotizador cuando esté disponible (https://cratingcotiza.mdarthurdigital.com/cotizar-caja)
- [ ] Activar LinkedIn en workflow RRSS cuando se tenga token
- [ ] Evaluar plan de pago para IA de respaldo (Groq Dev $10/mes = 500k tokens/día en modelo 70b)

## Error conocido

`API Error: 400 messages: text content blocks must be non-empty` — ocurre en la interfaz web de Claude Code (no en n8n) cuando el historial de conversación tiene bloques de texto vacíos tras llamadas a herramientas. Es un bug de la plataforma. Si ocurre: iniciar nueva sesión; este archivo CLAUDE.md proporciona todo el contexto necesario automáticamente.

## Historial de cambios relevantes

1. OpenAI → Gemini 1.5 Flash (gratuito) como IA principal
2. Gemini + Grok (xAI) como fallback → reemplazado por Gemini + **Groq** (más estable)
3. Gmail: migrado de `emailSend` a `gmail` OAuth2
4. Airtable: variables `$vars.AIRTABLE_TOKEN` en lugar de token hardcodeado
5. Canva: OAuth2 Generic configurado pero flujo actual usa Drive directamente
