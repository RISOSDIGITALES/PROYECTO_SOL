# Cotizador versión S — lista de pruebas (23-nov-2026)

**Para tachar en línea:** https://claude.ai/artifact/5aPSrmtT4NeV7iuHXFZjLg

**Dónde:** http://127.0.0.1:8031/login (Laragon con MySQL encendido). Usuarios y contraseñas en `C:\SOLANGE RESPALDOS\cotizcratingexpress-wx-S\ACCESO-LOCAL.txt`: **admin** y **vendedor** (este último para probar permisos).

**Inspección previa (hecha):** el código de la versión S es idéntico al de `DESARROLLO_SOL`; 30 pruebas automáticas pasan (la que falla, `ExampleTest`, ya fallaba antes y no es nuestra); no quedan restos de depuración ni claves; las 5 migraciones solo agregan tablas y columnas (no borran ni cambian datos existentes).

Marcar cada una con ✅ o anotar qué pasó.

## 1. Dashboard y ayuda (como admin)
- [ ] 1. En el Dashboard, tocar el «?» de cada indicador: abre un globo con la explicación y se cierra al tocar afuera.
- [ ] 2. Lo mismo en el celular (o con la ventana angosta).
- [ ] 3. Menú «Ayuda»: abre la guía; cada sección tiene sentido para alguien nuevo.
- [ ] 4. Tutor (botón flotante): los atajos llevan a donde dicen («Ayuda de esta pantalla» abre la sección de la pantalla en la que estás).

## 2. Logo
- [ ] 5. En Configuración, subir un logo: se ve en el menú y en el cotizador abierto (sin sesión).
- [ ] 6. Cerrar sesión y volver a entrar: el logo sigue (ahora vive en la base, no en un archivo).

## 3. Clientes
- [ ] 7. Lista: aparece la columna «ID empresa» (#id) después del nombre.
- [ ] 8. Marcar y desmarcar un cliente como preferido (★) y filtrar por preferidos.
- [ ] 9. Crear un cliente con proveedor «Manual», «Google» o «App online» y verlo en la lista.
- [ ] 10. Ficha del cliente: se ven sus datos, sus tratos y el historial; dejar un comentario y verlo en el historial.
- [ ] 11. Exportar CSV y abrirlo en Excel: acentos y columnas bien.
- [ ] 12. Importar ese mismo CSV con «saltar si existe»: no crea duplicados (todo «saltado»).
- [ ] 13. Cambiar un dato en el CSV, importarlo con «actualizar»: cambia solo ese dato; una celda vacía no borra lo que había.
- [ ] 14. Importar un CSV con un nombre repetido y un correo mal escrito: avisa fila por fila y no se cae.

## 4. CRM (como admin)
- [ ] 15. Embudo: crear un trato nuevo, arrastrarlo a otra etapa y recargar: queda donde lo dejaste.
- [ ] 16. Ficha del trato: editar monto o etapa; el historial muestra quién, cuándo y antes → después.
- [ ] 17. Dejar un comentario a mano en el trato y verlo en el historial.
- [ ] 18. Agregar una actividad con fecha de hoy: aparece el número rojo junto a «CRM» en el menú y en «Mis tareas»; al completarla, desaparece.
- [ ] 19. Etapas: crear una, renombrarla, cambiarle el orden.
- [ ] 20. Borrar una etapa que tiene tratos: pide a qué etapa pasarlos y los mueve (el trato lo anota en su historial).
- [ ] 21. Intentar borrar la única etapa de «ganado» o «perdido»: no lo deja y explica por qué.
- [ ] 22. Reportes: los números cuadran con los tratos que hay (ganados, perdidos, monto por etapa).
- [ ] 23. Borrar un trato de prueba: sale del embudo.

## 5. Permisos (entrar como vendedor)
- [ ] 24. El vendedor no ve «Etapas» ni puede entrar escribiendo `/crm/etapas` (debe dar error de permiso).
- [ ] 25. El vendedor no puede abrir ni editar un trato a cargo de otro vendedor; sí los suyos y los sin asignar.
- [ ] 26. El vendedor no puede borrar una actividad que registró el admin.
- [ ] 27. El vendedor puede importar CSV con «actualizar» (decidido por la usuaria el 23-nov: queda así). Probar que funcione con su usuario.

## 6. Lo de siempre (que no se haya roto)
- [ ] 28. Cotización interna: cotizar una caja y ver que dé el mismo precio que antes (mismo tipo y medidas).
- [ ] 29. Cotizador abierto (sin sesión): cotiza y se ve bien en el celular.

## Después de probar
Si todo sale bien: avisarle al ingeniero que lo pase a producción (respaldar la base y correr `php artisan migrate --force`; son 6 migraciones).
