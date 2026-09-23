import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Terminal,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Download,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  Shield,
  Database,
  Cpu,
  Zap,
  Bot,
  Volume2,
  Lock,
  Copy,
  Check,
  ChevronRight,
  X,
  Play,
  Pause,
  ExternalLink,
  Code2,
  Server,
  Radio,
  Clock,
  Sliders,
  Sparkles
} from 'lucide-react';

export interface SystemLogEvent {
  id: string;
  timestamp: string;
  category: 'AUTH' | 'INFERENCE' | 'ERROR' | 'SECURITY' | 'DATABASE' | 'ADMIN' | 'VOICE';
  status: 'SUCCESS' | 'WARN' | 'ERROR' | 'INFO';
  message: string;
  userEmail?: string;
  ipAddress?: string;
  latencyMs?: number;
  statusCode?: number;
  modelUsed?: string;
  details?: Record<string, any>;
  stack?: string;
}

interface SystemLogsProps {
  onAddToast?: (toast: {
    title: string;
    message: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    metric?: string;
    code?: string;
  }) => void;
}

export function SystemLogs({ onAddToast }: SystemLogsProps) {
  const [logs, setLogs] = useState<SystemLogEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  // 30-Second Auto-Refresh State & Interval Management
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(30);
  const [countdown, setCountdown] = useState(30);

  const [selectedLog, setSelectedLog] = useState<SystemLogEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Fetch real logs from server endpoint
  const fetchLogs = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch('/api/admin/logs', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch {
      // Offline fallback: retain existing logs
    } finally {
      if (!quiet) setLoading(false);
      setCountdown(refreshIntervalSec);
    }
  }, [refreshIntervalSec]);

  // 1-second ticking countdown for accurate UX feedback
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLogs(true);
          return refreshIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshIntervalSec, fetchLogs]);

  // Initial fetch on mount or interval change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Copy helper
  const handleCopy = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  // Clear / Purge logs on server
  const handlePurgeLogs = async () => {
    if (!window.confirm('Are you sure you want to purge all platform system logs?')) return;
    try {
      const res = await fetch('/api/admin/purge-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'logs' })
      });
      if (res.ok) {
        setLogs([]);
        if (onAddToast) {
          onAddToast({
            title: 'Logs Purged',
            message: 'All system logs have been cleared from server memory.',
            type: 'warning',
            metric: '0 Logs Active'
          });
        }
      }
    } catch {
      setLogs([]);
    }
  };

  // Export logs
  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    let content = '';
    let mimeType = 'text/plain';
    const filename = `zenixmind-system-logs-${new Date().toISOString().slice(0, 10)}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      const headers = ['id', 'timestamp', 'category', 'status', 'statusCode', 'latencyMs', 'userEmail', 'ipAddress', 'message'];
      const rows = logs.map((l) => [
        l.id,
        l.timestamp,
        l.category,
        l.status,
        l.statusCode || '',
        l.latencyMs || '',
        `"${(l.userEmail || '').replace(/"/g, '""')}"`,
        l.ipAddress || '',
        `"${l.message.replace(/"/g, '""')}"`
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      mimeType = 'text/csv';
    } else {
      content = logs
        .map(
          (l) =>
            `[${l.timestamp}] [${l.category}] [${l.status}] ${l.statusCode ? `HTTP ${l.statusCode} ` : ''}${
              l.latencyMs ? `(${l.latencyMs}ms) ` : ''
            }- ${l.message} (User: ${l.userEmail || 'anon'} IP: ${l.ipAddress || 'none'})`
        )
        .join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    if (onAddToast) {
      onAddToast({
        title: 'Logs Exported',
        message: `Exported ${logs.length} server events as ${format.toUpperCase()}.`,
        type: 'success',
        metric: `${logs.length} Records`
      });
    }
  };

  // Simulate realistic server events for live testing
  const handleSimulateEvent = (type: 'error' | 'auth_fail' | 'auth_ok' | 'db_peak' | 'inference') => {
    const now = new Date().toISOString();
    let newLog: SystemLogEvent;

    if (type === 'error') {
      newLog = {
        id: 'log-err-' + Date.now(),
        timestamp: now,
        category: 'ERROR',
        status: 'ERROR',
        statusCode: 500,
        message: 'Unhandled Promise Rejection in Streaming LLM Socket: Model chunk timeout at byte 4096.',
        userEmail: 'dannyyoungofficial1@gmail.com',
        ipAddress: '192.178.4.12',
        latencyMs: 1240,
        modelUsed: 'claude-3.7-sonnet',
        details: { socketError: 'ECONNRESET', streamState: 'HALTED_PREMATURELY' },
        stack: 'Error: Connection reset by peer\n    at TLSSocket.onSocketClose (node:net:894:12)\n    at emitError (node:events:518:28)'
      };
    } else if (type === 'auth_fail') {
      newLog = {
        id: 'log-auth-fail-' + Date.now(),
        timestamp: now,
        category: 'AUTH',
        status: 'WARN',
        statusCode: 401,
        message: 'Authentication Probe Rejected: Invalid signature on HMAC Bearer token.',
        userEmail: 'unauthorized-agent@94.23.11.4',
        ipAddress: '94.23.11.4',
        details: { reason: 'EXPIRED_JWT_SIGNATURE', tokenPrefix: 'eyJhbGciOi...' }
      };
    } else if (type === 'auth_ok') {
      newLog = {
        id: 'log-auth-ok-' + Date.now(),
        timestamp: now,
        category: 'AUTH',
        status: 'SUCCESS',
        statusCode: 200,
        message: 'Owner Level 0 Superuser Session Authenticated via Whitelist Rule.',
        userEmail: 'dannyyoungofficial1@gmail.com',
        ipAddress: '192.178.4.12',
        details: { role: 'SUPERUSER_LEVEL_0', mfaVerified: true }
      };
    } else if (type === 'db_peak') {
      newLog = {
        id: 'log-db-' + Date.now(),
        timestamp: now,
        category: 'DATABASE',
        status: 'WARN',
        statusCode: 200,
        latencyMs: 84,
        message: 'IndexedDB & Server Cache write throughput reached 92% buffer capacity threshold.',
        details: { cacheItems: 1420, writeBandwidthKbps: 840, autoCompactionTriggered: true }
      };
    } else {
      newLog = {
        id: 'log-inf-' + Date.now(),
        timestamp: now,
        category: 'INFERENCE',
        status: 'SUCCESS',
        statusCode: 200,
        latencyMs: 248,
        modelUsed: 'gemini-2.5-flash',
        message: 'Gemini 2.5 Flash completed multimodal reasoning inference request.',
        userEmail: 'dannyyoungofficial1@gmail.com',
        ipAddress: '192.178.4.12',
        details: { promptTokens: 380, responseTokens: 640, totalTokens: 1020 }
      };
    }

    setLogs((prev) => [newLog, ...prev]);

    if (onAddToast) {
      onAddToast({
        title: newLog.status === 'ERROR' ? 'Server Error Logged' : newLog.status === 'WARN' ? 'System Warning Logged' : 'Event Logged',
        message: newLog.message,
        type: newLog.status === 'ERROR' ? 'critical' : newLog.status === 'WARN' ? 'warning' : 'success',
        metric: newLog.latencyMs ? `${newLog.latencyMs}ms` : undefined,
        code: newLog.category
      });
    }
  };

  // Filtered list calculation
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (showErrorsOnly && log.status !== 'ERROR') return false;
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) return false;
      if (selectedStatus !== 'ALL' && log.status !== selectedStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(q)) ||
        (log.modelUsed && log.modelUsed.toLowerCase().includes(q)) ||
        (log.category && log.category.toLowerCase().includes(q)) ||
        (log.statusCode && log.statusCode.toString().includes(q))
      );
    });
  }, [logs, searchQuery, selectedCategory, selectedStatus, showErrorsOnly]);

  // Status breakdown metrics
  const metrics = useMemo(() => {
    let errorCount = 0;
    let warnCount = 0;
    let authCount = 0;
    let dbCount = 0;
    let inferenceCount = 0;

    for (const l of logs) {
      if (l.status === 'ERROR') errorCount++;
      if (l.status === 'WARN') warnCount++;
      if (l.category === 'AUTH') authCount++;
      if (l.category === 'DATABASE') dbCount++;
      if (l.category === 'INFERENCE') inferenceCount++;
    }

    return { total: logs.length, errorCount, warnCount, authCount, dbCount, inferenceCount };
  }, [logs]);

  return (
    <div className="space-y-6 animate-in fade-in font-sans">
      {/* Top Telemetry & Control Bar */}
      <div className="rounded-2xl border border-white/[.08] bg-[#0b0b0e] p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
              <Terminal size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">Real-Time Platform System Logs</h2>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  DATABASE STREAM ACTIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Monitoring authenticated logins, server errors, API dispatches, database I/O, and security events.
              </p>
            </div>
          </div>

          {/* 30-SECOND AUTO-REFRESH CONTROLS & INTERVAL SELECTOR */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Auto-Refresh 30s Switch & Countdown Indicator */}
            <div className="flex items-center rounded-xl border border-white/[.1] bg-[#141418] p-1 gap-1">
              <button
                onClick={() => {
                  const nextState = !autoRefresh;
                  setAutoRefresh(nextState);
                  if (nextState) setCountdown(refreshIntervalSec);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  autoRefresh
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Toggle real-time auto-refresh"
              >
                {autoRefresh ? (
                  <>
                    <Radio size={12} className="text-emerald-400 animate-pulse" />
                    <span>Auto-Refresh: ON</span>
                    <span className="ml-1 rounded bg-black/40 px-1.5 py-0.2 text-[10px] font-mono text-emerald-200">
                      {countdown}s
                    </span>
                  </>
                ) : (
                  <>
                    <Pause size={12} />
                    <span>Auto-Refresh: OFF</span>
                  </>
                )}
              </button>

              {/* Interval Dropdown Selector */}
              <select
                value={refreshIntervalSec}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRefreshIntervalSec(val);
                  setCountdown(val);
                }}
                className="bg-transparent text-[11px] font-mono font-semibold text-zinc-300 outline-none px-1.5 py-0.5 cursor-pointer hover:text-white"
                title="Select Auto-Refresh interval"
              >
                <option value={10} className="bg-[#141418] text-white">10s</option>
                <option value={30} className="bg-[#141418] text-white">30s (Default)</option>
                <option value={60} className="bg-[#141418] text-white">60s</option>
                <option value={120} className="bg-[#141418] text-white">2m</option>
              </select>
            </div>

            {/* Manual Fetch Button */}
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-white/[.1] bg-[#141418] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-[#1f1f26] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin text-amber-400' : ''} />
              <span>Fetch Now</span>
            </button>

            {/* Export Menu */}
            <div className="flex items-center rounded-xl border border-white/[.1] bg-[#141418] overflow-hidden text-xs">
              <button
                onClick={() => handleExport('json')}
                className="px-2.5 py-1.5 text-zinc-300 hover:bg-white/[.05] border-r border-white/[.08]"
                title="Export as JSON"
              >
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-2.5 py-1.5 text-zinc-300 hover:bg-white/[.05] border-r border-white/[.08]"
                title="Export as CSV"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="px-2.5 py-1.5 text-zinc-300 hover:bg-white/[.05]"
                title="Export as Raw Log text"
              >
                LOG
              </button>
            </div>

            {/* Clear Logs */}
            <button
              onClick={handlePurgeLogs}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={12} />
              <span>Purge</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-6 gap-2 pt-4 border-t border-white/[.06]">
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
              setShowErrorsOnly(false);
            }}
            className="flex flex-col rounded-xl bg-[#0e0e12] border border-white/[.05] p-2.5 text-left hover:border-white/[.15] transition-all"
          >
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Total Stream</span>
            <span className="text-base font-bold text-white font-mono mt-0.5">{metrics.total}</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('ERROR');
              setShowErrorsOnly(true);
            }}
            className="flex flex-col rounded-xl bg-[#18080a] border border-red-500/20 p-2.5 text-left hover:border-red-500/40 transition-all"
          >
            <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <AlertOctagon size={11} /> Errors
            </span>
            <span className="text-base font-bold text-red-300 font-mono mt-0.5">{metrics.errorCount}</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatus('WARN');
              setShowErrorsOnly(false);
            }}
            className="flex flex-col rounded-xl bg-[#181105] border border-amber-500/20 p-2.5 text-left hover:border-amber-500/40 transition-all"
          >
            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={11} /> Warnings
            </span>
            <span className="text-base font-bold text-amber-300 font-mono mt-0.5">{metrics.warnCount}</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('AUTH');
              setShowErrorsOnly(false);
            }}
            className="flex flex-col rounded-xl bg-[#09111c] border border-sky-500/20 p-2.5 text-left hover:border-sky-500/40 transition-all"
          >
            <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <Lock size={11} /> Auth Logins
            </span>
            <span className="text-base font-bold text-sky-300 font-mono mt-0.5">{metrics.authCount}</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('INFERENCE');
              setShowErrorsOnly(false);
            }}
            className="flex flex-col rounded-xl bg-[#140b1c] border border-purple-500/20 p-2.5 text-left hover:border-purple-500/40 transition-all"
          >
            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Bot size={11} /> Inferences
            </span>
            <span className="text-base font-bold text-purple-300 font-mono mt-0.5">{metrics.inferenceCount}</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategory('DATABASE');
              setShowErrorsOnly(false);
            }}
            className="flex flex-col rounded-xl bg-[#06140f] border border-emerald-500/20 p-2.5 text-left hover:border-emerald-500/40 transition-all"
          >
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Database size={11} /> Database I/O
            </span>
            <span className="text-base font-bold text-emerald-300 font-mono mt-0.5">{metrics.dbCount}</span>
          </button>
        </div>

        {/* Live Simulator Toolbar */}
        <div className="mt-4 pt-4 border-t border-white/[.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
            <Zap size={13} className="text-amber-400" />
            Inject Simulated Live Server Event:
          </span>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => handleSimulateEvent('error')}
              className="rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/20 transition-colors"
            >
              + 500 Error
            </button>
            <button
              onClick={() => handleSimulateEvent('auth_fail')}
              className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              + Auth 401 Probe
            </button>
            <button
              onClick={() => handleSimulateEvent('auth_ok')}
              className="rounded-lg bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-[11px] font-medium text-sky-300 hover:bg-sky-500/20 transition-colors"
            >
              + Owner Login
            </button>
            <button
              onClick={() => handleSimulateEvent('inference')}
              className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
            >
              + Gemini Probe
            </button>
            <button
              onClick={() => handleSimulateEvent('db_peak')}
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              + DB Peak
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-white/[.08] bg-[#0b0b0e] p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs by message, IP, user email, model, or status code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/[.1] bg-[#060608] pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-amber-400/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {['ALL', 'AUTH', 'ERROR', 'INFERENCE', 'SECURITY', 'DATABASE', 'VOICE'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (cat === 'ERROR') setShowErrorsOnly(true);
              }}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'bg-white/[.04] text-zinc-400 hover:text-zinc-200 hover:bg-white/[.08]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Log Stream Terminal */}
      <div className="rounded-2xl border border-white/[.08] bg-[#060608] shadow-2xl overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between bg-[#0e0e12] border-b border-white/[.06] px-4 py-2.5 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-bold text-zinc-300 ml-2">stdout / server_events.log</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>
              Showing <strong className="text-white">{filteredLogs.length}</strong> of {logs.length} events
            </span>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="h-[520px] overflow-y-auto divide-y divide-white/[.03] p-1 font-mono text-[11px]">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-zinc-500">
              <Terminal size={36} className="mb-3 opacity-40 text-amber-400" />
              <p className="text-sm font-semibold text-zinc-300">No matching system log events found</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Try adjusting your search criteria or click "Inject Simulated Live Server Event" to test the logger.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isError = log.status === 'ERROR';
              const isWarn = log.status === 'WARN';
              const isSuccess = log.status === 'SUCCESS';

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`group flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-white/[.04] ${
                    isError
                      ? 'bg-red-500/[.03] border-l-2 border-red-500'
                      : isWarn
                      ? 'bg-amber-500/[.02] border-l-2 border-amber-500'
                      : 'border-l-2 border-transparent'
                  }`}
                >
                  {/* Timestamp */}
                  <span className="text-zinc-500 text-[10px] shrink-0 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>

                  {/* Severity Badge */}
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold shrink-0 uppercase ${
                      isError
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : isWarn
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : isSuccess
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {log.status}
                  </span>

                  {/* Category */}
                  <span className="rounded bg-white/[.06] text-zinc-400 px-1.5 py-0.2 text-[9px] font-semibold shrink-0">
                    {log.category}
                  </span>

                  {/* Status Code */}
                  {log.statusCode && (
                    <span
                      className={`text-[9px] font-bold px-1 rounded shrink-0 ${
                        log.statusCode >= 500
                          ? 'text-red-400 bg-red-950/60'
                          : log.statusCode >= 400
                          ? 'text-amber-400 bg-amber-950/60'
                          : 'text-emerald-400 bg-emerald-950/60'
                      }`}
                    >
                      {log.statusCode}
                    </span>
                  )}

                  {/* Message */}
                  <span className="text-zinc-200 flex-1 break-all line-clamp-2 leading-relaxed">
                    {log.message}
                  </span>

                  {/* Metadata Pills */}
                  <div className="flex items-center gap-2 shrink-0 text-[10px]">
                    {log.latencyMs !== undefined && (
                      <span className="font-mono text-zinc-400 bg-white/[.03] px-1.5 py-0.5 rounded">
                        {log.latencyMs}ms
                      </span>
                    )}

                    {log.modelUsed && (
                      <span className="text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                        {log.modelUsed}
                      </span>
                    )}

                    {log.userEmail && (
                      <span className="text-zinc-400 max-w-[120px] truncate hidden sm:inline" title={log.userEmail}>
                        {log.userEmail}
                      </span>
                    )}

                    {log.ipAddress && (
                      <span className="text-zinc-600 hidden md:inline">
                        {log.ipAddress}
                      </span>
                    )}

                    <ChevronRight size={13} className="text-zinc-600 group-hover:text-amber-400 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Expanded Log Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/[.1] bg-[#0c0c10] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-4 bg-[#101015]">
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-xl ${
                    selectedLog.status === 'ERROR'
                      ? 'bg-red-500/20 text-red-400'
                      : selectedLog.status === 'WARN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Log Event Inspector</span>
                    <span className="rounded bg-white/[.08] px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                      {selectedLog.id}
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {new Date(selectedLog.timestamp).toUTCString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/[.08] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-4">
              {/* Main Message */}
              <div className="rounded-xl border border-white/[.08] bg-[#070709] p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Event Message
                </span>
                <p className="text-xs text-white font-mono leading-relaxed">{selectedLog.message}</p>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="rounded-xl bg-[#08080a] border border-white/[.05] p-3">
                  <span className="text-[10px] text-zinc-500 block">Category</span>
                  <span className="font-bold text-white mt-1 block">{selectedLog.category}</span>
                </div>
                <div className="rounded-xl bg-[#08080a] border border-white/[.05] p-3">
                  <span className="text-[10px] text-zinc-500 block">Status Code</span>
                  <span
                    className={`font-bold mt-1 block ${
                      selectedLog.statusCode && selectedLog.statusCode >= 400 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedLog.statusCode || '200 OK'}
                  </span>
                </div>
                <div className="rounded-xl bg-[#08080a] border border-white/[.05] p-3">
                  <span className="text-[10px] text-zinc-500 block">Latency</span>
                  <span className="font-bold text-zinc-200 mt-1 block">
                    {selectedLog.latencyMs !== undefined ? `${selectedLog.latencyMs}ms` : 'N/A'}
                  </span>
                </div>
                <div className="rounded-xl bg-[#08080a] border border-white/[.05] p-3">
                  <span className="text-[10px] text-zinc-500 block">Client IP</span>
                  <span className="font-bold text-zinc-200 mt-1 block">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              {/* Stack Trace if present */}
              {selectedLog.stack && (
                <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-1">
                    Error Stack Trace
                  </span>
                  <pre className="text-[11px] font-mono text-red-300 overflow-x-auto whitespace-pre-wrap">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}

              {/* Full JSON Payload */}
              <div className="rounded-xl border border-white/[.08] bg-[#040406] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Raw JSON Event Payload
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2))}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300"
                  >
                    {copiedJson ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto p-3 rounded-lg bg-black/60 max-h-48">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-white/[.07] px-6 py-3 bg-[#101015]">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-white/[.08] px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[.15] transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
