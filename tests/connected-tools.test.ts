import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');
process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY = 'test-only-integration-encryption-key-with-more-than-32-chars';
const { encryptIntegrationToken, decryptIntegrationToken, parseConnectedToolCommand } = await import('../api/_lib/connected-tools.ts');
const migration = read('../supabase/migrations/20261129090000_connected_tools.sql');
const api = read('../api/_lib/connected-tools.ts');
const router = read('../api/chat.ts');
const stream = read('../api/chat/stream.ts');
const ui = read('../src/pages/AssistantPage.tsx');

test('connected tool tokens are isolated from browser-readable integration metadata', () => {
  assert.match(migration, /create table public\.user_integrations/);
  assert.match(migration, /create table public\.user_integration_secrets/);
  assert.match(migration, /create table public\.integration_oauth_states/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /Users read their own connected tools/);
  assert.match(migration, /revoke all on public\.user_integration_secrets from anon, authenticated/);
  assert.match(migration, /revoke all on public\.integration_oauth_states from anon, authenticated/);
  assert.doesNotMatch(migration, /create policy[^;]+user_integration_secrets/is);
});

test('GitHub OAuth uses least-privilege read-only identity scope and encrypted token storage', () => {
  assert.match(api, /searchParams\.set\('scope', 'read:user'\)/);
  assert.match(api, /aes-256-gcm/);
  assert.match(api, /createHash\('sha256'\)/);
  assert.match(api, /INTEGRATION_TOKEN_ENCRYPTION_KEY/);
  assert.match(api, /GITHUB_OAUTH_CLIENT_SECRET/);
  assert.match(api, /encrypted_access_token/);
  assert.doesNotMatch(api, /console\.(?:log|error)\([^\n]*accessToken/i);
});

test('chat API routes OAuth and connected-tool management without adding serverless functions', () => {
  assert.match(router, /handleConnectedToolsRequest/);
  assert.match(router, /action === 'connected-tools'/);
  assert.match(router, /action === 'connected-tools-callback'/);
});

test('GitHub tool commands are explicit, read-only and user-scoped', () => {
  assert.match(stream, /executeConnectedToolCommand/);
  assert.match(api, /parseConnectedToolCommand/);
  assert.match(api, /\\/github\\s\+/);
  assert.match(stream, /connected tool/i);
  assert.match(api, /\.eq\('user_id', userId\)/);
  assert.match(api, /api\.github\.com/);
  assert.doesNotMatch(api, /POST \/repos|DELETE \/repos|PUT \/repos/);
});

test('settings exposes a real Connected tools section with connect and disconnect states', () => {
  assert.match(ui, /Connected tools/);
  assert.match(ui, /Connect GitHub/);
  assert.match(ui, /Disconnect/);
  assert.match(ui, /loadConnectedTools/);
  assert.match(ui, /connected-tools/);
});

test('integration tokens are authenticated-encrypted and command parsing is explicit', () => {
  const token = 'gho_test_secret_token';
  const encrypted = encryptIntegrationToken(token);
  assert.notEqual(encrypted, token);
  assert.equal(decryptIntegrationToken(encrypted), token);
  assert.notEqual(encrypted, encryptIntegrationToken(token));
  assert.deepEqual(parseConnectedToolCommand('/github repos'), { command: 'repos', argument: '' });
  assert.deepEqual(parseConnectedToolCommand('/github search zenixmind'), { command: 'search', argument: 'zenixmind' });
  assert.deepEqual(parseConnectedToolCommand('/github read owner/repo/README.md'), { command: 'read', argument: 'owner/repo/README.md' });
  assert.equal(parseConnectedToolCommand('Please search my GitHub repos'), null);
});
