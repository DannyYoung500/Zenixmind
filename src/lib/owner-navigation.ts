import type { ElementType } from 'react';
import {
  LayoutDashboard, Cpu, Layers, Server, Mic, Globe, Users, MessageSquare,
  Brain, HardDrive, BarChart3, Shield, FileText, Activity, ToggleLeft,
  Bell, Blocks, Key, Terminal, Database, Rocket, Archive, Sliders
} from 'lucide-react';

export type OwnerSection =
  | 'overview' | 'ai-control' | 'models' | 'providers' | 'voice' | 'search'
  | 'users' | 'conversations' | 'memory' | 'storage' | 'usage' | 'security'
  | 'audit-log' | 'health' | 'logs' | 'feature-flags' | 'notifications'
  | 'integrations' | 'api-keys' | 'env-config' | 'database' | 'deployments'
  | 'backups' | 'owner-settings';

export type OwnerNavGroup = 'Platform' | 'People & Data' | 'Trust & Security' | 'Infrastructure';

export interface OwnerMenuItem {
  id: OwnerSection;
  label: string;
  group: OwnerNavGroup;
  icon: ElementType;
}

export const OWNER_MENU_ITEMS: OwnerMenuItem[] = [
  { id: 'overview', label: 'Overview', group: 'Platform', icon: LayoutDashboard },
  { id: 'ai-control', label: 'AI Control Center', group: 'Platform', icon: Cpu },
  { id: 'models', label: 'Models', group: 'Platform', icon: Layers },
  { id: 'providers', label: 'AI Providers', group: 'Platform', icon: Server },
  { id: 'voice', label: 'Voice Engine', group: 'Platform', icon: Mic },
  { id: 'search', label: 'Web & Search', group: 'Platform', icon: Globe },
  { id: 'integrations', label: 'Plugins', group: 'Platform', icon: Blocks },
  { id: 'users', label: 'Users', group: 'People & Data', icon: Users },
  { id: 'conversations', label: 'Conversations', group: 'People & Data', icon: MessageSquare },
  { id: 'memory', label: 'Memory', group: 'People & Data', icon: Brain },
  { id: 'storage', label: 'Storage', group: 'People & Data', icon: HardDrive },
  { id: 'usage', label: 'Usage & Costs', group: 'People & Data', icon: BarChart3 },
  { id: 'security', label: 'Security & Access', group: 'Trust & Security', icon: Shield },
  { id: 'audit-log', label: 'Audit Log', group: 'Trust & Security', icon: FileText },
  { id: 'health', label: 'System Health', group: 'Trust & Security', icon: Activity },
  { id: 'logs', label: 'System Logs', group: 'Trust & Security', icon: FileText },
  { id: 'feature-flags', label: 'Feature Flags', group: 'Trust & Security', icon: ToggleLeft },
  { id: 'notifications', label: 'Notifications', group: 'Trust & Security', icon: Bell },
  { id: 'api-keys', label: 'API Keys', group: 'Trust & Security', icon: Key },
  { id: 'env-config', label: 'Environment', group: 'Infrastructure', icon: Terminal },
  { id: 'database', label: 'Database', group: 'Infrastructure', icon: Database },
  { id: 'deployments', label: 'Deployments', group: 'Infrastructure', icon: Rocket },
  { id: 'backups', label: 'Backups & Recovery', group: 'Infrastructure', icon: Archive },
  { id: 'owner-settings', label: 'Owner Settings', group: 'Infrastructure', icon: Sliders }
];

export const OWNER_NAV_GROUPS: { label: OwnerNavGroup; items: OwnerMenuItem[] }[] = [
  { label: 'Platform', items: OWNER_MENU_ITEMS.filter((item) => item.group === 'Platform') },
  { label: 'People & Data', items: OWNER_MENU_ITEMS.filter((item) => item.group === 'People & Data') },
  { label: 'Trust & Security', items: OWNER_MENU_ITEMS.filter((item) => item.group === 'Trust & Security') },
  { label: 'Infrastructure', items: OWNER_MENU_ITEMS.filter((item) => item.group === 'Infrastructure') }
];
