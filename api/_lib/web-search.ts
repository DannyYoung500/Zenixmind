export interface WebSource {
  title: string;
  url: string;
  snippet?: string;
}

export async function searchWeb(query: string, apiKey: string): Promise<WebSource[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  if (!apiKey.trim()) throw new Error('WEB_SEARCH_NOT_CONFIGURED');

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: normalizedQuery,
      search_depth: 'basic',
      topic: 'general',
      max_results: 5,
      include_answer: false,
      include_raw_content: false
    })
  });

  if (!response.ok) {
    throw new Error('WEB_SEARCH_FAILED');
  }

  const payload = await response.json() as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  return (payload.results || [])
    .filter((item) => typeof item.title === 'string' && typeof item.url === 'string' && /^https?:\/\//i.test(item.url))
    .slice(0, 5)
    .map((item) => ({
      title: item.title!.trim(),
      url: item.url!,
      snippet: typeof item.content === 'string' ? item.content.trim().slice(0, 500) : ''
    }));
}

export function addWebSourcesToMessages(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  sources: WebSource[]
) {
  if (!sources.length) return messages;
  const sourceContext = sources.map((source, index) =>
    `[${index + 1}] ${source.title}\nURL: ${source.url}\nSummary: ${source.snippet || 'No summary provided.'}`
  ).join('\n\n');
  const groundedInstruction = `\n\nLIVE WEB SEARCH RESULTS (retrieved for this request):\n${sourceContext}\n\nUse these results to answer the user's question. Cite relevant sources inline using Markdown links with the exact URLs above. Do not claim you searched beyond these results, and clearly say when the sources do not establish a fact.`;
  return messages.map((message, index) =>
    index === messages.length - 1 && message.role === 'user'
      ? { ...message, content: message.content + groundedInstruction }
      : message
  );
}
