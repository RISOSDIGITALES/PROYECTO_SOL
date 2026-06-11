# Alex WA — Registro de Bugs y Causas Raíz

> Antes de modificar cualquier nodo de Alex, leer este archivo.
> Cada bug aquí documentado fue reproducido en pruebas reales.

---

## BUG-01 — Alex repite datos ya confirmados en mensajes posteriores
**Síntoma:** Cliente dice "sisi" o "si es correcto" confirmando las medidas → Alex responde repitiendo las medidas en vez de avanzar al siguiente dato (tipo de cajón).
**Causa raíz:** La IA recibía contexto del estado actual (PEDIR_TIPO_CAJON) pero sin override determinista, generaba libremente y "decidía" confirmar lo que el cliente acababa de confirmar.
**Fix:** Todos los estados de recolección de datos (PEDIR_PRODUCTO, PEDIR_MEDIDAS, PEDIR_TIPO_CAJON, PEDIR_PROTECCION, PEDIR_FECHA) tienen mensajes fijos en el nodo `🔍 Parsear Respuesta IA`. La IA no puede generar libremente en esos estados.
**Archivo afectado:** Nodo `🔍 Parsear Respuesta IA` → `mensajesDeterministas`

---

## BUG-02 — "¿En qué puedo ayudarte hoy?" se repite indefinidamente
**Síntoma:** Después de dar el nombre, cliente dice "Me gustaría hacer una consulta" → Alex responde otra vez "¿En qué puedo ayudarte hoy?" en bucle.
**Causa raíz 1:** `detectarIntento()` no reconocía la palabra "consulta" como señal de consulta, devolvía `null`, y el código `if (intento) tipo_flujo = intento` no actualizaba `tipo_flujo` → el estado seguía siendo IDENTIFICAR_NECESIDAD indefinidamente.
**Causa raíz 2:** La lógica era "si detecto cotización → cotizacion, si no → nada". Debería ser "si detecto cotización → cotizacion, si no → consulta (default)".
**Fix:** En IDENTIFICAR_NECESIDAD, siempre se asigna `tipo_flujo`: `(intento === 'cotizacion') ? 'cotizacion' : 'consulta'`. Cualquier mensaje que no sea claramente una solicitud de cotización va a consulta.
**Archivo afectado:** Nodo `🔧 Preparar Contexto IA` → bloque `IDENTIFICAR_NECESIDAD`

---

## BUG-03 — Alex lanza pitch completo del catálogo sin que nadie lo pida
**Síntoma:** Cliente da su nombre ("Con Solange Torrez") → Alex responde con descripción completa de todos los servicios de CE.
**Causa raíz:** El lead de una sesión anterior tenía `tipo_flujo='consulta'` guardado en Notas de Airtable. Al llegar el nuevo mensaje, se cargaba ese `tipo_flujo` viejo → estado quedaba FLUJO_CONSULTA directamente → la IA con contexto de catálogo generaba el pitch.
**Fix:** Se detecta `nombreRecienExtraido` (nombre estaba vacío antes del mensaje, ahora tiene valor). Cuando eso pasa: (1) se resetea `tipo_flujo = null` en Preparar Contexto para forzar IDENTIFICAR_NECESIDAD, (2) en Parsear se override siempre a "¡Mucho gusto, X! ¿En qué puedo ayudarte hoy?" independientemente del estado.
**Archivo afectado:** Nodo `🔧 Preparar Contexto IA` → después de extracción de nombre; Nodo `🔍 Parsear Respuesta IA` → bloque `nombreRecienExtraido`

---

## BUG-04 — Alex convierte medidas en pulgadas a centímetros
**Síntoma:** Cliente dice "miden 28×30×40" (en pulgadas) → Alex convierte a centímetros y responde "11.81 × 11.81 × 15.75 pulgadas".
**Causa raíz:** La IA recibía las medidas como texto libre y aplicaba "inteligencia" propia de conversión. No había instrucción explícita de guardar las medidas exactamente como las dio el cliente.
**Fix parcial:** Con los mensajes deterministas, el estado PEDIR_MEDIDAS ya pide "en pulgadas o centímetros" y el código guarda el texto tal como lo envió el cliente. La IA no procesa ni convierte medidas.
**Nota:** Verificar en pruebas que el guardado de medidas sea el texto literal del cliente.

---

## BUG-05 — "SCTP.SOL" guardado como nombre del cliente
**Síntoma:** Alex usa el nombre de usuario de WhatsApp ("SCTP.SOL") en vez del nombre real.
**Causa raíz:** El campo `Nombre_Contacto` en Airtable tenía el display name de WhatsApp de una sesión anterior. La extracción de nombre leía `nombreContacto` de la metadata de WA y lo guardaba sin verificar si era un nombre real.
**Fix:** La extracción de nombre solo acepta (1) prefijos explícitos ("Con X", "Soy X", "Me llamo X") o (2) mensajes muy cortos (≤4 palabras, sin dígitos) cuando el estado es PEDIR_NOMBRE. El display name de WA ya no se usa como nombre.
**Archivo afectado:** Nodo `🔧 Preparar Contexto IA` → bloque extracción NOMBRE

---

## BUG-06 — Alex inventa precios falsos
**Síntoma:** Alex mencionaba "$120" u otros precios sin haber llamado al cotizador.
**Causa raíz:** La IA tenía acceso al contexto del catálogo y "adivinaba" precios basándose en su entrenamiento.
**Fix:** En `sistemaIA` se agrega explícitamente: "NUNCA menciones precios ni costos — el sistema los calcula automáticamente". La única forma de dar precio es cuando el cotizador devuelve un valor real.
**Archivo afectado:** Nodo `🔧 Preparar Contexto IA` → construcción de `sistemaIA`

---

## BUG-07 — Mismo turno provoca dos saltos de estado
**Síntoma:** Cliente dice "Con Solange Torrez" → Alex extrae el nombre Y detecta tipo_flujo='consulta' en el mismo turno → salta directamente a FLUJO_CONSULTA con pitch de catálogo.
**Causa raíz:** `proximoPasoInicial` se calculaba al inicio, luego la extracción de nombre avanzaba el estado a IDENTIFICAR_NECESIDAD, y en ese mismo turno el bloque IDENTIFICAR_NECESIDAD corría y asignaba `tipo_flujo` basándose en el texto del nombre. "Con Solange Torrez" → no tiene señal de cotizacion → tipo_flujo='consulta' → estado FLUJO_CONSULTA en el mismo turno.
**Fix:** El flag `nombreRecienExtraido` resetea `tipo_flujo = null` ANTES de que corra el bloque IDENTIFICAR_NECESIDAD. Y el bloque IDENTIFICAR_NECESIDAD solo corre cuando `proximoPasoInicial === 'IDENTIFICAR_NECESIDAD'` (no cuando se acaba de extraer el nombre en este mismo turno).
**Archivo afectado:** Nodo `🔧 Preparar Contexto IA` → orden de operaciones

---

## BUG-08 — Clasificacion del lead no se guardaba en Airtable
**Síntoma:** El log mostraba clasificacion='Calificado' pero Airtable quedaba vacío.
**Causa raíz:** El estado "Lead Caliente" no era una opción válida en el campo SingleSelect de Airtable → el PATCH devolvía 422 → el campo `cotizacion_enviada` no se guardaba → el flujo no avanzaba.
**Fix:** Estado cambiado a "Calificado" (opción válida). El campo "Lead Caliente" fue removido del código.
**Archivo afectado:** Nodos `💾 Crear Lead` y `💾 Actualizar Lead`

---

## BUG-09 — Token de Airtable redactado en n8n por accidente
**Síntoma:** Alex deja de responder completamente. Error en n8n: "401 AUTHENTICATION_REQUIRED" en nodo Obtener Config Empresa.
**Causa raíz:** Al commitear a git para evitar que GitHub Secret Scanning bloquee el push, se ejecuta `re.sub(r'pat[A-Za-z0-9]{14,}', 'AIRTABLE_TOKEN_REDACTED', ...)` que reemplaza el token en el JSON. Si ese JSON redactado se sube a n8n vía API (PUT), n8n queda con el token redactado y falla.
**Fix:** Siempre redactar SOLO para el archivo local que va a git. El PUT a n8n debe usar el JSON con el token real (leído desde n8n o restaurado antes del PUT).
**Proceso correcto:**
  1. Leer workflow desde n8n (tiene token real)
  2. Modificar el código/nodos
  3. PUT a n8n con el JSON modificado (token real)
  4. Para git: hacer re.sub del token, guardar archivo, commit

---

## BUG-10 — Loop de medidas: Alex pide medidas aunque el cliente ya las dio
**Síntoma:** Cliente dice "28×30×40 cm" → Alex no reconoce los números como medidas y sigue pidiendo.
**Causa raíz:** La regex de extracción de medidas requería `hasDigits && proximoPasoInicial === 'PEDIR_MEDIDAS'`, pero si el cliente daba medidas antes de que el estado fuera PEDIR_MEDIDAS (por ejemplo, en el mismo mensaje donde da el producto), no se guardaban.
**Fix parcial:** Con los mensajes deterministas el flujo es secuencial y el cliente da medidas cuando el estado ya es PEDIR_MEDIDAS. Verificar en pruebas que `hasDigits && /\d+\s*(x|×|\*|por|by)\s*\d+/` capture correctamente.

---

## BUG-11 — Loop de fecha: Alex pide fecha aunque el cliente ya la dio
**Síntoma:** Cliente dice "para el primero de julio" → Alex no lo reconoce y sigue pidiendo fecha.
**Causa raíz:** La regex de extracción de fecha requería dígitos (`hasDigits`). "Para el primero" no tiene dígitos.
**Fix parcial:** La extracción de fecha ahora acepta texto cuando `proximoPasoInicial === 'PEDIR_FECHA'` y el mensaje no es solo un saludo. Verificar que "para el primero", "la próxima semana", "urgente" se guarden.
**Archivo afectado:** Nodo `🔧 Preparar Contexto IA` → bloque FECHA

---

## BUG-12 — tipo_cajón API con valores incorrectos bloqueaba el cotizador
**Síntoma:** El cotizador se llamaba pero devolvía error. La cotización nunca llegaba al cliente.
**Causa raíz:** Los valores de `tipo_caja_api` en el código eran `cajon_cerrado`, `jaula_abierta`, `plataforma` — la API del cotizador espera `cajones_cerrados`, `jaulas`, `plataformas_contenedor`.
**Fix:** Mapeado corregido en Preparar Contexto. Valores válidos: `cajones_cerrados`, `jaulas`, `palets_medida`, `cunas`, `plataformas_contenedor`, `embalaje_ferias`, `mayor`.
**Archivo afectado:** Nodo `🔧 Preparar Contexto IA` → cálculo de `tipoCajaApi`

---

## REGLAS PERMANENTES (no violar nunca)

1. **La IA solo habla libre en FLUJO_CONSULTA y POST_COTIZACION.** Todos los demás estados tienen mensajes fijos en `mensajesDeterministas`.

2. **`proximoPasoInicial` se usa para todas las extracciones**, no el recalculado. Esto evita que un turno provoque dos saltos de estado.

3. **`nombreRecienExtraido` siempre resetea `tipo_flujo = null`** para garantizar que el turno de presentación del nombre siempre dé "¡Mucho gusto!" y no salte a FLUJO_CONSULTA.

4. **Al hacer PUT a n8n vía API**, siempre leer el workflow desde n8n primero, modificar en memoria, y hacer PUT. No usar el JSON del archivo local (puede tener token redactado).

5. **El estado `tipo_flujo` persiste en Airtable entre sesiones.** Un cliente que vuelve días después puede tener `tipo_flujo='consulta'` viejo. El `nombreRecienExtraido` maneja el caso donde vuelve y da su nombre de nuevo. Para resets más completos, considerar timestamp de última actividad.

6. **Nunca usar "Lead Caliente" como estado de Airtable.** Las opciones válidas son: `Nuevo`, `En calificación`, `Calificado`, `Vendedor notificado`.
