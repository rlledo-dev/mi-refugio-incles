# Acceso privado a reservas: prototipo, no desplegado

Rama de desarrollo: `feature/acceso-privado-reservas`. No afecta a la web pública.

## Fuente privada
Google Sheet **Mi Refugio en Incles - Reservas privadas**, propiedad de `mi.refugio.incles@gmail.com`, pestaña `Reservas`. No cambiar permisos a público. La reserva de Isa está en la fila 2.

## Qué está implementado
- Generación manual de token aleatorio de 256 bits aprox. mediante dos UUID, con almacenamiento solo de SHA-256 en la columna I.
- Validación de token en un servicio Apps Script y visualización limitada a nombre y fechas de entrada/salida.
- Revocación manual: borrar el hash de la columna I.
- Rechazo de tokens inválidos y reservas canceladas.
- No se publica la hoja, ni se exponen DNI, fechas de nacimiento, direcciones o importes.

## Pendiente antes de la primera prueba real
1. Crear un proyecto Apps Script **vinculado a la hoja** con la cuenta Mi Refugio; copiar `Code.gs`.
2. Revisar y autorizar los permisos, desplegar la web app ejecutándose como propietario con acceso a quien tenga el enlace. **El enlace es una credencial**; no garantiza identidad.
3. Seleccionar la fila 2 y ejecutar `Mi Refugio > Crear enlace de prueba`. Guardar el enlace solo para la prueba con Ramón.
4. Probar acceso válido, inválido y revocación. Evitar servicios de analítica y compartir enlaces con terceros.
5. Antes de recopilar ROAT, implementar consentimiento, protección contra abuso, retención y borrado, tratamiento de datos y controles de acceso apropiados. No pedir documentos en esta versión.

**Importante:** no se ha creado todavía ningún enlace, ni se ha desplegado Apps Script ni se ha enviado correo. No introducir tokens en el repositorio.
