# Inventario de tareas recurrentes — borrador (24-nov)

Para la Base de Conocimiento de Automatización MDA. "Inventario" = las tareas que se repiten (definición de Don Marc, 23-nov).
Armado a partir de lo que registra el repo; **las horas son estimaciones para corregir** con lo real.

| # | Tarea | Frecuencia | Horas/mes (estim.) | Reglas que la gobiernan | Costo de un error |
|---|---|---|---|---|---|
| 1 | **Rutina diaria de G54**: diagnóstico de los 41 flujos (errores, cola de posts, panel, docs de la API, firma de Meta), revisión de ejecuciones raras | Diaria (lunes a sábado) | 10 | Revisar antes de proponer; un hallazgo se documenta el mismo día | Alto: un post que no sale o un agente caído pasa días sin verse (ej. el 218 de Instagram, 21-nov) |
| 2 | **Leer los comentarios de Don Marc** en el resumen del día anterior (Notion) y pasar sus pedidos a pendientes | Diaria | 3 | Sus negritas y las propiedades «Comnts Mc» y «VB Mc» | Medio: un pedido suyo que se pierde |
| 3 | **Reporte diario** (primera persona, 2-3 párrafos) en Notion y en el repo | Diaria | 6 | Formato fijo; se pega completo, no resumido | Bajo-medio: Don Marc pierde visibilidad del avance |
| 4 | **Corte de día y orden del repo** (changelog, archivo de ítems viejos, «Próxima sesión», subir a GitHub) | Diaria | 4 | Todo commit se sube el mismo día (dos computadoras) | Medio: la otra computadora trabaja sobre una copia vieja |
| 5 | **Rotación semanal de RRSS de Crating Express**: aprobar ideas, generar posts, revisar textos e imágenes, programar en hora de Miami | Semanal (lunes) | 4 | Sin precios ni plazos fuera del perfil; horarios según la rotación | Medio: un post con un dato inventado sale publicado |
| 6 | **Revisar el informe semanal y el mensual** de Analytics | Semanal y mensual (día 28) | 2 | Comparar contra la línea base del 12-oct | Bajo: decisiones sin datos |
| 7 | **Pedidos al ingeniero (Éxodo)**: revisar qué resolvió en la API y el panel, mantener la lista y mandar los mensajes | Semanal | 4 | Pedidos en positivo y dirigidos a él; sin temas de Bubble | Alto: bloqueos que se quedan sin fecha (cotizador, Mónica, Reels) |
| 8 | **Pruebas con casos reales** de Marco, Mónica y los botones de G54 (lista «Pruebas pendientes») | Según aparezcan casos | 4 | No gastar la clave de OpenAI de CE sin avisar; borrar las pruebas al terminar | Alto: un agente que falla con un cliente real |
| 9 | **Prospección y correos de Camila**: correr la búsqueda por segmento, revisar los borradores y aprobarlos | Semanal o quincenal | 3 | Nada sale sin aprobación; cada negocio desde su casilla | Alto: un mal primer correo quema el contacto |
| 10 | **Mantenimiento de agentes**: corregir lo que el diagnóstico encuentra, actualizar el paquete del ingeniero (Mónica, cotizador) | Semanal | 12 | Nada de datos de un cliente fijos en los agentes de G54; secretos fuera del repo | Alto: un cambio de plataforma que rompe a otra empresa |

**Total estimado: ~52 horas al mes en tareas recurrentes.** El resto del tiempo es construcción (agentes nuevos, Bubble, cotizador), que no se repite y no entra en el inventario.

**Candidatas a automatizar primero** (mucho tiempo, reglas claras): 1, 3 y 4 ya están medio automatizadas (`diag-rutina.py`); la 5 podría quedar en aprobar con un clic si G54 programa solo según la rotación.
