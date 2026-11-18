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

## Pruebas pendientes (lista viva, actualizada el 2026-11-17)

Cambios ya hechos y probados por partes (código de producción con entradas simuladas o flujos temporales), que todavía no se confirmaron con un caso real de punta a punta. Al confirmar uno, sacarlo de acá y anotarlo en el ítem del changelog que corresponda.

1. ~~Foto real a Marco por WhatsApp~~ — confirmada el 16-oct con la conversación real de Lu (ítem 440).
2. **Nota de voz y PDF a Marco por Telegram** (ítems 397, 399 y 405): la foto ya quedó confirmada por la usuaria el 02-oct. La nota de voz falló ese día (credencial de Groq Whisper mal ubicada) y se arregló el 05-oct: volver a mandar un audio y confirmar que Marco responda según lo que se dijo. El PDF todavía no se probó.
3. **"Ejecutar seguimiento IA" enviado de verdad** (ítems 397 y 406): solo se probó con números inventados y con la ruta de Telegram en local. Telegram confirmado el 05-oct (la usuaria apretó el botón en su trato 210 y le llegó el mensaje; ejecución 19:27 UTC sin errores). Falta: por WhatsApp, escribirle a Marco desde un número real y, antes de 24h, apretar el botón. Probar también dos clics seguidos (el segundo no manda). Ojo: G54 responde `ok:true` aunque no se envíe.
4. ~~Informe mensual del 28-oct~~ — confirmado el 28-oct: compara contra `linea_base` (ítem 467).
5. ~~Logo en los correos de Camila~~: cargado el 26-oct (ítem 461); correo real enviado el 11-nov a anget3747@gmail.com (ítem 558), falta que la usuaria confirme cómo se ve.
8. **Primer Reel real** (ítems 456, 458 y 559): probado el 11-nov con un video de prueba en el pedido 2 (post 214, borrador). Reels AI escribe bien el texto, pero G54 no le avisa: falta registrar la clave `rrss_reel` en `/api/agent-endpoints` (apuntando a `reel-subido-g54`). G54 sí manda `pedido_id`. La clave no está en el catálogo de G54 (422 al registrarla): pedido al ingeniero en el Éxodo (11-nov). Después, repetir con un video real en el pedido 1.
6. **Botón "Ejecutar" de Prospección (paso 7):** el flujo `jg5SENgRpe2wLBTn` quedó rehecho y activo el 28-oct (ítem 474), con Foursquare y Tavily en vez de Google. Corrida real confirmada el 28-oct (tratos 226 y 227 de Crating Express). El 6-nov (ítem 528) Hunter se consultó en una corrida real y respondió bien, pero no tenía correo para ese dominio. Falta ver un correo encontrado por Hunter: va a salir solo en las corridas reales (Hunter cobra solo cuando encuentra).
7. ~~**Llamada real a Marco por teléfono (VAPI)**~~ — confirmada el 04-nov: una llamada transferida desde Bubble llegó al +1 786 y Marco contestó con `groq / llama-3.3-70b-versatile` ("Gracias por llamar a Creating Express. Soy Marco…", 43 s, US$0,085). Detalles vistos: la voz dice "Creating/Krating Express" y se despidió en inglés aunque le hablaron en español. **Despedida corregida el 11-nov (ítem 564): falta una llamada real en español para ver que se despida en español y corte.**

9. **Respuesta manual de WhatsApp desde el panel de G54** (ítem 590): probada de punta a punta con un contacto inventado (G54 la marcó enviado). Falta una real: que alguien escriba al WhatsApp de Crating Express y, antes de 24 h, responderle desde el panel; ver que le llegue y que Marco no conteste encima.

10. **Foto real a Marco por WhatsApp, otra vez** (ítem 597): la imagen ahora viaja embebida al modelo de visión. Mandar una foto al WhatsApp de Crating Express y ver que Marco la describa.

11. **Marco: descuento con 2+ unidades en una conversación real** (ítems 649 a 651, 658 y 659): tipo de caja, cantidad y pregunta del correo ya probados de punta a punta en una copia sin envíos. El aviso de descuento va a cratingexpress01@gmail.com y la usuaria no quiere correos de prueba ahí: confirmarlo con el primer cliente real que pida 2 unidades o más.

12. **Mónica v15 con OpenAI** (ítems 652 a 657): probada en risosadmi con Groq. Falta con OpenAI (gpt-4.1), la lectura de PDF e imágenes y la consulta general (Pinecone), con las credenciales puestas.

## Próxima sesión — por dónde seguir (actualizado el 2026-11-17)

**Cómo trabajar (pedido de la usuaria, 23-oct):** de a poco, un paso por vez, de lo más chico a lo más grande, enumerando qué se hace y reportando el % de uso (`mcp__ccd_session_mgmt__get_usage`) al terminar cada paso. Si el uso semanal pasa el 90 %, parar y avisar.

**Para gastar menos uso (revisado el 30-oct):** este archivo se carga entero en cada sesión y en cada mensaje, así que su tamaño es lo que más pesa. (1) Aquí quedan solo los ítems del changelog de los últimos 2 días; los demás van a `PROYECTO-SOL/historial/changelog-N-....md`. (2) Cada ítem nuevo, en 5 líneas o menos: qué se hizo, por qué y qué falta; el detalle técnico va en el mensaje del commit. (3) Solo los últimos 3 reportes diarios. (4) La referencia que casi no se usa va en su propio archivo con un puntero (por ejemplo, `PROYECTO-SOL/nomify/planilla-nicaragua.md`). (5) En Bubble, su CLAUDE.md guarda solo los últimos 10 ítems; el resto, en `docs/changelog-historico.md`. (6) Una sesión larga encarece cada mensaje: un tema grande y distinto (por ejemplo, el diseño de una mascota) va en su propia sesión. (7) Capturas de pantalla chicas (zoom o escala 0,5), sin repetirlas, y los ajustes de diseño pedidos juntos en un solo mensaje cuando se pueda.

**Para mañana (18-nov):**
1. Pedirle al ingeniero, en un solo mensaje: el JSON del flujo del Tutor del cotizador (disparador `9b9cd801…`) y del chat público (`91061fae…`), los accesos de Hermes y el acceso a la casilla de CE (tarea 1a de Mónica).
2. Mónica v15 (procesador `BPmfavlb7SaUPDpM`, receptor `cfKNcaWiS2qMRmVB`, apagados): poner credenciales (Gmail de pruebas, OpenAI, Pinecone, Telegram) y el chat del vendedor; guía en `C:\SOLANGE RESPALDOS\agente-correo-monica-SOL\v15-SOL\GUIA_v15.md`.
3. Mirar en Borradores de risosadmi que no quede ninguno "PRUEBA SOL", y avisarle al ingeniero que en la memoria de la app de producción quedó la conversación de prueba "PRUEBA SOL 1421" (la API no tiene borrado).
4. Que la usuaria revise el cotizador versión S en `http://127.0.0.1:8031` y decidir cuándo pasarlo a `DESARROLLO_SOL`.
5. Lunes 23-nov: última semana de la rotación de horarios.

**Orden de trabajo (lo nuestro):**
1. ~~**Bubble — seguimiento a contactos calificados**~~: hecho el 26-oct (ítems 503 y 505 de Bubble; ítem 462 de acá). Falta probarlo con una llamada real.
2. ~~**Bubble — último detalle de la auditoría**~~: el #62 se cerró el 27-oct: el dato sí estaba en el perfil del negocio demo (la auditoría se equivocó), y quedó igual una regla contra inventar plazos y condiciones. Después, probar en una llamada real los puntos 5 a 7 de "Pruebas pendientes" del CLAUDE.md de Bubble.
3. **Bubble — pendientes de seguridad del 15-oct** (sección "Pendientes" del CLAUDE.md de Bubble, punto 7). El tope de descargas CSV quedó hecho el 27-oct; el horario de las salientes ya usa la zona del cliente (ítem 462). El cifrado del resumen, la escalación y las notas quedó hecho el 27-oct (ítem 515 de Bubble; en el servidor de Walter hay que correr `python -m scripts.encrypt_existing` una vez). La conversación limpia en el panel quedó hecha el 27-oct (ítem 516 de Bubble). Bubbli fase 3 (sugerencias con datos reales) quedó hecha el 27-oct (ítem 517 de Bubble), y Bubbli en el celular, el 29-oct (ítem 537 de Bubble). Queda solo la confirmación por SMS (en espera porque cuesta plata). Comprar números: solo la agencia (decidido el 27-oct; ya estaba aplicado desde el 21-oct).
4. **G54:** ~~revisar el informe mensual del 28-oct~~ (hecho, ítem 467). **Rotación de horarios (pedido de la usuaria, 26-oct), cada lunes hasta la semana del 30-nov:** aprobar las ideas nuevas, generar los posts y programarlos en hora de Miami (`fecha_programada` sin "Z"): martes Facebook, miércoles LinkedIn, jueves Facebook, viernes Instagram. Horas por semana: 2-nov 12/17/19/08 · 9-nov 17/19/08/12 · 16-nov 19/08/12/17 · 23-nov 08/12/17/19 · 30-nov 12/17/19/08 (mar/mié/jue/vie). Con 6 semanas, cada horario junta 6 posts. El cálculo de `sugerencia-horario` con el piso mínimo ya quedó hecho el 29-oct (ítem 487) y se activa solo cuando haya datos.

**Tareas del ingeniero (reunión del 14-nov), estado al 17-nov:**
1. **Agente de Gmail de CE (Mónica):** (b) pagos unidos a su cotización, (c) borrador y aviso al vendedor por Telegram, (d) medidas convertidas por código y (e) aviso de lo que no es cotización, hechas en la v15 (ítems 652 a 657; además usa el factor de precio del panel). Importada apagada y probada en risosadmi con Groq. Falta: (a) analizar los correos reales de CE (sin acceso a la casilla) y encenderla con credenciales.
2. **HERMES:** sin empezar. El 16-nov el ingeniero le mostró a la usuaria cómo ejecutarlo en la máquina; falta su descripción y los accesos.
3. **Cotizador de Crating Express:** hecho en la versión S (ítems 640 a 648, rama `version-S`): Dashwork, ayuda, CRM propio (independiente del de G54, decisión de la usuaria), CSV, preferidos, proveedor, logo y botones de ayuda en el Tutor. Falta: que el chat responda con enlaces y que lea audios, PDF e imágenes (los flujos del chat están en el n8n del ingeniero, no en git ni con nuestra clave: pedir el JSON), y pasar la versión S a `DESARROLLO_SOL`.

**Pedido del ingeniero (27-oct):** ~~animación de Jelly basada en Bubbli~~: hecha y entregada el 28-oct (ítem 469); las correcciones que hagan falta las hace el ingeniero.

**De la usuaria (no se pueden hacer desde acá):** probar "Probar mi agente" con el agente de voz encendido (lo hace ella); permisos de estadísticas de LinkedIn.

**Del ingeniero:** los 15 pedidos del Éxodo (el 15.º, `rrss_reel`, sumado el 11-nov) (5-nov: 4 resueltos el 4-nov y probados en vivo) (el 5-nov, tras la reunión con el ingeniero, el cotizador y lo legal pasaron a `g54/exodo/tarea-adicional-*.html`; revisado el 27-oct contra el panel `index-wpoZAdm_.js`: se sacaron 7 resueltos; el 28-oct se sumaron 6 de Correo y 2 de Backend, ítems 479 y 480) de `PROYECTO-SOL/g54/exodo/exodo-g54-VIGENTE.html`.

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
- Fallback de Marco cuando Groq falla (corregido 14-nov, revisión G54): Groq → Zhipu (`glm-4.5-flash`) → OpenAI (`gpt-4.1-mini`, hoy sin clave: falla y sigue) → Modo Contingencia sin IA.

## VAPI — Marco Voz

- **API Key:** `<VAPI_API_KEY — ver .secrets.local.md>` (token actualizado 2026-06-19)
- **Assistant ID:** `69fedf52-005f-4cde-a87d-5b421e7911b9`
- **Nombre:** MARCO
- **Modelo:** llama-3.3-70b-versatile (en Groq)
- **Voz ID:** `cjVigY5qzO86Huf0OWal` (ElevenLabs `eleven_multilingual_v2`; corregido 11-nov, el de antes era `onwK4e9ZLuTAKqWW03F9`)
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
| 📤 WA Reply — Respuesta manual desde G54 | `2dat4nEoi8x8iLb2` | Webhook `wa-reply-g54` (clave `wa_reply` registrada en G54) | ✅ activo desde 2026-11-14 (ítem 590). El viejo `IzsQTrOI2SMUJ4xx` lo borramos a propósito el 14-ago porque no pausaba al bot |
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

628. **Corte de día 17-nov — diagnóstico limpio** (2026-11-17): 37 flujos (35 activos; apagados Gmail Monitor y el nuevo de TikTok). 0 errores desde el 16-nov 12:00 UTC (casi todo son las pruebas de ayer; el seguimiento de Sales AI corre cada hora sin fallar). En cola de CE: **215 Facebook** (hoy 19:00 Miami), 217 LinkedIn, 216 Facebook y 218 Instagram; sin ideas aprobadas sin usar. Panel (`index-D7b4wdqV.js`) y docs de G54 sin cambios; Orison sin nada. Ítems 587-608 (14-nov) archivados en el historial.

629. **G54: Community ya no publica enlaces, teléfonos ni correos ajenos** (2026-11-17), punto pendiente de seguridad de la revisión del 16-nov (ítem 611). Lo que escribía la IA se publicaba tal cual en la página: un comentario con instrucciones escondidas podía hacerle publicar un enlace falso. `🔍 Parsear Respuesta Community AI` ahora deja pasar solo enlaces, teléfonos y correos que salen de G54 (web, teléfonos y correos del perfil, el WhatsApp de la empresa, el prompt del bot), nunca del comentario; si hay algo ajeno, la respuesta viene vacía o pasa de 500 caracteres (900 en DM) sin poder recortarse, se publica una respuesta fija con el WhatsApp de la empresa (o "por mensaje privado"), en español o inglés. Quedan `filtro_aplicado` y `filtro_motivos` en la corrida. Probado: 13 casos locales y en vivo con 4 comentarios falsos (sin leads ni tratos creados). Encontrado al probar: `URL()` no existe en el sandbox de n8n (marcaba el propio WhatsApp); se lee el dominio con una expresión. La IA no cayó en la trampa, así que el bloqueo en vivo se vio solo con la primera versión.

630. **G54: todas las llamadas HTTP de los flujos tienen tope de tiempo** (2026-11-17), punto de confiabilidad de la revisión del 16-nov (ítem 611). 265 de 294 nodos HTTP de los 34 flujos activos no tenían límite: un servicio colgado dejaba la corrida trabada sin avisar. Antes de ponerlo se midió cuánto tardan hoy en 932 corridas reales (lo más lento: Zhipu 51 s, imágenes 17 s). Topes: 60 s para G54, Meta, LinkedIn y demás APIs (206 nodos); 120 s para las IAs (34); 300 s para llamadas a otros flujos, descargas, subidas, Whisper y visión (25). Con el tope, la llamada falla y sigue el camino de error de cada nodo (respaldo de IA, "seguir si falla" o el aviso por correo). Fuera, a propósito: el relay de Bubble. Respaldos de los 26 flujos en el scratchpad. Probado: Community y Vigía después del cambio, sin errores. **Falta:** unas 49 llamadas dentro de nodos de código (`helpers.httpRequest`) siguen sin tope.

631. **G54: la entrada manual del Vigía ya tiene candado** (2026-11-17), punto de seguridad de la revisión del 16-nov (ítem 611). `vigia-g54` (GET) no pedía clave: cualquiera con la dirección disparaba una corrida completa (Groq, lecturas de n8n, devolución de posts atascados). Nodo nuevo `🔒 ¿Llamada autorizada? (Vigía manual)`, igual al de Analytics semanal pero sin aceptar la clave en la dirección: pasa solo desde la red interna o con `X-Webhook-Key`. El disparo cada 2 h no pasa por ahí. Nadie más lo llama (ni el panel de G54). Probado: sin clave, IP interna falsa, clave en la dirección y clave falsa → frenado; con la clave → corrida completa sin errores. **Queda:** el formulario de cotización (`FU8QG1BVmT4r5Kjw`) sin candado, porque la clave hay que ponerla en el WordPress de CE; y Analytics semanal todavía acepta `?key=`.

632. **G54: alguien vigila al Vigía** (2026-11-17), punto de visibilidad de la revisión del 16-nov (ítem 611). Si el Vigía se apagaba, se trababa su disparador o fallaba seguido, nadie se enteraba. Flujo nuevo **`🛡️ Guardián del Vigía — G54`** (`9w8UUvgYArg0m4Zk`, activo, cada hora al minuto 20): lee en n8n si el Vigía está activo y sus últimas corridas, y avisa por correo a risosadmi si está apagado, si no corrió bien en 150 min o si sus 2 últimas corridas fallaron; repite cada 6 h mientras siga igual y avisa cuando vuelve a funcionar. Usa las mismas credenciales del Vigía (`n8n API — Self (Vigía)`, `Gmail SMTP — risosadmi`) y su propio Error Reporter. Probado con copias temporales (ya borradas): Vigía real → no avisa; flujo apagado → avisa una vez y no repite; al volver → aviso de recuperación. **Límite:** si se cae n8n entero, tampoco corre; para eso hace falta un monitor externo (por ejemplo UptimeRobot, gratis, pero pide crear una cuenta).

633. **G54: los nodos de código cierran la sesión maestra** (2026-11-17), punto de seguridad de la revisión del 16-nov (ítem 611), primera mitad. Cada inicio de sesión maestra crea un token que no vence, y n8n guarda la salida de cada corrida. Comprobado: `POST /api/auth/logout` lo invalida (después da 401). Los 10 nodos de código que entraban sin cerrar (Analytics semanal ×2, Camila baja, Community contexto, Pedidos ×2, Reels ×2, Vigía, Marco 02) quedan envueltos: el código original va adentro sin cambios y al terminar se cierra cada sesión que abrió, también si sale antes o falla (probado con un n8n simulado en los 3 casos). Reels pasaba el token de `Preparar Reel` a `Armar y Guardar Texto`: ya no lo devuelve, y el guardado abre su propia sesión. En vivo: Community y Vigía igual que antes. **Sin probar en vivo:** Marco 02, Analytics, Camila, Pedidos y Reels (el guardado de Reels se ve con el primer Reel real, Pruebas pendientes punto 8). **Falta:** los 17 nodos HTTP de login de 11 flujos (el token lo usan nodos siguientes), y 6 nodos con la contraseña maestra escrita en el código.

634. **G54: los logins HTTP también cierran sus sesiones viejas** (2026-11-17), segunda mitad del ítem 633. Los 18 nodos HTTP de login de 12 flujos pasan el token a cadenas largas y con ramas, así que en vez de buscar el último uso se agregó detrás de cada uno `🔓 Anotar sesión (…)`: deja pasar todo igual, anota el token en los datos del flujo y cierra los de corridas anteriores de ese mismo login con más de 30 min. En reposo queda como mucho una sesión abierta por login (antes, una más por corrida, para siempre). La base de G54 sale de la misma expresión del login; el exportador no copia esos datos al repo. En vivo: WhatsApp falso a Sales AI → corrida sin errores, zona horaria resuelta con la sesión y token anotado; contacto y trato borrados. **Falta ver** el primer cierre real (cuando corra de nuevo un login con más de 30 min de su token anterior, por ejemplo el seguimiento de Marco de las 15:00 y 16:00 UTC). De paso: en Sales AI, `🔍 Verificar Estado Lead` da 404 en cada mensaje (le falta el id de empresa en la ruta); no corta nada porque sigue si falla y la pausa ya se lee de otro lado (ítem 600).

635. **Marco vuelve a marcar como leídos los WhatsApp** (2026-11-17). `✅ Marcar como Leído` tomaba la clave de `$vars.IG_ACCESS_TOKEN`, pero las variables de n8n no están en la licencia (403): fallaba siempre con 401 y los clientes no veían las palomitas azules. Ahora usa la misma credencial del envío (`WhatsApp Cloud API — Marco (CE)`) y la API v19.0. Probado en un flujo temporal (borrado) con un id de mensaje inventado: Meta pasó de 401 a 400 "parámetro inválido", o sea que la clave sirve. **Falta** verlo con el próximo WhatsApp real. Revisado de paso: la contraseña maestra de G54 está escrita en 27 nodos de 19 flujos; moverla dentro de n8n no la protege (mismas personas la ven) y el repo ya la tapa, así que queda como riesgo aceptado hasta que G54 permita trabajar sin la sesión maestra. Los otros 4 usos de `$vars` son de Gemini, ya sin uso.

636. **G54: la pausa del bot vence sola a las 24 h** (2026-11-17), decisión de la usuaria (24 h), punto de utilidad de la revisión del 16-nov (ítem 611). El panel de G54 no tiene botón para reanudar el bot: una pausa (la pone `WA Reply` cuando el vendedor responde desde el panel) era para siempre. Ahora la pausa guarda su hora en `bot_pausado_en` y vence a las 24 h de la última respuesta del vendedor (cada respuesta la renueva). La leen igual los 8 nodos: `¿Bot puede responder?` de Marco, Telegram, Sales AI y Community, los seguimientos de Marco y Sales AI, `Preparar Mensaje (bot en pausa)` y `Preparar Contexto IA`. De paso: la pausa guardaba su hora en `fecha` y pisaba la fecha del pedido del cliente ("16/10"), y Sales AI le ocultaba `fecha` a la IA desde el ítem 600; las dos cosas corregidas. Hoy no había ninguna conversación en pausa. Probado: la regla con 5 casos en local, y en vivo dos contactos inventados en Sales AI (pausa de hace 25 h → responde; de hace 2 h → no responde; la fecha del pedido se conserva y la IA la ve); borrados. **Falta:** verlo con una respuesta real desde el panel (Pruebas pendientes, punto 9).

637. **G54: los posts publicados guardan su enlace (`link_url`)** (2026-11-17), punto de uso de la API de la revisión del 16-nov (ítem 611). `mark-published` acepta `link_url` (doc del 5-nov) para que el cliente abra el post desde el panel, pero Distribution AI no lo mandaba: ningún post publicado tenía enlace. Nodo nuevo `🔗 Armar Enlace del Post` entre las 9 publicaciones y `✅ G54: Estado → Publicado`: Facebook, LinkedIn y Reels de Facebook con el id que devuelve la red, Instagram pidiéndole el permalink a Meta; si falla, sigue sin enlace. `mark-published` lo manda solo si lo hay. Completados los 59 posts ya publicados de CE (Instagram 20, LinkedIn 10, Facebook 29; siguen publicados y con el mismo id); el 147 de Facebook ya no existe en Facebook. **Falta ver** la primera publicación real con el nodo nuevo: el 215 de Facebook (hoy 19:00 Miami). `top-ventas` no se sumó a Ideas AI: hoy devuelve vacío y seguirá así, porque los tratos no se enlazan a la idea del post (el código P se dejó de mandar el 20-oct); queda para el punto "saber qué post trae clientes".

638. **G54: la renovación de LinkedIn ya no tiene datos de un cliente** (2026-11-17), punto de multiempresa de la revisión del 16-nov (ítem 611). `🔄 LinkedIn — Renovar token (G54)` tenía en su Config la lista de empresas y el refresh token de CE (`EMPRESAS_JSON`). G54 no guarda refresh tokens (`/api/rrss/tokens` solo trae token y vencimiento), así que ahora viven en la memoria del flujo, que no se ve en la configuración ni se copia al repo. El flujo recorre todas las empresas de la cuenta maestra y renueva las que tienen LinkedIn en G54; si a una le falta el refresh token avisa `falta_refresh_token`. Para sumar una: POST a `renovar-linkedin-g54` (con la clave) con `{company_id, refresh_token}`. Migrado en dos pasos (token copiado a la memoria y comprobado idéntico antes de borrarlo del Config); prueba en seco: CE vigente (41 días), Orison sin LinkedIn. **Falta** ver la primera renovación real (cuando falten menos de 21 días, hacia el 8-dic). El router de Telegram sigue mandando la empresa 1 a Marco: es una excepción a propósito (motor propio de CE) y quedó explicada en su código, porque G54 no tiene un dato por empresa para "motor propio".

639. **G54: pendientes chicos de la revisión cerrados** (2026-11-17). (1) Sales AI: fuera `🔍 Verificar Estado Lead` (404 en cada mensaje) y el `🔀 ¿Bot puede responder?` que siempre daba sí; la pausa ya se lee en `Preparar Contexto IA`. (2) Los 22 candados dejan de aceptar la clave en la dirección (`?key=`): solo red interna o `X-Webhook-Key`. Antes se comprobó en las corridas guardadas y en VAPI que nadie la usaba así (G54 llama desde la red interna, VAPI y nuestros flujos con el encabezado). (3) Las 91 llamadas dentro de 57 nodos de código (25 flujos) tienen tope por defecto de 2 min (solo si la llamada no traía uno). (4) Confirmado el cierre de sesiones del ítem 634: en Sales AI las sesiones de más de 30 min dan 401 y las recientes siguen válidas. Además se cerraron las 446 sesiones maestras que seguían abiertas en el historial de n8n (950 corridas revisadas, menos las de los últimos 30 min). Probado después de todo: Community, Vigía, LinkedIn (en seco) y Sales AI con un WhatsApp falso (borrado), sin errores.

640. **Cotizador de CE: copia versión S, logo y zona de ayuda** (2026-11-17), tarea 3 del ingeniero (el CRM queda descartado por ahora, decisión de la usuaria). Copia de trabajo en `C:\SOLANGE RESPALDOS\cotizcratingexpress-wx-S` (worktree del repo del ingeniero, rama local `version-S` desde `DESARROLLO_SOL`; nada subido). Corre en local con `preview_start cotizador-S` (puerto 8031; PHP 8.3 y MySQL de Laragon, base `cotiz_s`, pruebas en `cotiz_s_test`; acceso en `ACCESO-LOCAL.txt` de esa carpeta, fuera de git; correos en modo log). (1) Logo: se guardaba solo como archivo y la app mostraba el logo genérico si faltaba `storage:link` o el servidor perdía los archivos (es lo que se ve hoy en producción); ahora se guarda en la base (`app_assets`) y se sirve en `/branding/logo`. (2) `/ayuda`: guía por pantalla con buscador, preguntas frecuentes y enlaces directos; las secciones de admin solo para admin. Commits `e3a0394` y `d656993` en `version-S`. Hallazgos para el ingeniero (no tocados): `/api/cotizar` y `/api/agent/email-threads` sin autenticación, `/limpiar-cotizacion` pública, el vendedor puede editar precios. **Falta:** que la usuaria lo revise y decidir cuándo pasarlo a `DESARROLLO_SOL`.

641. **Cotizador de CE, versión S: preferidos, proveedor y CSV** (2026-11-17), sigue del 640. La usuaria confirmó que el logo se perdía en cada despliegue (el arreglo de guardarlo en la base lo cubre). (1) Clientes: estrella de preferido (preferidos primero y resaltados), columna proveedor (manual, google, app.online), buscador y filtros (commit `c2ad400`). (2) `/clientes/csv`: exportar eligiendo columnas y filtros (UTF-8 con BOM, escapa fórmulas) e importar eligiendo columnas, proveedor por defecto y si actualizar o saltar; acepta `;` y archivos de Excel en Windows-1252, y una celda vacía no borra datos (error mío encontrado al probar y corregido) (commit `7572bdb`). Probados en local con datos inventados. **Trabados:** los temas 7 (chat con enlaces directos) y 8 (audios, PDF, imágenes) dependen del flujo del chat en n8n (`webhook/91061fae…/chat`), que nuestra clave no ve; el 1 (Dashwork) necesita que la usuaria diga qué mejorar.

642. **Cotizador de CE, versión S: Dashboard más fácil de leer** (2026-11-17), tema 1 de la lista, como lo pidió la usuaria: solo presentación, sin tocar cómo se calcula. Cada indicador dice qué es, trae una línea de detalle y un "?" con la explicación; los gráficos tienen subtítulo, nombres claros, leyenda con cantidad y %, meses en español y aviso sin datos; la tabla trae correo y teléfono con enlace; letras de 8-10 px agrandadas y se acomoda en celular (commit en `version-S`). Visto aparte y **no tocado** (decisión de la usuaria): el Monto potencial suma varias veces el mismo carrito (cada "+ agregar" crea un estimado con todo el carrito) y eso baja la conversión.

643. **Cotizador de CE, versión S: CRM propio, etapa 1 (embudo y tratos)** (2026-11-17), pedido de la usuaria ("CRM completo profesional"); decidió que sea **independiente del CRM de G54** (riesgo avisado: un cliente puede quedar en los dos con datos distintos). Tablero Kanban en `/crm` con 6 etapas, arrastrar y soltar, resumen (abiertos, pronóstico, ganado del mes, vencidos), filtros, vista lista, ficha con historial y motivo de pérdida obligatorio. Las solicitudes web entran solas como trato. Admin ve todo; vendedor, lo suyo y lo sin asignar. Probado en local (commit en `version-S`). **Siguientes etapas propuestas:** actividades y tareas con recordatorios, ficha 360 del cliente, reportes de ventas, configurar etapas desde el panel.

644. **Cotizador de CE, versión S: CRM etapa 2 (actividades y tareas)** (2026-11-17). En la ficha de cada trato se registran llamadas, correos, reuniones, WhatsApp y notas, y se crean tareas con fecha y responsable; `/crm/tareas` las agrupa en vencidas, hoy y próximas; el menú muestra en rojo las vencidas y las de hoy. Probado en local (alta, completar, permisos de vendedor). **Recordatorios por correo** quedan fuera: necesitan el programador de tareas de Laravel (cron) en el servidor, que es del ingeniero. **Siguen:** ficha 360 del cliente, reportes de ventas y configurar las etapas.

645. **Cotizador de CE, versión S: CRM etapa 3 (ficha 360 del cliente)** (2026-11-17). `/clientes/{id}` junta en una pantalla: en juego, ganado, tasa de cierre, último contacto, empresa, contactos, tratos, estimados web (por sus tratos y por los correos de la empresa y sus contactos), tareas y actividad. Probado en local. **Siguen:** reportes de ventas y configurar las etapas.

646. **Cotizador de CE, versión S: CRM etapa 4 (reportes de ventas)** (2026-11-17). `/crm/reportes` con período (mes, 3, 6, 12): ganado, tasa de cierre, ticket promedio, días hasta ganar, pronóstico, embudo actual, ganado por mes, por vendedor y por origen, y motivos de pérdida. Probado en local con tratos cerrados en distintos meses (los totales cuadran). **Falta del CRM:** configurar las etapas desde el panel; recordatorios por correo (necesitan cron, del ingeniero). **Subido** como rama aparte `version-S` en GitHub del ingeniero (`8177eca`, decisión de la usuaria); `DESARROLLO_SOL` sin tocar. Para producción: 4 migraciones nuevas (respaldar la base antes) y 1 línea cambiada en `CajaController`.

647. **Cotizador de CE, versión S: el admin configura las etapas del CRM** (2026-11-17). `/crm/etapas` (botón "Etapas" del embudo y enlace en Configuraciones): crear, renombrar, color, probabilidad, tipo, reordenar (↑ ↓ o arrastrando) y borrar. Reglas: siempre una etapa abierta, una ganada y una perdida; una etapa con tratos no cambia de tipo y, para borrarla, sus tratos pasan a otra del mismo tipo con nota en el historial. Sin migraciones nuevas. Probado en local (embudo y reportes con el orden nuevo) y con 8 pruebas automáticas; commit `6766202` subido a `version-S`. Sigue trabado: chat con enlaces y audios/PDF/imágenes (flujo de n8n del chat sin acceso).

648. **Cotizador de CE, versión S: botones de ayuda en el Tutor** (2026-11-17). Comprobado: los flujos de n8n de los dos chats (público `91061fae…` y Tutor `9b9cd801…`) están en nuestro servidor y responden, pero no están entre los 38 flujos que ve nuestra clave (son del espacio del ingeniero). Por eso, del lado de la app, el Tutor muestra arriba del cuadro de texto "Ayuda de esta pantalla" (abre `/ayuda` en la sección de donde está) y atajos (cotización interna, nuevo trato, embudo, tareas, clientes, precio; Configuraciones solo admin). Las respuestas de la IA no cambian. Probado en local y con prueba automática; commit `2b1a04a` en `version-S`.

649. **Marco cotizaba todos los tipos de caja como cajón cerrado** (2026-11-17), encontrado al revisar el agente de correo Mónica. Marco (WhatsApp `zAhV8gEsXD8dCrXq` y Telegram `HaSG63Q9C2tGOLH3`) mandaba a `/api/cotizar` sus nombres (`jaulas`, `cunas`, `palets_medida`, `plataformas_contenedor`, `mayor`, `embalaje_ferias`), que el cotizador no reconoce y calcula como cajón cerrado: con 48×40×36, una cuna salía $207 en vez de $700 y un pallet $207 en vez de $90. Ahora `💰 API Cotizador` los traduce (`cuna`, `pallet_custom`, etc.). Probado con el nodo real en un flujo temporal (borrado): los 7 tipos dan el precio correcto. **Visto, sin tocar:** Marco manda siempre `cant=1`. Mónica: copia en `C:\SOLANGE RESPALDOS\agente-correo-monica-SOL` (fuera de git); su agente de hilos no convierte cm a pulgadas y fija el factor en 28.

650. **Marco cotiza la cantidad que pide el cliente** (2026-11-17), sigue del 649. El cotizador siempre recibía `cant=1` (el prompt de G54 no pide la cantidad). Ahora `🔍 Parsear Respuesta IA` del 03 la lee del texto del cliente ("3 cajas", "dos cunas", "son 4", "I need 2 crates"; nunca de lo que dice Marco ni de las medidas; un "una" no pisa una cantidad ya dicha), sin pregunta nueva ni cambio en el orden de pasos. WhatsApp y Telegram la mandan al cotizador y la muestran en el estimado; si el cliente no la dijo, el precio aclara "por 1 unidad". De paso, el precio sale redondeado ($165.60, no $165.60000000000002). Probado: 17 frases en local y 5 casos en un flujo temporal con los nodos reales (borrado). **Visto, sin tocar:** el cotizador multiplica sin descuento (3 cunas = $2.100) aunque Marco promete descuento desde 2 unidades. Falta verlo en una conversación real.

651. **Marco: con 2 unidades o más, el descuento lo decide un vendedor** (2026-11-17), decisión de la usuaria (sigue del 650). Marco promete descuento desde 2 unidades pero el cotizador no lo aplica. Ahora, en WhatsApp y Telegram, con 2+ unidades el estimado muestra "Precio de lista" y "un vendedor revisa tu caso y te confirma el precio final"; el lead pasa a Caliente y el correo al vendedor llega con el asunto "💲 Descuento por volumen (N unidades)" y un aviso arriba. Con 1 unidad, igual que antes. Probado en un flujo temporal con los nodos reales (borrado): correo de prueba enviado a risosadmi ("PRUEBA SOL descuento"). Falta un caso real.

652. **Mónica v15, paso 1: medidas convertidas por código** (2026-11-17), tarea 1d del ingeniero. La IA ya no multiplica: copia número y unidad, y `normalizarItem` convierte a pulgadas y libras, valida el tipo de caja y marca medidas sospechosas. Antes, al responder en un hilo, "120 cm" se cotizaba como 120 pulgadas y el tipo de caja quedaba libre. Se arma con `C:\SOLANGE RESPALDOS\agente-correo-monica-SOL\construir_v15.py` (el original del ingeniero no se toca; fuera de git). Probado con 8 casos simulados (`js/probar_nodos_v15.js`); falta correrlo con OpenAI. Mónica fijaba el factor en 28 y cotizaba 22 % más caro que la web y Marco ($252 contra $207 en 48×40×36): la v15 usa el factor del panel (decisión de la usuaria: **nosotros nunca cambiamos precios**).

653. **Mónica v15, paso 2: borrador y aviso al vendedor por Telegram** (2026-11-17), tarea 1c del ingeniero. Los 5 envíos directos (`reply`) pasan a borradores en el mismo hilo de Gmail, sin enviar nada, y cada borrador avisa al vendedor por Telegram (cotización con total, pedido de datos, respuesta o "el cliente APROBÓ", con enlace a Borradores). El chat del vendedor queda para pegar en `📲 Telegram al vendedor` (pasos en `v15-SOL/GUIA_v15.md`). Probado: 13 casos simulados, y en el n8n real un borrador de prueba en risosadmi quedó en el mismo hilo y se borró. Falta: el chat del vendedor y correrla con OpenAI.

654. **Mónica v15, paso 3: aviso de los correos que no son cotización** (2026-11-17), tarea 1e del ingeniero. Los irrelevantes (C), los que Mónica no pudo clasificar (E) y los mensajes sin relación dentro de un hilo se marcaban leídos sin avisar a nadie, incluso los "escalados a un humano". Ahora avisan al mismo Telegram del vendedor con remitente, destinatario, asunto, motivo, un extracto y el enlace al hilo. Probado con 17 casos simulados (`js/probar_nodos_v15.js`). Queda de la tarea 1: unir pagos con su cotización (b) y analizar los correos reales de CE (a, necesita acceso a esa casilla).

655. **Mónica v15, paso 4: pagos unidos a su cotización** (2026-11-17), tarea 1b del ingeniero. Categoría nueva P (Zelle, transferencia, comprobante): Mónica busca en Gmail los hilos del cliente, pregunta a la app por cada uno, elige la cotización más reciente con monto, le agrega el pago (sin tocar estado ni precio) y avisa al vendedor si coincide el monto. Un pago dentro del mismo hilo se destaca en el aviso. Sin cambios en la app: su API no pide contraseña y buscar por correo expondría cotizaciones. Probado con 24 casos simulados. Queda de la tarea 1: (a) analizar los correos reales de CE (sin acceso), y correr la v15 con OpenAI.

656. **Mónica v15 importada en n8n, apagada** (2026-11-17). Procesador `BPmfavlb7SaUPDpM` y receptor `cfKNcaWiS2qMRmVB` ("CRATING EXPRESS — Gmail v15 … (SOL)"), el receptor ya apunta al procesador; comprobado que los 57 nodos quedaron iguales a la copia local. Para encenderla faltan las credenciales (Gmail de pruebas, OpenAI, Pinecone, Telegram) y el chat del vendedor: pasos en `C:\SOLANGE RESPALDOS\agente-correo-monica-SOL\v15-SOL\GUIA_v15.md`. `exportar-agentes.py` ya no copia al repo público los flujos "CRATING EXPRESS — Gmail…" (son del ingeniero); por eso n8n tiene 40 flujos y el repo 38.

657. **Mónica v15 probada de punta a punta en risosadmi** (2026-11-17), a pedido de la usuaria (nunca en el correo de CE). Sin credencial de OpenAI en n8n, la prueba usó una copia temporal con Groq (`openai/gpt-oss-120b`, cupo aparte del de Marco), sin Pinecone ni Telegram (el aviso quedó como texto). Los 4 casos salieron bien: cotización "120 x 80 x 100 cm, 50 kg" → 47.24×31.5×39.37 in, $189 y borrador; respuesta en el hilo en metros → $193.20 en el mismo hilo; pago por Zelle unido a su cotización (avisó que el monto no coincidía); publicidad → aviso. Corregido al probar: la nota del hilo decía literalmente "(medidas_originales)"; v15 importada actualizada. Flujos y borradores de prueba borrados; quedan 5 correos "PRUEBA SOL 1421" en risosadmi y el hilo de prueba en la memoria de la app de producción (su API no tiene borrado). Falta: OpenAI, PDF e imágenes, y la consulta general (Pinecone).

658. **Marco probado de punta a punta: la cuna sale $700** (2026-11-17), confirma los ítems 649 y 650. Conversación de 10 turnos por WhatsApp con un contacto inventado en una copia temporal del motor, con correos, envío a WhatsApp y seguimientos apagados (decisión de la usuaria: ningún correo a cratingexpress01@gmail.com, que es adonde Marco avisa a los vendedores de CE), usando los subflujos reales 01/02/03/05. Estimado final: cuna 48×40×36 in, cantidad 1, $700 (antes salía $207). Contacto 384 y su trato borrados en G54; copia borrada. Visto, sin tocar: Marco pide el correo con "¿Quieres que te enviemos la cotización formal a tu correo?" antes de dar el precio. Falta: el descuento con 2+ unidades en una conversación real (se probó con los nodos reales y el aviso a risosadmi, ítem 651).

659. **Marco ya no pregunta por la "cotización formal" antes de dar el precio** (2026-11-17), visto en la prueba del 658. Lo causaba el control del 16-oct en `🔍 Parsear Respuesta IA` (03): atrapaba cualquier frase con "te enviamos… correo", incluso preguntas como "¿A qué correo te enviamos el estimado?", y la cambiaba por "¿Quieres que te enviemos la cotización formal a tu correo?". Ahora deja pasar las preguntas que piden el correo; si de verdad afirma un envío, antes del precio pide el correo de forma directa y después del precio queda como antes. Además, el paso PEDIR_CORREO del 01 pide el correo directo. Probado: 9 frases en local y la conversación de 10 turnos en una copia sin envíos (contacto 386 borrado).

660. **Corte de día 18-nov — diagnóstico limpio** (2026-11-18): 40 flujos (36 activos; apagados Gmail Monitor, TikTok y Mónica v15 ×2). 0 errores desde el 17-nov 12:00 UTC; Guardián del Vigía corrió 24 veces sin avisar nada y LinkedIn renovar 5 veces sin errores. **Confirmado el ítem 637:** el 215 (Facebook, 17-nov 19:00 Miami) y el 217 (LinkedIn, hoy 08:00) se publicaron y G54 guardó su `link_url`. En cola de CE: 216 Facebook (jue 19-nov) y 218 Instagram (vie 20-nov). Marco: solo seguimientos de cada hora, ningún WhatsApp real (lo de "marcar como leído", ítem 635, sigue sin verse en vivo). Panel (`index-D7b4wdqV.js`) y docs de G54 sin cambios; Orison sin nada. Ítems 609-627 (16-nov) y el reporte del 14-nov archivados en el historial.

## Error conocido

`API Error: 400 messages: text content blocks must be non-empty` — ocurre en la interfaz web de Claude Code (no en n8n) cuando el historial de conversación tiene bloques de texto vacíos tras llamadas a herramientas. Es un bug de la plataforma. Si ocurre: iniciar nueva sesión; este archivo CLAUDE.md proporciona todo el contexto necesario automáticamente.

## Historial de cambios relevantes

Ítems 1 a 142 (hasta el 2026-07-16) y la sección vieja de Nomify (fuera de nuestro alcance) archivados en `PROYECTO-SOL/historial/changelog-2-items-1-142-y-323-440-hasta-2026-10-16.md` el 2026-10-23.

---

## Reportes Diarios

> Solo los últimos 3 reportes (regla cambiada el 2026-10-30, antes 7 días, para gastar menos uso: CLAUDE.md se carga entero en cada sesión). Al agregar uno, mover el más viejo a `PROYECTO-SOL/historial/reportes/AAAA-MM-DD.md`.

---

### 2026-11-17 (Martes)

Arranqué con la rutina de G54, todo limpio, y seguí cerrando los pendientes de la revisión de ayer: Community ya no publica enlaces ni teléfonos ajenos, todas las llamadas de los flujos tienen tope de tiempo, el Vigía tiene candado y ahora hay otro flujo que lo vigila a él, las sesiones maestras se cierran solas, Marco vuelve a marcar como leídos los WhatsApp, la pausa del bot vence a las 24 horas y los posts publicados guardan su enlace. Después pasé al cotizador de Crating Express en una copia aparte, la versión S: arreglé el logo que se perdía en cada despliegue, armé la zona de ayuda, los clientes preferidos con su proveedor y el CSV, hice más fácil de leer el Dashboard y construí un CRM propio por etapas (embudo, tareas, ficha del cliente, reportes y etapas configurables), todo subido en su propia rama sin tocar la del ingeniero.

En la tarde busqué los flujos del chat del cotizador para lo de los enlaces y los archivos, y comprobé que están en el n8n del ingeniero, así que dejé en el Tutor botones de ayuda con enlaces directos y queda pedirle el flujo. Con los archivos de Mónica que me pasó el ingeniero revisé el agente de correo, y de paso encontré que Marco cotizaba todo como cajón cerrado (una cuna salía 207 en vez de 700) y siempre por una unidad; lo corregí, y decidí que desde 2 unidades el descuento lo decida un vendedor. En Mónica hice las cuatro tareas que se podían: medidas convertidas por código, borradores con aviso al vendedor por Telegram en vez de responder sola, aviso de los correos que no son cotización y pagos unidos a su cotización. También vi que cotizaba 22 % más caro por un factor fijo, y quedó con el del panel, porque los precios no los cambiamos nosotros.

Al final dejé a Mónica importada y apagada, la probé de punta a punta en el correo de risos con Groq porque no hay clave de OpenAI, y probé a Marco con una conversación completa en una copia sin envíos, para que no llegara ningún correo a Crating Express. Ahí apareció que preguntaba por la cotización formal antes de dar el precio, y quedó corregido. Para mañana queda pedirle al ingeniero el flujo del chat, los accesos de Hermes y la casilla de CE, y poner las credenciales de Mónica. Todo quedó subido y el uso semanal está en 43 %.

---

### 2026-11-16 (Lunes)

Arranqué con la rutina de G54 y todo estaba limpio, salvo que la tarea que programa los posts del lunes no corrió sola, así que aprobé las ideas de la semana y dejé programados los cuatro posts revisando sus textos e imágenes. Pegué las tareas que me dejó el ingeniero el viernes (el agente de Gmail de Crating Express, Hermes y los cambios al cotizador), que quedan esperando accesos; intenté entrar a n8n para ver el agente de Gmail, pero no me dejó.

Mientras tanto hice una revisión completa de G54 con cuatro revisores en paralelo. Salió 61 %, más bajo que el sábado, porque esta vez se revisó también lo que habíamos dado por arreglado. Fui punto por punto y cerré 14 de los 15: respaldos de IA que se caían, puertas sin candado, mensajes que Marco perdía con el bot en pausa, posts que podían duplicarse en Facebook, tratos que bajaban de temperatura, notas del vendedor que se borraban, avisos cuando una respuesta no le llega al cliente, el prompt completo de Content AI, comentarios de Instagram que se descartaban y 56 nodos sin uso. Quedamos en un 70 % estimado, y de paso tapé una clave que estaba a la vista en el repo.

En la tarde me encargaron la cuenta de TikTok de Orison, y con eso averigüé qué haría falta para que G54 publique en TikTok como en Facebook: dejé armado y probado el flujo que manda los posts a la bandeja de TikTok, pasé al Éxodo lo que le toca al ingeniero y armé el plan en un documento. Después tuve reunión con el ingeniero y con Don Marc para aprender sobre Hermes; el ingeniero me mostró cómo ejecutarlo en la máquina para empezar a trabajarlo y me respondió dudas de configuración y capacidad. Al final levanté Bubble en local. Ahí cerré, con todo subido y el uso semanal en 19 %.
