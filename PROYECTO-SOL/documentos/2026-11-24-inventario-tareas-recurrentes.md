# Inventario de tareas repetitivas — RISOS (versión del 26-nov)

Para la Base de Conocimiento del proyecto «Automatización MDA» (parte 1, «Lo que falta para convertir este mapa en inventario»). Pedido de Don Marc del 25-nov: el inventario y las preguntas van antes que Hermes.

**Alcance:** solo las tareas de RISOS, incluida la operación de G54 que hago yo para Crating Express. Las de ISX y WaltD las completan el ingeniero y Don Marc: no las estimo yo.
**Horas:** estimadas a partir de lo que registra el repo (changelog y reportes diarios). **Las corrijo con lo real antes de entregarlo.**

**Nivel de automatización** (para la pregunta de si hace falta un AC): **0** = lo hace una persona · **1** = script o flujo determinista · **2** = flujo con IA y aprobación humana · **3** = agente que decide solo.

## A. Tareas que hago hoy

| # | Tarea | Frecuencia | Horas/mes | Quién hoy | ¿Reglas claras? | Costo de un error | Nivel hoy → propuesto |
|---|---|---|---|---|---|---|---|
| 1 | **Rutina diaria de G54**: diagnóstico de los 42 flujos (errores, cola de posts, panel, documentación de la API, firma de Meta) | Diaria (lun-sáb) | 10 | Sol + Claude | Sí (`diag-rutina.py`) | Alto: un post que no sale o un agente caído pasa días sin verse (el 218 de Instagram, 21-nov) | 1 → 1 con aviso solo si hay algo raro (Telegram) |
| 2 | **Leer los comentarios de Don Marc** del día anterior en Notion y pasarlos a pendientes | Diaria | 3 | Sol + Claude | Sí (negritas, «Comnts Mc», «VB Mc») | Medio: un pedido suyo que se pierde | 0 → 2 (resumen de sus negritas; yo decido qué se hace) |
| 3 | **Reporte diario** en Notion y en el repo | Diaria | 6 | Sol + Claude | Sí (formato fijo, 2-3 párrafos) | Bajo-medio: Don Marc pierde visibilidad | 2 → 2 (el borrador lo hace la IA; lo apruebo yo) |
| 4 | **Corte de día y orden del repo** (changelog, archivo, pendientes, subir a GitHub) | Diaria | 4 | Sol + Claude | Sí | Medio: la otra computadora trabaja sobre una copia vieja | 2 → 1 (archivo y subida automáticos) |
| 5 | **Rotación semanal de redes de CE**: aprobar ideas, generar posts, revisar texto e imagen, programar | Semanal (lunes) | 4 | Sol + agentes G54 | Sí | Medio: sale publicado un post con un dato inventado | 2 → 2 (en pausa: las redes de CE esperan el módulo de G54, 25-nov) |
| 6 | **Revisar los informes** semanal y mensual de Analytics | Semanal y mensual | 2 | Sol | Sí (línea base del 12-oct) | Bajo: decisiones sin datos | 1 → 1 |
| 7 | **Pedidos al ingeniero (Éxodo)**: ver qué resolvió, mantener la lista, mandar los mensajes | Semanal | 4 | Sol | Sí (en positivo, sin Bubble) | Alto: bloqueos sin fecha (cotizador, Mónica, Reels) | 0 → 2 (la IA compara la API con la lista; yo mando) |
| 8 | **Pruebas con casos reales** de Marco, Mónica y los botones de G54 | Según los casos | 4 | Sol + Claude | Sí (lista «Pruebas pendientes») | Alto: un agente que falla con un cliente real | 0 → 0 (necesita criterio humano) |
| 9 | **Prospección y correos de Camila**: búsqueda por segmento, revisar y aprobar borradores | Semanal o quincenal | 3 | Sol + Camila | Sí (nada sale sin aprobación) | Alto: un mal primer correo quema el contacto | 2 → 2 |
| 10 | **Mantenimiento de agentes**: corregir lo que encuentra el diagnóstico, actualizar los paquetes del ingeniero (Mónica, cotizador, Vigía Web) | Semanal | 12 | Sol + Claude | En parte (reglas de plataforma; cada arreglo es distinto) | Alto: un cambio de plataforma que rompe otra empresa | 0 → 0 |
| 11 | **Pedidos reales que llegan por la web de CE** (formulario → CRM de G54): revisarlos y avisar al vendedor lo que falta confirmar | Semanal | 1 | Sol | Sí | Alto: se pierde una venta (trato 288, 24-nov) | 1 → 1 (el aviso al vendedor puede salir solo) |
| 12 | **Saludos y campañas de temporada** a clientes de CE (Thanksgiving, fin de año) | 3-4 al año | 1 (≈ 4 h por campaña) | Sol | No (la lista de clientes está desactualizada) | Medio: un correo a un cliente equivocado o repetido | 0 → 2 (lista limpia en el CRM y borrador por IA) |
| 13 | **Reuniones** con el ingeniero y Don Marc, y sus pendientes | Semanal | 4 | Sol | No | Medio | 0 → 0 |

**Total: unas 58 horas al mes en tareas que se repiten.** El resto es construcción (agentes nuevos, Bubble, cotizador, Vigía Web): no se repite y no entra aquí.

## B. Funciones MARKETER del mapa: cómo están hoy

El mapa de la Base de Conocimiento le asigna a RISOS la función MARKETER. Hoy esa función ya la cubren agentes, no una persona:

| Función del mapa | Quién la hace hoy | Nota |
|---|---|---|
| Desarrollo web simple con DIVI en WordPress | **Por confirmar (Sol)** | No aparece en el registro desde julio |
| Creación y marketing de contenidos | Agentes de G54 (Strategist, Ideas, Content, Distribution) con mi aprobación | Es la tarea 5 |
| Atención al cliente, ventas y posventa | Marco (WhatsApp y teléfono) y Mónica (correo); el cierre, el vendedor de CE | Mi parte es la tarea 8 |
| Organizar y supervisar a los EDs marketers | Todavía no hay EDs marketers | Empieza cuando haya un segundo proyecto en G54 |

**Lo que muestra el inventario:** casi todo lo de RISOS ya es nivel 1 o 2. Lo que queda en 0 (tareas 8, 10 y 13) necesita criterio y no se resuelve con un coordinador. Por eso **hoy no hace falta un AC RISOS**: la supervisión puede seguir siendo humana. Se justifica cuando existan EDs marketers a los que asignar y revisar trabajo.

## C. Respuestas propuestas a las preguntas abiertas (las que me tocan)

Son propuestas para que Don Marc las apruebe o las corrija.

1. **¿Qué capacidades debe tener el AC RISOS?** Por ahora ninguna (sección B). Cuando haya EDs marketers: asignarles el calendario de G54 de su proyecto, revisar sus entregables con una lista fija (datos del perfil, sin precios ni plazos inventados, tono de la marca) y avisarme solo de lo que no pasa la lista.
2. **¿Qué umbrales debe cumplir una automatización para considerarse exitosa?** Propuesta, medida durante 4 semanas: menos de 1 error que llegue a un cliente por mes; al menos la mitad de las horas de esa tarea ahorradas; y que la intervención humana sea solo aprobar (un clic), no corregir. Si no los cumple, la tarea vuelve al nivel anterior.
3. **¿Quién investiga los requisitos de un trámite nuevo y quién lo valida?** Lo investiga la IA con una matriz de requisitos y dependencias (todas las plataformas del objetivo, como pide la lección del Caso 1); lo valida la persona dueña del trámite antes de ejecutarlo. Nada se ejecuta sin esa validación.
4. **¿G54 administrará cuentas de X desde la Etapa 1?** Propongo que no: el plan gratis de la API de X sirve casi solo para publicar, y leer comentarios y métricas (lo que hace Community y Analytics) es pago (precio vigente a confirmar antes de decidir); G54 no usa servicios que pidan tarjeta hasta validar la Etapa 1 (decisión del 28-oct). Se evalúa en la Etapa 2.
5. **¿Cómo se completan los trámites de TikTok y YouTube a partir de Meta?** Primero una matriz de requisitos de las dos (tipo de cuenta, verificación de empresa, permisos y revisión de la app), comparada con lo que ya se tiene en Meta, antes de abrir cualquier trámite. Puedo armar esa matriz si Don Marc lo aprueba.

**Las que no me tocan** (ISX, WaltD, AP, sub-agente de G54, cPanels) y la de **Google Business Profile de CE** (no sé su estado actual) quedan para Don Marc y el ingeniero.
