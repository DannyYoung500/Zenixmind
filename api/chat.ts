import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveAvailableModel, validateChatMessages } from './_lib/model-catalog.ts';
import { createGroqChatCompletion } from './_lib/groq-client.ts';
import { buildZenixMessages } from './_lib/zenix-system-prompt.ts';
import { handleAutomationsRequest } from './_lib/automations-handler.ts';
import { handleStatusRequest } from './_lib/status-handler.ts';
import {
  deleteConversations,
  exportConversations,
  getChatContext,
  getConversation,
  listConversations
} from './_lib/chat-store.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const action = String(req.query.action || '');
  if (action === 'automations') return handleAutomationsRequest(req, res);
  if (action === 'status') return handleStatusRequest(req, res);

  const context = await getChatContext(req.headers.authorization);
  if (!context) {
    return res.status(401).json({ error: 'Sign in to access your conversations.', code: 'AUTH_REQUIRED' });
  }

  const { user, supabase } = context;

  if (req.method === 'GET') {
    if (String(req.query.export || '') === '1') {
      const exported = await exportConversations(supabase, user.id);
      if (exported.error) return res.status(500).json({ error: 'Unable to export chat history.', code: 'CHAT_EXPORT_FAILED' });
      return res.status(200).json(exported.data);
    }

    const conversationId = String(req.query.conversation_id || '').trim();
    if (conversationId) {
      const result = await getConversation(supabase, user.id, conversationId);
      if (result.error) return res.status(500).json({ error: 'Unable to load this conversation.', code: 'CHAT_LOAD_FAILED' });
      if (!result.conversation) return res.status(404).json({ error: 'Conversation not found.', code: 'CONVERSATION_NOT_FOUND' });
      return res.status(200).json({ conversation: result.conversation, messages: result.messages || [] });
    }

    const { data, error } = await listConversations(supabase, user.id);
    if (error) return res.status(500).json({ error: 'Unable to load conversation history.', code: 'CHAT_HISTORY_FAILED' });
    return res.status(200).json({ conversations: data || [] });
  }

  if (req.method === 'DELETE') {
    const conversationId = String(req.query.conversation_id || '').trim();
    const { error } = await deleteConversations(supabase, user.id, conversationId || undefined);
    if (error) return res.status(500).json({ error: 'Unable to delete conversation history.', code: 'CHAT_DELETE_FAILED' });
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const selected = resolveAvailableModel(body.model);
    if (!selected) {
      return res.status(403).json({
        error: 'This model is not available on your current plan. Premium model access will be enabled after billing is configured.',
        code: 'MODEL_NOT_ENTITLED'
      });
    }
    const messages = validateChatMessages(body.messages);
    if (!messages) {
      return res.status(400).json({
        error: 'Messages must contain 1–60 valid user or assistant messages (maximum 80,000 characters).',
        code: 'INVALID_MESSAGES'
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey?.trim()) {
      return res.status(503).json({ error: 'Groq is not configured on the server. Add GROQ_API_KEY to the Production environment.', code: 'GROQ_NOT_CONFIGURED' });
    }

    const start = Date.now();
    const result = await createGroqChatCompletion(buildZenixMessages(messages), selected.providerModel, apiKey);
    return res.status(200).json({
      message: { role: 'assistant', content: result.text },
      model: selected.id,
      provider: 'groq',
      latencyMs: Date.now() - start,
      usage: result.usage
    });
  } catch (error: any) {
    console.error('[api/chat]', error?.message || 'Groq chat request failed');
    return res.status(502).json({ error: 'Groq chat request failed. Check provider availability and try again.', code: 'GROQ_CHAT_FAILED' });
  }
}
