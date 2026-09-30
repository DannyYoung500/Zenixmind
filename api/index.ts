import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = String(req.url || '');
  const pathOnly = url.split('?')[0];

  // Always-available public health — never depends on Express or server.ts boot
  if (
    pathOnly === '/api/health' ||
    pathOnly === '/health' ||
    pathOnly.endsWith('/api/health')
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: true,
      service: 'ZenixMind',
      time: new Date().toISOString()
    });
  }

  try {
    const mod = await import('../server.ts');
    const app = mod.default;
    return app(req as any, res as any);
  } catch (err: any) {
    console.error('[api/index] Express load failed:', err?.message || err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      error: 'API engine temporarily unavailable',
      code: 'ENGINE_BOOT_FAILED',
      detail: String(err?.message || 'import failed')
    });
  }
}
