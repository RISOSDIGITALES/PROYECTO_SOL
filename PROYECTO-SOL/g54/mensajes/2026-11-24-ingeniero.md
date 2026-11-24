# Mensaje del 24-nov

## Para el ingeniero

Buenas tardes, Don Walter. Le paso los tres pendientes que hoy dependen de usted, para ver si les podemos poner fecha:

1. **Cotizador versión S a producción.** Está completo en la rama `DESARROLLO_SOL`. Para subirlo: respaldar la base y correr `php artisan migrate --force` (7 migraciones; todas solo agregan o corrigen datos). Hoy en producción `/ayuda`, `/crm` y `/branding/logo` todavía dan 404. Cuando esté arriba, lo pruebo entero con la lista de pruebas.
2. **Mónica v15 en su n8n.** El paquete está en `docs/monica-v15/` de `DESARROLLO_SOL`, con `LEEME.md`. Hoy le sumé que los audios se transcriban con OpenAI (la misma credencial de OpenAI de Mónica) y Groq de respaldo. Antes de encender la v15, apagar la v14 para que no contesten las dos.
3. **Clave `rrss_reel` en el catálogo de `agent-endpoints`** (`AgentEndpoint::CATALOG`), apuntando al webhook `reel-subido-g54`. Sin esa clave, G54 responde 422 al registrarla y los Reels quedan sin texto.

¿Qué fecha le parece para cada uno? Con el 1 y el 2 Crating Express ya empezaría a atender correos reales con Mónica.

¡Gracias!
