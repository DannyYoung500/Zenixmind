import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { WorkspaceShell, Conversation } from '../components/workspace-shell';
import { ModelSelector } from '../components/model-selector';
import { MessageRenderer } from '../components/message-renderer';
import { useAuth } from '../lib/auth-context';
import { getSupabase } from '../lib/supabase';
import { parseSseEvent, splitSseFrames } from '../lib/sse-parser';
import { VoiceTalk } from '../components/voice-talk';
import {
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
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
  Info
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

function SettingsModal({ onClose, onClearChats }: { onClose: () => void; onClearChats: () => void }) {
  const { user } = useAuth();
  const [memory, setMemory] = useState(() => localStorage.getItem('zenixmind-memory') !== 'off');
  const [length, setLength] = useState(() => localStorage.getItem('zenixmind-response-length') || 'Adaptive');
  const [style, setStyle] = useState(() => localStorage.getItem('zenixmind-personality') || 'Balanced');
  const [customInstructions, setCustomInstructions] = useState(() => localStorage.getItem('zenixmind-custom-instructions') || '');
  const [memories, setMemories] = useState<Array<{ id: string; memory: string; category: string; source: string; created_at: string; updated_at: string }>>([]);
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memoryNotice, setMemoryNotice] = useState('');
  const [newMemory, setNewMemory] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [savingMemory, setSavingMemory] = useState(false);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);

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
      await chatApiFetch('/api/chat', { method: 'DELETE' });
      localStorage.removeItem('zenixmind_chats');
      localStorage.removeItem('zenixmind_messages');
      onClearChats();
      setNotice('All conversations cleared.');
    } catch { setNotice('Error clearing conversations.'); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-full max-h-[760px] w-full max-w-[820px] overflow-hidden rounded-3xl border border-white/[.08] bg-[#0f0f12] shadow-2xl">
        <aside className="hidden w-52 shrink-0 border-r border-white/[.06] bg-[#0a0a0c] p-4 sm:block">
          <div className="flex items-center justify-between pb-4"><span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Settings</span></div>
          <div className="space-y-1 text-xs">
            {['General & Models', 'Personalization', 'Memory', 'Shortcuts', 'Data & Storage'].map((tab, idx) => (
              <div key={tab} className={`rounded-xl px-3 py-2.5 font-medium transition-colors ${idx === 0 ? 'bg-[#1a1a1d] text-white' : 'text-zinc-500'}`}>{tab}</div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="flex items-center justify-between border-b border-white/[.06] px-6 py-4">
            <div><h2 className="text-sm font-semibold text-zinc-100">Preferences & Personalization</h2><p className="mt-0.5 text-[10px] text-zinc-600">Your settings and memories are tied to your account.</p></div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-[#1c1c1f] hover:text-zinc-200"><X size={16} /></button>
          </header>

          <div className="space-y-6 px-6 py-6 text-xs">
            <div className="rounded-2xl border border-white/[.06] bg-[#0a0a0c] p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200 mb-2.5"><Keyboard size={15} className="text-amber-400" /><span>Power User Keyboard Shortcuts</span></div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]"><span className="text-zinc-400">Focus chat input</span><kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘K / Ctrl+K</kbd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]"><span className="text-zinc-400">Start new chat</span><kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘N / Ctrl+N</kbd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]"><span className="text-zinc-400">Toggle Online Search</span><kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘⇧S / Ctrl+Shift+S</kbd></div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]"><span className="text-zinc-400">Toggle Deep Think</span><kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘⇧D / Ctrl+Shift+D</kbd></div>
              </div>
            </div>

            <div className="divide-y divide-white/[.06] border-y border-white/[.06]">
              <div className="flex items-center justify-between py-4">
                <div><div className="text-xs font-medium text-zinc-200">Continuous Context Memory</div><div className="text-[11px] text-zinc-500">Allow ZenixMind to use saved memories across conversations.</div></div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={memory} onChange={(e) => { setMemory(e.target.checked); savePref('zenixmind-memory', e.target.checked ? 'on' : 'off'); }} className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-[#202024] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-white peer-checked:after:translate-x-full peer-checked:after:bg-black"></div>
                </label>
              </div>

              <div className="py-4">
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

              <div className="flex items-center justify-between py-4">
                <div><div className="text-xs font-medium text-zinc-200">Persona & Tone</div><div className="text-[11px] text-zinc-500">Adjust the conversational voice.</div></div>
                <select value={style} onChange={(e) => { setStyle(e.target.value); savePref('zenixmind-personality', e.target.value); }} className="rounded-xl border border-white/[.08] bg-[#17171a] px-3 py-1.5 text-xs text-zinc-200 outline-none"><option value="Balanced">Balanced</option><option value="Professional">Professional & Analytical</option><option value="Friendly">Friendly & Enthusiastic</option><option value="Direct">Direct & Concise</option><option value="Creative">Creative & Expressive</option></select>
              </div>

              <div className="py-4">
                <div className="text-xs font-medium text-zinc-200">Custom System Instructions</div><div className="text-[11px] text-zinc-500 mb-2">Special instructions injected into all AI model prompts:</div>
                <textarea value={customInstructions} onChange={(e) => { setCustomInstructions(e.target.value); savePref('zenixmind-custom-instructions', e.target.value); }} placeholder="e.g. You are assisting a lead engineer. Prefer TypeScript code with explanations, skip boilerplate..." rows={3} className="w-full rounded-xl border border-white/[.08] bg-[#0b0b0d] p-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/[.2]" />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button type="button" onClick={handleExportData} disabled={exporting} className="flex w-full items-center justify-between rounded-xl border border-white/[.08] bg-[#121215] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-[#18181c] transition-colors"><span>Export workspace data & memories</span><Download size={14} className="text-zinc-400" /></button>
              <button type="button" onClick={handleDeleteAll} className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[.05] px-4 py-2.5 text-xs font-medium text-red-300 hover:bg-red-500/10 transition-colors"><span>Clear chat history</span><Trash2 size={14} /></button>
            </div>
            {notice && <p className="rounded-lg bg-white/[.05] p-2 text-center text-[11px] text-zinc-300">{notice}</p>}
          </div>
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
  onDictate: () => void;
  isListening: boolean;
  onAttachFile: (file: File) => void;
  attachmentName?: string;
  onClearAttachment: () => void;
}

const MODEL_SHORT_MAP: Record<string, { label: string; icon: string }> = {
  'zenix-auto': { label: 'Zenix Auto', icon: 'zap' },
  'zenix-lite': { label: 'Zenix Lite', icon: 'sparkles' },
  'zenix-4.6-fast': { label: 'Zenix Fast', icon: 'zap' },
  'zenix-4.6-pro': { label: 'Zenix Pro', icon: 'brain' },
  'zenix-4.6-reason': { label: 'Zenix Reason', icon: 'brain' },
  'zenix-4.6-build': { label: 'Zenix Build', icon: 'code' }
};

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
    onDictate,
    isListening,
    onAttachFile,
    attachmentName,
    onClearAttachment
  },
  textareaRef
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !busy) {
        onSend();
      }
    }
  };

  const hasText = Boolean(value.trim());
  const currentModelMeta = MODEL_SHORT_MAP[selectedModel] || { label: 'Fast', icon: 'zap' };

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
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAttachFile(file);
          }}
        />

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

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-2.5">
          {/* Left: Plus Button & Model Selector Pill */}
          <div className="flex items-center gap-2 relative">
            {/* Plus Button with Menu */}
            <div ref={plusRef} className="relative">
              <button
                type="button"
                onClick={() => setPlusMenuOpen((prev) => !prev)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#27272a] hover:bg-[#323236] text-zinc-200 hover:text-white transition-colors shadow-sm"
                title="Attach files & tools"
              >
                <Plus size={18} strokeWidth={2.2} />
              </button>

              {plusMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-2xl border border-white/[.1] bg-[#18181b] p-1.5 shadow-2xl z-50 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setPlusMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-200 hover:bg-[#27272a]"
                  >
                    <Paperclip size={14} className="text-zinc-400" />
                    <span>Upload document or image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWebSearch((v) => !v);
                      setPlusMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-zinc-200 hover:bg-[#27272a]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe size={14} className={webSearch ? 'text-cyan-400' : 'text-zinc-400'} />
                      <span>Search web</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${webSearch ? 'bg-cyan-500/20 text-cyan-300' : 'text-zinc-500'}`}>
                      {webSearch ? 'ON' : 'OFF'}
                    </span>
                  </button>

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
                      <span>Reasoning mode</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${deepThink ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-500'}`}>
                      {deepThink ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Model Pill: ⚡ Fast ⌵ */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setModelDropdownOpen((prev) => !prev)}
                className="flex h-9 items-center gap-1.5 rounded-full bg-[#27272a] hover:bg-[#323236] px-3.5 text-xs font-semibold text-white transition-colors shadow-sm"
                title="Select AI Model"
              >
                <Zap size={14} className="text-white fill-white" />
                <span>{currentModelMeta.label}</span>
                <ChevronDown size={13} className="text-zinc-400 strokeWidth={2.5}" />
              </button>

              {/* Model Dropdown Popup */}
              {modelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl border border-white/[.1] bg-[#18181b] p-1.5 shadow-2xl z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-white/[.05] mb-1">
                    Select Model
                  </div>
                  {[
                    { id: 'zenix-auto', name: 'Zenix Auto', desc: 'Adaptive everyday assistant', locked: false },
                    { id: 'zenix-lite', name: 'Zenix Lite', desc: 'Lightweight everyday tasks', locked: false },
                    { id: 'zenix-4.6-fast', name: 'Zenix 4.6 Fast', desc: 'Fast responses for work and building', locked: false },
                    { id: 'zenix-4.6-pro', name: 'Zenix 4.6 Pro · Coming soon', desc: 'Premium model — billing setup pending', locked: true },
                    { id: 'zenix-4.6-reason', name: 'Zenix 4.6 Reason · Coming soon', desc: 'Premium reasoning — not yet enabled', locked: true },
                    { id: 'zenix-4.6-build', name: 'Zenix 4.6 Build · Coming soon', desc: 'Premium coding model — not yet enabled', locked: true }
                  ].map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={m.locked}
                        onClick={() => {
                          if (m.locked) return;
                          onSelectModel(m.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                          m.locked ? 'cursor-not-allowed opacity-40' : isSelected ? 'bg-white/[.1] text-white' : 'text-zinc-300 hover:bg-[#27272a]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-white">{m.name}</div>
                          <div className="text-[10px] text-zinc-500">{m.desc}</div>
                        </div>
                        {isSelected && <Check size={14} className="text-amber-400 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Indicator tags if Web Search or Deep Reasoning is active */}
            {webSearch && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300">
                <Globe size={10} /> Search
              </span>
            )}
            {deepThink && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
                <Brain size={10} /> Reasoning
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
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [liked, setLiked] = useState(message.liked || false);
  const [disliked, setDisliked] = useState(message.disliked || false);

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
    const nextLiked = !liked;
    const nextDisliked = nextLiked ? false : disliked;
    setLiked(nextLiked);
    setDisliked(nextDisliked);
    onUpdateReaction?.({ liked: nextLiked, disliked: nextDisliked });
  };

  const handleDislike = () => {
    const nextDisliked = !disliked;
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
        <div className="max-w-[85%] rounded-[20px] rounded-br-sm bg-[#18181c] px-4 py-2.5 text-xs sm:text-[13.5px] font-light text-zinc-200 ring-1 ring-white/[.08] whitespace-pre-wrap leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'assistant' && message.isStreaming && !message.content.trim()) {
    return null;
  }

  return (
    <div className="flex gap-3 sm:gap-3.5 group animate-in fade-in duration-200">
      <BrandMark size={28} className="mt-1 shrink-0 text-zinc-200" />
      <div className="max-w-[92%] min-w-0 flex-1">
        {message.model_used && !message.isStreaming && (
          <div className="mb-1.5 text-[9px] uppercase tracking-[0.14em] text-zinc-600">
            {message.model_used}
          </div>
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mb-3">
            <button type="button" onClick={() => setSourcesOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/[.12] bg-[#151518] px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-[#202024]" aria-label={`View ${message.sources.length} web sources`}>
              <Globe size={14} /><span>Sources</span><span className="rounded-full bg-white/[.08] px-1.5 py-0.5 text-[10px] text-zinc-400">{message.sources.length}</span>
            </button>
            {sourcesOpen && (
              <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 backdrop-blur-[2px]" onClick={() => setSourcesOpen(false)}>
                <section role="dialog" aria-modal="true" aria-label="Web sources" className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-t-[28px] border border-white/[.09] bg-[#171719] shadow-2xl animate-in slide-in-from-bottom-4 duration-200" onClick={(event) => event.stopPropagation()}>
                  <div className="flex justify-center pb-3 pt-3"><span className="h-1.5 w-14 rounded-full bg-zinc-500/70" /></div>
                  <div className="flex items-center justify-between px-5 pb-4"><h3 className="text-xl font-medium tracking-tight text-zinc-100">Sources</h3><button type="button" onClick={() => setSourcesOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-white/[.08]" aria-label="Close sources"><X size={18} /></button></div>
                  <div className="max-h-[calc(82vh-76px)] space-y-5 overflow-y-auto px-5 pb-8">
                    {message.sources.map((src, i) => {
                      let domain = '';
                      try { domain = new URL(src.url).hostname.replace(/^www\./, ''); } catch {}
                      return <a key={`${src.url}-${i}`} href={src.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl py-1 text-left transition-colors hover:bg-white/[.035]">
                        <div className="mb-2 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full border border-white/[.08] bg-[#242428]"><Globe size={15} className="text-zinc-300" /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-zinc-200">{domain || src.title}</span><span className="block text-[11px] text-zinc-500">{domain}</span></span><ExternalLink size={13} className="ml-auto shrink-0 text-zinc-500" /></div>
                        <h4 className="text-[15px] font-medium leading-6 text-zinc-100">{src.title}</h4>
                        {src.snippet && <p className="mt-1 line-clamp-3 text-sm leading-6 text-zinc-400">{src.snippet}</p>}
                      </a>;
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <MessageRenderer content={message.content} />
          {message.isStreaming && (
            <span className="ml-1 inline-block h-4 w-1.5 translate-y-[3px] rounded-full bg-amber-400 align-middle animate-pulse" />
          )}
        </div>

        {!message.isStreaming && message.content.trim() && (
          <div className="mt-2.5 flex items-center gap-0.5 border-t border-white/[.045] pt-2 opacity-75 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={handleCopy}
              className="grid h-7 w-7 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[.045] hover:text-zinc-200"
              title={copied ? 'Copied' : 'Copy'}
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>

            <button
              type="button"
              onClick={handleSpeak}
              className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${
                speaking
                  ? 'bg-amber-400/10 text-amber-300'
                  : 'text-zinc-500 hover:bg-white/[.045] hover:text-zinc-200'
              }`}
              title={speaking ? 'Stop listening' : 'Listen'}
            >
              <Volume2 size={13} />
            </button>

            <button
              type="button"
              onClick={handleLike}
              className={`grid h-8 w-8 place-items-center rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                liked ? 'bg-white/[.08] text-white border border-white/[.12]' : 'border-transparent text-zinc-500 hover:bg-white/[.06] hover:text-zinc-200'
              }`}
              title="Like"
              aria-label="Like response"
              aria-pressed={liked}
            >
              <ThumbsUp size={14} strokeWidth={1.9} className={liked ? 'fill-white/15' : ''} />
            </button>

            <button
              type="button"
              onClick={handleDislike}
              className={`grid h-8 w-8 place-items-center rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/30 ${
                disliked ? 'bg-rose-500/[.08] text-rose-300 border-rose-400/20' : 'border-transparent text-zinc-500 hover:bg-white/[.06] hover:text-zinc-200'
              }`}
              title="Dislike"
              aria-label="Dislike response"
              aria-pressed={disliked}
            >
              <ThumbsDown size={14} strokeWidth={1.9} className={disliked ? 'fill-rose-400/15' : ''} />
            </button>

            <div className="mx-1 h-4 w-px bg-white/[.07]" />

            {onShare && (
              <button
                type="button"
                onClick={() => void handleShare()}
                disabled={sharing}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-white/[.045] hover:text-zinc-100 disabled:opacity-50"
                title="Share this chat"
                aria-label="Share this chat"
              >
                <Share2 size={13} />
                <span>{sharing ? 'Sharing…' : shareFailed ? 'Try again' : shareDone ? 'Copied' : 'Share'}</span>
              </button>
            )}

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="ml-0.5 grid h-7 w-7 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[.045] hover:text-zinc-200"
                title="Regenerate"
              >
                <RotateCcw size={13} />
              </button>
            )}
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
    <div className="h-full min-h-0 w-full flex-1 overflow-y-auto overscroll-contain bg-black px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pt-6">
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

function AutomationsView() {
  const [automations, setAutomations] = useState([
    {
      id: 'auto-1',
      title: 'Morning AI Briefing',
      description: 'Summarizes top technology, market news, and research papers daily at 8:00 AM.',
      schedule: 'Daily at 8:00 AM',
      enabled: true,
      model: 'Gemini 2.5 Flash'
    },
    {
      id: 'auto-2',
      title: 'Repository Architecture Audit',
      description: 'Runs weekly deep analysis on code changes, type safety, and bundle optimization.',
      schedule: 'Every Monday',
      enabled: true,
      model: 'Claude 3.7 Sonnet'
    },
    {
      id: 'auto-3',
      title: 'Real-time News & Grounding Digest',
      description: 'Scans live web sources and compiles structured bullet points on targeted keywords.',
      schedule: 'On Demand / Scheduled',
      enabled: false,
      model: 'Grok 3'
    }
  ]);

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-white/[.06]">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Automations</h1>
          <p className="text-xs text-zinc-500">Autonomous scheduled tasks, briefings, and background AI agents.</p>
        </div>
        <button
          onClick={() => alert('Custom trigger creation available in next workspace build.')}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-black hover:bg-white transition-all shadow-sm"
        >
          <Sparkles size={13} />
          <span>New automation</span>
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {automations.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-2xl border border-white/[.07] bg-[#0c0c0e] hover:border-white/[.15] transition-all"
          >
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200">{item.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[.06] text-zinc-400">
                  {item.model}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-light">{item.description}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                <span>⏱️ {item.schedule}</span>
              </div>
            </div>

            <label className="relative inline-flex cursor-pointer items-center shrink-0">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => toggleAutomation(item.id)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-[#202024] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-amber-400 peer-checked:after:translate-x-full peer-checked:after:bg-black"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectView({ projectId, userId, onDeleted }: { projectId: string; userId?: string; onDeleted: () => void }) {
  const [project, setProject] = useState<{ id: string; name: string; description: string; instructions: string; created_at: string; updated_at: string } | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.16em] text-zinc-600"><FolderClosed size={12} /> Project workspace</div>
        <h1 className="truncate text-2xl font-light tracking-[-.03em] text-zinc-100">{project.name}</h1>
        <p className="mt-2 text-xs text-zinc-500">Created {new Date(project.created_at).toLocaleDateString()}</p>
      </div>
      <button type="button" onClick={() => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('project');
          next.set('projectChat', project.id);
          return next;
        });
      }} className="shrink-0 rounded-xl border border-white/[.08] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[.05]">Open project chat</button>
      <button type="button" onClick={remove} className="shrink-0 rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">Delete</button>
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
  const [webSearch, setWebSearch] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [emptyGreeting, setEmptyGreeting] = useState('');
  const [voiceTalkOpen, setVoiceTalkOpen] = useState(false);
  const [shareNotice, setShareNotice] = useState('');

  const isAtBottomRef = useRef(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const generationControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const view = (searchParams.get('view') as 'chat' | 'images' | 'library' | 'automations') || 'chat';
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

  const loadEmptyGreeting = useCallback(async () => { setEmptyGreeting(''); try { const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; const response = await fetch('/api/greeting', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: user?.name || user?.email?.split('@')[0] || '', timezone, localTime: new Date().toISOString() }) }); if (response.ok) { const data = await response.json(); if (data.greeting) setEmptyGreeting(data.greeting); } } catch {} }, [user?.name, user?.email]);

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
        setWebSearch((prev) => !prev);
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
      loadEmptyGreeting();
    }
    if (searchParams.get('settings') === '1') {
      setSettingsOpen(true);
    }
    if (urlQuery && !urlConvId) {
      setInput(urlQuery);
    }
  }, [urlConvId, searchParams, loadEmptyGreeting]);

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

    const imageIntent = text.match(/^\s*(?:please\s+)?(?:create|generate|draw|make|design)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration|artwork)\s*(?:of|showing|with|:)?\s+([\s\S]+)$/i);
    if (imageIntent?.[1]?.trim()) {
      if (!user?.id) {
        setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: 'Sign in to generate images and save them to your ZenixMind Library.' }]);
        return;
      }
      const imagePrompt = imageIntent[1].trim();
      setInput('');
      setBusy(true);
      setIsStreaming(true);
      setMessages((previous) => [...previous, { role: 'user', content: text }, { role: 'assistant', content: 'Creating your image…', isStreaming: true }]);
      try {
        const supabase = getSupabase();
        let activeConversationId = conversationId;
        if (activeConversationId) {
          const { data: existingConversation, error: conversationError } = await supabase.from('conversations')
            .select('id').eq('id', activeConversationId).eq('user_id', user.id).maybeSingle();
          if (conversationError || !existingConversation) throw new Error('This conversation could not be verified. Start a new chat and try again.');
        } else {
          const { data: createdConversation, error: createError } = await supabase.from('conversations')
            .insert({ user_id: user.id, title: imagePrompt.slice(0, 64), model: selectedModel }).select('id').single();
          if (createError || !createdConversation) throw new Error('Could not create a conversation for this image.');
          activeConversationId = createdConversation.id;
          setConversationId(activeConversationId);
        }
        if (!activeConversationId) throw new Error('Could not prepare this conversation for the generated image.');
        const response = await chatApiFetch('/api/generate-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: imagePrompt, model: 'zimage', width: 1024, height: 1024 })
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
          size_bytes: blob.size, source: 'generated', prompt: imagePrompt
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
    let attachmentPayload: any = null;
    if (attachedFile) {
      try {
        attachmentPayload = await prepareAttachment(attachedFile);

        // Keep chat attachments available in the user's persistent Library.
        if (user?.id) {
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

        fullPrompt = `[Attached file: ${attachedFile.name}]\\n\\n${text}`;
      } catch (error: any) {
        window.alert(error?.message || 'Unable to read that attachment.');
        return;
      }
    }

    const nextMessages = [...messages, { role: 'user' as const, content: fullPrompt }];
    setMessages(nextMessages);
    if (!overridePrompt) {
      setInput('');
      setAttachedFile(null);
    }

    setBusy(true);
    setIsStreaming(true);
    setThinkingStatus(webSearch ? 'searching' : deepThink ? 'analyzing' : 'thinking');
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
          webSearch,
          deepThink,
          attachment: attachmentPayload,
          preferences: {
            memory: localStorage.getItem('zenixmind-memory') !== 'off',
            personality: localStorage.getItem('zenixmind-personality') || 'Balanced',
            responseLength: localStorage.getItem('zenixmind-response-length') || 'Adaptive',
            customInstructions: localStorage.getItem('zenixmind-custom-instructions') || ''
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

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <WorkspaceShell
      active={view}
      title={
        projectId
          ? 'Project'
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
    >
      <div className="relative flex-1 flex flex-col h-[calc(100dvh-56px)] min-h-0 overflow-hidden bg-[#050506]">
        {projectId && !projectChatId && <ProjectView projectId={projectId} userId={user?.id} onDeleted={handleProjectDeleted} />}
        {!projectId && view === 'images' && <ImagesView />}
        {!projectId && view === 'library' && <LibraryView />}
        {!projectId && view === 'automations' && <AutomationsView />}

        {(!projectId || projectChatId) && view === 'chat' && (
          <div className="relative flex flex-1 flex-col h-full overflow-hidden">
            {/* Messages Scroll Area with auto-scroll tracking */}
            <div
              ref={chatScrollRef}
              onScroll={handleScroll}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 pb-44 sm:pb-32"
            >
              {!messages.length ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto py-8">
                  <h1 className="max-w-xl text-2xl sm:text-3xl font-light tracking-[-.03em] text-zinc-100 min-h-[42px]">
                    {emptyGreeting || " "}
                  </h1>
                </div>
              ) : (
                <div ref={messagesContainerRef} className="mx-auto max-w-3xl space-y-6">
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
                            : thinkingStatus === 'analyzing'
                            ? 'Analyzing'
                            : thinkingStatus === 'writing'
                            ? 'Writing'
                            : 'Thinking'}
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
                  onDictate={handleDictation}
                  isListening={isListening}
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