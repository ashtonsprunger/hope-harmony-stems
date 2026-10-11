const CACHE_NAME = 'hope-harmony-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic pass-through fetch with cache fallback if offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
