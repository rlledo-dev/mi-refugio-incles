# Integración privada de eSIM Airalo

El proyecto existente utiliza `Code.gs` (copia en `reservas-apps-script.gs`) y `RefugePrivateExtras.gs`. No crear un segundo endpoint.

## Flujo publicado

`doPost` → `lookupGuest_` valida el token, coincidencia única, estado confirmado y fechas Europe/Andorra → construye `guest` → `refugeAddPrivateExtras_(sheet,row,guest)` → JSON privado.

El número de fila lo resuelve el servidor a partir del token. Los parámetros adicionales del cliente no seleccionan otra reserva. La eSIM solo se lee de esa fila, por nombres de encabezado; no se lee la fila completa ni documentos ROAT. GET y tokens denegados no entregan datos. No se guardan respuestas privadas en almacenamiento ni en la caché PWA.

## Cómo preparar una entrega

En la fila correcta de `Reservas`, rellenar estas columnas como texto (especialmente el ICCID):

| Columna | Campo | Contenido |
| --- | --- | --- |
| BG | eSIM - Estado | `Asignada` cuando se han comprobado los datos reales |
| BH | eSIM - Proveedor | `Airalo` |
| BI | eSIM - Datos | Por ejemplo, `1 GB` |
| BJ | eSIM - Duración | Por ejemplo, `7 días` |
| BK | eSIM - Enlace instalación | Enlace HTTPS oficial bajo airalo.com o airalo.io, si se dispone de él |
| BM | eSIM - ICCID | ICCID completo, como texto; opcional, de 18 a 22 dígitos |
| BN | eSIM - SM-DP+ | Dominio exacto, sin `https://` ni el prefijo `LPA:1$` |
| BO | eSIM - Código activación | Código exacto, sin el resto de la cadena LPA |

Se puede entregar mediante enlace oficial o mediante SM-DP+ + código de activación; ambos permiten ofrecer las dos opciones. Para QR e instalación manual hay que rellenar BN y BO. El QR se genera localmente con `LPA:1$<SM-DP+>$<código>`, sin servicios externos. La columna BP no se utiliza para cargar imágenes remotas de QR. BL y BQ son informativas y no se envían.

Estados admitidos: `Asignada`, `Asignado`, `Lista para entrega`, `Entregada` o `Activa`. Los estados restantes, datos incompletos o inválidos muestran «Tu eSIM de cortesía está pendiente de asignación». Dejar `Pendiente` mientras se prepara o revisa una entrega. La compra adicional sigue enlazando a Airalo.

CODETEST nunca entrega una eSIM. No modificar sus fechas ni sus tokens. Las marcas DEMO, ficticia, prueba o simulación se bloquean también en otros campos. La vista `?demoEsim=1` continúa siendo ficticia, con botón deshabilitado y sin QR activable.

La validación comprueba formato y asignación por el propietario; no consulta a Airalo si la eSIM se ha comprado, ya se ha instalado o sigue vigente. Hay que copiar los datos auténticos de Airalo y verificar que pertenecen a la reserva adecuada. No se compra ni activa nada automáticamente.

## WiFi

La WiFi principal permanece en `bookingWifi_`. La red de respaldo permanece en `bookingBackupWifi_`, leyendo las propiedades privadas `WIFI_BACKUP_SSID`, `WIFI_BACKUP_USERNAME` y `WIFI_BACKUP_PASSWORD`. El módulo de eSIM no consulta ni reemplaza la pestaña Configuración WiFi ni duplica estas funciones.

## Copia y despliegue

`backups/Code-v5-before-airalo.gs` conserva el código original cotejado con el editor antes de modificarlo. No contiene contraseñas ni códigos eSIM. Para revertir, restaurar esa versión del código y publicar una nueva versión de la misma implementación existente, conservando su URL `/exec`.

Comprobaciones: `node --test tests/*.test.cjs`. Las credenciales usadas por los tests son sintéticas y nunca se asignan a reservas reales. Las pruebas de servidor verifican aislamiento entre dos reservas, denegaciones, fechas, CODETEST y formato de instalación. Las pruebas de cliente verifican QR, campos manuales, enlace, pendiente, demo y retirada de datos al denegar acceso.

## Verificación del 18 de noviembre de 2026

- Publicada la versión 6 de la implementación existente, con la misma URL `/exec` y los mismos permisos.
- Llamadas reales al servicio: CODETEST autorizado, sin eSIM entregable; token inexistente y ausencia de token denegados; un `rowNumber` enviado por el cliente no cambia la reserva resuelta.
- Web publicada: bienvenida, llegada, aparcamiento, WiFi principal y QR, respaldo y ski locker comprobados con CODETEST. Fechas y tokens cotejados con la hoja antes y después; sin cambios.
- 26 pruebas automáticas pasan, incluidas dos reservas sintéticas aisladas, datos manuales, generación de QR y retirada de credenciales al revocar/caducar.
- No se ha comprado, asignado ni activado una eSIM real. La aceptación de una primera eSIM auténtica por el teléfono queda pendiente de disponer de ella. Los tests con credenciales sintéticas se ejecutan fuera de la hoja real.
- En la revisión inicial solo CODETEST tenía un token; las filas reales no se modifican. Para entregar servicios a un huésped será necesario su enlace privado, mediante el flujo existente del propietario.
