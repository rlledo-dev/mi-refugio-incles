# Conexión con Google Apps Script

Proyecto existente: `Mi Refugio Panel de Gestión`.
Cuenta Google propietaria: `mi.refugio.incles@gmail.com`.
ID del script configurado en `.clasp.json`.

## Estado

La configuración del identificador está preparada en la rama `config/apps-script-sync`. **No se ha autorizado Google ni se ha publicado código.**

## Seguridad y siguiente paso

1. Autorizar `clasp` con la cuenta propietaria de Google mediante OAuth. No introducir ni compartir contraseñas o tokens en archivos del repositorio, chats ni commits.
2. Antes de cualquier `clasp push`, descargar y respaldar el código actual del proyecto Apps Script, incluidas las implementaciones y el manifiesto. Verificar que los archivos del proyecto son los esperados.
3. Mantener el código privado del panel y las reservas fuera del repositorio público. Para sincronizar el backend, usar un repositorio **privado** o un mecanismo que no publique los archivos privados en GitHub Pages.
4. Configurar el secreto de autenticación en GitHub desde la interfaz segura y revisar el workflow antes de habilitar despliegues. No usar `clasp push --force` sin comparar previamente el contenido remoto.
5. Las implementaciones web de Apps Script necesitan su propio proceso de despliegue/versionado; subir el código no garantiza actualizar la URL pública.

**No fusionar ni desplegar automáticamente esta rama** hasta completar la autorización y la copia de seguridad.
