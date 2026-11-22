# Sincronización automática con Google Apps Script

**Estado: preparada, NO activada.** El repositorio `rlledo-dev/mi-refugio-incles` es público y **no debe contener** el código privado de reservas, tokens o gestión.

## Arquitectura

- Frontend: GitHub Pages. Se publica desde GitHub, sin copiarlo a Apps Script.
- Backend: proyecto Apps Script existente `1P8qPx4KUt9xOTohepH-RGAHcI46Ct58MuCVTzdP_0blf3uPsw1-TKeK2`.
- Backend privado: alojarlo en un **repositorio privado** y copiar allí `.clasp.json`, este workflow y el código obtenido de un respaldo completo de Apps Script. No activar este workflow desde el repositorio público.

## Activación segura en el repositorio privado

1. Crear repositorio privado de backend, respaldar primero Apps Script y comprobar los archivos `.gs`, `.html` y `appsscript.json` antes de hacer el primer push.
2. Autorizar clasp con la cuenta propietaria. Guardar el contenido de `.clasprc.json` como secreto de Actions `CLASP_CREDENTIALS`, exclusivamente desde GitHub Settings → Secrets and variables → Actions. Nunca introducirlo en el chat ni en commits.
3. Crear environment `apps-script-production` con protección/aprobación y variable de repositorio `APPS_SCRIPT_SYNC_ENABLED=true`.
4. Ejecutar manualmente el workflow para validar la primera sincronización. El job bloquea el push si faltan archivos presentes en el proyecto remoto.
5. Tras validar, cambiar la condición del job `sync` para admitir `push` a la rama principal del repositorio privado. En este estado el push está **deliberadamente limitado a ejecución manual**.
6. La publicación de una implementación web **no se automatiza aquí**: `clasp push` solo actualiza código del proyecto. Antes de automatizar versiones, recuperar el deployment ID existente y comprobar que se mantiene la URL actual.

No guardar tokens de OAuth, contraseñas, documentos de huéspedes ni reservas en el repositorio público.
