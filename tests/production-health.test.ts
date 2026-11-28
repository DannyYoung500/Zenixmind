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


test('online search is controlled from Settings rather than the chat composer menu', () => {
  const assistant = read('../src/pages/AssistantPage.tsx');
  assert.match(assistant, /id="settings-online-search"/);
  assert.match(assistant, /zenixmind-web-search/);
  assert.match(assistant, /onWebSearchChange/);
  assert.doesNotMatch(assistant, /<span>Search web<\/span>/);
});

test('Think Harder changes server instructions and uses useful progress states', () => {
  const stream = read('../api/chat/stream.ts');
  const assistant = read('../src/pages/AssistantPage.tsx');
  assert.match(stream, /deepThinkRequested/);
  assert.match(stream, /deliberate problem-solving approach/);
  assert.match(stream, /status: 'generating'/);
  assert.match(assistant, /Preparing a detailed answer/);
  assert.match(assistant, /Writing your answer/);
  assert.doesNotMatch(assistant, /thinkingStatus === 'analyzing'/);
});

test('ZenixMind system prompt documents real product settings and unavailable features', () => {
  const prompt = read('../api/_lib/zenix-system-prompt.ts');
  assert.match(prompt, /ZENIXMIND PRODUCT GUIDE/);
  assert.match(prompt, /Online Search is controlled in Settings/);
  assert.match(prompt, /do not claim a user can complete an action until the interface supports it/i);
});


test('chat requests include current user-visible preferences so ZenixMind can explain its active settings', () => {
  const assistant = read('../src/pages/AssistantPage.tsx');
  const stream = read('../api/chat/stream.ts');
  assert.match(assistant, /onlineSearch: webSearch/);
  assert.match(assistant, /theme: localStorage.getItem\('zenixmind-theme'\)/);
  assert.match(stream, /Current user-visible ZenixMind preferences/);
  assert.match(stream, /Online Search preference/);
});

 
test('mobile navigation fills the phone width and settings navigation exposes all major groups', () => {
  const shell = read('../src/components/workspace-shell.tsx');
  const assistant = read('../src/pages/AssistantPage.tsx');
  assert.match(shell, /h-full w-full border-r/);
  assert.match(assistant, /Mobile settings navigation/);
  assert.match(assistant, /Online Search.*settings-online-search/);
  assert.doesNotMatch(assistant, /\['Codex'/);
});
