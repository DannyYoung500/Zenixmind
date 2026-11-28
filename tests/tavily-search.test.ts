import test from 'node:test';
import assert from 'node:assert/strict';
import { searchWeb, addWebSourcesToMessages, appendWebSourceReferences, streamTavilyResearch } from '../api/_lib/web-search.ts';

test('quick search uses Tavily basic depth and server-side bearer authentication', async () => {
  const originalFetch = globalThis.fetch;
  let captured: { url: string; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    captured = { url: String(input), init };
    return new Response(JSON.stringify({
      results: [
        { title: 'Official result', url: 'https://example.com/article', content: '  Relevant evidence  ' },
        { title: 'Invalid URL', url: 'javascript:alert(1)', content: 'bad' }
      ]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const results = await searchWeb('  latest AI safety  ', 'tvly-test-key');
    assert.equal(captured?.url, 'https://api.tavily.com/search');
    assert.equal(new Headers(captured?.init?.headers).get('Authorization'), 'Bearer tvly-test-key');
    const body = JSON.parse(String(captured?.init?.body));
    assert.equal(body.query, 'latest AI safety');
    assert.equal(body.search_depth, 'basic');
    assert.equal('api_key' in body, false);
    assert.equal(results.length, 1);
    assert.equal(results[0].url, 'https://example.com/article');
    assert.equal(results[0].snippet, 'Relevant evidence');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('advanced quick search selects Tavily advanced depth without changing citations', async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: any;
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ results: [{ title: 'Research source', url: 'https://example.org', content: 'Evidence' }] }), { status: 200 });
  };
  try {
    const sources = await searchWeb('complex topic', 'tvly-test-key', { depth: 'advanced' });
    assert.equal(requestBody.search_depth, 'advanced');
    const messages = addWebSourcesToMessages([{ role: 'user', content: 'Explain this' }], sources);
    assert.match(String(messages[0].content), /https:\/\/example\.org/);
    assert.match(String(messages[0].content), /cite relevant sources inline/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deep research streams report content and preserves Tavily source citations', async () => {
  const originalFetch = globalThis.fetch;
  let captured: { url: string; init?: RequestInit } | undefined;
  globalThis.fetch = async (input, init) => {
    captured = { url: String(input), init };
    const events = [
      'event: tool_call\ndata: {"type":"tool_call","name":"Planning"}\n\n',
      'event: Content\ndata: {"type":"content","content":"## Findings\\n"}\n\n',
      'event: Content\ndata: {"type":"content","content":"Grounded report."}\n\n',
      'event: Sources\ndata: {"type":"sources","sources":[{"title":"Primary source","url":"https://example.com/source"}]}\n\n',
      'event: Done\ndata: {"type":"done"}\n\n'
    ].join('');
    return new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(events));
        controller.close();
      }
    }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  };
  try {
    const chunks: string[] = [];
    const statuses: string[] = [];
    const result = await streamTavilyResearch('research AI safety', 'tvly-test-key', {
      onContent: (chunk) => chunks.push(chunk),
      onStatus: (status) => statuses.push(status)
    });
    assert.equal(captured?.url, 'https://api.tavily.com/research');
    assert.equal(new Headers(captured?.init?.headers).get('Authorization'), 'Bearer tvly-test-key');
    const body = JSON.parse(String(captured?.init?.body));
    assert.equal(body.input, 'research AI safety');
    assert.equal(body.model, 'auto');
    assert.equal(body.stream, true);
    assert.equal(body.citation_format, 'numbered');
    assert.equal(chunks.join(''), '## Findings\nGrounded report.');
    assert.equal(result.content, chunks.join(''));
    assert.deepEqual(result.sources, [{ title: 'Primary source', url: 'https://example.com/source' }]);
    assert.ok(statuses.includes('planning research'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deep research rejects missing keys, empty prompts, and provider failures safely', async () => {
  await assert.rejects(() => streamTavilyResearch('topic', ' ', { onContent: () => {} }), /WEB_SEARCH_NOT_CONFIGURED/);
  await assert.rejects(() => streamTavilyResearch(' ', 'tvly-test-key', { onContent: () => {} }), /Enter a research topic/);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('upstream error', { status: 401 });
  try {
    await assert.rejects(() => streamTavilyResearch('topic', 'tvly-test-key', { onContent: () => {} }), /WEB_RESEARCH_FAILED/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('source references are appended to the saved report when citations are not already linked', () => {
  const report = appendWebSourceReferences('A grounded finding.', [
    { title: 'Official documentation', url: 'https://docs.example.com/page' }
  ]);
  assert.match(report, /### Sources/);
  assert.match(report, /\[Official documentation\]\(https:\/\/docs\.example\.com\/page\)/);
  assert.equal(appendWebSourceReferences(report, [{ title: 'Official documentation', url: 'https://docs.example.com/page' }]), report);
});
