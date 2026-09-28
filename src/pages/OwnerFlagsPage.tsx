import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import { Flag, RefreshCw, Save } from 'lucide-react';

const LABELS: Record<string, string> = {
  voiceMode: 'Voice mode',
  webSearch: 'Web search',
  visionImageGen: 'Vision / image gen',
  memoryPersistence: 'Memory persistence',
  deepReasoning: 'Deep reasoning',
  codeExecution: 'Code execution',
  experimentalModels: 'Experimental models'
};

export function OwnerFlagsPage() {
  const { user, loading } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
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
      const res = await fetch('/api/admin/feature-flags', { headers: h });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Owner session required.' : `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setFlags(data.flags || {});
    } catch {
      setError('Could not load feature flags.');
    } finally {
      setBusy(false);
    }
  }, [headers]);

  useEffect(() => {
    if (user && isOwnerEmail(user.email)) void load();
  }, [user, load]);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const h = await headers();
      const res = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...h },
        body: JSON.stringify({ updates: flags, updatedBy: user?.email || 'owner' })
      });
      if (!res.ok) {
        setError(`Save failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setFlags(data.flags || flags);
      setMessage('Feature flags saved.');
    } catch {
      setError('Save failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050506] grid place-items-center">
        <div className="h-7 w-7 rounded-full border-2 border-white/10 border-t-white/80 animate-spin" />
      </div>
    );
  }
  if (!user || !isOwnerEmail(user.email)) return <Navigate to="/owner" replace />;

  const keys = Object.keys(flags).length ? Object.keys(flags) : Object.keys(LABELS);

  return (
    <OwnerShell title="Feature Flags" badge="Product switches">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-300">
              <Flag size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Platform feature flags</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Toggle product capabilities without a deploy.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} disabled={busy} className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#121218] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50">
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
            <button type="button" onClick={() => void save()} disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-50">
              <Save size={13} /> Save
            </button>
          </div>
        </div>

        {(error || message) && (
          <div className={`rounded-xl border px-4 py-3 text-xs ${error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
            {error || message}
          </div>
        )}

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] divide-y divide-white/[.04]">
          {keys.map((key) => (
            <label key={key} className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[.02]">
              <div>
                <div className="text-sm text-white">{LABELS[key] || key}</div>
                <div className="text-[10px] font-mono text-zinc-600">{key}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!flags[key]}
                onClick={() => setFlags((f) => ({ ...f, [key]: !f[key] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${flags[key] ? 'bg-amber-400' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${flags[key] ? 'translate-x-5' : ''}`} />
              </button>
            </label>
          ))}
          {keys.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-zinc-500">{busy ? 'Loading…' : 'No flags'}</div>
          )}
        </div>
      </div>
    </OwnerShell>
  );
}

export default OwnerFlagsPage;
