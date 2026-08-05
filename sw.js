/* Service worker — permite que la app abra sin internet.
   Sube el número de VERSION cada vez que cambies index.html / app.js
   para que los teléfonos descarguen la versión nueva. */

const VERSION = 'vb-v5';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './config.js',
  './logo.png',
  './logo-claro.png',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Solo cacheamos los archivos propios de la app; lo de Supabase pasa directo.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // config.js va "primero la red": así, si cambias las llaves de Supabase,
  // los teléfonos toman la versión nueva sin tener que reinstalar la app.
  if (new URL(req.url).pathname.endsWith('/config.js')){
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok){
          const copia = res.clone();
          caches.open(VERSION).then(c => c.put(req, copia));
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cacheada => {
      const red = fetch(req).then(res => {
        if (res && res.ok){
          const copia = res.clone();
          caches.open(VERSION).then(c => c.put(req, copia));
        }
        return res;
      }).catch(() => cacheada);
      return cacheada || red;
    })
  );
});
