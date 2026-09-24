import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server';

// Vercel serverless entry — Express app handles all /api/* routes
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
