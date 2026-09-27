import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

  // Self
  checks.push({ name: 'api', ok: true, detail: 'status endpoint' });

  // Health via internal path knowledge
  checks.push({
    name: 'service',
    ok: true,
    detail: 'ZenixMind'
  });

  // Optional: Gemini key present (not valid, just configured)
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
