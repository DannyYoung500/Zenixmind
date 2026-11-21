import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const assistantPage = readFileSync(fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url)), 'utf8');
const migration = readFileSync(fileURLToPath(new URL('../supabase/migrations/20261121160000_library_productivity_features.sql', import.meta.url)), 'utf8');

test('Library has document and media sections with private storage previews', () => {
  assert.match(assistantPage, /<h1[^>]*>Library<\/h1>/);
  assert.match(assistantPage, />Documents</);
  assert.match(assistantPage, />Media</);
  assert.match(assistantPage, /Search your library/);
  assert.match(assistantPage, /createSignedUrl\(item\.storage_path/);
});

test('Library supports favorites, soft deletion, restore and permanent deletion', () => {
  assert.match(assistantPage, /is_favorite/);
  assert.match(assistantPage, /deleted_at/);
  assert.match(assistantPage, /handleRestore/);
  assert.match(assistantPage, /handlePermanentDelete/);
  assert.match(assistantPage, /Recently deleted/);
});

test('Library supports document preview, file details, storage usage and expiring share links', () => {
  assert.match(assistantPage, /role="dialog"/);
  assert.match(assistantPage, /File details/);
  assert.match(assistantPage, /Storage used/);
  assert.match(assistantPage, /60 \* 60 \* 24 \* 7/);
});

test('generated images are stored in the signed-in user private Library', () => {
  assert.match(assistantPage, /Persist the actual generated asset/);
  assert.match(assistantPage, /source: 'generated'/);
  assert.match(assistantPage, /storagePath/);
});

test('database migration adds owner-scoped favorite and trash metadata', () => {
  assert.match(migration, /add column if not exists is_favorite/);
  assert.match(migration, /add column if not exists deleted_at/);
  assert.match(migration, /library_items_update_own/);
  assert.match(migration, /set public = false/);
});
