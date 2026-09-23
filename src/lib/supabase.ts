import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase publishable configuration is intentionally safe to ship to the browser.
// RLS and Supabase Auth enforce access; no service-role secret belongs here.
const SUPABASE_URL = 'https://yanupugtteiyenigotmo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseClient;
}
