const CACHE = 'notas-app-v2.7.1';
// Las tipografías van en un caché aparte que no se borra al actualizar: se bajan una vez, cuando se eligen.
const FONTS = 'notas-app-fonts-v1';
const ASSETS = ['./', './index.html', './app.css', './app.js', './config.js', './vendor/editor.js', './vendor/mammoth.browser.min.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' saltea el caché HTTP del navegador (GitHub Pages lo guarda 10 minutos):
  // sin esto, una versión nueva podía guardar los archivos de la anterior.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname.includes('/fonts/')) {
    e.respondWith(caches.open(FONTS).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    }));
    return;
  }
  // Primero la copia guardada: la app abre al instante, también sin conexión.
  // Cada versión nueva trae su propio service worker, que descarga todos los archivos juntos al instalarse;
  // la app se recarga sola si la versión nueva llega mientras está en la pantalla de contraseña.
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(key, { ignoreSearch: true });
    if (cached) return cached;
    const res = await fetch(req).catch(() => null);
    if (res && res.ok) cache.put(key, res.clone());
    return res || new Response('Sin conexión', { status: 503 });
  }));
});
