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
  assert.ok(assistant.slice(0, assistant.indexOf("from 'lucide-react'")).includes('Info,'));
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
