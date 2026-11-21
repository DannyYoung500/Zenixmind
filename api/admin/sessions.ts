import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const OWNER_EMAILS = [
  'danielngozi924@gmail.com',
  'dannyyoungofficial1@gmail.com',
  'zenixmindai@gmail.com',
  'dannyyoungofficail2@gmail.com'
];

function isOwner(email?: string | null) {
  if (!email) return false;
  return OWNER_EMAILS.some((owner) => owner.toLowerCase() === email.trim().toLowerCase());
}

function readBody(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body || '{}'); } catch { return {}; }
  }
  return req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
}

function mapSession(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    role: row.role,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    deviceType: row.device_type,
    browser: row.browser,
    os: row.os,
    location: row.location,
    countryCode: row.country_code,
    startedAt: row.started_at,
    lastActiveAt: row.last_active_at,
    isCurrent: row.is_current,
    status: row.status,
    riskScore: row.risk_score,
    riskFlags: row.risk_flags || [],
    revokedAt: row.revoked_at || null,
    revocationReason: row.revocation_reason || null,
    source: 'supabase'
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Auth required' });

  try {
    const url = process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://yanupugtteiyenigotmo.supabase.co';
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08';
    const supabase = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    });
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData.user;
    if (authError || !user?.email || !isOwner(user.email)) {
      return res.status(403).json({ error: 'Owner required' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('id,user_id,user_email,user_name,role,ip_address,user_agent,device_type,browser,os,location,country_code,started_at,last_active_at,is_current,status,risk_score,risk_flags,revoked_at,revocation_reason')
        .order('last_active_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      const sessions = (data || []).map(mapSession);
      return res.status(200).json({
        source: 'supabase',
        sessions,
        count: sessions.length,
        active: sessions.filter((session) => session.status === 'active').length
      });
    }

    const body = readBody(req);
    const reason = String(body.reason || 'Revoked by owner').trim().slice(0, 250);
    const revokedAt = new Date().toISOString();
    if (body.allExceptCurrent === true) {
      const revokePayload = {
        status: 'revoked',
        is_current: false,
        revoked_at: revokedAt,
        revoked_by: user.id,
        revocation_reason: reason
      };
      const otherUsers = await supabase
        .from('user_sessions')
        .update(revokePayload)
        .eq('status', 'active')
        .neq('user_id', user.id)
        .select('id');
      if (otherUsers.error) throw otherUsers.error;
      const otherOwnerSessions = await supabase
        .from('user_sessions')
        .update(revokePayload)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('is_current', false)
        .select('id');
      if (otherOwnerSessions.error) throw otherOwnerSessions.error;
      const revokedCount = (otherUsers.data?.length || 0) + (otherOwnerSessions.data?.length || 0);
      return res.status(200).json({
        success: true,
        message: `Revoked ${revokedCount} other active session(s).`,
        revokedCount
      });
    }

    const sessionId = String(body.sessionId || '').trim();
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });
    const { data: revoked, error: revokeError } = await supabase
      .from('user_sessions')
      .update({
        status: 'revoked',
        is_current: false,
        revoked_at: revokedAt,
        revoked_by: user.id,
        revocation_reason: reason
      })
      .eq('id', sessionId)
      .neq('status', 'revoked')
      .select('id,user_id,user_email,status,revoked_at,revocation_reason')
      .maybeSingle();
    if (revokeError) throw revokeError;
    if (!revoked) return res.status(404).json({ error: 'Session not found or already revoked.' });
    return res.status(200).json({
      success: true,
      message: `Session ${sessionId} revoked.`,
      session: revoked
    });
  } catch (error: any) {
    console.error('[admin/sessions]', error);
    return res.status(500).json({ error: 'Unable to process session request.' });
  }
}
