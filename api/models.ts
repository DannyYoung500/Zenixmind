import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySupabaseAccessToken, ZENIX_MODELS } from './_lib/model-catalog.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const user = await verifySupabaseAccessToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Sign in to view available models.', code: 'AUTH_REQUIRED' });
  return res.status(200).json({ models: ZENIX_MODELS, defaultModel: 'zenix-auto' });
}
