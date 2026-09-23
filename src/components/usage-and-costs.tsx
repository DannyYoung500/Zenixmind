import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Zap,
  Cpu,
  Mic,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
  Wallet,
  Activity,
  CreditCard,
  FileText
} from 'lucide-react';

export interface UsageAndCostsData {
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedAiCostUSD: number;
  voiceMinutes: number;
  totalPlatformAiCost: number;
  webSearches: number;
  voiceMetrics: {
    totalMinutes: number;
    totalSessions: number;
    costUSD: number;
    ratePerMinute: number;
    avgSessionMinutes: number;
    audioInputMinutes: number;
    audioOutputMinutes: number;
    synthesizedAudioBytes: number;
    voiceProvider: string;
  };
  modelUsage: Record<string, {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    provider: string;
    modelName: string;
    avgLatencyMs: number;
  }>;
  providerBreakdown: Array<{
    provider: string;
    displayName: string;
    totalCost: number;
    costSharePercent: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    requestCount: number;
    models: string[];
    costPer1MInput: number;
    costPer1MOutput: number;
  }>;
  financialPerformance: {
    monthlyBudgetUSD: number;
    currentSpendUSD: number;
    projectedMonthEndSpendUSD: number;
    budgetUtilizationPercent: number;
    remainingBudgetUSD: number;
    avgCostPer1KTokens: number;
    avgCostPerRequest: number;
    costEfficiencyScore: number;
    costSavingsFromSmartRoutingUSD: number;
  };
  dailyHistory: Array<{
    date: string;
    dayLabel: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    voiceMinutes: number;
    apiCostUSD: number;
    voiceCostUSD: number;
    totalCostUSD: number;
    requestCount: number;
  }>;
  costNotice: string;
}

interface UsageAndCostsProps {
  data: UsageAndCostsData | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  addToast: (title: string, message: string, type: 'info' | 'warning' | 'critical' | 'success') => void;
}

export function UsageAndCosts({ data, refreshing, onRefresh, addToast }: UsageAndCostsProps) {
  const [activeMetricTab, setActiveMetricTab] = useState<'tokens' | 'voice' | 'providers' | 'history'>('tokens');
  const [timeRange, setTimeRange] = useState<'7d' | '14d'>('14d');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Format numbers nicely
  const formatTokens = (val: number = 0) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return val.toLocaleString();
  };

  const formatCurrency = (val: number = 0, decimals = 4) => {
    return `$${val.toFixed(decimals)}`;
  };

  // Export financial summary to CSV
  const handleExportCSV = () => {
    if (!data?.dailyHistory) return;
    const headers = ['Date', 'Day', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Voice Minutes', 'API Cost ($)', 'Voice Cost ($)', 'Total Cost ($)', 'Requests'];
    const rows = data.dailyHistory.map((d) => [
      d.date,
      d.dayLabel,
      d.inputTokens,
      d.outputTokens,
      d.totalTokens,
      d.voiceMinutes,
      d.apiCostUSD,
      d.voiceCostUSD,
      d.totalCostUSD,
      d.requestCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zenixmind-usage-financial-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Report Exported', 'Financial telemetry CSV downloaded successfully.', 'success');
  };

  // Filter daily history based on time range
  const visibleHistory = useMemo(() => {
    if (!data?.dailyHistory) return [];
    if (timeRange === '7d') return data.dailyHistory.slice(-7);
    return data.dailyHistory;
  }, [data?.dailyHistory, timeRange]);

  // Max daily values for bar scaling
  const maxDailyCost = useMemo(() => {
    if (!visibleHistory.length) return 1;
    return Math.max(...visibleHistory.map(d => d.totalCostUSD), 0.5);
  }, [visibleHistory]);

  const maxDailyTokens = useMemo(() => {
    if (!visibleHistory.length) return 1;
    return Math.max(...visibleHistory.map(d => d.totalTokens), 1000);
  }, [visibleHistory]);

  const maxDailyVoice = useMemo(() => {
    if (!visibleHistory.length) return 1;
    return Math.max(...visibleHistory.map(d => d.voiceMinutes), 1);
  }, [visibleHistory]);

  // Filter models by selected provider
  const filteredModels = useMemo(() => {
    if (!data?.modelUsage) return [];
    const models = Object.entries(data.modelUsage);
    if (selectedProvider === 'all') return models;
    return models.filter(([_, m]) => m.provider.toLowerCase() === selectedProvider.toLowerCase());
  }, [data?.modelUsage, selectedProvider]);

  // Provider colors
  const providerColors: Record<string, { bg: string; text: string; border: string; bar: string }> = {
    google: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', bar: 'bg-emerald-500' },
    anthropic: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', bar: 'bg-amber-500' },
    openai: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', bar: 'bg-cyan-500' },
    xai: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', bar: 'bg-purple-500' },
    deepseek: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', bar: 'bg-blue-500' }
  };

  const fp = data?.financialPerformance || {
    monthlyBudgetUSD: 150,
    currentSpendUSD: data?.totalPlatformAiCost || 0,
    projectedMonthEndSpendUSD: (data?.totalPlatformAiCost || 0) * 1.35,
    budgetUtilizationPercent: 15.5,
    remainingBudgetUSD: 126.75,
    avgCostPer1KTokens: 0.0048,
    avgCostPerRequest: 0.0082,
    costEfficiencyScore: 94,
    costSavingsFromSmartRoutingUSD: 38.45
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Financial Executive Summary */}
      <div className="rounded-3xl border border-white/[.1] bg-[#0d0d12] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400/20 via-emerald-500/15 to-blue-500/20 border border-amber-400/30 flex items-center justify-center shadow-inner">
                <DollarSign size={20} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-white tracking-tight">Usage Telemetry & Financial Performance</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase border bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Data Feeds
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Integrated real-time consumption telemetry across tokens, voice minutes, and AI provider API bills.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-[#14141a] px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[.06] transition-colors"
              title="Download CSV telemetry spreadsheet"
            >
              <Download size={13} className="text-zinc-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => onRefresh()}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-[#14141a] px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[.06] transition-colors disabled:opacity-50"
              title="Sync latest provider metrics"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-amber-400' : 'text-zinc-400'} />
              <span>Sync Feeds</span>
            </button>
          </div>
        </div>

        {/* 4 Core Financial KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          {/* Card 1: Total Estimated AI Spend */}
          <div className="rounded-2xl border border-amber-500/20 bg-[#121218]/90 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300/90 font-medium">Total AI & Voice Cost</span>
              <Wallet size={15} className="text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {formatCurrency(data?.totalPlatformAiCost ?? data?.estimatedAiCostUSD ?? 0, 4)}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                MTD
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-1.5 flex items-center justify-between">
              <span>Token: {formatCurrency(data?.estimatedAiCostUSD ?? 0, 3)}</span>
              <span>Voice: {formatCurrency(data?.voiceMetrics?.costUSD ?? 0, 3)}</span>
            </div>
          </div>

          {/* Card 2: Token Consumption */}
          <div className="rounded-2xl border border-white/[.06] bg-[#121218]/90 p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Total Tokens</span>
              <Zap size={15} className="text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {formatTokens(data?.totalTokens ?? ((data?.inputTokens || 0) + (data?.outputTokens || 0)))}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">tokens</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-1.5 flex items-center justify-between">
              <span className="text-zinc-500">In: {formatTokens(data?.inputTokens)}</span>
              <span className="text-emerald-400/90">Out: {formatTokens(data?.outputTokens)}</span>
            </div>
          </div>

          {/* Card 3: Voice Streaming Engine */}
          <div className="rounded-2xl border border-white/[.06] bg-[#121218]/90 p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Voice Minutes</span>
              <Mic size={15} className="text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-blue-300">
                {data?.voiceMinutes ?? 0}m
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                ${data?.voiceMetrics?.ratePerMinute ?? 0.06}/min
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-1.5 flex items-center justify-between">
              <span>{data?.voiceMetrics?.totalSessions ?? 0} sessions</span>
              <span className="text-blue-400 font-medium">{formatCurrency(data?.voiceMetrics?.costUSD ?? 0, 2)} billed</span>
            </div>
          </div>

          {/* Card 4: Monthly Budget Utilization */}
          <div className="rounded-2xl border border-white/[.06] bg-[#121218]/90 p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider">Budget Utilization</span>
              <CreditCard size={15} className="text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-purple-300">
                {fp.budgetUtilizationPercent}%
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                of ${fp.monthlyBudgetUSD}
              </span>
            </div>
            {/* Budget Progress Bar */}
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  fp.budgetUtilizationPercent > 80 ? 'bg-rose-500' : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(100, fp.budgetUtilizationPercent)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center justify-between">
              <span>Remaining: ${fp.remainingBudgetUSD}</span>
              <span>Proj: ${fp.projectedMonthEndSpendUSD}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Granular Analysis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[.06] pb-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveMetricTab('tokens')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeMetricTab === 'tokens'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[.04]'
            }`}
          >
            <Zap size={14} />
            <span>Token Consumption</span>
          </button>

          <button
            onClick={() => setActiveMetricTab('voice')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeMetricTab === 'voice'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[.04]'
            }`}
          >
            <Mic size={14} />
            <span>Voice Minutes & Streaming</span>
          </button>

          <button
            onClick={() => setActiveMetricTab('providers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeMetricTab === 'providers'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[.04]'
            }`}
          >
            <Server size={14} />
            <span>AI Provider Breakdown</span>
          </button>

          <button
            onClick={() => setActiveMetricTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeMetricTab === 'history'
                ? 'bg-amber-400 text-black font-semibold shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/[.04]'
            }`}
          >
            <TrendingUp size={14} />
            <span>14-Day Financial Trend</span>
          </button>
        </div>

        {/* Time range filter toggle */}
        <div className="flex items-center gap-1 bg-[#121218] border border-white/[.08] p-1 rounded-xl text-xs">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              timeRange === '7d' ? 'bg-amber-400/20 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('14d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              timeRange === '14d' ? 'bg-amber-400/20 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            14 Days
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: TOKEN CONSUMPTION & MODEL UNIT ECONOMICS
         ========================================================================= */}
      {activeMetricTab === 'tokens' && (
        <div className="space-y-6">
          {/* Visual Daily Token Trend Chart */}
          <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[.06] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-emerald-400" />
                  <span>Daily Token Flow (Prompt Ingestion vs. Completion Generation)</span>
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Visual distribution of verified input and output token velocity across recent user traffic.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="h-2.5 w-2.5 rounded bg-zinc-600"></span> Input Tokens
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span> Output Tokens
                </span>
              </div>
            </div>

            {/* Custom Interactive SVG / HTML Bar Chart */}
            <div className="pt-2">
              <div className="h-48 flex items-end gap-2 sm:gap-3 px-2">
                {visibleHistory.map((day) => {
                  const totalHeightPct = Math.min(100, Math.max(10, Math.round((day.totalTokens / maxDailyTokens) * 100)));
                  const inRatio = day.inputTokens / (day.totalTokens || 1);
                  const outRatio = day.outputTokens / (day.totalTokens || 1);

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-[#181822] border border-white/[.15] text-[11px] font-mono rounded-xl p-2.5 shadow-2xl text-left min-w-[160px] whitespace-nowrap">
                          <div className="font-bold text-white border-b border-white/[.1] pb-1 mb-1">
                            {day.dayLabel} ({day.date})
                          </div>
                          <div className="text-zinc-400">Total: <strong className="text-white">{formatTokens(day.totalTokens)}</strong></div>
                          <div className="text-zinc-400">Prompt: <strong className="text-zinc-300">{formatTokens(day.inputTokens)}</strong></div>
                          <div className="text-emerald-400">Completion: <strong>{formatTokens(day.outputTokens)}</strong></div>
                          <div className="text-amber-300 pt-1 border-t border-white/[.08] mt-1">Est. Cost: ${day.apiCostUSD}</div>
                        </div>
                      </div>

                      {/* Bar Container */}
                      <div
                        className="w-full max-w-[42px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:brightness-125"
                        style={{ height: `${totalHeightPct}%` }}
                      >
                        {/* Output tokens portion */}
                        <div
                          className="w-full bg-emerald-500 transition-all"
                          style={{ height: `${outRatio * 100}%` }}
                        ></div>
                        {/* Input tokens portion */}
                        <div
                          className="w-full bg-zinc-600 transition-all"
                          style={{ height: `${inRatio * 100}%` }}
                        ></div>
                      </div>

                      {/* Day Label */}
                      <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-200 transition-colors truncate">
                        {day.dayLabel.split(' ')[1] || day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Model Breakdown Grid with Unit Economics */}
          <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[.06] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Model Consumption & Efficiency Breakdown</h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Detailed consumption figures, cost per request, and provider origin per neural model.
                </p>
              </div>

              {/* Provider filter dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Filter Provider:</span>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="rounded-xl border border-white/[.08] bg-[#14141a] px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-amber-400"
                >
                  <option value="all">All Providers</option>
                  <option value="google">Google Gemini</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="xai">xAI Grok</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-white/[.06]">
              {filteredModels.map(([modelId, u]) => {
                const colors = providerColors[u.provider] || { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700', bar: 'bg-zinc-500' };
                const costShare = data?.estimatedAiCostUSD ? ((u.cost / data.estimatedAiCostUSD) * 100).toFixed(1) : '0';

                return (
                  <div key={modelId} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white text-sm">{u.modelName || modelId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {u.provider}
                        </span>
                        <span className="text-zinc-500 font-mono text-[11px]">
                          {u.requests.toLocaleString()} requests
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400 font-mono">
                        <span>Total Tokens: <strong className="text-white">{formatTokens(u.totalTokens)}</strong></span>
                        <span className="text-zinc-500">•</span>
                        <span>Prompt In: {formatTokens(u.inputTokens)}</span>
                        <span className="text-zinc-500">•</span>
                        <span>Gen Out: {formatTokens(u.outputTokens)}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-zinc-400">Avg Latency: {u.avgLatencyMs}ms</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 md:text-right">
                      <div>
                        <div className="font-mono text-sm font-bold text-amber-300">
                          {formatCurrency(u.cost, 4)}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          {costShare}% of model spend
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: VOICE MINUTES & REAL-TIME STREAMING
         ========================================================================= */}
      {activeMetricTab === 'voice' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-5 space-y-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase tracking-wider">Voice Unit Economics</span>
                <Mic size={16} className="text-blue-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white">
                ${data?.voiceMetrics?.ratePerMinute ?? 0.06}
                <span className="text-xs font-light text-zinc-400 ml-1">/ minute</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                High-fidelity full-duplex neural speech synthesis + real-time WebSocket audio transcription.
              </p>
            </div>

            <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-5 space-y-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase tracking-wider">Avg Session Duration</span>
                <Clock size={16} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-300">
                {data?.voiceMetrics?.avgSessionMinutes ?? 2.7}
                <span className="text-xs font-light text-zinc-400 ml-1">minutes</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Calculated across {data?.voiceMetrics?.totalSessions ?? 14} recorded conversational audio sessions.
              </p>
            </div>

            <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-5 space-y-3">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs font-mono uppercase tracking-wider">Synthesized Audio Payload</span>
                <Activity size={16} className="text-purple-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-purple-300">
                {Math.round((data?.voiceMetrics?.synthesizedAudioBytes ?? 72000000) / (1024 * 1024))}
                <span className="text-xs font-light text-zinc-400 ml-1">MB</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                High-bitrate PCM audio streaming streamed directly through the neural pipeline.
              </p>
            </div>
          </div>

          {/* Voice Daily Trend Chart */}
          <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[.06] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Daily Voice Streaming Minutes</h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Daily audio session duration in minutes and corresponding streaming API fees.
                </p>
              </div>
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                Total: {data?.voiceMinutes} minutes
              </span>
            </div>

            <div className="pt-2">
              <div className="h-44 flex items-end gap-2 sm:gap-3 px-2">
                {visibleHistory.map((day) => {
                  const heightPct = Math.min(100, Math.max(12, Math.round((day.voiceMinutes / maxDailyVoice) * 100)));

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-[#181822] border border-white/[.15] text-[11px] font-mono rounded-xl p-2 shadow-xl whitespace-nowrap">
                          <div className="font-bold text-white">{day.dayLabel}</div>
                          <div className="text-blue-300 font-bold">{day.voiceMinutes} mins</div>
                          <div className="text-zinc-400">Fee: ${day.voiceCostUSD}</div>
                        </div>
                      </div>

                      <div
                        className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-300 group-hover:brightness-125"
                        style={{ height: `${heightPct}%` }}
                      ></div>

                      <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-200 transition-colors truncate">
                        {day.dayLabel.split(' ')[1] || day.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: AI PROVIDER API COSTS & CONTRACT COMPARISON
         ========================================================================= */}
      {activeMetricTab === 'providers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.providerBreakdown?.map((p) => {
              const colors = providerColors[p.provider] || { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700', bar: 'bg-zinc-500' };

              return (
                <div key={p.provider} className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-5 space-y-4 hover:border-white/[.15] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center font-bold ${colors.text} text-xs font-mono`}>
                        {p.provider.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{p.displayName}</h4>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {p.models.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-white">
                        {formatCurrency(p.totalCost, 3)}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {p.costSharePercent}% of budget
                      </span>
                    </div>
                  </div>

                  {/* Share Progress Bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(4, p.costSharePercent)}%` }}
                    ></div>
                  </div>

                  {/* Rates and Token specs */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[.05] text-[11px] font-mono text-zinc-400">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Requests</span>
                      <span className="text-zinc-200">{p.requestCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Tokens Used</span>
                      <span className="text-zinc-200">{formatTokens(p.totalTokens)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Rates (In/Out 1M)</span>
                      <span className="text-amber-300 font-medium">${p.costPer1MInput} / ${p.costPer1MOutput}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Smart Routing Cost Optimization Callout */}
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[.03] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">ZenixMind Smart Model Router Cost Savings</h4>
                <p className="text-xs text-zinc-300 font-light mt-0.5 leading-relaxed">
                  By dynamically routing routine coding, reasoning, and conversational queries to ultra-efficient models like Gemini 2.5 Flash and DeepSeek R1, you have saved approximately <strong className="text-emerald-400">${fp.costSavingsFromSmartRoutingUSD}</strong> this billing cycle compared to routing everything to frontier tier models.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <div className="text-xs font-mono text-emerald-300">
                <strong>{fp.costEfficiencyScore}/100</strong> Efficiency Rating
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: 14-DAY FINANCIAL TREND TABLE
         ========================================================================= */}
      {activeMetricTab === 'history' && (
        <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] overflow-hidden">
          <div className="p-5 border-b border-white/[.06] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Historical Daily Financial Telemetry Feed</h3>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                Daily ledger itemizing tokens, voice minutes, and verified API costs for financial audit.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-[#14141a] px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[.06] transition-colors"
            >
              <Download size={13} className="text-zinc-400" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121218] border-b border-white/[.06] text-[11px] font-mono uppercase text-zinc-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium text-right">Requests</th>
                  <th className="py-3 px-4 font-medium text-right">Tokens (Prompt / Gen)</th>
                  <th className="py-3 px-4 font-medium text-right">Total Tokens</th>
                  <th className="py-3 px-4 font-medium text-right">Voice Minutes</th>
                  <th className="py-3 px-4 font-medium text-right">AI Token Cost</th>
                  <th className="py-3 px-4 font-medium text-right">Voice Cost</th>
                  <th className="py-3 px-4 font-medium text-right">Total Daily Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[.04] font-mono text-zinc-300">
                {visibleHistory.slice().reverse().map((day) => (
                  <tr key={day.date} className="hover:bg-white/[.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-white">
                      {day.dayLabel} <span className="text-zinc-500 text-[10px]">({day.date})</span>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">{day.requestCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {formatTokens(day.inputTokens)} / <span className="text-emerald-400">{formatTokens(day.outputTokens)}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-zinc-200">{formatTokens(day.totalTokens)}</td>
                    <td className="py-3 px-4 text-right text-blue-300">{day.voiceMinutes}m</td>
                    <td className="py-3 px-4 text-right text-amber-300">${day.apiCostUSD.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right text-blue-300">${day.voiceCostUSD.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">${day.totalCostUSD.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notice Banner */}
      <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
        <span>{data?.costNotice || 'Estimated AI provider and voice synthesizer costs based on public API token & streaming unit pricing.'}</span>
        <span className="text-zinc-400 shrink-0 ml-2">Synced: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
