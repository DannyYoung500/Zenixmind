import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const mod = await import('../server');
    const app = mod.default;
    return app(req, res);
  } catch (error) {
    console.error('[ZenixMind API bootstrap]', error);
    return res.status(500).json({
      error: 'API bootstrap failed',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}
