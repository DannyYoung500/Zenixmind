import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Brain,
  Flag,
  Gauge,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Shield,
  Search,
  Server
} from 'lucide-react';

const COMMANDS = [
  { to: '/owner', label: 'Owner console', icon: LayoutDashboard, keywords: 'home dashboard' },
  { to: '/owner/system', label: 'System health', icon: Server, keywords: 'health gemini status config' },
  { to: '/owner/activity', label: 'Activity analytics', icon: Activity, keywords: 'users sessions' },
  { to: '/owner/usage', label: 'Usage & costs', icon: BarChart3, keywords: 'tokens cost billing' },
  { to: '/owner/memory', label: 'Memory admin', icon: Brain, keywords: 'data purge' },
  { to: '/owner/broadcasts', label: 'Broadcasts', icon: Megaphone, keywords: 'banner announce' },
  { to: '/owner/security', label: 'Security sessions', icon: Shield, keywords: 'revoke risk' },
  { to: '/owner/rate-limits', label: 'Rate limits', icon: Gauge, keywords: 'rpm throttle tier' },
  { to: '/owner/flags', label: 'Feature flags', icon: Flag, keywords: 'toggle product' },
  { to: '/owner/audit', label: 'Audit log', icon: ScrollText, keywords: 'trail export csv' },
  { to: '/assistant', label: 'Workspace', icon: LayoutDashboard, keywords: 'chat assistant' },
  { to: '/status', label: 'Public status', icon: Activity, keywords: 'health uptime' }
];

export function OwnerCommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQ('');
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COMMANDS;
    return COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(needle) ||
        c.keywords.includes(needle) ||
        c.to.includes(needle)
    );
  }, [q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[.1] bg-[#0b0b0e] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/[.06] px-3 py-2.5">
          <Search size={14} className="text-zinc-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filtered[0]) {
                navigate(filtered[0].to);
                setOpen(false);
              }
            }}
          />
          <kbd className="hidden sm:inline text-[9px] font-mono text-zinc-600 border border-white/[.08] rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.to}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(c.to);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-white/[.04] hover:text-white"
                >
                  <Icon size={14} className="text-zinc-500" />
                  <span>{c.label}</span>
                  <span className="ml-auto text-[10px] font-mono text-zinc-600">{c.to}</span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-zinc-500">No matches</li>
          )}
        </ul>
        <div className="border-t border-white/[.06] px-3 py-1.5 text-[10px] text-zinc-600">
          ⌘K / Ctrl+K · Owner command palette
        </div>
      </div>
    </div>
  );
}
