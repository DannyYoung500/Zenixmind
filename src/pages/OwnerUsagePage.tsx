import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import { BarChart3, RefreshCw, Cpu, Mic, Globe, DollarSign } from 'lucide-react';

interface UsagePayload {
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedAiCostUSD: number;
  voiceMinutes: number;
  voiceSessions: number;
  webSearches: number;
  modelUsage: Record<
    string,
    {
      requests?: number;
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
      cost?: number;
      provider?: string;
      modelName?: string;
    }
  >;
  providerBreakdown: Array<{
    provider: string;
    displayName: string;
    requestCount: number;
    inputTokens: number;
    outputTokens: number;
    totalCost: number;
  }>;
  costNotice?: string;
}

export function OwnerUsagePage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<UsagePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch('/api/admin/usage', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Owner session required.' : `HTTP ${res.status}`);
        setData(null);
        return;
      }
      setData(await res.json());
    } catch {
      setError('Could not load usage telemetry.');
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

  if (!user || !isOwnerEmail(user.email)) {
    return <Navigate to="/owner" replace />;
  }

  const models = Object.entries(data?.modelUsage || {}).sort(
    (a, b) => (b[1].requests || 0) - (a[1].requests || 0)
  );

  return (
    <OwnerShell title="Usage & Costs" badge="Live telemetry">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-400">
              <BarChart3 size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Runtime usage</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {data?.costNotice ||
                  'Only runtime-measured telemetry is shown — no seeded projections.'}
              </p>
            </div>
          </div>
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

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">{error}</div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric icon={<Cpu size={14} />} label="Requests" value={data?.totalRequests ?? 0} />
          <Metric
            icon={<DollarSign size={14} />}
            label="Est. AI cost"
            value={`$${(data?.estimatedAiCostUSD ?? 0).toFixed(4)}`}
            accent
          />
          <Metric icon={<Mic size={14} />} label="Voice minutes" value={data?.voiceMinutes ?? 0} />
          <Metric icon={<Globe size={14} />} label="Web searches" value={data?.webSearches ?? 0} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Metric label="Input tokens" value={(data?.inputTokens ?? 0).toLocaleString()} />
          <Metric label="Output tokens" value={(data?.outputTokens ?? 0).toLocaleString()} />
          <Metric label="Total tokens" value={(data?.totalTokens ?? 0).toLocaleString()} />
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[.06] text-sm font-semibold text-white">By model</div>
          {models.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">
              {busy ? 'Loading…' : 'No model usage recorded in this runtime yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080c] text-[10px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5">Model</th>
                    <th className="px-4 py-2.5">Provider</th>
                    <th className="px-4 py-2.5">Requests</th>
                    <th className="px-4 py-2.5">Tokens</th>
                    <th className="px-4 py-2.5">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[.04]">
                  {models.map(([id, m]) => (
                    <tr key={id} className="hover:bg-white/[.02]">
                      <td className="px-4 py-2.5 text-white">{m.modelName || id}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{m.provider || '—'}</td>
                      <td className="px-4 py-2.5 font-mono">{m.requests ?? 0}</td>
                      <td className="px-4 py-2.5 font-mono">{(m.totalTokens ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-mono text-amber-300/90">${(m.cost ?? 0).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(data?.providerBreakdown?.length || 0) > 0 && (
          <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4">
            <div className="text-sm font-semibold text-white mb-3">By provider</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {data!.providerBreakdown.map((p) => (
                <div
                  key={p.provider}
                  className="rounded-xl border border-white/[.06] bg-[#08080c] px-3 py-2.5 text-xs"
                >
                  <div className="font-medium text-white">{p.displayName || p.provider}</div>
                  <div className="mt-1 text-zinc-500">
                    {p.requestCount} req · {(p.inputTokens + p.outputTokens).toLocaleString()} tokens · $
                    {p.totalCost.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </OwnerShell>
  );
}

function Metric({
  label,
  value,
  icon,
  accent
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-light zenix-metric-value ${
          accent ? 'text-amber-300' : 'text-white'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default OwnerUsagePage;
