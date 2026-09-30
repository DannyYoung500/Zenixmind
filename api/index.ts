import type { VercelRequest, VercelResponse } from '@vercel/node';
import expressApp from '../server.ts';

function resolveApp(mod: any): any {
  if (typeof mod === 'function') return mod;
  if (mod && typeof mod.default === 'function') return mod.default;
  if (mod && mod.default && typeof mod.default.default === 'function') return mod.default.default;
  return mod;
}

const app = resolveApp(expressApp);

export default function handler(req: VercelRequest, res: VercelResponse) {
  const url = String(req.url || '');
  const pathOnly = url.split('?')[0];

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

  if (typeof app !== 'function') {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({
      error: 'API engine temporarily unavailable',
      code: 'ENGINE_BOOT_FAILED',
      detail: 'Express app export is not callable'
    });
  }

  return app(req as any, res as any);
}
