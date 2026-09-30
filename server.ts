import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '25mb' }));

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'zenixmind-data') : path.resolve('./data');
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}

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

function loadJsonFile<T>(name: string, fallback: T): T {
  try {
    const p = path.join(DATA_DIR, name);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {}
  return fallback;
}

function saveJsonFile(name: string, data: any) {
  try {
    fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('[save]', name, e);
  }
}

async function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'A valid authenticated owner session is required.', code: 'OWNER_AUTH_REQUIRED' });
  }
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || 'https://yanupugtteiyenigotmo.supabase.co',
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_RtQLIcHO5Xch8JkcdGPW4g_Oatf4t08',
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

const rateLimitConfig = loadJsonFile('rate_limits.json', {
  autoThrottleOnBudget: true,
  burstMultiplier: 1.5,
  tiers: {
    Free: { rpm: 20, tpm: 40000, dailyTokens: 100000, maxConcurrent: 2, modelAccess: ['gemini-2.5-flash'] },
    Pro: { rpm: 80, tpm: 200000, dailyTokens: 2000000, maxConcurrent: 6, modelAccess: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
    Enterprise: { rpm: 300, tpm: 1000000, dailyTokens: 25000000, maxConcurrent: 25, modelAccess: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
    Owner: { rpm: 1000, tpm: 5000000, dailyTokens: 100000000, maxConcurrent: 100, modelAccess: ['gemini-2.5-flash', 'gemini-2.5-pro'] }
  }
});

const featureFlags = loadJsonFile('feature_flags.json', {
  voiceMode: true,
  webSearch: true,
  visionImageGen: true,
  memoryPersistence: true,
  deepReasoning: true,
  codeExecution: true,
  experimentalModels: false
});

const broadcastBanners: any[] = loadJsonFile('broadcasts.json', []);
const memoryRecords: any[] = loadJsonFile('memory.json', []);
const auditLogs: any[] = loadJsonFile('audit_logs.json', []);
const activeSessions: any[] = loadJsonFile('sessions.json', []);

const telemetry = {
  totalRequests: 0,
  inputTokens: 0,
  outputTokens: 0,
  voiceMinutes: 0,
  voiceSessions: 0,
  webSearches: 0,
  totalLatencyMs: 0,
  modelUsage: {} as Record<string, any>
};

function recordAuditLog(
  actor: string,
  action: string,
  target: string,
  result: string,
  details?: any,
  beforeAfter?: any,
  category?: string,
  req?: express.Request
) {
  const log = {
    id: 'aud_' + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    actor: actor || 'system',
    action,
    target,
    result,
    category: category || 'SYSTEM',
    details,
    beforeAfter,
    ipAddress: (req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req?.ip
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 2000) auditLogs.pop();
  saveJsonFile('audit_logs.json', auditLogs);
  return log;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ZenixMind', time: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model } = req.body || {};
    telemetry.totalRequests += 1;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        code: 'AI_NOT_CONFIGURED'
      });
    }
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const modelId = model || 'gemini-2.5-flash';
    const history = Array.isArray(messages) ? messages : [];
    const contents = history.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || m.text || '') }]
    }));
    const start = Date.now();
    const result = await ai.models.generateContent({
      model: modelId,
      contents: contents.length ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });
    const text =
      (result as any).text ||
      (result as any).candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ||
      '';
    const latency = Date.now() - start;
    telemetry.totalLatencyMs += latency;
    const usage = (result as any).usageMetadata || {};
    const inTok = Number(usage.promptTokenCount || 0);
    const outTok = Number(usage.candidatesTokenCount || 0);
    telemetry.inputTokens += inTok;
    telemetry.outputTokens += outTok;
    if (!telemetry.modelUsage[modelId]) {
      telemetry.modelUsage[modelId] = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    }
    telemetry.modelUsage[modelId].requests += 1;
    telemetry.modelUsage[modelId].inputTokens += inTok;
    telemetry.modelUsage[modelId].outputTokens += outTok;
    return res.json({
      message: { role: 'assistant', content: text },
      model: modelId,
      latencyMs: latency,
      usage: { inputTokens: inTok, outputTokens: outTok }
    });
  } catch (err: any) {
    console.error('[chat]', err);
    return res.status(500).json({ error: err?.message || 'Chat failed' });
  }
});

app.get('/api/admin/usage', requireOwner, (_req, res) => {
  const modelUsage = telemetry.modelUsage || {};
  let estimatedAiCostUSD = 0;
  const enriched: Record<string, any> = {};
  for (const [modelId, usage] of Object.entries(modelUsage)) {
    const u: any = usage;
    const cost = Number(u.cost || 0);
    estimatedAiCostUSD += cost;
    enriched[modelId] = {
      ...u,
      totalTokens: Number(u.inputTokens || 0) + Number(u.outputTokens || 0),
      cost,
      modelName: modelId,
      provider: 'google'
    };
  }
  return res.json({
    totalRequests: telemetry.totalRequests,
    inputTokens: telemetry.inputTokens,
    outputTokens: telemetry.outputTokens,
    totalTokens: telemetry.inputTokens + telemetry.outputTokens,
    estimatedAiCostUSD,
    voiceMinutes: telemetry.voiceMinutes,
    voiceSessions: telemetry.voiceSessions,
    webSearches: telemetry.webSearches,
    modelUsage: enriched,
    providerBreakdown: Object.values(enriched).reduce((acc: any[], item: any) => {
      const existing = acc.find((p) => p.provider === item.provider);
      if (existing) {
        existing.requestCount += item.requests || 0;
        existing.inputTokens += item.inputTokens || 0;
        existing.outputTokens += item.outputTokens || 0;
        existing.totalCost += item.cost || 0;
      } else {
        acc.push({
          provider: item.provider,
          displayName: item.provider,
          requestCount: item.requests || 0,
          inputTokens: item.inputTokens || 0,
          outputTokens: item.outputTokens || 0,
          totalCost: item.cost || 0
        });
      }
      return acc;
    }, []),
    costNotice: 'Runtime telemetry only.'
  });
});

app.get('/api/admin/rate-limits', requireOwner, (_req, res) => {
  return res.json({ rateLimits: rateLimitConfig });
});

app.post('/api/admin/rate-limits', requireOwner, (req, res) => {
  const { updates, updatedBy } = req.body || {};
  Object.assign(rateLimitConfig, updates || {});
  saveJsonFile('rate_limits.json', rateLimitConfig);
  recordAuditLog(updatedBy || 'owner', 'UPDATE_RATE_LIMITS_CONFIG', 'rate_limits', 'SUCCESS', updates);
  return res.json({ success: true, rateLimits: rateLimitConfig });
});

app.get('/api/admin/feature-flags', requireOwner, (_req, res) => {
  return res.json({ flags: featureFlags });
});

app.post('/api/admin/feature-flags', requireOwner, (req, res) => {
  const { updates, updatedBy } = req.body || {};
  Object.assign(featureFlags, updates || {});
  saveJsonFile('feature_flags.json', featureFlags);
  recordAuditLog(updatedBy || 'owner', 'UPDATE_FEATURE_FLAGS', 'feature_flags', 'SUCCESS', updates);
  return res.json({ success: true, flags: featureFlags });
});

app.get('/api/admin/memory', requireOwner, (_req, res) => {
  return res.json({ records: memoryRecords, count: memoryRecords.length });
});

app.post('/api/admin/memory/clear', requireOwner, (req, res) => {
  const count = memoryRecords.length;
  memoryRecords.length = 0;
  saveJsonFile('memory.json', memoryRecords);
  recordAuditLog(req.body?.updatedBy || 'owner', 'PURGE_MEMORY_STORE', 'all_records', 'WARN', { count });
  return res.json({ success: true, message: 'Memory records purged.' });
});

app.get('/api/admin/broadcasts', requireOwner, (_req, res) => {
  return res.json({ broadcasts: broadcastBanners, activeAnnouncement: null });
});

app.post('/api/admin/broadcasts', requireOwner, (req, res) => {
  const { title, message, type = 'info', targetTier = 'ALL', dismissible = true, actionLabel, actionUrl, updatedBy } = req.body || {};
  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Title and message are required' });
  }
  const banner = {
    id: 'bc-' + Date.now(),
    title: title.trim(),
    message: message.trim(),
    type,
    targetTier,
    active: true,
    dismissible: Boolean(dismissible),
    actionLabel: actionLabel?.trim() || undefined,
    actionUrl: actionUrl?.trim() || undefined,
    createdAt: new Date().toISOString()
  };
  broadcastBanners.unshift(banner);
  saveJsonFile('broadcasts.json', broadcastBanners);
  recordAuditLog(updatedBy || 'owner', 'CREATE_BROADCAST', banner.title, 'SUCCESS', { id: banner.id });
  return res.status(201).json({ success: true, broadcast: banner, broadcasts: broadcastBanners });
});

app.post('/api/admin/broadcasts/:id/toggle', requireOwner, (req, res) => {
  const b = broadcastBanners.find((x) => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: 'Not found' });
  b.active = !b.active;
  saveJsonFile('broadcasts.json', broadcastBanners);
  recordAuditLog(req.body?.updatedBy || 'owner', 'TOGGLE_BROADCAST', b.title, 'SUCCESS', { active: b.active });
  return res.json({ success: true, broadcast: b });
});

app.get('/api/broadcasts/active', (_req, res) => {
  return res.json({
    activeAnnouncement: null,
    activeBanners: broadcastBanners.filter((b) => b.active)
  });
});

app.get('/api/admin/audit-log', requireOwner, (req, res) => {
  let filtered = [...auditLogs];
  const category = String(req.query.category || 'ALL');
  const result = String(req.query.result || 'ALL');
  const exportFormat = String(req.query.exportFormat || '');
  if (category !== 'ALL') filtered = filtered.filter((l) => l.category === category);
  if (result !== 'ALL') filtered = filtered.filter((l) => l.result === result);
  if (exportFormat === 'csv') {
    const csvHeader = 'ID,Timestamp,Actor,Action,Target,Result,Category,IPAddress\n';
    const csvRows = filtered
      .map((l) => `"${l.id}","${l.timestamp}","${l.actor}","${l.action}","${l.target}","${l.result}","${l.category || ''}","${l.ipAddress || ''}"`)
      .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="zenixmind-audit.csv"');
    return res.send(csvHeader + csvRows);
  }
  const maxItems = Math.min(parseInt(String(req.query.limit || '200'), 10) || 200, 1000);
  return res.json({
    logs: filtered.slice(0, maxItems),
    totalCount: auditLogs.length,
    filteredCount: filtered.length,
    stats: {
      total: auditLogs.length,
      success: auditLogs.filter((l) => l.result === 'SUCCESS').length,
      warn: auditLogs.filter((l) => l.result === 'WARN').length,
      error: auditLogs.filter((l) => l.result === 'ERROR').length,
      categories: {}
    }
  });
});

app.get('/api/admin/security', requireOwner, (_req, res) => {
  const activeCount = activeSessions.filter((s) => s.status !== 'revoked').length;
  return res.json({ activeSessions: activeCount, sessions: activeSessions });
});

app.get('/api/admin/security/monitor', requireOwner, (_req, res) => {
  return res.json({
    sessions: activeSessions,
    active: activeSessions.filter((s) => s.status === 'active').length
  });
});

app.post('/api/admin/security/sessions/revoke', requireOwner, (req, res) => {
  const { sessionId, allExceptCurrent, reason, updatedBy } = req.body || {};
  if (allExceptCurrent) {
    let count = 0;
    activeSessions.forEach((s) => {
      if (!s.isCurrent && s.status !== 'revoked') {
        s.status = 'revoked';
        count++;
      }
    });
    saveJsonFile('sessions.json', activeSessions);
    recordAuditLog(updatedBy || 'owner', 'REVOKE_ALL_SESSIONS_BULK', 'all_except_current', 'WARN', { count, reason }, undefined, 'SECURITY', req);
    return res.json({ success: true, message: `Terminated ${count} active session(s).`, revokedCount: count, sessions: activeSessions });
  }
  if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });
  const session = activeSessions.find((s) => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found.' });
  session.status = 'revoked';
  saveJsonFile('sessions.json', activeSessions);
  recordAuditLog(updatedBy || 'owner', 'REVOKE_USER_SESSION', session.userEmail, 'WARN', { sessionId, reason }, undefined, 'SECURITY', req);
  return res.json({ success: true, message: `Session ${session.id} revoked.`, session, sessions: activeSessions });
});

app.get('/api/admin/overview', requireOwner, (_req, res) => {
  return res.json({
    ok: true,
    usersApprox: 0,
    totalRequests: telemetry.totalRequests,
    activeSessions: activeSessions.filter((s) => s.status === 'active').length,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString()
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    } catch {
      const distPath = path.resolve('./dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const distPath = path.resolve('./dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[ZenixMind] Engine listening at http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
