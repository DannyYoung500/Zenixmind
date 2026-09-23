import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Key,
  Users,
  Activity,
  RefreshCw,
  Slash,
  Ban,
  Globe,
  Monitor,
  Smartphone,
  Terminal,
  Clock,
  Radio,
  ExternalLink,
  ChevronDown,
  CheckCircle,
  XCircle,
  Play,
  Flame,
  Search,
  Check,
  Copy
} from 'lucide-react';

export interface UserSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: 'Owner' | 'Enterprise' | 'Pro' | 'Free';
  ipAddress: string;
  userAgent: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'API Agent';
  browser: string;
  os: string;
  location: string;
  countryCode: string;
  startedAt: string;
  lastActiveAt: string;
  isCurrent?: boolean;
  status: 'active' | 'revoked' | 'suspicious';
  riskScore: number;
  riskFlags: string[];
}

export interface SuspiciousLoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  location: string;
  countryCode: string;
  userAgent: string;
  timestamp: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
  actionTaken: string;
}

export interface UnauthorizedApiKeyAttempt {
  id: string;
  attemptedKeyPrefix: string;
  endpoint: string;
  method: string;
  ipAddress: string;
  location: string;
  countryCode: string;
  userAgent: string;
  timestamp: string;
  errorReason: string;
  severity: 'medium' | 'high' | 'critical';
  blocked: boolean;
  actionTaken: string;
}

export interface SecurityMonitorData {
  activeSessionsCount: number;
  suspiciousSessionsCount: number;
  totalSessionsCount: number;
  sessions: UserSession[];
  suspiciousLogins: SuspiciousLoginAttempt[];
  unauthorizedApiKeyAttempts: UnauthorizedApiKeyAttempt[];
  blockedIps: string[];
  metrics: {
    activeSessionsTotal: number;
    suspiciousSessionsTotal: number;
    suspiciousLoginsTotal: number;
    unauthorizedApiTotal: number;
    blockedIpsTotal: number;
    avgSessionRiskScore: number;
    threatLevel: 'NORMAL' | 'ELEVATED' | 'HIGH';
  };
  lastUpdated: string;
}

interface SecurityMonitorProps {
  ownerFetch: (url: string, options?: RequestInit) => Promise<Response>;
  addToast: (title: string, message: string, type: 'info' | 'warning' | 'critical' | 'success') => void;
  currentUserEmail?: string;
}

export function SecurityMonitor({ ownerFetch, addToast, currentUserEmail }: SecurityMonitorProps) {
  const [data, setData] = useState<SecurityMonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState(5);
  const [lastTick, setLastTick] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'sessions' | 'logins' | 'api-keys' | 'blocked-ips'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showConfirmRevokeAll, setShowConfirmRevokeAll] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Fetch monitor telemetry
  const fetchMonitorData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await ownerFetch('/api/admin/security/monitor');
      if (res.ok) {
        const json: SecurityMonitorData = await res.json();
        setData(json);
        setLastTick(new Date());
      } else {
        if (isManual) addToast('Security Sync Failed', 'Unable to fetch real-time monitor feed.', 'warning');
      }
    } catch {
      if (isManual) addToast('Network Error', 'Could not connect to security monitor.', 'critical');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [ownerFetch, addToast]);

  // Initial load
  useEffect(() => {
    fetchMonitorData();
  }, [fetchMonitorData]);

  // Real-time polling timer
  useEffect(() => {
    if (!pollingActive || pollIntervalSeconds <= 0) return;
    const interval = setInterval(() => {
      fetchMonitorData();
    }, pollIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [pollingActive, pollIntervalSeconds, fetchMonitorData]);

  // Revoke single session
  const handleRevokeSession = async (session: UserSession) => {
    setRevokingSessionId(session.id);
    try {
      const res = await ownerFetch('/api/admin/security/sessions/revoke', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.id,
          reason: 'Terminated by superuser via real-time Security Monitor',
          updatedBy: currentUserEmail || 'owner'
        })
      });

      if (res.ok) {
        addToast(
          'Session Revoked',
          `Active token for ${session.userEmail} (${session.ipAddress}) terminated.`,
          'success'
        );
        // Optimistic state update
        setData((prev) => {
          if (!prev) return prev;
          const updatedSessions = prev.sessions.map((s) =>
            s.id === session.id ? { ...s, status: 'revoked' as const } : s
          );
          return {
            ...prev,
            activeSessionsCount: Math.max(0, prev.activeSessionsCount - 1),
            sessions: updatedSessions
          };
        });
        fetchMonitorData();
      } else {
        addToast('Revocation Failed', 'Server rejected session termination.', 'critical');
      }
    } catch {
      addToast('Error', 'Network error during session revocation.', 'critical');
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Revoke all other sessions (mass kill switch)
  const handleRevokeAllOtherSessions = async () => {
    setRevokingAll(true);
    setShowConfirmRevokeAll(false);
    try {
      const res = await ownerFetch('/api/admin/security/sessions/revoke', {
        method: 'POST',
        body: JSON.stringify({
          allExceptCurrent: true,
          reason: 'Emergency mass revocation triggered via Security Monitor',
          updatedBy: currentUserEmail || 'owner'
        })
      });

      if (res.ok) {
        const json = await res.json();
        addToast(
          'All Other Sessions Revoked',
          `Successfully terminated ${json.revokedCount || 0} active external sessions.`,
          'success'
        );
        fetchMonitorData();
      } else {
        addToast('Mass Revocation Failed', 'Failed to terminate all sessions.', 'critical');
      }
    } catch {
      addToast('Network Error', 'Failed to execute bulk revocation.', 'critical');
    } finally {
      setRevokingAll(false);
    }
  };

  // Block / Unblock IP
  const handleToggleBlockIp = async (ipAddress: string, isBlocked: boolean) => {
    try {
      const action = isBlocked ? 'unblock' : 'block';
      const res = await ownerFetch('/api/admin/security/threats/block-ip', {
        method: 'POST',
        body: JSON.stringify({
          ipAddress,
          action,
          reason: isBlocked ? 'Superuser unblock request' : 'Flagged intrusion threat via Security Monitor',
          updatedBy: currentUserEmail || 'owner'
        })
      });

      if (res.ok) {
        addToast(
          isBlocked ? 'IP Restored' : 'IP Blacklisted',
          `IP ${ipAddress} ${isBlocked ? 'removed from jail.' : 'blocked at network perimeter.'}`,
          isBlocked ? 'info' : 'warning'
        );
        fetchMonitorData();
      } else {
        addToast('Failed', 'Could not update IP perimeter status.', 'critical');
      }
    } catch {
      addToast('Network Error', 'Failed to contact security gateway.', 'critical');
    }
  };

  // Simulate threat event
  const handleSimulateThreat = async (type: 'suspicious_login' | 'unauthorized_api') => {
    setSimulating(true);
    try {
      const res = await ownerFetch('/api/admin/security/simulate-threat', {
        method: 'POST',
        body: JSON.stringify({
          type,
          updatedBy: currentUserEmail || 'owner'
        })
      });

      if (res.ok) {
        const json = await res.json();
        addToast(
          type === 'suspicious_login' ? '🚨 Suspicious Login Triggered' : '🚫 Unauthorized API Blocked',
          `Simulated live threat from ${json.threat?.ipAddress || 'external node'}. Detected instantly!`,
          'warning'
        );
        await fetchMonitorData();
        setActiveTab(type === 'suspicious_login' ? 'logins' : 'api-keys');
      }
    } catch {
      addToast('Simulation Error', 'Unable to dispatch test event.', 'critical');
    } finally {
      setSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    if (!data?.sessions) return [];
    if (!searchQuery.trim()) return data.sessions;
    const q = searchQuery.toLowerCase();
    return data.sessions.filter(
      (s) =>
        s.userEmail.toLowerCase().includes(q) ||
        s.userName.toLowerCase().includes(q) ||
        s.ipAddress.includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.browser.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
    );
  }, [data?.sessions, searchQuery]);

  // Filtered suspicious logins
  const filteredLogins = useMemo(() => {
    if (!data?.suspiciousLogins) return [];
    if (!searchQuery.trim()) return data.suspiciousLogins;
    const q = searchQuery.toLowerCase();
    return data.suspiciousLogins.filter(
      (l) =>
        l.email.toLowerCase().includes(q) ||
        l.ipAddress.includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q) ||
        l.severity.toLowerCase().includes(q)
    );
  }, [data?.suspiciousLogins, searchQuery]);

  // Filtered unauthorized API attempts
  const filteredApiAttempts = useMemo(() => {
    if (!data?.unauthorizedApiKeyAttempts) return [];
    if (!searchQuery.trim()) return data.unauthorizedApiKeyAttempts;
    const q = searchQuery.toLowerCase();
    return data.unauthorizedApiKeyAttempts.filter(
      (a) =>
        a.attemptedKeyPrefix.toLowerCase().includes(q) ||
        a.endpoint.toLowerCase().includes(q) ||
        a.ipAddress.includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.errorReason.toLowerCase().includes(q)
    );
  }, [data?.unauthorizedApiKeyAttempts, searchQuery]);

  const activeSessionsCount = data?.sessions.filter((s) => s.status !== 'revoked').length || 0;
  const otherActiveSessionsCount = data?.sessions.filter((s) => !s.isCurrent && s.status !== 'revoked').length || 0;
  const isHighThreat = data?.metrics?.threatLevel === 'ELEVATED' || data?.metrics?.threatLevel === 'HIGH';

  return (
    <div className="space-y-6">
      {/* Header Banner & Real-Time Controls */}
      <div className="rounded-3xl border border-white/[.1] bg-[#0d0d12] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400/20 via-orange-500/15 to-rose-500/20 border border-amber-400/30 flex items-center justify-center shadow-inner">
                <ShieldAlert size={20} className="text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white tracking-tight">Real-Time Security Monitor</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase border ${
                    isHighThreat
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isHighThreat ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}></span>
                    Threat: {data?.metrics?.threatLevel || 'NORMAL'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Live session telemetry, heuristic intrusion defense, and unauthorized API key interception.
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Polling Toggle */}
            <div className="flex items-center gap-1.5 bg-[#14141a] border border-white/[.08] px-3 py-1.5 rounded-xl text-xs">
              <span className="relative flex h-2 w-2">
                {pollingActive ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
                )}
              </span>
              <button
                onClick={() => setPollingActive(!pollingActive)}
                className="text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
                title={pollingActive ? 'Click to pause automatic polling' : 'Click to resume real-time polling'}
              >
                {pollingActive ? `LIVE (${pollIntervalSeconds}s)` : 'PAUSED'}
              </button>
            </div>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchMonitorData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-[#14141a] px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[.06] transition-colors disabled:opacity-50"
              title="Query security gateway now"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-amber-400' : 'text-zinc-400'} />
              <span>Sync</span>
            </button>

            {/* Test Intrusion Simulation Trigger */}
            <div className="relative group">
              <button
                disabled={simulating}
                className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-400/15 transition-colors disabled:opacity-50"
              >
                <Flame size={13} />
                <span>Simulate Threat</span>
                <ChevronDown size={12} className="opacity-70" />
              </button>

              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-white/[.12] bg-[#121218] p-1.5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                <button
                  onClick={() => handleSimulateThreat('suspicious_login')}
                  className="w-full text-left rounded-xl px-3 py-2 text-xs text-zinc-200 hover:bg-white/[.06] flex items-center justify-between"
                >
                  <span>Suspicious Login Spray</span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Brute-Force</span>
                </button>
                <button
                  onClick={() => handleSimulateThreat('unauthorized_api')}
                  className="w-full text-left rounded-xl px-3 py-2 text-xs text-zinc-200 hover:bg-white/[.06] flex items-center justify-between"
                >
                  <span>Unauthorized API Probe</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Token 401</span>
                </button>
              </div>
            </div>

            {/* Mass Revocation Kill-switch Button */}
            {otherActiveSessionsCount > 0 && (
              <button
                onClick={() => setShowConfirmRevokeAll(true)}
                disabled={revokingAll}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-all shadow-sm"
              >
                <Ban size={13} />
                <span>Revoke All Other Sessions ({otherActiveSessionsCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Real-time Telemetry Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          <div className="rounded-2xl border border-white/[.06] bg-[#121218]/80 p-3.5">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Active Sessions</span>
              <Users size={14} className="text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{activeSessionsCount}</span>
              <span className="text-[11px] text-zinc-500 font-mono">online now</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">
              {data?.sessions.filter((s) => s.role === 'Owner').length || 1} owner, {data?.sessions.filter((s) => s.role !== 'Owner' && s.status === 'active').length || 0} users
            </div>
          </div>

          <div className="rounded-2xl border border-white/[.06] bg-[#121218]/80 p-3.5">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Suspicious Logins</span>
              <AlertTriangle size={14} className="text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-300">
                {data?.suspiciousLogins?.length || 0}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                auto-intercepted
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">
              {data?.suspiciousLogins?.filter((l) => l.blocked).length || 0} IPs automatically barred
            </div>
          </div>

          <div className="rounded-2xl border border-white/[.06] bg-[#121218]/80 p-3.5">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Unauthorized API Keys</span>
              <Key size={14} className="text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-300">
                {data?.unauthorizedApiKeyAttempts?.length || 0}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                401/403
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">
              Attempted token forgery & revoked keys
            </div>
          </div>

          <div className="rounded-2xl border border-white/[.06] bg-[#121218]/80 p-3.5">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Perimeter Jail</span>
              <Slash size={14} className="text-zinc-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-zinc-200">
                {data?.blockedIps?.length || 0}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">blocked IPs</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
              <CheckCircle size={10} /> Active edge filter
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[.06] pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'sessions'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[.04]'
            }`}
          >
            <Users size={14} />
            <span>Active Sessions</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeTab === 'sessions' ? 'bg-black/20 text-black' : 'bg-white/[.08] text-zinc-300'
            }`}>
              {activeSessionsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logins')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'logins'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[.04]'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Suspicious Logins</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeTab === 'logins' ? 'bg-black/20 text-black' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {data?.suspiciousLogins?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('api-keys')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'api-keys'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[.04]'
            }`}
          >
            <Key size={14} />
            <span>Unauthorized API Key Access</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeTab === 'api-keys' ? 'bg-black/20 text-black' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {data?.unauthorizedApiKeyAttempts?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('blocked-ips')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'blocked-ips'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[.04]'
            }`}
          >
            <Ban size={14} />
            <span>Blocked IP Perimeter</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              activeTab === 'blocked-ips' ? 'bg-black/20 text-black' : 'bg-white/[.08] text-zinc-300'
            }`}>
              {data?.blockedIps?.length || 0}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by IP, email, country, reason..."
            className="w-full rounded-xl border border-white/[.08] bg-[#121218] pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* =========================================================================
          TAB 1: ACTIVE SESSIONS (WITH REVOKE BUTTONS)
         ========================================================================= */}
      {activeTab === 'sessions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Showing {filteredSessions.length} total recorded session state(s)</span>
            <span className="font-mono text-[11px] text-zinc-500">
              Heartbeat refreshed: {lastTick.toLocaleTimeString()}
            </span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-8 text-center text-zinc-500 text-xs">
              No active sessions match your search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredSessions.map((session) => {
                const isRevoked = session.status === 'revoked';
                const isCurrent = session.isCurrent;
                const isSuspicious = session.riskScore >= 60 || session.status === 'suspicious';

                return (
                  <div
                    key={session.id}
                    className={`rounded-2xl border transition-all p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isRevoked
                        ? 'border-white/[.03] bg-[#0a0a0d]/60 opacity-60'
                        : isSuspicious
                        ? 'border-amber-500/30 bg-amber-500/[.03]'
                        : isCurrent
                        ? 'border-emerald-500/30 bg-emerald-500/[.02]'
                        : 'border-white/[.06] bg-[#0c0c10] hover:border-white/[.12]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Device Icon */}
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isRevoked
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-600'
                          : isSuspicious
                          ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                          : isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-white/[.03] border-white/[.08] text-zinc-300'
                      }`}>
                        {session.deviceType === 'Mobile' ? (
                          <Smartphone size={18} />
                        ) : session.deviceType === 'API Agent' ? (
                          <Terminal size={18} />
                        ) : (
                          <Monitor size={18} />
                        )}
                      </div>

                      {/* Info Block */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-semibold text-xs ${isRevoked ? 'text-zinc-500 line-through' : 'text-white'}`}>
                            {session.userName}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-400">({session.userEmail})</span>

                          {/* Role Badge */}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[.05] border border-white/[.08] text-zinc-300">
                            {session.role}
                          </span>

                          {/* Current Session Tag */}
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Current Session
                            </span>
                          )}

                          {/* Revoked Tag */}
                          {isRevoked && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                              TERMINATED
                            </span>
                          )}

                          {/* Risk Warning Tag */}
                          {!isRevoked && isSuspicious && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              Risk Score: {session.riskScore}/100
                            </span>
                          )}
                        </div>

                        {/* Location, IP, Browser Metadata */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1 font-mono text-zinc-300">
                            <Globe size={11} className="text-zinc-500" />
                            {session.location} ({session.countryCode})
                          </span>

                          <button
                            onClick={() => copyToClipboard(session.ipAddress)}
                            className="flex items-center gap-1 font-mono text-zinc-400 hover:text-amber-300 transition-colors"
                            title="Click to copy IP"
                          >
                            <span>IP: {session.ipAddress}</span>
                            {copiedIp === session.ipAddress ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} className="opacity-50" />
                            )}
                          </button>

                          <span className="text-zinc-500">•</span>
                          <span>{session.browser} on {session.os}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Clock size={11} className="text-zinc-500" />
                            Active: {new Date(session.lastActiveAt).toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Risk Flags pill stack */}
                        {!isRevoked && session.riskFlags && session.riskFlags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {session.riskFlags.map((flag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20"
                              >
                                ⚠ {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Revoke Session Button */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isRevoked ? (
                        <>
                          {isCurrent ? (
                            <span className="text-[11px] font-mono text-emerald-400/80 px-2 py-1">
                              Protected
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRevokeSession(session)}
                              disabled={revokingSessionId === session.id}
                              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-3.5 py-1.5 text-xs font-medium transition-all shadow-sm disabled:opacity-50"
                            >
                              <Ban size={13} />
                              <span>{revokingSessionId === session.id ? 'Revoking...' : 'Revoke Session'}</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-500 italic">
                          Session Killed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: SUSPICIOUS LOGIN ATTEMPTS (IDENTIFY & MITIGATE)
         ========================================================================= */}
      {activeTab === 'logins' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Heuristic Login Anomaly Log</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                Velocity Jumps • Brute-Force Bursts • Tor Relays
              </span>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">{filteredLogins.length} events logged</span>
          </div>

          {filteredLogins.length === 0 ? (
            <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-8 text-center text-zinc-500 text-xs">
              No suspicious login attempts found.
            </div>
          ) : (
            <div className="divide-y divide-white/[.06] rounded-2xl border border-white/[.08] bg-[#0c0c10] overflow-hidden">
              {filteredLogins.map((attempt) => {
                const isBlocked = data?.blockedIps?.includes(attempt.ipAddress) || attempt.blocked;

                return (
                  <div key={attempt.id} className="p-4 hover:bg-white/[.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Severity Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          attempt.severity === 'critical'
                            ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                            : attempt.severity === 'high'
                            ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                            : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                        }`}>
                          {attempt.severity}
                        </span>

                        <span className="font-semibold text-white">{attempt.email}</span>
                        <span className="text-zinc-500">•</span>

                        <button
                          onClick={() => copyToClipboard(attempt.ipAddress)}
                          className="font-mono text-zinc-300 hover:text-amber-400 flex items-center gap-1"
                        >
                          <span>{attempt.ipAddress}</span>
                          {copiedIp === attempt.ipAddress ? (
                            <Check size={10} className="text-emerald-400" />
                          ) : (
                            <Copy size={10} className="opacity-40" />
                          )}
                        </button>

                        <span className="text-zinc-500 font-mono">({attempt.location})</span>

                        {isBlocked && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            IP JAILED
                          </span>
                        )}
                      </div>

                      {/* Reason & heuristic analysis */}
                      <p className="text-xs text-zinc-300 font-medium">
                        {attempt.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-mono">
                        <span>Agent: {attempt.userAgent}</span>
                        <span>Time: {new Date(attempt.timestamp).toLocaleString()}</span>
                        <span className="text-emerald-400">Action: {attempt.actionTaken}</span>
                      </div>
                    </div>

                    {/* Threat Mitigation Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleBlockIp(attempt.ipAddress, Boolean(isBlocked))}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isBlocked
                            ? 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            : 'border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                        }`}
                      >
                        <Ban size={12} />
                        <span>{isBlocked ? 'Unblock IP' : 'Blacklist IP'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: UNAUTHORIZED API KEY ACCESS (INTERCEPT & DIAGNOSE)
         ========================================================================= */}
      {activeTab === 'api-keys' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Unauthorized API Gateway Interceptions</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                HTTP 401 Unauthorized • HTTP 403 Forbidden
              </span>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">{filteredApiAttempts.length} intrusions caught</span>
          </div>

          {filteredApiAttempts.length === 0 ? (
            <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-8 text-center text-zinc-500 text-xs">
              No unauthorized API key attempts recorded.
            </div>
          ) : (
            <div className="divide-y divide-white/[.06] rounded-2xl border border-white/[.08] bg-[#0c0c10] overflow-hidden">
              {filteredApiAttempts.map((attempt) => {
                const isBlocked = data?.blockedIps?.includes(attempt.ipAddress) || attempt.blocked;

                return (
                  <div key={attempt.id} className="p-4 hover:bg-white/[.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Method badge */}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {attempt.method}
                        </span>

                        <span className="font-mono font-semibold text-white">{attempt.endpoint}</span>
                        <span className="text-zinc-500">•</span>

                        <span className="font-mono text-zinc-400 bg-white/[.04] px-2 py-0.5 rounded">
                          Key: {attempt.attemptedKeyPrefix}
                        </span>

                        <span className="text-zinc-500 font-mono">({attempt.location})</span>

                        {isBlocked && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            BLOCKED
                          </span>
                        )}
                      </div>

                      {/* Error & Breach Reason */}
                      <p className="text-xs text-rose-300 font-medium flex items-center gap-1.5">
                        <XCircle size={13} className="text-rose-400 shrink-0" />
                        <span>{attempt.errorReason}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-mono">
                        <span>IP: {attempt.ipAddress}</span>
                        <span>Client: {attempt.userAgent}</span>
                        <span>Timestamp: {new Date(attempt.timestamp).toLocaleTimeString()}</span>
                        <span className="text-zinc-400">Gateway: {attempt.actionTaken}</span>
                      </div>
                    </div>

                    {/* Block Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleBlockIp(attempt.ipAddress, Boolean(isBlocked))}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isBlocked
                            ? 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            : 'border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                        }`}
                      >
                        <Ban size={12} />
                        <span>{isBlocked ? 'Unblock IP' : 'Block IP'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: BLOCKED IP PERIMETER JAIL
         ========================================================================= */}
      {activeTab === 'blocked-ips' && (
        <div className="rounded-2xl border border-white/[.08] bg-[#0c0c10] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[.06] pb-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Perimeter Blacklist Jail</h4>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                IPs listed here are dropped at the TCP/HTTP ingress router prior to execution.
              </p>
            </div>
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              {data?.blockedIps?.length || 0} IPs Active In Jail
            </span>
          </div>

          {(!data?.blockedIps || data.blockedIps.length === 0) ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No IPs currently blacklisted.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {data.blockedIps.map((ip) => (
                <div
                  key={ip}
                  className="rounded-xl border border-white/[.06] bg-[#121218] p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 font-mono text-zinc-200">
                    <Slash size={13} className="text-rose-400" />
                    <span>{ip}</span>
                  </div>
                  <button
                    onClick={() => handleToggleBlockIp(ip, true)}
                    className="text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/[.06] transition-colors"
                  >
                    Release
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION MODAL FOR "REVOKE ALL OTHER SESSIONS"
         ========================================================================= */}
      {showConfirmRevokeAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#0f0f14] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Revoke All Other Sessions?</h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Emergency superuser session eviction.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-rose-500/[.06] border border-rose-500/20 rounded-2xl p-3.5">
              This action will immediately invalidate all {otherActiveSessionsCount} active login tokens across all external clients and devices. Only your current platform owner session will remain active.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmRevokeAll(false)}
                className="rounded-xl border border-white/[.08] bg-white/[.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeAllOtherSessions}
                className="rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold px-4 py-2 text-xs transition-colors shadow-lg shadow-rose-500/20"
              >
                Yes, Revoke All Sessions Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
