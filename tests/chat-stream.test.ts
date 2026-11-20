import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSseEvent, splitSseFrames } from '../src/lib/sse-parser.ts';
import { createConversationTitle } from '../api/_lib/chat-utils.ts';

test('parses a standard newline-delimited SSE event', () => {
  const { frames, remainder } = splitSseFrames('data: {"type":"delta","text":"Hello"}\n\n');
  assert.equal(remainder, '');
  assert.deepEqual(parseSseEvent(frames[0]), { type: 'delta', text: 'Hello' });
});

test('keeps an incomplete SSE frame until the next network chunk', () => {
  const { frames, remainder } = splitSseFrames('data: {"type":"delta"');
  assert.deepEqual(frames, []);
  assert.equal(remainder, 'data: {"type":"delta"');
});

test('creates a clean title from the first user prompt', () => {
  assert.equal(createConversationTitle('  Build me a premium AI workspace  '), 'Build me a premium AI workspace');
});

test('limits generated conversation titles to 80 characters', () => {
  assert.equal(createConversationTitle('a'.repeat(120)).length, 80);
});

test('uses a safe default title for an empty prompt', () => {
  assert.equal(createConversationTitle('   '), 'New conversation');
});
