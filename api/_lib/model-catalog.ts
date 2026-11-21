import { createClient } from '@supabase/supabase-js';

export type ZenixModelId =
  | 'zenix-auto'
  | 'zenix-lite'
  | 'zenix-4.6-fast'
  | 'zenix-4.6-pro'
  | 'zenix-4.6-reason'
  | 'zenix-4.6-build';

type ModelDefinition = {
  id: ZenixModelId;
  name: string;
  tag: string;
  description: string;
  access: 'free' | 'paid';
  available: boolean;
  provider: 'groq';
  badge: 'ZenixMind';
};

export const ZENIX_MODELS: ModelDefinition[] = [
  { id: 'zenix-auto', name: 'Zenix Auto', tag: 'Adaptive', description: 'Automatically selects the strongest currently available ZenixMind engine.', access: 'free', available: true, provider: 'groq', badge: 'ZenixMind' },
  { id: 'zenix-lite', name: 'Zenix Lite', tag: 'Lightweight', description: 'A lightweight assistant for everyday questions and quick tasks.', access: 'free', available: true, provider: 'groq', badge: 'ZenixMind' },
  { id: 'zenix-4.6-fast', name: 'Zenix 4.6 Fast', tag: 'Fast', description: 'Fast responses for everyday work and building.', access: 'free', available: true, provider: 'groq', badge: 'ZenixMind' },
  { id: 'zenix-4.6-pro', name: 'Zenix 4.6 Pro', tag: 'Pro', description: 'Premium model tier. Billing and provider integration are not enabled yet.', access: 'paid', available: false, provider: 'groq', badge: 'ZenixMind' },
  { id: 'zenix-4.6-reason', name: 'Zenix 4.6 Reason', tag: 'Reasoning', description: 'Premium reasoning tier. Billing and provider integration are not enabled yet.', access: 'paid', available: false, provider: 'groq', badge: 'ZenixMind' },
  { id: 'zenix-4.6-build', name: 'Zenix 4.6 Build', tag: 'Build', description: 'Premium coding and build tier. Billing and provider integration are not enabled yet.', access: 'paid', available: false, provider: 'groq', badge: 'ZenixMind' }
];

const GROQ_MODEL_BY_ZENIX_ID: Record<ZenixModelId, string> = {
  'zenix-auto': 'openai/gpt-oss-120b',
  'zenix-lite': 'openai/gpt-oss-20b',
  'zenix-4.6-fast': 'openai/gpt-oss-20b',
  'zenix-4.6-pro': 'openai/gpt-oss-120b',
  'zenix-4.6-reason': 'openai/gpt-oss-120b',
  'zenix-4.6-build': 'openai/gpt-oss-120b'
};

export function resolveAvailableModel(id: unknown): { id: ZenixModelId; providerModel: string } | null {
  const selected = typeof id === 'string' && id.trim() ? id.trim() : 'zenix-auto';
  const definition = ZENIX_MODELS.find((item) => item.id === selected);
  if (!definition || !definition.available || definition.access !== 'free') return null;
  return { id: definition.id, providerModel: GROQ_MODEL_BY_ZENIX_ID[definition.id] };
}

export function validateChatMessages(value: unknown): Array<{ role: 'user' | 'assistant'; content: string }> | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 60) return null;
  const result: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  let totalLength = 0;
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const role = (item as any).role;
    const raw = (item as any).content ?? (item as any).text;
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof raw !== 'string') return null;
    const content = raw.trim();
    if (!content || content.length > 16000) return null;
    totalLength += content.length;
    if (totalLength > 80000) return null;
    result.push({ role, content });
  }
  return result;
}

export async function verifySupabaseAccessToken(authorization?: string): Promise<{ id: string; email?: string } | null> {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) return null;
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yanupugtteiyenigotmo.supabase.co';
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08';
  try {
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email || undefined };
  } catch {
    return null;
  }
}
