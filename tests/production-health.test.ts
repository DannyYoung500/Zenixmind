import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

test('Vite assets and environment imports have explicit TypeScript declarations', () => {
  const declarations = read('../src/vite-env.d.ts');
  assert.match(declarations, /vite\/client/);
  assert.match(declarations, /\*\.css/);
  assert.match(declarations, /\*\.png/);
});

test('ProjectView owns the router search-param setter it uses', () => {
  const source = read('../src/pages/AssistantPage.tsx');
  const start = source.indexOf('function ProjectView(');
  const end = source.indexOf('\nfunction ', start + 1);
  const component = source.slice(start, end < 0 ? undefined : end);
  assert.match(component, /const\s*\[\s*searchParams\s*,\s*setSearchParams\s*\]\s*=\s*useSearchParams\(\)/);
});

test('voice orb does not compare a narrowed visual state with connecting', () => {
  const source = read('../src/components/voice-sun-orb.tsx');
  assert.doesNotMatch(source, /visual !== 'connecting'/);
});

test('owner API token headers have a stable string map type', () => {
  for (const path of [
    '../src/pages/OwnerBroadcastsPage.tsx',
    '../src/pages/OwnerFlagsPage.tsx',
    '../src/pages/OwnerMemoryPage.tsx',
    '../src/pages/OwnerRateLimitsPage.tsx'
  ]) {
    assert.match(read(path), /Promise<Record<string, string>>/);
  }
});

test('chat dictation error is declared and passed through the microphone UI', () => {
  const source = read('../src/pages/AssistantPage.tsx');
  assert.match(source, /const \[dictationError, setDictationError\] = useState\(''\)/);
  assert.match(source, /dictationError=\{dictationError\}/);
});
