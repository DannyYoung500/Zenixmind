import assert from 'node:assert/strict';
import testCase from 'node:test';
import { addWebSourcesToMessages, searchWeb } from '../api/_lib/web-search.ts';

testCase('searchWeb returns only valid HTTP(S) source records', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    results: [
      { title: 'Example source', url: 'https://example.com/article', content: 'A useful summary.' },
      { title: 'Invalid source', url: 'javascript:alert(1)', content: 'Ignore this.' },
      { title: 'Missing URL', content: 'No URL.' }
    ]
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    const results = await searchWeb('latest AI news', 'test-key');
    assert.deepEqual(results, [{
      title: 'Example source',
      url: 'https://example.com/article',
      snippet: 'A useful summary.'
    }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

testCase('searchWeb refuses to run without a search API key', async () => {
  await assert.rejects(() => searchWeb('test query', ''), /WEB_SEARCH_NOT_CONFIGURED/);
});

testCase('web results are added only to the latest user message as grounded context', () => {
  const messages = [
    { role: 'system' as const, content: 'System prompt' },
    { role: 'user' as const, content: 'What happened?' }
  ];
  const result = addWebSourcesToMessages(messages, [{
    title: 'Verified report',
    url: 'https://example.com/report',
    snippet: 'A report summary.'
  }]);
  assert.equal(String(result[0].content), 'System prompt');
  assert.match(String(result[1].content), /LIVE WEB SEARCH RESULTS/);
  assert.match(String(result[1].content), /https:\/\/example\.com\/report/);
});
