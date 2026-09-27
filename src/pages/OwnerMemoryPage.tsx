import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import { Brain, RefreshCw, Search, Trash2, AlertTriangle } from 'lucide-react';

interface MemoryRecord {
  id: string;
  user_email?: string;
  userEmail?: string;
  key?: string;
  content: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function OwnerMemoryPage() {
  const { user, loading } = useAuth();
  const [records, setRecords] = useState<MemoryRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [confirmPurge, setConfirmPurge] = useState(false);

  const tokenHeaders = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const headers = await tokenHeaders();
      const res = await fetch('/api/admin/memory', { headers });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Owner session required.' : `HTTP ${res.status}`);
        setRecords([]);
        return;
      }
      const data = await res.json();
      setRecords(Array.isArray(data.records) ? data.records : []);
    } catch {
      setError('Could not load memory store.');
    } finally {
      setBusy(false);
    }
  }, [tokenHeaders]);

  useEffect(() => {
    if (user && isOwnerEmail(user.email)) void load();
  }, [user, load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((r) => {
      const email = (r.user_email || r.userEmail || '').toLowerCase();
      const content = (r.content || '').toLowerCase();
      const key = (r.key || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      return email.includes(needle) || content.includes(needle) || key.includes(needle) || cat.includes(needle);
    });
  }, [records, q]);

  const purgeAll = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const headers = await tokenHeaders();
      const res = await fetch('/api/admin/memory/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ updatedBy: user?.email || 'owner' })
      });
      if (!res.ok) {
        setError(`Purge failed (${res.status})`);
        return;
      }
      setMessage('Memory store purged.');
      setConfirmPurge(false);
      await load();
    } catch {
      setError('Purge request failed.');
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

  return (
    <OwnerShell title="Memory Admin" badge="Data control">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-violet-300">
              <Brain size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">User memory ledger</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect platform memory records. Purge is destructive and audited.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#121218] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50"
            >
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setConfirmPurge(true)}
              disabled={busy || records.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 size={13} />
              Purge all
            </button>
          </div>
        </div>

        {(error || message) && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs ${
              error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {error || message}
          </div>
        )}

        {confirmPurge && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/[.08] p-4">
            <div className="flex items-start gap-2 text-sm text-red-100">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Purge entire memory store?</p>
                <p className="text-xs text-red-200/80 mt-1">
                  This removes {records.length} record(s) and cannot be undone from this UI.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void purgeAll()}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                  >
                    Confirm purge
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPurge(false)}
                    className="rounded-lg border border-white/[.1] px-3 py-1.5 text-xs text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email, key, category, content…"
              className="w-full rounded-xl border border-white/[.08] bg-[#0b0b0e] pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-400/40"
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">{filtered.length} / {records.length}</span>
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-zinc-500">
              {busy ? 'Loading…' : 'No memory records in the runtime store.'}
            </div>
          ) : (
            <ul className="divide-y divide-white/[.04]">
              {filtered.map((r) => (
                <li key={r.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                    <span className="font-mono text-zinc-400">{r.id}</span>
                    <span>{r.user_email || r.userEmail || '—'}</span>
                    {r.category && (
                      <span className="rounded-full bg-violet-500/15 text-violet-300 px-1.5 py-0.5">{r.category}</span>
                    )}
                    {r.key && <span className="text-zinc-400">key: {r.key}</span>}
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                  <div className="mt-1 text-[10px] text-zinc-600">
                    updated {r.updated_at || r.updatedAt || r.created_at || r.createdAt || '—'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </OwnerShell>
  );
}

export default OwnerMemoryPage;
