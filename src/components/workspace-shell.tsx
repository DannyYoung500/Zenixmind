import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { ModelSelector, AI_MODELS as AVAILABLE_MODELS } from './model-selector';
import { WORKSPACE_NAVIGATION } from '../lib/workspace-navigation';
export { AVAILABLE_MODELS };
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import { getSupabase } from '../lib/supabase';
import {
  Search,
  SquarePen,
  Sparkles,
  FolderClosed,
    Pin,
  MoreHorizontal,
  X,
  Menu,
  CreditCard,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  Edit2,
  Shield,
  Workflow,
 } from 'lucide-react';

interface LibrarySearchItem {
  id: string;
  file_name: string;
  mime_type: string;
  source: 'uploaded' | 'generated';
  prompt?: string | null;
  created_at: string;
}

interface MessageSearchItem {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  model?: string;
  created_at: string;
  updated_at: string;
  pinned?: boolean;
}

interface WorkspaceShellProps {
  active?: 'home' | 'chat' | 'images' | 'library' | 'automations' | 'plans' | 'owner';
  children: React.ReactNode;
  title?: string;
  conversations?: Conversation[];
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  onRefreshConversations?: () => void;
  onOpenSettings?: () => void;
  onNewChat?: () => void;
  headerAction?: 'new' | 'none';
}

export function WorkspaceShell({
  active = 'chat',
  children,
  title,
  conversations: externalConversations,
  selectedModel = 'zenix-auto',
  onSelectModel,
  onRefreshConversations,
  onOpenSettings,
  onNewChat,
  headerAction = 'none'
}: WorkspaceShellProps) {
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [librarySearchItems, setLibrarySearchItems] = useState<LibrarySearchItem[]>([]);
  const [librarySearchLoading, setLibrarySearchLoading] = useState(false);
  const [messageSearchItems, setMessageSearchItems] = useState<MessageSearchItem[]>([]);
  const [messageSearchLoading, setMessageSearchLoading] = useState(false);
  const [internalConversations, setInternalConversations] = useState<Conversation[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zenixmind_pinned_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showAllChatsModal, setShowAllChatsModal] = useState(false);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = user?.email || '';
  const userAvatar = user?.avatarUrl || '';
  const userName = user?.name || (userEmail ? userEmail.split('@')[0] : 'ZenixMind user');
  const isOwner = user?.isOwner || isOwnerEmail(userEmail);

  useEffect(() => {
    let mounted = true;
    const fetchChats = async () => {
      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined;
        const response = await fetch('/api/chat', {
          cache: 'no-store',
          headers
        });
        if (response.ok && mounted) {
          const data = await response.json();
          setInternalConversations(data.conversations || []);
        }
      } catch {
        try {
          const stored = localStorage.getItem('zenixmind_chats');
          if (stored && mounted) {
            setInternalConversations(JSON.parse(stored));
          }
        } catch {}
      }
    };
    fetchChats();
    return () => {
      mounted = false;
    };
  }, [location.pathname, location.search]);

  const chats = externalConversations || internalConversations;

  useEffect(() => {
    let mounted = true;
    const term = query.trim();
    if (!term || !searching || !user?.id) {
      setLibrarySearchItems([]);
      setLibrarySearchLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLibrarySearchLoading(true);
      try {
        const pattern = `%${term.replace(/[%_]/g, '\\$&')}%`;
        const { data } = await getSupabase()
          .from('library_items')
          .select('id,file_name,mime_type,source,prompt,created_at')
          .eq('user_id', user.id)
          .or(`file_name.ilike.${pattern},prompt.ilike.${pattern}`)
          .order('created_at', { ascending: false })
          .limit(8);
        if (mounted) setLibrarySearchItems((data || []) as LibrarySearchItem[]);
      } catch {
        if (mounted) setLibrarySearchItems([]);
      } finally {
        if (mounted) setLibrarySearchLoading(false);
      }
    }, 180);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [query, searching, user?.id]);

  useEffect(() => {
    let mounted = true;
    const term = query.trim();
    if (!term || !searching || !user?.id) {
      setMessageSearchItems([]);
      setMessageSearchLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setMessageSearchLoading(true);
      try {
        const pattern = `%${term.replace(/[%_]/g, '\\$&')}%`;
        const { data } = await getSupabase()
          .from('messages')
          .select('id,conversation_id,role,content,created_at')
          .eq('user_id', user.id)
          .ilike('content', pattern)
          .order('created_at', { ascending: false })
          .limit(10);
        if (mounted) setMessageSearchItems((data || []) as MessageSearchItem[]);
      } catch {
        if (mounted) setMessageSearchItems([]);
      } finally {
        if (mounted) setMessageSearchLoading(false);
      }
    }, 220);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [query, searching, user?.id]);

  const chatsSearchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return chats.filter((chat) => chat.title.toLowerCase().includes(term)).slice(0, 8);
  }, [chats, query]);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      try {
        localStorage.setItem('zenixmind_pinned_chats', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActiveMenuChatId(null);
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/chat?conversation_id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {}
    setInternalConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveMenuChatId(null);
    if (onRefreshConversations) onRefreshConversations();
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [chats, query]);

  const searchResults = chatsSearchResults;
  const conversationById = useMemo(
    () => new Map(chats.map((chat) => [chat.id, chat])),
    [chats]
  );

  const sortedChats = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [filtered, pinnedIds]);

  const initials = (userName?.[0] || 'D').toUpperCase();

  return (
    <main className="zenix-app-shell overflow-hidden bg-[#050506] text-zinc-100 selection:bg-zinc-700 selection:text-white">
      <div className="flex h-full min-h-0 overflow-hidden">
        {open && (
          <button
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          />
        )}

        <aside
          className={`${
            open ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'
          } ${
            sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-[260px]'
          } w-[280px] shrink-0 flex-col border-r border-white/[.06] bg-[#09090b] px-3 py-3 lg:relative lg:z-auto lg:flex select-none transition-[width] duration-200`}
        >
          <div className="flex items-center justify-between px-1.5 pb-3">
            <Link
              to="/assistant"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
              title="ZenixMind Home"
            >
              <BrandMark size={28} className="text-zinc-100" />
              {!sidebarCollapsed && (
                <span className="text-[14px] font-semibold tracking-[-0.02em] text-white">
                  ZenixMind
                </span>
              )}
            </Link>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (sidebarCollapsed) setSidebarCollapsed(false);
                  setSearching((v) => !v);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-[#18181b] hover:text-zinc-200 transition-colors"
                title="Search everything"
              >
                <Search size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="hidden lg:grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-[#18181b] hover:text-zinc-200 transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-[#18181b] hover:text-zinc-200 lg:hidden"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-1.5">
            <button type="button" onClick={() => { onNewChat?.(); setOpen(false); }} title="New chat" className="flex min-w-0 flex-1 items-center justify-center rounded-xl border border-white/[.1] bg-white text-xs font-semibold text-[#09090b] px-3 py-2.5 shadow-sm transition-colors hover:bg-zinc-200">
              <SquarePen size={15} className={sidebarCollapsed ? '' : 'mr-2'} />
              {!sidebarCollapsed && <span>New chat</span>}
              {sidebarCollapsed && <span className="sr-only">New chat</span>}
            </button>
          </div>

          {!sidebarCollapsed && <div className="px-2 pb-2 pt-1 text-[9px] font-semibold uppercase tracking-[.16em] text-zinc-600">Workspace</div>}
          <nav className="space-y-1">
            {(user?.isOwner || isOwnerEmail(user?.email)) && (
              <Link
                to="/owner"
                onClick={() => setOpen(false)}
                title={sidebarCollapsed ? 'Owner Console' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors mb-1.5 ${
                  sidebarCollapsed ? 'justify-center px-2' : ''
                } ${
                  location.pathname === '/owner'
                    ? 'border border-amber-400/30 bg-amber-400/15 text-amber-300 font-medium'
                    : 'border border-white/[.08] bg-white/[.02] text-zinc-300 hover:bg-white/[.05] hover:text-white'
                }`}
              >
                <Shield size={15} className="text-amber-400 shrink-0" />
                {!sidebarCollapsed && <span>Owner Console</span>}
              </Link>
            )}
            {WORKSPACE_NAVIGATION.map((item) => {
              const isActive = active === item.id || (item.id === 'chat' && active === 'home');
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors ${
                    sidebarCollapsed ? 'justify-center px-2' : ''
                  } ${
                    isActive
                      ? 'bg-white/[.08] text-white font-medium'
                      : 'text-zinc-400 hover:bg-white/[.04] hover:text-zinc-200'
                  }`}
                >
                  <item.icon size={15} className="shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
              <div className="px-2 pb-2 text-[9px] font-semibold uppercase tracking-[.16em] text-zinc-600">Chats</div>
              <div className="space-y-0.5">
                {sortedChats.slice(0, 40).map((chat) => (
                  <Link
                    key={chat.id}
                    to={`/assistant?conversation=${chat.id}`}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-zinc-400 hover:bg-white/[.04] hover:text-zinc-200"
                  >
                    <span className="min-w-0 flex-1 truncate">{chat.title || 'New conversation'}</span>
                    {pinnedIds.includes(chat.id) && <Pin size={12} className="text-zinc-500" />}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto border-t border-white/[.06] pt-3">
            <button
              type="button"
              onClick={() => setShowProfileMenu((v) => !v)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[.04] ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              {userAvatar ? (
                <img src={userAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/[.08] text-xs font-semibold text-white">{initials}</div>
              )}
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-zinc-200">{userName}</div>
                  <div className="truncate text-[10px] text-zinc-600">{userEmail}</div>
                </div>
              )}
            </button>
            {showProfileMenu && !sidebarCollapsed && (
              <div className="mt-1 overflow-hidden rounded-xl border border-white/[.08] bg-[#111114] py-1">
                <button type="button" onClick={() => { onOpenSettings?.(); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-white/[.05]">
                  <Settings size={14} /> Settings
                </button>
                <Link to="/pricing" onClick={() => setShowProfileMenu(false)} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-white/[.05]">
                  <CreditCard size={14} /> Plans
                </Link>
                <button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-300 hover:bg-white/[.05]">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[.06] px-3 lg:px-4">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/[.05] hover:text-zinc-200 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-200">{title || 'ZenixMind'}</div>
            {onSelectModel && (
              <div className="hidden sm:block">
                <ModelSelector value={selectedModel} onChange={onSelectModel} />
              </div>
            )}
            {headerAction === 'new' && (
              <button type="button" onClick={() => onNewChat?.()} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/[.05] hover:text-zinc-200" aria-label="New chat">
                <SquarePen size={16} />
              </button>
            )}
          </header>
          <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
        </section>
      </div>
    </main>
  );
}
