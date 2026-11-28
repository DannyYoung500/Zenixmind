import type { GroqChatMessage } from './groq-client.ts';

export interface WebSource {
  title: string;
  url: string;
  snippet?: string;
}

export type TavilySearchOptions = { depth?: 'basic' | 'advanced' };

export type TavilyResearchCallbacks = {
  onContent: (chunk: string) => void;
  onStatus?: (status: string) => void;
  onSources?: (sources: WebSource[]) => void;
};

const TAVILY_API = 'https://api.tavily.com';

function normalizeSources(value: unknown): WebSource[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item: any) => {
    if (!item || typeof item !== 'object' || typeof item.url !== 'string') return [];
    let url: URL;
    try {
      url = new URL(item.url);
    } catch {
      return [];
    }
    if (!['https:', 'http:'].includes(url.protocol) || seen.has(url.href)) return [];
    seen.add(url.href);
    const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 300) : url.hostname;
    const snippet = typeof item.content === 'string'
      ? item.content.trim().slice(0, 500)
      : typeof item.snippet === 'string' ? item.snippet.trim().slice(0, 500) : '';
    return [{ title, url: url.href, ...(snippet ? { snippet } : {}) }];
  }).slice(0, 20);
}

function tavilyHeaders(apiKey: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey.trim()}`
  };
}

export async function searchWeb(
  query: string,
  apiKey: string,
  options: TavilySearchOptions = {}
): Promise<WebSource[]> {
  const normalizedQuery = query.trim().slice(0, 400);
  if (!normalizedQuery) return [];
  if (!apiKey.trim()) throw new Error('WEB_SEARCH_NOT_CONFIGURED');

  const response = await fetch(`${TAVILY_API}/search`, {
    method: 'POST',
    headers: tavilyHeaders(apiKey),
    body: JSON.stringify({
      query: normalizedQuery,
      search_depth: options.depth === 'advanced' ? 'advanced' : 'basic',
      topic: 'general',
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
      include_images: false
    })
  });

  if (!response.ok) {
    throw new Error(response.status === 429 ? 'WEB_SEARCH_RATE_LIMITED' : 'WEB_SEARCH_FAILED');
  }

  const payload = await response.json() as { results?: unknown };
  return normalizeSources(payload.results);
}

function parseResearchFrame(frame: string): { event: string; payload: any } | null {
  const lines = frame.split(/\r?\n/);
  const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim().toLowerCase() || '';
  const data = lines.filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
  if (!data || data === '[DONE]') return data === '[DONE]' ? { event: 'done', payload: {} } : null;
  try {
    return { event, payload: JSON.parse(data) };
  } catch {
    return { event, payload: { content: data } };
  }
}

export async function streamTavilyResearch(
  query: string,
  apiKey: string,
  callbacks: TavilyResearchCallbacks
): Promise<{ content: string; sources: WebSource[] }> {
  const normalizedQuery = query.trim().slice(0, 4000);
  if (!normalizedQuery) throw new Error('Enter a research topic.');
  if (!apiKey.trim()) throw new Error('WEB_SEARCH_NOT_CONFIGURED');

  const response = await fetch(`${TAVILY_API}/research`, {
    method: 'POST',
    headers: tavilyHeaders(apiKey),
    body: JSON.stringify({
      input: normalizedQuery,
      model: 'auto',
      stream: true,
      citation_format: 'numbered'
    })
  });

  if (!response.ok) {
    throw new Error(response.status === 429 ? 'WEB_RESEARCH_RATE_LIMITED' : 'WEB_RESEARCH_FAILED');
  }
  if (!response.body) throw new Error('WEB_RESEARCH_STREAM_UNAVAILABLE');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let sources: WebSource[] = [];
  let finished = false;

  const handleFrame = (frame: string) => {
    const parsed = parseResearchFrame(frame);
    if (!parsed) return;
    const payload = parsed.payload && typeof parsed.payload === 'object' ? parsed.payload : {};
    const type = String(payload.type || payload.event || parsed.event || '').toLowerCase();
    if (type.includes('tool_call') || type.includes('tool-call') || type === 'planning' || type === 'websearch' || type === 'researchsubtopic' || type === 'generating') {
      const phase = String(payload.name || type).toLowerCase().replace(/[^a-z]/g, '');
      const status = phase.includes('planning') ? 'planning research'
        : phase.includes('websearch') ? 'searching sources'
        : phase.includes('researchsubtopic') ? 'investigating subtopics'
        : phase.includes('generating') ? 'writing research report'
        : 'researching';
      callbacks.onStatus?.(status);
      return;
    }
    if (type === 'content' || type === 'content_delta' || type === 'delta') {
      const chunk = typeof payload.content === 'string'
        ? payload.content
        : typeof payload.delta === 'string' ? payload.delta
        : typeof payload.text === 'string' ? payload.text
        : '';
      if (chunk) {
        content += chunk;
        callbacks.onContent(chunk);
      }
      return;
    }
    if (type === 'sources' || Array.isArray(payload.sources)) {
      sources = normalizeSources(payload.sources || payload.data || []);
      callbacks.onSources?.(sources);
      return;
    }
    if (type === 'done' || type === 'complete' || type === 'completed') {
      if (Array.isArray(payload.sources)) {
        sources = normalizeSources(payload.sources);
        callbacks.onSources?.(sources);
      }
      finished = true;
      return;
    }
    if (type === 'error' || payload.error) {
      throw new Error('WEB_RESEARCH_FAILED');
    }
    if (!type && typeof payload.content === 'string') {
      content += payload.content;
      callbacks.onContent(payload.content);
    }
  };

  try {
    while (!finished) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() || '';
      for (const frame of frames) handleFrame(frame);
    }
    buffer += decoder.decode();
    if (buffer.trim()) handleFrame(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!content.trim()) throw new Error('WEB_RESEARCH_EMPTY');
  return { content, sources };
}

export function addWebSourcesToMessages(
  messages: GroqChatMessage[],
  sources: WebSource[]
): GroqChatMessage[] {
  if (!sources.length) return messages;
  const sourceContext = sources.map((source, index) =>
    `[${index + 1}] ${source.title}\nURL: ${source.url}\nSummary: ${source.snippet || 'No summary provided.'}`
  ).join('\n\n');
  const groundedInstruction = `\n\nLIVE WEB SEARCH RESULTS (retrieved for this request):\n${sourceContext}\n\nUse these results to answer the user's question. Cite relevant sources inline using Markdown links with the exact URLs above. Do not claim you searched beyond these results, and clearly say when the sources do not establish a fact.`;
  const lastUserIndex = messages.map(message => message.role).lastIndexOf('user');
  if (lastUserIndex < 0) return [...messages, { role: 'system', content: groundedInstruction.trim() }];
  const lastUser = messages[lastUserIndex];
  if (typeof lastUser.content === 'string') {
    return messages.map((message, index) => index === lastUserIndex
      ? { ...message, content: message.content + groundedInstruction }
      : message);
  }
  return [...messages, { role: 'system', content: `The user attached an image. Apply these live web search results to their question:\n${sourceContext}\n\n${groundedInstruction.trim()}` }];
}

export function appendWebSourceReferences(content: string, sources: WebSource[]): string {
  if (!sources.length) return content;
  const missing = sources.filter((source) => !content.includes(source.url));
  if (!missing.length) return content;
  const references = missing.map((source) => `- [${source.title.replace(/[\[\]]/g, '')}](${source.url})`).join('\n');
  return `${content.trim()}\n\n### Sources\n${references}`;
}
