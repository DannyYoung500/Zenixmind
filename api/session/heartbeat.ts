import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

function dataDir() {
  const dir = process.env.VERCEL ? path.join('/tmp', 'zenixmind-data') : path.resolve('./data');
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
  return dir;
}

function loadSessions(): any[] {
  try {
    const file = path.join(dataDir(), 'sessions.json');
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  return [];
}

function saveSessions(sessions: any[]) {
  try {
    fs.writeFileSync(path.join(dataDir(), 'sessions.json'), JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.warn('[heartbeat] save failed', e);
  }
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
      { auth: { autoRefreshToken: false, persistSession: false } }
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

    const sessions = loadSessions();
    const now = new Date().toISOString();
    const existingIdx = sessions.findIndex(
      (s) =>
        s.status === 'active' &&
        (clientSessionId ? s.id === clientSessionId : false || s.userEmail === email && s.userAgent === ua)
    );

    let session;
    if (existingIdx >= 0) {
      sessions[existingIdx].lastActiveAt = now;
      sessions[existingIdx].isCurrent = true;
      session = sessions[existingIdx];
    } else {
      session = {
        id: clientSessionId || `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        userId: data.user.id,
        userEmail: email,
        userName:
          (data.user.user_metadata as any)?.full_name ||
          email.split('@')[0] ||
          'User',
        role: isOwner(email) ? 'Owner' : 'Free',
        ipAddress: ip,
        userAgent: ua.slice(0, 300),
        deviceType,
        browser,
        os,
        location: 'Unknown',
        countryCode: '',
        startedAt: now,
        lastActiveAt: now,
        isCurrent: true,
        status: 'active',
        riskScore: 5,
        riskFlags: []
      };
      // Mark previous same-user sessions not current
      sessions.forEach((s) => {
        if (s.userEmail === email) s.isCurrent = false;
      });
      sessions.unshift(session);
    }

    // Cap ledger size
    const trimmed = sessions.slice(0, 500);
    saveSessions(trimmed);

    return res.status(200).json({ ok: true, session: { id: session.id, status: session.status } });
  } catch (e: any) {
    console.error('[heartbeat]', e);
    return res.status(500).json({ error: e?.message || 'Heartbeat failed' });
  }
}
