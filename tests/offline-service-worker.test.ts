import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const assistant = readFileSync(fileURLToPath(new URL('src/pages/AssistantPage.tsx', root)), 'utf8');
const main = readFileSync(fileURLToPath(new URL('src/main.tsx', root)), 'utf8');
const worker = readFileSync(fileURLToPath(new URL('public/sw.js', root)), 'utf8');
const offline = readFileSync(fileURLToPath(new URL('public/offline.html', root)), 'utf8');

test('Library file-details icons are imported and defined', () => {
  const iconImport = assistant.slice(0, assistant.indexOf("from 'lucide-react'"));
  assert.match(iconImport, /\bInfo\b/);
  assert.ok(assistant.includes('<Info size={15}'));
  assert.ok(assistant.includes('<Info size={14}'));
});

test('generated chat image messages persist the actual private storage path', () => {
  assert.ok(assistant.includes("const storagePath = user.id + '/' + crypto.randomUUID() + '-chat-image.'"));
  assert.ok(assistant.includes("zenix-storage://' + storagePath"));
  assert.ok(assistant.includes("zenix-download://' + storagePath"));
  assert.ok(!assistant.includes('uploadedPath'));
});

test('offline fallback page exists and service worker is registered only in production', () => {
  assert.ok(offline.includes("<h1>You're offline</h1>"));
  assert.ok(main.includes('import.meta.env.PROD'));
  assert.ok(main.includes("navigator.serviceWorker.register('/sw.js')"));
});

test('offline service worker caches only the public fallback and never intercepts API requests', () => {
  assert.ok(worker.includes('cache.add(new Request(OFFLINE_URL'));
  assert.ok(worker.includes("request.mode !== 'navigate'"));
  assert.ok(worker.includes("url.pathname.startsWith('/api/')"));
  assert.ok(!worker.includes('caches.open(request'));
  assert.ok(worker.includes('cache.match(OFFLINE_URL)'));
});


test('Library uses the available workspace viewport instead of forcing a full-screen minimum height', () => {
  const libraryStart = assistant.indexOf('function LibraryView()');
  const libraryEnd = assistant.indexOf('\nfunction AutomationsView()', libraryStart);
  assert.ok(libraryStart >= 0 && libraryEnd > libraryStart, 'LibraryView should be a distinct component');
  const libraryView = assistant.slice(libraryStart, libraryEnd);
  assert.match(libraryView, /className="h-full min-h-0 w-full flex-1 overflow-y-auto/);
  assert.doesNotMatch(libraryView, /min-h-screen/);
});


test('accuracy reminder is shown only under the newest completed assistant response', () => {
  assert.match(assistant, /showAccuracyNotice\?: boolean/);
  assert.match(assistant, /\{showAccuracyNotice && !message\.isStreaming && message\.content\.trim\(\) && \(/);
  assert.match(assistant, /const latestAssistantIndex = messages\.reduce/);
  assert.match(assistant, /showAccuracyNotice=\{idx === latestAssistantIndex && !m\.isStreaming\}/);
});

test('service worker handles periodic sync, background sync, and push notifications', () => {
  assert.match(worker, /addEventListener\('periodicsync'/);
  assert.match(worker, /zenixmind-periodic-refresh/);
  assert.match(worker, /addEventListener\('sync'/);
  assert.match(worker, /zenixmind-background-sync/);
  assert.match(worker, /addEventListener\('push'/);
  assert.match(worker, /showNotification/);
  assert.match(worker, /notificationclick/);
});

test('Settings exposes all three progressive web app capabilities without claiming push delivery is configured', () => {
  assert.match(assistant, /title: 'Periodic Sync'/);
  assert.match(assistant, /title: 'Background Sync'/);
  assert.match(assistant, /title: 'Push Notifications'/);
  assert.match(assistant, /Remote push delivery also requires server-side VAPID keys and a subscription sender/);
});
