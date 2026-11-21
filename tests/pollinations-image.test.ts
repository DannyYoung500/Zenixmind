import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeImagePrompt, buildPollinationsImageUrl } from '../api/_lib/pollinations-image.ts';

test('image prompts are trimmed and bounded', () => {
  assert.equal(normalizeImagePrompt('  cinematic portrait  '), 'cinematic portrait');
  assert.throws(() => normalizeImagePrompt('   '), /Enter a prompt/);
  assert.throws(() => normalizeImagePrompt('x'.repeat(4001)), /too long/);
});

test('image generation uses the selected Pollinations model and safe image dimensions', () => {
  const url = new URL(buildPollinationsImageUrl('cinematic portrait', 'zimage', 1024, 1024));
  assert.equal(url.origin, 'https://gen.pollinations.ai');
  assert.equal(url.pathname, '/image/cinematic%20portrait');
  assert.equal(url.searchParams.get('model'), 'zimage');
  assert.equal(url.searchParams.get('width'), '1024');
  assert.equal(url.searchParams.get('height'), '1024');
});

test('image model and dimensions are allow-listed', () => {
  assert.throws(() => buildPollinationsImageUrl('test', 'unknown', 1024, 1024), /Unsupported image model/);
  assert.throws(() => buildPollinationsImageUrl('test', 'zimage', 9000, 1024), /dimensions/);
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const assistantPage = readFileSync(fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url)), 'utf8');
const globalCss = readFileSync(fileURLToPath(new URL('../src/index.css', import.meta.url)), 'utf8');
const indexHtml = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');

test('mobile chat composer uses dynamic viewport and does not smooth-scroll while typing', () => {
  assert.match(indexHtml, /interactive-widget=resizes-content/);
  assert.match(assistantPage, /h-\[calc\(100dvh-56px\)\]/);
  assert.doesNotMatch(assistantPage, /scroll-smooth/);
  assert.match(assistantPage, /text-base text-zinc-100/);
  assert.match(globalCss, /font-size: 16px !important/);
});

test('image generation uses authenticated server route and stores the returned image blob', () => {
  assert.match(assistantPage, /chatApiFetch\('\/api\/generate-image'/);
  assert.match(assistantPage, /const blob = await response\.blob\(\)/);
  assert.match(assistantPage, /storage\.from\('library'\)/);
});

test('image generation reports provider errors in the page instead of blocking browser alerts', () => {
  assert.match(assistantPage, /setGenerationNotice\(error\?\.message/);
  const imageHandler = assistantPage.slice(assistantPage.indexOf('const handleGenerate = async'), assistantPage.indexOf('const handleDictate ='));
  assert.doesNotMatch(imageHandler, /window\.alert/);
});


const assistantSource = readFileSync(fileURLToPath(new URL('../src/pages/AssistantPage.tsx', import.meta.url)), 'utf8');
const rendererSource = readFileSync(fileURLToPath(new URL('../src/components/message-renderer.tsx', import.meta.url)), 'utf8');
const workspaceSource = readFileSync(fileURLToPath(new URL('../src/components/workspace-shell.tsx', import.meta.url)), 'utf8');

test('chat image creation is explicit, authenticated, and saved to the private library and conversation', () => {
  assert.match(assistantSource, /const imageIntent = text\.match/);
  assert.match(assistantSource, /if \(!user\?\.id\)/);
  assert.match(assistantSource, /\/api\/generate-image/);
  assert.match(assistantSource, /storage\.from\('library'\)\.upload/);
  assert.match(assistantSource, /from\('library_items'\)\.insert/);
  assert.match(assistantSource, /from\('messages'\)\.insert/);
});

test('chat media renderer displays generated images and download links', () => {
  assert.match(rendererSource, /\| 'image' \| 'link'/);
  assert.match(rendererSource, /<img src=\{block\.url\}/);
  assert.match(rendererSource, /download className/);
});

test('chat scroll remains inside its own panel and never forces scrolling while busy', () => {
  assert.match(assistantSource, /container\.scrollTo\(\{ top: container\.scrollHeight, behavior \}\)/);
  assert.doesNotMatch(assistantSource, /scrollIntoView\(\{ behavior/);
  assert.doesNotMatch(assistantSource, /isAtBottomRef\.current \|\| isStreaming \|\| busy/);
});

test('workspace layout uses a single dynamic viewport with nested flex constraints', () => {
  assert.match(workspaceSource, /h-\[100dvh\] overflow-hidden/);
  assert.match(workspaceSource, /flex min-h-0 flex-1 flex-col overflow-hidden/);
});


test('chat image messages persist a private storage reference and refresh signed links on history load', () => {
  assert.match(assistantSource, /zenix-storage:\/\//);
  assert.match(assistantSource, /zenix-download:\/\//);
  assert.match(assistantSource, /createSignedUrl\(mediaPath, 60 \* 60/);
});
