import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getChatContext } from './_lib/chat-store.ts';
import { buildPollinationsImageUrl, normalizeImagePrompt } from './_lib/pollinations-image.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const context = await getChatContext(req.headers.authorization);
  if (!context) {
    return res.status(401).json({ error: 'Sign in to generate images.', code: 'AUTH_REQUIRED' });
  }

  const apiKey = process.env.POLLINATIONS_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({
      error: 'Image generation is not configured yet. Add POLLINATIONS_API_KEY to the Vercel Production environment.',
      code: 'IMAGE_PROVIDER_NOT_CONFIGURED'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const prompt = normalizeImagePrompt(body.prompt);
    const model = body.model === 'flux' ? 'flux' : 'zimage';
    const width = Number(body.width || 1024);
    const height = Number(body.height || 1024);
    const url = buildPollinationsImageUrl(prompt, model, width, height);

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(110_000)
    });

    if (!upstream.ok) {
      const status = upstream.status;
      if (status === 401) return res.status(502).json({ error: 'Pollinations rejected the API key. Check POLLINATIONS_API_KEY in Vercel.', code: 'IMAGE_PROVIDER_AUTH_FAILED' });
      if (status === 402) return res.status(402).json({ error: 'Your free Pollinations credits are exhausted. Check your Pollen balance or quests.', code: 'IMAGE_CREDITS_EXHAUSTED' });
      if (status === 429 || status === 503) return res.status(503).json({ error: 'The image generator is busy. Wait a little and try again.', code: 'IMAGE_PROVIDER_BUSY' });
      console.error('[api/generate-image] provider status', status);
      return res.status(502).json({ error: 'The image provider could not complete this generation.', code: 'IMAGE_PROVIDER_FAILED' });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return res.status(502).json({ error: 'The image provider returned an unexpected response.', code: 'INVALID_IMAGE_RESPONSE' });
    }

    const image = Buffer.from(await upstream.arrayBuffer());
    if (!image.length || image.length > 15 * 1024 * 1024) {
      return res.status(502).json({ error: 'The generated image was empty or too large.', code: 'INVALID_IMAGE_SIZE' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(image.length));
    res.setHeader('X-ZenixMind-Image-Model', model);
    return res.status(200).send(image);
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      return res.status(504).json({ error: 'Image generation took too long. Please try again.', code: 'IMAGE_GENERATION_TIMEOUT' });
    }
    if (error instanceof SyntaxError) return res.status(400).json({ error: 'Invalid request body.' });
    return res.status(400).json({ error: error?.message || 'Invalid image generation request.' });
  }
}
