import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const OWNER_EMAILS = [
  'danielngozi924@gmail.com',
  'dannyyoungofficial1@gmail.com',
  'zenixmindai@gmail.com',
  'dannyyoungofficail2@gmail.com'
];

function isOwner(email?: string | null) {
  if (!email) return false;
  return OWNER_EMAILS.some((o) => o.toLowerCase() === email.trim().toLowerCase());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Normalize path (Vercel may pass /api/... or /...)
  const url = req.url || '/';
  const path = url.split('?')[0].replace(/^\/api/, '') || '/';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Health
  if (path === '/health' || path === '/' || path === '') {
    return res.status(200).json({
      ok: true,
      service: 'ZenixMind',
      time: new Date().toISOString()
    });
  }

  // Chat (minimal Gemini proxy when key present)
  if (path === '/chat' && req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const lastUser = [...messages].reverse().find((m: any) => m?.role === 'user');
      const userText = String(lastUser?.content || '').trim();

      if (!userText) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          message: 'ZenixMind is online. Connect GEMINI_API_KEY in Vercel environment variables to enable full AI replies.'
        });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userText,
        config: {
          systemInstruction:
            'You are ZenixMind — a calm, focused AI assistant. Lead with the useful answer. Be clear and warm.'
        }
      });

      const text =
        (result as any)?.text ||
        (result as any)?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'I could not generate a reply right now.';

      return res.status(200).json({ message: text });
    } catch (err: any) {
      console.error('[chat]', err);
      return res.status(500).json({ error: err?.message || 'Chat failed' });
    }
  }

  // Session / auth helper used by the SPA
  if (path === '/me' || path === '/session') {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yanupugtteiyenigotmo.supabase.co',
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return res.status(401).json({ error: 'Invalid session' });
      return res.status(200).json({
        user: {
          id: data.user.id,
          email: data.user.email,
          isOwner: isOwner(data.user.email)
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Session check failed' });
    }
  }

  return res.status(404).json({
    error: 'Route not found',
    path,
    hint: 'Full owner console routes are being restored. Core chat and health are live.'
  });
}
