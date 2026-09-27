import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import { BrandMark } from './components/brand-mark';
import { ErrorBoundary } from './components/error-boundary';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { AssistantPage } from './pages/AssistantPage';
import { VoicePage } from './pages/VoicePage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage, SignupPage } from './pages/LoginPage';
import { OwnerPage } from './pages/OwnerPage';
import { OwnerActivityPage } from './pages/OwnerActivityPage';
import { OwnerSecurityPage } from './pages/OwnerSecurityPage';
import { OwnerUsagePage } from './pages/OwnerUsagePage';
import { OwnerMemoryPage } from './pages/OwnerMemoryPage';
import { OwnerBroadcastsPage } from './pages/OwnerBroadcastsPage';
import { StatusPage } from './pages/StatusPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050506] text-zinc-400 grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <BrandMark size={48} className="logo-mark opacity-90" />
          <div className="h-6 w-6 rounded-full border-2 border-white/10 border-t-white/75 animate-spin" />
          <p className="text-xs text-zinc-500 font-light tracking-wide">Loading ZenixMind…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
            <Route path="/assistant/voice" element={<ProtectedRoute><VoicePage /></ProtectedRoute>} />
            <Route path="/owner" element={<ProtectedRoute><OwnerPage /></ProtectedRoute>} />
            <Route path="/owner/activity" element={<ProtectedRoute><OwnerActivityPage /></ProtectedRoute>} />
            <Route path="/owner/usage" element={<ProtectedRoute><OwnerUsagePage /></ProtectedRoute>} />
            <Route path="/owner/memory" element={<ProtectedRoute><OwnerMemoryPage /></ProtectedRoute>} />
            <Route path="/owner/broadcasts" element={<ProtectedRoute><OwnerBroadcastsPage /></ProtectedRoute>} />
            <Route path="/owner/security" element={<ProtectedRoute><OwnerSecurityPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
