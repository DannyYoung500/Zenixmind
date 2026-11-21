export type GroqChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type GroqUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
};

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getErrorMessage(payload: any, status: number): string {
  const providerMessage = payload?.error?.message;
  return typeof providerMessage === 'string' && providerMessage.trim()
    ? providerMessage.slice(0, 500)
    : `Groq API request failed (HTTP ${status}).`;
}

export function parseGroqStreamLine(line: string): { text: string; done: boolean } {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return { text: '', done: false };
  const payload = trimmed.slice(5).trim();
  if (!payload) return { text: '', done: false };
  if (payload === '[DONE]') return { text: '', done: true };
  try {
    const parsed = JSON.parse(payload);
    const content = parsed?.choices?.[0]?.delta?.content;
    return { text: typeof content === 'string' ? content : '', done: false };
  } catch {
    return { text: '', done: false };
  }
}

export async function createGroqChatCompletion(
  messages: GroqChatMessage[],
  model: string,
  apiKey: string
): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number } }> {
  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, stream: false })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(getErrorMessage(payload, response.status));

  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Groq returned an empty response.');
  }

  const usage: GroqUsage = payload?.usage || {};
  return {
    text,
    usage: {
      inputTokens: Number(usage.prompt_tokens || 0),
      outputTokens: Number(usage.completion_tokens || 0)
    }
  };
}

export async function* streamGroqChatCompletion(
  messages: GroqChatMessage[],
  model: string,
  apiKey: string
): AsyncGenerator<string> {
  const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, stream: true })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(getErrorMessage(payload, response.status));
  }
  if (!response.body) throw new Error('Groq did not return a response stream.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        const event = parseGroqStreamLine(line);
        if (event.done) return;
        if (event.text) yield event.text;
      }
      if (done) break;
    }
    if (buffer.trim()) {
      const event = parseGroqStreamLine(buffer);
      if (event.text) yield event.text;
    }
  } finally {
    reader.releaseLock();
  }
}
