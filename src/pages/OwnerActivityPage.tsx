import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { UserActivityAnalytics } from '../components/user-activity-analytics';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { ArrowLeft } from 'lucide-react';

export function OwnerActivityPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050506] grid place-items-center">
        <div className="flex flex-col items-center gap-3">
          <BrandMark size={44} className="logo-mark" />
          <div className="h-6 w-6 rounded-full border-2 border-white/10 border-t-white/80 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user || !isOwnerEmail(user.email)) {
    return <Navigate to="/owner" replace />;
  }

  return (
    <div className="min-h-screen bg-[#050506] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/[.06] bg-[#050506]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/owner"
              className="flex items-center gap-1.5 rounded-lg border border-white/[.08] bg-white/[.03] px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Owner console
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <BrandMark size={28} />
              <span className="text-sm font-medium text-white">Activity Analytics</span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90">
            Live ledger
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <UserActivityAnalytics />
      </main>
    </div>
  );
}

export default OwnerActivityPage;
