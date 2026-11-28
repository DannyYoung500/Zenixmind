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
  const deepThinkRequested = body.deepThink === true;
  const preferences = body.preferences && typeof body.preferences === 'object' ? body.preferences : {};
  if (!researchRequested && !apiKey?.trim()) {
    return res.status(503).json({ error: 'Groq is not configured on the server. Add GROQ_API_KEY to the Production environment.', code: 'GROQ_NOT_CONFIGURED' });
  }
  const searchKey = process.env.TAVILY_API_KEY;
  const requestedQuery = typeof body.searchQuery === 'string' ? body.searchQuery.trim().slice(0, 4000) : '';
  const searchQuery = requestedQuery || messages[messages.length - 1].content;
  let sources: Awaited<ReturnType<typeof searchWeb>> = [];
  let modelMessages = buildZenixMessages(messages);
  const attachment = body.attachment && typeof body.attachment === 'object' ? body.attachment : null;
  let visionRequest = false;
  if (attachment) {
    const attachmentName = typeof attachment.name === 'string' ? attachment.name.slice(0, 180) : 'uploaded file';
    const mimeType = typeof attachment.mimeType === 'string' ? attachment.mimeType.toLowerCase() : '';
    const attachmentText = typeof attachment.text === 'string' ? attachment.text.slice(0, 200000) : '';
    const imageData = typeof attachment.data === 'string' ? attachment.data : '';
    let userMessageIndex = -1;
    for (let index = modelMessages.length - 1; index >= 0; index -= 1) {
      if (modelMessages[index].role === 'user') { userMessageIndex = index; break; }
    }
    if (userMessageIndex >= 0 && attachmentText.trim()) {
      modelMessages[userMessageIndex].content = `${modelMessages[userMessageIndex].content}\n\n[Extracted content from ${attachmentName}]\n${attachmentText}`;
    } else if (userMessageIndex >= 0 && mimeType.startsWith('image/') && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(imageData) && imageData.length <= 12 * 1024 * 1024) {
      modelMessages[userMessageIndex].content = [
        { type: 'text', text: `${modelMessages[userMessageIndex].content}\n\nPlease inspect the attached image and answer the user's question about it. File: ${attachmentName}.` },
        { type: 'image_url', image_url: { url: imageData } }
      ];
      visionRequest = true;
    } else if (mimeType === 'application/pdf') {
      return res.status(415).json({ error: 'PDF reading is not enabled yet. You can still keep the PDF in My stuff, or upload its text as a .txt or .md file for analysis.', code: 'PDF_TEXT_EXTRACTION_UNAVAILABLE' });
    } else {
      return res.status(415).json({ error: 'This attachment could not be read. Please upload a text document or a supported image.', code: 'ATTACHMENT_UNSUPPORTED' });
    }
  }
  if (deepThinkRequested) modelMessages = [...modelMessages, { role: 'system', content: 'For this response, use a deliberate problem-solving approach: identify the question, consider relevant alternatives and edge cases, verify calculations and assumptions, and produce a complete, well-structured answer with a concise conclusion. Do not reveal private chain-of-thought or claim to expose hidden reasoning; provide useful conclusions and a brief explanation of the approach.' }];
  const customInstructions = typeof preferences.customInstructions === 'string' ? preferences.customInstructions.trim().slice(0, 4000) : '';
  if (customInstructions) modelMessages = [...modelMessages, { role: 'system', content: `User response preferences (follow when compatible with safety and the request): ${customInstructions}` }];
  const responseLength = typeof preferences.responseLength === 'string' ? preferences.responseLength : 'Adaptive';
  if (['Concise', 'Detailed', 'Thorough'].includes(responseLength)) modelMessages = [...modelMessages, { role: 'system', content: `Preferred response detail: ${responseLength}.` }];
  const settingsContext = [
    typeof preferences.personality === 'string' ? `Tone: ${preferences.personality}` : '',
    typeof preferences.theme === 'string' ? `Appearance theme: ${preferences.theme}` : '',
    typeof preferences.accent === 'string' ? `Accent color: ${preferences.accent}` : '',
    typeof preferences.onlineSearch === 'boolean' ? `Online Search preference: ${preferences.onlineSearch ? 'enabled' : 'disabled'}` : '',
    typeof preferences.memory === 'boolean' ? `Memory preference: ${preferences.memory ? 'enabled' : 'disabled'}` : '',
    typeof preferences.language === 'string' ? `Preferred response language: ${preferences.language}` : '',
    typeof preferences.activeView === 'string' ? `Current workspace view: ${preferences.activeView}` : '',
    `Temporary Chat request: ${body.temporaryChat === true ? 'enabled' : 'disabled'}`,
    typeof body.model === 'string' ? `Selected model: ${body.model}` : ''
  ].filter(Boolean).join('; ');
  if (settingsContext) modelMessages = [...modelMessages, { role: 'system', content: `Current user-visible ZenixMind preferences for answering product-help questions: ${settingsContext}. These values are context only; do not change them or claim they were changed.` }];
  const preferredLanguage = typeof preferences.language === 'string' ? preferences.language.trim() : '';
  if (preferredLanguage && preferredLanguage !== 'Auto') {
    modelMessages = [...modelMessages, { role: 'system', content: `Answer in ${preferredLanguage} by default unless the user asks for another language or the task requires exact original-language text.` }];
  }
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
  const requestedProjectId = typeof body.projectId === 'string' ? body.projectId.trim().slice(0, 100) : '';
  const temporaryChat = body.temporaryChat === true;
  let projectId = requestedProjectId || null;
  let projectName = '';
  let projectDescription = '';
  let projectInstructions = '';
  let conversation: { id: string; title: string; model: string | null; project_id: string | null } | null = null;

  const loadProjectContext = async (id: string) => {
    const { data, error } = await supabase.from('projects')
      .select('id,name,description,instructions')
      .eq('id', id).eq('user_id', user.id).maybeSingle();
    if (error) return { error: 'PROJECT_LOOKUP_FAILED' as const };
    if (!data) return { error: 'PROJECT_NOT_FOUND' as const };
    projectName = data.name || 'Project';
    projectDescription = String(data.description || '').trim().slice(0, 500);
    projectInstructions = String(data.instructions || '').trim().slice(0, 4000);
    return { error: null };
  };

  if (projectId) {
    const projectResult = await loadProjectContext(projectId);
    if (projectResult.error === 'PROJECT_LOOKUP_FAILED') return res.status(500).json({ error: 'Unable to load this project.', code: projectResult.error });
    if (projectResult.error === 'PROJECT_NOT_FOUND') return res.status(404).json({ error: 'Project not found.', code: projectResult.error });
  }

  if (!temporaryChat && requestedConversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('id,title,model,project_id')
      .eq('id', requestedConversationId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: 'Unable to open this conversation.', code: 'CONVERSATION_LOOKUP_FAILED' });
    if (!data) return res.status(404).json({ error: 'Conversation not found.', code: 'CONVERSATION_NOT_FOUND' });
    if (projectId && data.project_id && data.project_id !== projectId) {
      return res.status(409).json({ error: 'This chat belongs to a different project.', code: 'PROJECT_CONVERSATION_MISMATCH' });
    }
    if (!projectId && data.project_id) projectId = data.project_id;
    if (projectId && !data.project_id) {
      const { error: attachError } = await supabase.from('conversations')
        .update({ project_id: projectId })
        .eq('id', data.id).eq('user_id', user.id);
      if (attachError) return res.status(500).json({ error: 'Unable to add this chat to the project.', code: 'PROJECT_ASSIGN_FAILED' });
    }
    conversation = { ...data, project_id: projectId };
  } else if (!temporaryChat) {
    const firstPrompt = messages.find((message) => message.role === 'user')?.content || '';
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: createConversationTitle(firstPrompt), model: selected.id, project_id: projectId })
      .select('id,title,model,project_id')
      .single();
    if (error || !data) {
      console.error('[chat/stream] conversation create failed', error);
      return res.status(500).json({ error: 'Unable to create a conversation.', code: 'CONVERSATION_CREATE_FAILED' });
    }
    conversation = data;
  }

  if (projectId && !projectName) {
    const projectResult = await loadProjectContext(projectId);
    if (projectResult.error === 'PROJECT_LOOKUP_FAILED') return res.status(500).json({ error: 'Unable to load this project.', code: projectResult.error });
    if (projectResult.error === 'PROJECT_NOT_FOUND') return res.status(404).json({ error: 'Project not found.', code: projectResult.error });
  }
  if (projectId) {
    const projectContext = [
      `Active project: ${projectName}.`,
      projectDescription ? `Project description: ${projectDescription}` : '',
      projectInstructions ? `Project-specific instructions (follow unless they conflict with higher-priority instructions or the user's current request): ${projectInstructions}` : ''
    ].filter(Boolean).join('\n');
    modelMessages = [...modelMessages, { role: 'system', content: projectContext }];
  }

  const latestUserMessage = messages[messages.length - 1].content;
  if (!temporaryChat && conversation) {
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
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  sendEvent(res, { type: 'status', status: researchRequested ? 'researching' : webSearchRequested ? 'searching' : deepThinkRequested ? 'preparing' : 'thinking' });
  sendEvent(res, { type: 'meta', conversationId: conversation?.id ?? null, projectId, modelUsed: researchRequested ? 'Tavily Research' : visionRequest ? 'Zenix Vision' : selected.id, provider: researchRequested ? 'tavily' : 'groq', research: researchRequested, vision: visionRequest, temporaryChat, sources });

  let assistantText = '';
  try {
    if (researchRequested) {
      await streamTavilyResearch([searchQuery, projectDescription ? `Project context: ${projectDescription}` : '', projectInstructions ? `Project instructions: ${projectInstructions}` : ''].filter(Boolean).join('\n\n'), searchKey!, {
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
      sendEvent(res, { type: 'status', status: 'generating' });
      const providerModel = visionRequest ? 'qwen/qwen3.8-27b' : selected.providerModel;
      for await (const text of streamGroqChatCompletion(modelMessages, providerModel, apiKey!)) {
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

    if (!temporaryChat && conversation) {
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
    }

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
