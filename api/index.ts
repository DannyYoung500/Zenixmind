import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server.ts';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const url = String(req.url || '');
  const path = url.split('?')[0];

  // Always-available public health (does not depend on Express boot)
  if (
    path === '/api/health' ||
    path === '/health' ||
    path.endsWith('/api/health')
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: true,
      service: 'ZenixMind',
      time: new Date().toISOString()
    });
  }

  return app(req as any, res as any);
}
