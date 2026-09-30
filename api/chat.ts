import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { messages, model } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        code: 'AI_NOT_CONFIGURED'
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const modelId = model || 'gemini-2.5-flash';
    const history = Array.isArray(messages) ? messages : [];
    const contents = history.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || m.text || '') }]
    }));

    const start = Date.now();
    const result = await ai.models.generateContent({
      model: modelId,
      contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });

    const text =
      (result as any).text ||
      (result as any).candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ||
      '';
    const latency = Date.now() - start;
    const usage = (result as any).usageMetadata || {};

    return res.status(200).json({
      message: { role: 'assistant', content: text },
      model: modelId,
      latencyMs: latency,
      usage: {
        inputTokens: Number(usage.promptTokenCount || 0),
        outputTokens: Number(usage.candidatesTokenCount || 0)
      }
    });
  } catch (err: any) {
    console.error('[api/chat]', err);
    return res.status(500).json({ error: err?.message || 'Chat failed' });
  }
}
