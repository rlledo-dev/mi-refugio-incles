# Activación de reservas personalizadas (pendiente de despliegue)

La web GitHub Pages es pública. **Nunca** subir aquí la hoja de reservas, datos ROAT ni el número de taquilla.

## Estado
- `index.html`: ficha Ski Locker de Sport Calbó Panini, fotografías, mapa y bienvenida personalizada implementados.
- `reservas-apps-script.gs`: código del servicio de consulta privada preparado, **no desplegado**.
- `REFUGE_RESERVATION_API` en `index.html`: vacío hasta desplegar Apps Script. Mientras esté vacío, NO se mostrarán datos privados.

## Pasos pendientes
1. Desde la cuenta `mi.refugio.incles@gmail.com`, abrir la hoja privada `Mi Refugio en Incles - Reservas privadas` (ID `1L1pTnkNUy0tmycRaY9yj3FeoMSrRmaxDr2CSvzC-TD0`).
2. Menú Extensiones > Apps Script. Pegar el contenido de `reservas-apps-script.gs` en `Código.gs`, guardar.
3. Ejecutar `issueMissingTokens` una vez y autorizar los permisos. Rellena columna I con tokens secretos de 64 caracteres para reservas existentes, incluida CODETEST. No compartir tokens salvo con el huésped correspondiente.
4. Implementar > Nueva implementación > Aplicación web > Ejecutar como yo > Quién tiene acceso: Cualquier usuario. Copiar URL `https://script.google.com/macros/s/.../exec`.
5. En `index.html`, sustituir `const REFUGE_RESERVATION_API='';` por la URL de la implementación. Publicar en GitHub.
6. Probar `?reserva=TOKEN_CODETEST` con la reserva CODETEST. Comprobar que se muestra la taquilla 158 solo dentro de fechas; cancelar o salir del periodo debe ocultarla. Probar sin token, token incorrecto, y con fecha fuera del periodo.
7. Antes de producción, comprobar compatibilidad CORS de la respuesta de Apps Script en Safari/Chrome. Si falla, usar un proxy seguro en el mismo origen, nunca publicar el Sheet.

**Nota:** La API solo devuelve nombre de pila, fechas, número de personas, establecimiento y taquilla. No devuelve DNI, apellidos ni otros datos ROAT. El enlace es una credencial de acceso y se debe tratar como secreto. Revocar cambiando el token en la columna I.

**Ubicación:** El mapa utiliza las coordenadas ya existentes del enlace antiguo de Ski Locker, pendientes de validar con la ubicación exacta de Sport Calbó Panini.
