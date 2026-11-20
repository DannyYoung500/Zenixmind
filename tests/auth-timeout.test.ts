import test from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from '../src/lib/auth-context.tsx';

test('returns the session result when it arrives before the deadline', async () => {
  const result = await withTimeout(Promise.resolve({ user: 'signed-in' }), 100, null);
  assert.deepEqual(result, { user: 'signed-in' });
});

test('releases auth loading with a fallback when session lookup stalls', async () => {
  const neverSettles = new Promise<never>(() => {});
  const result = await withTimeout(neverSettles, 5, null);
  assert.equal(result, null);
});

test('uses the fallback when the session lookup rejects', async () => {
  const result = await withTimeout(Promise.reject(new Error('offline')), 100, null);
  assert.equal(result, null);
});
