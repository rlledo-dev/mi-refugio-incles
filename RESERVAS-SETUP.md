# Reservas personalizadas: activación y uso

## Estado de esta revisión

- Servicio desplegado: versión 1, ejecución como propietario y acceso anónimo aprobado por el propietario.
- URL /exec configurada en index.html. API real comprobada: reserva de prueba válida, token incorrecto y GET sin token.
- La respuesta real incluye Access-Control-Allow-Origin: * y Cache-Control: no-cache, no-store.
- CODETEST conserva su token y su entrada original de enero de 2026. No se modificaron datos de Isa.
- Publicación comprobada en Chrome: bienvenida, fechas, personas y taquilla de la reserva de prueba; fotos y mapa con un marcador único. Sin token o con token incorrecto no se muestran datos privados. Vista de 390 × 844 comprobada sin desbordamiento. Safari/iPhone real pendiente de prueba directa.

## Privacidad y transporte

La guía es pública; la hoja y sus datos ROAT siguen siendo privados. El token aleatorio de 64 caracteres es la credencial del enlace. No incluir tokens, respuestas reales ni documentos en el repositorio, informes o capturas públicas.

El cliente envía el token en un POST `text/plain` con JSON, sin cookies, sin referrer y con `cache: no-store`. Esto evita preflight por cabeceras no simples y evita poner la credencial en la URL del servicio. La redirección de ContentService debe probarse en Chrome y WebKit/Safari reales después de desplegar. GET no consulta reservas; no se implementa JSONP.

La API solo devuelve nombre (columna O), entrada, salida, personas, establecimiento y taquilla. Busca por token en I y después lee únicamente las celdas necesarias. No lee documentos, direcciones ni apellidos. Códigos de reserva, parámetros de fecha enviados por el cliente y tokens duplicados no permiten acceso.

El servidor valida estado Confirmada/Confirmado y fechas entre las 00:01 de entrada y el final del minuto 23:59 de salida, zona Europe/Andorra. A medianoche del día siguiente rechaza la consulta. Las fechas inexistentes también se rechazan. Las negativas tienen el mismo cuerpo `{ok:false}`. Un token largo evita enumerar reservas; no hay endpoint para listar o buscar por código.

El cliente no guarda tokens ni respuestas en localStorage, sessionStorage o IndexedDB; borra el antiguo token persistido. La credencial sigue en el enlace privado solicitado (`?reserva=TOKEN`), por lo que ese enlace debe compartirse solo con su huésped. La política global strict-origin envía solo el origen público a los recursos externos, nunca el token ni la ruta privada; así conserva la identificación del sitio requerida por el proveedor del mapa. La consulta privada sigue usando no-referrer. Se retiran los datos al ocultar/salir de la página y se revalidan al volver. Una sesión visible se revalida cada 30 segundos, y caduca con el plazo del servidor sin confiar en el reloj del teléfono.

El service worker v9 excluye POST, recursos externos y URLs con `reserva` o `token`. Solo cachea recursos de la guía; elimina sus cachés antiguas. Una navegación con token requiere conexión.

## Activar (propietario)

1. En la hoja privada, abrir Extensiones → Apps Script y usar el proyecto vinculado existente.
2. Guardar `reservas-apps-script.gs` en `Code.gs`. No ejecutar `issueMissingTokens` para CODETEST: ya tiene token válido.
3. Nueva implementación → Aplicación web → Ejecutar como `mi.refugio.incles@gmail.com`. El acceso «Cualquier usuario» permite que los huéspedes consulten sin cuenta Google; la autorización efectiva de datos sigue siendo el token validado por el servidor. Este permiso requiere aprobación expresa antes del despliegue.
4. Autorizar los permisos de Google y copiar la URL /exec.
5. Sustituir únicamente el valor vacío de `REFUGE_RESERVATION_API` por esa URL. Probar el POST y el flujo completo antes de publicar en main.
6. Verificar CODETEST sin cambiar su entrada de enero de 2026. Verificar sin token, token inválido, cancelación y caducidad con datos ficticios. No editar Isa para estas pruebas.
7. Publicar el código y comprobar GitHub Pages, fotos, marcador único y cachés. Verificar Chrome, WebKit y un iPhone real; distinguir pruebas locales con respuesta simulada de la integración publicada.

## Uso diario para una nueva reserva Airbnb

1. Rellenar la reserva en `Reservas`: estado, entrada, salida, número de huéspedes y nombre en O.
2. Asignar taquilla en BD y establecimiento en BE (`sport-calbo-panini` actualmente).
3. Seleccionar una celda de esa reserva y abrir el menú **Mi Refugio → Enlace privado de la reserva seleccionada**. El menú aparece al recargar la hoja tras guardar el script.
4. Copiar el enlace del diálogo privado y enviarlo al huésped por Airbnb. Si I ya tiene un token válido, lo conserva; si está vacío, crea uno solo para esa fila.
5. Para revocar un enlace, usar `revokeAndReplaceToken(codigoInterno)` desde el editor como propietario. No publicar ni registrar el token en logs. Las sesiones abiertas se revalidan en un máximo aproximado de 30 segundos mientras tengan conexión.

## Otros establecimientos en el futuro

BE es `Ski Locker - establecimiento`. Sus valores son identificadores, no números de taquilla. Para añadir otro local, registrar el identificador y nombre en `CONFIG.lockerNames` del servidor y sus datos públicos (nombre, coordenadas y fotos) en `REFUGE_SKI_LOCKERS` del cliente; ampliar el desplegable de BE y desplegar/publicar las nuevas versiones. Después solo se asignan el identificador en BE y el número en BD para cada reserva. Un identificador desconocido no devuelve datos. Las filas antiguas con BE vacío conservan Sport Calbó Panini por compatibilidad.

## Pruebas automatizadas

`node --test tests/reservas.test.cjs` comprueba el servidor con hoja y reloj simulados: no modifica la hoja real. `node tests/reservas-browser.cjs` prueba la interfaz en Chromium y WebKit con respuestas ficticias y viewport de escritorio/iPhone. Estas pruebas no sustituyen la prueba CORS del despliegue real.

## Comprobaciones ejecutadas el 15-11-2026

- 11 pruebas de servidor y cliente: aprobadas (`node --test tests/reservas.test.cjs tests/reservas-client.test.cjs`).
- Sintaxis de JavaScript y service worker: correcta.
- Comparación con main: otras secciones sin cambios y coordenadas/marcador único conservados.
- Hoja privada: estructura real comprobada; añadido BE y asignado el establecimiento solo a CODETEST; token existente conservado.
- Editor Apps Script: código guardado y versión 1 desplegada después de la aprobación expresa del propietario y de la autorización de Google.
- La batería de navegador está preparada, pero no se ha podido ejecutar: descarga de WebKit interrumpida y Chromium local bloqueado por el entorno. No se afirma validación móvil, Safari ni CORS real.
- GitHub Pages publicado y comprobado visualmente. El mapa carga después de conservar strict-origin (sin revelar el token). Service worker v9 publicado. La comprobación directa de Safari/iPhone real sigue pendiente.
