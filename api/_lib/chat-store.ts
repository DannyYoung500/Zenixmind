import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { verifySupabaseAccessToken } from './model-catalog.ts';

export interface ChatUser {
  id: string;
  email?: string;
}

export interface ChatContext {
  user: ChatUser;
  supabase: SupabaseClient;
}

function getSupabaseConfig() {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://yanupugtteiyenigotmo.supabase.co';
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08';
  return { url, key };
}

export async function getChatContext(authorization?: string): Promise<ChatContext | null> {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;

  const user = await verifySupabaseAccessToken(authorization);
  if (!user) return null;

  const { url, key } = getSupabaseConfig();
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });

  return { user, supabase };
}

export async function listConversations(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('conversations')
    .select('id,title,model,project_id,created_at,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(200);
}

export async function getConversation(supabase: SupabaseClient, userId: string, conversationId: string) {
  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id,title,model,created_at,updated_at')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return { conversation: null, messages: null, error: conversationError };
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id,role,content,created_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(2000);

  return { conversation, messages: messages || [], error: messagesError };
}

export async function deleteConversations(
  supabase: SupabaseClient,
  userId: string,
  conversationId?: string
) {
  let attachmentsQuery = supabase.from('attachments').delete().eq('user_id', userId);
  let messagesQuery = supabase.from('messages').delete().eq('user_id', userId);
  let conversationsQuery = supabase.from('conversations').delete().eq('user_id', userId);

  if (conversationId) {
    attachmentsQuery = attachmentsQuery.eq('conversation_id', conversationId);
    messagesQuery = messagesQuery.eq('conversation_id', conversationId);
    conversationsQuery = conversationsQuery.eq('id', conversationId);
  }

  const attachments = await attachmentsQuery;
  if (attachments.error) return attachments;
  const messages = await messagesQuery;
  if (messages.error) return messages;
  return conversationsQuery;
}

export async function exportConversations(supabase: SupabaseClient, userId: string) {
  const { data: conversations, error: conversationsError } = await listConversations(supabase, userId);
  if (conversationsError) return { data: null, error: conversationsError };

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id,conversation_id,role,content,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(10000);

  if (messagesError) return { data: null, error: messagesError };

  return {
    data: {
      exportedAt: new Date().toISOString(),
      conversations: conversations || [],
      messages: (messages || []).reduce((grouped: Record<string, any[]>, message: any) => {
        (grouped[message.conversation_id] ||= []).push(message);
        return grouped;
      }, {})
    },
    error: null
  };
}
