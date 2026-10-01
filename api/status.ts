import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

  checks.push({ name: 'api', ok: true, detail: 'status endpoint' });
  checks.push({ name: 'service', ok: true, detail: 'ZenixMind' });

  checks.push({
    name: 'gemini',
    ok: Boolean(process.env.GEMINI_API_KEY),
    detail: process.env.GEMINI_API_KEY ? 'configured' : 'GEMINI_API_KEY missing'
  });

  checks.push({
    name: 'supabase',
    ok: Boolean(
      process.env.VITE_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL
    ),
    detail: 'url configured'
  });

  checks.push({
    name: 'service_role',
    ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    detail: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'configured'
      : 'SUPABASE_SERVICE_ROLE_KEY missing'
  });

  checks.push({
    name: 'chat_route',
    ok: true,
    detail: 'standalone /api/chat'
  });

  const allOk = checks.every((c) => c.ok);

  res.setHeader('Cache-Control', 'no-store');
  return res.status(allOk ? 200 : 503).json({
    ok: allOk,
    service: 'ZenixMind',
    time: new Date().toISOString(),
    commit:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT ||
      null,
    region: process.env.VERCEL_REGION || null,
    checks
  });
}
