// Noche de Leyendas: guarda el juego en el celular para jugar sin internet.
// Con internet siempre baja la versión nueva; sin internet usa la guardada.
const CACHE = 'ndl-v18';   // v18: Japón completo (castillo, sellos, medallas de Japón)
const FILES = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(isPage ? '/' : req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(isPage ? '/' : req, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
