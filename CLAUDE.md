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

## Pruebas pendientes (lista viva, actualizada el 2026-11-21)

Cambios ya hechos y probados por partes (código de producción con entradas simuladas o flujos temporales), que todavía no se confirmaron con un caso real de punta a punta. Al confirmar uno, sacarlo de acá y anotarlo en el ítem del changelog que corresponda.

1. ~~Foto real a Marco por WhatsApp~~ — confirmada el 16-oct con la conversación real de Lu (ítem 440).
2. **Nota de voz y PDF a Marco por Telegram** (ítems 397, 399 y 405): la foto ya quedó confirmada por la usuaria el 02-oct. La nota de voz falló ese día (credencial de Groq Whisper mal ubicada) y se arregló el 05-oct: volver a mandar un audio y confirmar que Marco responda según lo que se dijo. El PDF todavía no se probó.
3. **"Ejecutar seguimiento IA" enviado de verdad** (ítems 397 y 406): solo se probó con números inventados y con la ruta de Telegram en local. Telegram confirmado el 05-oct (la usuaria apretó el botón en su trato 210 y le llegó el mensaje; ejecución 19:27 UTC sin errores). Falta: por WhatsApp, escribirle a Marco desde un número real y, antes de 24h, apretar el botón. Probar también dos clics seguidos (el segundo no manda). Ojo: G54 responde `ok:true` aunque no se envíe.
4. ~~Informe mensual del 28-oct~~ — confirmado el 28-oct: compara contra `linea_base` (ítem 467).
5. ~~Logo en los correos de Camila~~: cargado el 26-oct (ítem 461); correo real enviado el 11-nov a anget3747@gmail.com (ítem 558), falta que la usuaria confirme cómo se ve.
8. **Primer Reel real** (ítems 456, 458 y 559): probado el 11-nov con un video de prueba en el pedido 2 (post 214, borrador). Reels AI escribe bien el texto, pero G54 no le avisa: falta registrar la clave `rrss_reel` en `/api/agent-endpoints` (apuntando a `reel-subido-g54`). G54 sí manda `pedido_id`. La clave no está en el catálogo de G54 (422 al registrarla): pedido al ingeniero en el Éxodo (11-nov). Revisado el 24-nov: sigue sin estar en el catálogo (24 claves). Después, repetir con un video real en el pedido 1.
6. **Botón "Ejecutar" de Prospección (paso 7):** el flujo `jg5SENgRpe2wLBTn` quedó rehecho y activo el 28-oct (ítem 474), con Foursquare y Tavily en vez de Google. Corrida real confirmada el 28-oct (tratos 226 y 227 de Crating Express). El 6-nov (ítem 528) Hunter se consultó en una corrida real y respondió bien, pero no tenía correo para ese dominio. Falta ver un correo encontrado por Hunter: va a salir solo en las corridas reales (Hunter cobra solo cuando encuentra).
7. ~~**Llamada real a Marco por teléfono (VAPI)**~~ — confirmada el 04-nov: una llamada transferida desde Bubble llegó al +1 786 y Marco contestó con `groq / llama-3.3-70b-versatile` ("Gracias por llamar a Creating Express. Soy Marco…", 43 s, US$0,085). Detalles vistos: la voz dice "Creating/Krating Express" y se despidió en inglés aunque le hablaron en español. **Despedida corregida el 11-nov (ítem 564): falta una llamada real en español para ver que se despida en español y corte.**

9. **Respuesta manual de WhatsApp desde el panel de G54** (ítem 590): probada de punta a punta con un contacto inventado (G54 la marcó enviado). Falta una real: que alguien escriba al WhatsApp de Crating Express y, antes de 24 h, responderle desde el panel; ver que le llegue y que Marco no conteste encima.

10. **Foto real a Marco por WhatsApp, otra vez** (ítem 597): la imagen ahora viaja embebida al modelo de visión. Mandar una foto al WhatsApp de Crating Express y ver que Marco la describa.

11. **Marco: descuento con 2+ unidades en una conversación real** (ítems 649 a 651, 658 y 659): tipo de caja, cantidad y pregunta del correo ya probados de punta a punta en una copia sin envíos. El aviso de descuento va a cratingexpress01@gmail.com y la usuaria no quiere correos de prueba ahí: confirmarlo con el primer cliente real que pida 2 unidades o más.

12. **Mónica: un video adjunto** (ítem 686): el lector transcribe su audio con OpenAI (Groq de respaldo, ítem 710), pero no se pudo probar (sin ffmpeg para armar un video). Confirmarlo con el primer video real, cuando el ingeniero la encienda.


## Próxima sesión — por dónde seguir (actualizado el 2026-11-24)

**Cómo trabajar (pedido de la usuaria, 23-oct):** de a poco, un paso por vez, de lo más chico a lo más grande, enumerando qué se hace y reportando el % de uso (`mcp__ccd_session_mgmt__get_usage`) al terminar cada paso. Si el uso semanal pasa el 90 %, parar y avisar.

**Rutina diaria (al saludo de la usuaria; escrita el 23-nov):** (1) `git pull` y uso (`get_usage`). (2) `python PROYECTO-SOL/scripts/diag-rutina.py <desde>` (flujos, errores, cola de posts, panel, docs y firma de Meta); si algo corrió raro, ver el modo de sus ejecuciones. (3) **Comentarios de Don Marc en Notion** (pedido del 23-nov): página RESUMEN DIARIO (`30df43e6-295a-8099-b893-fff221c1dfa1`), leer con `notion-fetch` solo la entrada del día anterior: sus comentarios son las negritas dentro del texto, más las propiedades «Comnts Mc» y «VB Mc». Pasar a pendientes lo que pida o pregunte. (4) Anotar el corte de día en el changelog, archivar lo de más de 2 días, actualizar «Próxima sesión» y subir.

**Para gastar menos uso (revisado el 30-oct):** este archivo se carga entero en cada sesión y en cada mensaje, así que su tamaño es lo que más pesa. (1) Aquí quedan solo los ítems del changelog de los últimos 2 días; los demás van a `PROYECTO-SOL/historial/changelog-N-....md`. (2) Cada ítem nuevo, en 5 líneas o menos: qué se hizo, por qué y qué falta; el detalle técnico va en el mensaje del commit. (3) Solo los últimos 3 reportes diarios. (4) La referencia que casi no se usa va en su propio archivo con un puntero (por ejemplo, `PROYECTO-SOL/nomify/planilla-nicaragua.md`). (5) En Bubble, su CLAUDE.md guarda solo los últimos 10 ítems; el resto, en `docs/changelog-historico.md`. (6) Una sesión larga encarece cada mensaje: un tema grande y distinto (por ejemplo, el diseño de una mascota) va en su propia sesión. (7) Capturas de pantalla chicas (zoom o escala 0,5), sin repetirlas, y los ajustes de diseño pedidos juntos en un solo mensaje cuando se pueda.

**Para la próxima sesión (actualizado el 25-nov):**

*Para hacer ya:*
1. ~~Razón social en documentos~~: decidido por la usuaria el 25-nov, se deja como está («Kabendish Corp.» en G54 y el pie de Camila, «Kabendish» en el cotizador). El inventario de tareas que se repiten y lo de RISOS siguen por WhatsApp.
1b. **7 borradores de Camila (Miami Art Week, ids 32-38, ítem 718):** los revisa la usuaria en G54 › Correo › Pendientes antes de aprobar. **Trato 288** (pedido real por la web del 24-nov, ítem 714): que el vendedor confirme tipo de caja y fecha.
2. **Paquete de Mónica v15:** está en git, en `docs/monica-v15/` de `DESARROLLO_SOL` (decidido el 23-nov: el ingeniero lo toma de ahí; copia en `C:\SOLANGE RESPALDOS\agente-correo-monica-SOL\v15-SOL\para-el-ingeniero\`).
3. **Mandar a Silvia el mensaje de Orison y Meta** (`PROYECTO-SOL/g54/mensajes/2026-11-21-silvia-y-ingeniero.md`): lo manda la usuaria. Don Marc pidió coordinar con ella cuándo activar Orison.
4. ~~Lunes 23-nov: rotación de horarios~~: hecha (ítem 695). Queda la última semana, lunes 30-nov (12/17/19/08).

*Esperando un dato de la usuaria:*
5. **Hermes (empezado el 25-nov):** primero un perfil de prueba nuestro (asistente de RISOS, salvo que la usuaria diga otra cosa) con una interfaz sencilla de chat en la terminal; después el perfil `mda` (Agente Principal «MDA» de la página «La Estructura del proyecto de A en Claude», `41bf43e6-295a-8047-80ec-ffb07643c272`; Don Marc la marcó «no es prioridad»). Claude no escribe la contraseña del servidor: la usuaria decide si corre `PROYECTO-SOL/hermes/1-instalar-llave.ps1` (llave SSH, contraseña una sola vez; avisar a Walter) o si se trabaja pasándole comandos. Nada tocado en el servidor todavía.
6. **Avatar de Bubble:** Don Marc eligió la gorra (20-nov). Generar los personajes de nuevo (no editar imágenes) viendo la tendencia de agentes que mandó Don Marc: página «Tendencia de Avatares;» en Notion (`41ff43e6-295a-8053-8e24-cb6433565df3`, dentro de Bubble54 › BUBBLE para G54 › Bubble): el muñeco de peluche de MUSE, el agente de Meta, y cómo lo visten las marcas (Spotify, oficina, granjero). Detalle en el ítem 619 del CLAUDE.md de Bubble.
7. **App Secret de Meta (ítem 664):** la usuaria lo copia de developers.facebook.com → app → Configuración → Básica, lo guarda como `META_APP_SECRET_CE=` y se corre `python PROYECTO-SOL/scripts/cargar-meta-app-secret.py`.
8. **Cotizador versión S: revisada por la usuaria y pasada completa a `DESARROLLO_SOL` el 23-nov** (merge `6d8083c`, ítem 707). Revisado el 24-nov por la tarde: todavía no está en producción (`/ayuda`, `/crm` y `/branding/logo` dan 404). Falta que el ingeniero la pase a producción: respaldar la base y correr `php artisan migrate --force` (7 migraciones nuevas: app_assets, preferido/proveedor, crm_*, crm_historial, Kabendish y contacto principal). El aviso lo manda la usuaria (mensaje en el ítem 707). Después, revisar en producción los «Contacto principal» creados con el nombre de la empresa, y Don Marc confirma el precio en vivo. **Cuando esté en producción, volver a probar todo con la usuaria** (misma lista para tachar).

*Sin prisa:*
9. Responderle a Don Marc lo de la organización («no es prioridad», comentario del 20-nov).

*Éxodo vigente (enlace fijo, volver a publicar en este mismo enlace con cada cambio):* https://claude.ai/artifact/PCmGqdkWUMXEFXqvNCUjTr

*Lista para tachar de las tareas del ingeniero:* https://claude.ai/artifact/7SCtd5Eqqubm8CX5PA2unS

*Lista para tachar de las pruebas del cotizador versión S (23-nov):* https://claude.ai/artifact/5aPSrmtT4NeV7iuHXFZjLg (sus marcas y notas se leen con `ArtifactData` `list`, colección `pruebas`)

**Orden de trabajo (lo nuestro):**
1. ~~**Bubble — seguimiento a contactos calificados**~~: hecho el 26-oct (ítems 503 y 505 de Bubble; ítem 462 de acá). Falta probarlo con una llamada real.
2. ~~**Bubble — último detalle de la auditoría**~~: el #62 se cerró el 27-oct: el dato sí estaba en el perfil del negocio demo (la auditoría se equivocó), y quedó igual una regla contra inventar plazos y condiciones. Después, probar en una llamada real los puntos 5 a 7 de "Pruebas pendientes" del CLAUDE.md de Bubble.
3. **Bubble — pendientes de seguridad del 15-oct** (sección "Pendientes" del CLAUDE.md de Bubble, punto 7). El tope de descargas CSV quedó hecho el 27-oct; el horario de las salientes ya usa la zona del cliente (ítem 462). El cifrado del resumen, la escalación y las notas quedó hecho el 27-oct (ítem 515 de Bubble; en el servidor de Walter hay que correr `python -m scripts.encrypt_existing` una vez). La conversación limpia en el panel quedó hecha el 27-oct (ítem 516 de Bubble). Bubbli fase 3 (sugerencias con datos reales) quedó hecha el 27-oct (ítem 517 de Bubble), y Bubbli en el celular, el 29-oct (ítem 537 de Bubble). Queda solo la confirmación por SMS (en espera porque cuesta plata). Comprar números: solo la agencia (decidido el 27-oct; ya estaba aplicado desde el 21-oct).
4. **G54:** ~~revisar el informe mensual del 28-oct~~ (hecho, ítem 467). **Rotación de horarios (pedido de la usuaria, 26-oct), cada lunes hasta la semana del 30-nov:** aprobar las ideas nuevas, generar los posts y programarlos en hora de Miami (`fecha_programada` sin "Z"): martes Facebook, miércoles LinkedIn, jueves Facebook, viernes Instagram. Horas por semana: 2-nov 12/17/19/08 · 9-nov 17/19/08/12 · 16-nov 19/08/12/17 · 23-nov 08/12/17/19 · 30-nov 12/17/19/08 (mar/mié/jue/vie). Con 6 semanas, cada horario junta 6 posts. El cálculo de `sugerencia-horario` con el piso mínimo ya quedó hecho el 29-oct (ítem 487) y se activa solo cuando haya datos.

**Tareas del ingeniero (reunión del 14-nov), estado al 21-nov:**
1. ~~**Agente de Gmail de CE (Mónica)**~~: terminada y probada en real el 21-nov (ítems 682 a 691: correos reales analizados, adjuntos, pagos, dos opciones, correo suelto unido a su cotización, saludo). Falta que el ingeniero importe la v15 y apague la v14.
2. **HERMES:** analizado el 18-nov (ítem 666). La tarea es darle personalidad al perfil `mda`. Acceso: por `ssh` con contraseña (la tiene la usuaria).
3. **Cotizador de Crating Express:** hecho en la versión S (ítems 640 a 648, rama `version-S`): Dashwork, ayuda, CRM propio (independiente del de G54, decisión de la usuaria), CSV, preferidos, proveedor, logo y botones de ayuda en el Tutor. Pasada a `DESARROLLO_SOL` el 21-nov (ítem 694); inspección final el 23-nov (ítem 697) y lista de pruebas para la usuaria en `PROYECTO-SOL/crating-express/cotizador-version-S-pruebas.md`. (Lo de leer audios, PDF e imágenes era para Mónica, no para el chat: hecho el 21-nov, ítems 686 a 691.)

**Pedido del ingeniero (27-oct):** ~~animación de Jelly basada en Bubbli~~: hecha y entregada el 28-oct (ítem 469); las correcciones que hagan falta las hace el ingeniero.

**De la usuaria (no se pueden hacer desde acá):** probar "Probar mi agente" con el agente de voz encendido (lo hace ella); permisos de estadísticas de LinkedIn.

**Del ingeniero:** los 18 pedidos del Éxodo (entre ellos `rrss_reel` y el `{{nombre}}` de los correos), más el error de «Conectar con Meta» que borró la página de CE (ítem 680) y borrar las conversaciones «PRUEBA SOL» de la memoria de su app (5-nov: 4 resueltos el 4-nov y probados en vivo) (el 5-nov, tras la reunión con el ingeniero, el cotizador y lo legal pasaron a `g54/exodo/tarea-adicional-*.html`; revisado el 27-oct contra el panel `index-wpoZAdm_.js`: se sacaron 7 resueltos; el 28-oct se sumaron 6 de Correo y 2 de Backend, ítems 479 y 480) de `PROYECTO-SOL/g54/exodo/exodo-g54-VIGENTE.html`.

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

709. **Corte de día 24-nov — diagnóstico limpio y comentarios de Don Marc** (2026-11-24): 41 flujos (37 activos), 0 errores desde el 23-nov 12:00 UTC. El 220 de Facebook salió hoy 08:00 de Miami (Distribution 80842); en cola 221 LinkedIn (mié 12:00), 223 Facebook (jue 17:00), 222 Instagram (vie 19:00). Mónica corrió solo con la prueba de la firma (ítem 708); receptor y procesador apagados. Panel, docs y firma de Meta sin cambios. `diag-rutina.py` no corría desde el ítem 697 (salto de línea real en el último `print`): corregido. Don Marc: en documentos va «Kabendish Corp D/B/A Cratingexpress.com» (solo «Kabendish Corp» si se pide únicamente la razón social); quiere ver marca, nombre comercial y razón social con la usuaria hoy después de las 10; lo de RISOS, por WhatsApp; el «inventario» es la lista de tareas que se repiten. Ítems 680-694 archivados.
710. **Mónica transcribe con OpenAI y Groq de respaldo** (2026-11-24), pedido de la usuaria. En el lector de adjuntos (`0gQVpgcZvXkC802q`), `🎙️ OpenAI Whisper` (`whisper-1`, la credencial de OpenAI de Mónica) reemplaza a Groq; si da error, `🔧 Audio para respaldo` → `🎙️ Groq Whisper (respaldo)`. Era el único nodo con Groq (procesador y receptor ya usaban solo OpenAI y siguen apagados). Probado en una copia temporal (borrada) con una nota de voz: 1 llamada paga a OpenAI y 1 con OpenAI forzado a fallar (modelo inexistente, sin cobro) que transcribió Groq. Parche `parche_openai_whisper.py`; paquete y `LEEME.md` en `docs/monica-v15/` de `DESARROLLO_SOL` (`95ddf3c`) y `version-S`.
711. **Prospección apuntada a forwarders y arte; Gemini ya no estaba en uso** (2026-11-24), a pedido de la usuaria tras el análisis general (el alcance de RRSS de CE es ~2 personas/semana; la demanda real llega por correo B2B). Sin tocar el perfil de G54 (cambiarlo por API rearma competidores, ítem 700): `prospeccion-g54` con `busqueda`/`zona`. Pruebas sin guardar: forwarders y arte encajan; «export company» trajo mudanzas y abogados (descartado). Real: **16 prospectos nuevos en el CRM de CE** (6 forwarders de Doral, 10 de arte en Miami), 13 con correo; Hunter, 5 consultas (3 encontrados). Camila en modo prueba arma 13 correos, pero genéricos (repiten la lista de servicios, «industrial packaging» para museos, un error de gramática): **no se crearon borradores**, queda decidir si se mejora la redacción antes. Gemini: ya no lo usa ningún flujo activo (Ideas AI y Strategist van a Groq desde el 16-nov, ítem 624); el análisis estaba desactualizado en eso.
712. **Camila escribe mejor los correos en frío, y 13 borradores para los prospectos nuevos** (2026-11-24), pedido de la usuaria. Reglas genéricas en `🔍 Seleccionar Contactos` (`fahn0L68z5czTocE`): porqué concreto según el tipo de negocio, una sola ventaja, los párrafos no repiten la lista de servicios, solo servicios que encajan, nada de afirmar cosas de ese negocio ni decirle lo que «necesita», pregunta concreta al cierre, revisión de gramática; `reasoning_effort` medium y 14.000 tokens (antes 2 de 13 caían a la plantilla). Parámetro nuevo opcional `contexto` (un evento o temporada; la IA lo usa solo donde aplica). En `🔍 Filtrar y Armar Emails`, las garantías («guarantee», «garantizamos») se cambian por frases sin promesa; ojo: el primer intento guardó `` como caracteres invisibles y no filtraba (corregido). 5 pruebas sin crear nada; después **13 borradores creados** con `contexto` de Miami Art Week. **Pendiente de la usuaria:** revisarlos en G54 › Correo › Pendientes; al aprobarlos salen desde risosadmi a negocios reales (memoria «correo propio por negocio»). Scripts `scripts/parche_camila*.py`.
713. **Vigía Web: agente independiente que vigila cualquier sitio** (2026-11-24), tarea nueva del ingeniero. Primero se hizo en n8n (`l4aOH09BdAEZ4UyP`) y el mismo día la usuaria aclaró que el ingeniero lo quiere **sin n8n**: rehecho como programa Python en `PROYECTO-SOL/vigia-web/` (solo `httpx`; Docker + compose; CLI, API HTTP con `VIGIA_TOKEN` y reloj interno: rápida cada hora, completa a las 6:05 de Miami; SQLite). Revisa caída, tiempo, certificado (leído directo), redirección a otro dominio, código inyectado (iframes ocultos, JS ofuscado, spam por palabra completa, scripts nuevos), 25 páginas y 250 enlaces, Sucuri SiteCheck, RDAP y Safe Browsing opcional. Avisos por SMTP, Telegram o webhook firmado (HMAC), solo lo nuevo o lo que sigue tras 24 h, y «resuelto». 12 pruebas sin internet en verde; probado en vivo (CLI y API) con CE, certificado vencido y webhook firmado. Docker no estaba corriendo en esta PC: la imagen no se armó aquí. **Encontrado en cratingexpress.com:** en la página de ISPM-15, un enlace a «Cratingexpress01@gmail.com» sin `mailto:` (da 404). El flujo de n8n quedó apagado, sin borrar (decisión de la usuaria). **Falta:** que el ingeniero lo despliegue.
714. **Corte de día 25-nov — diagnóstico limpio y un pedido real por la web** (2026-11-25): 42 flujos (37 activos; el nuevo es Vigía Web en n8n, apagado: sus 8 corridas son las pruebas del 24-nov 20:25 UTC), 0 errores desde el 24-nov 12:00 UTC. En cola de CE: 221 LinkedIn (hoy 12:00 Miami), 223 Facebook (jue 17:00), 222 Instagram (vie 19:00). Panel, docs y firma de Meta sin cambios. **Formulario de cratingexpress.com (24-nov 21:11 UTC):** cotización de una caja para un TV de 65" (39×64×17 in, 48 lb, zip 33496), guardada como trato 288 en el CRM de G54; ojo, el cliente eligió «Palets de madera a medida / Residencial» y la fecha 24-feb-2026 (ya pasada): el vendedor debería confirmarlas. Don Marc (Notion, 24-nov): todo aprobado, sin pedidos nuevos; celebró el Vigía Web. Ítems 695-708 archivados.
715. **Saludo de Thanksgiving a los clientes de CE** (2026-11-25), pedido de Don Marc. Enviado por la usuaria desde el Gmail de CE en un solo correo con CCO (imagen + texto bilingüe). Lista: la planilla «CLIENTES IMPORTANTE CE.xlsx» (88 clientes, 70 con correo; sin cuentas por pagar si había persona, sin correos mal escritos ni repetidos) más contactos de las conversaciones de los últimos 6 meses (reenvío a risosadmi; 61 quedaron como enlaces de Drive y no se pudieron leer, se sumaron a mano por nombre). El CRM de G54 no sirvió (solo prospectos). **Pendiente:** la planilla de clientes está desactualizada (precios de 2022, faltan clientes nuevos como EMAC); vale la pena actualizarla con los rebotes de este envío. Las listas con correos quedaron solo en Descargas, fuera del repo.
716. **Pasada barata de la revisión de G54 y qué post trae clientes** (2026-11-25), pedido de la usuaria. De los pendientes de la revisión del 16-nov, 13 ya estaban resueltos (ítems 629-665); siguen: medir qué post trae clientes, una sola cuenta de Gmail para los avisos, nadie vigila si n8n entero cae (el Vigía Web instalado fuera podría hacerlo), `top-ventas` sin usar, contraseña maestra en 9 Config, firma de Meta (App Secret), clave de Groq compartida con Bubble y nodos de código enormes; solo `💾 Guardar Métricas en G54` (informe mensual) sigue sin tope de tiempo. **Qué post trae clientes:** la marca «P» solo estuvo del 8 al 20-oct (la retiramos por decisión de la usuaria, ítem 446), así que no mide los posts de después; lo que sí dicen los informes de G54: alcance semanal de 3 a 8 personas, 0 clics y 0 leads desde octubre. (Corregido el mismo día: al principio se dijo que 64 posts con código dieron 0 tratos.) Decidido por la usuaria: no se cambia nada hasta que G54 tenga esa parte armada. Visto de paso (para el Éxodo): el informe del 16 al 23-nov de G54 dice 63 posts publicados en la semana (fueron 4).
717. **Avisos de error también por Telegram** (2026-11-25), pendiente de la revisión del 16-nov. El Error Reporter (`CKOju9JVnSMymfKv`) mandaba todo por un solo correo (SMTP de risosadmi): si se vencía esa clave, todos los avisos se callaban. Nodo nuevo `📲 Aviso por Telegram` en paralelo al correo, con el bot de Mónica («Avisos Crating Express») al chat de la usuaria (confirmado por ella), y los dos con `continueRegularOutput` para que la falla de uno no frene al otro. Probado con un flujo temporal que falla a propósito (borrado): llegaron el correo y el Telegram (flujo, nodo, error, hora de Miami y enlace a la corrida). También se le puso tope de 2 min a `💾 Guardar Métricas en G54` del informe mensual, el único nodo HTTP que no lo tenía. **Ojo:** el bot es de CE; si más adelante hay un bot propio de G54, cambiar la credencial del nodo.
718. **Camila: ya no escribe a correos que no son del negocio, usa el contexto y no repite el texto** (2026-11-25). Revisados los 13 borradores de Miami Art Week (ítem 712) antes de aprobarlos: 5 iban a correos de otra empresa (laserfreight para Freight Pioneer, una galería por otra, un Gmail para CIFO, la empresa de la web de William Braemer, un dominio con falta), ninguno nombraba Art Week (la regla 2e, «no afirmes que participa en un evento», chocaba con la del contexto) y los 13 repetían la misma frase con tres ventajas. En `fahn0L68z5czTocE` (scripts `parche_camila_dominio_contexto*.py`): (1) primer contacto descarta el correo cuyo dominio no es el de la web ni lleva el nombre o las iniciales del negocio, o que es gratuito o de proveedor sin su nombre; los descartados salen en el resumen; (2) una ventaja por negocio asignada por código, rotando, sin exportación para quien no es de carga; (3) el contexto se nombra en general y, si la IA no lo puso, el código lo antepone; (4) la lista sale sin plazos ni precios y sin embalaje industrial ni ISPM-15 para quien no es de carga; (5) el título es «Hello, <negocio>»; (6) se suavizan «ensures» y «eliminates the risk». Los 14 borradores viejos (17-31, incluido el de prueba 18) cancelados y la marca `outreach_borrador` quitada de sus 13 tratos; probado 3 veces en modo prueba y creados **7 borradores nuevos (32-38)**, pendientes de que la usuaria los revise. Descartados 6: Laser International, Freight Pioneer, CIFO, Markowicz, alma fine art y William Braemer (quedan en el CRM sin correo válido).
719. **Fecha de publicación pisada en 59 posts de CE: informes protegidos y pedido al Éxodo** (2026-11-25). El 17-nov, al completar `link_url` con `mark-published` (ítem 637), G54 les puso a 59 posts ya publicados la fecha de ese momento. Efectos: el informe semanal de G54 del 16 al 23-nov dice 63 posts (fueron 4), la sugerencia de mejor horario iba a medir la rotación de 6 semanas con horas falsas y el informe mensual del 1-dic iba a contar los 59 como de noviembre. Arreglado de nuestro lado (`parche_fecha_publicacion_real.py`): la sugerencia toma la hora de Meta (`created_time` / `timestamp`) y el mensual usa la fecha programada cuando es anterior (en los 59 coincide con Meta, máximo 36 s de diferencia; simulado: de 59 contados en noviembre pasan a 8). Sintaxis comprobada; no se corrieron los informes para no mandar correos. Éxodo: pedido nuevo en Backend (19 pedidos) para que `mark-published` no pise la fecha de un post ya publicado y restaurar los 59. **Regla para nosotros:** no volver a llamar a `mark-published` sobre posts ya publicados.
720. **Vigía Web: reloj probado y días configurables** (2026-11-25). El reloj interno (la parte que usará el ingeniero) no tenía ninguna prueba. La decisión de qué corre pasó a una función propia (`que_toca`) y se sumaron `VIGIA_DIAS_COMPLETA` ("todos", "lun", "lun,jue"; también en inglés) y `VIGIA_CADA_RAPIDA` (cada N horas; 0 la apaga); una ronda que falla ya no apaga el reloj. 8 pruebas nuevas con un reloj simulado de 30 s (completa diaria y solo lunes, rápida cada 1 y 6 h y apagada, sin repetir en la misma hora, cambios de hora de marzo y noviembre, arranque tardío): 20 pasan. Arranque real comprobado con `servir` (lunes y cada 6 h, `/salud` responde). LEEME y `.env.example` al día, con la recomendación de dejar la rápida frecuente. **Falta:** que el ingeniero lo instale (Docker no se probó aquí).
721. **Vigía Web subido a `DESARROLLO_SOL` como `docs/VIGIA WEB/`** (2026-11-25), pedido de la usuaria. Copia de los archivos versionados de `PROYECTO-SOL/vigia-web` (sin `.venv` ni base de datos), las 20 pruebas pasan desde la copia; commit `430ff36` en `cotizcratingexpress-wx`. La fuente sigue siendo la de este repo: si se cambia, volver a copiarla. **Falta:** que el ingeniero lo instale (Docker no se probó aquí).
722. **Éxodo en un enlace fijo** (2026-11-25), decisión de la usuaria: desde ahora el Éxodo vigente se publica siempre en https://claude.ai/artifact/PCmGqdkWUMXEFXqvNCUjTr (antes mostraba el del 17-ago). Título «Éxodo G54 — vigente», sin fecha de documento. En el pedido de la fecha de publicación (ítem 719) quedó una nota cordial para el ingeniero. **Regla:** cada cambio a `g54/exodo/exodo-g54-VIGENTE.html` se vuelve a publicar en ese mismo enlace. Falta que la usuaria lo comparta con el ingeniero (botón Compartir) si todavía no lo tiene.
723. **Mónica: medidas de cm a pulgadas exactas** (2026-11-25), pedido de la usuaria. La conversión ya era correcta con «cm» (120×80×60 cm = 47,24×31,5×23,62 in), pero «cms», «centimetro», «centimeters», «meters» o «mts» se tomaban como pulgadas sin avisar. Arreglado en los 2 nodos que convierten (factores exactos 2,54 y 2,20462262, más formas de escribir cada unidad, y una unidad desconocida se marca como sospechosa); 15 casos probados. Paquete y LEEME en `docs/monica-v15/` de `DESARROLLO_SOL` (`171ed4e`); script `agente-correo-monica-SOL/parche_unidades.py`.
724. **Carpetas locales ordenadas** (2026-11-25), con el sí de la usuaria. Todo vive en `C:\SOLANGE RESPALDOS` (las «3 carpetas» son una dentro de otra: el mismo repo). No se renombra `PROYECTO_SOL GIT RESPALDO`: la memoria de Claude y el historial de sesiones dependen de ese nombre. Quitada la copia `cotizcratingexpress-wx-S` (version-S ya estaba entera en `DESARROLLO_SOL`; su `.env`, `.env.testing` y `ACCESO-LOCAL.txt` en `_ARCHIVO/cotizador-version-S-local-2026-11-25/`; la base local `cotiz_s` de MySQL sigue en Laragon) y su entrada `cotizador-S` del `launch.json`. `C:\prueba` y `C:	mp` movidas a `_ARCHIVO/sueltos-2026-11-25/`. Guía de git del ingeniero: `cotizcratingexpress-wx/CLAUDE.md` y `docs/AGENTE_CORREO_N8N.md` (sección 6).

## Error conocido

`API Error: 400 messages: text content blocks must be non-empty` — ocurre en la interfaz web de Claude Code (no en n8n) cuando el historial de conversación tiene bloques de texto vacíos tras llamadas a herramientas. Es un bug de la plataforma. Si ocurre: iniciar nueva sesión; este archivo CLAUDE.md proporciona todo el contexto necesario automáticamente.

## Historial de cambios relevantes

Ítems 1 a 142 (hasta el 2026-07-16) y la sección vieja de Nomify (fuera de nuestro alcance) archivados en `PROYECTO-SOL/historial/changelog-2-items-1-142-y-323-440-hasta-2026-10-16.md` el 2026-10-23.

---

## Reportes Diarios

> Solo los últimos 3 reportes (regla cambiada el 2026-10-30, antes 7 días, para gastar menos uso: CLAUDE.md se carga entero en cada sesión). Al agregar uno, mover el más viejo a `PROYECTO-SOL/historial/reportes/AAAA-MM-DD.md`.

---

### 2026-11-25 (Miércoles)

Arranqué con la rutina: cero errores, los posts en cola a su hora y un pedido real por la web de Crating Express para la caja de un televisor; Don Marc había aprobado todo y decidí dejar la razón social como está. Enseguida llegó lo urgente del día, el saludo de Thanksgiving: armé la lista con la planilla de clientes y con las conversaciones de los últimos seis meses que me reenvié, y lo mandé yo misma desde el Gmail de Crating Express en un solo correo con copia oculta. Después repasé los pendientes de la revisión de G54 y confirmé que las redes de Crating Express no están trayendo clientes; decidí no cambiar nada hasta que G54 tenga armada esa parte. Dejé los avisos de error llegando también por Telegram, para no depender de una sola cuenta de correo.

Antes de aprobar los borradores de Camila los revisé y encontré que varios iban a correos que no eran del negocio: ahora los descarta, usa el gancho de Miami Art Week y quedaron 7 borradores nuevos que reviso yo. También vi que 59 posts quedaron con la fecha de publicación cambiada al 17 de noviembre, lo que inflaba el informe semanal de G54; protegí nuestros informes y le dejé el pedido al ingeniero en el Éxodo, que desde hoy vive en un enlace fijo que se actualiza solo. Al Vigía Web le probé el reloj, ahora se puede programar por días y horas, y lo subí a la rama de desarrollo como VIGIA WEB.

En la tarde busqué en Notion lo de Hermes y repasé mis notas para dejar todo en limpio: encontré la guía de git que había escrito el ingeniero, corregí que Mónica convierta exacto de centímetros a pulgadas aunque el cliente escriba la unidad de otra forma, ordené las carpetas locales y borré copias viejas, y armé el manual de usuario de Bubble en seis versiones (negocio, agencia y cuenta propia, en inglés y español), sacado directo de la ayuda de la app. Al final empezamos con Hermes: vamos a armar primero un perfil de prueba nuestro con un chat sencillo en la terminal, y quedé en decidir mañana si instalo una llave de acceso en el servidor o si trabajamos pasando comandos. Todo quedó subido y el uso semanal está en 36 %.

---

### 2026-11-24 (Martes)

Arranqué con la rutina: cero errores, el post de Facebook de hoy salió a su hora y arreglé el diagnóstico diario, que no corría desde el sábado. Leí los comentarios de Don Marc sobre la razón social y tuvimos una llamada en la que aclaramos mejor mi rol. Después busqué en Notion la página de tendencias de avatares que él había dejado y con eso probamos versiones tiernas tipo peluche de los personajes; como se veían genéricas, decidimos que los grandes sigan siendo la identidad y que los tiernos queden para stickers. Pasé buena parte del día modelando en 3D a la Bubble grande con mis indicaciones: el azul de la marca, los hombros oscuros con su vivo rojo, el logo, Bubbli en la gorra y la coleta. Quedó mejor, pero todavía no del todo bien, así que lo dejamos en pausa.

En paralelo, Mónica quedó transcribiendo los audios con OpenAI y Groq de respaldo, ya en DESARROLLO_SOL. Revisé lo que depende del ingeniero: el cotizador versión S todavía no está en producción y falta la clave de los Reels en G54, así que le dejé redactado un mensaje pidiéndole fechas. Hice un análisis general y vi que las redes de Crating Express casi no tienen alcance, mientras que la demanda real llega por correo de empresas de carga. Por eso corrí la prospección hacia forwarders de Doral y galerías y museos de Miami: entraron 16 prospectos al CRM, mejoramos la redacción de Camila y quedaron 13 borradores con el gancho de Miami Art Week, que reviso yo antes de aprobar. También armé un borrador del inventario de mis tareas recurrentes para la Base de Conocimiento.

Al final el ingeniero nos dio una tarea nueva: un agente que vigile cualquier sitio web, con enlaces rotos, malware, certificado y dominio. Lo hice primero en n8n y, cuando supe que lo quería sin n8n, lo rehice como un programa independiente con Docker, que ya pasa sus pruebas y en la primera revisión encontró un enlace roto en la página de ISPM-15 de Crating Express. La versión de n8n quedó apagada, todo quedó subido y el uso semanal está en 27 %.

---

### 2026-11-23 (Lunes)

Arranqué con la rutina: cero errores, el 218 de Instagram salió el sábado a su hora y dejé programados los cuatro posts de esta semana, la penúltima de la rotación de horarios. Leí los comentarios de Don Marc del sábado y sumé ese paso a la rutina diaria para no saltarlo. Mientras yo probaba el cotizador, pasamos los correos de Camila al diseño de G54 que ya estaba aprobado y corregimos la razón social de Crating Express a Kabendish Corp.

La mayor parte del día fue el cotizador versión S. Le hice una última inspección, armé una lista de pruebas para ir tachando y, con mis notas, corregimos el nombre Kabendish, que el archivo de clientes actualice por ID en vez de crear clientes repetidos, y que la lista muestre a cada persona de contacto con su ID de cliente y el ID de su empresa, que lleva a todo lo de esa empresa. Claude corrió la revisión general y arregló detalles del celular y del logo, y yo quedé con la revisión final: la exportación ahora sale en Excel con sus columnas y cada empresa tiene su contacto principal. Lo pasé a DESARROLLO_SOL, el ingeniero lo lleva a producción y ahí lo volvemos a probar entero.

Con Mónica revisé que nunca envía correos sola: siempre deja borrador y avisa por Telegram. Le agregamos la firma real de la casilla de Gmail y una línea en el aviso que resume de qué trata cada correo; lo probamos con un correo real y el paquete quedó en el repositorio. Ya se lo indiqué al ingeniero, con el aviso de que el cotizador no aplica el mínimo de $159 por pieza que cobra el vendedor, así que mientras se decide hay que revisar el precio de cada borrador. Al final leí la Base de Conocimiento de Automatización MDA; abajo dejo mis comentarios.

**Comentarios sobre la Base de Conocimiento (Automatización MDA):**
- Funciones: en general están bien.
- A RISOS le faltan tareas que hago hoy: construir y mantener los agentes de IA en n8n (Marco, Mónica, los agentes de redes de G54, Camila y el Vigía), el cotizador de CE con su CRM, Bubble 54 y la operación semanal de G54 para CE.
- Sin eso, el agente coordinador de RISOS se diseñaría para un trabajo de marketer que no es el que hago.
- Caso 2: hay que corregir el texto con la aclaración (CE vende en línea y solo entrega a domicilio); hoy la página dice las dos cosas.
- Preguntas del final: las dejo para después del inventario, como dice el documento.
- Mientras tanto, completo el inventario de mis tareas (frecuencia, horas al mes, reglas y costo de un error). ¿Le parece bien?
