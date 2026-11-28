import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { WorkspaceShell, Conversation } from '../components/workspace-shell';
import { ModelSelector } from '../components/model-selector';
import { MessageRenderer } from '../components/message-renderer';
import { useAuth } from '../lib/auth-context';
import { getSupabase } from '../lib/supabase';
import { parseSseEvent, splitSseFrames } from '../lib/sse-parser';
import { VoiceTalk } from '../components/voice-talk';
import { getChatCommand, getCommandSuggestions, isUnknownSlashCommand, parseChatCommand } from '../lib/chat-commands';
import {
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Camera,
  Images,
  Blocks,
  Paperclip,
  X,
  Download,
  Trash2,
  Copy,
  Check,
  Volume2,
  Sparkles,
  FolderClosed,
  FileText,
  Search,
  ExternalLink,
  Bot,
  RotateCcw,
  Wand2,
  Globe,
  Brain,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Command,
  Keyboard,
  Plus,
  ChevronDown,
  Zap,
  Star,
  HardDrive,
  Info,
  MoreVertical
} from 'lucide-react';


const chatApiFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const { data: { session } } = await getSupabase().auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers });
};

interface Source {
  title: string;
  url: string;
  snippet?: string;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used?: string;
  sources?: Source[];
  created_at?: string;
  isStreaming?: boolean;
  liked?: boolean;
  disliked?: boolean;
  reactions?: Record<string, number>;
  userReactions?: string[];
}

interface LibraryItem {
  id: string;
  file_name: string;
  mime_type?: string;
  storage_path?: string;
  size_bytes?: number;
  source?: string;
  prompt?: string;
  created_at: string;
  url?: string;
  is_favorite?: boolean;
  deleted_at?: string | null;
}

function SettingsModal({ onClose, onClearChats, webSearch, onWebSearchChange, deepThink, onDeepThinkChange, temporaryChat, onTemporaryChatChange }: { onClose: () => void; onClearChats: () => void; webSearch: boolean; onWebSearchChange: (enabled: boolean) => void; deepThink: boolean; onDeepThinkChange: (enabled: boolean) => void; temporaryChat: boolean; onTemporaryChatChange: (enabled: boolean) => void }) {
  const { user } = useAuth();
  const [memory, setMemory] = useState(() => localStorage.getItem('zenixmind-memory') !== 'off');
  const [length, setLength] = useState(() => localStorage.getItem('zenixmind-response-length') || 'Adaptive');
  const [style, setStyle] = useState(() => localStorage.getItem('zenixmind-personality') || 'Balanced');
  const [language, setLanguage] = useState(() => localStorage.getItem('zenixmind-language') || 'Auto');
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem('zenixmind-custom-instructions') || '');
  const [memories, setMemories] = useState<Array<{ id: string; memory: string; category: string; source: string; created_at: string; updated_at: string }>>([]);
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memoryNotice, setMemoryNotice] = useState('');
  const [newMemory, setNewMemory] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [savingMemory, setSavingMemory] = useState(false);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const [settingsSearch, setSettingsSearch] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('zenixmind-theme') || 'Dark');
  const [accent, setAccent] = useState(() => localStorage.getItem('zenixmind-accent') || 'Pink');
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem('zenixmind-notifications') || '{}'); } catch { return {}; } });
  const [connectedIntegrations, setConnectedIntegrations] = useState<Array<{ id: string; provider: string; provider_username: string; display_name: string; avatar_url?: string; connected_at: string }>>([]);
  const [connectedToolsLoading, setConnectedToolsLoading] = useState(true);
  const [connectedToolsBusy, setConnectedToolsBusy] = useState(false);
  const [githubConnectionReady, setGithubConnectionReady] = useState(false);
  const [connectedToolsNotice, setConnectedToolsNotice] = useState('');

  const loadMemories = useCallback(async () => {
    if (!user?.id) { setMemories([]); setMemoryLoading(false); return; }
    setMemoryLoading(true);
    const { data, error } = await getSupabase()
      .from('memories')
      .select('id,memory,category,source,created_at,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) setMemoryNotice('Could not load your memories.');
    else setMemories((data || []) as typeof memories);
    setMemoryLoading(false);
  }, [user?.id]);

  useEffect(() => { void loadMemories(); }, [loadMemories]);

  const loadConnectedTools = useCallback(async () => {
    if (!user?.id) { setConnectedIntegrations([]); setConnectedToolsLoading(false); return; }
    setConnectedToolsLoading(true);
    try {
      const response = await chatApiFetch('/api/chat?action=connected-tools');
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not load connected tools.');
      setConnectedIntegrations(Array.isArray(payload.integrations) ? payload.integrations : []);
      setGithubConnectionReady(payload.available?.github === true);
    } catch (error: any) {
      setConnectedToolsNotice(error?.message || 'Could not load connected tools.');
    } finally {
      setConnectedToolsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void loadConnectedTools(); }, [loadConnectedTools]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('connection');
    if (!result?.startsWith('github-')) return;
    setConnectedToolsNotice(result === 'github-success'
      ? 'GitHub is connected. You can now use its public repository tools in chat.'
      : 'GitHub could not be connected. Check the OAuth setup and try again.');
    params.delete('connection');
    params.delete('settings');
    params.delete('reason');
    const query = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
    if (result === 'github-success') void loadConnectedTools();
  }, [loadConnectedTools]);

  const connectGitHub = async () => {
    setConnectedToolsBusy(true);
    setConnectedToolsNotice('');
    try {
      const response = await chatApiFetch('/api/chat?action=connected-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', provider: 'github' })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.authorizationUrl) throw new Error(payload.error || 'Could not start GitHub authorization.');
      window.location.assign(payload.authorizationUrl);
    } catch (error: any) {
      setConnectedToolsNotice(error?.message || 'Could not connect GitHub.');
      setConnectedToolsBusy(false);
    }
  };

  const disconnectGitHub = async () => {
    if (!window.confirm('Disconnect GitHub from ZenixMind?')) return;
    setConnectedToolsBusy(true);
    setConnectedToolsNotice('');
    try {
      const response = await chatApiFetch('/api/chat?action=connected-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', provider: 'github' })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not disconnect GitHub.');
      setConnectedIntegrations(items => items.filter(item => item.provider !== 'github'));
      setConnectedToolsNotice('GitHub has been disconnected.');
    } catch (error: any) {
      setConnectedToolsNotice(error?.message || 'Could not disconnect GitHub.');
    } finally {
      setConnectedToolsBusy(false);
    }
  };

  const savePref = (key: string, val: string) => localStorage.setItem(key, val);

  const addMemory = async () => {
    const value = newMemory.trim();
    if (!value || !user?.id) return;
    setSavingMemory(true);
    setMemoryNotice('');
    const { data, error } = await getSupabase()
      .from('memories')
      .insert({ user_id: user.id, memory: value, category: newCategory, source: 'user' })
      .select('id,memory,category,source,created_at,updated_at')
      .single();
    if (error) setMemoryNotice(error.message || 'Could not save memory.');
    else {
      setMemories((prev) => [data as typeof memories[number], ...prev]);
      setNewMemory('');
      setMemoryNotice('Memory saved.');
    }
    setSavingMemory(false);
  };

  const updateMemory = async (id: string, value: string) => {
    const next = value.trim();
    if (!next) return;
    const { data, error } = await getSupabase()
      .from('memories')
      .update({ memory: next })
      .eq('id', id)
      .select('id,memory,category,source,created_at,updated_at')
      .single();
    if (error) setMemoryNotice('Could not update memory.');
    else setMemories((prev) => prev.map((item) => item.id === id ? data as typeof item : item));
  };

  const deleteMemory = async (id: string) => {
    if (!window.confirm('Delete this memory?')) return;
    const { error } = await getSupabase().from('memories').delete().eq('id', id);
    if (error) setMemoryNotice('Could not delete memory.');
    else {
      setMemories((prev) => prev.filter((item) => item.id !== id));
      setMemoryNotice('Memory deleted.');
    }
  };

  const clearMemories = async () => {
    if (!user?.id || !memories.length || !window.confirm('Delete all saved memories?')) return;
    const { error } = await getSupabase().from('memories').delete().eq('user_id', user.id);
    if (error) setMemoryNotice('Could not clear memories.');
    else {
      setMemories([]);
      setMemoryNotice('All memories deleted.');
    }
  };

  const handleExportData = async () => {
    setExporting(true); setNotice('');
    try {
      const response = await chatApiFetch('/api/chat?export=1');
      let exportData: any = {};
      if (response.ok) exportData = await response.json();
      else {
        const chats = localStorage.getItem('zenixmind_chats') || '[]';
        const msgs = localStorage.getItem('zenixmind_messages') || '{}';
        exportData = { exportedAt: new Date().toISOString(), conversations: JSON.parse(chats), messages: JSON.parse(msgs) };
      }
      exportData.memories = memories;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `zenixmind-workspace-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
      URL.revokeObjectURL(url);
      setNotice('Workspace data exported successfully.');
    } catch { setNotice('Failed to export data.'); }
    finally { setExporting(false); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to clear all conversations?')) return;
    try {
      const response = await chatApiFetch('/api/chat', { method: 'DELETE' });
      if (!response.ok) throw new Error(`Conversation deletion failed (${response.status}).`);
      localStorage.removeItem('zenixmind_chats');
      localStorage.removeItem('zenixmind_messages');
      onClearChats();
      setNotice('All conversations cleared.');
    } catch { setNotice('Error clearing conversations.'); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex h-dvh w-full items-stretch justify-center bg-[#09090b] animate-in fade-in duration-200">
      <div className="flex h-dvh w-full overflow-hidden border-0 bg-[#0b0b0d]">
        <aside className="hidden w-[276px] shrink-0 flex-col border-r border-white/[.07] bg-[#09090b] px-4 py-5 md:flex">
          <div className="mb-5 flex items-center gap-3 px-2"><BrandMark size={30}/><div><div className="text-sm font-semibold text-zinc-100">Settings</div><div className="text-[10px] text-zinc-600">Manage your ZenixMind</div></div></div>
          <label className="mb-5 flex h-10 items-center gap-2 rounded-xl border border-white/[.08] bg-[#121215] px-3 text-zinc-500"><Search size={14}/><input value={settingsSearch} onChange={(e)=>setSettingsSearch(e.target.value)} placeholder="Search settings" className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"/></label>
          <nav aria-label="Settings navigation" className="min-h-0 flex-1 space-y-5 overflow-y-auto text-xs">
            {[
              {group:'My ZenixMind',items:[['AI defaults','settings-ai-defaults'],['Personalization','settings-personalization'],['Memory','settings-memory'],['Plugins','settings-plugins']]},
              {group:'Account',items:[['Workspace','settings-workspace'],['Upgrade plan','settings-upgrade'],['Usage and limits','settings-usage'],['Trusted contact','settings-trusted'],['Parental controls','settings-parental'],['Email','settings-email']]},
              {group:'Appearance',items:[['Appearance','settings-appearance'],['Accent color','settings-accent']]},
              {group:'Preferences',items:[['General','settings-general'],['Notifications','settings-notifications'],['Voice','settings-voice']]},
              {group:'Security and privacy',items:[['Safety','settings-safety'],['Security and login','settings-security'],['Remote control','settings-remote'],['Storage','settings-storage'],['Privacy center','settings-privacy'],['Data controls','settings-data'],['Ads controls','settings-ads']]},
              {group:'Support',items:[['Report bug','settings-report'],['About','settings-about']]}
            ].map(({group,items}) => {
              const shown=items.filter(([label])=>!settingsSearch||label.toLowerCase().includes(settingsSearch.toLowerCase())||group.toLowerCase().includes(settingsSearch.toLowerCase()));
              return shown.length?<div key={group}><div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[.17em] text-zinc-600">{group}</div>{shown.map(([label,id])=><a key={id} href={'#'+id} className="block rounded-lg px-3 py-2 text-[11px] text-zinc-400 transition hover:bg-white/[.06] hover:text-white">{label}</a>)}</div>:null;
            })}
          </nav>
          <div className="mt-4 border-t border-white/[.07] pt-3"><div className="mb-2 text-[10px] text-zinc-600">ZenixMind · Settings</div><button type="button" onClick={async()=>{await getSupabase().auth.signOut();window.location.assign('/login');}} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] text-rose-300 hover:bg-rose-500/10">Log out</button></div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-white/[.06] px-6 py-4">
            <div><h2 className="text-[15px] font-semibold tracking-tight text-zinc-100">Settings</h2><p className="mt-1 text-[11px] text-zinc-500">Control how ZenixMind works and how your data is handled.</p></div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-[#1c1c1f] hover:text-zinc-200"><X size={16} /></button>
          </header>
          <div className="border-b border-white/[.06] px-4 py-2 md:hidden">
            <input value={settingsSearch} onChange={(e)=>setSettingsSearch(e.target.value)} placeholder="Search settings" className="mb-2 w-full rounded-xl border border-white/[.08] bg-[#141417] px-3 py-2.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-600"/>
            <nav aria-label="Mobile settings navigation" className="grid max-h-28 grid-cols-2 gap-1.5 overflow-y-auto pb-1">{[['Online Search','settings-online-search'],['AI defaults','settings-ai-defaults'],['Temporary Chat','settings-ai-defaults'],['Personalization','settings-personalization'],['Memory','settings-memory'],['Plugins','settings-plugins'],['Workspace','settings-workspace'],['Plan','settings-upgrade'],['Usage','settings-usage'],['Appearance','settings-appearance'],['Notifications','settings-notifications'],['Voice','settings-voice'],['Safety','settings-safety'],['Security','settings-security'],['Storage','settings-storage'],['Privacy','settings-privacy'],['Data controls','settings-data'],['Support','settings-report'],['About','settings-about']].map(([label,id])=><a key={id} href={'#'+id} className="rounded-lg border border-white/[.08] px-3 py-2 text-center text-[10px] text-zinc-400 hover:bg-white/[.06]">{label}</a>)}</nav>
          </div>
          <div id="settings-general" className="min-h-0 flex-1 space-y-7 overflow-y-auto px-3 py-5 text-xs sm:px-8 sm:py-8"><div className="mx-auto w-full max-w-5xl space-y-7">
            <div id="settings-shortcuts" className="scroll-mt-5 rounded-2xl border border-white/[.07] bg-[#111114] p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200 mb-2.5"><Keyboard size={15} className="text-amber-400" /><span>Power User Keyboard Shortcuts</span></div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]"><span className="text-zinc-400">Focus chat input</span><kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘K / Ctrl+K</kbd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]"><span className="text-zinc-400">Start new chat</span><kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘N / Ctrl+N</kbd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]"><span className="text-zinc-400">Toggle Online Search</span><kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘⇧S / Ctrl+Shift+S</kbd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]"><span className="text-zinc-400">Toggle Deep Think</span><kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘⇧D / Ctrl+Shift+D</kbd></div>
              </div>
            </div>

            <section id="settings-online-search" className="scroll-mt-5 rounded-2xl border border-white/[.07] bg-[#111114] p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0"><h3 className="text-sm font-semibold text-zinc-100">Online Search</h3><p className="mt-1 text-[11px] leading-5 text-zinc-500">Allow ZenixMind to look up current information and include source links. This requires the server search provider to be configured.</p></div>
                <button type="button" role="switch" aria-checked={webSearch} onClick={() => onWebSearchChange(!webSearch)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${webSearch ? 'bg-cyan-500' : 'bg-zinc-700'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${webSearch ? 'translate-x-[22px]' : 'translate-x-0.5'}`} /></button>
              </div>
              <p className="mt-3 text-[10px] text-zinc-600">{webSearch ? 'Online Search is enabled for new messages.' : 'Online Search is off. You can still use explicit search commands.'}</p>
            </section>

            <section id="settings-ai-defaults" className="scroll-mt-5 rounded-2xl border border-white/[.07] bg-[#111114] p-5">
              <h3 className="text-sm font-semibold text-zinc-100">AI defaults</h3>
              <div className="mt-3 flex items-center justify-between gap-4 border-b border-white/[.06] pb-3">
                <div className="min-w-0"><p className="text-xs font-medium text-zinc-200">Default thinking mode</p><p className="mt-1 text-[11px] text-zinc-500">Choose whether new chats start in Quick mode or Think harder.</p></div>
                <select value={deepThink ? 'deep' : 'quick'} onChange={(e) => onDeepThinkChange(e.target.value === 'deep')} className="shrink-0 rounded-xl border border-white/[.08] bg-[#17171a] px-3 py-2 text-xs text-zinc-200"><option value="quick">Quick</option><option value="deep">Think harder</option></select>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="min-w-0"><p className="text-xs font-medium text-zinc-200">Temporary Chat</p><p className="mt-1 text-[11px] text-zinc-500">Do not save new messages or chat attachments to history or My stuff while this is enabled.</p></div>
                <button type="button" role="switch" aria-checked={temporaryChat} onClick={() => onTemporaryChatChange(!temporaryChat)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${temporaryChat ? 'bg-cyan-500' : 'bg-zinc-700'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${temporaryChat ? 'translate-x-[22px]' : 'translate-x-0.5'}`} /></button>
              </div>
            </section>

            <div id="settings-personalization" className="scroll-mt-5 divide-y divide-white/[.06] rounded-2xl border border-white/[.07] bg-[#111114] px-5">
              <div className="flex items-center justify-between py-4">
                <div><div className="text-xs font-medium text-zinc-200">Continuous Context Memory</div><div className="text-[11px] text-zinc-500">Allow ZenixMind to use saved memories across conversations.</div></div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={memory} onChange={(e) => { setMemory(e.target.checked); savePref('zenixmind-memory', e.target.checked ? 'on' : 'off'); }} className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-[#202024] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-white peer-checked:after:translate-x-full peer-checked:after:bg-black"></div>
                </label>
              </div>

              <div id="settings-memory" className="scroll-mt-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div><div className="text-xs font-medium text-zinc-200">Saved Memories</div><div className="text-[11px] text-zinc-500">Facts and preferences you explicitly want ZenixMind to remember.</div></div>
                  <span className="rounded-full bg-white/[.05] px-2 py-1 text-[10px] text-zinc-500">{memories.length}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <input value={newMemory} onChange={(e) => setNewMemory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void addMemory(); }} placeholder="e.g. Prefer concise answers" className="min-w-0 flex-1 rounded-xl border border-white/[.08] bg-[#0b0b0d] px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/[.2]" />
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="rounded-xl border border-white/[.08] bg-[#17171a] px-2 text-xs text-zinc-300 outline-none">
                    <option value="general">General</option><option value="preferences">Preferences</option><option value="projects">Projects</option><option value="work">Work</option><option value="personal">Personal</option>
                  </select>
                  <button type="button" disabled={savingMemory || !newMemory.trim()} onClick={() => void addMemory()} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-black disabled:opacity-40"><Plus size={15} /></button>
                </div>
                <div className="mt-3 space-y-2">
                  {memoryLoading ? <div className="rounded-xl bg-[#0b0b0d] p-3 text-[11px] text-zinc-600">Loading memories…</div> :
                   memories.length === 0 ? <div className="rounded-xl border border-dashed border-white/[.07] p-4 text-center text-[11px] text-zinc-600">No saved memories yet. Add one above.</div> :
                   memories.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/[.06] bg-[#0b0b0d] p-3">
                      <div className="flex items-start gap-2">
                        <input defaultValue={item.memory} onBlur={(e) => { if (e.target.value.trim() !== item.memory) void updateMemory(item.id, e.target.value); }} className="min-w-0 flex-1 bg-transparent text-xs text-zinc-300 outline-none" />
                        <button type="button" onClick={() => void deleteMemory(item.id)} className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:bg-red-500/10 hover:text-red-300" aria-label="Delete memory"><Trash2 size={13} /></button>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-700"><span>{item.category}</span><span>{item.source === 'assistant' ? 'Added by ZenixMind' : 'Added by you'}</span></div>
                    </div>
                  ))}
                </div>
                {memories.length > 0 && <button type="button" onClick={() => void clearMemories()} className="mt-3 text-[10px] text-red-300/80 hover:text-red-200">Delete all memories</button>}
                {memoryNotice && <div className="mt-2 text-[10px] text-zinc-500">{memoryNotice}</div>}
              </div>

              <div className="flex items-center justify-between py-4">
                <div><div className="text-xs font-medium text-zinc-200">Response Detail</div><div className="text-[11px] text-zinc-500">Default answer length & depth.</div></div>
                <select value={length} onChange={(e) => { setLength(e.target.value); savePref('zenixmind-response-length', e.target.value); }} className="rounded-xl border border-white/[.08] bg-[#17171a] px-3 py-1.5 text-xs text-zinc-200 outline-none"><option value="Adaptive">Adaptive</option><option value="Concise">Concise & Direct</option><option value="Detailed">Detailed</option><option value="Thorough">Thorough & Comprehensive</option></select>
              </div>

              <div className="flex items-center justify-between gap-3 py-4">
                <div><div className="text-xs font-medium text-zinc-200">Preferred language</div><div className="text-[11px] text-zinc-500">Choose the language ZenixMind should normally answer in.</div></div>
                <select value={language} onChange={(e) => { setLanguage(e.target.value); savePref('zenixmind-language', e.target.value); }} className="max-w-[48%] rounded-xl border border-white/[.08] bg-[#17171a] px-3 py-1.5 text-xs text-zinc-200 outline-none"><option>Auto</option><option>English</option><option>Pidgin English</option><option>Yoruba</option><option>Igbo</option><option>Hausa</option><option>French</option><option>Spanish</option><option>Arabic</option></select>
              </div>

              <div className="flex items-center justify-between py-4">
                <div><div className="text-xs font-medium text-zinc-200">Persona & Tone</div><div className="text-[11px] text-zinc-500">Adjust the conversational voice.</div></div>
                <select value={style} onChange={(e) => { setStyle(e.target.value); savePref('zenixmind-personality', e.target.value); }} className="rounded-xl border border-white/[.08] bg-[#17171a] px-3 py-1.5 text-xs text-zinc-200 outline-none"><option value="Balanced">Balanced</option><option value="Professional">Professional & Analytical</option><option value="Friendly">Friendly & Enthusiastic</option><option value="Direct">Direct & Concise</option><option value="Creative">Creative & Expressive</option></select>
              </div>

              <div className="py-4">
                <div className="text-xs font-medium text-zinc-200">Custom System Instructions</div><div className="text-[11px] text-zinc-500 mb-2">Special instructions injected into all AI model prompts:</div>
                <textarea value={customInstructions} onChange={(e) => { setCustomInstructions(e.target.value); savePref('zenixmind-custom-instructions', e.target.value); }} placeholder="e.g. You are assisting a lead engineer. Prefer TypeScript code with explanations, skip boilerplate..." rows={3} className="w-full rounded-xl border border-white/[.08] bg-[#0b0b0d] p-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/[.2]" />
              </div>
            </div>

            <section id="settings-appearance" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="mb-1 text-sm font-semibold text-zinc-100">Appearance</h3><p className="mb-3 text-[11px] text-zinc-500">Choose how ZenixMind looks on this device.</p><div className="flex items-center justify-between border-b border-white/[.06] py-3"><span className="text-zinc-300">Theme</span><select value={theme} onChange={e=>{setTheme(e.target.value);savePref('zenixmind-theme',e.target.value);}} className="rounded-xl border border-white/[.1] bg-[#1a1a1e] px-3 py-2 text-xs text-zinc-200"><option>System (Default)</option><option>Light</option><option>Dark</option></select></div><div id="settings-accent" className="flex items-center justify-between py-3"><span className="text-zinc-300">Accent color</span><select value={accent} onChange={e=>{setAccent(e.target.value);savePref('zenixmind-accent',e.target.value);}} className="rounded-xl border border-white/[.1] bg-[#1a1a1e] px-3 py-2 text-xs text-zinc-200">{['Blue','Cyan','Green','Lime','Yellow','Orange','Pink','Magenta','Purple','White'].map(v=><option key={v}>{v}</option>)}</select></div></section>
            <section id="settings-notifications" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="mb-1 text-sm font-semibold text-zinc-100">Notifications</h3><p className="mb-3 text-[11px] text-zinc-500">In-app notification preferences saved on this device.</p>{['Group chats','Health','Library','Marketing','Personalized tips','Projects','Responses','Tasks','Usage'].map(name=><label key={name} className="flex items-center justify-between border-b border-white/[.05] py-3 last:border-0"><span className="text-xs text-zinc-300">{name}</span><input type="checkbox" checked={notificationPrefs[name]??true} onChange={e=>{const next={...notificationPrefs,[name]:e.target.checked};setNotificationPrefs(next);savePref('zenixmind-notifications',JSON.stringify(next));}} className="h-4 w-4 accent-white"/></label>)}</section>
            <section id="settings-voice" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="mb-1 text-sm font-semibold text-zinc-100">Voice</h3><p className="mb-3 text-[11px] text-zinc-500">Voice conversations open in the dedicated Voice workspace.</p><a href="/assistant/voice" className="inline-flex items-center gap-2 rounded-xl border border-white/[.1] px-3 py-2 text-xs text-zinc-200">Open voice workspace <ExternalLink size={12}/></a></section>
            <section id="settings-plugins" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-sm font-semibold text-zinc-100">Connected tools</h3><p className="mt-1 max-w-xl text-[11px] leading-5 text-zinc-500">Authorize external services so ZenixMind can use them when you explicitly ask. Each connection can be disconnected at any time.</p></div>
                <button type="button" onClick={() => void loadConnectedTools()} disabled={connectedToolsLoading || connectedToolsBusy} className="rounded-lg border border-white/[.1] px-3 py-2 text-[11px] text-zinc-300 disabled:opacity-50">Refresh</button>
              </div>
              <div className="mt-4 rounded-xl border border-white/[.07] bg-[#0b0b0d] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black text-lg font-bold">⌘</div>
                    <div className="min-w-0"><div className="text-xs font-semibold text-zinc-100">GitHub</div><div className="text-[11px] text-zinc-500">Read-only access to your public repositories</div></div>
                  </div>
                  {#if connectedIntegrations.some(item => item.provider === 'github')}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300">Connected</span>
                      <button type="button" onClick={() => void disconnectGitHub()} disabled={connectedToolsBusy} className="rounded-lg border border-white/[.1] px-3 py-2 text-[11px] text-zinc-300 disabled:opacity-50">Disconnect</button>
                    </div>
                  {:else}
                    <button type="button" onClick={() => void connectGitHub()} disabled={!githubConnectionReady || connectedToolsBusy || connectedToolsLoading} className="rounded-lg bg-white px-3.5 py-2 text-[11px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">{connectedToolsBusy ? 'Opening…' : 'Connect GitHub'}</button>
                  {/if}
                </div>
                {#if connectedIntegrations.some(item => item.provider === 'github')}
                  <div className="mt-3 border-t border-white/[.06] pt-3 text-[11px] text-zinc-400">
                    Connected account: <span className="text-zinc-200">{connectedIntegrations.find(item => item.provider === 'github')?.display_name || connectedIntegrations.find(item => item.provider === 'github')?.provider_username}</span>
                  </div>
                  <div className="mt-3 rounded-lg bg-white/[.035] p-3 text-[11px] leading-5 text-zinc-400">
                    Try these commands in chat:
                    <div className="mt-1 font-mono text-zinc-200">/github repos</div>
                    <div className="font-mono text-zinc-200">/github search portfolio</div>
                    <div className="font-mono text-zinc-200">/github read owner/repository</div>
                  </div>
                {:else}
                  <p className="mt-3 border-t border-white/[.06] pt-3 text-[11px] leading-5 text-zinc-500">ZenixMind requests only the GitHub <span className="text-zinc-300">read:user</span> permission. The first version can list, search and read public repositories; it cannot edit code, create issues or access private repositories.</p>
                  {#if !githubConnectionReady}
                    <p className="mt-2 text-[11px] text-amber-300/80">GitHub OAuth is not configured on the server yet. Add the required GitHub OAuth settings in Vercel to enable connection.</p>
                  {/if}
                {/if}
              </div>
              {#if connectedToolsLoading}<p className="mt-3 text-[11px] text-zinc-500">Loading connected tools…</p>{/if}
              {#if connectedToolsNotice}<p className="mt-3 rounded-lg bg-white/[.05] p-3 text-[11px] text-zinc-300">{connectedToolsNotice}</p>{/if}
              <p className="mt-4 text-[10px] leading-5 text-zinc-600">Plugins and additional services will appear here only when their authorization and data-protection flows are implemented.</p>
            </section>
            <section id="settings-workspace" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Workspace</h3><p className="mt-1 text-[11px] text-zinc-500">Signed in as {user?.email || 'Account email unavailable'}</p></section>
            <section id="settings-upgrade" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Upgrade plan</h3><a href="/pricing" className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black">View plans</a></section>
            <section id="settings-usage" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Usage and limits</h3><a href="/dashboard" className="mt-3 inline-flex rounded-xl border border-white/[.1] px-3 py-2 text-xs text-zinc-200">Open dashboard</a></section>
            <section id="settings-trusted" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Trusted contact</h3><p className="mt-1 text-[11px] text-zinc-500">Not currently configured in ZenixMind.</p></section>
            <section id="settings-parental" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Parental controls</h3><p className="mt-1 text-[11px] text-zinc-500">Not currently available in ZenixMind.</p></section>
            <section id="settings-email" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Email</h3><p className="mt-1 text-xs text-zinc-200">{user?.email || 'Account email unavailable'}</p></section>
            <section id="settings-safety" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Safety</h3><p className="mt-1 text-[11px] text-zinc-500">Service-level safety controls are applied automatically.</p></section>
            <section id="settings-security" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Security and login</h3><p className="mt-1 text-[11px] text-zinc-500">Authentication is managed by your connected sign-in provider.</p></section>
            <section id="settings-remote" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Remote control</h3><p className="mt-1 text-[11px] text-zinc-500">Not currently available in ZenixMind.</p></section>
            <section id="settings-storage" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Storage</h3><a href="/assistant?view=library" className="mt-3 inline-flex rounded-xl border border-white/[.1] px-3 py-2 text-xs text-zinc-200">Open My stuff</a></section>
            <section id="settings-privacy" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Privacy center</h3><p className="mt-1 text-[11px] text-zinc-500">Export and clear workspace data using the controls below.</p></section>
            <section id="settings-ads" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Ads controls</h3><p className="mt-1 text-[11px] text-zinc-500">ZenixMind does not currently expose advertising preferences.</p></section>
            <section id="settings-report" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">Report bug</h3><p className="mt-1 text-[11px] text-zinc-500">Use in-chat response feedback to report an issue for now.</p></section>
            <section id="settings-about" className="scroll-mt-6 rounded-2xl border border-white/[.08] bg-[#111114] p-5"><h3 className="text-sm font-semibold text-zinc-100">About ZenixMind</h3><p className="mt-1 text-[11px] text-zinc-500">ZenixMind · AI workspace</p></section>
            <div className="space-y-2 pt-2">
              <button type="button" onClick={handleExportData} disabled={exporting} className="flex w-full items-center justify-between rounded-xl border border-white/[.08] bg-[#121215] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-[#18181c] transition-colors"><span>Export workspace data & memories</span><Download size={14} className="text-zinc-400" /></button>
              <button type="button" onClick={handleDeleteAll} className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[.05] px-4 py-2.5 text-xs font-medium text-red-300 hover:bg-red-500/10 transition-colors"><span>Clear chat history</span><Trash2 size={14} /></button>
            </div>
            {notice && <p className="rounded-lg bg-white/[.05] p-2 text-center text-[11px] text-zinc-300">{notice}</p>}
          </div></div>
        </div>
      </div>
    </div>
  );
}

// Compact, Unified Floating Chat Input matching the exact Grok / ZenixMind mobile & desktop composer
interface CompactFloatingComposerProps {
  value: string;
  setValue: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onOpenVoice: () => void;
  onCloseVoice?: () => void;
  voiceOpen?: boolean;
  busy: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  webSearch: boolean;
  setWebSearch: (fn: (v: boolean) => boolean) => void;
  deepThink: boolean;
  setDeepThink: (fn: (v: boolean) => boolean) => void;
  deepResearch: boolean;
  setDeepResearch: (fn: (v: boolean) => boolean) => void;
  onDictate: () => void;
  isListening: boolean;
  dictationError?: string;
  onAttachFile: (file: File) => void;
  attachmentName?: string;
  onClearAttachment: () => void;
}

export const CompactFloatingComposer = React.forwardRef<
  HTMLTextAreaElement,
  CompactFloatingComposerProps
>(function CompactFloatingComposer(
  {
    value,
    setValue,
    onSend,
    onStop,
    onOpenVoice,
    onCloseVoice,
    voiceOpen = false,
    busy,
    selectedModel,
    onSelectModel,
    webSearch,
    setWebSearch,
    deepThink,
    setDeepThink,
    deepResearch,
    setDeepResearch,
    onDictate,
    isListening,
    dictationError,
    onAttachFile,
    attachmentName,
    onClearAttachment
  },
  textareaRef
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [activeCommandIndex, setActiveCommandIndex] = useState(-1);
  const commandSuggestions = getCommandSuggestions(value);
  const plusRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chooseCommand = (trigger: string) => {
    setValue(`${trigger} `);
    setActiveCommandIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (commandSuggestions.length && e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveCommandIndex((current) => (current + 1) % commandSuggestions.length);
      return;
    }
    if (commandSuggestions.length && e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveCommandIndex((current) => current <= 0 ? commandSuggestions.length - 1 : current - 1);
      return;
    }
    if (commandSuggestions.length && e.key === 'Tab') {
      e.preventDefault();
      chooseCommand(commandSuggestions[Math.max(0, activeCommandIndex)].trigger);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !busy) onSend();
    }
  };

  const hasText = Boolean(value.trim());

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-0">
      {/* File Attachment Pill */}
      {attachmentName && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-xl border border-white/[.1] bg-[#1a1a1d] px-3 py-1.5 text-xs text-zinc-200 shadow-md animate-in fade-in duration-150">
          <Paperclip size={13} className="text-zinc-400" />
          <span className="truncate max-w-[220px] font-medium">{attachmentName}</span>
          <button onClick={onClearAttachment} className="text-zinc-500 hover:text-zinc-200">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-[28px] border border-white/[.1] bg-[#18181b] p-3 sm:p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-colors focus-within:border-white/[.2]">
        {/* Separate mobile inputs for camera capture, photo selection, and files. */}
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onAttachFile(file); e.currentTarget.value = ''; }} />
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onAttachFile(file); e.currentTarget.value = ''; }} />
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,.json,.js,.ts,.tsx,.py,.zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAttachFile(file);
            e.currentTarget.value = '';
          }}
        />

        {/* Command suggestions */}
        {commandSuggestions.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 z-40 mb-2 max-h-72 overflow-y-auto rounded-2xl border border-white/[.1] bg-[#111114] p-1.5 shadow-2xl" role="listbox" aria-label="Chat commands">
            {commandSuggestions.map((command, index) => (
              <button key={command.id} type="button" role="option" aria-selected={activeCommandIndex === index}
                onMouseDown={(event) => event.preventDefault()} onClick={() => chooseCommand(command.trigger)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${activeCommandIndex === index ? 'bg-white/[.1]' : 'hover:bg-white/[.06]'}`}>
                <span className="min-w-0"><span className="block text-xs font-semibold text-zinc-100">{command.trigger} <span className="font-normal text-zinc-400">· {command.label}</span></span><span className="mt-0.5 block truncate text-[10px] text-zinc-500">{command.description}</span></span>
                <span className="shrink-0 text-[9px] uppercase tracking-wide text-zinc-600">{command.category}</span>
              </button>
            ))}
          </div>
        )}
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={Math.min(5, Math.max(1, value.split('\n').length))}
          placeholder="Ask anything"
          className="w-full resize-none bg-transparent px-2 sm:px-3 pt-1 text-base text-zinc-100 outline-none placeholder:text-zinc-400/90 max-h-36 font-normal tracking-[-0.01em]"
        />

        {isListening && (
          <div role="status" aria-live="polite" className="mb-2 flex items-center gap-2 rounded-xl border border-rose-400/15 bg-rose-500/[.07] px-3 py-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-400" />
            </span>
            <span className="text-[11px] font-medium text-rose-200">Listening — speak now</span>
            <span className="ml-auto flex h-5 items-center gap-[3px]" aria-hidden="true">
              {[0,1,2,3,4,5,6,7,8].map((bar) => <span key={bar} className="w-[2px] rounded-full bg-rose-300/80 animate-pulse" style={{ height: `${6 + ((bar * 7) % 12)}px`, animationDelay: `${bar * 75}ms` }} />)}
            </span>
            <button type="button" onClick={onDictate} className="ml-2 rounded-lg px-2 py-1 text-[10px] font-semibold text-rose-200 hover:bg-rose-400/10">Done</button>
          </div>
        )}
        {dictationError && <p role="alert" className="mb-2 px-2 text-[11px] text-rose-300">{dictationError}</p>}

        {/* Bottom Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5">
          {/* Left: Attachments and optional tools */}
          <div className="flex min-w-0 flex-wrap items-center gap-2 relative">
            {/* Plus Button with Menu */}
            <div ref={plusRef} className="relative">
              <button type="button" onClick={() => setPlusMenuOpen((prev) => !prev)}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/[.08] bg-[#29292d] text-zinc-100 shadow-sm transition-colors hover:border-white/[.16] hover:bg-[#35353a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                title="Add to message" aria-label="Add to message" aria-expanded={plusMenuOpen}>
                <Plus size={21} strokeWidth={2.1} />
              </button>

              {plusMenuOpen && (
                <div role="menu" aria-label="Add to message" className="absolute bottom-full left-0 mb-3 w-[min(292px,calc(100vw-2rem))] rounded-[22px] border border-white/[.09] bg-[#202023] p-2.5 shadow-[0_20px_60px_rgba(0,0,0,.62)] z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <button type="button" role="menuitem" onClick={() => { setPlusMenuOpen(false); cameraInputRef.current?.click(); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-zinc-100 hover:bg-white/[.07]"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/[.07]"><Camera size={18} /></span>Camera</button>
                  <button type="button" role="menuitem" onClick={() => { setPlusMenuOpen(false); photoInputRef.current?.click(); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-zinc-100 hover:bg-white/[.07]"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/[.07]"><Images size={18} /></span>Photos</button>
                  <button type="button" role="menuitem" onClick={() => { setPlusMenuOpen(false); fileInputRef.current?.click(); }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-zinc-100 hover:bg-white/[.07]"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/[.07]"><Paperclip size={18} /></span>Files</button>
                  <div className="my-2 h-px bg-white/[.07]" />

                  <button
                    type="button"
                    onClick={() => {
                      setDeepThink((v) => !v);
                      setPlusMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-zinc-200 hover:bg-[#27272a]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Brain size={14} className={deepThink ? 'text-purple-400' : 'text-zinc-400'} />
                      <span>Think harder</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${deepThink ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-500'}`}>
                      {deepThink ? 'ON' : 'OFF'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeepResearch((v) => !v);
                      setPlusMenuOpen(false);
                    }}
                    className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-zinc-200 hover:bg-[#27272a]"
                    aria-pressed={deepResearch}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe size={14} className={deepResearch ? 'text-cyan-300' : 'text-zinc-400'} />
                      <span>Deep Research</span>
                    </div>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${deepResearch ? 'bg-cyan-500/15 text-cyan-200' : 'text-zinc-500'}`}>
                      {deepResearch ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Indicator tags if Web Search or Deep Reasoning is active */}
            {deepThink && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
                <Brain size={10} /> Reasoning
              </span>
            )}
            {deepResearch && (
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                <Globe size={10} /> Deep Research
              </span>
            )}
          </div>

          {/* Right: Dictation Mic & Adaptive Speak/Send Pill */}
          <div className="flex items-center gap-2">
            {/* Dictation Mic Button */}
            <button
              type="button"
              onClick={onDictate}
              className={`grid h-9 w-9 place-items-center rounded-full border transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                isListening
                  ? 'bg-rose-500/[.12] border-rose-400/30 text-rose-300 shadow-[0_0_0_3px_rgba(244,63,94,0.06)]'
                  : 'bg-[#151518] border-white/[.1] text-zinc-300 hover:bg-[#202024] hover:border-white/[.18] hover:text-white'
              }`}
              title={isListening ? 'Listening for speech...' : 'Dictate speech to text'}
              aria-label={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
              aria-pressed={isListening}
            >
              {isListening ? <MicOff size={16} strokeWidth={2} /> : <Mic size={16} strokeWidth={2} />}
            </button>

            {/* Adaptive Action Pill:
                - Empty text: `|||| Speak` in white/off-white pill -> opens Voice experience
                - User types text: `↑ Send` in white pill -> sends prompt
                - Text cleared: returns to `|||| Speak`
            */}
            {busy ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-9 items-center gap-1.5 rounded-full border border-white/[.12] bg-[#242428] hover:bg-[#2d2d32] text-zinc-100 px-4 text-xs sm:text-sm font-medium shadow-sm transition-all"
                title="Stop generating"
                aria-label="Stop generating"
              >
                <span className="h-2.5 w-2.5 rounded-[3px] bg-zinc-100" />
                <span>Stop</span>
              </button>
            ) : hasText ? (
              <button
                type="button"
                onClick={onSend}
                className="flex h-9 items-center gap-1.5 rounded-full bg-white hover:bg-zinc-200 text-black px-4 text-xs sm:text-sm font-semibold shadow-sm transition-all"
                title="Send message (Enter)"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
                <span>Send</span>
              </button>
            ) : voiceOpen ? (
              <button
                type="button"
                onClick={onCloseVoice}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/[.1] bg-[#29292e] text-zinc-100 shadow-sm transition-all hover:bg-[#3a3a40] hover:text-white"
                title="Cancel voice"
                aria-label="Cancel voice"
              >
                <X size={17} strokeWidth={2.2} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenVoice}
                className="flex h-9 items-center gap-2 rounded-full bg-[#e4e4e7] hover:bg-white text-black px-4 text-xs sm:text-sm font-semibold shadow-sm transition-all"
                title="Speak with ZenixMind Voice"
                aria-label="Speak with ZenixMind Voice"
              >
                <div className="flex items-center gap-[2.5px] h-3.5" aria-hidden="true">
                  <span className="w-[2px] h-2 bg-black rounded-full" />
                  <span className="w-[2px] h-3.5 bg-black rounded-full" />
                  <span className="w-[2px] h-2.5 bg-black rounded-full" />
                  <span className="w-[2px] h-3 bg-black rounded-full" />
                </div>
                <span>Speak</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function SourceFavicon({ url, size = 32 }: { url: string; size?: number }) {
  const [attempt, setAttempt] = useState(0);
  const source = useMemo(() => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      const origin = parsed.origin;
      const host = parsed.hostname.replace(/^www\./, '');
      return { origin, host, candidates: [
        `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=64`,
        `${origin}/favicon.ico`
      ] };
    } catch { return null; }
  }, [url]);
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[.1] bg-[#242428]" style={{ width: size, height: size }}>
      {source && attempt < source.candidates.length ? (
        <img
          src={source.candidates[attempt]}
          alt={`${source.host} website logo`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain p-1"
          onError={() => setAttempt((value) => value + 1)}
        />
      ) : <Globe size={Math.max(14, Math.round(size * 0.48))} className="text-zinc-400" aria-hidden="true" />}
    </span>
  );
}

function getSourceDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return 'Website'; }
}

function ChatMessageItem({
  message,
  onRegenerate,
  onUpdateReaction,
  onShare
}: {
  message: Message;
  onRegenerate?: () => void;
  onUpdateReaction?: (update: Partial<Message>) => void;
  onShare?: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [liked, setLiked] = useState(message.liked || false);
  const [disliked, setDisliked] = useState(message.disliked || false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const feedbackDialogRef = useRef<HTMLElement>(null);
  const dislikeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!feedbackOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTarget = feedbackDialogRef.current?.querySelector<HTMLElement>('select, textarea, button');
    focusTarget?.focus();
    const handleFeedbackKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setFeedbackOpen(false); }
      if (event.key === 'Tab' && feedbackDialogRef.current) {
        const focusable = Array.from(feedbackDialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleFeedbackKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleFeedbackKeyDown);
      dislikeButtonRef.current?.focus();
    };
  }, [feedbackOpen]);

  useEffect(() => {
    setLiked(message.liked || false);
    setDisliked(message.disliked || false);
  }, [message.liked, message.disliked]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const handleLike = () => {
    setFeedbackOpen(false);
    setFeedbackSubmitted(false);
    const nextLiked = !liked;
    const nextDisliked = nextLiked ? false : disliked;
    setLiked(nextLiked);
    setDisliked(nextDisliked);
    onUpdateReaction?.({ liked: nextLiked, disliked: nextDisliked });
  };

  const handleDislike = () => {
    const nextDisliked = !disliked;
    if (nextDisliked) { setFeedbackType(''); setFeedbackDetails(''); setFeedbackOpen(true); setFeedbackSubmitted(false); }
    else setFeedbackOpen(false);
    const nextLiked = nextDisliked ? false : liked;
    setDisliked(nextDisliked);
    setLiked(nextLiked);
    onUpdateReaction?.({ liked: nextLiked, disliked: nextDisliked });
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 1.02;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleShare = async () => {
    if (!onShare || sharing) return;
    setSharing(true);
    try {
      await onShare();
      setShareFailed(false);
      setShareDone(true);
      window.setTimeout(() => setShareDone(false), 1800);
    } catch {
      setShareFailed(true);
      window.setTimeout(() => setShareFailed(false), 2200);
    } finally {
      setSharing(false);
    }
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-in fade-in duration-200">
        <div className="max-w-[92%] sm:max-w-[78%] rounded-[22px] rounded-br-[7px] bg-[#080d70] px-4 py-3.5 text-[15px] font-normal leading-[1.65] text-white whitespace-pre-wrap sm:px-5">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'assistant' && message.isStreaming && !message.content.trim()) {
    return null;
  }

  return (
    <div className="group flex min-w-0 animate-in fade-in duration-200">
      <div className="w-full min-w-0 text-[16px] leading-[1.75] text-zinc-100 sm:text-[16px]">
        {message.sources && message.sources.length > 0 && (
          <section className="mb-4 space-y-2" aria-label="Web search sources">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-zinc-500">
                <Globe size={13} /> Sources <span className="rounded-full bg-white/[.07] px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-400">{message.sources.length}</span>
              </div>
              <button type="button" onClick={() => setSourcesOpen(true)} className="text-[11px] font-medium text-zinc-400 underline-offset-4 hover:text-zinc-100 hover:underline" aria-label={`View all ${message.sources.length} sources`}>View details</button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {message.sources.map((src, i) => {
                const domain = getSourceDomain(src.url);
                return <a key={`${src.url}-inline-${i}`} href={src.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-start gap-3 rounded-2xl border border-white/[.08] bg-[#111114] p-3 transition-colors hover:border-white/[.16] hover:bg-[#17171b]">
                  <SourceFavicon url={src.url} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-medium text-zinc-500">{domain}</span>
                    <span className="mt-0.5 block text-xs font-semibold leading-5 text-zinc-200 line-clamp-2">{src.title || domain}</span>
                    {src.snippet && <span className="mt-1 block text-[11px] leading-4 text-zinc-500 line-clamp-2">{src.snippet}</span>}
                  </span>
                  <ExternalLink size={13} className="mt-0.5 shrink-0 text-zinc-600" aria-hidden="true" />
                </a>;
              })}
            </div>
            {sourcesOpen && (
              <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 backdrop-blur-[2px]" onClick={() => setSourcesOpen(false)}>
                <section role="dialog" aria-modal="true" aria-label="Web sources" className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border border-white/[.09] bg-[#171719] shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={(event) => event.stopPropagation()}>
                  <div className="flex justify-center pb-3 pt-3"><span className="h-1.5 w-14 rounded-full bg-zinc-500/70" /></div>
                  <div className="flex items-center justify-between px-5 pb-4"><div><h3 className="text-xl font-medium tracking-tight text-zinc-100">Sources</h3><p className="mt-1 text-xs text-zinc-500">{message.sources.length} websites referenced in this answer</p></div><button type="button" onClick={() => setSourcesOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-white/[.08]" aria-label="Close sources"><X size={18} /></button></div>
                  <div className="max-h-[calc(82vh-76px)] space-y-2 overflow-y-auto px-5 pb-8">
                    {message.sources.map((src, i) => {
                      const domain = getSourceDomain(src.url);
                      return <a key={`${src.url}-detail-${i}`} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 rounded-2xl border border-white/[.07] p-3 text-left transition-colors hover:bg-white/[.035]">
                        <SourceFavicon url={src.url} size={38} />
                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-zinc-200">{domain}</span><span className="mt-1 block text-sm font-medium leading-6 text-zinc-100">{src.title}</span>{src.snippet && <span className="mt-1 block text-xs leading-5 text-zinc-400">{src.snippet}</span>}</span>
                        <ExternalLink size={14} className="mt-1 shrink-0 text-zinc-500" />
                      </a>;
                    })}
                  </div>
                </section>
              </div>
            )}
          </section>
        )}

        <div className="relative">
          <MessageRenderer content={message.content} />
          {message.isStreaming && (
            <span className="ml-1 inline-block h-4 w-1.5 translate-y-[3px] rounded-full bg-amber-400 align-middle animate-pulse" />
          )}
        </div>

        {!message.isStreaming && message.content.trim() && (
          <div className="mt-4 flex items-center gap-1 pt-1 opacity-100">
            <button type="button" onClick={handleCopy} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[.06] hover:text-zinc-100" title={copied ? 'Copied' : 'Copy'} aria-label="Copy response">
              {copied ? <Check size={17} className="text-emerald-400" /> : <Copy size={17} />}
            </button>
            <button type="button" onClick={handleLike} className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${liked ? 'bg-white/[.08] text-white' : 'text-zinc-500 hover:bg-white/[.06] hover:text-zinc-100'}`} title="Like" aria-label="Like response" aria-pressed={liked}>
              <ThumbsUp size={19} strokeWidth={1.8} />
            </button>
            <button type="button" ref={dislikeButtonRef} onClick={handleDislike} className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${disliked ? 'bg-rose-500/[.1] text-rose-300' : 'text-zinc-500 hover:bg-white/[.06] hover:text-zinc-100'}`} title="Dislike" aria-label="Dislike response" aria-pressed={disliked}>
              <ThumbsDown size={19} strokeWidth={1.8} />
            </button>
            <button type="button" onClick={handleSpeak} className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${speaking ? 'bg-amber-400/[.1] text-amber-300' : 'text-zinc-500 hover:bg-white/[.06] hover:text-zinc-100'}`} title={speaking ? 'Stop listening' : 'Read aloud'} aria-label={speaking ? 'Stop reading response aloud' : 'Read response aloud'}>
              <Volume2 size={19} strokeWidth={1.8} />
            </button>
            {onShare && <button type="button" onClick={() => void handleShare()} disabled={sharing} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[.06] hover:text-zinc-100 disabled:opacity-50" title={shareFailed ? 'Sharing failed' : shareDone ? 'Link copied' : 'Share'} aria-label="Share response">
              {shareDone ? <Check size={18} /> : <Share2 size={18} />}
            </button>}
            <div className="relative">
              <button type="button" onClick={() => setMoreActionsOpen((open) => !open)} aria-label="More response actions" aria-haspopup="menu" aria-expanded={moreActionsOpen} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[.06] hover:text-zinc-100"><MoreVertical size={19} /></button>
              {moreActionsOpen && <><button type="button" aria-label="Close response actions" className="fixed inset-0 z-20 cursor-default" onClick={() => setMoreActionsOpen(false)} /><div role="menu" className="absolute bottom-10 right-0 z-30 min-w-44 rounded-xl border border-white/[.1] bg-[#202023] p-1.5 shadow-xl"><button type="button" role="menuitem" onClick={() => { setMoreActionsOpen(false); onRegenerate?.(); }} disabled={!onRegenerate} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs text-zinc-200 hover:bg-white/[.07] disabled:opacity-40"><RotateCcw size={14} />Regenerate response</button></div></>}
            </div>
            {feedbackSubmitted && <span role="status" className="ml-2 text-[11px] text-emerald-300">Thank you for your feedback</span>}
          </div>
        )}
        {feedbackOpen && (
          <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/65 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setFeedbackOpen(false); }}>
            <section ref={feedbackDialogRef} role="dialog" aria-modal="true" aria-labelledby="response-feedback-title" aria-describedby="response-feedback-description" tabIndex={-1} className="max-h-[82dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[28px] border border-white/[.1] bg-[#29292c] shadow-[0_-18px_70px_rgba(0,0,0,.5)] sm:rounded-[26px] animate-in slide-in-from-bottom-3 duration-200">
              <div className="flex min-h-12 items-center justify-center pt-1"><span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-white/20" /></div>
              <div className="flex items-center justify-between px-5 pb-4 pt-5 sm:px-7"><h3 id="response-feedback-title" className="text-lg font-semibold tracking-tight text-zinc-50">Share feedback</h3><button type="button" onClick={() => setFeedbackOpen(false)} aria-label="Close feedback" className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/[.08] hover:text-white"><X size={20} /></button></div>
              <form onSubmit={(event) => { event.preventDefault(); if (!feedbackType) return; setFeedbackSubmitted(true); setFeedbackOpen(false); }} className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:px-7">
                <label htmlFor="response-feedback-type" className="mb-1 block text-[11px] font-medium text-zinc-300">Issue</label>
                <select id="response-feedback-type" value={feedbackType} onChange={(event) => setFeedbackType(event.target.value)} required className="mb-4 h-14 w-full rounded-xl border border-white/[.16] bg-transparent px-4 text-[15px] text-zinc-100 outline-none focus:border-white/45">
                  <option value="" disabled className="bg-[#29292c]">Select an issue</option>
                  <option value="Visual is unhelpful or broken" className="bg-[#29292c]">Visual is unhelpful or broken</option>
                  <option value="Incorrect or incomplete" className="bg-[#29292c]">Incorrect or incomplete</option>
                  <option value="Not what I asked for" className="bg-[#29292c]">Not what I asked for</option>
                  <option value="Slow or buggy" className="bg-[#29292c]">Slow or buggy</option>
                  <option value="Style or tone" className="bg-[#29292c]">Style or tone</option>
                  <option value="Safety or legal concern" className="bg-[#29292c]">Safety or legal concern</option>
                  <option value="Other" className="bg-[#29292c]">Other</option>
                </select>
                <label htmlFor="response-feedback-details" className="sr-only">Share details (optional)</label>
                <textarea id="response-feedback-details" value={feedbackDetails} onChange={(event) => setFeedbackDetails(event.target.value)} placeholder="Share details (optional)" rows={5} className="mb-4 min-h-[150px] w-full resize-y rounded-xl border border-white/[.14] bg-transparent px-4 py-4 text-[15px] leading-6 text-zinc-100 outline-none placeholder:text-zinc-400 focus:border-white/35" />
                <p id="response-feedback-description" className="mb-5 text-[12px] leading-5 text-zinc-400">Tell us what went wrong so we can improve ZenixMind. Avoid including passwords or other sensitive information.</p>
                <button type="submit" disabled={!feedbackType} className="h-14 w-full rounded-full bg-zinc-100 text-[14px] font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/[.12] disabled:text-zinc-500">Submit</button>
              </form>
            </section>
          </div>
        )}
        {!message.isStreaming && message.content.trim() && (
          <p className="mt-3 text-[11px] leading-4 text-zinc-500">ZenixMind can make mistakes. Double-check important information.</p>
        )}
      </div>
    </div>
  );
}

function ImagesView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'templates'>('trending');
  const [showNotice, setShowNotice] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [dictationError, setDictationError] = useState('');
  const dictationBaseRef = useRef('');
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; prompt: string; url: string; title: string; mimeType?: string }>>([]);

  const trendingStyles = [
    {
      id: 'sketch',
      title: 'Sketch',
      prompt: 'A minimalist hand-drawn flower sketch with a small honeybee, clean black ink lines on soft off-white background',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: '80s',
      title: "'80s flashback",
      prompt: '1980s retro film portrait of a smiling woman with voluminous 80s perm hairstyle, dark sunglasses, pink mesh top and denim jacket, warm vintage film grain',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'stickers',
      title: 'Stickers',
      prompt: 'A vibrant collection of die-cut glossy vinyl stickers: kawaii black cat, cute potted succulent, and smiling cartoon icon with golden star sparkles',
      image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'caricature',
      title: 'Create a caricature',
      prompt: 'A highly detailed vibrant caricature illustration of a cheerful adventurer studying an anatomy notebook with Mount Fuji and cherry blossoms in background',
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'cyberpunk',
      title: 'Cyberpunk neon',
      prompt: 'Futuristic cyberpunk metropolis at midnight with glowing holographic neon billboards, reflective wet asphalt, high contrast cinematic volumetric lighting',
      image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'claymation',
      title: 'Claymation 3D',
      prompt: 'Charming tactile 3D claymation stop-motion miniature characters in a cozy handmade studio setting with soft warm lighting',
      image: 'https://images.unsplash.com/photo-1569317002804-ab77bcf1bce4?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'portrait',
      title: 'Studio Portrait',
      prompt: 'High-fashion editorial studio portrait with dramatic golden rim lighting, soft natural skin texture, and deep moody background',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'watercolor',
      title: 'Watercolor dream',
      prompt: 'Dreamy Japanese watercolor mountain landscape with misty pine forests, flying cranes, and delicate pastel turquoise washes',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const templateStyles = [
    {
      id: 'cinematic',
      title: 'Cinematic 35mm',
      prompt: 'A cinematic movie still shot on 35mm anamorphic lens with dramatic depth of field, atmospheric lighting, subtle film grain, and rich contrast',
      image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'anime',
      title: 'Anime Aesthetic',
      prompt: 'A vibrant hand-painted anime landscape with expressive clouds, lush green hills, atmospheric perspective, and beautiful cinematic light',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'isometric',
      title: '3D Isometric Room',
      prompt: 'A polished 3D isometric futuristic workstation with glowing screens, plants, desk accessories, soft volumetric lighting, and clean composition',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'fashion-editorial',
      title: 'Fashion Editorial',
      prompt: 'High-fashion editorial campaign photographed in a minimalist studio, dramatic directional lighting, premium styling, realistic skin texture, luxury magazine composition',
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'product',
      title: 'Product Showcase',
      prompt: 'Premium studio product photograph on a sculptural surface with soft reflections, controlled shadows, clean background, commercial lighting, and luxury advertising detail',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'architecture',
      title: 'Modern Architecture',
      prompt: 'Striking contemporary architecture photographed at blue hour, geometric lines, dramatic perspective, subtle interior glow, and editorial architectural photography',
      image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'nature',
      title: 'Nature Film',
      prompt: 'Epic natural landscape with layered mountains, mist, soft morning light, realistic atmospheric depth, cinematic color grading, and fine environmental detail',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'neon-city',
      title: 'Neon City',
      prompt: 'Futuristic night city street after rain, luminous signs reflected on wet pavement, atmospheric haze, cinematic depth, and detailed urban architecture',
      image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'minimal',
      title: 'Minimal Poster',
      prompt: 'Minimalist contemporary poster design with bold geometric forms, generous negative space, refined typography area, premium art-direction, and balanced composition',
      image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'food',
      title: 'Food Photography',
      prompt: 'Editorial food photography of an elegant plated dish, natural window light, rich textures, shallow depth of field, premium restaurant styling, and appetizing detail',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'travel',
      title: 'Travel Postcard',
      prompt: 'Dream travel destination photographed like a premium editorial postcard, beautiful architecture, local atmosphere, golden-hour light, realistic detail, and inviting composition',
      image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'portrait',
      title: 'Cinematic Portrait',
      prompt: 'Intimate cinematic portrait with natural expression, soft directional light, shallow depth of field, realistic skin texture, subtle film grain, and moody background',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const downloadGeneratedImage = async (img: { url: string; title: string; mimeType?: string }) => {
    try {
      const response = await fetch(img.url);
      if (!response.ok) throw new Error('Could not prepare this image for download.');
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      const extension = img.mimeType?.split('/')[1]?.replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '') || 'png';
      anchor.download = (img.title || 'zenixmind-image').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 48) + '.' + extension;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error: any) {
      setGenerationNotice(error?.message || 'Image download failed.');
    }
  };

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim() || generating) return;
    if (!user?.id) {
      setGenerationNotice('Sign in to generate and save images to your Library.');
      return;
    }
    setGenerating(true);
    setGenerationNotice('');
    try {
      const response = await chatApiFetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse.trim(), model: 'zimage', width: 1024, height: 1024 })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Image generation failed. Please try again.');
      }

      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      if (!mimeType.startsWith('image/') || !blob.size) {
        throw new Error('The image provider returned an invalid image.');
      }

      const previewUrl = URL.createObjectURL(blob);
      const generated = {
        id: 'gen-' + Date.now(),
        title: textToUse.slice(0, 30),
        prompt: textToUse.trim(),
        url: previewUrl,
        mimeType
      };
      setGeneratedImages((prev) => [generated, ...prev]);

      const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg';
      const storagePath = user.id + '/' + crypto.randomUUID() + '-generated.' + extension;
      const { error: uploadError } = await getSupabase().storage.from('library')
        .upload(storagePath, blob, { contentType: mimeType, upsert: false });
      if (uploadError) {
        setGenerationNotice('Image generated, but it could not be saved to your Library: ' + uploadError.message);
        return;
      }

      const { error: rowError } = await getSupabase().from('library_items').insert({
        user_id: user.id,
        file_name: generated.title + '.' + extension,
        mime_type: mimeType,
        storage_path: storagePath,
        size_bytes: blob.size,
        source: 'generated',
        prompt: generated.prompt
      });
      if (rowError) {
        await getSupabase().storage.from('library').remove([storagePath]);
        setGenerationNotice('Image generated, but it could not be saved to your Library: ' + rowError.message);
      }
    } catch (error: any) {
      setGenerationNotice(error?.message || 'Image generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDictate = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setPrompt(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const currentCards = activeTab === 'trending' ? trendingStyles : templateStyles;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#050506] text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[.04] shrink-0">
        <button
          type="button"
          onClick={() => navigate('/assistant')}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#18181b] text-zinc-300 hover:text-white hover:bg-[#27272a] transition-colors"
          aria-label="Back to chat"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-zinc-100">Images</h1>
        <div className="w-9" /> {/* Spacer for centered title */}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-28 space-y-4 max-w-4xl mx-auto w-full">
        {/* Banner Notice */}
        {showNotice && (
          <div className="relative flex items-start gap-3.5 rounded-2xl border border-white/[.06] bg-[#1a1a1d] p-4 shadow-lg animate-in fade-in duration-200">
            {/* Library Icon Pill */}
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[.08] text-zinc-300">
              <FolderClosed size={18} />
            </div>

            <div className="min-w-0 flex-1 pr-6">
              <h2 className="text-sm font-semibold text-zinc-100">
                Your generated images moved to Library
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-light">
                You can now find your generated images in the Library tab from the sidebar
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNotice(false)}
              className="absolute right-3.5 top-3.5 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {generationNotice && (
          <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-white/[.08] bg-[#141417] px-3 py-2.5 text-xs text-zinc-300">
            <span>{generationNotice}</span>
            <button type="button" onClick={() => setGenerationNotice('')} aria-label="Dismiss image notice" className="shrink-0 text-zinc-500 hover:text-white"><X size={14}/></button>
          </div>
        )}

        {/* Tab Controls: Trending / Templates */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('trending')}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'trending'
                ? 'bg-[#323236] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Trending
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'templates'
                ? 'bg-[#323236] text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Templates
          </button>
        </div>

        {/* Generated Image Result Card (if any generated) */}
        {generatedImages.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Recently Generated</span>
              <Link to="/assistant?view=library" className="text-xs text-amber-400 hover:underline">
                View in Library →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {generatedImages.map((img) => (
                <div key={img.id} className="group relative rounded-2xl overflow-hidden aspect-square border border-white/[.1] bg-[#121215]">
                  <img src={img.url} alt={img.prompt} className="h-full w-full object-cover group-hover:opacity-95 transition-opacity duration-200" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5">
                    <p className="min-w-0 truncate text-xs font-medium text-white">{img.prompt}</p>
                    <button type="button" onClick={() => void downloadGeneratedImage(img)} aria-label="Download generated image" title="Download image" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 bg-black/70 text-white hover:bg-white hover:text-black">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Style Cards Grid (2 Columns on Mobile, 4 Columns on Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {currentCards.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setPrompt(item.prompt);
                handleGenerate(item.prompt);
              }}
              className="group relative aspect-[4/5] w-full overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/[.06] bg-[#141417] cursor-pointer shadow-md transition-all hover:border-white/[.2]"
            >
              {/* Card Image */}
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Bottom Gradient Overlay for High-Contrast Text */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Title Label */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5">
                <span className="text-xs sm:text-sm font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {item.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Floating Prompt Capsule */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none pb-4 sm:pb-6 px-4 max-w-2xl mx-auto w-full">
        <div className="pointer-events-auto rounded-full border border-white/[.1] bg-[#18181b] px-3.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center gap-2.5 transition-all focus-within:border-white/[.25]">
          {/* Image Icon */}
          <ImageIcon size={18} className="text-zinc-400 shrink-0 ml-1" />

          {/* Text Input */}
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGenerate();
              }
            }}
            placeholder="Describe an image"
            className="min-w-0 flex-1 bg-transparent text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none font-normal"
          />

          {/* Dictate Button */}
          <button
            type="button"
            onClick={handleDictate}
            className={`grid h-8 w-8 place-items-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
              isListening ? 'bg-rose-500/[.12] border-rose-400/30 text-rose-300' : 'border-transparent bg-[#151518] text-zinc-300 hover:bg-[#202024] hover:border-white/[.12] hover:text-white'
            }`}
            title={isListening ? 'Listening for speech...' : 'Dictate prompt'}
            aria-label={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
            aria-pressed={isListening}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Generate / Send Arrow Button */}
          <button
            type="button"
            disabled={generating || !prompt.trim()}
            onClick={() => handleGenerate()}
            className="grid h-8 w-8 place-items-center rounded-full bg-[#27272a] text-zinc-300 hover:bg-white hover:text-black disabled:opacity-30 transition-all shrink-0"
            title="Generate image"
          >
            {generating ? (
              <Sparkles size={15} className="animate-spin" />
            ) : (
              <ArrowUp size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryView() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'files' | 'favorites' | 'trash'>('all');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadItems = useCallback(async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    setLoading(true);
    setNotice('');
    try {
      const { data, error } = await getSupabase()
        .from('library_items')
        .select('id,file_name,mime_type,storage_path,size_bytes,source,prompt,created_at,is_favorite,deleted_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const withPreviews = await Promise.all((data || []).map(async (item: LibraryItem) => {
        if (!item.storage_path || item.deleted_at) return item;
        const { data: signed, error: signedError } = await getSupabase()
          .storage.from('library').createSignedUrl(item.storage_path, 60 * 60);
        return { ...item, url: signedError ? undefined : signed?.signedUrl };
      }));
      setItems(withPreviews as LibraryItem[]);
    } catch (error: any) {
      setNotice(error?.message || 'Could not load your library.');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { void loadItems(); }, [loadItems]);

  const handleUpload = async (file: File) => {
    if (!user?.id || uploading) return;
    if (file.size > 50 * 1024 * 1024) { setNotice('Files must be 50 MB or smaller.'); return; }
    setUploading(true); setNotice('');
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = user.id + '/' + crypto.randomUUID() + '-' + safeName;
      const { error: uploadError } = await getSupabase().storage.from('library')
        .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (uploadError) throw uploadError;
      const { error: rowError } = await getSupabase().from('library_items').insert({
        user_id: user.id, file_name: file.name, mime_type: file.type || null,
        storage_path: path, size_bytes: file.size, source: 'uploaded'
      });
      if (rowError) { await getSupabase().storage.from('library').remove([path]); throw rowError; }
      await loadItems();
    } catch (error: any) { setNotice(error?.message || 'Upload failed.'); }
    finally { setUploading(false); }
  };

  const updateItem = async (item: LibraryItem, values: Partial<Pick<LibraryItem, 'is_favorite' | 'deleted_at'>>) => {
    const { error } = await getSupabase().from('library_items').update(values)
      .eq('id', item.id).eq('user_id', user?.id || '');
    if (error) { setNotice(error.message || 'Could not update this file.'); return false; }
    setItems((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, ...values } : entry));
    setSelectedItem((prev) => prev?.id === item.id ? { ...prev, ...values } : prev);
    return true;
  };

  const handleDelete = async (item: LibraryItem) => {
    if (await updateItem(item, { deleted_at: new Date().toISOString() })) {
      setPreviewItem(null); setSelectedItem(null);
      setNotice('Moved to Recently deleted. You can restore it for now.');
    }
  };

  const handleRestore = async (item: LibraryItem) => {
    if (await updateItem(item, { deleted_at: null })) setNotice('File restored to your Library.');
  };

  const handlePermanentDelete = async (item: LibraryItem) => {
    try {
      if (item.storage_path) {
        const { error: storageError } = await getSupabase().storage.from('library').remove([item.storage_path]);
        if (storageError) throw storageError;
      }
      const { error } = await getSupabase().from('library_items').delete()
        .eq('id', item.id).eq('user_id', user?.id || '');
      if (error) throw error;
      setItems((prev) => prev.filter((entry) => entry.id !== item.id));
      setSelectedItem(null); setPreviewItem(null);
      setNotice('File permanently deleted.');
    } catch (error: any) { setNotice(error?.message || 'Could not permanently delete this file.'); }
  };

  const getSignedUrl = async (item: LibraryItem, expiresIn: number, downloadName: boolean | string = false) => {
    if (!item.storage_path) throw new Error('This item has no stored file.');
    const { data, error } = await getSupabase().storage.from('library')
      .createSignedUrl(item.storage_path, expiresIn, downloadName ? { download: downloadName } : undefined);
    if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not create a secure link.');
    return data.signedUrl;
  };

  const handleOpen = async (item: LibraryItem) => {
    try {
      const url = await getSignedUrl(item, 60 * 10);
      const canPreview = item.mime_type?.startsWith('image/') || item.mime_type?.startsWith('video/') || item.mime_type === 'application/pdf';
      if (canPreview) setPreviewItem({ ...item, url });
      else window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error: any) { setNotice(error?.message || 'Could not open this file.'); }
  };

  const handleDownload = async (item: LibraryItem) => {
    try {
      const url = await getSignedUrl(item, 60 * 10, item.file_name);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.file_name;
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error: any) {
      setNotice(error?.message || 'Could not download this file.');
    }
  };

  const handleShare = async (item: LibraryItem, expiresIn = 60 * 60 * 24 * 7, allowDownload = false) => {
    try {
      const url = await getSignedUrl(item, expiresIn, allowDownload);
      const shareData = { title: item.file_name, text: allowDownload ? 'Download shared from ZenixMind Library' : 'View-only share from ZenixMind Library', url };
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url);
        setNotice(`A ${allowDownload ? 'download-enabled' : 'view-only'} link was copied. It expires in ${Math.round(expiresIn / 3600)} hour(s).`);
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') setNotice(error?.message || 'Could not share this file.');
    }
  };

  const activeItems = items.filter((item) => !item.deleted_at);
  const trashItems = items.filter((item) => !!item.deleted_at);
  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = filter === 'trash' ? trashItems : activeItems;
    return base.filter((item) => {
      const matches = !term || item.file_name.toLowerCase().includes(term) || (item.prompt || '').toLowerCase().includes(term);
      if (!matches) return false;
      if (filter === 'favorites') return !!item.is_favorite;
      if (filter === 'images') return !!item.mime_type?.startsWith('image/');
      if (filter === 'videos') return !!item.mime_type?.startsWith('video/');
      if (filter === 'files') return !item.mime_type?.startsWith('image/') && !item.mime_type?.startsWith('video/');
      return true;
    });
  }, [items, query, filter]);

  const documents = filteredItems.filter((item) => !item.mime_type?.startsWith('image/') && !item.mime_type?.startsWith('video/'));
  const media = filteredItems.filter((item) => item.mime_type?.startsWith('image/') || item.mime_type?.startsWith('video/'));
  const storageUsed = activeItems.reduce((sum, item) => sum + Number(item.size_bytes || 0), 0);
  const largestItem = [...activeItems].sort((a, b) => Number(b.size_bytes || 0) - Number(a.size_bytes || 0))[0];
  const formatSize = (bytes?: number) => {
    const size = Number(bytes || 0);
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };
  const formatDate = (date: string) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const renderActions = (item: LibraryItem, inTrash = false) => (
    <div className="flex shrink-0 items-center gap-1">
      {!inTrash && <button type="button" onClick={() => void updateItem(item, { is_favorite: !item.is_favorite })} aria-label={item.is_favorite ? 'Remove favorite' : 'Add favorite'} title={item.is_favorite ? 'Remove favorite' : 'Add favorite'} className={`grid h-9 w-9 place-items-center rounded-full hover:bg-white/[.07] ${item.is_favorite ? 'text-amber-300' : 'text-zinc-500 hover:text-white'}`}><Star size={15} fill={item.is_favorite ? 'currentColor' : 'none'} /></button>}
      {!inTrash && <button type="button" onClick={() => void handleShare(item)} aria-label="Share file" title="Share for 7 days" className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 hover:bg-white/[.07] hover:text-white"><Share2 size={15} /></button>}
      {!inTrash && <button type="button" onClick={() => void handleDownload(item)} aria-label="Download file" title="Download file" className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 hover:bg-white/[.07] hover:text-white"><Download size={15} /></button>}
      <button type="button" onClick={() => setSelectedItem(item)} aria-label="File details" title="File details" className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 hover:bg-white/[.07] hover:text-white"><Info size={15} /></button>
      {inTrash ? (
        <>
          <button type="button" onClick={() => void handleRestore(item)} aria-label="Restore file" title="Restore" className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-white/[.07] hover:text-white"><RotateCcw size={15} /></button>
          <button type="button" onClick={() => void handlePermanentDelete(item)} aria-label="Delete permanently" title="Delete permanently" className="grid h-9 w-9 place-items-center rounded-full text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button>
        </>
      ) : <button type="button" onClick={() => void handleDelete(item)} aria-label="Move to Recently deleted" title="Move to Recently deleted" className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={15} /></button>}
    </div>
  );

  return (
    <div className="h-full min-h-0 overflow-y-auto w-full flex-1 overscroll-contain bg-black px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pt-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Library</h1><p className="mt-1 text-sm text-zinc-500">Your documents, media and saved creations.</p></div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-white/[.08] bg-[#111113] px-4 sm:w-72 sm:flex-none">
              <Search size={16} className="shrink-0 text-zinc-500" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your library" aria-label="Search your library" className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"/>
              {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear library search" className="text-zinc-500 hover:text-white"><X size={14}/></button>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ''; if (file) void handleUpload(file); }}/>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading || !user} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-zinc-100 px-4 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-50"><Plus size={16}/><span>{uploading ? 'Adding…' : 'Add files'}</span></button>
          </div>
        </div>

        <section className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[.07] bg-[#0d0d0f] p-3"><div className="flex items-center gap-2 text-xs text-zinc-500"><HardDrive size={14}/> Storage used</div><p className="mt-2 text-lg font-semibold text-zinc-100">{formatSize(storageUsed)}</p></div>
          <div className="rounded-xl border border-white/[.07] bg-[#0d0d0f] p-3"><div className="text-xs text-zinc-500">Saved items</div><p className="mt-2 text-lg font-semibold text-zinc-100">{activeItems.length}</p></div>
          <div className="col-span-2 rounded-xl border border-white/[.07] bg-[#0d0d0f] p-3 sm:col-span-1"><div className="text-xs text-zinc-500">Largest file</div><p className="mt-2 truncate text-sm font-semibold text-zinc-100">{largestItem ? largestItem.file_name : 'No files yet'}</p><p className="text-[11px] text-zinc-500">{largestItem ? formatSize(largestItem.size_bytes) : 'Add a file to get started'}</p></div>
        </section>

        {notice && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-white/[.08] bg-[#111113] px-4 py-3 text-sm text-zinc-300"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15}/></button></div>}

        <div className="mb-7 flex flex-wrap items-center gap-2">
          {([
            ['all','All items'],['images','Images'],['videos','Videos'],['files','Files'],['favorites','Favorites'],['trash','Recently deleted']
          ] as const).map(([value,label]) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${filter === value ? 'border-white/[.18] bg-white text-black' : 'border-white/[.08] bg-[#111113] text-zinc-400 hover:bg-[#1b1b1e] hover:text-zinc-200'}`}>{label}{value === 'trash' ? ` (${trashItems.length})` : ''}</button>)}
          <span className="ml-auto text-xs text-zinc-600">{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</span>
        </div>

        {loading ? <div className="rounded-2xl border border-white/[.06] bg-[#09090b] px-5 py-12 text-center text-sm text-zinc-500">Loading your Library…</div> : filter === 'trash' ? (
          <section><h2 className="mb-4 text-xl font-semibold text-zinc-100">Recently deleted</h2>{filteredItems.length ? <div className="divide-y divide-white/[.06] overflow-hidden rounded-2xl border border-white/[.07] bg-[#09090b]">{filteredItems.map((item) => <div key={item.id} className="flex items-center gap-3 px-3 py-3 sm:px-5"><FileText size={19} className="shrink-0 text-zinc-500"/><div className="min-w-0 flex-1"><p className="truncate text-sm text-zinc-200">{item.file_name}</p><p className="text-[11px] text-zinc-500">Deleted {item.deleted_at ? formatDate(item.deleted_at) : ''} · {formatSize(item.size_bytes)}</p></div>{renderActions(item,true)}</div>)}</div> : <div className="rounded-2xl border border-white/[.06] bg-[#09090b] px-5 py-12 text-center text-sm text-zinc-500">Recently deleted files will appear here.</div>}</section>
        ) : (
          <>
            <section aria-labelledby="library-documents-heading" className="mb-10">
              <div className="mb-4 flex items-center justify-between"><h2 id="library-documents-heading" className="text-xl font-semibold tracking-tight text-zinc-100">Documents</h2><span className="text-xs text-zinc-600">{documents.length}</span></div>
              {documents.length ? <div className="divide-y divide-white/[.06] overflow-hidden rounded-2xl border border-white/[.07] bg-[#09090b]">{documents.map((item) => <div key={item.id} className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.06] text-zinc-300"><FileText size={19}/></div><button type="button" onClick={() => void handleOpen(item)} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-medium text-zinc-200">{item.file_name}</p><p className="mt-1 text-[11px] text-zinc-500">{formatSize(item.size_bytes)} · {formatDate(item.created_at)} · {item.source === 'generated' ? 'Created with ZenixMind' : 'Uploaded'}</p></button>{renderActions(item)}</div>)}</div> : <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-white/[.06] bg-[#09090b] px-5 py-10 text-center"><FileText size={24} className="mb-3 text-zinc-500"/><h3 className="text-base font-semibold text-zinc-200">No documents yet</h3><p className="mt-1 text-sm text-zinc-500">Documents you create or upload will appear here.</p></div>}
            </section>
            <section aria-labelledby="library-media-heading">
              <div className="mb-4 flex items-center justify-between"><h2 id="library-media-heading" className="text-xl font-semibold tracking-tight text-zinc-100">Media</h2><span className="text-xs text-zinc-600">{media.length}</span></div>
              {media.length ? <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 lg:grid-cols-4">{media.map((item) => <article key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-[#151518]"><button type="button" onClick={() => void handleOpen(item)} className="absolute inset-0 h-full w-full" aria-label={`Preview ${item.file_name}`}>{item.mime_type?.startsWith('image/') && item.url ? <img src={item.url} alt={item.file_name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"/> : item.mime_type?.startsWith('video/') && item.url ? <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata"/> : <div className="flex h-full w-full items-center justify-center text-zinc-500"><ImageIcon size={25}/></div>}</button><div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pt-8"><p className="truncate text-[11px] font-medium text-white">{item.file_name}</p></div><div className="absolute right-1 top-1 flex gap-1"><button type="button" onClick={() => void updateItem(item,{is_favorite:!item.is_favorite})} aria-label="Toggle favorite" className="grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white"><Star size={14} fill={item.is_favorite ? 'currentColor' : 'none'} className={item.is_favorite ? 'text-amber-300' : ''}/></button><button type="button" onClick={() => setSelectedItem(item)} aria-label="File details" className="grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white"><Info size={14}/></button><button type="button" onClick={() => void handleDownload(item)} aria-label="Download media" title="Download" className="grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white"><Download size={14}/></button></div></article>)}</div> : <div className="flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-white/[.06] bg-[#09090b] px-5 py-10 text-center"><ImageIcon size={24} className="mb-3 text-zinc-500"/><h3 className="text-base font-semibold text-zinc-200">Your media will appear here</h3><p className="mt-1 text-sm text-zinc-500">Images and videos you generate or upload are collected here.</p></div>}
            </section>
          </>
        )}
      </div>

      {selectedItem && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setSelectedItem(null)}><section role="dialog" aria-modal="true" aria-label="File details" className="w-full max-w-md rounded-t-2xl border border-white/[.1] bg-[#111113] p-5 sm:rounded-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">File details</h2><button type="button" onClick={() => setSelectedItem(null)} aria-label="Close details" className="rounded-full p-2 text-zinc-400 hover:bg-white/[.08]"><X size={17}/></button></div><p className="break-all text-sm font-medium text-zinc-100">{selectedItem.file_name}</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-zinc-500">File type</dt><dd className="text-right text-zinc-200">{selectedItem.mime_type || 'Unknown'}</dd></div><div className="flex justify-between gap-4"><dt className="text-zinc-500">Size</dt><dd className="text-zinc-200">{formatSize(selectedItem.size_bytes)}</dd></div><div className="flex justify-between gap-4"><dt className="text-zinc-500">Added</dt><dd className="text-zinc-200">{formatDate(selectedItem.created_at)}</dd></div><div className="flex justify-between gap-4"><dt className="text-zinc-500">Source</dt><dd className="text-zinc-200">{selectedItem.source === 'generated' ? 'Generated by ZenixMind' : 'Uploaded'}</dd></div><div className="flex justify-between gap-4"><dt className="text-zinc-500">Favorite</dt><dd className="text-zinc-200">{selectedItem.is_favorite ? 'Yes' : 'No'}</dd></div></dl>{selectedItem.prompt && <div className="mt-4 rounded-xl bg-black/40 p-3"><p className="mb-1 text-xs text-zinc-500">Generation prompt</p><p className="text-sm text-zinc-300">{selectedItem.prompt}</p></div>}<div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => void handleOpen(selectedItem)} className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black">Preview</button><button type="button" onClick={() => void handleDownload(selectedItem)} className="rounded-full border border-white/[.12] px-3 py-2.5 text-xs font-medium text-white">Download now</button><button type="button" onClick={() => void handleShare(selectedItem, 60 * 60, false)} className="rounded-full border border-white/[.12] px-3 py-2.5 text-xs font-medium text-white">View · 1 hour</button><button type="button" onClick={() => void handleShare(selectedItem, 60 * 60 * 24 * 7, false)} className="rounded-full border border-white/[.12] px-3 py-2.5 text-xs font-medium text-white">View · 7 days</button><button type="button" onClick={() => void handleShare(selectedItem, 60 * 60 * 24 * 7, true)} className="rounded-full border border-white/[.12] px-3 py-2.5 text-xs font-medium text-white">Download · 7 days</button></div></section></div>}

      {previewItem && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-3 sm:p-6" onClick={() => setPreviewItem(null)}><section role="dialog" aria-modal="true" aria-label={`Preview ${previewItem.file_name}`} className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[.1] bg-[#101012]" onClick={(event) => event.stopPropagation()}><header className="flex items-center justify-between gap-3 border-b border-white/[.08] px-4 py-3"><p className="truncate text-sm font-medium text-zinc-200">{previewItem.file_name}</p><button type="button" onClick={() => setPreviewItem(null)} aria-label="Close preview" className="rounded-full p-2 text-zinc-400 hover:bg-white/[.08]"><X size={18}/></button></header><div className="flex min-h-0 flex-1 items-center justify-center bg-black p-2">{previewItem.mime_type?.startsWith('image/') ? <img src={previewItem.url} alt={previewItem.file_name} className="max-h-full max-w-full object-contain"/> : previewItem.mime_type?.startsWith('video/') ? <video src={previewItem.url} controls autoPlay className="max-h-full max-w-full"/> : <iframe title={previewItem.file_name} src={previewItem.url} className="h-full w-full rounded-lg bg-white"/>}</div></section></div>}
    </div>
  );
}

type AutomationItem = {
  id: string;
  title: string;
  prompt: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  timezone: string;
  schedule_label: string;
  enabled: boolean;
  web_search: boolean;
  last_run_at: string | null;
  completed_at: string | null;
};

type AutomationRun = {
  id: string;
  automation_id: string;
  status: 'running' | 'completed' | 'failed';
  output: string | null;
  error: string | null;
  trigger_type: 'scheduled' | 'manual';
  scheduled_at: string | null;
  created_at: string;
};

function AutomationsView({ userId }: { userId?: string }) {
  const [automations, setAutomations] = useState<AutomationItem[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'once'>('daily');
  const [time, setTime] = useState('08:00');
  const [weekday, setWeekday] = useState('1');
  const [monthDay, setMonthDay] = useState('1');
  const [runAt, setRunAt] = useState(() => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    return new Date(future.getTime() - future.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [webSearch, setWebSearch] = useState(false);

  const load = useCallback(async () => {
    if (!userId) { setAutomations([]); setRuns([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session?.access_token) throw new Error('Sign in again to load scheduled tasks.');
      const response = await fetch('/api/chat?action=automations', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to load scheduled tasks.');
      setAutomations(payload.automations || []);
      setRuns(payload.runs || []);
    } catch (error: any) {
      setNotice(error?.message || 'Unable to load scheduled tasks.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const request = async (method: string, id?: string, body?: Record<string, unknown>) => {
    const { data: { session } } = await getSupabase().auth.getSession();
    if (!session?.access_token) throw new Error('Your session expired. Sign in again.');
    const base = '/api/chat?action=automations';
    const url = id ? `${base}&id=${encodeURIComponent(id)}` : base;
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'The scheduled task request failed.');
    return payload;
  };

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !prompt.trim() || busyId) return;
    setBusyId('create'); setNotice('');
    try {
      await request('POST', undefined, {
        title: title.trim(),
        prompt: prompt.trim(),
        frequency,
        time,
        weekday: Number(weekday),
        monthDay: Number(monthDay),
        runAt,
        timezone: timezone.trim(),
        webSearch
      });
      setTitle(''); setPrompt(''); setWebSearch(false); setFormOpen(false);
      setNotice('Scheduled task created.');
      await load();
    } catch (error: any) {
      setNotice(error?.message || 'The scheduled task could not be created.');
    } finally {
      setBusyId('');
    }
  };

  const runTask = async (item: AutomationItem) => {
    if (busyId) return;
    setBusyId(item.id); setNotice('');
    try {
      await request('POST', item.id, { action: 'run' });
      setNotice(`“${item.title}” was queued. Its result will appear in the run history.`);
      await load();
    } catch (error: any) {
      setNotice(error?.message || 'The task could not be queued.');
    } finally {
      setBusyId('');
    }
  };

  const toggleTask = async (item: AutomationItem) => {
    if (busyId) return;
    setBusyId(item.id); setNotice('');
    try {
      await request('PATCH', item.id, { enabled: !item.enabled });
      setNotice(item.enabled ? 'Scheduled task paused.' : 'Scheduled task resumed.');
      await load();
    } catch (error: any) {
      setNotice(error?.message || 'The schedule could not be updated.');
    } finally {
      setBusyId('');
    }
  };

  const deleteTask = async (item: AutomationItem) => {
    if (busyId || !window.confirm(`Delete “${item.title}” and its run history?`)) return;
    setBusyId(item.id); setNotice('');
    try {
      await request('DELETE', item.id);
      setNotice('Scheduled task deleted.');
      await load();
    } catch (error: any) {
      setNotice(error?.message || 'The task could not be deleted.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(28px+env(safe-area-inset-bottom))] pt-6 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 border-b border-white/[.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-600">Workspace</p><h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Automations</h1><p className="mt-1 text-sm text-zinc-500">Schedule AI tasks and review their results here.</p></div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[.1] px-3.5 text-xs text-zinc-300 hover:bg-white/[.05]"><RotateCcw size={13}/> Refresh</button>
            <button type="button" onClick={() => setFormOpen((open) => !open)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-black hover:bg-zinc-200"><Plus size={14}/>{formOpen ? 'Close form' : 'New scheduled task'}</button>
          </div>
        </div>

        {notice && <p role="status" className="mb-4 rounded-xl border border-white/[.08] bg-white/[.03] px-3 py-2.5 text-xs text-zinc-300">{notice}</p>}

        {formOpen && <section className="mb-6 rounded-2xl border border-white/[.08] bg-[#0b0b0d] p-4 sm:p-5">
          <div className="mb-4"><h2 className="text-sm font-semibold text-zinc-100">Create a scheduled task</h2><p className="mt-1 text-xs text-zinc-500">Tell ZenixMind what to do and when to run it.</p></div>
          <form onSubmit={(event) => void createTask(event)} className="space-y-4">
            <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Task name</span><input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={80} placeholder="e.g. Morning technology briefing" className="w-full rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-white/[.2]"/></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Instructions</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required maxLength={4000} rows={4} placeholder="Describe exactly what ZenixMind should prepare or analyze each time this task runs." className="w-full resize-y rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-white/[.2]"/></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Repeat</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as typeof frequency)} className="w-full rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs text-zinc-200"><option value="daily">Every day</option><option value="weekly">Every week</option><option value="monthly">Every month</option><option value="once">One time</option></select></label>
              {frequency === 'once' ? <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Run date and time</span><input type="datetime-local" value={runAt} onChange={(event) => setRunAt(event.target.value)} required className="w-full rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs text-zinc-200"/></label> : <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Run time</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} required className="w-full rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs text-zinc-200"/></label>}
              {frequency === 'weekly' && <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Day of week</span><select value={weekday} onChange={(event) => setWeekday(event.target.value)} className="w-full rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs text-zinc-200"><option value="0">Sunday</option><option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option><option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option></select></label>}
              {frequency === 'monthly' && <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Day of month</span><select value={monthDay} onChange={(event) => setMonthDay(event.target.value)} className="w-full rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs text-zinc-200">{Array.from({ length: 28 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}</option>)}</select></label>}
              <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Timezone</span><input value={timezone} onChange={(event) => setTimezone(event.target.value)} required maxLength={100} placeholder="Africa/Lagos" className="w-full rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-white/[.2]"/></label>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/[.07] bg-white/[.02] p-3"><input type="checkbox" checked={webSearch} onChange={(event) => setWebSearch(event.target.checked)} className="mt-0.5 h-4 w-4 accent-white"/><span><span className="block text-xs font-medium text-zinc-200">Use Online Search</span><span className="mt-0.5 block text-[10px] leading-4 text-zinc-500">Allow the task to gather current web sources when it runs.</span></span></label>
            <p className="text-[10px] leading-4 text-zinc-600">Tasks run using the selected timezone. Vercel Hobby schedules may include up to 15 minutes of timing variation.</p>
            <div className="flex flex-col-reverse gap-2 border-t border-white/[.06] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-white/[.1] px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/[.05]">Cancel</button><button type="submit" disabled={busyId === 'create' || !title.trim() || !prompt.trim()} className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-40">{busyId === 'create' ? 'Creating…' : 'Create task'}</button></div>
          </form>
        </section>}

        {loading ? <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-8 text-center text-xs text-zinc-500">Loading scheduled tasks…</div> : automations.length === 0 ? <div className="rounded-2xl border border-dashed border-white/[.1] bg-[#0b0b0d] px-5 py-12 text-center"><Sparkles size={25} className="mx-auto mb-3 text-zinc-600"/><h2 className="text-sm font-medium text-zinc-200">No scheduled tasks yet</h2><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-500">Create a daily briefing, a weekly research report, or a one-time task. Results will be saved here.</p></div> : <div className="space-y-3">
          {automations.map((item) => {
            const itemRuns = runs.filter((run) => run.automation_id === item.id).slice(0, 5);
            const completed = Boolean(item.completed_at);
            return <article key={item.id} className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-4 transition-colors hover:border-white/[.12] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold text-zinc-100">{item.title}</h2><span className={`rounded-full px-2 py-0.5 text-[10px] ${completed ? 'bg-white/[.06] text-zinc-500' : item.enabled ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/[.06] text-zinc-500'}`}>{completed ? 'Completed' : item.enabled ? 'Active' : 'Paused'}</span>{item.web_search && <span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[10px] text-zinc-400">Online Search</span>}</div>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-400">{item.prompt}</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-600"><span>{item.schedule_label}</span><span>{item.timezone}</span>{item.last_run_at && <span>Last run {new Date(item.last_run_at).toLocaleString()}</span>}</div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <button type="button" disabled={busyId === item.id || completed} onClick={() => void runTask(item)} className="rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-black hover:bg-zinc-200 disabled:opacity-40">{busyId === item.id ? 'Working…' : 'Run now'}</button>
                  {!completed && <button type="button" disabled={busyId === item.id} onClick={() => void toggleTask(item)} className="rounded-xl border border-white/[.1] px-3 py-2 text-[11px] text-zinc-300 hover:bg-white/[.05] disabled:opacity-40">{item.enabled ? 'Pause' : 'Resume'}</button>}
                  <button type="button" disabled={busyId === item.id} onClick={() => void deleteTask(item)} className="rounded-xl border border-red-500/20 px-3 py-2 text-[11px] text-red-300 hover:bg-red-500/10 disabled:opacity-40">Delete</button>
                </div>
              </div>
              <details className="mt-4 border-t border-white/[.06] pt-3">
                <summary className="cursor-pointer list-none text-[11px] font-medium text-zinc-400">Run history <span className="ml-1 text-zinc-600">({itemRuns.length})</span></summary>
                {itemRuns.length ? <div className="mt-3 space-y-3">{itemRuns.map((run) => <div key={run.id} className="rounded-xl bg-white/[.025] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className={`text-[10px] font-medium ${run.status === 'completed' ? 'text-emerald-300' : run.status === 'failed' ? 'text-red-300' : 'text-amber-300'}`}>{run.status === 'completed' ? 'Completed' : run.status === 'failed' ? 'Failed' : 'Running'} · {run.trigger_type === 'manual' ? 'Manual run' : 'Scheduled run'}</span><span className="text-[10px] text-zinc-600">{new Date(run.created_at).toLocaleString()}</span></div>{run.error && <p className="mt-2 text-[11px] text-red-300">{run.error}</p>}{run.output && <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-zinc-300">{run.output.slice(0, 12000)}</pre>}</div>)}</div> : <p className="mt-3 text-[10px] text-zinc-600">No runs yet. Choose Run now to test this task.</p>}
              </details>
            </article>;
          })}
        </div>}
      </div>
    </div>
  );
}


function ProjectsView({ userId }: { userId?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const chatToAssign = new URLSearchParams(location.search).get('conversation') || '';
  const [projects, setProjects] = useState<Array<{ id: string; name: string; description: string; instructions: string; created_at: string; updated_at: string }>>([]);
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; project_id: string | null; updated_at: string; created_at: string }>>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!userId) { setProjects([]); setConversations([]); setLoading(false); return; }
    setLoading(true);
    const [projectResult, conversationResult] = await Promise.all([
      getSupabase().from('projects').select('id,name,description,instructions,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
      getSupabase().from('conversations').select('id,title,project_id,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(200)
    ]);
    if (projectResult.error || conversationResult.error) {
      setNotice('Projects could not be loaded. Please refresh and try again.');
    } else {
      const nextProjects = projectResult.data || [];
      setProjects(nextProjects);
      setConversations(conversationResult.data || []);
      setSelectedProjectId((current) => current || nextProjects[0]?.id || '');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const assignChat = async (projectId = selectedProjectId) => {
    if (!userId || !chatToAssign || !projectId || saving) return;
    setSaving(true); setNotice('');
    const { error } = await getSupabase().from('conversations')
      .update({ project_id: projectId, updated_at: new Date().toISOString() })
      .eq('id', chatToAssign).eq('user_id', userId);
    if (error) setNotice('This chat could not be added to the project.');
    else navigate(`/assistant?conversation=${encodeURIComponent(chatToAssign)}&projectChat=${encodeURIComponent(projectId)}`);
    setSaving(false);
  };

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !name.trim() || saving) return;
    setSaving(true); setNotice('');
    const { data, error } = await getSupabase().from('projects')
      .insert({ user_id: userId, name: name.trim().slice(0, 80), description: description.trim().slice(0, 500), instructions: instructions.trim().slice(0, 4000) })
      .select('id,name,description,instructions,created_at,updated_at').single();
    if (error || !data) {
      setNotice(error?.message || 'Project could not be created.');
      setSaving(false);
      return;
    }
    if (chatToAssign) {
      const { error: attachError } = await getSupabase().from('conversations')
        .update({ project_id: data.id, updated_at: new Date().toISOString() })
        .eq('id', chatToAssign).eq('user_id', userId);
      if (attachError) {
        setNotice('Project created, but the selected chat could not be added.');
        setSaving(false);
        await load();
        return;
      }
      navigate(`/assistant?conversation=${encodeURIComponent(chatToAssign)}&projectChat=${encodeURIComponent(data.id)}`);
    } else {
      navigate(`/assistant?project=${encodeURIComponent(data.id)}`);
    }
    setSaving(false);
  };

  const projectChatCount = (projectId: string) => conversations.filter((conversation) => conversation.project_id === projectId).length;

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(28px+env(safe-area-inset-bottom))] pt-6 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-600">Workspace</p><h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Projects</h1><p className="mt-1 text-sm text-zinc-500">Keep related chats and instructions together.</p></div>
          <span className="text-xs text-zinc-600">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
        </div>

        {chatToAssign && (
          <section className="mb-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.04] p-4 sm:p-5">
            <div className="flex items-start gap-3"><FolderClosed size={18} className="mt-0.5 shrink-0 text-cyan-200"/><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-zinc-100">Add this chat to a project</h2><p className="mt-1 text-xs text-zinc-500">Choose a project to organize this conversation. Its existing messages will stay intact.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/[.1] bg-[#101013] px-3 py-2.5 text-xs text-zinc-200"><option value="">Choose a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button type="button" disabled={saving || !selectedProjectId} onClick={() => void assignChat()} className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black disabled:opacity-40">{saving ? 'Adding…' : 'Add to project'}</button></div></div></div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.72fr)]">
          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-200">Your projects</h2></div>
            {loading ? <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-8 text-center text-xs text-zinc-500">Loading projects…</div> : projects.length ? (
              <div className="space-y-3">{projects.map((project) => (
                <article key={project.id} className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-4 transition-colors hover:border-white/[.13] sm:p-5">
                  <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.07] bg-white/[.04] text-zinc-300"><FolderClosed size={18}/></div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-zinc-100">{project.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{project.description || 'No description yet.'}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-zinc-600"><span>{projectChatCount(project.id)} chats</span><span>Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>{project.instructions?.trim() && <span>Instructions set</span>}</div></div></div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[.06] pt-3"><button type="button" onClick={() => navigate(`/assistant?project=${encodeURIComponent(project.id)}`)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[11px] font-semibold text-black hover:bg-zinc-200">Open project <ExternalLink size={12}/></button><button type="button" onClick={() => navigate(`/assistant?projectChat=${encodeURIComponent(project.id)}`)} className="inline-flex items-center gap-1.5 rounded-full border border-white/[.1] px-3.5 py-2 text-[11px] font-medium text-zinc-300 hover:bg-white/[.05]"><Plus size={12}/> New project chat</button></div>
                </article>
              ))}</div>
            ) : <div className="rounded-2xl border border-dashed border-white/[.1] bg-[#0b0b0d] px-5 py-10 text-center"><FolderClosed size={24} className="mx-auto mb-3 text-zinc-600"/><h3 className="text-sm font-medium text-zinc-200">No projects yet</h3><p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-zinc-500">Create a project to group conversations and give ZenixMind instructions that apply to its chats.</p></div>}
          </section>

          <section className="h-fit rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-4 sm:p-5">
            <div className="mb-4"><h2 className="text-sm font-semibold text-zinc-100">Create a project</h2><p className="mt-1 text-xs text-zinc-500">Project instructions are applied to new project chats.</p></div>
            <form onSubmit={(event) => void createProject(event)} className="space-y-3">
              <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Name</span><input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} placeholder="e.g. Website redesign" className="w-full rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-white/[.2]"/></label>
              <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} maxLength={500} placeholder="What are you working on?" className="w-full resize-none rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-white/[.2]"/></label>
              <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-zinc-400">Project instructions</span><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={4} maxLength={4000} placeholder="How should ZenixMind help with this project?" className="w-full resize-y rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs leading-5 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-white/[.2]"/></label>
              {notice && <p role="status" className="text-[11px] text-zinc-400">{notice}</p>}
              <button type="submit" disabled={saving || !name.trim()} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-40">{saving ? 'Creating…' : 'Create project'} <Plus size={14}/></button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProjectView({ projectId, userId, onDeleted }: { projectId: string; userId?: string; onDeleted: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState<{ id: string; name: string; description: string; instructions: string; created_at: string; updated_at: string } | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [projectChats, setProjectChats] = useState<Array<{ id: string; title: string; created_at: string; updated_at: string }>>([]);
  const [projectFiles, setProjectFiles] = useState<Array<{ id: string; library_item_id: string; created_at: string; file_name: string; mime_type: string | null; size_bytes: number | null }>>([]);
  const [availableFiles, setAvailableFiles] = useState<Array<{ id: string; file_name: string; mime_type: string | null; size_bytes: number | null }>>([]);
  const [selectedLibraryItemId, setSelectedLibraryItemId] = useState('');
  const [fileSaving, setFileSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadChats = async () => {
      if (!userId) return;
      const { data, error } = await getSupabase().from('conversations')
        .select('id,title,created_at,updated_at')
        .eq('project_id', projectId).eq('user_id', userId)
        .order('updated_at', { ascending: false }).limit(100);
      if (mounted && !error) setProjectChats(data || []);
    };
    void loadChats();
    return () => { mounted = false; };
  }, [projectId, userId]);

  const removeChat = async (id: string) => {
    if (!userId) return;
    const { error } = await getSupabase().from('conversations')
      .update({ project_id: null }).eq('id', id).eq('user_id', userId).eq('project_id', projectId);
    if (error) setMessage('Could not remove this chat from the project.');
    else setProjectChats((previous) => previous.filter((chat) => chat.id !== id));
  };

  const loadProjectFiles = useCallback(async () => {
    if (!userId) { setProjectFiles([]); setAvailableFiles([]); return; }
    const [linksResult, filesResult] = await Promise.all([
      getSupabase().from('project_files').select('id,library_item_id,created_at')
        .eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: false }),
      getSupabase().from('library_items').select('id,file_name,mime_type,size_bytes')
        .eq('user_id', userId).is('deleted_at', null).order('created_at', { ascending: false }).limit(100)
    ]);
    if (linksResult.error || filesResult.error) {
      setMessage('Project files could not be loaded.');
      return;
    }
    const files = filesResult.data || [];
    const links = linksResult.data || [];
    const byId = new Map(files.map((file) => [file.id, file]));
    setProjectFiles(links.flatMap((link) => {
      const file = byId.get(link.library_item_id);
      return file ? [{ ...file, ...link }] : [];
    }));
    const linkedIds = new Set(links.map((link) => link.library_item_id));
    setAvailableFiles(files.filter((file) => !linkedIds.has(file.id)));
  }, [projectId, userId]);

  useEffect(() => { void loadProjectFiles(); }, [loadProjectFiles]);

  const addProjectFile = async () => {
    if (!userId || !selectedLibraryItemId || fileSaving) return;
    setFileSaving(true); setMessage('');
    const { error } = await getSupabase().from('project_files')
      .insert({ user_id: userId, project_id: projectId, library_item_id: selectedLibraryItemId });
    if (error) setMessage('This file could not be linked to the project.');
    else { setSelectedLibraryItemId(''); await loadProjectFiles(); }
    setFileSaving(false);
  };

  const removeProjectFile = async (id: string) => {
    if (!userId) return;
    const { error } = await getSupabase().from('project_files')
      .delete().eq('id', id).eq('user_id', userId).eq('project_id', projectId);
    if (error) setMessage('This file could not be removed from the project.');
    else await loadProjectFiles();
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      const { data, error } = await getSupabase().from('projects')
        .select('id,name,description,instructions,created_at,updated_at')
        .eq('id', projectId).eq('user_id', userId).maybeSingle();
      if (mounted) {
        if (error || !data) setProject(null);
        else {
          setProject(data); setName(data.name || '');
          setDescription(data.description || ''); setInstructions(data.instructions || '');
        }
        setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [projectId, userId]);

  const save = async () => {
    if (!userId || !project || !name.trim()) return;
    setSaving(true); setMessage('');
    const { data, error } = await getSupabase().from('projects')
      .update({
        name: name.trim().slice(0, 80),
        description: description.trim().slice(0, 500),
        instructions: instructions.trim().slice(0, 4000),
        updated_at: new Date().toISOString()
      })
      .eq('id', project.id).eq('user_id', userId)
      .select('id,name,description,instructions,created_at,updated_at').single();
    if (error) setMessage(error.message);
    else {
      setProject(data); setName(data.name);
      setDescription(data.description || ''); setInstructions(data.instructions || '');
      setMessage('Project saved.');
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!userId || !project || !window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    const { error } = await getSupabase().from('projects').delete().eq('id', project.id).eq('user_id', userId);
    if (!error) onDeleted(); else setMessage(error.message);
  };

  if (loading) return <div className="flex h-full items-center justify-center text-xs text-zinc-600">Loading project…</div>;
  if (!project) return <div className="flex h-full items-center justify-center p-6"><div className="text-center">
    <FolderClosed className="mx-auto mb-3 text-zinc-600" size={22} />
    <p className="text-sm text-zinc-300">Project not found.</p>
    <button onClick={onDeleted} className="mt-3 text-xs text-zinc-400 hover:text-white">Back to chat</button>
  </div></div>;

  return <div className="flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-zinc-600"><FolderClosed size={12} /> Project workspace</div>
        <h1 className="break-words text-2xl font-light tracking-[-.03em] text-zinc-100">{project.name}</h1>
        <p className="mt-2 text-xs text-zinc-500">Created {new Date(project.created_at).toLocaleDateString()}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('project');
            next.delete('conversation');
            next.delete('view');
            next.set('projectChat', project.id);
            return next;
          });
        }} className="rounded-xl border border-white/[.08] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[.05]">Open project chat</button>
        <button type="button" onClick={remove} className="rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">Delete</button>
      </div>
    </div>
    <div className="space-y-5">
      <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">Project name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="w-full rounded-xl border border-white/[.08] bg-[#0d0d10] px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-white/[.2]" />
      </label>
      <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="What is this project about?" className="w-full resize-none rounded-xl border border-white/[.08] bg-[#0d0d10] px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-white/[.2]" />
      </label>
      <label className="block"><span className="mb-2 block text-xs font-medium text-zinc-400">Project instructions</span>
        <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={4000} rows={7} placeholder="Tell ZenixMind how it should work inside this project." className="w-full resize-y rounded-xl border border-white/[.08] bg-[#0d0d10] px-3 py-2.5 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-white/[.2]" />
        <span className="mt-1 block text-[10px] text-zinc-600">Saved to this project for future project-aware chat.</span>
      </label>
      <section className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-4">
        <div className="mb-3"><h2 className="text-xs font-semibold text-zinc-200">Project files</h2><p className="mt-1 text-[10px] leading-4 text-zinc-500">Link files from My stuff for organization. They are not read automatically; upload a file in a chat when you want ZenixMind to analyze it.</p></div>
        {availableFiles.length ? <div className="mb-4 flex flex-col gap-2 sm:flex-row"><select value={selectedLibraryItemId} onChange={(event) => setSelectedLibraryItemId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/[.08] bg-[#101013] px-3 py-2.5 text-xs text-zinc-200"><option value="">Choose a file from My stuff</option>{availableFiles.map((file) => <option key={file.id} value={file.id}>{file.file_name}</option>)}</select><button type="button" disabled={!selectedLibraryItemId || fileSaving} onClick={() => void addProjectFile()} className="rounded-xl border border-white/[.1] px-3 py-2.5 text-xs text-zinc-200 hover:bg-white/[.05] disabled:opacity-40">{fileSaving ? 'Adding…' : 'Add file'}</button></div> : <p className="mb-4 text-[10px] text-zinc-600">No unlinked files available. <Link to="/assistant?view=library" className="text-zinc-300 underline underline-offset-2">Open My stuff</Link></p>}
        {projectFiles.length ? <div className="divide-y divide-white/[.06]">{projectFiles.map((file) => <div key={file.id} className="flex min-w-0 items-center gap-2 py-2.5"><FileText size={14} className="shrink-0 text-zinc-500"/><div className="min-w-0 flex-1"><p className="truncate text-xs text-zinc-300">{file.file_name}</p><p className="mt-0.5 text-[10px] text-zinc-600">{file.mime_type || 'File'}{file.size_bytes ? ` · ${Math.max(1, Math.round(file.size_bytes / 1024))} KB` : ''}</p></div><button type="button" onClick={() => void removeProjectFile(file.id)} className="shrink-0 rounded-lg px-2 py-1 text-[10px] text-zinc-600 hover:bg-white/[.06] hover:text-zinc-300">Remove</button></div>)}</div> : <p className="py-2 text-center text-[10px] text-zinc-600">No files linked to this project yet.</p>}
      </section>
      <section className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-4">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold text-zinc-200">Project chats</h2><span className="text-[10px] text-zinc-600">{projectChats.length}</span></div>
        {projectChats.length ? <div className="divide-y divide-white/[.06]">{projectChats.map((chat) => <div key={chat.id} className="flex items-center gap-2 py-2.5"><MessageSquare size={14} className="shrink-0 text-zinc-500"/><Link to={`/assistant?conversation=${encodeURIComponent(chat.id)}&projectChat=${encodeURIComponent(project.id)}`} className="min-w-0 flex-1 truncate text-xs text-zinc-300 hover:text-white">{chat.title || 'New conversation'}</Link><button type="button" onClick={() => void removeChat(chat.id)} className="shrink-0 rounded-lg px-2 py-1 text-[10px] text-zinc-600 hover:bg-white/[.06] hover:text-zinc-300">Remove</button></div>)}</div> : <p className="py-3 text-center text-[11px] text-zinc-600">Chats created in this project will appear here.</p>}
      </section>
      <div className="flex items-center justify-between border-t border-white/[.06] pt-5">
        <span className="text-xs text-zinc-500">{message}</span>
        <button type="button" disabled={saving || !name.trim()} onClick={() => void save()} className="rounded-xl bg-white px-4 py-2 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-40">{saving ? 'Saving…' : 'Save project'}</button>
      </div>
    </div>
  </div></div>;
}

export function AssistantPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem('zenixmind_selected_model');
    return saved?.startsWith('zenix-') ? saved : 'zenix-auto';
  });
  const [webSearch, setWebSearch] = useState(() => localStorage.getItem('zenixmind-web-search') === 'on');
  const [deepThink, setDeepThink] = useState(() => localStorage.getItem('zenixmind-default-thinking') === 'deep');
  const [deepResearch, setDeepResearch] = useState(false);
  const [temporaryChat, setTemporaryChat] = useState(() => localStorage.getItem('zenixmind-temporary-chat') === 'on');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [dictationError, setDictationError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceTalkOpen, setVoiceTalkOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState('');

  const isAtBottomRef = useRef(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const dictationBaseRef = useRef('');
  const generationControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const view = (searchParams.get('view') as 'chat' | 'images' | 'library' | 'automations' | 'projects') || 'chat';
  const projectId = searchParams.get('project');
  const projectChatId = searchParams.get('projectChat');
  const activeProjectId = projectChatId || null;
  const urlConvId = searchParams.get('conversation');
  const urlQuery = searchParams.get('q');

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom < 100;
    setIsAtBottom(atBottom);
    isAtBottomRef.current = atBottom;
  }, []);

  // Automatic scrolling tracking via ResizeObserver for streaming tokens, latex & code rendering
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) {
        scrollToBottom('auto');
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isStreaming, busy, scrollToBottom]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('zenixmind_selected_model', modelId);
  };

  const handleProjectDeleted = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('project');
      return next;
    });
  }, [setSearchParams]);

  const handleStartNewChat = useCallback(() => {
    setVoiceTalkOpen(false);
    recognitionRef.current?.stop();
    setIsListening(false);
    setDictationError('');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setConversationId(null);
    setMessages([]);
    setInput('');
    setAttachedFile(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('conversation');
      next.delete('private');
      return next;
    });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [setSearchParams]);



  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K, Cmd+N / Ctrl+N, Cmd+Shift+S, Cmd+Shift+D, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+K / Ctrl+K: Focus Chat Input
      if (cmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Cmd+N / Ctrl+N: Start New Chat
      if (cmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleStartNewChat();
        return;
      }

      // Cmd+Shift+S / Ctrl+Shift+S: Toggle Web Search
      if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setWebSearch((prev) => { const next = !prev; localStorage.setItem('zenixmind-web-search', next ? 'on' : 'off'); return next; });
        return;
      }

      // Cmd+Shift+D / Ctrl+Shift+D: Toggle Deep Reasoning
      if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDeepThink((prev) => !prev);
        return;
      }

      // Escape: Close Settings Modal
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleStartNewChat, settingsOpen]);

  const handleShareConversation = async () => {
    if (!conversationId) throw new Error('Save a message before sharing this chat.');
    const response = await chatApiFetch('/api/chat/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId })
    });
    if (!response.ok) throw new Error('Unable to create a share link.');
    const result = await response.json();
    if (!result.shareToken) throw new Error('The share link was not returned.');
    const shareUrl = `${window.location.origin}/share/${result.shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    setShareNotice('Chat link copied. You can paste it anywhere to share this conversation.');
    window.setTimeout(() => setShareNotice(''), 2600);
  };

  const loadConversations = async () => {
    try {
      const r = await chatApiFetch('/api/chat', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setConversations(data.conversations || []);
      }
    } catch {}
  };

  const loadConversation = async (id: string) => {
    try {
      const r = await chatApiFetch(`/api/chat?conversation_id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        setConversationId(d.conversation?.id || id);
        if (d.conversation?.model) {
          handleModelChange(d.conversation.model);
        }
        const restoredMessages = await Promise.all(
          (d.messages || [])
            .filter((m: Message) => m.role === 'user' || m.role === 'assistant')
            .map(async (m: Message) => {
              let content = m.content;
              const mediaPath = content.match(/zenix-(?:storage|download):\/\/([^\s)]+)/)?.[1];
              if (mediaPath && user?.id && mediaPath.startsWith(user.id + '/')) {
                const [imageResult, downloadResult] = await Promise.all([
                  getSupabase().storage.from('library').createSignedUrl(mediaPath, 60 * 60),
                  getSupabase().storage.from('library').createSignedUrl(mediaPath, 60 * 60, { download: true })
                ]);
                if (imageResult.data?.signedUrl && downloadResult.data?.signedUrl) {
                  content = content
                    .replace(/zenix-storage:\/\/[^\s)]+/, imageResult.data.signedUrl)
                    .replace(/zenix-download:\/\/[^\s)]+/, downloadResult.data.signedUrl);
                } else {
                  content = 'This generated image is still in your Library, but its preview link could not be refreshed. Open Library to access it.';
                }
              }
              return {
                role: m.role,
                content,
                model_used: m.model_used,
                sources: m.sources,
                liked: m.liked,
                disliked: m.disliked,
                reactions: m.reactions,
                userReactions: m.userReactions
              };
            })
        );
        setMessages(restoredMessages);
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }
    } catch {
    }
  };

  useEffect(() => {
    loadConversations();
    if (urlConvId) {
      loadConversation(urlConvId);
    } else {
      setConversationId(null);
      setMessages([]);
    }
    if (searchParams.get('settings') === '1') {
      setSettingsOpen(true);
    }
    if (urlQuery && !urlConvId) {
      setInput(urlQuery);
    }
  }, [urlConvId, searchParams]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('auto');
    }
  }, [messages, scrollToBottom]);

  const handleUpdateMessageReaction = (index: number, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, ...updates } : msg))
    );
  };

  const stopGeneration = () => {
    generationControllerRef.current?.abort();
  };

  const prepareAttachment = async (file: File) => {
    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error('That file is larger than 8 MB. Please choose a smaller file.');
    }

    const textLike = file.type.startsWith('text/') ||
      /^(application\/(json|csv)|text\/(csv|markdown)|application\/javascript)$/i.test(file.type) ||
      /\.(txt|md|markdown|csv|json|ts|tsx|js|jsx|py|html|css|xml|yaml|yml)$/i.test(file.name);

    if (textLike) {
      const text = await file.text();
      return {
        name: file.name,
        mimeType: file.type || 'text/plain',
        text: text.slice(0, 200000)
      };
    }

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Unable to read that file.'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });
      return { name: file.name, mimeType: file.type, data };
    }

    throw new Error('ZenixMind currently supports text files, PDFs, and images in the chat composer.');
  };

  const handleSend = async (overridePrompt?: string, voiceMode = false): Promise<string | undefined> => {
    const text = overridePrompt || input.trim();
    if (!text || busy || isStreaming) return;

    // Commands are parsed centrally so autocomplete, aliases, and execution stay consistent.
    const parsedCommand = parseChatCommand(text);
    if (isUnknownSlashCommand(text)) {
      setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: 'I do not recognize that command. Type /help to see the available ZenixMind commands.' }]);
      setInput('');
      return;
    }
    const naturalImageIntent = text.match(/^\s*(?:please\s+)?(?:create|generate|draw|make|design)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration|artwork)\s*(?:of|showing|with|:)?\s+([\s\S]+)$/i);
    const imagePrompt = parsedCommand?.command === 'image' ? parsedCommand.prompt : naturalImageIntent?.[1]?.trim();
    if (parsedCommand?.command === 'image' && !imagePrompt) {
      setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: 'Add a description after /image. Example: /image a cinematic mountain landscape at sunrise.' }]);
      setInput('');
      return;
    }
    if (imagePrompt) {
      if (!user?.id) {
        setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: 'Sign in to generate images and save them to your ZenixMind Library.' }]);
        return;
      }
      const cleanImagePrompt = imagePrompt.trim();
      setInput('');
      setBusy(true);
      setIsStreaming(true);
      setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: 'Creating your image…', isStreaming: true }]);
      try {
        const supabase = getSupabase();
        let activeConversationId = conversationId;
        if (activeConversationId) {
          const { data: existingConversation, error: conversationError } = await supabase.from('conversations')
            .select('id,project_id').eq('id', activeConversationId).eq('user_id', user.id).maybeSingle();
          if (conversationError || !existingConversation) throw new Error('This conversation could not be verified. Start a new chat and try again.');
          if (activeProjectId && existingConversation.project_id && existingConversation.project_id !== activeProjectId) throw new Error('This conversation belongs to a different project.');
          if (activeProjectId && !existingConversation.project_id) {
            const { error: projectAssignError } = await supabase.from('conversations').update({ project_id: activeProjectId }).eq('id', activeConversationId).eq('user_id', user.id);
            if (projectAssignError) throw new Error('This conversation could not be added to the project.');
          }
        } else {
          const { data: createdConversation, error: createError } = await supabase.from('conversations')
            .insert({ user_id: user.id, title: cleanImagePrompt.slice(0, 64), model: selectedModel, project_id: activeProjectId }).select('id').single();
          if (createError || !createdConversation) throw new Error('Could not create a conversation for this image.');
          activeConversationId = createdConversation.id;
          setConversationId(activeConversationId);
        }
        if (!activeConversationId) throw new Error('Could not prepare this conversation for the generated image.');
        const response = await chatApiFetch('/api/generate-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleanImagePrompt, model: 'zimage', width: 1024, height: 1024 })
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Image generation failed. Please try again.');
        }
        const blob = await response.blob();
        const mimeType = blob.type || 'image/jpeg';
        if (!mimeType.startsWith('image/') || !blob.size || blob.size > 15 * 1024 * 1024) throw new Error('The image provider returned an invalid image.');
        const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg';
        const storagePath = user.id + '/' + crypto.randomUUID() + '-chat-image.' + extension;
        const { error: uploadError } = await supabase.storage.from('library').upload(storagePath, blob, { contentType: mimeType, upsert: false });
        if (uploadError) throw new Error('Image created but could not be saved to your Library: ' + uploadError.message);
        const fileName = 'ZenixMind image.' + extension;
        const { error: libraryError } = await supabase.from('library_items').insert({
          user_id: user.id, file_name: fileName, mime_type: mimeType, storage_path: storagePath,
          size_bytes: blob.size, source: 'generated', prompt: cleanImagePrompt
        });
        if (libraryError) {
          await supabase.storage.from('library').remove([storagePath]);
          throw new Error('Image could not be added to your Library: ' + libraryError.message);
        }
        const [{ data: imageLink, error: imageLinkError }, { data: downloadLink, error: downloadLinkError }] = await Promise.all([
          supabase.storage.from('library').createSignedUrl(storagePath, 60 * 60 * 24 * 7),
          supabase.storage.from('library').createSignedUrl(storagePath, 60 * 60 * 24 * 7, { download: fileName })
        ]);
        if (imageLinkError || downloadLinkError || !imageLink?.signedUrl || !downloadLink?.signedUrl) throw new Error('Image saved to your Library, but its chat links could not be created.');
        const assistantContent = '![Generated image](' + imageLink.signedUrl + ')\n\n[Download image](' + downloadLink.signedUrl + ')';
        const persistedContent = '![Generated image](zenix-storage://' + storagePath + ')\n\n[Download image](zenix-download://' + storagePath + ')';
        const { error: messagesError } = await supabase.from('messages').insert([
          { conversation_id: activeConversationId, user_id: user.id, role: 'user', content: text },
          { conversation_id: activeConversationId, user_id: user.id, role: 'assistant', content: persistedContent }
        ]);
        if (messagesError) throw new Error('Image saved to your Library, but this chat could not be saved.');
        setSearchParams((previous) => {
          const next = new URLSearchParams(previous);
          next.set('conversation', activeConversationId!);
          return next;
        });
        await supabase.from('conversations').update({ updated_at: new Date().toISOString(), model: selectedModel })
          .eq('id', activeConversationId).eq('user_id', user.id);
        setMessages((previous) => previous.map((message, index) =>
          index === previous.length - 1 ? { role: 'assistant', content: assistantContent } : message
        ));
        void loadConversations();
      } catch (error: any) {
        setMessages((previous) => previous.map((message, index) =>
          index === previous.length - 1 ? { role: 'assistant', content: error?.message || 'Image generation failed. Please try again.' } : message
        ));
      } finally {
        setBusy(false);
        setIsStreaming(false);
      }
      return;
    }

    let fullPrompt = text;
    let requestWebSearch = webSearch;
    let requestDeepResearch = deepResearch;
    if (parsedCommand) {
      const command = getChatCommand(parsedCommand.command);
      if (command?.action === 'help') {
        const helpText = 'Available commands: /image (aliases: /imagine, /draw, /create-image), /search for quick web search, /research (alias: /deep-research) for a cited deep research report, /summarize, /write, /translate, /explain, /code, /analyze, and /build. Type a command to see its suggestion, then add your prompt. Image generation saves results to your private Library.';
        setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: helpText }]);
        setInput('');
        return;
      }
      if (command?.action === 'search') {
        if (!parsedCommand.prompt) {
          setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: 'Add a topic after /search. Example: /search latest AI developments.' }]);
          setInput('');
          return;
        }
        requestWebSearch = true;
      } else if (command?.action === 'research') {
        if (!parsedCommand.prompt) {
          setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: 'Add a research topic after /research. Example: /research compare the leading AI coding tools.' }]);
          setInput('');
          return;
        }
        requestDeepResearch = true;
      } else if (command?.action === 'prompt' && !parsedCommand.prompt) {
        setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: `Add a request after ${command.trigger}. For example: ${command.trigger} explain how APIs work` }]);
        setInput('');
        return;
      }
    }
    let attachmentPayload: any = null;
    if (attachedFile) {
      try {
        attachmentPayload = await prepareAttachment(attachedFile);

        // Persistent Library storage is intentionally disabled in Temporary Chat.
        if (!temporaryChat && user?.id) {
          try {
            const safeName = attachedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
            const { error: uploadError } = await getSupabase()
              .storage
              .from('library')
              .upload(storagePath, attachedFile, {
                contentType: attachedFile.type || 'application/octet-stream',
                upsert: false
              });
            if (!uploadError) {
              await getSupabase().from('library_items').insert({
                user_id: user.id,
                file_name: attachedFile.name,
                mime_type: attachedFile.type || null,
                storage_path: storagePath,
                size_bytes: attachedFile.size,
                source: 'uploaded',
                prompt: text.slice(0, 1000)
              });
            }
          } catch (libraryError) {
            console.warn('Could not persist chat attachment to Library:', libraryError);
          }
        }

        fullPrompt = `[Attached file: ${attachedFile.name}]\n\n${fullPrompt}`;
      } catch (error: any) {
        window.alert(error?.message || 'Unable to read that attachment.');
        return;
      }
    }

    const displayUserMessage = attachedFile ? fullPrompt : text;
    const nextMessages = [...messages, { role: 'user' as const, content: displayUserMessage }];
    setMessages(nextMessages);
    if (!overridePrompt) {
      setInput('');
      setAttachedFile(null);
    }

    setBusy(true);
    setIsStreaming(true);
    setThinkingStatus(requestDeepResearch ? 'researching' : requestWebSearch ? 'searching' : deepThink ? 'preparing' : 'thinking');
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom('smooth'), 20);

    const assistantMsgIndex = nextMessages.length;
    setMessages((curr) => [
      ...curr,
      {
        role: 'assistant',
        content: '',
        isStreaming: true
      }
    ]);

    const controller = new AbortController();
    generationControllerRef.current = controller;

    try {
      const response = await chatApiFetch('/api/chat/stream', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          conversationId,
          projectId: activeProjectId,
          model: selectedModel,
          webSearch: requestWebSearch,
          research: requestDeepResearch,
          command: parsedCommand?.command || null,
          searchQuery: parsedCommand && ['search', 'research'].includes(parsedCommand.command) ? parsedCommand.prompt : undefined,
          deepThink,
          temporaryChat,
          attachment: attachmentPayload,
          preferences: {
            memory: localStorage.getItem('zenixmind-memory') !== 'off',
            personality: localStorage.getItem('zenixmind-personality') || 'Balanced',
            responseLength: localStorage.getItem('zenixmind-response-length') || 'Adaptive',
            customInstructions: localStorage.getItem('zenixmind-custom-instructions') || '',
            onlineSearch: webSearch,
            theme: localStorage.getItem('zenixmind-theme') || 'Dark',
            accent: localStorage.getItem('zenixmind-accent') || 'Pink',
            language: localStorage.getItem('zenixmind-language') || 'Auto',
            activeView: view
          }
        })
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Chat stream failed.');
      }

      setBusy(false);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';
      let meta: any = null;

      const applyEvent = (event: any) => {
        if (!event) return;
        if (event.type === 'status') {
          setThinkingStatus(event.status || 'thinking');
          return;
        }
        if (event.type === 'meta') {
          meta = event;
          if (event.conversationId) {
            setConversationId(event.conversationId);
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('conversation', event.conversationId);
              return next;
            });
          }
          setMessages((curr) => {
            const updated = [...curr];
            if (updated[assistantMsgIndex]) {
              updated[assistantMsgIndex] = {
                ...updated[assistantMsgIndex],
                model_used: event.modelUsed,
                sources: event.sources
              };
            }
            return updated;
          });
          return;
        }
        if (event.type === 'sources') {
          if (meta) meta.sources = event.sources || [];
          setMessages((curr) => {
            const updated = [...curr];
            if (updated[assistantMsgIndex]) {
              updated[assistantMsgIndex] = {
                ...updated[assistantMsgIndex],
                sources: event.sources || []
              };
            }
            return updated;
          });
          return;
        }
        if (event.type === 'delta') {
          if (event.text) {
            assistantText += event.text;
            setThinkingStatus(null);
            setMessages((curr) => {
              const updated = [...curr];
              if (updated[assistantMsgIndex]) {
                updated[assistantMsgIndex] = {
                  ...updated[assistantMsgIndex],
                  content: assistantText,
                  isStreaming: true
                };
              }
              return updated;
            });
            if (isAtBottomRef.current) scrollToBottom('auto');
          }
          return;
        }
        if (event.type === 'done') {
          setMessages((curr) => {
            const updated = [...curr];
            if (updated[assistantMsgIndex]) {
              updated[assistantMsgIndex] = {
                ...updated[assistantMsgIndex],
                content: assistantText || event.text || '',
                model_used: meta?.modelUsed,
                sources: meta?.sources,
                isStreaming: false
              };
            }
            return updated;
          });
          setThinkingStatus(null);
        }
        if (event.type === 'error') {
          throw new Error(event.error || 'AI stream failed.');
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = splitSseFrames(buffer);
        buffer = parsed.remainder;

        for (const frame of parsed.frames) {
          applyEvent(parseSseEvent(frame));
        }
      }

      if (buffer.trim()) {
        applyEvent(parseSseEvent(buffer));
      }

      setBusy(false);
      setIsStreaming(false);
      setThinkingStatus(null);
      loadConversations();
      setTimeout(() => scrollToBottom('smooth'), 30);
      if (voiceMode) return assistantText;
    } catch (err: any) {
      const cancelled = err?.name === 'AbortError' || controller.signal.aborted;
      setBusy(false);
      setIsStreaming(false);
      setThinkingStatus(null);

      if (cancelled) {
        setMessages((curr) => {
          const updated = [...curr];
          const existing = updated[assistantMsgIndex];
          if (existing) {
            if (existing.content.trim()) {
              updated[assistantMsgIndex] = {
                ...existing,
                isStreaming: false
              };
            } else {
              updated.splice(assistantMsgIndex, 1);
            }
          }
          return updated;
        });
      } else {
        setMessages((curr) => {
          const updated = [...curr];
          const existing = updated[assistantMsgIndex];
          if (existing) {
            updated[assistantMsgIndex] = {
              ...existing,
              content: err.message || 'Unable to connect to AI engine.',
              isStreaming: false
            };
          }
          return updated;
        });
      }

      setTimeout(() => scrollToBottom('smooth'), 30);
    } finally {
      if (generationControllerRef.current === controller) {
        generationControllerRef.current = null;
      }
    }
  };

  const handleDictation = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!SpeechRecognition) {
      setDictationError('Voice typing is not supported in this browser. Try Chrome on Android.');
      return;
    }

    setDictationError('');
    dictationBaseRef.current = input.trim();
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript || '';
      }
      const base = dictationBaseRef.current;
      setInput(base ? `${base}${transcript ? ' ' + transcript.trim() : ''}` : transcript.trim());
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setDictationError('Microphone permission was blocked. Allow microphone access in your browser settings and try again.');
      } else if (event?.error === 'no-speech') {
        setDictationError('No speech detected. Tap the microphone and try speaking again.');
      } else if (event?.error === 'audio-capture') {
        setDictationError('No microphone was found. Check your device microphone and try again.');
      } else if (event?.error !== 'aborted') {
        setDictationError('Voice typing stopped unexpectedly. Please try again.');
      }
    };
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setDictationError('Could not start voice typing. Please try again.');
    }
  };

  return (
    <WorkspaceShell
      active={projectId || projectChatId || view === 'projects' ? 'projects' : view}
      title={
        projectId
          ? 'Project'
          : view === 'projects'
          ? 'Projects'
          : view === 'chat'
          ? 'ZenixMind'
          : view === 'images'
          ? 'Imagine Studio'
          : view === 'library'
          ? 'Library'
          : 'Automations'
      }
      conversations={conversations}
      selectedModel={selectedModel}
      onSelectModel={handleModelChange}
      onOpenSettings={() => setSettingsOpen(true)}
      headerAction={view !== 'chat' ? 'none' : 'new'}
      onNewChat={handleStartNewChat}
      onShareConversation={handleShareConversation}
    >
      <div className="relative flex-1 flex flex-col h-[calc(100dvh-56px)] min-h-0 overflow-hidden bg-[#050506]">
        {projectId && !projectChatId && <ProjectView projectId={projectId} userId={user?.id} onDeleted={handleProjectDeleted} />}
        {!projectId && view === 'images' && <ImagesView />}
        {!projectId && view === 'library' && <LibraryView />}
        {!projectId && view === 'automations' && <AutomationsView userId={user?.id} />}
        {!projectId && view === 'projects' && <ProjectsView userId={user?.id} />}

        {(!projectId || projectChatId) && view === 'chat' && (
          <div className="relative flex flex-1 flex-col h-full overflow-hidden">
            {/* Messages Scroll Area with auto-scroll tracking */}
            <div
              ref={chatScrollRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 pb-44 sm:pb-32"
            >
              {!messages.length ? (
                <div className="min-h-full" aria-label="New chat" />
              ) : (
                <div ref={messagesContainerRef} className="mx-auto max-w-[820px] space-y-8 sm:space-y-9">
                  {messages.map((m, idx) => (
                    <ChatMessageItem
                      key={idx}
                      message={m}
                      onUpdateReaction={(updates) => handleUpdateMessageReaction(idx, updates)}
                      onShare={conversationId ? handleShareConversation : undefined}
                      onRegenerate={
                        idx === messages.length - 1 && m.role === 'assistant'
                          ? () => {
                              const lastUserMsg = [...messages].reverse().find((x) => x.role === 'user');
                              if (lastUserMsg) {
                                handleSend(lastUserMsg.content);
                              }
                            }
                          : undefined
                      }
                    />
                  ))}

                  {thinkingStatus && (
                    <div className="flex items-center gap-3 py-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5 rounded-full border border-white/[.065] bg-[#0d0d10] px-3.5 py-2 text-[11px] text-zinc-400 shadow-sm">
                        <span className="flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-zinc-500 animate-pulse" />
                          <span className="h-1 w-1 rounded-full bg-zinc-400 animate-pulse [animation-delay:120ms]" />
                          <span className="h-1 w-1 rounded-full bg-zinc-300 animate-pulse [animation-delay:240ms]" />
                        </span>
                        <span>
                          {thinkingStatus === 'searching'
                            ? 'Searching'
                            : thinkingStatus === 'preparing'
                            ? 'Planning a careful response'
                            : thinkingStatus === 'generating'
                            ? 'Drafting your answer'
                            : thinkingStatus === 'writing'
                            ? 'Writing'
                            : thinkingStatus === 'researching'
                            ? 'Researching'
                            : ['planning research', 'searching sources', 'investigating subtopics', 'writing research report'].includes(thinkingStatus)
                            ? thinkingStatus.charAt(0).toUpperCase() + thinkingStatus.slice(1)
                            : thinkingStatus === 'thinking'
                            ? 'Thinking through your question'
                            : 'Preparing your response'}
                        </span>
                      </div>
                    </div>
                  )}

                  {shareNotice && (
                    <div role="status" className="mx-auto max-w-3xl rounded-lg border border-white/[.07] bg-[#111114] px-3 py-2 text-center text-[11px] text-zinc-400">
                      {shareNotice}
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            {/* Floating Jump to Bottom Button if user scrolled up */}
            {!isAtBottom && messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  scrollToBottom('smooth');
                  setIsAtBottom(true);
                  isAtBottomRef.current = true;
                }}
                className="absolute bottom-28 right-6 z-40 flex items-center gap-1.5 rounded-full border border-white/[.12] bg-[#121216]/90 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow-xl backdrop-blur-md hover:bg-[#1a1a20] hover:text-white transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <span>Latest message</span>
                <ArrowDown size={13} className="text-amber-400" />
              </button>
            )}

            {/* Bottom Floating Glassmorphic Composer */}
            <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 bg-gradient-to-t from-[#050506] via-[#050506]/90 to-transparent">
              <div className="pointer-events-auto">
                {!messages.length && (
                  <div className="mx-auto mb-2 flex max-w-3xl items-center gap-4 px-3 sm:px-0">
                    <button type="button" onClick={() => { setInput('Create an image or sticker: '); inputRef.current?.focus(); }} className="inline-flex min-h-8 items-center gap-2 rounded-full px-2 text-[11px] text-zinc-400 transition hover:bg-white/[.06] hover:text-zinc-100">
                      <ImageIcon size={14} /> Create an image or sticker
                    </button>
                    <button type="button" onClick={() => { setInput('Help me write or edit: '); inputRef.current?.focus(); }} className="inline-flex min-h-8 items-center gap-2 rounded-full px-2 text-[11px] text-zinc-400 transition hover:bg-white/[.06] hover:text-zinc-100">
                      <Wand2 size={14} /> Write or edit
                    </button>
                  </div>
                )}
                {temporaryChat && (
                  <div role="status" className="mx-auto mb-2 flex w-full max-w-3xl items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[.06] px-3 py-2 text-[11px] text-amber-100/80">
                    <Info size={13} className="shrink-0" />
                    <span><strong className="font-semibold text-amber-100">Temporary Chat is on.</strong> New messages won't be saved to chat history.</span>
                  </div>
                )}
                <CompactFloatingComposer
                  ref={inputRef}
                  value={input}
                  setValue={setInput}
                  onSend={() => handleSend()}
                  onStop={stopGeneration}
                  onOpenVoice={() => setVoiceTalkOpen(true)}
                  onCloseVoice={() => setVoiceTalkOpen(false)}
                  voiceOpen={voiceTalkOpen}
                  busy={busy || isStreaming}
                  selectedModel={selectedModel}
                  onSelectModel={handleModelChange}
                  webSearch={webSearch}
                  setWebSearch={setWebSearch}
                  deepThink={deepThink}
                  setDeepThink={setDeepThink}
                  deepResearch={deepResearch}
                  setDeepResearch={setDeepResearch}
                  onDictate={handleDictation}
                  isListening={isListening}
                  dictationError={dictationError}
                  onAttachFile={setAttachedFile}
                  attachmentName={attachedFile?.name}
                  onClearAttachment={() => setAttachedFile(null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <VoiceTalk
        open={voiceTalkOpen}
        busy={busy || isStreaming}
        onClose={() => setVoiceTalkOpen(false)}
        onVoiceMessage={(text) => handleSend(text, true)}
      />

      {settingsOpen && (
        <SettingsModal
          webSearch={webSearch}
          onWebSearchChange={(enabled) => { setWebSearch(enabled); localStorage.setItem('zenixmind-web-search', enabled ? 'on' : 'off'); }}
          deepThink={deepThink}
          onDeepThinkChange={(enabled) => { setDeepThink(enabled); localStorage.setItem('zenixmind-default-thinking', enabled ? 'deep' : 'quick'); }}
          temporaryChat={temporaryChat}
          onTemporaryChatChange={(enabled) => { setTemporaryChat(enabled); localStorage.setItem('zenixmind-temporary-chat', enabled ? 'on' : 'off'); if (enabled) { setConversationId(null); setMessages([]); navigate('/assistant', { replace: true }); } }}
          onClose={() => setSettingsOpen(false)}
          onClearChats={() => {
            setMessages([]);
            setConversationId(null);
            loadConversations();
          }}
        />
      )}
    </WorkspaceShell>
  );
}