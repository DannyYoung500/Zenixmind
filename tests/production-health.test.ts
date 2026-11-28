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


test('conversation menus and delete confirmation remain fully usable on short mobile viewports', () => {
  const shell = read('../src/components/workspace-shell.tsx');
  assert.match(shell, /max-h-\[calc\(100dvh-2rem\)\].*overflow-y-auto/);
  assert.match(shell, /overscroll-contain/);
  assert.match(shell, /safe-area-inset-bottom/);
  assert.match(shell, /window\.innerHeight - height - 16/);
});

test('active chat composer keeps attachment and action controls aligned on narrow screens', () => {
  const assistant = read('../src/pages/AssistantPage.tsx');
  const start = assistant.indexOf('export const CompactFloatingComposer');
  const end = assistant.indexOf('export function AssistantPage', start);
  const composer = assistant.slice(start, end);
  assert.match(composer, /flex flex-wrap items-center justify-between gap-2 pt-2\.5/);
  assert.match(composer, /flex min-w-0 flex-wrap items-center gap-2 relative/);
  assert.doesNotMatch(composer, /<span>Search<\/span>/);
});


test('AI product guide covers the real workspace controls and clearly marks unavailable integrations', () => {
  const prompt = read('../api/_lib/zenix-system-prompt.ts');
  for (const feature of ['Imagine', 'My stuff', 'Automations', 'Online Search', 'Think Harder', 'Temporary Chat', 'file attachments', 'response detail', 'preferred language']) {
    assert.ok(prompt.toLowerCase().includes(feature.toLowerCase()), `product guide missing ${feature}`);
  }
  assert.match(prompt, /do not claim.*placeholder.*functional/i);
});

test('chat API forwards text and image attachments to the model instead of dropping them', () => {
  const stream = read('../api/chat/stream.ts');
  const groq = read('../api/_lib/groq-client.ts');
  assert.match(stream, /body\.attachment/);
  assert.match(stream, /qwen\/qwen3\.8-27b/);
  assert.match(stream, /image_url/);
  assert.match(stream, /attachment\.text/);
  assert.match(groq, /image_url/);
});

test('temporary chats are not persisted to conversation or message tables', () => {
  const stream = read('../api/chat/stream.ts');
  assert.match(stream, /temporaryChat/);
  assert.match(stream, /if \(!temporaryChat\)/);
  assert.match(stream, /conversationId: conversation\?\.id/);
});

test('settings expose default thinking and language preferences to the assistant', () => {
  const assistant = read('../src/pages/AssistantPage.tsx');
  assert.match(assistant, /Default thinking mode/);
  assert.match(assistant, /Preferred language/);
  assert.match(assistant, /zenixmind-default-thinking/);
  assert.match(assistant, /zenixmind-language/);
  assert.match(assistant, /temporaryChat/);
  assert.match(assistant, /preferences: \{/);
  assert.match(assistant, /language:/);
});

test('source favicons appear inline with search results without opening source details', () => {
  const assistant = read('../src/pages/AssistantPage.tsx');
  const inlineStart = assistant.indexOf('aria-label="Web search sources"');
  const inlineEnd = assistant.indexOf('{sourcesOpen &&', inlineStart);
  const inlineSources = assistant.slice(inlineStart, inlineEnd);
  assert.match(inlineSources, /<SourceFavicon url=\{src\.url\}/);
});
