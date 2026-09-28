import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import { Gauge, RefreshCw, Save } from 'lucide-react';

interface TierLimits {
  rpm: number;
  tpm: number;
  dailyTokens: number;
  maxConcurrent: number;
  modelAccess?: string[];
}

interface RateConfig {
  autoThrottleOnBudget: boolean;
  burstMultiplier: number;
  tiers: Record<string, TierLimits>;
}

const TIER_ORDER = ['Free', 'Pro', 'Enterprise', 'Owner'];

export function OwnerRateLimitsPage() {
  const { user, loading } = useAuth();
  const [cfg, setCfg] = useState<RateConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const headers = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const h = await headers();
      const res = await fetch('/api/admin/rate-limits', { headers: h });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Owner session required.' : `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setCfg(data.rateLimits || data);
    } catch {
      setError('Could not load rate limits.');
    } finally {
      setBusy(false);
    }
  }, [headers]);

  useEffect(() => {
    if (user && isOwnerEmail(user.email)) void load();
  }, [user, load]);

  const save = async () => {
    if (!cfg) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const h = await headers();
      const res = await fetch('/api/admin/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...h },
        body: JSON.stringify({ updates: cfg, updatedBy: user?.email || 'owner' })
      });
      if (!res.ok) {
        setError(`Save failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setCfg(data.rateLimits || cfg);
      setMessage('Rate limits saved.');
    } catch {
      setError('Save request failed.');
    } finally {
      setBusy(false);
    }
  };

  const updateTier = (tier: string, field: keyof TierLimits, value: number) => {
    if (!cfg) return;
    setCfg({
      ...cfg,
      tiers: {
        ...cfg.tiers,
        [tier]: { ...cfg.tiers[tier], [field]: value }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050506] grid place-items-center">
        <div className="h-7 w-7 rounded-full border-2 border-white/10 border-t-white/80 animate-spin" />
      </div>
    );
  }
  if (!user || !isOwnerEmail(user.email)) return <Navigate to="/owner" replace />;

  return (
    <OwnerShell title="Rate Limits" badge="Governance">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <Gauge size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Tier rate governance</h1>
              <p className="text-xs text-zinc-400 mt-0.5">RPM, TPM, daily tokens, and concurrency per plan.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} disabled={busy} className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#121218] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50">
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
            <button type="button" onClick={() => void save()} disabled={busy || !cfg} className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-50">
              <Save size={13} /> Save
            </button>
          </div>
        </div>

        {(error || message) && (
          <div className={`rounded-xl border px-4 py-3 text-xs ${error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
            {error || message}
          </div>
        )}

        {cfg && (
          <>
            <div className="flex flex-wrap gap-4 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4 text-xs">
              <label className="flex items-center gap-2 text-zinc-300">
                <input
                  type="checkbox"
                  checked={!!cfg.autoThrottleOnBudget}
                  onChange={(e) => setCfg({ ...cfg, autoThrottleOnBudget: e.target.checked })}
                  className="rounded border-white/20"
                />
                Auto-throttle on budget
              </label>
              <label className="flex items-center gap-2 text-zinc-300">
                Burst multiplier
                <input
                  type="number"
                  step="0.1"
                  value={cfg.burstMultiplier}
                  onChange={(e) => setCfg({ ...cfg, burstMultiplier: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-white/[.08] bg-[#08080c] px-2 py-1 text-white"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {TIER_ORDER.filter((t) => cfg.tiers[t]).map((tier) => {
                const t = cfg.tiers[tier];
                return (
                  <div key={tier} className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4 space-y-3">
                    <div className="text-sm font-semibold text-white">{tier}</div>
                    {(['rpm', 'tpm', 'dailyTokens', 'maxConcurrent'] as const).map((field) => (
                      <label key={field} className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                        <span className="uppercase tracking-wider">{field}</span>
                        <input
                          type="number"
                          value={t[field]}
                          onChange={(e) => updateTier(tier, field, Number(e.target.value))}
                          className="w-28 rounded-lg border border-white/[.08] bg-[#08080c] px-2 py-1 text-right font-mono text-white"
                        />
                      </label>
                    ))}
                    {t.modelAccess && (
                      <div className="text-[10px] text-zinc-600 pt-1 border-t border-white/[.05]">
                        Models: {t.modelAccess.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!cfg && !error && (
          <div className="text-center text-xs text-zinc-500 py-10">{busy ? 'Loading…' : 'No config'}</div>
        )}
      </div>
    </OwnerShell>
  );
}

export default OwnerRateLimitsPage;
