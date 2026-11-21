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
