import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { OwnerCommandPalette } from './owner-command-palette';
import {
  ArrowLeft,
  Activity,
  Shield,
  LayoutDashboard,
  BarChart3,
  Brain,
  Megaphone,
  Gauge,
  Flag,
  ScrollText,
  Server
} from 'lucide-react';

const NAV = [
  { to: '/owner', label: 'Console', icon: LayoutDashboard, exact: true },
  { to: '/owner/system', label: 'System', icon: Server },
  { to: '/owner/activity', label: 'Activity', icon: Activity },
  { to: '/owner/usage', label: 'Usage', icon: BarChart3 },
  { to: '/owner/memory', label: 'Memory', icon: Brain },
  { to: '/owner/broadcasts', label: 'Broadcasts', icon: Megaphone },
  { to: '/owner/security', label: 'Security', icon: Shield },
  { to: '/owner/rate-limits', label: 'Limits', icon: Gauge },
  { to: '/owner/flags', label: 'Flags', icon: Flag },
  { to: '/owner/audit', label: 'Audit', icon: ScrollText }
];

export function OwnerShell({
  title,
  badge,
  children
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#050506] text-zinc-100">
      <OwnerCommandPalette />
      <header className="sticky top-0 z-40 border-b border-white/[.06] bg-[#050506]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/assistant"
              className="flex items-center gap-1.5 rounded-lg border border-white/[.08] bg-white/[.03] px-2 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden md:inline">Workspace</span>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <BrandMark size={26} />
              <div className="min-w-0 hidden sm:block">
                <div className="text-sm font-medium text-white truncate">{title}</div>
                {badge && (
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90">{badge}</div>
                )}
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-0.5 rounded-xl border border-white/[.08] bg-[#0a0a0e] p-1 overflow-x-auto max-w-[74vw]">
            {NAV.map((item) => {
              const active = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={`flex items-center gap-1 rounded-lg px-1.5 sm:px-2 py-1.5 text-[10px] sm:text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    active ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden 2xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</main>
      <div className="fixed bottom-3 right-3 hidden sm:block text-[10px] font-mono text-zinc-600 bg-[#0b0b0e]/90 border border-white/[.06] rounded-lg px-2 py-1">
        ⌘K palette
      </div>
    </div>
  );
}
