const CACHE='mi-refugio-v92';
const CORE=['./','./index.html','./manifest.webmanifest','./icon.svg','./wifi-qr.js','./i18n.js?v=2','./i18n-core.js','./i18n-apartment.js','./i18n-stay.js','./i18n-arrival.js','./i18n-guest.js','./i18n-esim.js','./i18n-content.js?v=17','./restaurantes.geojson?v=4','./servicios.json?v=29','./estado-pistas.html','./camaras.html','./hero.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mi-refugio-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()
])));
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 // Ningún POST, consulta privada o recurso externo pasa por la caché de la PWA.
 if(e.request.method!=='GET'||url.origin!==self.location.origin)return;
 // Nunca cachear respuestas personalizadas ni URLs con credenciales.
 if(e.request.mode!=='navigate'&&(url.searchParams.has('reserva')||url.searchParams.has('token')))return;
 if(e.request.mode==='navigate'){
  // Cachear solo la guía sin parámetros; nunca una navegación con credencial.
  e.respondWith(fetch(e.request).then(r=>r.ok?r:Promise.reject(Error('offline'))).catch(()=>caches.match('./index.html')));return;
 }
 e.respondWith(fetch(e.request).then(r=>{if(r.ok&&r.type!=='opaque'&&!/no-store|private/i.test(r.headers.get('Cache-Control')||'')){
  const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));
 }return r}).catch(()=>caches.match(e.request).then(r=>r||Response.error())));
});

