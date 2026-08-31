---
name: task-observer
description: Meta-skill que observa sesiones de trabajo sustantivas (varios pasos, uso de herramientas, un entregable real) y anota en observations.md los patrones que valdría la pena convertir algún día en una skill reutilizable — correcciones reales del usuario, flujos que se repiten, técnicas que funcionaron especialmente bien. Consultar al arrancar cualquier tarea de programación, diagnóstico o investigación de varios pasos en este repo (G54/n8n, Nomify, Vox54) — no en preguntas conversacionales cortas ni en un solo comando suelto. Nunca crea skills por su cuenta, solo deja candidatos anotados para revisión humana periódica.
---

# Task Observer

Esta skill no produce ningún entregable para el usuario. Es un hábito de fondo: mientras trabajás en una tarea real de varios pasos, quedate atenta a si lo que estás haciendo (o lo que el usuario te está corrigiendo) es un patrón que se va a repetir — y si lo es, anotalo en `observations.md`, en este mismo directorio, para que alguien lo revise más adelante y decida si vale la pena convertirlo en una skill de verdad.

## Por qué existe

Esta sesión ya construye conocimiento de dos formas: el sistema de memoria nativo (los archivos en `memory/`, gobernados por las reglas de CLAUDE.md — hechos sobre el usuario, feedback, contexto de proyecto) y los propios workflows de n8n que se van corrigiendo. Ninguno de los dos captura una tercera cosa: **flujos de trabajo repetibles** — la secuencia de pasos en sí, no el hecho aislado. Si tres sesiones distintas terminan haciendo el mismo tipo de diagnóstico a mano, o el usuario corrige el mismo tipo de error de formato dos veces, eso es candidato a skill — un procedimiento que la próxima sesión podría ejecutar directo en vez de reinventar.

## Cuándo anotar (y cuándo no)

Anotá solo cuando pase algo de esto:
- El usuario corrige el mismo tipo de error una segunda vez (la primera vez es aprendizaje normal; la segunda ya es patrón).
- Repetiste vos misma, en esta sesión o comparado con el historial de CLAUDE.md, una secuencia de pasos que ya se hizo antes de la misma forma (ej. el mismo tipo de verificación en vivo, el mismo protocolo de limpieza de datos de prueba).
- Encontraste una técnica que funcionó mejor de lo esperado y que aplicaría igual de bien a una tarea futura distinta (no solo a esta).

NO anotés:
- Detalles de una sola vez que no se van a repetir (un bug puntual ya corregido, un dato específico de hoy).
- Cualquier cosa que ya sea obvia leyendo el código o el propio CLAUDE.md — no dupliques lo que ya está documentado ahí.
- Hechos sobre el usuario o el proyecto (nombre, preferencias, estado de negocio) — eso es del sistema de memoria nativo, no de esta skill. Esta skill es solo sobre **procedimientos repetibles**, no sobre información.

Ante la duda, no anotes. Un registro con pocas entradas reales es más útil que uno lleno de ruido que nadie va a leer.

## Cómo anotar

Agregá una entrada al final de `observations.md` (nunca reescribas ni borres entradas anteriores) con este formato:

```
## AAAA-MM-DD — título corto del patrón
**Contexto:** una o dos frases de qué tarea estabas haciendo cuando apareció.
**Patrón:** qué se repitió o qué corrigió el usuario, en concreto.
**Candidato a skill:** una frase de qué haría esa skill si existiera.
```

No hace falta pedirle permiso al usuario para escribir la entrada — es solo una nota interna para revisión futura, de bajo riesgo, en un archivo propio de esta skill. Sí es importante NUNCA crear ni instalar una skill nueva por tu cuenta a partir de una observación — eso lo decide un humano en la revisión periódica.

## Revisión periódica

Cuando el usuario pida explícitamente revisar los candidatos acumulados, leé `observations.md` completo, agrupá las entradas por patrón repetido, y presentá un resumen corto de cuáles aparecen más de una vez — esos son los candidatos reales a convertirse en skill.
