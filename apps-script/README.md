# Integración privada de WiFi de respaldo y eSIM (pendiente de desplegar)

Este directorio incluye un **módulo de integración para Google Apps Script**, no un servicio publicado.

## Cómo integrarlo sin romper reservas actuales

1. Abrir el Apps Script ya asociado a «Mi Refugio en Incles - Reservas privadas».
2. Revisar el código existente para identificar dónde se valida el token de 64 caracteres, se comprueba la reserva y se construye el objeto `guest`. No alterar las reglas actuales.
3. Añadir el contenido de `RefugePrivateExtras.gs` como archivo nuevo dentro del mismo proyecto Apps Script.
4. **Después** de completar todas las validaciones y **antes** de serializar la respuesta, ejecutar:
   `refugeAddPrivateExtras_(SpreadsheetApp.getActiveSpreadsheet(), numeroFilaReserva, guest);`
   Usar el número de fila real de esa reserva; no adivinarlo ni confiar en un índice enviado por el cliente.
5. Probar con reserva sin eSIM (debe seguir funcionando), con `CODETEST` (no debe entregar credenciales ficticias), y con una eSIM real asignada solo cuando exista.
6. Publicar **una nueva versión de la implementación existente** del Apps Script y conservar su URL `/exec`. No crear una implementación nueva.

## Datos esperados

- Pestaña `Configuración WiFi`: claves `wifiBackup.ssid`, `wifiBackup.username`, `wifiBackup.password`.
- Pestaña `Reservas`: columnas `eSIM - Estado`, `eSIM - Proveedor`, `eSIM - Datos`, `eSIM - Duración`, `eSIM - Enlace instalación`, `eSIM - ICCID`, `eSIM - SM-DP+`, `eSIM - Código activación`.
- El objeto privado `guest.wifiBackup` aparece bajo desplegable en `Mi estancia → Wi-Fi`.
- El objeto privado `guest.esim` aparece en `Mi estancia → eSIM`.

**Seguridad:** No incluir contraseñas reales ni códigos de activación en archivos GitHub. Este módulo solo contiene código. La protección de credenciales depende de la autorización en Apps Script: un desplegable de la web no es un control de seguridad.

## Estado

Frontend y Google Sheet preparados. **La integración con el Apps Script existente y su despliegue no están hechos**, porque desde este chat no hay acceso de escritura a ese proyecto.
