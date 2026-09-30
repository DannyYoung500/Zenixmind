import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = String(req.url || '');
  const pathOnly = url.split('?')[0];

  // Public health never depends on Express
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
    // Prefer CommonJS-safe require path for Vercel node bundler
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod: any = await import('../server.js').catch(() => import('../server.ts'));
    const candidate = mod?.default ?? mod;
    const app =
      typeof candidate === 'function'
        ? candidate
        : typeof candidate?.default === 'function'
          ? candidate.default
          : null;

    if (!app) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).json({
        error: 'API engine temporarily unavailable',
        code: 'ENGINE_BOOT_FAILED',
        detail: 'Express default export not callable'
      });
    }

    return app(req as any, res as any);
  } catch (err: any) {
    console.error('[api/index]', err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      error: 'API engine temporarily unavailable',
      code: 'ENGINE_BOOT_FAILED',
      detail: String(err?.message || 'import failed')
    });
  }
}
