import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import { Megaphone, RefreshCw, Plus, Power } from 'lucide-react';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  targetTier?: string;
  active: boolean;
  dismissible?: boolean;
  actionLabel?: string;
  actionUrl?: string;
  createdAt?: string;
}

export function OwnerBroadcastsPage() {
  const { user, loading } = useAuth();
  const [list, setList] = useState<Broadcast[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'critical' | 'success'>('info');

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
      const res = await fetch('/api/admin/broadcasts', { headers });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Owner session required.' : `HTTP ${res.status}`);
        setList([]);
        return;
      }
      const data = await res.json();
      setList(Array.isArray(data.broadcasts) ? data.broadcasts : []);
    } catch {
      setError('Could not load broadcasts.');
    } finally {
      setBusy(false);
    }
  }, [tokenHeaders]);

  useEffect(() => {
    if (user && isOwnerEmail(user.email)) void load();
  }, [user, load]);

  const create = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const headers = await tokenHeaders();
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          title: title.trim(),
          message: body.trim(),
          type,
          targetTier: 'ALL',
          dismissible: true,
          updatedBy: user?.email || 'owner'
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || `Create failed (${res.status})`);
        return;
      }
      setTitle('');
      setBody('');
      setMessage('Broadcast created and active.');
      await load();
    } catch {
      setError('Create request failed.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const headers = await tokenHeaders();
      const res = await fetch(`/api/admin/broadcasts/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ updatedBy: user?.email || 'owner' })
      });
      if (!res.ok) {
        setError(`Toggle failed (${res.status})`);
        return;
      }
      await load();
    } catch {
      setError('Toggle failed.');
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

  const activeCount = list.filter((b) => b.active).length;

  return (
    <OwnerShell title="Broadcasts" badge="Platform banners">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-300">
              <Megaphone size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">System broadcasts</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {activeCount} active · {list.length} total — shown to signed-in users when active.
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

        {(error || message) && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs ${
              error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5 space-y-3">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <Plus size={15} /> New broadcast
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-white/[.08] bg-[#08080c] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-400/40"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message"
            rows={3}
            className="w-full rounded-xl border border-white/[.08] bg-[#08080c] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-400/40 resize-y"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="rounded-lg border border-white/[.08] bg-[#08080c] px-2.5 py-1.5 text-xs text-zinc-300"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => void create()}
              className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] overflow-hidden">
          {list.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-zinc-500">
              {busy ? 'Loading…' : 'No broadcasts yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-white/[.04]">
              {list.map((b) => (
                <li key={b.id} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-white">{b.title}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                          b.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-500/15 text-zinc-400'
                        }`}
                      >
                        {b.active ? 'Active' : 'Off'}
                      </span>
                      <span className="text-[10px] text-zinc-500">{b.type}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{b.message}</p>
                    {b.createdAt && (
                      <div className="mt-1 text-[10px] text-zinc-600">{new Date(b.createdAt).toLocaleString()}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggle(b.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[.1] bg-[#121218] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white disabled:opacity-50 shrink-0"
                  >
                    <Power size={12} />
                    {b.active ? 'Disable' : 'Enable'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </OwnerShell>
  );
}

export default OwnerBroadcastsPage;
