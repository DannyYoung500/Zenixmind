import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import {
  Shield,
  RefreshCw,
  Laptop,
  Smartphone,
  Globe,
  AlertTriangle,
  Ban,
  CheckCircle2
} from 'lucide-react';

interface SessionRow {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  location?: string;
  countryCode?: string;
  startedAt?: string;
  lastActiveAt?: string;
  isCurrent?: boolean;
  status: string;
  riskScore?: number;
  riskFlags?: string[];
  source?: string;
}

function relTime(iso?: string) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function mergeSessions(primary: SessionRow[], heartbeat: SessionRow[]): SessionRow[] {
  const map = new Map<string, SessionRow>();
  for (const s of primary) {
    map.set(s.id, { ...s, source: s.source || 'monitor' });
  }
  for (const s of heartbeat) {
    if (!map.has(s.id)) {
      map.set(s.id, { ...s, source: 'heartbeat' });
    } else {
      const existing = map.get(s.id)!;
      const a = new Date(existing.lastActiveAt || existing.startedAt || 0).getTime();
      const b = new Date(s.lastActiveAt || s.startedAt || 0).getTime();
      if (b > a) map.set(s.id, { ...existing, ...s, source: existing.source });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const ta = new Date(a.lastActiveAt || a.startedAt || 0).getTime();
    const tb = new Date(b.lastActiveAt || b.startedAt || 0).getTime();
    return tb - ta;
  });
}

export function OwnerSecurityPage() {
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);

  const withToken = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await withToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [monitorRes, heartbeatRes] = await Promise.all([
        fetch('/api/admin/security/monitor', { headers }),
        fetch('/api/admin/sessions', { headers })
      ]);

      let primary: SessionRow[] = [];
      let heartbeat: SessionRow[] = [];

      if (monitorRes.ok) {
        const data = await monitorRes.json();
        primary = Array.isArray(data.sessions) ? data.sessions : Array.isArray(data) ? data : [];
      } else if (monitorRes.status === 401 || monitorRes.status === 403) {
        setError('Owner session required.');
        setSessions([]);
        return;
      }

      if (heartbeatRes.ok) {
        const data = await heartbeatRes.json();
        heartbeat = Array.isArray(data.sessions) ? data.sessions : [];
      }

      setSessions(mergeSessions(primary, heartbeat));
      setLastRefreshAt(new Date().toISOString());
      if (!monitorRes.ok && !heartbeatRes.ok) {
        setError(`Could not load sessions (${monitorRes.status})`);
      }
    } catch {
      setError('Could not reach security monitor.');
    } finally {
      setBusy(false);
    }
  }, [withToken]);

  useEffect(() => {
    if (!user || !isOwnerEmail(user.email)) return;
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [user, load]);

  const revokeOne = async (sessionId: string) => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const token = await withToken();
      const res = await fetch('/api/admin/security/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ sessionId, reason: 'Revoked from Owner Security page' })
      });
      if (!res.ok) {
        setError(`Revoke failed (${res.status})`);
        return;
      }
      setMessage(`Session ${sessionId.slice(0, 8)}… revoked`);
      await load();
    } catch {
      setError('Revoke request failed.');
    } finally {
      setBusy(false);
    }
  };

  const revokeOthers = async () => {
    const confirmed = window.confirm(
      'Revoke every other active session except your current session?'
    );
    if (!confirmed) return;
    setBusy(true);
    setMessage(null);
    try {
      const token = await withToken();
      const res = await fetch('/api/admin/security/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ allExceptCurrent: true, reason: 'Bulk revoke from Owner Security' })
      });
      if (!res.ok) {
        setError(`Bulk revoke failed (${res.status})`);
        return;
      }
      const data = await res.json();
      setMessage(data.message || `Revoked ${data.revokedCount ?? 0} session(s)`);
      await load();
    } catch {
      setError('Bulk revoke failed.');
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

  if (!user || !isOwnerEmail(user.email)) {
    return <Navigate to="/owner" replace />;
  }

  const active = sessions.filter((s) => s.status === 'active');
  const revoked = sessions.filter((s) => s.status === 'revoked');
  const suspicious = sessions.filter((s) => s.status === 'suspicious' || (s.riskScore || 0) >= 70);

  return (
    <OwnerShell title="Security & Sessions" badge="Owner control">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-400">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Active sessions & risk</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Merged ledger: security monitor + login heartbeat sessions.
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
              onClick={() => void revokeOthers()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
            >
              <Ban size={13} />
              Revoke others
            </button>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs ${
              error
                ? 'border-red-400/30 bg-red-500/10 text-red-200'
                : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Active</div>
            <div className="mt-1 text-2xl font-light text-white zenix-metric-value">{active.length}</div>
          </div>
          <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4">
            <div className="text-[10px] uppercase tracking-wider text-amber-400/80">Suspicious</div>
            <div className="mt-1 text-2xl font-light text-amber-300 zenix-metric-value">{suspicious.length}</div>
          </div>
          <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">Revoked</div>
            <div className="mt-1 text-2xl font-light text-zinc-300 zenix-metric-value">{revoked.length}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[.06] flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Session ledger</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-zinc-500">{sessions.length} rows</span>
              <span className="text-[10px] text-zinc-600">
                {lastRefreshAt ? `Updated ${relTime(lastRefreshAt)}` : 'Not checked yet'}
              </span>
            </div>
          </div>

          {sessions.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-zinc-500">
              {busy
                ? 'Loading sessions…'
                : 'No tracked sessions yet. Log in once to register a heartbeat session.'}
            </div>
          )}

          <ul className="divide-y divide-white/[.04]">
            {sessions.map((s) => {
              const DeviceIcon = s.deviceType === 'Mobile' ? Smartphone : Laptop;
              const risky = (s.riskScore || 0) >= 70 || s.status === 'suspicious';
              return (
                <li key={s.id} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/[.08] bg-white/[.03] text-zinc-400">
                      <DeviceIcon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium truncate">
                        {s.userName || s.userEmail}
                        {s.isCurrent && (
                          <span className="ml-2 rounded-full bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 text-[9px] font-semibold">
                            CURRENT
                          </span>
                        )}
                        {s.source === 'heartbeat' && (
                          <span className="ml-2 rounded-full bg-sky-500/15 text-sky-300 px-1.5 py-0.5 text-[9px] font-semibold">
                            HEARTBEAT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">{s.userEmail}</div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <Globe size={10} /> {s.ipAddress || '—'} · {s.location || s.countryCode || 'Unknown'}
                        </span>
                        <span>
                          {s.browser || 'Browser'} · {s.os || 'OS'}
                        </span>
                        <span>Last active {relTime(s.lastActiveAt || s.startedAt)}</span>
                      </div>
                      {risky && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-300">
                          <AlertTriangle size={11} /> Risk {s.riskScore ?? '—'}
                          {(s.riskFlags || []).length > 0 ? ` · ${(s.riskFlags || []).join(', ')}` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        s.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : s.status === 'suspicious'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-zinc-500/15 text-zinc-400'
                      }`}
                    >
                      {s.status}
                    </span>
                    {s.status !== 'revoked' && !s.isCurrent && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void revokeOne(s.id)}
                        className="rounded-lg border border-red-400/25 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                    {s.status === 'revoked' && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                        <CheckCircle2 size={12} /> Ended
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </OwnerShell>
  );
}

export default OwnerSecurityPage;
