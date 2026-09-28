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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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
    if (error || !data.user?.email || !isOwner(data.user.email)) {
      return res.status(403).json({ error: 'Owner required' });
    }

    const sessions = loadSessions();
    return res.status(200).json({
      source: 'heartbeat-ledger',
      sessions,
      count: sessions.length,
      active: sessions.filter((s) => s.status === 'active').length
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Failed' });
  }
}
