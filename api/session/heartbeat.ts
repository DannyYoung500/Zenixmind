import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createScopedSessionId } from '../_lib/session-utils.ts';

const OWNER_EMAILS = [
  'danielngozi924@gmail.com',
  'dannyyoungofficial1@gmail.com',
  'zenixmindai@gmail.com',
  'dannyyoungofficail2@gmail.com'
];

function isOwner(email?: string | null) {
  if (!email) return false;
  return OWNER_EMAILS.some((o) => o.toLowerCase() === email.trim().toLowerCase());
}

function parseUA(ua: string) {
  const deviceType = /Mobile|Android|iPhone|iPad/i.test(ua)
    ? /iPad|Tablet/i.test(ua)
      ? 'Tablet'
      : 'Mobile'
    : 'Desktop';
  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  return { deviceType, browser, os };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Auth required' });

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        'https://yanupugtteiyenigotmo.supabase.co',
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
      }
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const email = data.user.email;
    const ua = String(req.headers['user-agent'] || '');
    const { deviceType, browser, os } = parseUA(ua);
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      'unknown';

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const clientSessionId = String(body.clientSessionId || '').slice(0, 80);

    const sessionId = createScopedSessionId(data.user.id, clientSessionId);
    const now = new Date().toISOString();

    const { data: existing, error: lookupError } = await supabase
      .from('user_sessions')
      .select('id,status')
      .eq('id', sessionId)
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing?.status === 'revoked') {
      return res.status(403).json({ error: 'This session has been revoked.', code: 'SESSION_REVOKED' });
    }

    const { error: clearCurrentError } = await supabase
      .from('user_sessions')
      .update({ is_current: false })
      .eq('user_id', data.user.id)
      .eq('status', 'active');
    if (clearCurrentError) throw clearCurrentError;

    const sessionRow = {
      id: sessionId,
      user_id: data.user.id,
      user_email: email,
      user_name:
        (data.user.user_metadata as any)?.full_name ||
        email.split('@')[0] ||
        'User',
      role: isOwner(email) ? 'Owner' : 'Free',
      ip_address: ip,
      user_agent: ua.slice(0, 300),
      device_type: deviceType,
      browser,
      os,
      location: 'Unknown',
      country_code: '',
      started_at: existing ? undefined : now,
      last_active_at: now,
      is_current: true,
      status: existing?.status === 'suspicious' ? 'suspicious' : 'active',
      risk_score: 5,
      risk_flags: []
    };

    const { data: session, error: saveError } = await supabase
      .from('user_sessions')
      .upsert(sessionRow, { onConflict: 'id' })
      .select('id,status')
      .single();
    if (saveError || !session) throw saveError || new Error('Session save failed');

    return res.status(200).json({ ok: true, session: { id: session.id, status: session.status } });
  } catch (e: any) {
    console.error('[heartbeat]', e);
    return res.status(500).json({ error: e?.message || 'Heartbeat failed' });
  }
}
