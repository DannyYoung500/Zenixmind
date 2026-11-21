// ZenixMind offline navigation fallback.
// Only the public offline document is cached; authenticated app/API data is never cached.
const CACHE_NAME = 'zenixmind-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith('zenixmind-offline-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || request.mode !== 'navigate' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open(CACHE_NAME);
      const fallback = await cache.match(OFFLINE_URL);
      return fallback || new Response('ZenixMind is offline. Please reconnect and try again.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
