import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAvailableModel, validateChatMessages } from '../_lib/model-catalog.ts';
import { createConversationTitle } from '../_lib/chat-utils.ts';
import { streamGroqChatCompletion } from '../_lib/groq-client.ts';
import { buildZenixMessages } from '../_lib/zenix-system-prompt.ts';
import { getChatContext } from '../_lib/chat-store.ts';
import { addWebSourcesToMessages, appendWebSourceReferences, searchWeb, streamTavilyResearch } from '../_lib/web-search.ts';
import { getChatCommandInstruction } from '../_lib/chat-command-instructions.ts';

function sendEvent(res: VercelResponse, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export const config = { maxDuration: 60 };

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
  const webSearchRequested = body.webSearch === true;
  const researchRequested = body.research === true;
  if (!researchRequested && !apiKey?.trim()) {
    return res.status(503).json({ error: 'Groq is not configured on the server. Add GROQ_API_KEY to the Production environment.', code: 'GROQ_NOT_CONFIGURED' });
  }
  const searchKey = process.env.TAVILY_API_KEY;
  const requestedQuery = typeof body.searchQuery === 'string' ? body.searchQuery.trim().slice(0, 4000) : '';
  const searchQuery = requestedQuery || messages[messages.length - 1].content;
  let sources: Awaited<ReturnType<typeof searchWeb>> = [];
  let modelMessages = buildZenixMessages(messages);
  const commandInstruction = getChatCommandInstruction(body.command);
  if (commandInstruction) modelMessages = [...modelMessages, { role: 'system', content: commandInstruction }];
  if ((webSearchRequested || researchRequested) && !searchKey?.trim()) {
    return res.status(503).json({
      error: 'Web Search and Deep Research need TAVILY_API_KEY. Add it to the Vercel Production environment to enable live research.',
      code: 'WEB_SEARCH_NOT_CONFIGURED'
    });
  }
  if (webSearchRequested && !researchRequested) {
    try {
      sources = await searchWeb(searchQuery, searchKey!);
      modelMessages = addWebSourcesToMessages(modelMessages, sources);
    } catch (error: any) {
      console.error('[chat/stream] web search failed', error?.message || 'Unknown search error');
      return res.status(error?.message === 'WEB_SEARCH_RATE_LIMITED' ? 429 : 502).json({
        error: error?.message === 'WEB_SEARCH_RATE_LIMITED'
          ? 'Web Search is temporarily rate-limited. Please wait a moment and try again.'
          : 'Live web search failed. Please try again or turn off Web Search.',
        code: error?.message === 'WEB_SEARCH_RATE_LIMITED' ? 'WEB_SEARCH_RATE_LIMITED' : 'WEB_SEARCH_FAILED'
      });
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
  sendEvent(res, { type: 'status', status: researchRequested ? 'researching' : 'thinking' });
  sendEvent(res, { type: 'meta', conversationId: conversation.id, modelUsed: researchRequested ? 'Tavily Research' : selected.id, provider: researchRequested ? 'tavily' : 'groq', research: researchRequested, sources });

  let assistantText = '';
  try {
    if (researchRequested) {
      await streamTavilyResearch(searchQuery, searchKey!, {
        onStatus: (status) => sendEvent(res, { type: 'status', status }),
        onContent: (text) => {
          assistantText += text;
          sendEvent(res, { type: 'delta', text });
        },
        onSources: (researchSources) => {
          sources = researchSources;
          sendEvent(res, { type: 'sources', sources: researchSources });
        }
      });
    } else {
      for await (const text of streamGroqChatCompletion(modelMessages, selected.providerModel, apiKey!)) {
        assistantText += text;
        sendEvent(res, { type: 'delta', text });
      }
    }

    if (assistantText.trim() && sources.length) {
      const withReferences = appendWebSourceReferences(assistantText, sources);
      if (withReferences !== assistantText) {
        const references = withReferences.slice(assistantText.length);
        assistantText = withReferences;
        sendEvent(res, { type: 'delta', text: references });
      }
    }

    if (!assistantText.trim()) {
      sendEvent(res, { type: 'error', error: researchRequested ? 'Tavily returned an empty research report.' : 'Groq returned an empty response.' });
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
    console.error('[chat/stream]', error?.message || (researchRequested ? 'Tavily research failed' : 'Groq stream failed'));
    sendEvent(res, { type: 'error', error: researchRequested
      ? 'Deep Research could not complete. Check your Tavily key and credits, then try again.'
      : 'The Groq AI response failed. Please try again.' });
    return res.end();
  }
}
