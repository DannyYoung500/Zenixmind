import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface OverviewPayload {
  ok: boolean;
  time: string;
  commit: string | null;
  region: string | null;
  geminiConfigured: boolean;
  supabaseConfigured: boolean;
  serviceRoleConfigured: boolean;
  ownerEmail: string;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
}

export function OwnerSystemPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatProbe, setChatProbe] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch('/api/admin/overview', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Owner session required.' : `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData(await res.json());

      // Lightweight chat route probe (no auth)
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] })
      });
      const chatBody = await chatRes.json().catch(() => ({}));
      if (chatRes.ok) setChatProbe('Chat route healthy');
      else if (chatBody.code === 'AI_NOT_CONFIGURED')
        setChatProbe('Chat route up · GEMINI_API_KEY missing');
      else setChatProbe(`Chat route error (${chatRes.status})`);
    } catch {
      setError('Could not load system overview.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (user && isOwnerEmail(user.email)) void load();
  }, [user, load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050506] grid place-items-center">
        <div className="h-7 w-7 rounded-full border-2 border-white/10 border-t-white/80 animate-spin" />
      </div>
    );
  }
  if (!user || !isOwnerEmail(user.email)) return <Navigate to="/owner" replace />;

  return (
    <OwnerShell title="System Health" badge="Runtime">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
              <Server size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Platform health</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Config checks, region, commit, and chat route probe.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/status"
              className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#121218] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Public status <ExternalLink size={12} />
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#121218] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric
            label="Gemini"
            value={data?.geminiConfigured ? 'Ready' : 'Missing'}
            ok={data?.geminiConfigured}
          />
          <Metric
            label="Service role"
            value={data?.serviceRoleConfigured ? 'Ready' : 'Missing'}
            ok={data?.serviceRoleConfigured}
          />
          <Metric label="Region" value={data?.region || '—'} />
          <Metric
            label="Commit"
            value={data?.commit ? data.commit.slice(0, 7) : '—'}
          />
        </div>

        {chatProbe && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs flex items-center gap-2 ${
              chatProbe.includes('healthy')
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                : chatProbe.includes('missing')
                  ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                  : 'border-red-400/30 bg-red-500/10 text-red-200'
            }`}
          >
            {chatProbe.includes('healthy') ? (
              <CheckCircle2 size={14} />
            ) : chatProbe.includes('missing') ? (
              <AlertTriangle size={14} />
            ) : (
              <XCircle size={14} />
            )}
            {chatProbe}
          </div>
        )}

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[.06] text-sm font-semibold text-white">Checks</div>
          <ul className="divide-y divide-white/[.04]">
            {(data?.checks || []).map((c) => (
              <li key={c.name} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="capitalize text-white">{c.name.replace(/_/g, ' ')}</span>
                <span className="flex items-center gap-2 text-xs text-zinc-400">
                  {c.detail}
                  {c.ok ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : (
                    <XCircle size={15} className="text-red-400" />
                  )}
                </span>
              </li>
            ))}
            {!data && !error && (
              <li className="px-4 py-8 text-center text-xs text-zinc-500">{busy ? 'Loading…' : '—'}</li>
            )}
          </ul>
        </div>

        {!data?.geminiConfigured && (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[.08] p-4 text-xs text-amber-100 leading-relaxed">
            <p className="font-semibold text-amber-200">Action required</p>
            <p className="mt-1 text-amber-100/80">
              Add <code className="font-mono text-[11px]">GEMINI_API_KEY</code> in Vercel → Settings →
              Environment Variables, then redeploy. Until then, chat returns{' '}
              <code className="font-mono text-[11px]">AI_NOT_CONFIGURED</code>.
            </p>
          </div>
        )}
      </div>
    </OwnerShell>
  );
}

function Metric({
  label,
  value,
  ok
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div
        className={`mt-1 text-lg font-light ${
          ok === true ? 'text-emerald-300' : ok === false ? 'text-amber-300' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default OwnerSystemPage;
