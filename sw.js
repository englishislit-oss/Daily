const CACHE_NAME = 'dailies-cache-v1';
const APP_SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin app files: cache-first (opens instantly, works offline).
// Fonts / Chart.js from CDNs: network-first, fall back to cache when offline.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  if (sameOrigin) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
  } else {
    event.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); return res; })
                .catch(() => caches.match(req))
    );
  }
});
