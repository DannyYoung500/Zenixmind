import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const assistantPage = readFileSync(fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url)), 'utf8');

test('settings opens as a full-screen responsive experience with grouped navigation', () => {
  assert.match(assistantPage, /My ZenixMind/);
  assert.match(assistantPage, /Appearance/);
  assert.match(assistantPage, /Preferences/);
  assert.match(assistantPage, /Security and privacy/);
  assert.match(assistantPage, /Support/);
  assert.match(assistantPage, /Search settings/);
  assert.match(assistantPage, /h-dvh/);
});

test('settings includes dedicated reference categories and preserves real account controls', () => {
  for (const category of [
    'Personalization', 'Memory', 'Plugins', 'Workspace', 'Upgrade plan',
    'Usage and limits', 'Trusted contact', 'Parental controls', 'Notifications',
    'Voice', 'Safety', 'Security and login', 'Storage', 'Privacy center',
    'Data controls', 'Ads controls', 'Report bug', 'About', 'Log out'
  ]) assert.ok(assistantPage.includes(category), `missing settings category: ${category}`);
  assert.match(assistantPage, /handleExportData/);
  assert.match(assistantPage, /handleDeleteAll/);
  assert.match(assistantPage, /loadMemories/);
});
