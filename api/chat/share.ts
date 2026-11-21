import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getChatContext } from '../_lib/chat-store.ts';
import { isValidShareToken } from '../_lib/share-utils.ts';

function publicSupabase() {
  const url = process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://yanupugtteiyenigotmo.supabase.co';
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

function readBody(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  return req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const rawToken = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
    if (!isValidShareToken(rawToken)) {
      return res.status(400).json({ error: 'A valid share token is required.' });
    }
    const { data, error } = await publicSupabase().rpc('get_shared_conversation', {
      p_share_token: rawToken
    });
    if (error) {
      console.error('[chat/share] public read failed', error);
      return res.status(500).json({ error: 'Unable to load this shared conversation.' });
    }
    if (!data) return res.status(404).json({ error: 'This share link is invalid or has been revoked.' });
    return res.status(200).json(data);
  }

  const context = await getChatContext(req.headers.authorization);
  if (!context) {
    return res.status(401).json({ error: 'Sign in to manage chat sharing.', code: 'AUTH_REQUIRED' });
  }
  const { user, supabase } = context;

  if (req.method === 'POST') {
    const conversationId = String(readBody(req).conversationId || '').trim();
    if (!conversationId) return res.status(400).json({ error: 'Conversation ID is required.' });

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (conversationError) return res.status(500).json({ error: 'Unable to verify this conversation.' });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    const { data: existing, error: existingError } = await supabase
      .from('conversation_shares')
      .select('share_token')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .maybeSingle();
    if (existingError) return res.status(500).json({ error: 'Unable to check the existing share link.' });
    if (existing?.share_token) return res.status(200).json({ shareToken: existing.share_token });

    const { data: created, error: createError } = await supabase
      .from('conversation_shares')
      .insert({ conversation_id: conversationId, user_id: user.id })
      .select('share_token')
      .single();
    if (createError || !created) {
      // A concurrent share request may have won the unique active-share constraint.
      const { data: racedShare } = await supabase
        .from('conversation_shares')
        .select('share_token')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .maybeSingle();
      if (racedShare?.share_token) {
        return res.status(200).json({ shareToken: racedShare.share_token });
      }
      console.error('[chat/share] create failed', createError);
      return res.status(500).json({ error: 'Unable to create a share link.' });
    }
    return res.status(201).json({ shareToken: created.share_token });
  }

  if (req.method === 'DELETE') {
    const conversationId = String(readBody(req).conversationId || '').trim();
    if (!conversationId) return res.status(400).json({ error: 'Conversation ID is required.' });
    const { error } = await supabase
      .from('conversation_shares')
      .update({ revoked_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .is('revoked_at', null);
    if (error) return res.status(500).json({ error: 'Unable to revoke the share link.' });
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
