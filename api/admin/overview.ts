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
  return OWNER_EMAILS.some((o) => o.toLowerCase() === email.trim().toLowerCase());
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

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: true,
      time: new Date().toISOString(),
      commit:
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GIT_COMMIT ||
        null,
      region: process.env.VERCEL_REGION || null,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      supabaseConfigured: Boolean(
        process.env.VITE_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.SUPABASE_URL
      ),
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      ownerEmail: data.user.email,
      checks: [
        { name: 'api', ok: true, detail: 'overview endpoint' },
        {
          name: 'gemini',
          ok: Boolean(process.env.GEMINI_API_KEY),
          detail: process.env.GEMINI_API_KEY ? 'configured' : 'GEMINI_API_KEY missing'
        },
        {
          name: 'supabase',
          ok: true,
          detail: 'url configured'
        },
        {
          name: 'service_role',
          ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          detail: process.env.SUPABASE_SERVICE_ROLE_KEY
            ? 'configured'
            : 'SUPABASE_SERVICE_ROLE_KEY missing'
        }
      ]
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Overview failed' });
  }
}
