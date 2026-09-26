import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  Users,
  Clock,
  Flame,
  TrendingUp,
  Calendar,
  Globe,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Smartphone,
  Sparkles,
  ArrowUpRight,
  Info,
  Shield,
  Zap,
  BarChart3
} from 'lucide-react';

export interface UserActivityRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  signupAt: string;
  lastLoginAt: string;
  previousLoginAt?: string;
  sessionCount: number;
  avgSessionDurationMinutes: number;
  totalTokens: number;
  peakTimeSlot: string;
  device: string;
  ipLocation: string;
  status: string;
}

export interface HourlyTrafficPoint {
  hour: string;
  label: string;
  logins: number;
  queries: number;
  loadScore: number;
  isPeak: boolean;
}

export interface ActivityAnalyticsResponse {
  timestamp: string;
  metrics: {
    totalUsers: number;
    dau: number;
    mau: number;
    stickinessPercent: string;
    avgSessionMinutes: number;
    peakHourWindow: string;
    peakConcurrencyEstimate: number;
    signupsThisWeek: number;
    signupsThisMonth: number;
    growthVelocityPercent: string;
  };
  hourlyTraffic: HourlyTrafficPoint[];
  users: UserActivityRecord[];
  topRegions: Array<{ region: string; sharePercent: number }>;
}

interface UserActivityAnalyticsProps {
  onAddToast?: (toast: {
    title: string;
    message: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    metric?: string;
  }) => void;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
  } catch {
    return dateStr;
  }
}

function formatUtcTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    });
  } catch {
    return dateStr;
  }
}

export function UserActivityAnalytics({ onAddToast }: UserActivityAnalyticsProps) {
  const [data, setData] = useState<ActivityAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D' | 'ALL'>('24H');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredHour, setHoveredHour] = useState<HourlyTrafficPoint | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserActivityRecord | null>(null);

  const fetchActivityData = useCallback(async (isManual = false) => {
    setIsLoading(true);
    try {
      const { getSupabase } = await import('../lib/supabase');
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch('/api/admin/activity-analytics', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const payload: ActivityAnalyticsResponse = await res.json();
        setData(payload);
        if (isManual && onAddToast) {
          onAddToast({
            title: 'Activity Ledger Synchronized',
            message: `Queried ${payload.users.length} user records and 24h traffic distribution matrix.`,
            type: 'success',
            metric: 'Synced'
          });
        }
      } else if (isManual && onAddToast) {
        onAddToast({
          title: 'Activity Sync Failed',
          message:
            res.status === 401 || res.status === 403
              ? 'Owner session required. Sign in with an owner account.'
              : `Server returned ${res.status}.`,
          type: 'warning',
          metric: String(res.status)
        });
      }
    } catch {
      if (isManual && onAddToast) {
        onAddToast({
          title: 'Activity Sync Offline',
          message: 'Could not reach the activity analytics endpoint.',
          type: 'critical'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [onAddToast]);

  useEffect(() => {
    fetchActivityData();
    const timer = setInterval(() => fetchActivityData(), 20000);
    return () => clearInterval(timer);
  }, [fetchActivityData]);

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.peakTimeSlot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.ipLocation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role.toUpperCase() === roleFilter.toUpperCase();
      return matchesSearch && matchesRole;
    });
  }, [data?.users, searchQuery, roleFilter]);

  const handleExportCSV = () => {
    if (!data?.users) return;
    const headers =
      'ID,Name,Email,Role,SignUpDate,LastLoginDate,PreviousLoginDate,SessionCount,AvgDurationMins,PeakTimeSlot,Device,Location,Status\n';
    const rows = data.users
      .map(
        (u) =>
          `"${u.id}","${u.name}","${u.email}","${u.role}","${u.signupAt}","${u.lastLoginAt}","${u.previousLoginAt || ''}","${u.sessionCount}","${u.avgSessionDurationMinutes}","${u.peakTimeSlot}","${u.device}","${u.ipLocation}","${u.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zenixmind-user-activity-ledger-${Date.now()}.csv`);
    link.click();
    if (onAddToast) {
      onAddToast({
        title: 'Activity Ledger Exported',
        message: 'Saved user sign-up and login timestamps ledger to CSV format.',
        type: 'info',
        metric: 'CSV File'
      });
    }
  };

  const metrics = data?.metrics;
  const hourly = data?.hourlyTraffic || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                User Sign-Up Activity & Login Timestamps
                <span className="rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.2 text-[9px] font-mono font-bold text-amber-300">
                  LIVE LEDGER
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real owner-authenticated activity from the platform auth store and traffic matrix.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl border border-white/[.08] bg-[#060608] p-1 text-[11px]">
            {(['24H', '7D', '30D', 'ALL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-colors ${
                  timeRange === t ? 'bg-amber-400 text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#121218] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-[#1c1c24] hover:text-white transition-colors"
          >
            <Download size={13} />
            <span>Export Ledger</span>
          </button>

          <button
            onClick={() => fetchActivityData(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[.08] to-[#0c0c10] p-4.5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame size={14} /> Primary Peak Load
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white font-mono tracking-tight zenix-metric-value">
              {metrics?.peakHourWindow || '—'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Peak window from live load scores</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-zinc-400">
            <span>Concurrency Peak:</span>
            <span className="font-mono font-bold text-white">{metrics?.peakConcurrencyEstimate ?? 0}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4.5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-sky-400" /> Stickiness (DAU/MAU)
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white font-mono tracking-tight zenix-metric-value">
              {metrics?.stickinessPercent ?? '—'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">DAU / MAU from live owner ledger</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[.06] flex items-center justify-between text-[10px] text-zinc-400">
            <span>DAU / Total:</span>
            <span className="font-mono font-bold text-white">
              {metrics?.dau ?? 0} / {metrics?.totalUsers ?? 0}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4.5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-purple-400" /> Avg Session Duration
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-white font-mono tracking-tight zenix-metric-value">
              {metrics?.avgSessionMinutes != null ? `${metrics.avgSessionMinutes} min` : '—'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">Across chat, voice, and workspace</p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[.06] flex items-center justify-between text-[10px] text-zinc-400">
            <span>MAU:</span>
            <span className="font-mono font-bold text-white">{metrics?.mau ?? 0}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-4.5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-400" /> Sign-Up Velocity
            </span>
            <span className="rounded bg-emerald-400/15 text-emerald-300 px-1.5 py-0.2 text-[9px] font-mono font-bold">
              {metrics?.growthVelocityPercent ?? '—'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-emerald-400 font-mono tracking-tight flex items-center gap-1.5 zenix-metric-value">
              <span>+{metrics?.signupsThisMonth ?? 0}</span>
              <span className="text-xs text-zinc-400 font-normal">this month</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              <span className="text-emerald-300 font-semibold">+{metrics?.signupsThisWeek ?? 0}</span> past 7 days
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[.06] flex items-center justify-between text-[10px] text-zinc-400">
            <span>Cohort:</span>
            <span className="font-mono font-bold text-emerald-300">Live cohort</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-400" />
              <h3 className="text-sm font-bold text-white">24-Hour Traffic Distribution</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Hourly load scores used for capacity planning.</p>
          </div>
        </div>

        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 sm:gap-1.5 h-36 items-end">
          {hourly.map((pt) => {
            const heightPercent = Math.max(8, Math.round(pt.loadScore));
            const barColor = pt.isPeak
              ? 'bg-gradient-to-t from-amber-500 to-amber-300'
              : pt.loadScore > 50
                ? 'bg-gradient-to-t from-sky-600 to-sky-400'
                : 'bg-zinc-800';
            return (
              <div
                key={pt.hour}
                onMouseEnter={() => setHoveredHour(pt)}
                onMouseLeave={() => setHoveredHour(null)}
                className="flex flex-col items-center h-full justify-end group cursor-pointer"
                title={`${pt.label}: load ${pt.loadScore}`}
              >
                <div style={{ height: `${heightPercent}%` }} className={`w-full rounded-t-md ${barColor}`} />
                <span className="text-[8px] text-zinc-600 mt-1 hidden sm:block">{pt.hour}</span>
              </div>
            );
          })}
        </div>
        {hoveredHour && (
          <p className="text-[11px] text-zinc-400 mt-3">
            {hoveredHour.label} · load {hoveredHour.loadScore}
            {hoveredHour.isPeak ? ' · peak window' : ''}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-white/[.06]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users size={15} className="text-sky-400" /> User ledger
            <span className="text-[10px] font-mono text-zinc-500">{filteredUsers.length} rows</span>
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, location…"
                className="rounded-lg border border-white/[.08] bg-[#060608] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/40 w-52"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-white/[.08] bg-[#060608] px-2.5 py-1.5 text-xs text-zinc-300"
            >
              <option value="ALL">All roles</option>
              <option value="Owner">Owner</option>
              <option value="Free">Free</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08080c] text-[10px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">User</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Signed up</th>
                <th className="px-4 py-2.5 font-semibold">Last login</th>
                <th className="px-4 py-2.5 font-semibold">Sessions</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.04]">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    {isLoading
                      ? 'Loading live ledger…'
                      : 'No users yet. Add SUPABASE_SERVICE_ROLE_KEY on Vercel for full auth-user list, or accounts will appear as they sign up.'}
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-white/[.02] cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-[10px] text-zinc-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{user.role}</td>
                  <td className="px-4 py-3 text-zinc-400" title={formatUtcTimestamp(user.signupAt)}>
                    {formatRelativeTime(user.signupAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400" title={formatUtcTimestamp(user.lastLoginAt)}>
                    {formatRelativeTime(user.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300">{user.sessionCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        user.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-zinc-500/15 text-zinc-400'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedUser && (
          <div className="border-t border-white/[.06] p-4 bg-[#08080c] text-xs text-zinc-400">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white">{selectedUser.name}</span>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white">
                Close
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <div>Email: {selectedUser.email}</div>
              <div>Peak: {selectedUser.peakTimeSlot}</div>
              <div>Device: {selectedUser.device}</div>
              <div>Location: {selectedUser.ipLocation}</div>
              <div>Signup: {formatUtcTimestamp(selectedUser.signupAt)}</div>
              <div>Last login: {formatUtcTimestamp(selectedUser.lastLoginAt)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
