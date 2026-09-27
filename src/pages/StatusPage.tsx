import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface StatusPayload {
  ok: boolean;
  service: string;
  time: string;
  commit: string | null;
  region: string | null;
  checks: Array<{ name: string; ok: boolean; detail?: string }>;
}

export function StatusPage() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/status');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-zinc-100">
      <header className="border-b border-white/[.06]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="text-sm font-medium">ZenixMind Status</span>
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
          >
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div
          className={`rounded-2xl border p-6 mb-6 ${
            data?.ok
              ? 'border-emerald-400/25 bg-emerald-500/[.06]'
              : 'border-red-400/25 bg-red-500/[.06]'
          }`}
        >
          <div className="flex items-center gap-2 text-lg font-semibold">
            {data?.ok ? (
              <CheckCircle2 className="text-emerald-400" size={22} />
            ) : (
              <XCircle className="text-red-400" size={22} />
            )}
            {data ? (data.ok ? 'All systems operational' : 'Degraded') : 'Checking…'}
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {data?.time ? `Last check ${new Date(data.time).toLocaleString()}` : '—'}
            {data?.region ? ` · ${data.region}` : ''}
            {data?.commit ? ` · ${data.commit.slice(0, 7)}` : ''}
          </p>
        </div>

        <ul className="space-y-2">
          {(data?.checks || []).map((c) => (
            <li
              key={c.name}
              className="flex items-center justify-between rounded-xl border border-white/[.07] bg-[#0b0b0e] px-4 py-3 text-sm"
            >
              <span className="capitalize text-white">{c.name}</span>
              <span className="flex items-center gap-2 text-xs text-zinc-400">
                {c.detail}
                {c.ok ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <XCircle size={16} className="text-red-400" />
                )}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default StatusPage;
