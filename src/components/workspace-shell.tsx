import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Image as ImageIcon, FolderClosed, Workflow, Settings,
  Plus, Menu, X, LogOut, ChevronRight, CreditCard, MoreVertical, Share2, Pin, Archive, FolderInput, Search, Paperclip, Puzzle, Trash2, Edit2, Copy, ExternalLink, Bell
} from 'lucide-react';
import { BrandMark } from './brand-mark';
import { useAuth } from '../lib/auth-context';

export interface Conversation {
  id: string;
  title: string;
  updated_at?: string;
  created_at?: string;
}

type WorkspaceView = 'chat' | 'images' | 'library' | 'automations' | 'plans' | string;

interface WorkspaceShellProps {
  active?: WorkspaceView;
  title?: string;
  conversations?: Conversation[];
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  onOpenSettings?: () => void;
  headerAction?: 'new' | 'none';
  onNewChat?: () => void;
  onShareConversation?: () => Promise<void>;
  onRenameConversation?: (id: string, title: string) => void;
  onRefreshConversations?: () => void;
  children: React.ReactNode;
}

const navigation = [
  { id: 'chat', label: 'Chat', to: '/assistant', icon: MessageSquare },
  { id: 'images', label: 'Imagine', to: '/assistant?view=images', icon: ImageIcon },
  { id: 'library', label: 'My stuff', to: '/assistant?view=library', icon: FolderClosed },
  { id: 'automations', label: 'Automations', to: '/assistant?view=automations', icon: Workflow }
];

export function WorkspaceShell({
  active = 'chat',
  title = 'ZenixMind',
  conversations = [],
  onOpenSettings,
  headerAction = 'none',
  onNewChat,
  onShareConversation,
  onRenameConversation,
  onRefreshConversations,
  children
}: WorkspaceShellProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarMenuId, setSidebarMenuId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('zenixmind_pinned_conversations') || '[]'); } catch { return []; } });
  const [archivedIds, setArchivedIds] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('zenixmind_archived_conversations') || '[]'); } catch { return []; } });
  const activeConversation = new URLSearchParams(location.search).get('conversation');
  const closeMobile = () => setMobileOpen(false);
  const visibleConversations = conversations.filter((item) => !archivedIds.includes(item.id)).slice().sort((a, b) => Number(pinnedIds.includes(b.id)) - Number(pinnedIds.includes(a.id)) || new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
  const togglePin = (id?: string | null) => {
    const target = id || activeConversation;
    if (!target) return;
    const next = pinnedIds.includes(target) ? pinnedIds.filter((x) => x !== target) : [target, ...pinnedIds];
    setPinnedIds(next); localStorage.setItem('zenixmind_pinned_conversations', JSON.stringify(next));
  };
  const archiveConversation = (id?: string | null) => {
    const target = id || activeConversation;
    if (!target) return;
    const next = [...new Set([...archivedIds, target])];
    setArchivedIds(next); localStorage.setItem('zenixmind_archived_conversations', JSON.stringify(next));
    setMoreOpen(false);
    setSidebarMenuId(null);
    if (activeConversation === target) navigate('/assistant');
  };
  const deleteConversation = async (id?: string | null) => {
    const target = id || activeConversation;
    if (!target) return;
    const ok = window.confirm('Delete this chat? This cannot be undone.');
    if (!ok) return;
    try {
      await fetch(`/api/chat?conversation_id=${encodeURIComponent(target)}`, { method: 'DELETE' });
    } catch { /* best effort */ }
    setPinnedIds((prev) => {
      const next = prev.filter((x) => x !== target);
      localStorage.setItem('zenixmind_pinned_conversations', JSON.stringify(next));
      return next;
    });
    setMoreOpen(false);
    setSidebarMenuId(null);
    onRefreshConversations?.();
    if (activeConversation === target) navigate('/assistant', { replace: true });
    else {
      navigate(location.pathname + location.search, { replace: true });
    }
  };
  const handleFindInChat = () => {
    const term = window.prompt('Find in this conversation');
    if (term?.trim()) (window as any).find?.(term.trim());
    setMoreOpen(false);
  };
  const handleShare = async (id?: string | null) => {
    const target = id || activeConversation;
    if (onShareConversation && (!id || id === activeConversation)) {
      try { await onShareConversation(); } catch { /* parent surfaces */ }
      setMoreOpen(false);
      setSidebarMenuId(null);
      return;
    }
    if (!target) return;
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: target })
      });
      const data = await res.json().catch(() => ({}));
      const url = data?.url || data?.shareUrl || `${window.location.origin}/share/${data?.token || target}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        window.alert('Share link copied');
      }
    } catch {
      window.alert('Could not create share link');
    }
    setMoreOpen(false);
    setSidebarMenuId(null);
  };
  const copyId = async (id: string) => {
    try { await navigator.clipboard.writeText(id); } catch {}
    setSidebarMenuId(null);
    setMoreOpen(false);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const chatMenuItems = (id: string | null, close: () => void) => (
    <div role="menu" aria-label="Conversation options" className="w-[min(290px,calc(100vw-1.5rem))] rounded-2xl border border-white/[.1] bg-[#202023] p-1.5 shadow-[0_18px_55px_rgba(0,0,0,.6)]">
      <button type="button" role="menuitem" onClick={() => void handleShare(id)} disabled={!id} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07] disabled:opacity-40">
        <Share2 size={16} className="text-zinc-400" /> Share
      </button>
      <button type="button" role="menuitem" onClick={() => { togglePin(id); close(); }} disabled={!id} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07] disabled:opacity-40">
        <Pin size={16} className="text-zinc-400" />{id && pinnedIds.includes(id) ? 'Unpin chat' : 'Pin chat'}
      </button>
      <button type="button" role="menuitem" onClick={() => { close(); const t = window.prompt('Rename chat', conversations.find(c => c.id === id)?.title || ''); if (t?.trim() && id && onRenameConversation) onRenameConversation(id, t.trim()); }} disabled={!id} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07] disabled:opacity-40">
        <Edit2 size={16} className="text-zinc-400" /> Rename
      </button>
      <button type="button" role="menuitem" onClick={() => { navigate('/assistant?view=library'); close(); }} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07]">
        <Paperclip size={16} className="text-zinc-400" /> Uploaded files
      </button>
      <button type="button" role="menuitem" onClick={() => { handleFindInChat(); close(); }} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07]">
        <Search size={16} className="text-zinc-400" /> Find in chat
      </button>
      <button type="button" role="menuitem" disabled className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-500 opacity-60">
        <Puzzle size={16} /> Plugins <span className="ml-auto text-[10px]">Coming soon</span>
      </button>
      <button type="button" role="menuitem" disabled className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-500 opacity-60">
        <FolderInput size={16} /> Add to project <span className="ml-auto text-[10px]">Coming soon</span>
      </button>
      <button type="button" role="menuitem" onClick={close} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07]">
        <Bell size={16} className="text-zinc-400" /> Mark as Unread
      </button>
      <div className="my-1 h-px bg-white/[.08]" />
      <button type="button" role="menuitem" onClick={() => { if (id) void copyId(id); }} disabled={!id} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07] disabled:opacity-40">
        <Copy size={16} className="text-zinc-400" /> Copy Conversation ID
      </button>
      {id && (
        <a href={`/assistant?conversation=${encodeURIComponent(id)}`} target="_blank" rel="noreferrer" role="menuitem" onClick={close} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07]">
          <ExternalLink size={16} className="text-zinc-400" /> Open in new tab
        </a>
      )}
      <button type="button" role="menuitem" onClick={() => archiveConversation(id)} disabled={!id} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] text-zinc-200 hover:bg-white/[.07] disabled:opacity-40">
        <Archive size={16} className="text-zinc-400" /> Archive
      </button>
      <div className="my-1 h-px bg-white/[.08]" />
      <button type="button" role="menuitem" onClick={() => void deleteConversation(id)} disabled={!id} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-red-400 hover:bg-red-500/[.1] disabled:opacity-40">
        <Trash2 size={16} /> Delete
      </button>
    </div>
  );

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col bg-[#09090b]">
      <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[.06] px-5">
        <Link to="/assistant" onClick={closeMobile} className="flex min-w-0 items-center gap-3">
          <BrandMark size={34} />
          <span className="truncate text-[15px] font-semibold tracking-[-.035em] text-zinc-100">ZenixMind</span>
        </Link>
        <button type="button" onClick={closeMobile} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/[.06] hover:text-white md:hidden" aria-label="Close navigation">
          <X size={17} />
        </button>
      </div>

      <div className="px-3 pb-3 pt-4">
        <button type="button" onClick={() => { onNewChat?.(); closeMobile(); }} className="group flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[.12] bg-[#f1f1f2] text-[12px] font-semibold text-[#111113] shadow-[0_3px_14px_rgba(0,0,0,.22)] transition hover:bg-white">
          <Plus size={15} strokeWidth={2.4} /> New chat
          <span className="ml-auto mr-2 hidden rounded-md border border-black/10 px-1.5 py-0.5 text-[9px] font-medium text-black/45 sm:inline">⌘ N</span>
        </button>
      </div>

      <nav aria-label="Workspace navigation" className="space-y-1 px-3 pb-4">
        <p className="px-3 pb-2 pt-1 text-[9px] font-semibold uppercase tracking-[.19em] text-zinc-600">Workspace</p>
        {navigation.map((item) => {
          const selected = active === item.id;
          const Icon = item.icon;
          return (
            <Link key={item.id} to={item.to} onClick={closeMobile} aria-current={selected ? 'page' : undefined}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[12px] font-medium transition-colors ${selected ? 'bg-white/[.085] text-white ring-1 ring-white/[.055]' : 'text-zinc-500 hover:bg-white/[.045] hover:text-zinc-200'}`}>
              <Icon size={16} strokeWidth={1.8} className={selected ? 'text-zinc-100' : 'text-zinc-500'} />
              <span>{item.label}</span>
              {selected && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-zinc-200" />}
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 h-px shrink-0 bg-white/[.055]" />
      <div className="flex min-h-0 flex-1 flex-col px-3 pt-4">
        <div className="flex items-center justify-between px-3 pb-2">
          <p className="text-[9px] font-semibold uppercase tracking-[.19em] text-zinc-600">Recent conversations</p>
          <span className="text-[9px] tabular-nums text-zinc-700">{conversations.length}</span>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {visibleConversations.length ? visibleConversations.slice(0, 40).map((conversation) => {
            const selected = activeConversation === conversation.id;
            return (
              <div key={conversation.id} className={`group relative flex min-h-9 items-center gap-1 rounded-lg pr-1 transition-colors ${selected ? 'bg-white/[.075] text-zinc-100' : 'text-zinc-500 hover:bg-white/[.04] hover:text-zinc-200'}`}>
                <Link to={`/assistant?conversation=${encodeURIComponent(conversation.id)}`} onClick={closeMobile}
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-[11px]">
                  <MessageSquare size={13} className="shrink-0 opacity-55" />
                  <span className="min-w-0 flex-1 truncate">{conversation.title || 'New conversation'}</span>
                  {pinnedIds.includes(conversation.id) && <Pin size={11} className="shrink-0 text-zinc-400" />}
                </Link>
                <button
                  type="button"
                  aria-label="Chat options"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSidebarMenuId(sidebarMenuId === conversation.id ? null : conversation.id);
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-500 opacity-100 hover:bg-white/[.08] hover:text-zinc-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <MoreVertical size={14} />
                </button>
                {sidebarMenuId === conversation.id && (
                  <>
                    <button type="button" className="fixed inset-0 z-[95] cursor-default" aria-label="Close menu" onClick={() => setSidebarMenuId(null)} />
                    <div className="absolute right-0 top-9 z-[96]">
                      {chatMenuItems(conversation.id, () => setSidebarMenuId(null))}
                    </div>
                  </>
                )}
              </div>
            );
          }) : <div className="px-3 py-5 text-[11px] leading-5 text-zinc-700">Your conversations will appear here.</div>}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[.06] p-3">
        <Link to="/pricing" onClick={closeMobile} className={`mb-2 flex h-9 items-center gap-3 rounded-lg px-3 text-[11px] transition-colors ${active === 'plans' ? 'bg-white/[.07] text-white' : 'text-zinc-500 hover:bg-white/[.04] hover:text-zinc-200'}`}>
          <CreditCard size={14} /> Plans
        </Link>
        {user && (
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[.065] bg-[#101013] p-2">
            <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[.1] bg-[#27272b] text-[12px] font-semibold text-zinc-200">
              <span aria-hidden="true">{(user.name || user.email || 'U').trim().charAt(0).toUpperCase()}</span>
              {user.avatarUrl && <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-zinc-200">{user.name || 'Your account'}</p>
              <p className="truncate text-[10px] text-zinc-600" title={user.email}>{user.email}</p>
            </div>
            <button type="button" onClick={() => { onOpenSettings?.(); closeMobile(); }} aria-label="Open settings" title="Settings" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-white/[.07] hover:text-zinc-100"><Settings size={15} /></button>
            <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} aria-label="Sign out" title="Sign out" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-600 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"><LogOut size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#050506] text-zinc-100">
      <aside className="hidden w-[256px] shrink-0 border-r border-white/[.06] md:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <button type="button" onClick={closeMobile} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close navigation overlay" />
          <aside className="relative h-full w-full border-r border-white/[.08] shadow-2xl sm:w-[min(84vw,360px)]">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[.055] bg-[#070708] px-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/[.06] hover:text-white md:hidden"><Menu size={18} /></button>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-zinc-200">{title}</p>
              <p className="hidden text-[9px] tracking-[.08em] text-zinc-600 sm:block">YOUR PRIVATE AI WORKSPACE</p>
            </div>
          </div>
          <div className="relative flex shrink-0 items-center gap-2">
            {headerAction === 'new' && onNewChat && <button type="button" onClick={onNewChat} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[.08] bg-white/[.035] px-2.5 text-[10px] font-medium text-zinc-300 transition hover:bg-white/[.08] hover:text-white sm:hidden"><Plus size={13} /> <span className="hidden sm:inline">New chat</span></button>}
            {active === 'chat' && <button type="button" onClick={() => setMoreOpen((value) => !value)} aria-label="Conversation options" aria-haspopup="menu" aria-expanded={moreOpen} className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition hover:bg-white/[.07] hover:text-white"><MoreVertical size={19} /></button>}
            {active !== 'chat' && <Link to="/assistant" className="text-[10px] text-zinc-500 transition hover:text-zinc-200">Back to chat</Link>}
            {moreOpen && (
              <>
                <button type="button" aria-label="Close conversation options" className="fixed inset-0 z-[95] cursor-default" onClick={() => setMoreOpen(false)} />
                <div className="absolute right-0 top-11 z-[96]">
                  {chatMenuItems(activeConversation, () => setMoreOpen(false))}
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

export default WorkspaceShell;
