import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidShareToken } from '../api/_lib/share-utils.ts';

test('accepts a canonical UUID share token', () => {
  assert.equal(isValidShareToken('8f14e45f-ea6b-4f0d-9b6a-9d4f2f8f3d21'), true);
});

test('rejects missing, malformed, and non-string share tokens', () => {
  assert.equal(isValidShareToken(undefined), false);
  assert.equal(isValidShareToken('not-a-token'), false);
  assert.equal(isValidShareToken('8f14e45f-ea6b-4f0d-9b6a-9d4f2f8f3d2'), false);
  assert.equal(isValidShareToken(123), false);
});
