import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getChatContext } from './chat-store.ts';

const GITHUB_API = 'https://api.github.com';
const GITHUB_PROVIDER = 'github';

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://yanupugtteiyenigotmo.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

function encryptionKey() {
  const secret = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) throw new Error('INTEGRATION_TOKEN_ENCRYPTION_KEY must contain at least 32 characters.');
  return createHash('sha256').update(secret).digest();
}

export function encryptIntegrationToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptIntegrationToken(value: string) {
  const [version, iv, tag, encrypted] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('Unsupported encrypted integration token.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}

function callbackUrl() {
  const origin = (process.env.APP_URL || 'https://zenixmind.vercel.app').replace(/\/$/, '');
  return new URL('/api/chat?action=connected-tools-callback', origin).toString();
}

function redirectCallback(res: any, status: 'success' | 'error', reason = '') {
  const target = new URL('/assistant', process.env.APP_URL || 'https://zenixmind.vercel.app');
  target.searchParams.set('settings', '1');
  target.searchParams.set('connection', status === 'success' ? 'github-success' : 'github-error');
  if (reason) target.searchParams.set('reason', reason.slice(0, 80));
  res.setHeader('Location', target.toString());
  return res.status(302).end();
}

async function handleCallback(req: any, res: any) {
  const code = String(req.query.code || '');
  const state = String(req.query.state || '');
  const service = getServiceSupabase();
  if (!state) return redirectCallback(res, 'error', 'missing_state');
  const stateHash = createHash('sha256').update(state).digest('hex');
  const { data: pending, error: stateError } = await service.from('integration_oauth_states')
    .select('user_id,provider')
    .eq('state_hash', stateHash)
    .eq('provider', GITHUB_PROVIDER)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  await service.from('integration_oauth_states').delete().eq('state_hash', stateHash);
  if (stateError || !pending) return redirectCallback(res, 'error', 'invalid_or_expired_state');
  if (req.query.error || !code) return redirectCallback(res, 'error', 'authorization_denied');

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return redirectCallback(res, 'error', 'github_oauth_not_configured');

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: callbackUrl(), state })
    });
    const tokenPayload: any = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) throw new Error('GitHub token exchange failed.');
    const accessToken = String(tokenPayload.access_token);
    const profileResponse = await fetch(`${GITHUB_API}/user`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
    });
    if (!profileResponse.ok) throw new Error('GitHub profile verification failed.');
    const profile: any = await profileResponse.json();
    if (!profile?.id || !profile?.login) throw new Error('GitHub returned an invalid profile.');

    const { data: integration, error: integrationError } = await service.from('user_integrations').upsert({
      user_id: pending.user_id,
      provider: GITHUB_PROVIDER,
      provider_user_id: String(profile.id),
      provider_username: String(profile.login).slice(0, 100),
      display_name: String(profile.name || profile.login).slice(0, 160),
      avatar_url: typeof profile.avatar_url === 'string' ? profile.avatar_url.slice(0, 500) : null,
      scopes: String(tokenPayload.scope || 'read:user').split(',').filter(Boolean),
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,provider' }).select('id').single();
    if (integrationError || !integration) throw new Error('Could not save the GitHub connection.');
    const encryptedToken = encryptIntegrationToken(accessToken);
    const { error: secretError } = await service.from('user_integration_secrets').upsert({
      integration_id: integration.id,
      user_id: pending.user_id,
      encrypted_access_token: encryptedToken,
      token_type: String(tokenPayload.token_type || 'bearer'),
      updated_at: new Date().toISOString()
    }, { onConflict: 'integration_id' });
    if (secretError) {
      await service.from('user_integrations').delete().eq('id', integration.id).eq('user_id', pending.user_id);
      throw new Error('Could not securely save the GitHub credentials.');
    }
    return redirectCallback(res, 'success');
  } catch (error: any) {
    console.error('[connected-tools] GitHub OAuth callback failed:', String(error?.message || 'unknown error').slice(0, 180));
    return redirectCallback(res, 'error', 'github_connection_failed');
  }
}

export async function handleConnectedToolsRequest(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.query.action === 'connected-tools-callback') return handleCallback(req, res);
  const context = await getChatContext(req.headers.authorization);
  if (!context) return res.status(401).json({ error: 'Sign in to manage connected tools.', code: 'AUTH_REQUIRED' });
  const { user } = context;
  const service = getServiceSupabase();

  if (req.method === 'GET') {
    const { data, error } = await service.from('user_integrations')
      .select('id,provider,provider_username,display_name,avatar_url,scopes,connected_at,updated_at')
      .eq('user_id', user.id).order('connected_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Unable to load connected tools.', code: 'CONNECTED_TOOLS_LOAD_FAILED' });
    return res.status(200).json({ integrations: data || [], available: { github: Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET && process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY) } });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (body.action === 'connect' && body.provider === GITHUB_PROVIDER) {
    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    if (!clientId || !process.env.GITHUB_OAUTH_CLIENT_SECRET || !process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY) {
      return res.status(503).json({ error: 'GitHub connection is not configured yet. Add the GitHub OAuth client ID, client secret and integration encryption key in Vercel.', code: 'GITHUB_OAUTH_NOT_CONFIGURED' });
    }
    try { encryptionKey(); } catch { return res.status(503).json({ error: 'The integration encryption key must contain at least 32 characters.', code: 'INTEGRATION_ENCRYPTION_KEY_INVALID' }); }
    const state = randomBytes(32).toString('base64url');
    const stateHash = createHash('sha256').update(state).digest('hex');
    await service.from('integration_oauth_states').delete().eq('user_id', user.id).lt('expires_at', new Date().toISOString());
    const { error } = await service.from('integration_oauth_states').insert({
      state_hash: stateHash,
      user_id: user.id,
      provider: GITHUB_PROVIDER,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });
    if (error) return res.status(500).json({ error: 'Could not start the GitHub authorization flow.', code: 'OAUTH_STATE_CREATE_FAILED' });
    const authorize = new URL('https://github.com/login/oauth/authorize');
    authorize.searchParams.set('client_id', clientId);
    authorize.searchParams.set('redirect_uri', callbackUrl());
    authorize.searchParams.set('scope', 'read:user');
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('allow_signup', 'false');
    return res.status(200).json({ authorizationUrl: authorize.toString() });
  }
  if (body.action === 'disconnect' && body.provider === GITHUB_PROVIDER) {
    const { error } = await service.from('user_integrations').delete().eq('user_id', user.id).eq('provider', GITHUB_PROVIDER);
    if (error) return res.status(500).json({ error: 'Could not disconnect GitHub.', code: 'GITHUB_DISCONNECT_FAILED' });
    return res.status(200).json({ success: true });
  }
  return res.status(400).json({ error: 'Unsupported connected tool action.', code: 'CONNECTED_TOOL_ACTION_INVALID' });
}

async function githubFetch(path: string) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'ZenixMind' }
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('GitHub could not find that public repository or file.');
    if (response.status === 403 || response.status === 429) throw new Error('GitHub rate limit reached. Try again later.');
    throw new Error('GitHub could not complete the read-only request.');
  }
  return response.json() as Promise<any>;
}

export function parseConnectedToolCommand(message: string): { command: 'repos' | 'search' | 'read'; argument: string } | null {
  const match = message.trim().match(/^\/github\s+(repos|search|read)(?:\s+([\s\S]+))?$/i);
  if (!match) return null;
  return { command: match[1].toLowerCase() as 'repos' | 'search' | 'read', argument: String(match[2] || '').trim() };
}

export async function executeConnectedToolCommand(message: string, userId: string): Promise<{ command: string; result: string } | null> {
  const parsed = parseConnectedToolCommand(message);
  if (!parsed) return null;
  const { command, argument } = parsed;
  const service = getServiceSupabase();
  const { data: integration, error } = await service.from('user_integrations')
    .select('provider_username,display_name')
    .eq('user_id', userId).eq('provider', GITHUB_PROVIDER).maybeSingle();
  if (error) throw new Error('Could not check your GitHub connection.');
  if (!integration) throw new Error('Connect GitHub in Settings → Connected tools before using /github commands.');

  if (command === 'repos') {
    const repos = await githubFetch(`/users/${encodeURIComponent(integration.provider_username)}/repos?type=owner&sort=updated&per_page=20`);
    const lines = (repos as any[]).map(repo => `- ${repo.full_name} — ${repo.description || 'No description'} [${repo.language || 'Unknown language'}] (${repo.html_url})`);
    return { command, result: lines.join('\n') || 'No public repositories were found.' };
  }
  if (command === 'search') {
    if (!argument) throw new Error('Use /github search followed by a search phrase.');
    const query = `${argument} user:${integration.provider_username}`;
    const data = await githubFetch(`/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=10`);
    const lines = (data.items || []).map((repo: any) => `- ${repo.full_name} — ${repo.description || 'No description'} [${repo.language || 'Unknown language'}] (${repo.html_url})`);
    return { command, result: lines.join('\n') || 'No matching public repositories were found.' };
  }
  const pathSegments = argument.split('/');
  if (!argument || argument.length > 500 || pathSegments.length < 2 || pathSegments.some((segment) => !segment || segment === '.' || segment === '..') || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_./-]+)?$/.test(argument)) {
    throw new Error('Use /github read owner/repository or /github read owner/repository/path.');
  }
  const [owner, repo, ...pathParts] = pathSegments;
  const endpoint = pathParts.length
    ? `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${pathParts.map(encodeURIComponent).join('/')}`
    : `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;
  const file = await githubFetch(endpoint);
  if (Array.isArray(file)) {
    const names = file.slice(0, 40).map((item: any) => `- ${item.name} (${item.type})`).join('\n');
    return { command, result: `Directory contents for ${owner}/${repo}/${pathParts.join('/') || '/'}:\n${names}` };
  }
  const decoded = Buffer.from(String(file.content || ''), 'base64').toString('utf8').slice(0, 16000);
  return { command, result: `Public file: ${owner}/${repo}/${file.path || pathParts.join('/') || 'README'}\n${decoded || 'This file has no text content.'}` };
}
