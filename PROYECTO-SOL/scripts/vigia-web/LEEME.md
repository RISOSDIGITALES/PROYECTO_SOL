# Vigía Web — agente que vigila cualquier sitio web (24-nov)

Flujo de n8n `🛡️ Vigía Web — Monitor de sitios` (ID `l4aOH09BdAEZ4UyP`, activo). Pedido del ingeniero: un agente independiente que vigile un sitio (enlaces rotos, virus, etc.). Sirve para cualquier sitio: ninguno queda fijo en el código.

## Cómo se usa
`POST https://n8n.mdarthurdigital.com/webhook/vigia-web` con el header `x-webhook-key` (la misma clave de los otros agentes, `N8N_WEBHOOK_KEY`).

| Acción | Cuerpo | Qué hace |
|---|---|---|
| revisar | `{"accion":"revisar","url":"ejemplo.com","modo":"profundo","max_paginas":25,"avisar":"a@b.com"}` | Revisa ya y devuelve el informe en JSON. Con `avisar`, además manda el correo. `modo: "rapido"` revisa solo la portada. |
| inscribir | `{"accion":"inscribir","url":"ejemplo.com","avisar":"a@b.com","nombre":"Ejemplo","idioma":"es"}` | Lo suma a la lista que se revisa sola: cada hora (rápido, a los :17) y cada día a las 6:05 de Miami (completo). |
| quitar / lista | `{"accion":"quitar","url":"ejemplo.com"}` · `{"accion":"lista"}` | Saca un sitio o muestra los inscriptos. |

## Qué revisa
- **Rápido:** que la portada responda (y en cuánto), certificado HTTPS inválido, redirección a otro dominio, sin HTTPS, y en la portada: iframes ocultos, JavaScript ofuscado, palabras de spam (palabra completa) y scripts de dominios nuevos (la primera vez anota la base).
- **Completo:** además recorre hasta 25 páginas (sitemap o enlaces de la portada), prueba hasta 250 enlaces internos y externos (401/403/405/429/999 cuentan como "no verificables", no como rotos), consulta **Sucuri SiteCheck** (malware, listas negras, vencimiento del certificado, CMS) y **RDAP** (vencimiento del dominio). Todo gratis y sin claves.

## Avisos
Correo HTML por la credencial de Gmail de n8n. Por webhook: siempre que venga `avisar`. Automático: solo problemas nuevos o que siguen después de 24 h; la revisión rápida avisa solo lo crítico; avisa también cuando un problema crítico se resolvió. Español o inglés (`idioma`).

## Archivos
`accion.js`, `inscriptos.js`, `revisar.js`, `avisos.js` son el código de cada nodo; `url.js`, las funciones de direcciones (el sandbox de n8n no tiene `URL()`); `crear.py [ID]` crea o actualiza el flujo y lo activa.
