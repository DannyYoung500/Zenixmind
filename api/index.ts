import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any = null;
let loadError: string | null = null;

try {
  // Dynamic import so a top-level crash becomes a visible 500 body
  // instead of an opaque FUNCTION_INVOCATION_FAILED
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../server');
  app = mod.default || mod;
} catch (err: any) {
  loadError = err?.stack || err?.message || String(err);
  console.error('[ZenixMind API] Failed to load server module:', loadError);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (loadError || !app) {
    res.status(500).json({
      error: 'API server failed to start',
      code: 'SERVER_MODULE_LOAD_FAILED',
      detail: loadError || 'Express app export missing'
    });
    return;
  }

  return app(req, res);
}
