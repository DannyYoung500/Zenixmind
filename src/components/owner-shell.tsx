import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { ArrowLeft, Activity, Shield, LayoutDashboard, ExternalLink } from 'lucide-react';

const NAV = [
  { to: '/owner', label: 'Console', icon: LayoutDashboard, exact: true },
  { to: '/owner/activity', label: 'Activity', icon: Activity },
  { to: '/owner/security', label: 'Security', icon: Shield }
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
      <header className="sticky top-0 z-40 border-b border-white/[.06] bg-[#050506]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/assistant"
              className="flex items-center gap-1.5 rounded-lg border border-white/[.08] bg-white/[.03] px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Workspace</span>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <BrandMark size={28} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{title}</div>
                {badge && (
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90">{badge}</div>
                )}
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-xl border border-white/[.08] bg-[#0a0a0e] p-1">
            {NAV.map((item) => {
              const active = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    active
                      ? 'bg-amber-400 text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</main>

      <footer className="border-t border-white/[.05] py-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between text-[10px] text-zinc-600">
          <span>ZenixMind Owner</span>
          <a
            href="https://zenixmind.vercel.app/owner"
            className="inline-flex items-center gap-1 hover:text-zinc-400"
          >
            Full console <ExternalLink size={10} />
          </a>
        </div>
      </footer>
    </div>
  );
}
