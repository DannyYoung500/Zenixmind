import React from 'react';
import { Navigate } from 'react-router-dom';
import { OwnerShell } from '../components/owner-shell';
import { UserActivityAnalytics } from '../components/user-activity-analytics';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';

export function OwnerActivityPage() {
  const { user, loading } = useAuth();

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

  return (
    <OwnerShell title="Activity Analytics" badge="Live ledger">
      <UserActivityAnalytics />
    </OwnerShell>
  );
}

export default OwnerActivityPage;
