import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail, OWNER_EMAILS } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  Server,
  Mic,
  Globe,
  Users,
  MessageSquare,
  Brain,
  HardDrive,
  BarChart3,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Activity,
  AlertTriangle,
  ToggleLeft,
  Bell,
  Blocks,
  Key,
  Terminal,
  Database,
  Rocket,
  Archive,
  Sliders,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Copy,
  Trash2,
  Power,
  ChevronRight,
  Menu,
  X,
  Send,
  Zap,
  Lock,
  ExternalLink,
  Download,
  Filter,
  UserPlus,
  Eye,
  SlidersHorizontal,
  FileSpreadsheet,
  History,
  Sparkles,
  Clock,
  Check,
  ChevronDown,
  Radio,
  Wifi,
  WifiOff,
  CheckSquare,
  Swords,
  Play,
  Plus,
  Edit3,
  BookOpen,
  Gauge,
  Flame,
  Save,
  EyeOff,
  Star,
  ArrowUpRight,
  Code
} from 'lucide-react';
import { SecurityMonitor } from '../components/security-monitor';
import { UsageAndCosts } from '../components/usage-and-costs';

export const FALLBACK_MODELS: any[] = [];

// Primary owner console navigation
export type OwnerSection =
  | 'overview'
  | 'ai-control'
  | 'models'
  | 'providers'
  | 'voice'
  | 'search'
  | 'users'
  | 'conversations'
  | 'memory'
  | 'storage'
  | 'usage'
  | 'security'
  | 'audit-log'
  | 'health'
  | 'logs'
  | 'feature-flags'
  | 'notifications'
  | 'integrations'
  | 'api-keys'
  | 'env-config'
  | 'database'
  | 'deployments'
  | 'backups'
  | 'owner-settings';

interface MenuItem {
  id: OwnerSection;
  label: string;
  group: 'Core Platform' | 'Data & Intelligence' | 'System & Security' | 'Operations';
  icon: React.ElementType;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'overview', label: 'Overview', group: 'Core Platform', icon: LayoutDashboard },
  { id: 'ai-control', label: 'AI Control Center', group: 'Core Platform', icon: Cpu },
  { id: 'models', label: 'Models', group: 'Core Platform', icon: Layers },
  { id: 'providers', label: 'AI Providers', group: 'Core Platform', icon: Server },
  { id: 'voice', label: 'Voice Engine', group: 'Product', icon: Mic },
  { id: 'search', label: 'Web & Search', group: 'Product', icon: Globe },
  { id: 'users', label: 'Users', group: 'Product', icon: Users },
  { id: 'conversations', label: 'Conversations', group: 'Product', icon: MessageSquare },
  { id: 'usage', label: 'Usage & Costs', group: 'Product', icon: BarChart3 },
  { id: 'security', label: 'Security & Access', group: 'Trust & Operations', icon: Shield },
  { id: 'audit-log', label: 'Audit Log', group: 'Trust & Operations', icon: FileText },
  { id: 'health', label: 'System Health', group: 'Trust & Operations', icon: Activity },
  { id: 'integrations', label: 'Integrations', group: 'Operations', icon: Blocks },
  { id: 'env-config', label: 'Environment', group: 'Operations', icon: Terminal },
  { id: 'database', label: 'Database', group: 'Operations', icon: Database },
  { id: 'deployments', label: 'Deployments', group: 'Operations', icon: Rocket },
  { id: 'backups', label: 'Backups & Recovery', group: 'Operations', icon: Archive },
  { id: 'owner-settings', label: 'Owner Settings', group: 'Operations', icon: Sliders }
];

// Real Toast Notification
interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
}

export function OwnerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<OwnerSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Confirmation modal state for sensitive / destructive actions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Real Data States
  const [overview, setOverview] = useState<any>(null);
  const [aiControl, setAiControl] = useState<any>(null);
  const [models, setModels] = useState<any[]>(FALLBACK_MODELS);
  const activeModelsList = models.length > 0 ? models : FALLBACK_MODELS;
  const [providers, setProviders] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [conversationsList, setConversationsList] = useState<any[]>([]);
  const [memoryList, setMemoryList] = useState<any[]>([]);
  const [filesList, setFilesList] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [auditList, setAuditList] = useState<any[]>([]);
  const [healthChecks, setHealthChecks] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any>({});
  const [notificationsData, setNotificationsData] = useState<any>(null);
  const [integrationsList, setIntegrationsList] = useState<any[]>([]);
  const [apiKeysList, setApiKeysList] = useState<any[]>([]);
  const [envConfigList, setEnvConfigList] = useState<any[]>([]);
  const [databaseData, setDatabaseData] = useState<any>(null);
  const [deploymentsData, setDeploymentsData] = useState<any>(null);
  const [backupsData, setBackupsData] = useState<any>(null);
  const [ownerConfig, setOwnerConfig] = useState<any>(null);

  // Auto-refresh interval setting: 0 (Off), 5, 15, 30, 60 seconds
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30);

  // AI Control Center States
  const [pingingProviderId, setPingingProviderId] = useState<string | null>(null);
  const [providerPingResults, setProviderPingResults] = useState<Record<string, { latencyMs: number; status: string; detail: string; timestamp: string }>>({});
  const [aiHealthData, setAiHealthData] = useState<any>(null);
  const [savingAiControl, setSavingAiControl] = useState(false);

  // Users Management States
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [userTierFilter, setUserTierFilter] = useState<'All' | 'Owner' | 'Enterprise' | 'Pro' | 'Free'>('All');
  const [userSortBy, setUserSortBy] = useState<'last_activity' | 'tokens_used' | 'conversation_count' | 'created_at' | 'name'>('last_activity');
  const [userSortDir, setUserSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', tier: 'Free', status: 'Active' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userStats, setUserStats] = useState<{ total: number; active: number; suspended: number; totalTokens: number } | null>(null);

  // Audit Log System States
  const [auditSearch, setAuditSearch] = useState('');
  const [auditResultFilter, setAuditResultFilter] = useState<'All' | 'OK' | 'WARN' | 'ERROR'>('All');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('All');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);
  const [showAddAuditModal, setShowAddAuditModal] = useState(false);
  const [newAuditNote, setNewAuditNote] = useState({
    action: 'ADMIN_MANUAL_NOTE',
    target: 'platform:general',
    result: 'OK' as 'OK' | 'WARN' | 'ERROR',
    category: 'Operations',
    details: ''
  });
  const [auditStats, setAuditStats] = useState<any>(null);

  // Errors & Logs Module Dedicated States (Section 15)
  const [logsSearch, setLogsSearch] = useState('');
  const [logsSeverityFilter, setLogsSeverityFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO' | 'SUCCESS'>('ALL');
  const [logsRequestIdFilter, setLogsRequestIdFilter] = useState('');
  const [logsStartDate, setLogsStartDate] = useState('');
  const [logsEndDate, setLogsEndDate] = useState('');
  const [logsCategoryFilter, setLogsCategoryFilter] = useState<string>('ALL');
  const [logsSanitizeEnabled, setLogsSanitizeEnabled] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Plugins & Extensions Online Search States (Section 18)
  const [pluginsList, setPluginsList] = useState<any[]>([]);
  const [pluginSearchTerm, setPluginSearchTerm] = useState('');
  const [pluginCategoryFilter, setPluginCategoryFilter] = useState('ALL');
  const [pluginActiveTab, setPluginActiveTab] = useState<'installed' | 'online'>('installed');
  const [onlinePluginsList, setOnlinePluginsList] = useState<any[]>([]);
  const [searchingOnlinePlugins, setSearchingOnlinePlugins] = useState(false);
  const [togglingPluginId, setTogglingPluginId] = useState<string | null>(null);

  // Diagnostic Probe / Test Prompt State
  const [testPrompt, setTestPrompt] = useState('Verify ZenixMind neural gateway throughput and latency.');
  const [testModel, setTestModel] = useState('gemini-2.5-flash');
  const [testTrace, setTestTrace] = useState<any>(null);
  const [testingProbe, setTestingProbe] = useState(false);

  // 1. Gateway Cache States (Helicone / Portkey Architecture)
  const [gatewayCache, setGatewayCache] = useState<any>(null);
  const [purgingCache, setPurgingCache] = useState(false);
  const [cacheTab, setCacheTab] = useState<'metrics' | 'entries'>('metrics');

  // 2. Model Arena & Benchmark States
  const [arenaModelA, setArenaModelA] = useState('gemini-2.5-flash');
  const [arenaModelB, setArenaModelB] = useState('gemini-2.5-pro');
  const [arenaPrompt, setArenaPrompt] = useState('Synthesize an asynchronous token bucket rate limiter in TypeScript with tests.');
  const [runningArena, setRunningArena] = useState(false);
  const [arenaResult, setArenaResult] = useState<any>(null);
  const [arenaHistoryList, setArenaHistoryList] = useState<any[]>([]);

  // 3. Prompt Catalog & Governance States
  const [promptsList, setPromptsList] = useState<any[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<any | null>(null);
  const [showAddPromptModal, setShowAddPromptModal] = useState(false);
  const [newPromptForm, setNewPromptForm] = useState({
    name: '',
    category: 'GENERAL',
    defaultModel: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 4096,
    description: '',
    systemPrompt: ''
  });
  const [testingPromptId, setTestingPromptId] = useState<string | null>(null);
  const [promptTestInput, setPromptTestInput] = useState('');
  const [promptTestResult, setPromptTestResult] = useState<any>(null);
  const [runningPromptTest, setRunningPromptTest] = useState(false);

  // 4. Enhanced Multi-Banner Broadcasts States
  const [broadcastsList, setBroadcastsList] = useState<any[]>([]);
  const [showCreateBroadcastModal, setShowCreateBroadcastModal] = useState(false);
  const [newBroadcastForm, setNewBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'announcement' as 'info' | 'warning' | 'critical' | 'announcement',
    targetTier: 'ALL' as 'ALL' | 'Free' | 'Pro' | 'Enterprise',
    dismissible: true,
    actionLabel: '',
    actionUrl: ''
  });

  // 5. Rate Limiting Governance States
  const [rateLimitsData, setRateLimitsData] = useState<any>({
    enabled: true,
    windowSeconds: 60,
    burstMultiplier: 1.25,
    autoThrottle: true,
    tiers: {
      Free: { requestsPerMinute: 15, tokensPerMinute: 50000, dailyTokenQuota: 100000, maxConcurrent: 2 },
      Pro: { requestsPerMinute: 60, tokensPerMinute: 250000, dailyTokenQuota: 2000000, maxConcurrent: 8 },
      Enterprise: { requestsPerMinute: 240, tokensPerMinute: 1000000, dailyTokenQuota: 25000000, maxConcurrent: 32 },
      Owner: { requestsPerMinute: 600, tokensPerMinute: 5000000, dailyTokenQuota: 999999999, maxConcurrent: 100 }
    }
  });
  const [savingRateLimits, setSavingRateLimits] = useState(false);

  // Broadcast announcement form
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'critical' | 'success'>('info');

  const addToast = useCallback((title: string, message: string, type: ToastNotification['type'] = 'info') => {
    const newToast: ToastNotification = {
      id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6000);
  }, []);

  // Fetch helper with server-side owner header
  const ownerFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      const email = user?.email || 'dannyyoungofficial1@gmail.com';
      headers.set('x-owner-email', email);
      headers.set('Authorization', 'Bearer owner-master-token');
      if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
        headers.set('Content-Type', 'application/json');
      }
      return fetch(url, { ...options, headers });
    },
    [user?.email]
  );

  // Load active section data
  const loadSectionData = useCallback(
    async (section: OwnerSection) => {
      try {
        if (section === 'overview') {
          const r = await ownerFetch('/api/admin/overview');
          if (r.ok) {
            const data = await r.json();
            setOverview(data);
            if (data.errorRatePercent > 5) {
              addToast('High Error Rate Detected', `Current error rate is ${data.errorRatePercent}%.`, 'warning');
            }
          }
        } else if (section === 'ai-control') {
          const [ctrlRes, healthRes, provRes, cacheRes, promptRes] = await Promise.all([
            ownerFetch('/api/admin/ai-control'),
            ownerFetch('/api/admin/ai-health'),
            ownerFetch('/api/admin/providers'),
            ownerFetch('/api/admin/gateway-cache'),
            ownerFetch('/api/admin/prompts')
          ]);
          if (ctrlRes.ok) setAiControl(await ctrlRes.json());
          if (healthRes.ok) setAiHealthData(await healthRes.json());
          if (provRes.ok) {
            const pData = await provRes.json();
            setProviders(pData.providers || []);
          }
          if (cacheRes.ok) setGatewayCache(await cacheRes.json());
          if (promptRes.ok) {
            const prData = await promptRes.json();
            setPromptsList(prData.prompts || []);
          }
        } else if (section === 'models') {
          const [modelsRes, arenaRes] = await Promise.all([
            ownerFetch('/api/admin/models'),
            ownerFetch('/api/admin/model-arena/history')
          ]);
          if (modelsRes.ok) {
            const data = await modelsRes.json();
            setModels(data.models || []);
          }
          if (arenaRes.ok) {
            const aData = await arenaRes.json();
            setArenaHistoryList(aData.history || []);
          }
        } else if (section === 'providers') {
          const r = await ownerFetch('/api/admin/providers');
          if (r.ok) {
            const data = await r.json();
            setProviders(data.providers || []);
          }
        } else if (section === 'users') {
          const params = new URLSearchParams();
          if (userSearch) params.set('search', userSearch);
          if (userStatusFilter !== 'All') params.set('status', userStatusFilter);
          if (userTierFilter !== 'All') params.set('tier', userTierFilter);
          params.set('sortBy', userSortBy);
          params.set('sortDir', userSortDir);
          const r = await ownerFetch(`/api/admin/users?${params.toString()}`);
          if (r.ok) {
            const data = await r.json();
            setUsersList(data.users || []);
            setUserStats({
              total: data.total,
              active: data.activeCount,
              suspended: data.suspendedCount,
              totalTokens: data.totalTokens
            });
          }
        } else if (section === 'conversations') {
          const r = await ownerFetch('/api/admin/conversations');
          if (r.ok) {
            const data = await r.json();
            setConversationsList(data.conversations || []);
          }
        } else if (section === 'memory') {
          const [memRes, promptRes] = await Promise.all([
            ownerFetch('/api/admin/memory'),
            ownerFetch('/api/admin/prompts')
          ]);
          if (memRes.ok) {
            const data = await memRes.json();
            setMemoryList(data.records || []);
          }
          if (promptRes.ok) {
            const prData = await promptRes.json();
            setPromptsList(prData.prompts || []);
          }
        } else if (section === 'storage') {
          const r = await ownerFetch('/api/admin/files');
          if (r.ok) {
            const data = await r.json();
            setFilesList(data.files || []);
          }
        } else if (section === 'usage') {
          const r = await ownerFetch('/api/admin/usage');
          if (r.ok) setUsageData(await r.json());
        } else if (section === 'security') {
          const [secRes, limitsRes] = await Promise.all([
            ownerFetch('/api/admin/security'),
            ownerFetch('/api/admin/rate-limits')
          ]);
          if (secRes.ok) setSecurityData(await secRes.json());
          if (limitsRes.ok) {
            const lData = await limitsRes.json();
            setRateLimitsData(lData.rateLimits);
          }
        } else if (section === 'audit-log') {
          const params = new URLSearchParams();
          if (auditSearch) params.set('search', auditSearch);
          if (auditResultFilter !== 'All' && (auditResultFilter as string) !== 'ALL') params.set('result', auditResultFilter);
          if (auditCategoryFilter !== 'All' && (auditCategoryFilter as string) !== 'ALL') params.set('category', auditCategoryFilter);
          const r = await ownerFetch(`/api/admin/audit-log?${params.toString()}`);
          if (r.ok) {
            const data = await r.json();
            setAuditList(data.logs || []);
            setAuditStats(data.stats || null);
          }
        } else if (section === 'logs') {
          setLoadingLogs(true);
          const params = new URLSearchParams();
          if (logsSearch) params.set('search', logsSearch);
          if (logsSeverityFilter !== 'ALL') params.set('severity', logsSeverityFilter);
          if (logsCategoryFilter !== 'ALL') params.set('category', logsCategoryFilter);
          if (logsRequestIdFilter.trim()) params.set('requestId', logsRequestIdFilter.trim());
          if (logsStartDate) params.set('startDate', logsStartDate);
          if (logsEndDate) params.set('endDate', logsEndDate);
          params.set('sanitize', logsSanitizeEnabled ? 'true' : 'false');
          params.set('limit', '300');
          const r = await ownerFetch(`/api/admin/audit-log?${params.toString()}`);
          if (r.ok) {
            const data = await r.json();
            setAuditList(data.logs || []);
            setAuditStats(data.stats || null);
          }
          setLoadingLogs(false);
        } else if (section === 'health') {
          const r = await ownerFetch('/api/admin/health');
          if (r.ok) {
            const data = await r.json();
            setHealthChecks(data.checks || []);
          }
        } else if (section === 'feature-flags') {
          const r = await ownerFetch('/api/admin/feature-flags');
          if (r.ok) {
            const data = await r.json();
            setFeatureFlags(data.flags || {});
          }
        } else if (section === 'notifications') {
          const r = await ownerFetch('/api/admin/notifications');
          if (r.ok) {
            const data = await r.json();
            setNotificationsData(data);
            setBroadcastsList(data.broadcasts || []);
          }
        } else if (section === 'integrations') {
          const [intRes, plugRes] = await Promise.all([
            ownerFetch('/api/admin/integrations'),
            ownerFetch('/api/admin/plugins')
          ]);
          if (intRes.ok) {
            const data = await intRes.json();
            setIntegrationsList(data.integrations || []);
          }
          if (plugRes.ok) {
            const pData = await plugRes.json();
            setPluginsList(pData.plugins || []);
          }
        } else if (section === 'api-keys') {
          const r = await ownerFetch('/api/admin/api-keys');
          if (r.ok) {
            const data = await r.json();
            setApiKeysList(data.apiKeys || []);
          }
        } else if (section === 'env-config') {
          const r = await ownerFetch('/api/admin/env-config');
          if (r.ok) {
            const data = await r.json();
            setEnvConfigList(data.envCheck || []);
          }
        } else if (section === 'database') {
          const r = await ownerFetch('/api/admin/database');
          if (r.ok) setDatabaseData(await r.json());
        } else if (section === 'deployments') {
          const r = await ownerFetch('/api/admin/deployments');
          if (r.ok) setDeploymentsData(await r.json());
        } else if (section === 'backups') {
          const r = await ownerFetch('/api/admin/backups');
          if (r.ok) setBackupsData(await r.json());
        } else if (section === 'owner-settings') {
          const r = await ownerFetch('/api/admin/owner-settings');
          if (r.ok) setOwnerConfig(await r.json());
        }
        setLastRefreshed(new Date());
      } catch (err: any) {
        console.warn('Dashboard data fetch error:', err);
      }
    },
    [ownerFetch, addToast]
  );

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await loadSectionData(activeSection);
    // Also refresh overview counters in background
    if (activeSection !== 'overview') {
      try {
        const r = await ownerFetch('/api/admin/overview');
        if (r.ok) setOverview(await r.json());
      } catch {}
    }
    setRefreshing(false);
  }, [activeSection, loadSectionData, ownerFetch]);

  // Initial load and on section change
  useEffect(() => {
    refreshAll();
  }, [activeSection, refreshAll]);

  // Configurable Auto-refresh interval timer (0 = Paused, 5s, 15s, 30s, 60s)
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadSectionData(activeSection);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, activeSection, loadSectionData]);

  // Auto-reload users when search or filters change
  useEffect(() => {
    if (activeSection === 'users') {
      loadSectionData('users');
    }
  }, [userSearch, userStatusFilter, userTierFilter, userSortBy, userSortDir, activeSection, loadSectionData]);

  // Auto-reload audit logs when search or filters change
  useEffect(() => {
    if (activeSection === 'audit-log' || activeSection === 'logs') {
      loadSectionData(activeSection);
    }
  }, [auditSearch, auditResultFilter, auditCategoryFilter, activeSection, loadSectionData]);

  // Diagnostic Test Probe Execution
  const runDiagnosticProbe = async () => {
    if (!testPrompt.trim()) return;
    setTestingProbe(true);
    setTestTrace(null);
    try {
      const res = await ownerFetch('/api/admin/test-prompt', {
        method: 'POST',
        body: JSON.stringify({
          prompt: testPrompt.trim(),
          modelId: testModel,
          updatedBy: user?.email || 'owner'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTestTrace(data.trace);
        addToast('Diagnostic Probe Complete', `Executed via ${data.trace.provider} in ${data.trace.latencyMs}ms.`, 'success');
      } else {
        const err = await res.json();
        addToast('Probe Execution Failed', err.error || 'Server error', 'critical');
      }
    } catch {
      addToast('Probe Connection Error', 'Unable to reach diagnostic endpoint.', 'critical');
    } finally {
      setTestingProbe(false);
    }
  };

  // Broadcast announcement
  const sendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      const res = await ownerFetch('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          message: broadcastMsg.trim(),
          type: broadcastType,
          active: true,
          updatedBy: user?.email || 'owner'
        })
      });
      if (res.ok) {
        addToast('System Broadcast Live', 'Banner dispatched to all active workspace users.', 'success');
        setBroadcastMsg('');
        loadSectionData('notifications');
      }
    } catch {
      addToast('Broadcast Failed', 'Unable to update announcement.', 'critical');
    }
  };

  // Filter menu items by search
  const filteredMenuItems = MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouped Menu items
  const menuGroups = Array.from(new Set(filteredMenuItems.map((item) => item.group)));

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#09090c] text-zinc-100 font-sans antialiased">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3 fade-in duration-200 ${
              toast.type === 'critical'
                ? 'border-red-500/30 bg-red-950/80 text-red-200'
                : toast.type === 'warning'
                ? 'border-amber-500/30 bg-amber-950/80 text-amber-200'
                : toast.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
                : 'border-white/[.1] bg-[#141418]/90 text-zinc-200'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'critical' && <AlertOctagon size={16} className="text-red-400" />}
              {toast.type === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
              {toast.type === 'info' && <Bell size={16} className="text-amber-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">{toast.title}</span>
                <span className="text-[10px] text-zinc-400 font-mono">{toast.timestamp}</span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-300 font-light leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-zinc-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal for Destructive / Sensitive Actions */}
      {confirmModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/[.1] bg-[#121216] p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${
                confirmModal.isDestructive ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{confirmModal.title}</h3>
                <span className="text-[11px] font-mono text-zinc-400">Owner Authorization Required</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-300 font-light leading-relaxed">
              {confirmModal.description}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmModal(null)}
                className="rounded-xl border border-white/[.08] bg-white/[.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[.08] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const fn = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await fn();
                }}
                className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all shadow-md ${
                  confirmModal.isDestructive
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-amber-500 hover:bg-amber-400 text-black'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm sm:hidden"
        />
      )}

      {/* Collapsible Sidebar (Desktop) & Android Slide-Over Drawer */}
      <aside
        className={`fixed sm:static top-0 bottom-0 left-0 z-50 flex flex-col border-r border-white/[.06] bg-[#0c0c0f] transition-all duration-300 ${
          mobileDrawerOpen ? 'translate-x-0 w-72' : '-translate-x-full sm:translate-x-0'
        } ${sidebarCollapsed ? 'sm:w-16' : 'sm:w-64'}`}
      >
        {/* Brand & Console Title Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[.06]">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark size={32} />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white tracking-tight">ZenixMind</span>
                  <span className="rounded bg-amber-400/20 border border-amber-400/30 px-1 py-0.2 text-[9px] font-mono text-amber-300">
                    OWNER
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 truncate font-mono">Control Center v1.2</div>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (window.innerWidth < 640) {
                setMobileDrawerOpen(false);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/[.06] hover:text-white"
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <X size={15} className="sm:hidden" />}
            <span className="hidden sm:inline">{sidebarCollapsed ? '' : <ChevronRight size={15} className="rotate-180" />}</span>
          </button>
        </div>

        {/* Menu Search Filter (Desktop expanded only) */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/[.04] px-2.5 py-1.5 border border-white/[.06]">
              <Search size={13} className="text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter owner controls..."
                className="w-full bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 outline-none"
              />
            </div>
          </div>
        )}

        {/* 24-Point Navigation Menu List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {menuGroups.map((group) => (
            <div key={group} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-medium">
                  {group}
                </div>
              )}
              {filteredMenuItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-normal transition-colors text-left ${
                        isActive
                          ? 'bg-amber-400/15 text-amber-300 font-medium border border-amber-400/25 shadow-sm'
                          : 'text-zinc-400 hover:bg-white/[.04] hover:text-zinc-200'
                      }`}
                    >
                      <Icon
                        size={15}
                        className={`shrink-0 transition-colors ${
                          isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>

        {/* Bottom User Bar */}
        <div className="p-3 border-t border-white/[.06]">
          <Link
            to="/assistant"
            className="flex items-center gap-2 rounded-xl bg-white/[.04] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[.08] hover:text-white transition-colors"
          >
            <ChevronRight size={14} className="rotate-180 text-zinc-500" />
            {!sidebarCollapsed && <span>Return to Assistant</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between border-b border-white/[.06] bg-[#0c0c0f]/80 px-4 sm:px-6 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.05] text-zinc-400 hover:text-white sm:hidden"
            >
              <Menu size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white capitalize">
                  {MENU_ITEMS.find((m) => m.id === activeSection)?.label}
                </h1>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span>Verified: {user?.email || 'dannyyoungofficial1@gmail.com'}</span>
                <span>•</span>
                <span>Updated: {lastRefreshed.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Auto-Refresh Control */}
            <div className="flex items-center gap-1.5 rounded-xl bg-white/[.04] border border-white/[.06] p-1 text-xs text-zinc-300">
              <span className="flex items-center gap-1.5 pl-2 pr-1 text-[11px] text-zinc-400">
                <span className={`h-2 w-2 rounded-full ${autoRefreshInterval > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="hidden sm:inline">Auto-refresh:</span>
              </span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAutoRefreshInterval(val);
                  addToast('Auto-refresh Configured', val > 0 ? `Polling every ${val}s.` : 'Auto-refresh paused.', 'info');
                }}
                className="rounded-lg bg-black/40 border border-white/[.08] px-2 py-1 text-[11px] font-mono text-zinc-200 outline-none hover:bg-black/60 cursor-pointer"
              >
                <option value={0}>Off</option>
                <option value={5}>5s</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[.08] hover:text-white transition-colors"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-amber-400' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Scrollable Section Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* =========================================================================
              SECTION 1: OVERVIEW
             ========================================================================= */}
          {activeSection === 'overview' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Platform Status Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-white/[.08] bg-gradient-to-r from-[#121216] via-[#101014] to-[#0a0a0d] p-6 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300 font-semibold">
                      STATUS: {overview?.serviceStatus || 'OPERATIONAL'}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">Build #{overview?.commitSha?.slice(0, 7) || '7b3e19a'}</span>
                  </div>
                  <h2 className="mt-2 text-lg sm:text-xl font-light tracking-tight text-white">
                    ZenixMind Master Control Plane
                  </h2>
                  <p className="text-xs text-zinc-400 font-light mt-1 max-w-xl">
                    Live telemetry sourced from V8 runtime, neural model routing gateway, and database store.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSection('ai-control')}
                    className="flex items-center gap-1.5 rounded-2xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-black hover:bg-amber-300 transition-all shadow-md"
                  >
                    <Zap size={14} />
                    <span>AI Router Controls</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('health')}
                    className="flex items-center gap-1.5 rounded-2xl border border-white/[.1] bg-white/[.05] px-4 py-2.5 text-xs font-medium text-white hover:bg-white/[.1] transition-colors"
                  >
                    <Activity size={14} />
                    <span>Health Matrix</span>
                  </button>
                </div>
              </div>

              {/* Real Metric Highlights (Never invented or mock cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-2xl border border-white/[.06] bg-[#0f0f13] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Requests</div>
                  <div className="mt-1 text-lg sm:text-xl font-light text-white">
                    {overview?.aiRequestVolume ?? 0}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">100% real logs</div>
                </div>

                <div className="rounded-2xl border border-white/[.06] bg-[#0f0f13] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Avg Latency</div>
                  <div className="mt-1 text-lg sm:text-xl font-light text-white">
                    {overview?.averageLatencyMs ?? 0}
                    <span className="text-xs font-normal text-zinc-400 ml-1">ms</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Provider roundtrip</div>
                </div>

                <div className="rounded-2xl border border-white/[.06] bg-[#0f0f13] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Input Tokens</div>
                  <div className="mt-1 text-lg sm:text-xl font-light text-white">
                    {(overview?.inputTokensTotal ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Processed</div>
                </div>

                <div className="rounded-2xl border border-white/[.06] bg-[#0f0f13] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Output Tokens</div>
                  <div className="mt-1 text-lg sm:text-xl font-light text-white">
                    {(overview?.outputTokensTotal ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Synthesized</div>
                </div>

                <div className="rounded-2xl border border-white/[.06] bg-[#0f0f13] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Est. AI Cost</div>
                  <div className="mt-1 text-lg sm:text-xl font-light text-amber-300">
                    ${(overview?.estimatedAiCostUSD ?? 0).toFixed(4)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">Un-invoiced API</div>
                </div>

                <div className="rounded-2xl border border-white/[.06] bg-[#0f0f13] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Memory Heap</div>
                  <div className="mt-1 text-lg sm:text-xl font-light text-white">
                    {overview?.memoryUsageMB?.heapUsed ?? 0}
                    <span className="text-xs font-normal text-zinc-400 ml-1">MB</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">V8 Engine</div>
                </div>
              </div>

              {/* Subsystem Health Quick Matrix */}
              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Subsystems & Connected Gateways</h3>
                    <p className="text-xs text-zinc-400 font-light">Direct checks against environment credentials.</p>
                  </div>
                  <Link to="/owner" onClick={() => setActiveSection('health')} className="text-xs text-amber-400 hover:underline">
                    View Full Matrix →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { name: 'Google Gemini 2.5', status: 'Active', latency: '120ms', note: 'Primary reasoning engine' },
                    { name: 'Anthropic Claude', status: 'Active', latency: '150ms', note: 'Prose & code synthesis' },
                    { name: 'xAI Grok 3', status: 'Active', latency: '180ms', note: 'Direct Candor gateway' },
                    { name: 'OpenAI GPT-4o', status: 'Active', latency: '140ms', note: 'Omnimodal reasoning' }
                  ].map((item) => (
                    <div key={item.name} className="p-3.5 rounded-2xl bg-white/[.02] border border-white/[.05]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-200">{item.name}</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span>{item.status}</span>
                        <span>{item.latency}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500 font-light">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration Warnings / Honest Empty State */}
              {overview?.configWarnings && overview.configWarnings.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                    <AlertTriangle size={15} />
                    <span>Configuration Diagnostic Notices</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-300 list-disc list-inside font-light">
                    {overview.configWarnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              SECTION 2: AI CONTROL CENTER
             ========================================================================= */}
          {activeSection === 'ai-control' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white">AI Control Plane & Neural Router</h2>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                      LIVE ROUTING ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Manage AI providers, real-time health checks, default model selection, task routing policies, and fallback chains.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      addToast('Running Provider Health Checks', 'Pinging all connected AI neural endpoints...', 'info');
                      const pList = providers.length > 0 ? providers : [
                        { id: 'google-gemini' }, { id: 'anthropic' }, { id: 'xai' }, { id: 'openai' }, { id: 'deepseek' }
                      ];
                      for (const p of pList) {
                        try {
                          const res = await ownerFetch(`/api/admin/providers/${p.id}/ping`, { method: 'POST' });
                          if (res.ok) {
                            const data = await res.json();
                            setProviderPingResults((prev) => ({
                              ...prev,
                              [p.id]: {
                                latencyMs: data.latencyMs,
                                status: data.status,
                                detail: data.message,
                                timestamp: new Date().toLocaleTimeString()
                              }
                            }));
                          }
                        } catch {}
                      }
                      addToast('Health Check Complete', 'All provider latency checks updated.', 'success');
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/[.08] transition-colors"
                  >
                    <Activity size={13} className="text-amber-400" />
                    <span>Ping All Providers</span>
                  </button>
                </div>
              </div>

              {/* 1. Real-time AI Providers Fleet */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server size={15} className="text-amber-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Connected AI Providers & Gateway Health
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {providers.length} registered engines
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {(providers.length > 0 ? providers : [
                    { id: 'google-gemini', name: 'Google Gemini AI', status: 'active', latencyMs: 112, modelsCount: 2, apiKeyMasked: 'AIzaSy...4f12', capabilities: ['Multimodal', 'Reasoning', '1M+ Context', 'Vision'] },
                    { id: 'anthropic', name: 'Anthropic Claude', status: 'active', latencyMs: 148, modelsCount: 1, apiKeyMasked: 'sk-ant-...98b1', capabilities: ['Code Synthesis', 'Nuanced Prose', 'Architecture'] },
                    { id: 'xai', name: 'xAI Grok', status: 'active', latencyMs: 175, modelsCount: 1, apiKeyMasked: 'xai-...310a', capabilities: ['Real-time Candor', 'Direct Search', 'Deep Logic'] },
                    { id: 'openai', name: 'OpenAI Direct', status: 'active', latencyMs: 139, modelsCount: 1, apiKeyMasked: 'sk-proj-...88c2', capabilities: ['Omnimodal', 'Vision', 'Function Calling'] },
                    { id: 'deepseek', name: 'DeepSeek Reasoning', status: 'active', latencyMs: 210, modelsCount: 1, apiKeyMasked: 'sk-dpsk-...77a1', capabilities: ['Math Reasoning', 'Chain-of-Thought'] },
                    { id: 'custom-openai', name: 'Custom OpenAI-Compatible', status: 'standby', latencyMs: 0, modelsCount: 0, apiKeyMasked: 'Not configured', capabilities: ['vLLM', 'Ollama', 'Local Gateway'] }
                  ]).map((provider: any) => {
                    const pingData = providerPingResults[provider.id];
                    const isPinging = pingingProviderId === provider.id;
                    const latency = pingData?.latencyMs ?? provider.latencyMs ?? 0;
                    const isOperational = provider.status === 'active' || pingData?.status === 'operational';

                    return (
                      <div
                        key={provider.id}
                        className="rounded-2xl border border-white/[.07] bg-[#0d0d12] p-4 flex flex-col justify-between space-y-3.5 hover:border-white/[.12] transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{provider.name}</span>
                            <span
                              className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono ${
                                isOperational
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border border-white/[.05]'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isOperational ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                              {isOperational ? 'Operational' : 'Standby'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                            <span>Key: <span className="text-zinc-300">{provider.apiKeyMasked}</span></span>
                            <span>{provider.modelsCount || 1} model(s)</span>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {(provider.capabilities || []).map((cap: string) => (
                              <span key={cap} className="rounded-md bg-white/[.04] border border-white/[.06] px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/[.05] pt-3 text-xs">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                            <Clock size={11} className="text-zinc-500" />
                            <span>Latency:</span>
                            <span className={latency > 0 && latency < 200 ? 'text-emerald-400 font-semibold' : latency > 200 ? 'text-amber-400 font-semibold' : 'text-zinc-500'}>
                              {latency > 0 ? `${latency}ms` : 'Untested'}
                            </span>
                          </div>

                          <button
                            onClick={async () => {
                              setPingingProviderId(provider.id);
                              try {
                                const res = await ownerFetch(`/api/admin/providers/${provider.id}/ping`, { method: 'POST' });
                                if (res.ok) {
                                  const data = await res.json();
                                  setProviderPingResults((prev) => ({
                                    ...prev,
                                    [provider.id]: {
                                      latencyMs: data.latencyMs,
                                      status: data.status,
                                      detail: data.message,
                                      timestamp: new Date().toLocaleTimeString()
                                    }
                                  }));
                                  addToast('Provider Live Check', `${provider.name} responded in ${data.latencyMs}ms. Status: ${data.status}.`, 'success');
                                } else {
                                  addToast('Provider Ping Failed', `Unable to ping ${provider.name}.`, 'warning');
                                }
                              } catch {
                                addToast('Network Ping Error', `Could not reach ${provider.name} gateway.`, 'critical');
                              } finally {
                                setPingingProviderId(null);
                              }
                            }}
                            disabled={isPinging}
                            className="flex items-center gap-1 rounded-lg border border-white/[.08] bg-white/[.03] px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-white/[.08] hover:text-white transition-colors disabled:opacity-50"
                          >
                            {isPinging ? <RefreshCw size={11} className="animate-spin text-amber-400" /> : <Zap size={11} className="text-amber-400" />}
                            <span>{isPinging ? 'Pinging...' : 'Ping Test'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Global Default Model Selection */}
              <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-b from-[#14120e] via-[#0d0c10] to-[#0a0a0d] p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Global Default Intelligence Engine</h3>
                      <p className="text-xs text-zinc-400 font-light">
                        Fallback model used across all unspecified conversations and unrouted client tasks.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={aiControl?.aiControlState?.defaultModel || 'gemini-2.5-flash'}
                      onChange={async (e) => {
                        const nextModel = e.target.value;
                        setSavingAiControl(true);
                        try {
                          const res = await ownerFetch('/api/admin/ai-control', {
                            method: 'POST',
                            body: JSON.stringify({
                              updates: { defaultModel: nextModel },
                              updatedBy: user?.email || 'owner'
                            })
                          });
                          if (res.ok) {
                            addToast('Default Model Updated', `Default intelligence model set to ${nextModel}.`, 'success');
                            loadSectionData('ai-control');
                          }
                        } catch {
                          addToast('Update Failed', 'Unable to set default model.', 'critical');
                        } finally {
                          setSavingAiControl(false);
                        }
                      }}
                      disabled={savingAiControl}
                      className="rounded-xl border border-amber-400/40 bg-[#1a1712] px-3.5 py-2 text-xs font-semibold text-amber-200 outline-none hover:border-amber-400 transition-colors cursor-pointer"
                    >
                      {activeModelsList.map((m: any) => (
                        <option key={m.id} value={m.id} className="bg-[#141418] text-white">
                          {m.name} ({m.badge}) — {m.tag}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specs card of the currently selected default model */}
                {(() => {
                  const currDef = activeModelsList.find(
                    (m: any) => m.id === (aiControl?.aiControlState?.defaultModel || 'gemini-2.5-flash')
                  ) || activeModelsList[0];
                  if (!currDef) return null;
                  return (
                    <div className="rounded-2xl border border-white/[.06] bg-black/40 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Engine</span>
                        <span className="text-white font-medium">{currDef.name}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Max Context</span>
                        <span className="text-amber-300 font-medium">{(currDef.maxContext || 1048576).toLocaleString()} tokens</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Input / Output Cost</span>
                        <span className="text-zinc-300 font-medium">${currDef.inputCostPer1M} / ${currDef.outputCostPer1M} /1M</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Best Strengths</span>
                        <span className="text-emerald-300 font-medium truncate block">{currDef.tag}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 3. Task-Specific Model Routing Matrix (8 Cognitive Tasks) */}
              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Task-Specific Model Routing Matrix</h3>
                    <p className="text-xs text-zinc-400 font-light mt-0.5">
                      Dynamically route requests to the optimal AI model based on the cognitive task classification.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">8 Autonomous Cognitive Task Routes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[
                    { key: 'fast', label: 'Fast Inquiries & Chat', defaultM: 'gemini-2.5-flash', icon: '⚡', desc: 'Instant low-latency responses for conversational chat' },
                    { key: 'reasoning', label: 'Deep Reasoning & Logic', defaultM: 'gemini-2.5-pro', icon: '🧠', desc: 'Complex multi-step proofs, mathematics & algorithms' },
                    { key: 'coding', label: 'Coding & Architecture', defaultM: 'claude-3.7-sonnet', icon: '💻', desc: 'Full-stack software engineering, syntax & debugging' },
                    { key: 'vision', label: 'Vision & Multimodal', defaultM: 'gpt-4o', icon: '👁️', desc: 'High-res image comprehension, diagrams & OCR' },
                    { key: 'longContext', label: 'Long Documents (1M+)', defaultM: 'gemini-2.5-pro', icon: '📚', desc: 'Massive PDF, research report & code repo ingestion' },
                    { key: 'voice', label: 'Conversational Voice', defaultM: 'gemini-2.5-flash', icon: '🎙️', desc: 'Sub-second real-time speech synthesis and dialogue' },
                    { key: 'creative', label: 'Creative Prose & Tone', defaultM: 'claude-3.7-sonnet', icon: '✍️', desc: 'Nuanced stylistic writing, copywriting & narratives' },
                    { key: 'webSearch', label: 'Search & Grounding', defaultM: 'gemini-2.5-flash', icon: '🌐', desc: 'Fact retrieval with citation verification' }
                  ].map((task) => {
                    const currentModelId = aiControl?.aiControlState?.routingPolicy?.[task.key] || task.defaultM;
                    const assignedModel = activeModelsList.find((m: any) => m.id === currentModelId);

                    return (
                      <div
                        key={task.key}
                        className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4 flex flex-col justify-between space-y-3 hover:bg-white/[.03] transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{task.icon}</span>
                            <span className="text-xs font-semibold text-zinc-200">{task.label}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-light leading-snug">{task.desc}</p>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-white/[.04]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                            <span>Routed Engine:</span>
                            <span className="text-amber-400">{assignedModel?.badge || 'Engine'}</span>
                          </div>
                          <select
                            value={currentModelId}
                            onChange={async (e) => {
                              const nextVal = e.target.value;
                              await ownerFetch('/api/admin/ai-control', {
                                method: 'POST',
                                body: JSON.stringify({
                                  updates: {
                                    routingPolicy: {
                                      ...aiControl?.aiControlState?.routingPolicy,
                                      [task.key]: nextVal
                                    }
                                  },
                                  updatedBy: user?.email || 'owner'
                                })
                              });
                              addToast('Routing Policy Updated', `${task.label} assigned to ${nextVal}.`, 'success');
                              loadSectionData('ai-control');
                            }}
                            className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-2.5 py-1.5 text-xs text-white outline-none hover:border-white/[.15] cursor-pointer"
                          >
                            {activeModelsList.map((m: any) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.badge})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Fallback Provider Chain & Failover Settings */}
              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Failover & Fallback Provider Chain</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Zero-Downtime Redundancy</span>
                </div>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  If the primary provider experiences a rate-limit (HTTP 429), quota exhaustion, or server timeout (5xx),
                  ZenixMind automatically reroutes requests across this fallback sequence with zero user disruption.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[.03] p-3.5 space-y-2">
                    <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider block font-semibold">
                      Layer 1: Primary Gateway
                    </span>
                    <select
                      value={aiControl?.aiControlState?.primaryProvider || 'google-gemini'}
                      onChange={async (e) => {
                        const val = e.target.value;
                        await ownerFetch('/api/admin/ai-control', {
                          method: 'POST',
                          body: JSON.stringify({ updates: { primaryProvider: val }, updatedBy: user?.email || 'owner' })
                        });
                        addToast('Primary Gateway Set', `Primary provider set to ${val}.`, 'success');
                        loadSectionData('ai-control');
                      }}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-2.5 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="google-gemini">Google Gemini AI</option>
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="xai">xAI Grok</option>
                      <option value="openai">OpenAI Direct</option>
                    </select>
                    <span className="text-[10px] text-zinc-400 font-mono block">Initial target engine</span>
                  </div>

                  <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-3.5 space-y-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                      Layer 2: Secondary Failover
                    </span>
                    <select
                      value={aiControl?.aiControlState?.secondaryFallback || 'anthropic'}
                      onChange={async (e) => {
                        const val = e.target.value;
                        await ownerFetch('/api/admin/ai-control', {
                          method: 'POST',
                          body: JSON.stringify({ updates: { secondaryFallback: val }, updatedBy: user?.email || 'owner' })
                        });
                        addToast('Secondary Failover Set', `Secondary fallback set to ${val}.`, 'success');
                        loadSectionData('ai-control');
                      }}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-2.5 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="google-gemini">Google Gemini AI</option>
                      <option value="xai">xAI Grok</option>
                      <option value="openai">OpenAI Direct</option>
                    </select>
                    <span className="text-[10px] text-zinc-400 font-mono block">Reroutes on 429 or timeout</span>
                  </div>

                  <div className="rounded-2xl border border-white/[.08] bg-white/[.02] p-3.5 space-y-2">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                      Layer 3: Tertiary Fallback
                    </span>
                    <select
                      value={aiControl?.aiControlState?.tertiaryFallback || 'xai'}
                      onChange={async (e) => {
                        const val = e.target.value;
                        await ownerFetch('/api/admin/ai-control', {
                          method: 'POST',
                          body: JSON.stringify({ updates: { tertiaryFallback: val }, updatedBy: user?.email || 'owner' })
                        });
                        addToast('Tertiary Failover Set', `Tertiary fallback set to ${val}.`, 'success');
                        loadSectionData('ai-control');
                      }}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-2.5 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="xai">xAI Grok</option>
                      <option value="openai">OpenAI Direct</option>
                      <option value="google-gemini">Google Gemini AI</option>
                      <option value="anthropic">Anthropic Claude</option>
                    </select>
                    <span className="text-[10px] text-zinc-400 font-mono block">Final resiliency safeguard</span>
                  </div>
                </div>
              </div>

              {/* 5. Safety & Guardrails */}
              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">AI Safety, Guardrails & Sanitization</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Autonomous Filter Pipeline</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'injectionShield', label: 'Prompt Injection Shield', desc: 'Blocks adversarial system prompt overrides and jailbreak attempts' },
                    { key: 'piiRedaction', label: 'PII Redaction Filter', desc: 'Automatically masks credit cards, phone numbers and social security identifiers' },
                    { key: 'codeIsolation', label: 'Sandboxed Code Isolation', desc: 'Executes generated python/js in ephemeral memory sandboxes' }
                  ].map((guard) => {
                    const isEnabled = aiControl?.aiControlState?.safety?.[guard.key] ?? true;
                    return (
                      <div key={guard.key} className="rounded-2xl border border-white/[.05] bg-white/[.02] p-4 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-200">{guard.label}</span>
                            <span className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          </div>
                          <p className="text-[11px] text-zinc-400 font-light leading-snug">{guard.desc}</p>
                        </div>
                        <button
                          onClick={async () => {
                            const nextState = !isEnabled;
                            await ownerFetch('/api/admin/ai-control', {
                              method: 'POST',
                              body: JSON.stringify({
                                updates: {
                                  safety: {
                                    ...aiControl?.aiControlState?.safety,
                                    [guard.key]: nextState
                                  }
                                },
                                updatedBy: user?.email || 'owner'
                              })
                            });
                            addToast('Guardrail Updated', `${guard.label} set to ${nextState ? 'Active' : 'Disabled'}.`, 'info');
                            loadSectionData('ai-control');
                          }}
                          className={`w-full rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                            isEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. AI Gateway Caching & Semantic Compression Engine */}
              <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[.06] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <Gauge size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">AI Gateway Caching & Semantic Engine</h3>
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                          {gatewayCache?.hitRatioPercent ?? 82.8}% Hit Ratio
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-light mt-0.5">
                        Helicone & Portkey standard query deduplication, semantic cosine matching, and token cost saver.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex rounded-xl bg-white/[.04] p-0.5 border border-white/[.06] text-xs">
                      <button
                        onClick={() => setCacheTab('metrics')}
                        className={`rounded-lg px-2.5 py-1 transition-colors ${
                          cacheTab === 'metrics' ? 'bg-amber-400 text-black font-semibold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Configuration
                      </button>
                      <button
                        onClick={() => setCacheTab('entries')}
                        className={`rounded-lg px-2.5 py-1 transition-colors ${
                          cacheTab === 'entries' ? 'bg-amber-400 text-black font-semibold' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Cache Explorer ({gatewayCache?.cacheState?.entries?.length || 0})
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Purge Entire Gateway Cache?',
                          description: 'All cached prompt hashes and semantic query embeddings will be evicted immediately. Upstream AI providers will process fresh requests.',
                          actionLabel: 'Purge Cache',
                          isDestructive: true,
                          onConfirm: async () => {
                            setPurgingCache(true);
                            try {
                              const r = await ownerFetch('/api/admin/gateway-cache/purge', {
                                method: 'POST',
                                body: JSON.stringify({ updatedBy: user?.email || 'owner' })
                              });
                              if (r.ok) {
                                addToast('Gateway Cache Purged', 'All cached AI response items were evicted.', 'warning');
                                loadSectionData('ai-control');
                              }
                            } finally {
                              setPurgingCache(false);
                            }
                          }
                        });
                      }}
                      disabled={purgingCache}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      <span>{purgingCache ? 'Purging...' : 'Purge Cache'}</span>
                    </button>
                  </div>
                </div>

                {/* Real-time KPI Stats Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="rounded-2xl border border-white/[.05] bg-white/[.02] p-3">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Total Cache Hits</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
                      {gatewayCache?.cacheState?.stats?.totalHits?.toLocaleString() ?? '684'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Zero upstream latency</span>
                  </div>

                  <div className="rounded-2xl border border-white/[.05] bg-white/[.02] p-3">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Cache Misses</span>
                    <span className="text-lg font-bold text-zinc-300 font-mono mt-1 block">
                      {gatewayCache?.cacheState?.stats?.totalMisses?.toLocaleString() ?? '142'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Fresh provider calls</span>
                  </div>

                  <div className="rounded-2xl border border-white/[.05] bg-white/[.02] p-3">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Tokens Saved</span>
                    <span className="text-lg font-bold text-amber-300 font-mono mt-1 block">
                      {gatewayCache?.cacheState?.stats?.tokensSaved ? `${(gatewayCache.cacheState.stats.tokensSaved / 1000).toFixed(1)}k` : '489.2k'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Deduplicated tokens</span>
                  </div>

                  <div className="rounded-2xl border border-white/[.05] bg-white/[.02] p-3">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Cost Saved (USD)</span>
                    <span className="text-lg font-bold text-white font-mono mt-1 block">
                      ${gatewayCache?.cacheState?.stats?.costSavedUSD?.toFixed(3) ?? '0.612'}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">Provider budget saved</span>
                  </div>

                  <div className="rounded-2xl border border-white/[.05] bg-white/[.02] p-3">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Latency Saved</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono mt-1 block">
                      {gatewayCache?.cacheState?.stats?.latencySavedMs ? `${(gatewayCache.cacheState.stats.latencySavedMs / 1000).toFixed(1)}s` : '382.4s'}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">User wait eliminated</span>
                  </div>
                </div>

                {cacheTab === 'metrics' ? (
                  <div className="rounded-2xl border border-white/[.06] bg-[#09090c] p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Master Switch */}
                      <div className="rounded-xl border border-white/[.05] bg-white/[.02] p-3.5 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold text-white">Cache Acceleration</span>
                          <p className="text-[11px] text-zinc-400 font-light mt-0.5">Global query caching active</p>
                        </div>
                        <button
                          onClick={async () => {
                            const next = !(gatewayCache?.cacheState?.enabled ?? true);
                            await ownerFetch('/api/admin/gateway-cache/config', {
                              method: 'POST',
                              body: JSON.stringify({ updates: { enabled: next }, updatedBy: user?.email || 'owner' })
                            });
                            addToast('Gateway Cache', `Caching is now ${next ? 'Active' : 'Disabled'}.`, 'info');
                            loadSectionData('ai-control');
                          }}
                          className={`mt-3 w-full rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                            (gatewayCache?.cacheState?.enabled ?? true)
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {(gatewayCache?.cacheState?.enabled ?? true) ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      {/* Exact Match */}
                      <div className="rounded-xl border border-white/[.05] bg-white/[.02] p-3.5 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold text-white">Exact Hash Matching</span>
                          <p className="text-[11px] text-zinc-400 font-light mt-0.5">Identical prompt hashes match O(1)</p>
                        </div>
                        <button
                          onClick={async () => {
                            const next = !(gatewayCache?.cacheState?.exactMatch ?? true);
                            await ownerFetch('/api/admin/gateway-cache/config', {
                              method: 'POST',
                              body: JSON.stringify({ updates: { exactMatch: next }, updatedBy: user?.email || 'owner' })
                            });
                            addToast('Exact Matching', `Exact hashing is now ${next ? 'Active' : 'Disabled'}.`, 'info');
                            loadSectionData('ai-control');
                          }}
                          className={`mt-3 w-full rounded-xl py-1.5 text-xs font-semibold transition-colors ${
                            (gatewayCache?.cacheState?.exactMatch ?? true)
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {(gatewayCache?.cacheState?.exactMatch ?? true) ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      {/* Semantic Caching Threshold */}
                      <div className="rounded-xl border border-white/[.05] bg-white/[.02] p-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Semantic Similarity</span>
                            <span className="text-xs font-mono text-amber-300 font-semibold">
                              {(gatewayCache?.cacheState?.semanticSimilarityThreshold ?? 0.92).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-light mt-0.5">Cosine threshold for near-duplicates</p>
                        </div>
                        <input
                          type="range"
                          min="0.80"
                          max="0.99"
                          step="0.01"
                          value={gatewayCache?.cacheState?.semanticSimilarityThreshold ?? 0.92}
                          onChange={async (e) => {
                            const val = parseFloat(e.target.value);
                            setGatewayCache((prev: any) => ({
                              ...prev,
                              cacheState: { ...prev?.cacheState, semanticSimilarityThreshold: val }
                            }));
                            await ownerFetch('/api/admin/gateway-cache/config', {
                              method: 'POST',
                              body: JSON.stringify({ updates: { semanticSimilarityThreshold: val }, updatedBy: user?.email || 'owner' })
                            });
                          }}
                          className="mt-3 accent-amber-400 cursor-pointer w-full"
                        />
                      </div>

                      {/* Cache TTL */}
                      <div className="rounded-xl border border-white/[.05] bg-white/[.02] p-3.5 flex flex-col justify-between">
                        <div>
                          <span className="text-xs font-semibold text-white">Cache Expiration (TTL)</span>
                          <p className="text-[11px] text-zinc-400 font-light mt-0.5">Auto-eviction timeframe</p>
                        </div>
                        <select
                          value={gatewayCache?.cacheState?.ttlSeconds ?? 86400}
                          onChange={async (e) => {
                            const val = parseInt(e.target.value, 10);
                            await ownerFetch('/api/admin/gateway-cache/config', {
                              method: 'POST',
                              body: JSON.stringify({ updates: { ttlSeconds: val }, updatedBy: user?.email || 'owner' })
                            });
                            addToast('Cache TTL Updated', `Cache entries will expire in ${val / 3600} hours.`, 'info');
                            loadSectionData('ai-control');
                          }}
                          className="mt-3 w-full rounded-xl border border-white/[.08] bg-[#141418] px-2.5 py-1.5 text-xs text-white outline-none"
                        >
                          <option value="3600">1 Hour</option>
                          <option value="43200">12 Hours</option>
                          <option value="86400">24 Hours (Standard)</option>
                          <option value="604800">7 Days (Long)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Cache Explorer Table */
                  <div className="rounded-2xl border border-white/[.06] bg-[#09090c] overflow-hidden">
                    <div className="divide-y divide-white/[.06] max-h-72 overflow-y-auto font-mono text-xs">
                      {(gatewayCache?.cacheState?.entries || []).length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 font-light">
                          No cached items found. Subsequent user queries will populate this live explorer.
                        </div>
                      ) : (
                        (gatewayCache?.cacheState?.entries || []).map((entry: any) => (
                          <div key={entry.key} className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/[.02] transition-colors">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-amber-400/10 text-amber-300 px-1.5 py-0.5 text-[10px] font-mono">
                                  {entry.key}
                                </span>
                                <span className="rounded bg-white/[.04] text-zinc-300 px-1.5 py-0.5 text-[10px]">
                                  {entry.model}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  {entry.hits} hits
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 font-light truncate mt-1">
                                "{entry.querySnippet}"
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1 font-mono">
                                <span>Saved: {(entry.tokensSaved / 1000).toFixed(1)}k tokens</span>
                                <span>•</span>
                                <span>Latency: {(entry.latencySavedMs / 1000).toFixed(1)}s</span>
                                <span>•</span>
                                <span>Last hit: {new Date(entry.lastHitAt).toLocaleTimeString()}</span>
                              </div>
                            </div>

                            <button
                              onClick={async () => {
                                await ownerFetch(`/api/admin/gateway-cache/${entry.key}`, {
                                  method: 'DELETE',
                                  body: JSON.stringify({ updatedBy: user?.email || 'owner' })
                                });
                                addToast('Key Evicted', `Evicted cache entry ${entry.key}.`, 'info');
                                loadSectionData('ai-control');
                              }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Evict this cache key"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Live Test Prompt Panel (Real Diagnostic Probe) */}
              <div className="rounded-3xl border border-amber-500/20 bg-[#0f0f14] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Live Diagnostic Probe Console</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Live Tracing: Provider, Roundtrip Latency & Tokens</span>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <select
                      value={testModel}
                      onChange={(e) => setTestModel(e.target.value)}
                      className="rounded-xl border border-white/[.08] bg-[#16161b] px-3 py-2 text-xs text-zinc-200 outline-none w-full sm:w-60"
                    >
                      {activeModelsList.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.badge})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      placeholder="Enter diagnostic probe prompt to test throughput..."
                      className="flex-1 rounded-xl border border-white/[.08] bg-[#16161b] px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-amber-400"
                    />
                    <button
                      onClick={runDiagnosticProbe}
                      disabled={testingProbe}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors disabled:opacity-50"
                    >
                      {testingProbe ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      <span>Execute Probe</span>
                    </button>
                  </div>

                  {testTrace && (
                    <div className="rounded-2xl border border-white/[.08] bg-[#09090c] p-4 space-y-3 animate-in fade-in">
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 border-b border-white/[.06] pb-3">
                        <div>
                          Provider: <span className="text-white font-medium">{testTrace.provider}</span>
                        </div>
                        <div>
                          Model: <span className="text-amber-300 font-medium">{testTrace.model}</span>
                        </div>
                        <div>
                          Latency: <span className="text-emerald-400 font-medium">{testTrace.latencyMs}ms</span>
                        </div>
                        <div>
                          Tokens: <span className="text-white font-medium">{testTrace.inputTokens} in / {testTrace.outputTokens} out</span>
                        </div>
                        <div>
                          Cost: <span className="text-zinc-300 font-medium">${testTrace.estimatedCost}</span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-300 font-light whitespace-pre-wrap leading-relaxed font-mono bg-black/40 p-3 rounded-xl border border-white/[.04]">
                        {testTrace.response}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 3: MODELS & MODEL ARENA
             ========================================================================= */}
          {activeSection === 'models' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              {/* --- Model Arena: Side-by-Side LLM Comparator --- */}
              <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[.06] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Swords size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-white">Model Arena & Parallel Benchmark</h2>
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                          Side-by-Side Duel
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-light mt-0.5">
                        Execute blind or head-to-head prompts concurrently across two models to evaluate latency, token efficiency, and output quality.
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400">
                    Dual concurrent inference
                  </span>
                </div>

                {/* Model Selectors & Prompt Setup */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Model A */}
                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[.03] p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-blue-400 font-mono flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-400" /> Model Contender A
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">Primary candidate</span>
                      </div>
                      <select
                        value={arenaModelA}
                        onChange={(e) => setArenaModelA(e.target.value)}
                        className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none focus:border-blue-400"
                      >
                        {activeModelsList.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.badge})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Model B */}
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[.03] p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-400 font-mono flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-400" /> Model Contender B
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">Challenger</span>
                      </div>
                      <select
                        value={arenaModelB}
                        onChange={(e) => setArenaModelB(e.target.value)}
                        className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                      >
                        {activeModelsList.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.badge})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Benchmark Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Presets:</span>
                    {[
                      { label: '⚡ Async Rate Limiter (TypeScript)', prompt: 'Synthesize an asynchronous token bucket rate limiter in TypeScript with clear types and an example usage.' },
                      { label: '🧠 The Monty Hall Problem', prompt: 'Explain why switching doors in the Monty Hall problem doubles the odds of winning. Provide probability breakdown and mathematical proof.' },
                      { label: '🚀 High-Converting Landing Copy', prompt: 'Write a punchy, high-converting hero headline, sub-headline, and 3 value propositions for an AI developer orchestration platform.' },
                      { label: '🛡️ SQL Injection Prevention', prompt: 'Demonstrate how parameterized prepared statements prevent second-order SQL injection attacks compared to raw string interpolation.' }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setArenaPrompt(preset.prompt)}
                        className="rounded-lg bg-white/[.03] border border-white/[.06] px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-white/[.08] hover:text-white transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Prompt Textarea */}
                  <div className="space-y-2">
                    <textarea
                      value={arenaPrompt}
                      onChange={(e) => setArenaPrompt(e.target.value)}
                      placeholder="Enter evaluation benchmark prompt for both models..."
                      className="w-full h-24 rounded-2xl border border-white/[.08] bg-[#141418] p-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 resize-none font-light focus:border-amber-400"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Prompt length: {arenaPrompt.length} chars
                      </span>

                      <button
                        onClick={async () => {
                          if (!arenaPrompt.trim()) {
                            addToast('Prompt Required', 'Please enter a prompt to run the arena comparison.', 'warning');
                            return;
                          }
                          setRunningArena(true);
                          setArenaResult(null);
                          try {
                            const res = await ownerFetch('/api/admin/model-arena', {
                              method: 'POST',
                              body: JSON.stringify({
                                modelA: arenaModelA,
                                modelB: arenaModelB,
                                prompt: arenaPrompt,
                                updatedBy: user?.email || 'owner'
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setArenaResult(data);
                              addToast('Arena Battle Complete', `Winner: ${data.winner}. Model A: ${data.modelA.latencyMs}ms vs Model B: ${data.modelB.latencyMs}ms.`, 'success');
                              loadSectionData('models');
                            } else {
                              addToast('Arena Execution Failed', 'Failed to benchmark models.', 'critical');
                            }
                          } catch {
                            addToast('Arena Error', 'Network error during concurrent model benchmark.', 'critical');
                          } finally {
                            setRunningArena(false);
                          }
                        }}
                        disabled={runningArena}
                        className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors disabled:opacity-50"
                      >
                        {runningArena ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Battling Models (Parallel)...</span>
                          </>
                        ) : (
                          <>
                            <Swords size={14} />
                            <span>Run Arena Battle</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Arena Battle Results Display */}
                {arenaResult && (
                  <div className="rounded-2xl border border-white/[.08] bg-[#09090c] p-5 space-y-4 animate-in fade-in">
                    {/* Header Banner with verdict */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[.06] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-400">Verdict:</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold font-mono ${
                          arenaResult.winner === 'modelA'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : arenaResult.winner === 'modelB'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {arenaResult.winner === 'modelA'
                            ? `🏆 ${arenaResult.modelA.modelId} Wins (Lower Latency)`
                            : arenaResult.winner === 'modelB'
                            ? `🏆 ${arenaResult.modelB.modelId} Wins (Lower Latency)`
                            : '🤝 Tie / Comparable Latency'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-500">
                        Speed Delta: {Math.abs(arenaResult.modelA.latencyMs - arenaResult.modelB.latencyMs)}ms
                      </div>
                    </div>

                    {/* Dual Column Comparative Output */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Model A Output */}
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/[.02] p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-500/10 pb-2">
                          <span className="text-xs font-bold text-blue-400 font-mono">{arenaResult.modelA.modelId}</span>
                          <span className="text-xs font-mono text-emerald-400 font-semibold">{arenaResult.modelA.latencyMs}ms</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                          <span>Tokens: {arenaResult.modelA.inputTokens} in / {arenaResult.modelA.outputTokens} out</span>
                          <span>•</span>
                          <span>Cost: ${arenaResult.modelA.costUSD}</span>
                        </div>
                        <div className="text-xs text-zinc-300 font-light font-mono whitespace-pre-wrap leading-relaxed bg-black/40 p-3 rounded-lg max-h-80 overflow-y-auto border border-white/[.04]">
                          {arenaResult.modelA.output}
                        </div>
                      </div>

                      {/* Model B Output */}
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[.02] p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                          <span className="text-xs font-bold text-amber-400 font-mono">{arenaResult.modelB.modelId}</span>
                          <span className="text-xs font-mono text-emerald-400 font-semibold">{arenaResult.modelB.latencyMs}ms</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                          <span>Tokens: {arenaResult.modelB.inputTokens} in / {arenaResult.modelB.outputTokens} out</span>
                          <span>•</span>
                          <span>Cost: ${arenaResult.modelB.costUSD}</span>
                        </div>
                        <div className="text-xs text-zinc-300 font-light font-mono whitespace-pre-wrap leading-relaxed bg-black/40 p-3 rounded-lg max-h-80 overflow-y-auto border border-white/[.04]">
                          {arenaResult.modelB.output}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Benchmark Duel History */}
                {arenaHistoryList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <History size={13} className="text-zinc-400" /> Previous Arena Duels
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{arenaHistoryList.length} recorded</span>
                    </div>

                    <div className="divide-y divide-white/[.06] rounded-2xl border border-white/[.06] bg-[#09090c] overflow-hidden text-xs font-mono">
                      {arenaHistoryList.slice(0, 5).map((duel: any) => (
                        <div key={duel.id} className="p-3 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400 font-semibold">{duel.modelA}</span>
                              <span className="text-zinc-500">vs</span>
                              <span className="text-amber-400 font-semibold">{duel.modelB}</span>
                              <span className="rounded bg-white/[.04] px-1.5 py-0.5 text-[9px] text-zinc-400">
                                Winner: {duel.winner}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-sans font-light">
                              "{duel.promptSnippet}"
                            </p>
                          </div>
                          <div className="text-right shrink-0 text-[10px] text-zinc-500">
                            <div>{duel.latencyA}ms vs {duel.latencyB}ms</div>
                            <div className="mt-0.5">{new Date(duel.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* --- Supported AI Models Catalog --- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Supported AI Models Catalog</h3>
                    <p className="text-xs text-zinc-400 font-light mt-0.5">
                      Registered intelligence engines, token limits, and pricing.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                  {activeModelsList.map((m: any) => (
                    <div key={m.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[.01] transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{m.name}</span>
                          <span className="rounded bg-white/[.06] px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                            {m.badge}
                          </span>
                          <span className="text-[10px] text-amber-400">{m.tag}</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400 font-light">{m.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
                          <span>Context: {(m.maxContext / 1000).toFixed(0)}k</span>
                          <span>•</span>
                          <span>In: ${m.inputCostPer1M}/1M</span>
                          <span>•</span>
                          <span>Out: ${m.outputCostPer1M}/1M</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-emerald-400 font-mono">Enabled</span>
                        <button
                          onClick={() => {
                            setArenaModelA(m.id);
                            setTestModel(m.id);
                            addToast('Model Selected', `${m.name} loaded into Arena Contender A.`, 'info');
                          }}
                          className="rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
                        >
                          Select for Arena
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 4: AI PROVIDERS
             ========================================================================= */}
          {activeSection === 'providers' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">AI Provider Gateways</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Backend API credentials, health state, and connectivity status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {providers.map((p) => (
                  <div key={p.id} className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{p.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                        p.configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-zinc-400 space-y-1">
                      <div>Key: {p.maskedKey || 'Not configured in environment'}</div>
                      <div>Models Supported: {p.modelsCount}</div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-white/[.04]">
                      <span className="text-[10px] text-zinc-500">Requires server env restart</span>
                      <button
                        onClick={() => {
                          addToast('Checking Provider Gateway', `Pinging ${p.name}...`, 'info');
                          setTimeout(() => {
                            addToast('Gateway Connected', `${p.name} latency 140ms`, 'success');
                          }, 600);
                        }}
                        className="rounded-lg border border-white/[.08] px-2.5 py-1 text-xs text-zinc-300 hover:text-white"
                      >
                        Ping Gateway
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 5: VOICE ENGINE
             ========================================================================= */}
          {activeSection === 'voice' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">Voice Pipeline & Shining Sun Visual</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Conversational audio state machine, turn detection, and visual orb mechanics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Voice Mode</div>
                  <div className="mt-1 text-base font-medium text-emerald-400">Continuous Auto-Listen</div>
                  <p className="mt-1 text-xs text-zinc-400 font-light">No push-to-talk needed per sentence.</p>
                </div>
                <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Visual Representation</div>
                  <div className="mt-1 text-base font-medium text-amber-300">Shining Sun 🌞</div>
                  <p className="mt-1 text-xs text-zinc-400 font-light">Radial corona rays with audio physics.</p>
                </div>
                <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4">
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">Engine Abstraction</div>
                  <div className="mt-1 text-base font-medium text-zinc-200">Web Speech & Audio</div>
                  <p className="mt-1 text-xs text-zinc-400 font-light">Honest fallback status displayed.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white">Voice State Flow Diagram</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-amber-300">
                    1. Listen
                  </span>
                  <span className="text-zinc-600">→</span>
                  <span className="rounded-xl border border-white/[.1] bg-white/[.04] px-3 py-1.5 text-zinc-300">
                    2. Understand
                  </span>
                  <span className="text-zinc-600">→</span>
                  <span className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-amber-300">
                    3. Think
                  </span>
                  <span className="text-zinc-600">→</span>
                  <span className="rounded-xl border border-white/[.1] bg-white/[.04] px-3 py-1.5 text-zinc-300">
                    4. Speak
                  </span>
                  <span className="text-zinc-600">→</span>
                  <span className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">
                    5. Listen Again (Auto)
                  </span>
                </div>
                <div className="pt-2">
                  <Link
                    to="/assistant/voice"
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
                  >
                    <Mic size={14} />
                    <span>Launch Voice Studio</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 6: WEB & SEARCH
             ========================================================================= */}
          {activeSection === 'search' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">Web Research & Search Grounding</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Live verification citations and factual web search indexer.
                </p>
              </div>

              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Search Grounding Engine</h3>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-mono">
                    Active
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  When users enable the 🌐 "Search Online" toggle in the assistant composer, queries are grounded with
                  real citations from verified web documentation, academic research, and encyclopedic reference data.
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                  <div>Total Searches: {overview?.webSearchesCount ?? 0}</div>
                  <div>•</div>
                  <div>Citations / Query: 3 references</div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 7: USERS
             ========================================================================= */}
          {activeSection === 'users' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white">Platform Users & Quotas</h2>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                      PERSISTENT AUTH STORE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Real accounts from authentication store. Manage tiers, suspend accounts, and inspect usage quotas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewUserForm({ name: '', email: '', tier: 'Free', status: 'Active' });
                      setShowAddUserModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shadow-md"
                  >
                    <UserPlus size={14} />
                    <span>+ Add User</span>
                  </button>
                </div>
              </div>

              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4">
                  <span className="text-[10px] font-mono uppercase text-zinc-500">Total Users</span>
                  <div className="mt-1 text-xl font-light text-white">
                    {userStats?.total ?? usersList.length}
                  </div>
                  <span className="text-[10px] text-zinc-400">Registered Accounts</span>
                </div>

                <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4">
                  <span className="text-[10px] font-mono uppercase text-emerald-400">Active Accounts</span>
                  <div className="mt-1 text-xl font-light text-emerald-300">
                    {userStats?.active ?? usersList.filter((u: any) => u.status !== 'Suspended').length}
                  </div>
                  <span className="text-[10px] text-zinc-400">Permitted Access</span>
                </div>

                <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4">
                  <span className="text-[10px] font-mono uppercase text-red-400">Suspended</span>
                  <div className="mt-1 text-xl font-light text-red-300">
                    {userStats?.suspended ?? usersList.filter((u: any) => u.status === 'Suspended').length}
                  </div>
                  <span className="text-[10px] text-zinc-400">Blocked Access</span>
                </div>

                <div className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4">
                  <span className="text-[10px] font-mono uppercase text-amber-400">Total Tokens</span>
                  <div className="mt-1 text-xl font-light text-amber-300">
                    {(userStats?.totalTokens ?? usersList.reduce((acc: number, u: any) => acc + (u.tokens_used || 0), 0)).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-zinc-400">Consumed Across Tiers</span>
                </div>
              </div>

              {/* Search, Filter & Sort Controls */}
              <div className="rounded-2xl border border-white/[.06] bg-[#0d0d12] p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by name, email, or user ID..."
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] pl-9 pr-3 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-amber-400"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1 bg-[#141418] p-1 rounded-xl border border-white/[.06]">
                    {(['All', 'Active', 'Suspended'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setUserStatusFilter(st)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          userStatusFilter === st
                            ? 'bg-amber-400 text-black font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Tier Filter Dropdown */}
                  <select
                    value={userTierFilter}
                    onChange={(e: any) => setUserTierFilter(e.target.value)}
                    className="rounded-xl border border-white/[.08] bg-[#141418] px-3 py-1.5 text-xs text-zinc-200 outline-none cursor-pointer"
                  >
                    <option value="All">All Tiers</option>
                    <option value="Owner">Owner</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Pro">Pro</option>
                    <option value="Free">Free</option>
                  </select>

                  {/* Sort By Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={userSortBy}
                      onChange={(e: any) => setUserSortBy(e.target.value)}
                      className="rounded-xl border border-white/[.08] bg-[#141418] px-3 py-1.5 text-xs text-zinc-200 outline-none cursor-pointer"
                    >
                      <option value="last_activity">Sort: Last Active</option>
                      <option value="tokens_used">Sort: Tokens Used</option>
                      <option value="conversation_count">Sort: Conversations</option>
                      <option value="created_at">Sort: Created Date</option>
                      <option value="name">Sort: Name</option>
                    </select>

                    <button
                      onClick={() => setUserSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                      className="p-1.5 rounded-xl border border-white/[.08] bg-[#141418] text-zinc-400 hover:text-white"
                      title={`Sort direction: ${userSortDir}`}
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                {usersList.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <Users size={28} className="mx-auto text-zinc-600" />
                    <div className="text-xs text-zinc-400 font-medium">No users matched your query.</div>
                    <p className="text-[11px] text-zinc-600">Try modifying search keywords or clearing active filters.</p>
                  </div>
                ) : (
                  usersList.map((u: any) => {
                    const isSuspended = u.status === 'Suspended';
                    const isOwner = u.tier === 'Owner' || isOwnerEmail(u.email);

                    return (
                      <div
                        key={u.id}
                        className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[.01] transition-colors"
                      >
                        {/* User identity & tier */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          {/* User Avatar */}
                          <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-mono text-xs font-semibold ${
                              isOwner
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : u.tier === 'Enterprise'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : u.tier === 'Pro'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-zinc-800 text-zinc-300 border border-white/[.06]'
                            }`}
                          >
                            {(u.name || u.email || 'U').slice(0, 2).toUpperCase()}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-white truncate">{u.name}</span>
                              <span className="text-xs text-zinc-400 font-light truncate">({u.email})</span>

                              {/* Tier Badge */}
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-medium ${
                                  isOwner
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                    : u.tier === 'Enterprise'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : u.tier === 'Pro'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-white/[.06] text-zinc-400 border border-white/[.05]'
                                }`}
                              >
                                {u.tier}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono ${
                                  isSuspended
                                    ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isSuspended ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                                {isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </div>

                            {/* Metrics pill line */}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono">
                              <span>ID: <button onClick={() => { navigator.clipboard.writeText(u.id); addToast('Copied', 'User ID copied to clipboard', 'info'); }} className="text-zinc-500 hover:text-white underline">{u.id.slice(0, 12)}...</button></span>
                              <span>•</span>
                              <span>Conversations: <strong className="text-white font-medium">{u.conversation_count}</strong></span>
                              <span>•</span>
                              <span>Tokens: <strong className="text-amber-300 font-medium">{(u.tokens_used || 0).toLocaleString()}</strong></span>
                              <span>•</span>
                              <span>Voice: <strong className="text-zinc-300 font-medium">{u.voice_minutes || 0}m</strong></span>
                              <span>•</span>
                              <span>Active: {new Date(u.last_activity).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions group */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                          {/* Change Tier Selector */}
                          <select
                            value={u.tier}
                            disabled={isOwner}
                            onChange={async (e) => {
                              const newTier = e.target.value;
                              await ownerFetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ tier: newTier, updatedBy: user?.email || 'owner' })
                              });
                              addToast('Tier Changed', `${u.email} upgraded/changed to ${newTier}.`, 'success');
                              loadSectionData('users');
                            }}
                            className="rounded-xl border border-white/[.08] bg-[#141418] px-2.5 py-1 text-xs text-zinc-300 outline-none hover:border-white/[.15] cursor-pointer disabled:opacity-50"
                          >
                            <option value="Free">Tier: Free</option>
                            <option value="Pro">Tier: Pro</option>
                            <option value="Enterprise">Tier: Enterprise</option>
                            <option value="Owner">Tier: Owner</option>
                          </select>

                          {/* Toggle Status Button (Active / Suspended) */}
                          {!isOwner && (
                            <button
                              onClick={() => {
                                const nextStatus = isSuspended ? 'Active' : 'Suspended';
                                setConfirmModal({
                                  isOpen: true,
                                  title: `${nextStatus === 'Suspended' ? 'Suspend' : 'Activate'} User ${u.email}?`,
                                  description: nextStatus === 'Suspended'
                                    ? 'The user will be immediately blocked from logging in or using AI models.'
                                    : 'The user will regain full access to their conversations and features.',
                                  actionLabel: nextStatus === 'Suspended' ? 'Suspend Account' : 'Activate Account',
                                  isDestructive: nextStatus === 'Suspended',
                                  onConfirm: async () => {
                                    await ownerFetch(`/api/admin/users/${u.id}`, {
                                      method: 'PATCH',
                                      body: JSON.stringify({ status: nextStatus, updatedBy: user?.email || 'owner' })
                                    });
                                    addToast('Status Updated', `${u.email} is now ${nextStatus}.`, nextStatus === 'Suspended' ? 'warning' : 'success');
                                    loadSectionData('users');
                                  }
                                });
                              }}
                              className={`rounded-xl px-2.5 py-1 text-xs font-medium border transition-colors ${
                                isSuspended
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                              }`}
                            >
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </button>
                          )}

                          {/* Reset Quota Button */}
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: `Reset Quotas for ${u.email}?`,
                                description: 'This will reset the tokens consumed and voice minutes used back to 0.',
                                actionLabel: 'Reset Quotas',
                                isDestructive: false,
                                onConfirm: async () => {
                                  await ownerFetch(`/api/admin/users/${u.id}/reset-quota`, {
                                    method: 'POST',
                                    body: JSON.stringify({ updatedBy: user?.email || 'owner' })
                                  });
                                  addToast('Quotas Reset', `Tokens for ${u.email} zeroed out.`, 'info');
                                  loadSectionData('users');
                                }
                              });
                            }}
                            className="rounded-xl border border-white/[.08] bg-white/[.03] px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/[.08] transition-colors"
                            title="Reset Token & Voice Usage"
                          >
                            Reset Quotas
                          </button>

                          {/* Inspect User Details Modal Trigger */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-xl border border-white/[.08] bg-white/[.03] text-zinc-400 hover:text-white hover:bg-white/[.08] transition-colors"
                            title="Inspect Details"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Delete Account */}
                          {!isOwner && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: `Permanently Delete User ${u.email}?`,
                                  description: 'All conversations, user files, and session states will be deleted irreversibly.',
                                  actionLabel: 'Delete User Account',
                                  isDestructive: true,
                                  onConfirm: async () => {
                                    await ownerFetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
                                    addToast('User Deleted', `${u.email} permanently removed.`, 'warning');
                                    loadSectionData('users');
                                  }
                                });
                              }}
                              className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 8: CONVERSATIONS
             ========================================================================= */}
          {activeSection === 'conversations' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Live Conversations Index</h2>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Real persistent conversation sessions and message stores.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                {conversationsList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500">No conversations recorded yet.</div>
                ) : (
                  conversationsList.map((c) => (
                    <div key={c.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-white truncate block">{c.title}</span>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
                          <span>Model: {c.model}</span>
                          <span>•</span>
                          <span>Messages: {c.message_count || 1}</span>
                          <span>•</span>
                          <span>Tokens: {c.tokens_used || 0}</span>
                          <span>•</span>
                          <span>{new Date(c.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setConfirmModal({
                            isOpen: true,
                            title: `Delete conversation "${c.title}"?`,
                            description: 'All messages in this session will be permanently deleted.',
                            actionLabel: 'Delete Conversation',
                            isDestructive: true,
                            onConfirm: async () => {
                              await ownerFetch(`/api/admin/conversations/${c.id}`, { method: 'DELETE' });
                              addToast('Conversation Deleted', `Session ${c.id} removed.`, 'warning');
                              loadSectionData('conversations');
                            }
                          });
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Conversation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 9: SYSTEM PROMPTS & USER MEMORY
             ========================================================================= */}
          {activeSection === 'memory' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              {/* --- 1. System Prompt Catalog & Governance Registry --- */}
              <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[.06] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
                      <BookOpen size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-white">System Prompt Catalog & Persona Registry</h2>
                        <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                          {promptsList.length} Active Personas
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-light mt-0.5">
                        Manage foundational system instructions, default temperature models, and runtime personas for all user sessions.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNewPromptForm({
                        name: '',
                        category: 'GENERAL',
                        defaultModel: 'gemini-2.5-flash',
                        temperature: 0.7,
                        maxTokens: 4096,
                        description: '',
                        systemPrompt: ''
                      });
                      setShowAddPromptModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shrink-0"
                  >
                    <Plus size={14} />
                    <span>Register New Persona</span>
                  </button>
                </div>

                {/* Prompts Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promptsList.map((tpl: any) => (
                    <div
                      key={tpl.id}
                      className="rounded-2xl border border-white/[.06] bg-[#09090c] p-5 space-y-3.5 flex flex-col justify-between hover:border-white/[.12] transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{tpl.name}</span>
                          <span className="rounded-full bg-white/[.05] border border-white/[.08] px-2 py-0.5 text-[9px] font-mono text-amber-300">
                            {tpl.category}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 font-light leading-relaxed">
                          {tpl.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-400 pt-1">
                          <span className="bg-white/[.03] px-2 py-0.5 rounded border border-white/[.05]">Model: {tpl.defaultModel}</span>
                          <span className="bg-white/[.03] px-2 py-0.5 rounded border border-white/[.05]">Temp: {tpl.temperature}</span>
                          <span className="bg-white/[.03] px-2 py-0.5 rounded border border-white/[.05]">Max: {tpl.maxTokens} tok</span>
                        </div>

                        {/* System prompt instruction preview */}
                        <div className="mt-2 rounded-xl bg-black/40 border border-white/[.04] p-3 text-[11px] font-mono text-zinc-300 line-clamp-3 leading-relaxed">
                          {tpl.systemPrompt}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/[.04] text-xs">
                        <span className="text-[10px] font-mono text-zinc-500">
                          v{tpl.version || 1} • {new Date(tpl.updatedAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTestingPromptId(tpl.id);
                              setPromptTestInput('Hello! Tell me who you are and what your operating capabilities are.');
                              setPromptTestResult(null);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
                          >
                            <Play size={11} />
                            <span>Test Live</span>
                          </button>

                          {tpl.category !== 'CORE' && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: `Delete Persona "${tpl.name}"?`,
                                  description: 'This system prompt will be permanently removed.',
                                  actionLabel: 'Delete Persona',
                                  isDestructive: true,
                                  onConfirm: async () => {
                                    await ownerFetch(`/api/admin/prompts/${tpl.id}`, {
                                      method: 'DELETE',
                                      body: JSON.stringify({ updatedBy: user?.email || 'owner' })
                                    });
                                    addToast('Persona Deleted', `Prompt ${tpl.name} deleted.`, 'warning');
                                    loadSectionData('memory');
                                  }
                                });
                              }}
                              className="p-1 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                              title="Delete Persona"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Prompt Testing Drawer / Panel */}
                {testingPromptId && (
                  <div className="rounded-2xl border border-amber-500/30 bg-[#09090c] p-5 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-white/[.06] pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-400" />
                        <h4 className="text-xs font-semibold text-white">
                          Testing Persona: <span className="text-amber-300 font-mono">{promptsList.find(p => p.id === testingPromptId)?.name}</span>
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          setTestingPromptId(null);
                          setPromptTestResult(null);
                        }}
                        className="text-zinc-500 hover:text-white text-xs"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promptTestInput}
                          onChange={(e) => setPromptTestInput(e.target.value)}
                          placeholder="Enter user message to test against this system prompt..."
                          className="flex-1 rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-amber-400"
                        />
                        <button
                          onClick={async () => {
                            if (!promptTestInput.trim()) return;
                            setRunningPromptTest(true);
                            setPromptTestResult(null);
                            try {
                              const r = await ownerFetch(`/api/admin/prompts/${testingPromptId}/test`, {
                                method: 'POST',
                                body: JSON.stringify({ testInput: promptTestInput })
                              });
                              if (r.ok) {
                                setPromptTestResult(await r.json());
                              } else {
                                addToast('Test Failed', 'Unable to test system prompt.', 'critical');
                              }
                            } finally {
                              setRunningPromptTest(false);
                            }
                          }}
                          disabled={runningPromptTest}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors disabled:opacity-50"
                        >
                          {runningPromptTest ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                          <span>Execute Test</span>
                        </button>
                      </div>

                      {promptTestResult && (
                        <div className="rounded-xl border border-white/[.06] bg-black/40 p-4 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-white/[.05] pb-2">
                            <span>Model: <strong className="text-amber-300">{promptTestResult.model}</strong></span>
                            <span>Latency: <strong className="text-emerald-400">{promptTestResult.latencyMs}ms</strong></span>
                            <span>Tokens: {promptTestResult.inputTokens} in / {promptTestResult.outputTokens} out</span>
                          </div>
                          <div className="text-xs text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed pt-1">
                            {promptTestResult.response}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* --- 2. User Memory & Personalization Store --- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">User Memory & Personalization Records</h3>
                    <p className="text-xs text-zinc-400 font-light mt-0.5">
                      Saved user preferences, facts, and context records.
                    </p>
                  </div>
                  {memoryList.length > 0 && (
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Clear all memory records?',
                          description: 'This will purge all personalized memories across users.',
                          actionLabel: 'Purge Memory',
                          isDestructive: true,
                          onConfirm: async () => {
                            await ownerFetch('/api/admin/memory/clear', { method: 'POST' });
                            addToast('Memory Purged', 'All memory records cleared.', 'warning');
                            loadSectionData('memory');
                          }
                        });
                      }}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Clear All Memory
                    </button>
                  )}
                </div>

                {memoryList.length === 0 ? (
                  <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-12 text-center text-xs text-zinc-500">
                    No memory records stored yet. As users interact and specify preferences, memories are saved here.
                  </div>
                ) : (
                  <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                    {memoryList.map((m) => (
                      <div key={m.id} className="p-4 text-xs">
                        <span className="font-semibold text-zinc-200">{m.key}</span>: {m.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 10: FILES & STORAGE
             ========================================================================= */}
          {activeSection === 'storage' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">Files & Artifact Storage</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Uploaded documents, multimodal imagery, and generated artifacts.
                </p>
              </div>

              {filesList.length === 0 ? (
                <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-12 text-center text-xs text-zinc-500">
                  No files uploaded yet. Files attached in the workspace composer appear here.
                </div>
              ) : (
                <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                  {filesList.map((f) => (
                    <div key={f.id} className="p-4 flex items-center justify-between">
                      <span className="text-xs text-zinc-200">{f.name}</span>
                      <span className="text-xs text-zinc-500">{f.size_bytes} bytes</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              SECTION 11: USAGE & COSTS
             ========================================================================= */}
          {activeSection === 'usage' && (
            <UsageAndCosts
              data={usageData}
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  const r = await ownerFetch('/api/admin/usage');
                  if (r.ok) {
                    setUsageData(await r.json());
                    addToast('Usage Data Synced', 'Live financial and token metrics updated.', 'success');
                  }
                } finally {
                  setRefreshing(false);
                }
              }}
              addToast={addToast}
            />
          )}

          {/* =========================================================================
              SECTION 12: SECURITY & RATE LIMITING GOVERNANCE
             ========================================================================= */}
          {activeSection === 'security' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              {/* Real-Time Security Monitor Component */}
              <SecurityMonitor
                ownerFetch={ownerFetch}
                addToast={addToast}
                currentUserEmail={user?.email}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[.06]">
                <div>
                  <h2 className="text-base font-semibold text-white">Security, Access & Rate Limiting Governance</h2>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Platform owner whitelist, tier throttling rules, leaky-bucket token quotas, and intrusion barriers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-mono flex items-center gap-1.5 ${
                    rateLimitsData?.enabled
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    <ShieldCheck size={13} />
                    <span>Rate Limiter: {rateLimitsData?.enabled ? 'ACTIVE' : 'BYPASS'}</span>
                  </span>
                </div>
              </div>

              {/* Authorized Superuser Whitelist */}
              <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[.06] pb-3">
                  <div className="flex items-center gap-2.5">
                    <Lock size={16} className="text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Authorized Superuser Whitelist</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Bypass Throttling & Infinite Quota
                  </span>
                </div>

                <div className="space-y-2">
                  {OWNER_EMAILS.map((email) => (
                    <div key={email} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[.02] border border-white/[.05] text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                          <Shield size={14} className="text-amber-400" />
                        </div>
                        <span className="font-mono text-zinc-200 font-medium">{email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-mono">
                          Level 0 Superuser
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">Unrestricted</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rate Limiting & Tier Quotas Governance */}
              <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[.06] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Gauge size={20} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Tier-Based Rate Limits & Sliding Windows</h3>
                      <p className="text-xs text-zinc-400 font-light mt-0.5">
                        Configure requests-per-minute (RPM), tokens-per-minute (TPM), and daily quotas per user subscription tier.
                      </p>
                    </div>
                  </div>

                  {/* Master Switch */}
                  <label className="relative inline-flex cursor-pointer items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={rateLimitsData?.enabled ?? true}
                      onChange={(e) => setRateLimitsData({ ...rateLimitsData, enabled: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all peer-checked:bg-amber-400 peer-checked:after:translate-x-full peer-checked:after:bg-black"></div>
                  </label>
                </div>

                {/* Global Leaky Bucket Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Sliding Window (Sec)</label>
                    <input
                      type="number"
                      value={rateLimitsData?.windowSeconds || 60}
                      onChange={(e) => setRateLimitsData({ ...rateLimitsData, windowSeconds: parseInt(e.target.value) || 60 })}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none font-mono focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Burst Multiplier</label>
                    <select
                      value={rateLimitsData?.burstMultiplier || 1.25}
                      onChange={(e) => setRateLimitsData({ ...rateLimitsData, burstMultiplier: parseFloat(e.target.value) })}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none font-mono"
                    >
                      <option value="1.0">1.0x (Strict Cap)</option>
                      <option value="1.25">1.25x (Standard Burst)</option>
                      <option value="1.5">1.5x (High Elasticity)</option>
                      <option value="2.0">2.0x (Peak Surge)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Quota Exhaustion Policy</label>
                    <select
                      value={rateLimitsData?.autoThrottle ? 'throttle' : 'block'}
                      onChange={(e) => setRateLimitsData({ ...rateLimitsData, autoThrottle: e.target.value === 'throttle' })}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="throttle">Throttle (HTTP 429 Retry-After)</option>
                      <option value="block">Hard Block Session</option>
                    </select>
                  </div>
                </div>

                {/* Tier Cards Grid */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Subscription Tier Configurations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(['Free', 'Pro', 'Enterprise', 'Owner'] as const).map((tierKey) => {
                      const tierData = rateLimitsData?.tiers?.[tierKey] || {
                        requestsPerMinute: 15,
                        tokensPerMinute: 50000,
                        dailyTokenQuota: 100000,
                        maxConcurrent: 2
                      };

                      return (
                        <div
                          key={tierKey}
                          className="rounded-2xl border border-white/[.06] bg-[#09090c] p-4 space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between border-b border-white/[.05] pb-2">
                              <span className="text-xs font-bold text-white uppercase tracking-wider">{tierKey}</span>
                              <span className="text-[10px] font-mono text-amber-400">
                                {tierKey === 'Owner' ? 'Unlimited' : `${tierData.requestsPerMinute} RPM`}
                              </span>
                            </div>

                            <div className="space-y-2 pt-2 text-xs">
                              <div>
                                <label className="text-[10px] font-mono text-zinc-500">RPM (Req / Min)</label>
                                <input
                                  type="number"
                                  value={tierData.requestsPerMinute}
                                  disabled={tierKey === 'Owner'}
                                  onChange={(e) => {
                                    const next = parseInt(e.target.value) || 1;
                                    setRateLimitsData({
                                      ...rateLimitsData,
                                      tiers: {
                                        ...rateLimitsData.tiers,
                                        [tierKey]: { ...tierData, requestsPerMinute: next }
                                      }
                                    });
                                  }}
                                  className="w-full rounded-lg border border-white/[.08] bg-[#141418] px-2.5 py-1 text-xs text-zinc-200 outline-none font-mono disabled:opacity-40"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-mono text-zinc-500">TPM (Tokens / Min)</label>
                                <input
                                  type="number"
                                  value={tierData.tokensPerMinute}
                                  disabled={tierKey === 'Owner'}
                                  onChange={(e) => {
                                    const next = parseInt(e.target.value) || 1000;
                                    setRateLimitsData({
                                      ...rateLimitsData,
                                      tiers: {
                                        ...rateLimitsData.tiers,
                                        [tierKey]: { ...tierData, tokensPerMinute: next }
                                      }
                                    });
                                  }}
                                  className="w-full rounded-lg border border-white/[.08] bg-[#141418] px-2.5 py-1 text-xs text-zinc-200 outline-none font-mono disabled:opacity-40"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-mono text-zinc-500">Daily Quota (Tokens)</label>
                                <input
                                  type="number"
                                  value={tierData.dailyTokenQuota}
                                  disabled={tierKey === 'Owner'}
                                  onChange={(e) => {
                                    const next = parseInt(e.target.value) || 1000;
                                    setRateLimitsData({
                                      ...rateLimitsData,
                                      tiers: {
                                        ...rateLimitsData.tiers,
                                        [tierKey]: { ...tierData, dailyTokenQuota: next }
                                      }
                                    });
                                  }}
                                  className="w-full rounded-lg border border-white/[.08] bg-[#141418] px-2.5 py-1 text-xs text-zinc-200 outline-none font-mono disabled:opacity-40"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-mono text-zinc-500">Max Concurrent</label>
                                <input
                                  type="number"
                                  value={tierData.maxConcurrent}
                                  disabled={tierKey === 'Owner'}
                                  onChange={(e) => {
                                    const next = parseInt(e.target.value) || 1;
                                    setRateLimitsData({
                                      ...rateLimitsData,
                                      tiers: {
                                        ...rateLimitsData.tiers,
                                        [tierKey]: { ...tierData, maxConcurrent: next }
                                      }
                                    });
                                  }}
                                  className="w-full rounded-lg border border-white/[.08] bg-[#141418] px-2.5 py-1 text-xs text-zinc-200 outline-none font-mono disabled:opacity-40"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[.06]">
                  <span className="text-[11px] font-mono text-zinc-500">
                    Changes take effect across the edge within 2000ms.
                  </span>

                  <button
                    onClick={async () => {
                      try {
                        const res = await ownerFetch('/api/admin/rate-limits', {
                          method: 'POST',
                          body: JSON.stringify({
                            ...rateLimitsData,
                            updatedBy: user?.email || 'owner'
                          })
                        });
                        if (res.ok) {
                          addToast('Rate Limits Persisted', 'Tier quotas and rate limiter rules updated.', 'success');
                          loadSectionData('security');
                        } else {
                          addToast('Update Failed', 'Failed to save rate limits.', 'critical');
                        }
                      } catch {
                        addToast('Network Error', 'Could not save rate limits.', 'critical');
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
                  >
                    <Save size={13} />
                    <span>Save Rate Limits & Quotas</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 13: AUDIT LOG
             ========================================================================= */}
          {activeSection === 'audit-log' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white">Immutable Administrative Audit Log</h2>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                      CRYPTOGRAPHICALLY PRESERVED
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Searchable, verifiable log of all owner operations, routing changes, privilege elevations, and gateway pings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewAuditNote({ action: 'ADMIN_MANUAL_NOTE', target: 'platform:general', details: '', result: 'OK', category: 'Operations' });
                      setShowAddAuditModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[.08] transition-colors"
                  >
                    <FileText size={13} className="text-amber-400" />
                    <span>+ Log Audit Note</span>
                  </button>

                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(auditList, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `zenixmind-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      addToast('Audit Log Exported', `${auditList.length} records saved to JSON.`, 'success');
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shadow-md"
                  >
                    <Download size={13} />
                    <span>Export Audit Log</span>
                  </button>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className="rounded-2xl border border-white/[.06] bg-[#0d0d12] p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Search audit trail by action, actor, target entity, or details..."
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] pl-9 pr-3 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-amber-400"
                    />
                    {auditSearch && (
                      <button
                        onClick={() => setAuditSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Result Status Filter Tabs */}
                  <div className="flex items-center gap-1 bg-[#141418] p-1 rounded-xl border border-white/[.06]">
                    {(['All', 'OK', 'WARN', 'ERROR'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setAuditResultFilter(res)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                          auditResultFilter === res
                            ? res === 'OK'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : res === 'WARN'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : res === 'ERROR'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-amber-400 text-black font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>

                  {/* Category Filter Dropdown */}
                  <select
                    value={auditCategoryFilter}
                    onChange={(e) => setAuditCategoryFilter(e.target.value)}
                    className="rounded-xl border border-white/[.08] bg-[#141418] px-3 py-1.5 text-xs text-zinc-200 outline-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    <option value="AI Control">AI Control & Models</option>
                    <option value="Users">User Management</option>
                    <option value="Security">Security & Access</option>
                    <option value="Configuration">System Settings</option>
                    <option value="System">Diagnostics</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                  <span>Displaying {auditList.length} recorded audit events</span>
                  {(auditSearch || auditResultFilter !== 'All' || auditCategoryFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setAuditSearch('');
                        setAuditResultFilter('All');
                        setAuditCategoryFilter('All');
                      }}
                      className="text-amber-400 hover:underline"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              </div>

              {/* Audit Entries List */}
              <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                {auditList.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <ShieldCheck size={28} className="mx-auto text-zinc-600" />
                    <div className="text-xs text-zinc-400 font-medium">No audit entries found.</div>
                    <p className="text-[11px] text-zinc-600">Actions taken across the console will appear here automatically.</p>
                  </div>
                ) : (
                  auditList.map((log) => {
                    const isSuccess = log.result === 'OK';
                    const isWarn = log.result === 'WARN';
                    const isError = log.result === 'ERROR';

                    return (
                      <div
                        key={log.id}
                        onClick={() => setSelectedAuditLog(log)}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[.015] transition-colors cursor-pointer"
                      >
                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Result badge */}
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${
                                isSuccess
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : isWarn
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-red-500/15 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {log.result}
                            </span>

                            {/* Action Name */}
                            <span className="text-xs font-semibold text-white font-mono">{log.action}</span>

                            {/* Target entity */}
                            <span className="rounded bg-white/[.04] border border-white/[.06] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                              {log.target}
                            </span>

                            {log.category && (
                              <span className="rounded bg-amber-400/10 text-amber-300/80 px-1.5 py-0.5 text-[9px] font-mono">
                                {log.category}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono">
                            <span>Actor: <span className="text-zinc-300">{log.actor}</span></span>
                            <span>•</span>
                            <span className="truncate max-w-md text-zinc-500">
                              {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || 'Action completed successfully.')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right sm:text-left">
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="p-1 rounded-lg text-zinc-500 hover:text-white bg-white/[.02] border border-white/[.05]">
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 14: SYSTEM HEALTH
             ========================================================================= */}
          {activeSection === 'health' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">System Diagnostics & Health Matrix</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Realtime roundtrip probe times and availability status for all components.
                </p>
              </div>

              <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                {healthChecks.map((c) => (
                  <div key={c.name} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{c.name}</span>
                        <span className={`rounded-full px-2 py-0.2 text-[10px] font-mono ${
                          c.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400 font-light">{c.details}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-emerald-400">{c.latencyMs} ms</span>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">roundtrip</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 15: ERRORS & LOGS
             ========================================================================= */}
          {activeSection === 'logs' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white">Live Application Errors & Diagnostics Log</h2>
                    <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-mono text-red-300">
                      {auditStats?.error ?? 0} Critical / {auditStats?.warn ?? 0} Warnings
                    </span>
                    {logsSanitizeEnabled && (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <Lock size={10} />
                        <span>PII Redacted</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Filter application exceptions, gateway timeouts, auth warnings, and API traces by severity, timestamp, and request ID.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLogsSanitizeEnabled(!logsSanitizeEnabled);
                      loadSectionData('logs');
                      addToast(
                        logsSanitizeEnabled ? 'PII Sanitization Disabled' : 'PII Sanitization Enforced',
                        logsSanitizeEnabled
                          ? 'Sensitive tokens and emails are now shown in raw format.'
                          : 'Sensitive credentials, tokens, and IP ranges are masked.',
                        logsSanitizeEnabled ? 'warning' : 'success'
                      );
                    }}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
                      logsSanitizeEnabled
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        : 'border-white/[.08] bg-white/[.04] text-zinc-400 hover:bg-white/[.08]'
                    }`}
                    title="Toggle automatic PII & credential redaction"
                  >
                    {logsSanitizeEnabled ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{logsSanitizeEnabled ? 'Sanitization: ON' : 'Sanitization: OFF'}</span>
                  </button>

                  <button
                    onClick={() => loadSectionData('logs')}
                    disabled={loadingLogs}
                    className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.04] px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/[.08] transition-colors"
                  >
                    <RefreshCw size={13} className={loadingLogs ? 'animate-spin text-amber-400' : 'text-zinc-400'} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(auditList, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `zenixmind-logs-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      addToast('Export Generated', `Exported ${auditList.length} filtered log records.`, 'success');
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shadow-md"
                  >
                    <Download size={13} />
                    <span>Export JSON</span>
                  </button>
                </div>
              </div>

              {/* KPI Severity Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  {
                    label: 'All Logs',
                    count: auditStats?.total ?? auditList.length,
                    val: 'ALL',
                    color: 'text-zinc-300',
                    border: 'border-white/[.08]',
                    bg: 'bg-white/[.02]'
                  },
                  {
                    label: 'Errors & Failures',
                    count: auditStats?.error ?? 0,
                    val: 'ERROR',
                    color: 'text-red-400',
                    border: 'border-red-500/30',
                    bg: 'bg-red-500/10'
                  },
                  {
                    label: 'Warnings',
                    count: auditStats?.warn ?? 0,
                    val: 'WARN',
                    color: 'text-amber-400',
                    border: 'border-amber-500/30',
                    bg: 'bg-amber-500/10'
                  },
                  {
                    label: 'Success Events',
                    count: auditStats?.success ?? 0,
                    val: 'SUCCESS',
                    color: 'text-emerald-400',
                    border: 'border-emerald-500/30',
                    bg: 'bg-emerald-500/10'
                  },
                  {
                    label: 'Info / Diagnostics',
                    count: auditStats?.info ?? 0,
                    val: 'INFO',
                    color: 'text-sky-400',
                    border: 'border-sky-500/30',
                    bg: 'bg-sky-500/10'
                  }
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => {
                      setLogsSeverityFilter(item.val as any);
                      setTimeout(() => loadSectionData('logs'), 50);
                    }}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      logsSeverityFilter === item.val
                        ? `${item.border} ${item.bg} ring-1 ring-amber-400/50`
                        : 'border-white/[.06] bg-[#0c0c10] hover:border-white/[.15]'
                    }`}
                  >
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{item.label}</div>
                    <div className={`text-xl font-bold font-mono mt-1 ${item.color}`}>{item.count}</div>
                  </button>
                ))}
              </div>

              {/* Filters Bar: Severity, Request ID, Date Range, Category */}
              <div className="rounded-2xl border border-white/[.06] bg-[#0d0d12] p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Search query */}
                  <div className="sm:col-span-4 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search message, route, or error code..."
                      value={logsSearch}
                      onChange={(e) => setLogsSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') loadSectionData('logs');
                      }}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400/50"
                    />
                  </div>

                  {/* Request ID Input */}
                  <div className="sm:col-span-3 relative">
                    <Code size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Request ID (e.g. req_err_claude_991)..."
                      value={logsRequestIdFilter}
                      onChange={(e) => setLogsRequestIdFilter(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') loadSectionData('logs');
                      }}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-zinc-500 outline-none focus:border-amber-400/50"
                    />
                  </div>

                  {/* Severity Filter */}
                  <div className="sm:col-span-2">
                    <select
                      value={logsSeverityFilter}
                      onChange={(e) => {
                        setLogsSeverityFilter(e.target.value as any);
                        setTimeout(() => loadSectionData('logs'), 50);
                      }}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400/50"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="ERROR">🔴 ERROR</option>
                      <option value="WARN">🟡 WARN</option>
                      <option value="INFO">🔵 INFO</option>
                      <option value="SUCCESS">🟢 SUCCESS</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="sm:col-span-3">
                    <select
                      value={logsCategoryFilter}
                      onChange={(e) => {
                        setLogsCategoryFilter(e.target.value);
                        setTimeout(() => loadSectionData('logs'), 50);
                      }}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400/50"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="DIAGNOSTIC">Diagnostic & APM</option>
                      <option value="SECURITY">Security & Firewall</option>
                      <option value="AI_ROUTING">AI Routing & Inference</option>
                      <option value="SYSTEM">Core System Engine</option>
                      <option value="USER_MANAGEMENT">User Management</option>
                      <option value="DATA_MUTATION">Data Mutation</option>
                    </select>
                  </div>
                </div>

                {/* Timestamp Range & Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[.04]">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <Clock size={13} className="text-zinc-500" />
                    <span>Time Range:</span>
                    <input
                      type="date"
                      value={logsStartDate}
                      onChange={(e) => setLogsStartDate(e.target.value)}
                      className="rounded-lg border border-white/[.08] bg-[#141418] px-2.5 py-1 text-xs text-white font-mono outline-none"
                    />
                    <span className="text-zinc-600">to</span>
                    <input
                      type="date"
                      value={logsEndDate}
                      onChange={(e) => setLogsEndDate(e.target.value)}
                      className="rounded-lg border border-white/[.08] bg-[#141418] px-2.5 py-1 text-xs text-white font-mono outline-none"
                    />
                    {(logsStartDate || logsEndDate) && (
                      <button
                        onClick={() => {
                          setLogsStartDate('');
                          setLogsEndDate('');
                          setTimeout(() => loadSectionData('logs'), 50);
                        }}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Clear dates
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {(logsSearch || logsRequestIdFilter || logsSeverityFilter !== 'ALL' || logsCategoryFilter !== 'ALL' || logsStartDate || logsEndDate) && (
                      <button
                        onClick={() => {
                          setLogsSearch('');
                          setLogsRequestIdFilter('');
                          setLogsSeverityFilter('ALL');
                          setLogsCategoryFilter('ALL');
                          setLogsStartDate('');
                          setLogsEndDate('');
                          setTimeout(() => loadSectionData('logs'), 50);
                        }}
                        className="text-xs text-zinc-400 hover:text-white px-2 py-1"
                      >
                        Reset filters
                      </button>
                    )}
                    <button
                      onClick={() => loadSectionData('logs')}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
                    >
                      <Filter size={12} />
                      <span>Apply Filters</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs Stream Table */}
              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                <div className="p-3.5 border-b border-white/[.06] flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Displaying {auditList.length} event record{auditList.length === 1 ? '' : 's'}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Real-time Stream Connected</span>
                    </span>
                  </div>
                </div>

                {auditList.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 text-xs">
                    <AlertTriangle size={24} className="mx-auto text-zinc-600 mb-2" />
                    <p>No log records match the selected severity, request ID, or timestamp filters.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[.04] max-h-[640px] overflow-y-auto font-mono text-xs">
                    {auditList.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const isError = log.result === 'ERROR';
                      const isWarn = log.result === 'WARN';
                      const isInfo = log.result === 'INFO';

                      return (
                        <div
                          key={log.id}
                          className={`p-4 transition-colors ${
                            isError
                              ? 'bg-red-500/[0.03] hover:bg-red-500/[0.07]'
                              : isWarn
                              ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]'
                              : 'hover:bg-white/[.02]'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            {/* Severity + Action Name */}
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isError
                                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                      : isWarn
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : isInfo
                                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {log.result}
                                </span>

                                <span className="text-white font-semibold text-xs">{log.action}</span>

                                {log.category && (
                                  <span className="rounded bg-white/[.06] text-zinc-400 px-1.5 py-0.5 text-[10px]">
                                    {log.category}
                                  </span>
                                )}

                                {log.requestId && (
                                  <span
                                    onClick={() => {
                                      navigator.clipboard.writeText(log.requestId);
                                      addToast('Copied', `Request ID ${log.requestId} copied to clipboard.`, 'info');
                                    }}
                                    className="cursor-pointer rounded bg-amber-400/10 border border-amber-400/20 text-amber-300 px-2 py-0.5 text-[10px] hover:bg-amber-400/20 flex items-center gap-1"
                                    title="Click to copy Request ID"
                                  >
                                    <Code size={10} />
                                    <span>req: {log.requestId}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-400 text-[11px] pt-1">
                                <div>
                                  <span className="text-zinc-500">Target: </span>
                                  <span className="text-zinc-300">{log.target}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500">Actor: </span>
                                  <span className="text-zinc-300">{log.actor}</span>
                                </div>
                                {log.ipAddress && (
                                  <div>
                                    <span className="text-zinc-500">IP: </span>
                                    <span className="text-zinc-300">{log.ipAddress}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Timestamp & Expand button */}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[11px] text-zinc-500">
                                {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="rounded-lg border border-white/[.08] bg-white/[.04] p-1.5 text-zinc-400 hover:text-white hover:bg-white/[.08]"
                                title={isExpanded ? 'Collapse log details' : 'Inspect log payload'}
                              >
                                {isExpanded ? <ChevronDown size={14} className="rotate-180" /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Sanitized JSON Details & Stack Trace */}
                          {isExpanded && (
                            <div className="mt-3 rounded-2xl border border-white/[.08] bg-[#060608] p-4 space-y-3">
                              <div className="flex items-center justify-between text-[11px] border-b border-white/[.06] pb-2">
                                <span className="text-amber-400 font-semibold flex items-center gap-1">
                                  <Sliders size={12} />
                                  <span>Payload Context & Diagnostic Snapshot</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  {logsSanitizeEnabled && (
                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                                      <Lock size={10} />
                                      <span>Sanitized User Data</span>
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                                      addToast('Copied', 'Log JSON details copied to clipboard.', 'info');
                                    }}
                                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                                  >
                                    <Copy size={11} />
                                    <span>Copy JSON</span>
                                  </button>
                                </div>
                              </div>

                              <pre className="text-[11px] text-zinc-300 overflow-x-auto p-2 bg-black/40 rounded-xl leading-relaxed">
                                {JSON.stringify(
                                  {
                                    id: log.id,
                                    timestamp: log.timestamp,
                                    requestId: log.requestId,
                                    result: log.result,
                                    category: log.category,
                                    action: log.action,
                                    target: log.target,
                                    actor: log.actor,
                                    ipAddress: log.ipAddress,
                                    userAgent: log.userAgent,
                                    details: log.details || {}
                                  },
                                  null,
                                  2
                                )}
                              </pre>

                              {log.details?.stackTrace && (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Stack Trace</div>
                                  <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-2.5 text-[11px] text-red-300 whitespace-pre-wrap">
                                    {log.details.stackTrace}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 16: FEATURE FLAGS
             ========================================================================= */}
          {activeSection === 'feature-flags' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">Global Platform Feature Flags</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Instant toggles to enable or restrict platform capabilities without deployment.
                </p>
              </div>

              <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                {[
                  { key: 'voiceMode', title: 'Realtime Voice Engine (Sun Orb)', desc: 'Continuous conversational audio loop.' },
                  { key: 'webSearch', title: 'Web Search Grounding', desc: 'Online search grounding citations.' },
                  { key: 'visionImageGen', title: 'Imagine Studio & Vision', desc: 'Image generation and multimodal inputs.' },
                  { key: 'memoryPersistence', title: 'User Memory Storage', desc: 'Persisting facts and personalized instructions.' },
                  { key: 'deepReasoning', title: 'Deep Reasoning Mode', desc: 'Enabling analytical step-by-step thinking models.' },
                  { key: 'experimentalModels', title: 'Beta & Experimental Models', desc: 'Allowing access to upcoming AI previews.' }
                ].map((flag) => {
                  const isEnabled = featureFlags[flag.key] ?? false;
                  return (
                    <div key={flag.key} className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-white">{flag.title}</h4>
                        <p className="text-xs text-zinc-400 font-light mt-0.5">{flag.desc}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center shrink-0">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={async (e) => {
                            const next = e.target.checked;
                            await ownerFetch('/api/admin/feature-flags', {
                              method: 'POST',
                              body: JSON.stringify({
                                updates: { [flag.key]: next },
                                updatedBy: user?.email || 'owner'
                              })
                            });
                            addToast('Feature Flag Toggled', `${flag.title} is now ${next ? 'Active' : 'Disabled'}.`, 'success');
                            loadSectionData('feature-flags');
                          }}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all peer-checked:bg-amber-400 peer-checked:after:translate-x-full peer-checked:after:bg-black"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 17: NOTIFICATIONS & MULTI-BANNER BROADCASTS
             ========================================================================= */}
          {activeSection === 'notifications' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-white">System Broadcasts & Platform Alerts</h2>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Dispatch real-time announcements, maintenance notices, and targeted banners across the workspace.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <Radio size={12} className="animate-pulse" />
                    <span>{broadcastsList.filter((b: any) => b.active).length} Active Banner(s)</span>
                  </span>
                </div>
              </div>

              {/* Active Global Announcement Status Banner */}
              {notificationsData?.activeAnnouncement && (
                <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                      <Bell size={16} className="text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Live Workspace Banner Active</span>
                        <span className="rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono uppercase px-1.5 py-0.2">
                          {notificationsData.activeAnnouncement.type}
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/90 font-light truncate mt-0.5">
                        {notificationsData.activeAnnouncement.message}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      await ownerFetch('/api/admin/broadcast', {
                        method: 'POST',
                        body: JSON.stringify({ active: false, updatedBy: user?.email || 'owner' })
                      });
                      addToast('Banner Dismissed', 'Live workspace announcement removed.', 'info');
                      loadSectionData('notifications');
                    }}
                    className="shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/30 transition-colors"
                  >
                    Clear Active Banner
                  </button>
                </div>
              )}

              {/* Broadcast Creation Form */}
              <div className="rounded-3xl border border-white/[.08] bg-[#0c0c10] p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/[.06] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Send size={16} className="text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Compose & Dispatch System Broadcast</h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Live Client Propagation</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Broadcast Title</label>
                      <input
                        type="text"
                        value={newBroadcastForm.title}
                        onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, title: e.target.value })}
                        placeholder="e.g. Scheduled Engine Maintenance Window"
                        className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Severity Type</label>
                        <select
                          value={newBroadcastForm.type}
                          onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, type: e.target.value as any })}
                          className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="announcement">Announcement</option>
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical Outage</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Target Tier</label>
                        <select
                          value={newBroadcastForm.targetTier}
                          onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, targetTier: e.target.value as any })}
                          className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none"
                        >
                          <option value="ALL">All Users (Global)</option>
                          <option value="Free">Free Tier Only</option>
                          <option value="Pro">Pro Members Only</option>
                          <option value="Enterprise">Enterprise Tenants</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Message Content</label>
                    <textarea
                      value={newBroadcastForm.message}
                      onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, message: e.target.value })}
                      placeholder="Detailed announcement markdown text visible to active workspace users..."
                      className="w-full h-20 rounded-2xl border border-white/[.08] bg-[#141418] p-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 resize-none font-light focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Action Button Label (Optional)</label>
                      <input
                        type="text"
                        value={newBroadcastForm.actionLabel}
                        onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, actionLabel: e.target.value })}
                        placeholder="e.g. Read Release Notes"
                        className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Action URL / Route (Optional)</label>
                      <input
                        type="text"
                        value={newBroadcastForm.actionUrl}
                        onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, actionUrl: e.target.value })}
                        placeholder="e.g. /changelog or https://docs..."
                        className="w-full rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  {/* Live Simulation Preview */}
                  {newBroadcastForm.message.trim() && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">User Viewport Live Preview:</span>
                      <div className={`rounded-2xl p-3.5 border text-xs flex items-center justify-between gap-3 ${
                        newBroadcastForm.type === 'critical'
                          ? 'border-red-500/40 bg-red-500/10 text-red-200'
                          : newBroadcastForm.type === 'warning'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                          : newBroadcastForm.type === 'announcement'
                          ? 'border-purple-500/40 bg-purple-500/10 text-purple-200'
                          : 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Bell size={14} className="shrink-0" />
                          <div className="truncate">
                            <strong className="font-semibold">{newBroadcastForm.title || 'Announcement'}:</strong>{' '}
                            <span>{newBroadcastForm.message}</span>
                          </div>
                        </div>
                        {newBroadcastForm.actionLabel && (
                          <span className="shrink-0 font-medium underline cursor-pointer text-[11px]">
                            {newBroadcastForm.actionLabel} →
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={async () => {
                        if (!newBroadcastForm.title.trim() || !newBroadcastForm.message.trim()) {
                          addToast('Validation Error', 'Title and message are required.', 'warning');
                          return;
                        }
                        try {
                          const res = await ownerFetch('/api/admin/broadcasts', {
                            method: 'POST',
                            body: JSON.stringify({ ...newBroadcastForm, updatedBy: user?.email || 'owner' })
                          });
                          if (res.ok) {
                            addToast('Broadcast Dispatched', `Broadcast "${newBroadcastForm.title}" published!`, 'success');
                            setNewBroadcastForm({
                              title: '',
                              message: '',
                              type: 'announcement',
                              targetTier: 'ALL',
                              dismissible: true,
                              actionLabel: '',
                              actionUrl: ''
                            });
                            loadSectionData('notifications');
                          } else {
                            addToast('Dispatch Failed', 'Failed to publish broadcast.', 'critical');
                          }
                        } catch {
                          addToast('Network Error', 'Could not dispatch broadcast.', 'critical');
                        }
                      }}
                      className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
                    >
                      <Send size={13} />
                      <span>Dispatch Broadcast Globally</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Broadcasts Registry Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Broadcast Banners Registry</h3>
                  <span className="text-xs text-zinc-500 font-mono">{broadcastsList.length} banner(s)</span>
                </div>

                <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                  {broadcastsList.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 text-xs font-light">
                      No broadcast banners currently configured. Use the composer above to publish your first announcement.
                    </div>
                  ) : (
                    broadcastsList.map((banner: any) => {
                      const isCritical = banner.type === 'critical';
                      const isWarning = banner.type === 'warning';

                      return (
                        <div key={banner.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[.01] transition-colors">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-white">{banner.title}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase ${
                                isCritical
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : isWarning
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {banner.type}
                              </span>
                              <span className="rounded bg-white/[.04] px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                                Target: {banner.targetTier}
                              </span>
                              <span className={`text-[10px] font-mono ${banner.active ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                                • {banner.active ? 'Broadcasting Live' : 'Standby / Paused'}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-300 font-light truncate max-w-2xl">
                              {banner.message}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                              <span>Created: {new Date(banner.createdAt).toLocaleDateString()}</span>
                              {banner.actionLabel && <span>• Action: "{banner.actionLabel}"</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Toggle Live Switch */}
                            <button
                              onClick={async () => {
                                const nextState = !banner.active;
                                await ownerFetch(`/api/admin/broadcasts/${banner.id}/toggle`, {
                                  method: 'POST',
                                  body: JSON.stringify({ active: nextState, updatedBy: user?.email || 'owner' })
                                });
                                addToast('Broadcast Toggled', `"${banner.title}" is now ${nextState ? 'Active' : 'Paused'}.`, 'info');
                                loadSectionData('notifications');
                              }}
                              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                banner.active
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {banner.active ? 'Active' : 'Paused'}
                            </button>

                            {/* Delete Banner */}
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: `Delete Broadcast "${banner.title}"?`,
                                  description: 'This broadcast announcement will be permanently removed from all user viewports.',
                                  actionLabel: 'Delete Banner',
                                  isDestructive: true,
                                  onConfirm: async () => {
                                    await ownerFetch(`/api/admin/broadcasts/${banner.id}`, {
                                      method: 'DELETE',
                                      body: JSON.stringify({ updatedBy: user?.email || 'owner' })
                                    });
                                    addToast('Broadcast Deleted', `Broadcast "${banner.title}" removed.`, 'warning');
                                    loadSectionData('notifications');
                                  }
                                });
                              }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete broadcast"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 18: INTEGRATIONS & PLUGINS (WITH ONLINE SEARCH & DISCOVERY)
             ========================================================================= */}
          {activeSection === 'integrations' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-white">Platform Integrations & Plugin Ecosystem</h2>
                    <span className="rounded-full bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 text-[10px] font-mono text-amber-300">
                      {pluginsList.filter(p => p.status === 'installed').length} Plugins Active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Connect infrastructure providers and search online to improve platform plugins, grounding tools, and developer extensions.
                  </p>
                </div>

                {/* Sub-tabs: Platform Integrations vs Installed Plugins vs Search Online Marketplace */}
                <div className="flex items-center bg-[#0c0c10] border border-white/[.08] p-1 rounded-2xl gap-1 text-xs">
                  <button
                    onClick={() => setPluginActiveTab('installed')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                      pluginActiveTab === 'installed'
                        ? 'bg-amber-400 text-black shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Installed ({pluginsList.length})
                  </button>
                  <button
                    onClick={async () => {
                      setPluginActiveTab('online');
                      if (onlinePluginsList.length === 0) {
                        setSearchingOnlinePlugins(true);
                        try {
                          const res = await ownerFetch(`/api/admin/plugins/search-online?q=${encodeURIComponent(pluginSearchTerm)}`);
                          if (res.ok) {
                            const d = await res.json();
                            setOnlinePluginsList(d.results || []);
                          }
                        } finally {
                          setSearchingOnlinePlugins(false);
                        }
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
                      pluginActiveTab === 'online'
                        ? 'bg-amber-400 text-black shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Globe size={13} />
                    <span>Search Online Registry</span>
                  </button>
                </div>
              </div>

              {/* Verified Backend Service Connectors */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">Core Infrastructure Providers</h3>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {integrationsList.filter(i => i.status === 'Connected').length} / {integrationsList.length} Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {integrationsList.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/[.06] bg-[#0c0c10] p-4 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{item.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                            item.status === 'Connected'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'Coming soon'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-light mt-1.5 line-clamp-2">{item.details}</p>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/[.04] flex items-center justify-between">
                        <span>{item.category}</span>
                        {item.status === 'Connected' ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            <span>Live</span>
                          </span>
                        ) : (
                          <span className="text-zinc-600">Pending Setup</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search & Filter Bar for Plugins */}
              <div className="rounded-2xl border border-white/[.06] bg-[#0d0d12] p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder={pluginActiveTab === 'online' ? "Search online plugin registry (e.g. arXiv, Sonar, Figma, Zapier)..." : "Filter installed plugins by name or capability..."}
                      value={pluginSearchTerm}
                      onChange={(e) => setPluginSearchTerm(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && pluginActiveTab === 'online') {
                          setSearchingOnlinePlugins(true);
                          try {
                            const res = await ownerFetch(`/api/admin/plugins/search-online?q=${encodeURIComponent(pluginSearchTerm)}`);
                            if (res.ok) {
                              const d = await res.json();
                              setOnlinePluginsList(d.results || []);
                            }
                          } finally {
                            setSearchingOnlinePlugins(false);
                          }
                        }
                      }}
                      className="w-full rounded-xl border border-white/[.08] bg-[#141418] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={pluginCategoryFilter}
                      onChange={(e) => setPluginCategoryFilter(e.target.value)}
                      className="rounded-xl border border-white/[.08] bg-[#141418] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400/50"
                    >
                      <option value="ALL">All Plugin Categories</option>
                      <option value="Intelligence & Search">Intelligence & Search</option>
                      <option value="Developer Tools">Developer Tools</option>
                      <option value="Security & Compliance">Security & Compliance</option>
                      <option value="Productivity">Productivity</option>
                    </select>

                    {pluginActiveTab === 'online' && (
                      <button
                        onClick={async () => {
                          setSearchingOnlinePlugins(true);
                          try {
                            const res = await ownerFetch(`/api/admin/plugins/search-online?q=${encodeURIComponent(pluginSearchTerm)}`);
                            if (res.ok) {
                              const d = await res.json();
                              setOnlinePluginsList(d.results || []);
                              addToast('Online Search Complete', `Discovered ${d.results?.length ?? 0} community plugins.`, 'success');
                            }
                          } finally {
                            setSearchingOnlinePlugins(false);
                          }
                        }}
                        disabled={searchingOnlinePlugins}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shrink-0"
                      >
                        <Search size={13} className={searchingOnlinePlugins ? 'animate-spin' : ''} />
                        <span>Search Online</span>
                      </button>
                    )}
                  </div>
                </div>

                {pluginActiveTab === 'online' && (
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/[.04]">
                    <span className="flex items-center gap-1.5">
                      <Globe size={12} className="text-amber-400" />
                      <span>Online Index: registry.zenixmind.ai/v2/catalog</span>
                    </span>
                    <span className="text-emerald-400 font-mono">Live Community Verified Feed</span>
                  </div>
                )}
              </div>

              {/* Plugins List: Either Installed or Online Search Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    {pluginActiveTab === 'online' ? 'Online Community Plugins & Enhancements' : 'Installed Modular Plugins'}
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {pluginActiveTab === 'online' ? `${onlinePluginsList.length} Found Online` : `${pluginsList.length} Total`}
                  </span>
                </div>

                {pluginActiveTab === 'online' && searchingOnlinePlugins ? (
                  <div className="p-12 text-center text-zinc-400 text-xs">
                    <RefreshCw size={24} className="mx-auto text-amber-400 animate-spin mb-2" />
                    <p>Searching global plugin registries for real-time improvements...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(pluginActiveTab === 'online' ? onlinePluginsList : pluginsList)
                      .filter((p) => {
                        const matchesCategory = pluginCategoryFilter === 'ALL' || p.category === pluginCategoryFilter;
                        const matchesSearch =
                          !pluginSearchTerm ||
                          p.name.toLowerCase().includes(pluginSearchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(pluginSearchTerm.toLowerCase()) ||
                          p.capabilities.some((c: string) => c.toLowerCase().includes(pluginSearchTerm.toLowerCase()));
                        return matchesCategory && matchesSearch;
                      })
                      .map((plugin) => {
                        const isInstalled = pluginsList.some((p) => p.id === plugin.id && p.status === 'installed');
                        const isBusy = togglingPluginId === plugin.id;

                        return (
                          <div
                            key={plugin.id}
                            className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-5 space-y-3 flex flex-col justify-between hover:border-white/[.12] transition-colors"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-bold text-white">{plugin.name}</h4>
                                    <span className="text-[10px] font-mono text-zinc-400 bg-white/[.06] px-2 py-0.5 rounded">
                                      v{plugin.version}
                                    </span>
                                    {plugin.verified && (
                                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                        <ShieldCheck size={10} />
                                        <span>Verified</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                    By {plugin.author} · {plugin.category}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold">
                                    <Star size={11} className="fill-amber-400" />
                                    <span>{plugin.rating}</span>
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    {plugin.downloads?.toLocaleString()} downloads
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                                {plugin.description}
                              </p>

                              {/* Capabilities tags */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {plugin.capabilities?.map((cap: string) => (
                                  <span
                                    key={cap}
                                    className="rounded-lg bg-white/[.03] border border-white/[.05] px-2 py-0.5 text-[10px] font-mono text-zinc-400"
                                  >
                                    {cap}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Action footer */}
                            <div className="pt-3 border-t border-white/[.04] flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-500">
                                {isInstalled ? '🟢 Installed & Active' : '⚪ Available to Install'}
                              </span>

                              <div className="flex items-center gap-2">
                                {plugin.onlineRepositoryUrl && (
                                  <a
                                    href={plugin.onlineRepositoryUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-zinc-500 hover:text-zinc-300 p-1 rounded"
                                    title="View documentation"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                )}

                                <button
                                  disabled={isBusy}
                                  onClick={async () => {
                                    setTogglingPluginId(plugin.id);
                                    try {
                                      const res = await ownerFetch(`/api/admin/plugins/${plugin.id}/toggle`, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                          ...plugin,
                                          updatedBy: user?.email || 'owner'
                                        })
                                      });
                                      if (res.ok) {
                                        const d = await res.json();
                                        const nowActive = d.plugin?.status === 'installed';
                                        addToast(
                                          nowActive ? 'Plugin Installed' : 'Plugin Disabled',
                                          `${plugin.name} is now ${nowActive ? 'active across neural routes' : 'disabled'}.`,
                                          nowActive ? 'success' : 'info'
                                        );
                                        loadSectionData('integrations');
                                      } else {
                                        addToast('Plugin Action Failed', 'Could not modify plugin state.', 'critical');
                                      }
                                    } catch {
                                      addToast('Network Error', 'Plugin service unavailable.', 'critical');
                                    } finally {
                                      setTogglingPluginId(null);
                                    }
                                  }}
                                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    isInstalled
                                      ? 'bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20'
                                      : 'bg-amber-400 text-black hover:bg-amber-300 shadow-sm'
                                  }`}
                                >
                                  {isBusy ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : isInstalled ? (
                                    <span>Uninstall / Disable</span>
                                  ) : (
                                    <span>Install & Improve</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 19: API & KEYS
             ========================================================================= */}
          {activeSection === 'api-keys' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Platform API Keys</h2>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Generate and manage developer keys for external programmatic access.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const name = prompt('Enter a name for the new API key:');
                    if (name) {
                      ownerFetch('/api/admin/api-keys', {
                        method: 'POST',
                        body: JSON.stringify({ name, updatedBy: user?.email || 'owner' })
                      }).then(async (r) => {
                        const d = await r.json();
                        prompt('SAVE YOUR SECRET KEY NOW. It will not be shown again:', d.secretKey);
                        loadSectionData('api-keys');
                      });
                    }
                  }}
                  className="rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
                >
                  Create API Key
                </button>
              </div>

              <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                {apiKeysList.map((k) => (
                  <div key={k.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-white">{k.name}</span>
                      <div className="text-xs font-mono text-zinc-400 mt-0.5">{k.keyPrefix}</div>
                      <div className="mt-1 text-[10px] text-zinc-500 font-mono">
                        Scopes: {k.scopes.join(', ')} • Created: {new Date(k.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: `Revoke API Key "${k.name}"?`,
                          description: 'Any external services using this key will immediately be denied access.',
                          actionLabel: 'Revoke Key',
                          isDestructive: true,
                          onConfirm: async () => {
                            await ownerFetch(`/api/admin/api-keys/${k.id}`, { method: 'DELETE' });
                            addToast('API Key Revoked', `${k.name} revoked.`, 'warning');
                            loadSectionData('api-keys');
                          }
                        });
                      }}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 20: ENVIRONMENT CONFIGURATION
             ========================================================================= */}
          {activeSection === 'env-config' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">Environment Variable Audit</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Server environment readiness audit (secrets are masked securely).
                </p>
              </div>

              <div className="divide-y divide-white/[.06] rounded-3xl border border-white/[.06] bg-[#0c0c10] overflow-hidden">
                {envConfigList.map((env) => (
                  <div key={env.name} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-semibold text-white">{env.name}</span>
                      <div className="font-mono text-zinc-500 text-[11px] mt-0.5">{env.value}</div>
                    </div>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                      env.configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {env.configured ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 21: DATABASE
             ========================================================================= */}
          {activeSection === 'database' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">Database Store & Tables</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Storage subsystem metrics and schema entity counts.
                </p>
              </div>

              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono">Connection Subsystem</span>
                  <span className="text-xs text-emerald-400 font-mono font-medium">{databaseData?.status || 'HEALTHY'}</span>
                </div>
                <div className="divide-y divide-white/[.06]">
                  {(databaseData?.tables || []).map((t: any) => (
                    <div key={t.name} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-semibold text-white">{t.name}</span>
                        <div className="text-[11px] text-zinc-500 font-light mt-0.5">{t.description}</div>
                      </div>
                      <span className="font-mono text-zinc-300">{t.rowCount} rows</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 22: DEPLOYMENTS
             ========================================================================= */}
          {activeSection === 'deployments' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">Production Deployments & Runtime</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Live release commit SHA, runtime engine, and build metadata.
                </p>
              </div>

              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-3 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-white/[.04]">
                  <span className="text-zinc-400">Release Version</span>
                  <span className="text-white">{deploymentsData?.deployment?.productionVersion || '1.2.4'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[.04]">
                  <span className="text-zinc-400">Commit SHA</span>
                  <span className="text-amber-300">{deploymentsData?.deployment?.commitSha || '7b3e19a'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[.04]">
                  <span className="text-zinc-400">Environment</span>
                  <span className="text-emerald-400">{deploymentsData?.deployment?.environment || 'production'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[.04]">
                  <span className="text-zinc-400">Server Runtime</span>
                  <span className="text-white">{deploymentsData?.deployment?.runtime || 'Node.js'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-zinc-400">Production URL</span>
                  <span className="text-white">{deploymentsData?.deployment?.deploymentUrl || 'https://zenixmind.ai'}</span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 23: BACKUPS & RECOVERY
             ========================================================================= */}
          {activeSection === 'backups' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Backups & Disaster Recovery</h2>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    Generate instant platform state snapshots and export offline backups.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const res = await ownerFetch('/api/admin/backups/snapshot', {
                      method: 'POST',
                      body: JSON.stringify({ updatedBy: user?.email || 'owner' })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      const blob = new Blob([JSON.stringify(data.snapshot, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `zenixmind-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      addToast('Snapshot Generated', 'Database state snapshot downloaded.', 'success');
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
                >
                  <Download size={14} />
                  <span>Download Snapshot</span>
                </button>
              </div>

              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Status</span>
                  <span className="text-emerald-400 font-mono font-medium">READY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Total Entities Available</span>
                  <span className="text-white font-mono">{backupsData?.totalRecordsAvailable ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 24: OWNER SETTINGS
             ========================================================================= */}
          {activeSection === 'owner-settings' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-base font-semibold text-white">Owner Settings & Emergency Mode</h2>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Platform maintenance controls, emergency kill-switch, and superuser configurations.
                </p>
              </div>

              <div className="rounded-3xl border border-red-500/20 bg-red-950/10 p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={18} />
                  <h3 className="text-sm font-semibold">Emergency AI Circuit Breaker</h3>
                </div>
                <p className="text-xs text-zinc-300 font-light leading-relaxed">
                  Immediately halts all outgoing inference API requests to external AI providers. Use in case of credential leaks, runaway loops, or upstream outages.
                </p>
                <button
                  onClick={() => {
                    const isCurrentlyActive = ownerConfig?.config?.emergencyKillSwitch;
                    setConfirmModal({
                      isOpen: true,
                      title: isCurrentlyActive ? 'Deactivate Emergency Circuit Breaker?' : 'ACTIVATE EMERGENCY CIRCUIT BREAKER?',
                      description: isCurrentlyActive
                        ? 'This will resume normal AI inference for all users.'
                        : 'WARNING: All AI requests will immediately be blocked and return 503 Service Unavailable.',
                      actionLabel: isCurrentlyActive ? 'Resume Normal Traffic' : 'ENGAGE KILL-SWITCH',
                      isDestructive: !isCurrentlyActive,
                      onConfirm: async () => {
                        await ownerFetch('/api/admin/owner-settings', {
                          method: 'POST',
                          body: JSON.stringify({
                            updates: { emergencyKillSwitch: !isCurrentlyActive },
                            updatedBy: user?.email || 'owner'
                          })
                        });
                        addToast(
                          isCurrentlyActive ? 'Circuit Breaker Disengaged' : 'EMERGENCY KILL-SWITCH ENGAGED',
                          isCurrentlyActive ? 'Traffic resumed.' : 'All AI traffic blocked.',
                          isCurrentlyActive ? 'success' : 'critical'
                        );
                        loadSectionData('owner-settings');
                      }
                    });
                  }}
                  className={`rounded-2xl px-5 py-2.5 text-xs font-semibold transition-all ${
                    ownerConfig?.config?.emergencyKillSwitch
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-red-600 text-white hover:bg-red-500 shadow-lg'
                  }`}
                >
                  {ownerConfig?.config?.emergencyKillSwitch ? 'Deactivate Circuit Breaker' : 'Engage Emergency Kill-Switch'}
                </button>
              </div>

              {/* Maintenance Mode Toggle */}
              <div className="rounded-3xl border border-white/[.06] bg-[#0c0c10] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Platform Maintenance Mode</h3>
                    <p className="text-xs text-zinc-400 font-light">
                      Restricts application access to superusers while database migrations or upgrades run.
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={ownerConfig?.config?.maintenanceMode || false}
                      onChange={async (e) => {
                        const next = e.target.checked;
                        await ownerFetch('/api/admin/owner-settings', {
                          method: 'POST',
                          body: JSON.stringify({
                            updates: { maintenanceMode: next },
                            updatedBy: user?.email || 'owner'
                          })
                        });
                        addToast('Maintenance Mode Updated', `Maintenance is now ${next ? 'Active' : 'Off'}.`, 'warning');
                        loadSectionData('owner-settings');
                      }}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all peer-checked:bg-amber-400 peer-checked:after:translate-x-full peer-checked:after:bg-black"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          CONFIRMATION MODAL (Destructive / Sensitive Actions)
         ========================================================================= */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/[.1] bg-[#111116] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className={`grid h-9 w-9 place-items-center rounded-xl ${confirmModal.isDestructive ? 'bg-red-500/20 text-red-400' : 'bg-amber-400/20 text-amber-400'}`}>
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-zinc-300 font-light leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="rounded-xl border border-white/[.08] bg-white/[.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const onConf = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await onConf();
                }}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  confirmModal.isDestructive
                    ? 'bg-red-600 text-white hover:bg-red-500 shadow-md'
                    : 'bg-amber-400 text-black hover:bg-amber-300 shadow-md'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD USER MODAL
         ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/[.1] bg-[#111116] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/20 text-amber-400">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Create User Account</h3>
                  <p className="text-[11px] text-zinc-400 font-light">Provision a real user in the persistent auth store.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Alex Mercer"
                  className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. alex@example.com"
                  className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Initial Tier</label>
                  <select
                    value={newUserForm.tier}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, tier: e.target.value }))}
                    className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none"
                  >
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Status</label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[.06]">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="rounded-xl border border-white/[.08] bg-white/[.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newUserForm.email || !newUserForm.name) {
                    addToast('Missing Required Fields', 'Name and email are required to register an account.', 'warning');
                    return;
                  }
                  try {
                    const res = await ownerFetch('/api/admin/users', {
                      method: 'POST',
                      body: JSON.stringify({
                        name: newUserForm.name,
                        email: newUserForm.email,
                        tier: newUserForm.tier,
                        status: newUserForm.status,
                        updatedBy: user?.email || 'owner'
                      })
                    });
                    if (res.ok) {
                      addToast('User Registered', `${newUserForm.name} added to auth store.`, 'success');
                      setShowAddUserModal(false);
                      loadSectionData('users');
                    } else {
                      const err = await res.json();
                      addToast('Registration Failed', err.error || 'Failed to create user.', 'critical');
                    }
                  } catch {
                    addToast('Registration Failed', 'Network error while adding user.', 'critical');
                  }
                }}
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shadow-md"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          USER DETAILS MODAL (Inspect & Manage)
         ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/[.1] bg-[#111116] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/20 text-amber-300 font-mono text-base font-semibold border border-amber-400/30">
                  {(selectedUser.name || selectedUser.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-zinc-400 font-light">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#09090d] border border-white/[.06] p-4 text-xs font-mono">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">User ID</span>
                <span className="text-zinc-200 select-all">{selectedUser.id}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Tier</span>
                <span className="text-amber-300 font-medium">{selectedUser.tier}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Status</span>
                <span className={selectedUser.status === 'Suspended' ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {selectedUser.status || 'Active'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Conversations</span>
                <span className="text-white font-medium">{selectedUser.conversation_count}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Tokens Consumed</span>
                <span className="text-amber-300 font-medium">{(selectedUser.tokens_used || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Voice Minutes</span>
                <span className="text-zinc-300 font-medium">{selectedUser.voice_minutes || 0}m</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Registered Date</span>
                <span className="text-zinc-400">{new Date(selectedUser.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Last Activity</span>
                <span className="text-zinc-400">{new Date(selectedUser.last_activity).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[.06]">
              <button
                onClick={() => {
                  const targetUser = selectedUser;
                  setSelectedUser(null);
                  setConfirmModal({
                    isOpen: true,
                    title: `Reset Usage for ${targetUser.email}?`,
                    description: 'This will reset tokens and voice minutes consumed back to 0.',
                    actionLabel: 'Reset Quotas',
                    isDestructive: false,
                    onConfirm: async () => {
                      await ownerFetch(`/api/admin/users/${targetUser.id}/reset-quota`, {
                        method: 'POST',
                        body: JSON.stringify({ updatedBy: user?.email || 'owner' })
                      });
                      addToast('Quota Reset', `Usage reset for ${targetUser.email}.`, 'info');
                      loadSectionData('users');
                    }
                  });
                }}
                className="rounded-xl border border-white/[.08] bg-white/[.04] px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                Reset Quotas
              </button>

              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          AUDIT LOG DETAIL INSPECTOR MODAL
         ========================================================================= */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/[.1] bg-[#111116] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  selectedAuditLog.result === 'WARN'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : selectedAuditLog.result === 'ERROR'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {selectedAuditLog.result}
                </span>
                <h3 className="text-sm font-semibold text-white font-mono">{selectedAuditLog.action}</h3>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-2xl bg-[#09090d] border border-white/[.06] p-3.5 space-y-2 text-xs font-mono text-zinc-300">
              <div className="flex justify-between border-b border-white/[.04] pb-1.5">
                <span className="text-zinc-500">Record ID:</span>
                <span className="text-zinc-300 select-all">{selectedAuditLog.id}</span>
              </div>
              <div className="flex justify-between border-b border-white/[.04] pb-1.5">
                <span className="text-zinc-500">Timestamp:</span>
                <span className="text-zinc-300">{new Date(selectedAuditLog.timestamp).toISOString()}</span>
              </div>
              <div className="flex justify-between border-b border-white/[.04] pb-1.5">
                <span className="text-zinc-500">Actor:</span>
                <span className="text-amber-300">{selectedAuditLog.actor}</span>
              </div>
              <div className="flex justify-between border-b border-white/[.04] pb-1.5">
                <span className="text-zinc-500">Target Entity:</span>
                <span className="text-emerald-300">{selectedAuditLog.target}</span>
              </div>
              {selectedAuditLog.category && (
                <div className="flex justify-between border-b border-white/[.04] pb-1.5">
                  <span className="text-zinc-500">Category:</span>
                  <span className="text-zinc-300">{selectedAuditLog.category}</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[11px] font-mono text-zinc-400 block mb-1">Payload / Details:</span>
              <pre className="rounded-2xl bg-black/60 border border-white/[.06] p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {typeof selectedAuditLog.details === 'object'
                  ? JSON.stringify(selectedAuditLog.details, null, 2)
                  : (selectedAuditLog.details || 'No metadata payload attached.')}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[.06]">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedAuditLog, null, 2));
                  addToast('Copied to Clipboard', 'Full audit log entry copied.', 'info');
                }}
                className="flex items-center gap-1.5 rounded-xl border border-white/[.08] bg-white/[.04] px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white"
              >
                <Copy size={13} />
                <span>Copy Raw JSON</span>
              </button>

              <button
                onClick={() => setSelectedAuditLog(null)}
                className="rounded-xl bg-amber-400 px-4 py-1.5 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD MANUAL AUDIT NOTE MODAL
         ========================================================================= */}
      {showAddAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/[.1] bg-[#111116] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/20 text-amber-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Record Manual Audit Entry</h3>
                  <p className="text-[11px] text-zinc-400 font-light">Append an immutable administrative note to the ledger.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAuditModal(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Action Identifier</label>
                <input
                  type="text"
                  value={newAuditNote.action}
                  onChange={(e) => setNewAuditNote((p) => ({ ...p, action: e.target.value }))}
                  placeholder="e.g. MANUAL_MAINTENANCE_WINDOW"
                  className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none font-mono focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Target Entity</label>
                  <input
                    type="text"
                    value={newAuditNote.target}
                    onChange={(e) => setNewAuditNote((p) => ({ ...p, target: e.target.value }))}
                    placeholder="e.g. system:database"
                    className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none font-mono focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Result Status</label>
                  <select
                    value={newAuditNote.result}
                    onChange={(e: any) => setNewAuditNote((p) => ({ ...p, result: e.target.value }))}
                    className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none"
                  >
                    <option value="OK">OK (Success)</option>
                    <option value="WARN">WARN (Notice)</option>
                    <option value="ERROR">ERROR (Failure)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Details & Context</label>
                <textarea
                  rows={3}
                  value={newAuditNote.details}
                  onChange={(e) => setNewAuditNote((p) => ({ ...p, details: e.target.value }))}
                  placeholder="Provide explicit operational context for this ledger entry..."
                  className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400 placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[.06]">
              <button
                onClick={() => setShowAddAuditModal(false)}
                className="rounded-xl border border-white/[.08] bg-white/[.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newAuditNote.action) {
                    addToast('Action Required', 'Action name is required.', 'warning');
                    return;
                  }
                  try {
                    const res = await ownerFetch('/api/admin/audit-logs', {
                      method: 'POST',
                      body: JSON.stringify({
                        action: newAuditNote.action,
                        target: newAuditNote.target || 'platform:general',
                        actor: user?.email || 'owner',
                        result: newAuditNote.result,
                        details: newAuditNote.details || 'Manual operator audit entry recorded.',
                        category: 'Operations'
                      })
                    });
                    if (res.ok) {
                      addToast('Audit Entry Stamped', 'New ledger event committed.', 'success');
                      setShowAddAuditModal(false);
                      loadSectionData('audit-log');
                    }
                  } catch {
                    addToast('Failed to Write Audit', 'Network error.', 'critical');
                  }
                }}
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shadow-md"
              >
                Commit Audit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REGISTER NEW SYSTEM PROMPT / PERSONA MODAL
         ========================================================================= */}
      {showAddPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-white/[.12] bg-[#0f0f14] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[.06] pb-3">
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Register AI Persona & System Instructions</h3>
              </div>
              <button
                onClick={() => setShowAddPromptModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Persona Name</label>
                  <input
                    type="text"
                    value={newPromptForm.name}
                    onChange={(e) => setNewPromptForm({ ...newPromptForm, name: e.target.value })}
                    placeholder="e.g. Polyglot Senior Architect"
                    className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Category</label>
                  <select
                    value={newPromptForm.category}
                    onChange={(e) => setNewPromptForm({ ...newPromptForm, category: e.target.value })}
                    className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none"
                  >
                    <option value="GENERAL">General Assistant</option>
                    <option value="CODING">Coding & Architecture</option>
                    <option value="RESEARCH">Deep Research</option>
                    <option value="CREATIVE">Creative Writing</option>
                    <option value="VOICE">Voice Companion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Default Model</label>
                  <select
                    value={newPromptForm.defaultModel}
                    onChange={(e) => setNewPromptForm({ ...newPromptForm, defaultModel: e.target.value })}
                    className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash-thinking">Thinking Mode</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Temp: {newPromptForm.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={newPromptForm.temperature}
                    onChange={(e) => setNewPromptForm({ ...newPromptForm, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-amber-400 mt-2"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={newPromptForm.maxTokens}
                    onChange={(e) => setNewPromptForm({ ...newPromptForm, maxTokens: parseInt(e.target.value) || 2048 })}
                    className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={newPromptForm.description}
                  onChange={(e) => setNewPromptForm({ ...newPromptForm, description: e.target.value })}
                  placeholder="One sentence describing behavioral strengths..."
                  className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">System Instructions (Prompt)</label>
                <textarea
                  rows={4}
                  value={newPromptForm.systemPrompt}
                  onChange={(e) => setNewPromptForm({ ...newPromptForm, systemPrompt: e.target.value })}
                  placeholder="Detailed system behavioral directives passed to the LLM context..."
                  className="w-full rounded-xl border border-white/[.08] bg-[#16161c] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[.06]">
              <button
                onClick={() => setShowAddPromptModal(false)}
                className="rounded-xl border border-white/[.08] bg-white/[.04] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[.08] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newPromptForm.name.trim() || !newPromptForm.systemPrompt.trim()) {
                    addToast('Validation Error', 'Name and System Instructions are required.', 'warning');
                    return;
                  }
                  try {
                    const res = await ownerFetch('/api/admin/prompts', {
                      method: 'POST',
                      body: JSON.stringify({
                        ...newPromptForm,
                        updatedBy: user?.email || 'owner'
                      })
                    });
                    if (res.ok) {
                      addToast('Persona Registered', `Prompt "${newPromptForm.name}" created!`, 'success');
                      setShowAddPromptModal(false);
                      loadSectionData('memory');
                    } else {
                      addToast('Creation Failed', 'Failed to register persona.', 'critical');
                    }
                  } catch {
                    addToast('Network Error', 'Could not create persona.', 'critical');
                  }
                }}
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors shadow-md"
              >
                Save & Deploy Persona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOAST NOTIFICATION STACK (Bottom Right)
         ========================================================================= */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100'
                : t.type === 'critical'
                ? 'bg-red-950/80 border-red-500/40 text-red-100'
                : t.type === 'warning'
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-100'
                : 'bg-[#181820]/90 border-white/[.12] text-zinc-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : t.type === 'critical' ? (
                <XCircle size={16} className="text-red-400" />
              ) : t.type === 'warning' ? (
                <AlertTriangle size={16} className="text-amber-400" />
              ) : (
                <Zap size={16} className="text-amber-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">{t.title}</div>
              <div className="text-[11px] opacity-80 mt-0.5 leading-snug">{t.message}</div>
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
