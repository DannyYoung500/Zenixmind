import test from 'node:test';
import assert from 'node:assert/strict';
import { createScopedSessionId } from '../api/_lib/session-utils.ts';

test('scopes browser session IDs to the authenticated user', () => {
  assert.notEqual(
    createScopedSessionId('user-a', 'browser-session'),
    createScopedSessionId('user-b', 'browser-session')
  );
});

test('keeps a stable ID for the same user and browser session', () => {
  assert.equal(
    createScopedSessionId('user-a', 'browser-session'),
    createScopedSessionId('user-a', 'browser-session')
  );
});

test('limits client-controlled session ID length', () => {
  assert.equal(createScopedSessionId('user-a', 'x'.repeat(120)).length, 'user-a:'.length + 80);
});

test('generates a session suffix when the client ID is missing', () => {
  const id = createScopedSessionId('user-a', '');
  assert.match(id, /^user-a:[0-9a-f-]{36}$/i);
});

test('rejects an empty user ID', () => {
  assert.throws(() => createScopedSessionId('', 'browser-session'), /User ID is required/);
});
