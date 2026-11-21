import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const assistantPagePath = fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url));
const assistantPage = readFileSync(assistantPagePath, 'utf8');

test('My stuff library separates documents from media and supports searching', () => {
  assert.match(assistantPage, /<h1[^>]*>Library<\/h1>/);
  assert.match(assistantPage, />Documents</);
  assert.match(assistantPage, />Media</);
  assert.match(assistantPage, /Search your library/);
  assert.match(assistantPage, /No documents yet/);
});

test('library media previews use private signed storage URLs', () => {
  assert.match(assistantPage, /createSignedUrl\(item\.storage_path/);
  assert.match(assistantPage, /item\.url/);
});

test('library supports adding and removing saved content', () => {
  assert.match(assistantPage, /Upload files/);
  assert.match(assistantPage, /handleDelete/);
});
