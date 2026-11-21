import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGroqStreamLine } from '../api/_lib/groq-client.ts';

test('extracts streamed assistant text from a Groq SSE delta', () => {
  assert.deepEqual(
    parseGroqStreamLine('data: {"choices":[{"delta":{"content":"Hello"}}]}'),
    { text: 'Hello', done: false }
  );
});

test('recognizes the Groq stream completion marker', () => {
  assert.deepEqual(parseGroqStreamLine('data: [DONE]'), { text: '', done: true });
});

test('ignores keep-alive and non-data SSE lines', () => {
  assert.deepEqual(parseGroqStreamLine(': keep-alive'), { text: '', done: false });
  assert.deepEqual(parseGroqStreamLine('event: ping'), { text: '', done: false });
});
