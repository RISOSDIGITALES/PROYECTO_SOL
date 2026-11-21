# Mensajes del 21-nov

## Para Silvia

Hola Silvia, buenos días. Una consulta sobre Orison en G54: ¿fuiste vos quien le conectó la página de Facebook «WtCelebration» con el botón «Conectar con Meta»? Si fuiste vos, está perfecto, solo quiero coordinar el momento: por ahora tengo a Orison en pausa en G54 para que los agentes no generen ni publiquen nada mientras termino unas pruebas, y te aviso apenas la podamos activar.

Además, al hacer esa conexión, G54 le borró a Crating Express su Facebook y su Instagram, porque las dos empresas compartían el mismo registro de página. Por eso ayer no salió el post de Instagram de CE. Ya lo volví a conectar y el post sale hoy. Te cuento para que, si volvés a conectar otra empresa, me avises antes y así reviso que no se pierda ninguna.

¡Gracias!

## Para el ingeniero (un solo mensaje)

Buenos días, Don Walter. Le junto en un solo mensaje lo que tengo pendiente con usted:

1. **«Conectar con Meta» borra la página de otra empresa.** El 20-nov se conectó Orison a «WtCelebration» y Crating Express se quedó sin Facebook ni Instagram (en `social-targets` solo le quedó LinkedIn y `/api/n8n/pages/1713965015486703` respondía «page_id no registrado»). Por eso el post 218 no salió. Ya los volví a cargar a mano en Redes Sociales. Le pido que, al conectar una página, G54 cambie solo las filas de esa empresa y deje las de las demás como están.
2. **Mónica v15 lista para importar** en su n8n: paquete en `agente-correo-monica-SOL\v15-SOL\para-el-ingeniero\` (procesador, receptor y `LEEME.md` con los pasos). Antes de encender la v15, apagar la v14, porque si las dos leen la misma casilla, se contesta dos veces. Va sin credenciales; hay que ponerlas y que el vendedor le dé `/start` al bot de avisos. Si usted ya tiene un bot de Telegram para estos avisos, se usa ese.
3. **`{{nombre}}` en los correos:** la IA de plantillas escribe «Hola {{nombre}},», pero G54 no lo reemplaza y el correo llega así al cliente (lo comprobé con un envío real). Le pido que G54 lo reemplace con `destinatario_nombre`, y que use un saludo neutro cuando no haya nombre.
4. **Seguridad (18-nov):** en la revisión de Hermes se vieron en pantalla la contraseña del servidor y los dos tokens MCP de Cortana (EasyPanel y WxFocus). Usted decide si los cambia.
5. **Hermes:** ¿qué tiene que hacer el perfil `mda`, con qué herramientas y por qué canal?
6. **JSON del Tutor (`9b9cd801…`) y del chat público (`91061fae…`)** del cotizador, para que el chat responda con enlaces y lea audios, PDF e imágenes.
7. **Acceso a la casilla de Crating Express**, para analizar los correos reales antes de encender Mónica.
8. **Borrar la conversación «PRUEBA SOL 1421»** de la memoria de la app de producción.
9. **Dominio:** `api.growth54.com` ya responde lo mismo que `apigrowth.mdarthurdigital.com`. ¿Pasamos los flujos al dominio nuevo o seguimos con el actual?
10. **Borradores 7 y 8 de Camila** (prospectos reales, del 28-oct) siguen esperando aprobación en G54.
11. **`rrss_reel`** sigue faltando en el catálogo de `agent-endpoints` (está en el Éxodo).

¡Gracias!
