import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { OwnerCommandPalette } from './owner-command-palette';
import { ArrowLeft, Activity, Shield, LayoutDashboard, BarChart3, Brain, Megaphone, Gauge, Flag, ScrollText, Server } from 'lucide-react';

const NAV_GROUPS = [
  { label: 'Control plane', items: [
    { to: '/owner', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/owner/system', label: 'System health', icon: Server }
  ]},
  { label: 'Operations', items: [
    { to: '/owner/activity', label: 'Activity', icon: Activity },
    { to: '/owner/usage', label: 'Usage & costs', icon: BarChart3 },
    { to: '/owner/broadcasts', label: 'Broadcasts', icon: Megaphone }
  ]},
  { label: 'Trust & governance', items: [
    { to: '/owner/security', label: 'Security', icon: Shield },
    { to: '/owner/rate-limits', label: 'Rate limits', icon: Gauge },
    { to: '/owner/flags', label: 'Feature flags', icon: Flag },
    { to: '/owner/audit', label: 'Audit log', icon: ScrollText },
    { to: '/owner/memory', label: 'Memory', icon: Brain }
  ]}
];

export function OwnerShell({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  const location = useLocation();
  const navigation = (
    <nav aria-label="Owner navigation" className="space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          <div className="px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">{group.label}</div>
          {group.items.map((item) => {
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                active ? 'border border-white/[.12] bg-white/[.08] text-white' : 'border border-transparent text-zinc-500 hover:bg-white/[.04] hover:text-zinc-200'
              }`}>
              <Icon size={15} className={active ? 'text-amber-300' : 'text-zinc-500'} /><span>{item.label}</span>
            </Link>;
          })}
        </div>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-[#050506] text-zinc-100">
      <OwnerCommandPalette />
      <header className="sticky top-0 z-40 border-b border-white/[.06] bg-[#050506]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/assistant" className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/[.08] bg-white/[.03] px-2.5 py-2 text-xs text-zinc-400 transition-colors hover:text-white">
              <ArrowLeft size={14} /><span className="hidden sm:inline">Workspace</span>
            </Link>
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandMark size={28} />
              <div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{title}</div>
                {badge && <div className="text-[10px] uppercase tracking-[.14em] text-zinc-500">{badge}</div>}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.03] px-3 py-1.5 text-[10px] text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Owner workspace
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px] items-start gap-6 px-3 py-4 sm:px-6 sm:py-6">
        <aside className="sticky top-20 hidden w-56 shrink-0 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-3 lg:block">
          {navigation}
          <div className="mt-5 border-t border-white/[.06] pt-3 text-[10px] text-zinc-600"><div className="px-3">⌘K / Ctrl+K · Quick navigation</div></div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 overflow-x-auto rounded-xl border border-white/[.07] bg-[#0b0b0e] p-2 lg:hidden">
            <div className="flex min-w-max items-center gap-1">
              {NAV_GROUPS.flatMap((group) => group.items).map((item) => {
                const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-colors ${
                    active ? 'bg-white/[.1] text-white' : 'text-zinc-500 hover:text-white'
                  }`}><Icon size={13} />{item.label}</Link>;
              })}
            </div>
          </div>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
