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


// Periodic Sync is best-effort and is available only in supporting browsers.
self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'zenixmind-periodic-refresh') return;
  event.waitUntil(
    fetch('/api/health', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Health check failed');
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'ZENIXMIND_PERIODIC_SYNC_COMPLETE' })))
  );
});

// Background Sync performs a small public connectivity check; private chat data is never queued or cached.
self.addEventListener('sync', (event) => {
  if (event.tag !== 'zenixmind-background-sync') return;
  event.waitUntil(
    fetch('/api/health', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Background health check failed');
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'ZENIXMIND_BACKGROUND_SYNC_COMPLETE' })))
  );
});

// Push payloads are treated as untrusted display text; links are restricted to same-origin paths.
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {
    payload = { body: event.data ? event.data.text() : 'You have a new ZenixMind notification.' };
  }
  const title = typeof payload.title === 'string' ? payload.title.slice(0, 80) : 'ZenixMind';
  const body = typeof payload.body === 'string' ? payload.body.slice(0, 240) : 'You have a new notification.';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { path: typeof payload.path === 'string' && payload.path.startsWith('/') && !payload.path.startsWith('//') ? payload.path : '/' }
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = event.notification.data && typeof event.notification.data.path === 'string'
    ? event.notification.data.path : '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      if ('navigate' in existing) existing.navigate(path);
      return existing.focus();
    }
    return self.clients.openWindow(path);
  }));
});
