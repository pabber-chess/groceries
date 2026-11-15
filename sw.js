// Keeps the app opening even with poor signal in the shop.
// Always tries the newest version first; falls back to the saved copy after 2.5 s.
const CACHE = 'groceries-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; });
    const cached = await cache.match(e.request, { ignoreSearch: true });
    if (!cached) return net.catch(() => cache.match('./index.html'));
    return Promise.race([net.catch(() => cached), new Promise(res => setTimeout(() => res(cached), 2500))]);
  })());
});
