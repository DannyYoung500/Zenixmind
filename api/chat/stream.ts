import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAvailableModel, validateChatMessages } from '../_lib/model-catalog.ts';
import { createConversationTitle } from '../_lib/chat-utils.ts';
import { streamGroqChatCompletion } from '../_lib/groq-client.ts';
import { buildZenixMessages } from '../_lib/zenix-system-prompt.ts';
import { getChatContext } from '../_lib/chat-store.ts';
import { addWebSourcesToMessages, searchWeb } from '../_lib/web-search.ts';
import { getChatCommandInstruction } from '../_lib/chat-command-instructions.ts';

function sendEvent(res: VercelResponse, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const context = await getChatContext(req.headers.authorization);
  if (!context) return res.status(401).json({ error: 'Sign in to use ZenixMind AI.', code: 'AUTH_REQUIRED' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const selected = resolveAvailableModel(body.model);
  if (!selected) {
    return res.status(403).json({
      error: 'This model is not available on your current plan. Premium model access will be enabled after billing is configured.',
      code: 'MODEL_NOT_ENTITLED'
    });
  }

  const messages = validateChatMessages(body.messages);
  if (!messages || messages[messages.length - 1]?.role !== 'user') {
    return res.status(400).json({ error: 'A valid user message is required to start a response.', code: 'INVALID_MESSAGES' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey?.trim()) {
    return res.status(503).json({ error: 'Groq is not configured on the server. Add GROQ_API_KEY to the Production environment.', code: 'GROQ_NOT_CONFIGURED' });
  }

  const webSearchRequested = body.webSearch === true;
  let sources: Awaited<ReturnType<typeof searchWeb>> = [];
  let modelMessages = buildZenixMessages(messages);
  const commandInstruction = getChatCommandInstruction(body.command);
  if (commandInstruction) modelMessages = [...modelMessages, { role: 'system', content: commandInstruction }];
  if (webSearchRequested) {
    const searchKey = process.env.TAVILY_API_KEY;
    if (!searchKey?.trim()) {
      return res.status(503).json({ error: 'Web Search needs a TAVILY_API_KEY. Add it to the Vercel Production environment to enable live internet sources.', code: 'WEB_SEARCH_NOT_CONFIGURED' });
    }
    try {
      const requestedQuery = typeof body.searchQuery === 'string' ? body.searchQuery.trim().slice(0, 1000) : '';
      const query = requestedQuery || messages[messages.length - 1].content;
      sources = await searchWeb(query, searchKey);
      modelMessages = addWebSourcesToMessages(modelMessages, sources);
    } catch (error: any) {
      console.error('[chat/stream] web search failed', error?.message || 'Unknown search error');
      return res.status(502).json({ error: 'Live web search failed. Please try again or turn off Web Search.', code: 'WEB_SEARCH_FAILED' });
    }
  }

  const { user, supabase } = context;
  const requestedConversationId = String(body.conversationId || '').trim();
  let conversation: { id: string; title: string; model: string | null };

  if (requestedConversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id,title,model')
      .eq('id', requestedConversationId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: 'Unable to open this conversation.', code: 'CONVERSATION_LOOKUP_FAILED' });
    if (!data) return res.status(404).json({ error: 'Conversation not found.', code: 'CONVERSATION_NOT_FOUND' });
    conversation = data;
  } else {
    const firstPrompt = messages.find((message) => message.role === 'user')?.content || '';
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: createConversationTitle(firstPrompt), model: selected.id })
      .select('id,title,model')
      .single();
    if (error || !data) {
      console.error('[chat/stream] conversation create failed', error);
      return res.status(500).json({ error: 'Unable to create a conversation.', code: 'CONVERSATION_CREATE_FAILED' });
    }
    conversation = data;
  }

  const latestUserMessage = messages[messages.length - 1].content;
  const { error: saveUserError } = await supabase.from('messages').insert({
    conversation_id: conversation.id,
    user_id: user.id,
    role: 'user',
    content: latestUserMessage
  });
  if (saveUserError) {
    console.error('[chat/stream] user message save failed', saveUserError);
    return res.status(500).json({ error: 'Unable to save your message.', code: 'MESSAGE_SAVE_FAILED' });
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  sendEvent(res, { type: 'status', status: 'thinking' });
  sendEvent(res, { type: 'meta', conversationId: conversation.id, modelUsed: selected.id, provider: 'groq', sources });

  let assistantText = '';
  try {
    for await (const text of streamGroqChatCompletion(modelMessages, selected.providerModel, apiKey)) {
      assistantText += text;
      sendEvent(res, { type: 'delta', text });
    }

    if (!assistantText.trim()) {
      sendEvent(res, { type: 'error', error: 'Groq returned an empty response.' });
      return res.end();
    }

    const { error: saveAssistantError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      user_id: user.id,
      role: 'assistant',
      content: assistantText
    });
    if (saveAssistantError) {
      console.error('[chat/stream] assistant message save failed', saveAssistantError);
      sendEvent(res, { type: 'error', error: 'The response was generated but could not be saved.' });
      return res.end();
    }

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString(), model: selected.id })
      .eq('id', conversation.id)
      .eq('user_id', user.id);

    sendEvent(res, { type: 'done', text: assistantText });
    return res.end();
  } catch (error: any) {
    console.error('[chat/stream]', error?.message || 'Groq stream failed');
    sendEvent(res, { type: 'error', error: 'The Groq AI response failed. Please try again.' });
    return res.end();
  }
}
