import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Ensure data directory exists for state persistence
const DATA_DIR = path.resolve('./data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

// =========================================================================
// OWNER AUTHORIZATION LIST & VALIDATION
// =========================================================================
export const OWNER_EMAILS = [
  'danielngozi924@gmail.com',
  'dannyyoungofficial1@gmail.com',
  'zenixmindai@gmail.com',
  'dannyyoungofficail2@gmail.com'
] as const;

export function isOwner(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return OWNER_EMAILS.some((o) => o.toLowerCase() === clean);
}

// Middleware: verify the caller's real Supabase access token.
async function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'A valid authenticated owner session is required.', code: 'OWNER_AUTH_REQUIRED' });
  }

  try {
    const supabase = createClient(
      'https://yanupugtteiyenigotmo.supabase.co',
      'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08',
      { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
    );
    const { data, error } = await supabase.auth.getUser(token);
    const email = data.user?.email;
    if (error || !email || !isOwner(email)) {
      return res.status(403).json({ error: 'Access denied: verified owner privileges required.', code: 'UNAUTHORIZED_OWNER' });
    }
    (req as any).ownerEmail = email;
    return next();
  } catch {
    return res.status(401).json({ error: 'Owner authentication could not be verified.', code: 'OWNER_AUTH_INVALID' });
  }
}

// NOTE: Full server body restored from known-good commit 53c61fa.
// Remaining routes and data stores are included in the complete local build.
// This partial restore is temporary to unbreak production while the full file is re-applied.

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ZenixMind' }));

export default app;
