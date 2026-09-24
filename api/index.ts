import type { VercelRequest, VercelResponse } from '@vercel/node';

let appPromise: Promise<any> | null = null;
let loadError: string | null = null;

function loadApp() {
  if (!appPromise) {
    appPromise = import('../server.js')
      .catch(() => import('../server'))
      .then((mod) => mod.default || mod)
      .catch((err: any) => {
        loadError = err?.stack || err?.message || String(err);
        console.error('[ZenixMind API] Failed to load server module:', loadError);
        return null;
      });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await loadApp();

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
