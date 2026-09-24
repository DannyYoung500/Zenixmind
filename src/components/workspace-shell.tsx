import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandMark } from './brand-mark';
import { ModelSelector, AI_MODELS as AVAILABLE_MODELS } from './model-selector';
export { AVAILABLE_MODELS };
import { useAuth } from '../lib/auth-context';
import { isOwnerEmail } from '../lib/owners';
import {
  Plus,
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
  FolderPlus,
  Shield,
  VenetianMask,
 } from 'lucide-react';

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
  selectedModel = 'gemini-2.5-flash',
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
  const [internalConversations, setInternalConversations] = useState<Conversation[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zenixmind_pinned_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [projects, setProjects] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zenixmind_projects');
      return saved ? JSON.parse(saved) : ['Telegram Mini App Dev', 'Production AI Workflow'];
    } catch {
      return ['Telegram Mini App Dev', 'Production AI Workflow'];
    }
  });
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showAllChatsModal, setShowAllChatsModal] = useState(false);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = user?.email || 'dannyyoungofficial1@gmail.com';
  const userAvatar = user?.avatarUrl || '';
  const userName = user?.name || 'Danny Young';
  const isOwner = user?.isOwner || isOwnerEmail(userEmail);

  useEffect(() => {
    let mounted = true;
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chat', { cache: 'no-store' });
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

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const updated = [...projects, newProjectName.trim()];
    setProjects(updated);
    try {
      localStorage.setItem('zenixmind_projects', JSON.stringify(updated));
    } catch {}
    setNewProjectName('');
    setShowAddProjectModal(false);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return chats;
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(query.trim().toLowerCase())
    );
  }, [chats, query]);

  // Sort pinned first
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
    <main className="min-h-screen bg-[#050506] text-zinc-100 selection:bg-zinc-700 selection:text-white">
      <div className="flex min-h-screen">
        {/* Mobile Backdrop */}
        {open && (
          <button
            aria-label="Close sidebar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            open ? 'fixed inset-y-0 left-0 z-50 flex' : 'hidden'
          } ${
            sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-[260px]'
          } w-[280px] shrink-0 flex-col border-r border-white/[.06] bg-[#09090b] px-3 py-3 lg:relative lg:z-auto lg:flex select-none transition-all duration-200`}
        >
          {/* Top Header: Brand Logo on Left, Search + Collapse on Right */}
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
                title="Search chats"
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

          {/* Search Bar Input when opened */}
          {searching && !sidebarCollapsed && (
            <div className="mb-3 px-0.5">
              <div className="flex h-8 items-center gap-2 rounded-xl bg-[#141416] px-2.5 ring-1 ring-white/[.08]">
                <Search size={13} className="text-zinc-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600 font-light"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-zinc-300">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* New Chat controls */}
          <div className="mb-2 flex items-center gap-1.5">
            <button type="button" onClick={() => { onNewChat?.(); setOpen(false); }} title="New chat" className="flex min-w-0 flex-1 items-center rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-[#141416] hover:text-zinc-100 transition-colors">
              {!sidebarCollapsed && <span>New chat</span>}
              {sidebarCollapsed && <span className="sr-only">New chat</span>}
            </button>
          </div>

          {/* Core Navigation Items */}
          <nav className="space-y-0.5">
            {/* Owner Console item if user is platform owner */}
            {(user?.isOwner || isOwnerEmail(user?.email)) && (
              <Link
                to="/owner"
                onClick={() => setOpen(false)}
                title={sidebarCollapsed ? 'Owner Console' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-all mb-1.5 ${
                  sidebarCollapsed ? 'justify-center px-2' : ''
                } ${
                  location.pathname === '/owner'
                    ? 'border border-amber-400/30 bg-amber-400/15 text-amber-300 font-medium'
                    : 'border border-white/[.08] bg-white/[.02] text-zinc-300 hover:bg-white/[.05] hover:text-white'
                }`}
              >
                <Shield size={15} className="text-amber-400 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate font-medium">Owner Console</span>
                    <span className="rounded bg-amber-400/15 px-1.5 py-0.2 text-[9px] font-mono text-amber-300">
                      SUPERUSER
                    </span>
                  </>
                )}
              </Link>
            )}

            {[
              {
                id: 'chat',
                label: 'Chat',
                to: '/assistant',
                icon: SquarePen,
                badge: null
              },
              {
                id: 'images',
                label: 'Imagine',
                to: '/assistant?view=images',
                icon: Sparkles,
                badge: 'dot'
              },
              {
                id: 'library',
                label: 'Library',
                to: '/assistant?view=library',
                icon: FolderClosed,
                badge: null
              },
             ].map((item) => {
              const IconComp = item.icon;
              const isItemActive =
                (item.id === 'chat' && location.pathname === '/assistant' && !location.search.includes('view=')) ||
                (item.id === 'images' && location.search.includes('view=images')) ||
                (item.id === 'library' && location.search.includes('view=library')) ||
                (item.id === 'automations' && location.search.includes('view=automations')) ;

              return (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors ${
                    sidebarCollapsed ? 'justify-center px-2' : ''
                  } ${
                    isItemActive
                      ? 'bg-[#1f1f23] text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:bg-[#141416] hover:text-zinc-200 font-normal'
                  }`}
                >
                  <IconComp size={16} className={isItemActive ? 'text-zinc-100' : 'text-zinc-400'} />
                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge === 'dot' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <>
              {/* Projects Section */}
              <div className="mt-5">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[11px] font-medium text-zinc-500">Projects</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-[#141416] hover:text-zinc-200 transition-colors"
                >
                  <Plus size={14} className="text-zinc-500" />
                  <span>Add project</span>
                </button>
              </div>

              {/* Chats Section */}
              <div className="mt-4 flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[11px] font-medium text-zinc-500">Chats</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 mt-0.5">
                  {sortedChats.slice(0, 10).map((chat) => {
                    const isPinned = pinnedIds.includes(chat.id);
                    const isCurrentChat = location.search.includes(`conversation=${chat.id}`);

                    return (
                      <div
                        key={chat.id}
                        className={`group relative flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          isCurrentChat
                            ? 'bg-[#18181b] text-zinc-100 font-medium'
                            : 'text-zinc-400 hover:bg-[#141416] hover:text-zinc-200'
                        }`}
                      >
                        <Link
                          to={`/assistant?conversation=${chat.id}`}
                          onClick={() => setOpen(false)}
                          className="min-w-0 flex-1 truncate pr-2"
                        >
                          {chat.title || 'New conversation'}
                        </Link>

                        <div className="flex items-center gap-1 shrink-0">
                          {isPinned && (
                            <Pin size={12} className="text-zinc-400 rotate-45 shrink-0" />
                          )}

                          {/* Hover action menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 transition-opacity"
                            >
                              <MoreHorizontal size={13} />
                            </button>

                            {activeMenuChatId === chat.id && (
                              <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-xl border border-white/[.1] bg-[#121215] p-1 shadow-2xl backdrop-blur-xl">
                                <button
                                  type="button"
                                  onClick={(e) => togglePin(chat.id, e)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-[#1a1a1e]"
                                >
                                  <Pin size={12} />
                                  <span>{isPinned ? 'Unpin' : 'Pin chat'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteChat(chat.id, e)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {!sortedChats.length && (
                    <div className="px-2 py-4 text-center text-xs text-zinc-600 font-light">
                      No conversations yet.
                    </div>
                  )}

                  {sortedChats.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllChatsModal(true)}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      See all
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Bottom Area: User Profile */}
          <div className="border-t border-white/[.06] pt-2 mt-auto space-y-1">
            {/* User Profile Item */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-[#141416] transition-colors ${
                  sidebarCollapsed ? 'justify-center px-1' : ''
                }`}
              >
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                  {userAvatar ? (
                    <img src={userAvatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-semibold text-xs">{initials}</div>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-zinc-100">{userName}</div>
                    <div className="truncate text-[10px] text-zinc-500">{userEmail}</div>
                  </div>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-white/[.08] bg-[#121214] p-1.5 shadow-2xl z-50">
                  <div className="flex items-center gap-2.5 px-3 py-2 border-b border-white/[.05] mb-1">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                      {userAvatar ? <img src={userAvatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="grid h-full w-full place-items-center text-xs font-semibold">{initials}</div>}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">{userName}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{userEmail}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onOpenSettings) onOpenSettings();
                      else navigate('/assistant?settings=1');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-[#1c1c1f]"
                  >
                    <Settings size={14} className="text-zinc-400" />
                    <span>Preferences & Memory</span>
                  </button>

                  <Link
                    to="/assistant/voice"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-[#1c1c1f]"
                  >
                    <VenetianMask size={14} className="text-amber-400" />
                    <span>Voice Assistant</span>
                  </Link>

                  <Link
                    to="/pricing"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-[#1c1c1f]"
                  >
                    <CreditCard size={14} className="text-zinc-400" />
                    <span>Plans & Upgrade</span>
                  </Link>

                  {isOwner && (
                    <Link
                      to="/owner"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-amber-300 hover:bg-amber-400/10"
                    >
                      <Shield size={14} className="text-amber-400" />
                      <span>Owner Admin Console</span>
                    </Link>
                  )}

                  <div className="my-1 border-t border-white/[.06]" />

                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await signOut();
                      navigate('/login');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-red-400 hover:bg-red-400/10"
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="min-w-0 flex-1 flex flex-col min-h-screen">
          {/* Top Workspace Header */}
          <header className="flex min-h-[52px] items-center justify-between border-b border-white/[.05] px-4 sm:px-6 bg-[#08080a]/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-xl border border-white/[.06] bg-[#0e0e10] text-zinc-400 hover:bg-[#18181b] hover:text-zinc-200 lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu size={16} />
              </button>

              <div className="flex items-center gap-2.5">
                <BrandMark size={20} />
                <span className="text-[13px] font-semibold text-zinc-200">
                  {title || 'ZenixMind'}
                </span>
              </div>
            </div>

            {/* Top Right: Voice Mode & Upgrade */}
            <div className="flex items-center gap-2.5">
              <Link
                to="/pricing"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/[.08] bg-[#121215] px-3 py-1 text-[11px] font-medium text-zinc-300 hover:bg-[#18181c] hover:text-white transition-colors"
              >
                <span>Upgrade</span>
              </Link>
              {headerAction === 'new' && (
                <button
                  type="button"
                  onClick={() => onNewChat?.()}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[.08] bg-[#121215] text-zinc-100 hover:bg-[#18181c] transition-colors"
                  title="New chat"
                  aria-label="New chat"
                >
                  <SquarePen size={20} strokeWidth={2} />
                </button>
              )}
            </div>
          </header>

          <div className="min-h-[calc(100vh-52px)] flex-1 flex flex-col">{children}</div>
        </section>
      </div>

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[.1] bg-[#0e0e11] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[.06]">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Create New Project</h3>
              </div>
              <button onClick={() => setShowAddProjectModal(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Project Name</label>
                <input
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Telegram Mini App Dev, Web Research..."
                  className="w-full rounded-xl border border-white/[.1] bg-[#16161a] px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="rounded-xl px-3 py-1.5 text-xs text-zinc-400 hover:bg-[#18181b]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="rounded-xl bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-40"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* All Chats Modal */}
      {showAllChatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl max-h-[80vh] flex flex-col rounded-2xl border border-white/[.1] bg-[#0e0e11] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[.06]">
              <h3 className="text-sm font-semibold text-white">All Conversations ({chats.length})</h3>
              <button onClick={() => setShowAllChatsModal(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-4 space-y-1 pr-1">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/assistant?conversation=${chat.id}`}
                  onClick={() => setShowAllChatsModal(false)}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[.04] bg-[#141417] hover:bg-[#1a1a1f] text-xs text-zinc-300 transition-colors"
                >
                  <span className="truncate pr-4">{chat.title || 'New conversation'}</span>
                  <span className="text-[10px] text-zinc-500 shrink-0 font-mono">
                    {new Date(chat.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
