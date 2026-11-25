# Traducciones de Mi Refugio en Incles
Idiomas: es (origen), en, fr, ca. Una sola PWA.
Usar claves estables y RefugeI18n.t para textos estáticos y dinámicos; data-i18n únicamente en elementos de texto sin hijos funcionales. No traducir mediante sustitución global del DOM.
Prioridad: selección explícita en URL, preferencia local, idioma de reserva cuando se integre, idiomas del navegador, español. Mantener tokens y otros parámetros.
No traducir nombres, direcciones, códigos, contraseñas, identificadores ni URLs. No enviar datos privados a servicios de traducción. Traducir ofertas al prepararlas, conservar importes y condiciones.
Cada cambio debe incluir las cuatro traducciones, etiquetas accesibles, mensajes de error y plantillas correspondientes. Usar Intl para fechas, números y plurales. Revisar contenido externo por separado.
Antes de publicar: comprobar paridad de claves, navegación, reserva privada, acceso, Wi-Fi, extras, WhatsApp, modo TV, móvil y caché offline. No publicar traducción parcial como completa.
Estado 1.3.0: motor híbrido completado para español, inglés, francés y catalán. Los módulos por dominio cubren portada, llegada, apartamento, estancia, huésped y eSIM; `i18n-content.js` cubre vistas dinámicas y contenido heredado generado por JavaScript (transporte, restaurantes, cámaras, meteorología, actividades, servicios, pistas, recetas, extras, errores, confirmaciones y accesibilidad).

La preferencia sigue este orden: `lang` en la URL, `localStorage`, idiomas del navegador y español. El selector actualiza la URL sin eliminar tokens ni otros parámetros, persiste la elección y vuelve a localizar el contenido ya montado. Las páginas secundarias aceptan el mismo parámetro `lang`; los iframes oficiales reciben el idioma cuando el proveedor lo admite.

El service worker `mi-refugio-v69` precarga todos los módulos i18n y las páginas secundarias. Las consultas privadas, POST, tokens y respuestas personalizadas continúan fuera de caché. Versión publicada prevista: 1.3.0.

Pruebas obligatorias: paridad de diccionarios, sintaxis JavaScript, reserva privada, Wi-Fi, eSIM, extras y WhatsApp, selector y persistencia, navegación, móvil/escritorio, páginas secundarias y recarga offline. La publicación solo puede hacerse con todas las comprobaciones aprobadas.
