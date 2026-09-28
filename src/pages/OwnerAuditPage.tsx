import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import { ScrollText, RefreshCw, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  result: string;
  category?: string;
  ipAddress?: string;
}

export function OwnerAuditPage() {
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('ALL');
  const [result, setResult] = useState('ALL');

  const token = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const t = await token();
      const params = new URLSearchParams({ limit: '200' });
      if (category !== 'ALL') params.set('category', category);
      if (result !== 'ALL') params.set('result', result);
      const res = await fetch(`/api/admin/audit-log?${params}`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {}
      });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? 'Owner session required.' : `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setStats(data.stats || null);
    } catch {
      setError('Could not load audit log.');
    } finally {
      setBusy(false);
    }
  }, [token, category, result]);

  useEffect(() => {
    if (user && isOwnerEmail(user.email)) void load();
  }, [user, load]);

  const exportCsv = async () => {
    try {
      const t = await token();
      const params = new URLSearchParams({ exportFormat: 'csv', limit: '1000' });
      if (category !== 'ALL') params.set('category', category);
      const res = await fetch(`/api/admin/audit-log?${params}`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {}
      });
      if (!res.ok) {
        setError(`Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenixmind-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed.');
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
    <OwnerShell title="Audit Log" badge="Immutable trail">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-orange-400/25 bg-orange-400/10 text-orange-300">
              <ScrollText size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Owner audit trail</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {stats ? `${stats.total} total · ${stats.success} ok · ${stats.warn} warn · ${stats.error} error` : 'Filter and export platform actions.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-white/[.08] bg-[#08080c] px-2 py-1.5 text-[11px] text-zinc-300">
              <option value="ALL">All categories</option>
              <option value="SECURITY">Security</option>
              <option value="USER_MANAGEMENT">Users</option>
              <option value="DATA_MUTATION">Data</option>
              <option value="SYSTEM">System</option>
              <option value="AI_ROUTING">AI routing</option>
              <option value="DIAGNOSTIC">Diagnostic</option>
            </select>
            <select value={result} onChange={(e) => setResult(e.target.value)} className="rounded-lg border border-white/[.08] bg-[#08080c] px-2 py-1.5 text-[11px] text-zinc-300">
              <option value="ALL">All results</option>
              <option value="SUCCESS">Success</option>
              <option value="WARN">Warn</option>
              <option value="ERROR">Error</option>
            </select>
            <button type="button" onClick={() => void load()} disabled={busy} className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#121218] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50">
              <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
            <button type="button" onClick={() => void exportCsv()} className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#121218] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white">
              <Download size={13} /> CSV
            </button>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">{error}</div>}

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] overflow-hidden">
          {logs.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-zinc-500">{busy ? 'Loading…' : 'No audit entries match.'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08080c] text-[10px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-3 py-2.5">Time</th>
                    <th className="px-3 py-2.5">Actor</th>
                    <th className="px-3 py-2.5">Action</th>
                    <th className="px-3 py-2.5">Target</th>
                    <th className="px-3 py-2.5">Result</th>
                    <th className="px-3 py-2.5">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[.04]">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-white/[.02]">
                      <td className="px-3 py-2 font-mono text-zinc-500 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="px-3 py-2 text-zinc-300">{l.actor}</td>
                      <td className="px-3 py-2 text-white font-medium">{l.action}</td>
                      <td className="px-3 py-2 text-zinc-400 max-w-[160px] truncate">{l.target}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                          l.result === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-300' :
                          l.result === 'WARN' ? 'bg-amber-500/15 text-amber-300' :
                          'bg-red-500/15 text-red-300'
                        }`}>{l.result}</span>
                      </td>
                      <td className="px-3 py-2 text-zinc-500">{l.category || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  );
}

export default OwnerAuditPage;
