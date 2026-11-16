# TikTok en G54 — plan de trabajo

16-nov-2026

## Resumen

G54 puede hacer en TikTok casi lo mismo que en Facebook, pero en 4 etapas, cada una con su propia aprobación de TikTok. Nada de lo aprobado con Meta sirve. La recomendación es pedir ya la etapa 1: con ella cada post aprobado llega solo a la bandeja de TikTok de la empresa y una persona solo toca "publicar".

| Etapa | Qué podrá hacer G54 | Qué pide TikTok | Dificultad |
| --- | --- | --- | --- |
| 1. App aprobada | Mandar cada post (fotos o video, con su texto) a la bandeja de TikTok de la empresa; leer seguidores, vistas y likes | Revisión de la app, sin auditoría | Moderada: días a 2 semanas |
| 2. Auditoría aprobada | Publicar solo, sin pasar por la bandeja | Auditoría de Content Posting API y una pantalla de aprobación como la exige TikTok | Difícil: 2 a 6 semanas |
| 3. API para empresas | Leer y responder comentarios (Community AI) | Otra solicitud, cuenta de empresa | Moderada |
| 4. Mensajes directos | Que Sales AI responda mensajes | Acceso avanzado; no funciona para cuentas de EE. UU. | Muy difícil; no sirve para Crating Express |

Los plazos son de integradores que ya pasaron la revisión: TikTok no publica plazos.

## Lo que ya está hecho

El flujo de n8n que manda los posts a TikTok está armado y probado, y queda apagado hasta que G54 tenga la conexión. Se llama "🎵 TikTok — Publicar (G54)" (webhook `tiktok-publish-g54`).

- **Qué hace:** recibe un post aprobado y lo manda a TikTok. Las imágenes van como post de fotos (hasta 35) y los videos como video; el texto se corta al máximo de TikTok (4000 caracteres).
- **Modo borrador (por defecto):** el post llega a la bandeja de TikTok de la empresa y una persona lo publica desde la app. No necesita la auditoría.
- **Modo directo (listo para la etapa 2):** publica solo, con la privacidad, los comentarios y el contenido comercial que eligió la persona al aprobar. Si falta esa elección, no publica.
- **Seguimiento:** consulta el estado hasta que TikTok confirma que llegó a la bandeja o que se publicó. No reintenta el envío, para no duplicar.
- **Si falla:** explica el motivo con palabras claras (token vencido, dominio sin verificar, 5 borradores pendientes, contenido rechazado) y avisa por correo.
- **Candado:** solo acepta llamadas internas o con la clave de los webhooks.

**Cómo se probó (16-nov):** con 9 casos simulados de respuestas de TikTok; con una llamada real a la API de TikTok con un token falso (respondió `access_token_invalid`, así que la dirección y el formato son correctos); y de punta a punta hasta la ruta de G54 que todavía no existe.

## Lo que tiene que hacer G54 (el ingeniero)

Son 8 pasos, en este orden; están en el Éxodo como un solo pedido, en el área TikTok. Los pasos 1 a 6 alcanzan para la etapa 1.

1. **Crear la app de G54 en TikTok for Developers**, a nombre de G54, con Login Kit y Content Posting API. Permisos: `user.info.basic`, `video.upload` (borrador), `video.publish` (publicar solo), `user.info.stats` y `video.list` (estadísticas). TikTok pide la política de privacidad y los términos publicados y un video del flujo de conexión.
2. **Verificar el dominio de las imágenes** (`https://api.growth54.com/storage/`) con el registro de DNS que da TikTok. Sin eso, TikTok no puede bajar la imagen ni el video del post.
3. **Botón "Conectar con TikTok"** por empresa, en Conexión de redes. G54 guarda los datos de acceso y renueva el token antes de que venza (dura 2 horas; el de renovación, 180 días, y cambia en cada renovación).
4. **Ruta para n8n** `GET /api/n8n/companies/{id}/tiktok` que devuelva el token vigente. El flujo ya la llama con el formato pedido.
5. **TikTok como plataforma de los posts:** ideas, posts, programación y alarma, con un campo `copy_tiktok` opcional.
6. **Estado "En la bandeja de TikTok"** en el Editor, para que el cliente sepa que falta publicarlo desde la app.
7. **Pantalla de aprobación como la exige TikTok** (solo para la etapa 2): nombre de la cuenta, vista previa, privacidad elegida a mano sin valor por defecto, "Permitir comentarios" sin marcar, contenido comercial apagado de entrada y el texto de consentimiento de TikTok. Consultar con soporte de TikTok si vale aprobar en el panel y publicar después a la hora programada.
8. **Pedir la auditoría** de Content Posting API cuando la app esté aprobada y la pantalla lista.

## Lo que hacemos nosotros cuando G54 entregue

- [ ] Encender el flujo `tiktok-publish-g54`.
- [ ] En Distribution AI, mandar los posts con plataforma TikTok a ese flujo y marcarlos "En la bandeja de TikTok" (o con su motivo si fallan).
- [ ] En Content AI, escribir el texto propio de TikTok (`copy_tiktok`): más corto, con gancho en la primera línea y hashtags del idioma del post.
- [ ] En Ideas AI y Strategist, sumar TikTok como plataforma, con preferencia por ideas que se puedan grabar en video (Reels AI y los pedidos de grabación ya existen).
- [ ] En Analytics semanal y mensual, sumar seguidores, vistas y likes de TikTok.
- [ ] En el Vigía, revisar los posts que queden en la bandeja sin publicar más de 24 h (TikTok no acepta más de 5 pendientes).
- [ ] Probar de punta a punta con la cuenta de TikTok de Orison o de Crating Express.

## Lo que tienen que decidir la usuaria y Don Marc

- **Si se avanza y hasta qué etapa.** La etapa 1 alcanza para que el contenido llegue listo a TikTok; la 2 vale la pena solo si el panel tiene la pantalla de aprobación que pide TikTok.
- **Qué empresas lo usan primero.** Para probar hace falta una cuenta de TikTok de empresa real (la de Orison está en armado).
- **Cuentas de TikTok a nombre de cada empresa**, no de una persona: correo de la empresa, verificación en dos pasos y contraseña donde el equipo pueda recuperarla. Pasarlas a cuenta de empresa (gratis) para tener estadísticas.
- **Quién publica desde la bandeja** mientras no haya auditoría. Si nadie lo hace, los borradores se acumulan y TikTok deja de aceptar después de 5.
- **Las páginas legales de G54** (privacidad y términos), pendientes desde el 5-nov: son requisito para que TikTok apruebe la app, igual que para Meta.

## Qué tan difícil es cada permiso

- **Revisión de la app (etapa 1): la más accesible.** Gratis. Pide un sitio web real, privacidad y términos publicados, para qué se usa cada permiso y un video del flujo. Lo que hoy la frena son las páginas legales.
- **Auditoría para publicar solo (etapa 2): la difícil.** TikTok revisa la pantalla donde la persona aprueba cada post; si no cumple su guía, la rechaza y hay que volver a pedirla. Sin auditoría, lo que se publica directo queda en privado y la app la pueden usar unas 5 cuentas por día.
- **API para empresas, comentarios (etapa 3): moderada.** Otra solicitud desde el portal de TikTok para empresas. Los comentarios de anuncios no se pueden responder por ahí.
- **Mensajes directos (etapa 4): la menos segura.** En prueba, con acceso avanzado; solo deja responder dentro de 48 horas, no escribir primero, y según varios integradores no funciona en EE. UU., Europa ni India.

## Límites y riesgos

**Límites de TikTok, aun con todo aprobado:**

- Como mucho 5 borradores pendientes en la bandeja cada 24 horas.
- Unas 15 publicaciones por día por cuenta y 6 llamadas por minuto por token.
- La app de TikTok del teléfono tiene que estar actualizada (31.8 o más) para recibir borradores.
- No se puede poner la marca de G54 sobre el contenido.

**Riesgos:**

- **TikTok es de video.** Los posts de imagen entran como post de fotos, pero lo que rinde es el video: conviene empujar Reels AI y los pedidos de grabación.
- **Desde enero de 2026 TikTok en EE. UU. tiene otra empresa dueña** y sus términos para desarrolladores suman un acuerdo sobre datos de usuarios de EE. UU. Leerlo antes de aceptar, por Crating Express.
- **Los mensajes directos no van a servir para Crating Express** si se confirma la restricción de EE. UU.

**Falta confirmar:**

- Que el modo borrador no necesite auditoría (lo dicen integradores; TikTok no lo dice explícitamente).
- Si vale aprobar en el panel y publicar después a la hora programada (la guía de TikTok no lo dice).
- Los plazos de revisión y auditoría (son de integradores).

## Fuentes

Oficiales de TikTok (consultadas el 16-nov-2026):

- [Content Posting API: cómo empezar](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [Publicación de fotos](https://developers.tiktok.com/doc/content-posting-api-reference-photo-post)
- [Publicación directa](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)
- [Verificación de dominio para traer archivos](https://developers.tiktok.com/docs/en/content-posting-api-media-transfer-guide)
- [Guías para compartir contenido (la pantalla de aprobación)](https://developers.tiktok.com/doc/content-sharing-guidelines)
- [Manejo de los tokens de acceso](https://developers.tiktok.com/doc/oauth-user-access-token-management)
- [Permisos de la API](https://developers.tiktok.com/doc/tiktok-api-scopes/)

De integradores (plazos, regiones, modo borrador):

- [PostPeer: publicar en TikTok por API](https://www.postpeer.dev/blog/how-to-post-on-tiktok-with-api)
- [Postiz: borradores de TikTok](https://docs.postiz.com/providers/tiktok)
- [Wati: mensajes de TikTok y regiones](https://support.wati.io/en/articles/15701340-how-to-connect-and-manage-tiktok-messages-dms-in-wati)
- [Sprout Social: límites con comentarios](https://support.sproutsocial.com/hc/en-us/articles/46228181824909)
- [Open Terms Archive: términos nuevos de TikTok en EE. UU.](https://opentermsarchive.org/en/memos/tiktok-rewrites-all-terms-following-usa-operations-transfer/)
