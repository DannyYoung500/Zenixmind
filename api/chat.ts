import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAvailableModel, validateChatMessages, verifySupabaseAccessToken } from './_lib/model-catalog.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await verifySupabaseAccessToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Sign in to use ZenixMind AI.', code: 'AUTH_REQUIRED' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const selected = resolveAvailableModel(body.model);
    if (!selected) {
      return res.status(403).json({
        error: 'This model is not available on your current plan. Premium model access will be enabled after billing and provider setup are complete.',
        code: 'MODEL_NOT_ENTITLED'
      });
    }
    const messages = validateChatMessages(body.messages);
    if (!messages) return res.status(400).json({ error: 'Messages must contain 1–60 valid user or assistant messages (maximum 80,000 characters).', code: 'INVALID_MESSAGES' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'AI provider is not configured on the server.', code: 'AI_NOT_CONFIGURED' });

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const start = Date.now();
    const result = await ai.models.generateContent({
      model: selected.providerModel,
      contents: messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }]
      }))
    });
    const responseText = (result as any).text ||
      (result as any).candidates?.[0]?.content?.parts?.map((part: any) => part.text).join('') || '';
    if (!responseText) return res.status(502).json({ error: 'The AI provider returned an empty response.', code: 'EMPTY_AI_RESPONSE' });
    const usage = (result as any).usageMetadata || {};
    return res.status(200).json({
      message: { role: 'assistant', content: responseText },
      model: selected.id,
      latencyMs: Date.now() - start,
      usage: {
        inputTokens: Number(usage.promptTokenCount || 0),
        outputTokens: Number(usage.candidatesTokenCount || 0)
      }
    });
  } catch (error: any) {
    console.error('[api/chat]', error);
    return res.status(500).json({ error: 'Chat request failed. Please try again.', code: 'CHAT_FAILED' });
  }
}
