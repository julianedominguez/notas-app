const CACHE = 'notas-app-v1.9.2';
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
  // La app (página, app.js, app.css, config.js) se pide primero a la red, así se ve la última versión al abrir.
  // Si no hay conexión o tarda más de 3 segundos, se usa la copia guardada.
  const url = new URL(req.url);
  const shell = req.mode === 'navigate' || /\/(app\.js|app\.css|config\.js|index\.html)$/.test(url.pathname);
  const key = req.mode === 'navigate' ? './index.html' : req;
  const fresh = () => fetch(req.mode === 'navigate' ? new Request('./index.html', { cache: 'no-cache' }) : new Request(req.url, { cache: 'no-cache' }));
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(key, { ignoreSearch: true });
    const net = fresh().then(res => { if (res.ok) cache.put(key, res.clone()); return res; }).catch(() => null);
    if (shell) {
      const timeout = new Promise(r => setTimeout(() => r(null), 3000));
      const res = await Promise.race([net, timeout]);
      if (res && res.ok) return res;
      return cached || (await net) || new Response('Sin conexión', { status: 503 });
    }
    return cached || (await net) || new Response('Sin conexión', { status: 503 });
  }));
});
