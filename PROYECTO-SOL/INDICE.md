# Índice del repo — dónde está cada cosa

Ordenado el 2026-11-03. Los nombres llevan la fecha como `AAAA-MM-DD` para que se ordenen solos.
Lo que se movió o se borró ese día sigue en el historial de git (`git log --follow <archivo>`).

| Carpeta | Qué hay |
|---|---|
| `../CLAUDE.md` | Contexto del proyecto, reglas, pendientes, changelog de los últimos días y los últimos 3 reportes. |
| `agentes-n8n/` | **Copia de todos los agentes que hay hoy en n8n**, con los secretos tapados. `LISTA.md` tiene nombre, ID, si está activo y la fecha de la última edición. Se regenera con `python PROYECTO-SOL/scripts/exportar-agentes.py`. |
| `agentes-n8n/g54-plataforma/` | Agentes de la plataforma G54 (Content, Ideas, Strategist, Distribution, Community, Sales, Analytics, Camila, Vigía, Reels…). |
| `agentes-n8n/marco-crating-express/` | Marco (WhatsApp, Telegram, voz) y sus subflujos, y los flujos propios de Crating Express. |
| `agentes-n8n/otros/` | Lo que no es de G54 ni de Marco (el relay de Groq de Bubble). |
| `g54/exodo/exodo-g54-VIGENTE.html` | **El Éxodo actual**: los pedidos al ingeniero. |
| `g54/exodo/historial/` | Versiones anteriores del Éxodo, por fecha. |
| `g54/exodo/tarea-adicional-*.html` | Tareas para el ingeniero que salieron del Éxodo el 5-nov: cotizador de Crating Express y textos legales de growth54.com. |
| `g54/documentos/` | Documentos de G54: comparativo del CRM, método de validación, arquitectura, guías e investigación. `genesis/` tiene los Génesis y `docs-api-g54/` las copias de la documentación de la API. |
| `g54/respuestas-walter/` | Respuestas a y del ingeniero, por fecha. |
| `g54/sops/` | Procedimientos (ciclo semanal de contenido, alta de cliente nuevo, Marco). Abrir `index.html`. |
| `g54/datos/` | Respaldos de datos puntuales de G54. |
| `crating-express/qr/` | Códigos QR y logo de Crating Express. |
| `crating-express/marco-notas/` | Notas de Marco: bugs históricos, referencia del catálogo, configuración del asistente de VAPI. |
| `mascotas/jelly54/` y `mascotas/jargrowth/` | Las mascotas animadas. Abrir el `*-demo.html`. En JarGrowth, `v1/` y `v2/` son las versiones guardadas (la v2 es la elegida). |
| `nomify/` | Nomify (planilla de Nicaragua) y `planilla-nicaragua.md` con su referencia. |
| `documentos/` | Documentos sueltos que no son de G54 (propuesta de solvencia laboral). |
| `historial/` | Changelog viejo (`changelog-1`, `-2` y `-3`, con los ítems y las fechas que cubre cada uno) y `reportes/` con los reportes diarios archivados. |
| `archivo/agentes-borrados-de-n8n/` | Última copia de cada agente que ya no existe en n8n. Nombre: `agente--ID--fecha-de-la-copia.json`. |
| `archivo/descripciones-viejas-de-agentes/` | Las descripciones de la estructura vieja de carpetas. |
| `archivo/planilla-legacy/` | La primera versión de la planilla (antes de Nomify). |
| `scripts/` | `diag-rutina.py` (diagnóstico diario) y `exportar-agentes.py` (copia de los agentes). |
