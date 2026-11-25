# Vigía Web

Agente independiente (sin n8n) que vigila cualquier sitio web y avisa cuando algo anda mal. Python 3.10+ y una sola librería (`httpx`).

## Qué revisa

| Revisión | Cuándo | Qué mira |
|---|---|---|
| **Rápida** | cada hora (minuto 17); se cambia con `VIGIA_CADA_RAPIDA` (cada 6 h, 0 = apagada) | Que la portada responda y en cuánto; certificado HTTPS (validez y vencimiento, leído directo); redirección a otro dominio (posible secuestro); sitio sin HTTPS; código inyectado en la portada: iframes ocultos, JavaScript ofuscado, redirección automática a otro dominio, spam de farmacia/casino (palabra completa), scripts de dominios nuevos. |
| **Completa** | una vez al día (06:05, hora de Miami); con `VIGIA_DIAS_COMPLETA=lun` solo los lunes (o `lun,jue`) | Todo lo anterior, más: recorre hasta 25 páginas (sitemap o enlaces de la portada) buscando lo mismo, prueba hasta 250 enlaces internos y externos, consulta **Sucuri SiteCheck** (malware y listas negras, CMS y versión), **RDAP** (vencimiento del dominio) y, si hay clave, **Google Safe Browsing**. |

Los sitios que bloquean robots (401, 403, 405, 429, 999, como LinkedIn) no se cuentan como rotos. Todo es gratis; Safe Browsing pide una clave gratis de Google Cloud.

## Avisos

Por **correo (SMTP)**, **Telegram** o **webhook** (JSON firmado con HMAC-SHA256 en `X-Vigia-Firma`, para que otro sistema, como G54, lo reciba). Cada sitio elige sus destinos y su idioma (español o inglés).

- En la vigilancia automática avisa solo lo **nuevo**, o lo que **sigue después de 24 h**. La rápida avisa solo lo crítico.
- Avisa cuando un problema crítico **se resolvió**.
- Una revisión pedida a mano (CLI o API) manda el informe completo a los destinos que se le den.

## Cómo se corre

### Con Docker (recomendado en el servidor)
```bash
cp .env.example .env        # completar VIGIA_TOKEN y los destinos (SMTP, Telegram, secreto del webhook)
docker compose up -d --build
```
Los datos (sitios, avisos e historial) quedan en el volumen `vigia-datos` (SQLite).

### Sin Docker
```bash
python -m venv .venv && .venv/bin/pip install -r requirements.txt
VIGIA_TOKEN=... .venv/bin/python -m vigia servir          # API + reloj interno
```
O sin servicio, con cron: `python -m vigia ronda --modo rapido` cada hora y `python -m vigia ronda --modo completo` una vez al día.

## Línea de comandos
```bash
python -m vigia revisar ejemplo.com                 # revisión completa ya (--rapido, --json, --email a@b.com)
python -m vigia inscribir ejemplo.com --email a@b.com [--telegram CHAT_ID] [--webhook URL] [--nombre X] [--idioma en]
python -m vigia quitar ejemplo.com
python -m vigia lista
python -m vigia ronda --modo rapido|completo
python -m vigia servir
```
`revisar` termina con código 0 (todo bien), 1 (avisos) o 2 (crítico), para usarlo en otros scripts.

## API (con `Authorization: Bearer <VIGIA_TOKEN>`)
| Método y ruta | Cuerpo | Qué hace |
|---|---|---|
| `GET /salud` | — | Estado (sin clave). |
| `GET /sitios` | — | Sitios inscriptos. |
| `POST /sitios` | `{"url":"ejemplo.com","email":"a@b.com","telegram":"","webhook":"","nombre":"","idioma":"es"}` | Inscribe (hace falta al menos un destino). |
| `DELETE /sitios?url=ejemplo.com` | — | Quita. |
| `POST /revisar` | `{"url":"ejemplo.com","modo":"completo","max_paginas":25,"email":"…"}` | Revisa ya y devuelve el informe en JSON. |
| `GET /informes?url=ejemplo.com&n=10` | — | Últimos informes (se guardan 200 por sitio). |

## Pruebas
```bash
.venv/bin/pip install pytest && .venv/bin/python -m pytest -q tests
```
20 pruebas sin internet. 12 contra un sitio de prueba local con enlaces rotos, un iframe oculto, spam, una redirección a otro dominio y un sitio caído, más la lógica de avisos, el guardado y la API. 8 del reloj interno con un reloj simulado: completa diaria o solo ciertos días, rápida cada N horas o apagada, sin repetir en la misma hora y sin duplicar en los cambios de hora de marzo y noviembre.

**Recomendación de horario:** la completa puede ser semanal (enlaces rotos, malware y dominio cambian poco), pero conviene dejar la rápida cada hora o cada pocas horas: es la que avisa si el sitio se cae, lo secuestran o vence el certificado.

## Límites conocidos
- Revisa el HTML que devuelve el servidor: el contenido que se arma solo con JavaScript en el navegador no se ve.
- El dominio registrable se calcula de forma aproximada (sirve para `.com`, `.com.mx`, `.co.uk`).
- Sucuri SiteCheck es un servicio público gratis, sin garantía de disponibilidad; si no responde, el informe lo dice (`sucuri: sin respuesta`).
