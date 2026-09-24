import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { WorkspaceShell, Conversation } from '../components/workspace-shell';
import { ModelSelector } from '../components/model-selector';
import { MessageRenderer } from '../components/message-renderer';
import { useAuth } from '../lib/auth-context';
import { getSupabase } from '../lib/supabase';
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
  Smile,
  Command,
  Keyboard,
  Plus,
  ChevronDown,
  Zap
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
}

function SettingsModal({ onClose, onClearChats }: { onClose: () => void; onClearChats: () => void }) {
  const [memory, setMemory] = useState(() => localStorage.getItem('zenixmind-memory') !== 'off');
  const [length, setLength] = useState(() => localStorage.getItem('zenixmind-response-length') || 'Adaptive');
  const [style, setStyle] = useState(() => localStorage.getItem('zenixmind-personality') || 'Balanced');
  const [customInstructions, setCustomInstructions] = useState(
    () => localStorage.getItem('zenixmind-custom-instructions') || ''
  );
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);

  const savePref = (key: string, val: string) => {
    localStorage.setItem(key, val);
  };

  const handleExportData = async () => {
    setExporting(true);
    setNotice('');
    try {
      const response = await chatApiFetch('/api/chat?export=1');
      let exportData: any = {};
      if (response.ok) {
        exportData = await response.json();
      } else {
        const chats = localStorage.getItem('zenixmind_chats') || '[]';
        const msgs = localStorage.getItem('zenixmind_messages') || '{}';
        exportData = {
          exportedAt: new Date().toISOString(),
          conversations: JSON.parse(chats),
          messages: JSON.parse(msgs)
        };
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenixmind-workspace-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice('Workspace data exported successfully.');
    } catch {
      setNotice('Failed to export data.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to clear all conversations?')) {
      return;
    }
    try {
      await chatApiFetch('/api/chat', { method: 'DELETE' });
      localStorage.removeItem('zenixmind_chats');
      localStorage.removeItem('zenixmind_messages');
      onClearChats();
      setNotice('All conversations cleared.');
    } catch {
      setNotice('Error clearing conversations.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-full max-h-[640px] w-full max-w-[760px] overflow-hidden rounded-3xl border border-white/[.08] bg-[#0f0f12] shadow-2xl">
        <aside className="hidden w-52 shrink-0 border-r border-white/[.06] bg-[#0a0a0c] p-4 sm:block">
          <div className="flex items-center justify-between pb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Settings</span>
          </div>
          <div className="space-y-1 text-xs">
            {['General & Models', 'Personalization', 'Shortcuts', 'Data & Storage'].map((tab, idx) => (
              <div
                key={tab}
                className={`rounded-xl px-3 py-2.5 font-medium transition-colors ${
                  idx === 0 ? 'bg-[#1a1a1d] text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="flex items-center justify-between border-b border-white/[.06] px-6 py-4">
            <h2 className="text-sm font-semibold text-zinc-100">Preferences & Personalization</h2>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-[#1c1c1f] hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </header>

          <div className="space-y-6 px-6 py-6 text-xs">
            {/* Keyboard Shortcuts Reference Guide */}
            <div className="rounded-2xl border border-white/[.06] bg-[#0a0a0c] p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-200 mb-2.5">
                <Keyboard size={15} className="text-amber-400" />
                <span>Power User Keyboard Shortcuts</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]">
                  <span className="text-zinc-400">Focus chat input</span>
                  <kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘K / Ctrl+K</kbd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]">
                  <span className="text-zinc-400">Start new chat</span>
                  <kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘N / Ctrl+N</kbd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]">
                  <span className="text-zinc-400">Toggle Online Search</span>
                  <kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘⇧S / Ctrl+Shift+S</kbd>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#141418] px-2.5 py-1.5 border border-white/[.04]">
                  <span className="text-zinc-400">Toggle Deep Think</span>
                  <kbd className="font-mono bg-white/[.08] px-1.5 py-0.5 rounded text-zinc-200 text-[10px]">⌘⇧D / Ctrl+Shift+D</kbd>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/[.06] border-y border-white/[.06]">
              {/* Memory Toggle */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-xs font-medium text-zinc-200">Continuous Context Memory</div>
                  <div className="text-[11px] text-zinc-500">
                    Recall knowledge and preferences across conversations.
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={memory}
                    onChange={(e) => {
                      setMemory(e.target.checked);
                      savePref('zenixmind-memory', e.target.checked ? 'on' : 'off');
                    }}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-[#202024] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-white peer-checked:after:translate-x-full peer-checked:after:bg-black"></div>
                </label>
              </div>

              {/* Response Length */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-xs font-medium text-zinc-200">Response Detail</div>
                  <div className="text-[11px] text-zinc-500">Default answer length & depth.</div>
                </div>
                <select
                  value={length}
                  onChange={(e) => {
                    setLength(e.target.value);
                    savePref('zenixmind-response-length', e.target.value);
                  }}
                  className="rounded-xl border border-white/[.08] bg-[#17171a] px-3 py-1.5 text-xs text-zinc-200 outline-none"
                >
                  <option value="Adaptive">Adaptive</option>
                  <option value="Concise">Concise & Direct</option>
                  <option value="Detailed">Detailed</option>
                  <option value="Thorough">Thorough & Comprehensive</option>
                </select>
              </div>

              {/* Response Style */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-xs font-medium text-zinc-200">Persona & Tone</div>
                  <div className="text-[11px] text-zinc-500">Adjust the conversational voice.</div>
                </div>
                <select
                  value={style}
                  onChange={(e) => {
                    setStyle(e.target.value);
                    savePref('zenixmind-personality', e.target.value);
                  }}
                  className="rounded-xl border border-white/[.08] bg-[#17171a] px-3 py-1.5 text-xs text-zinc-200 outline-none"
                >
                  <option value="Balanced">Balanced</option>
                  <option value="Professional">Professional & Analytical</option>
                  <option value="Friendly">Friendly & Enthusiastic</option>
                  <option value="Direct">Direct & Concise</option>
                  <option value="Creative">Creative & Expressive</option>
                </select>
              </div>

              {/* Custom Instructions */}
              <div className="py-4">
                <div className="text-xs font-medium text-zinc-200">Custom System Instructions</div>
                <div className="text-[11px] text-zinc-500 mb-2">
                  Special instructions injected into all AI model prompts:
                </div>
                <textarea
                  value={customInstructions}
                  onChange={(e) => {
                    setCustomInstructions(e.target.value);
                    savePref('zenixmind-custom-instructions', e.target.value);
                  }}
                  placeholder="e.g. You are assisting a lead engineer. Prefer TypeScript code with explanations, skip boilerplate..."
                  rows={3}
                  className="w-full rounded-xl border border-white/[.08] bg-[#0b0b0d] p-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-white/[.2]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleExportData}
                disabled={exporting}
                className="flex w-full items-center justify-between rounded-xl border border-white/[.08] bg-[#121215] px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-[#18181c] transition-colors"
              >
                <span>Export workspace conversations</span>
                <Download size={14} className="text-zinc-400" />
              </button>

              <button
                type="button"
                onClick={handleDeleteAll}
                className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[.05] px-4 py-2.5 text-xs font-medium text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <span>Clear chat history</span>
                <Trash2 size={14} />
              </button>
            </div>

            {notice && (
              <p className="rounded-lg bg-white/[.05] p-2 text-center text-[11px] text-zinc-300">{notice}</p>
            )}
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
  'gemini-2.5-flash': { label: 'Fast', icon: 'zap' },
  'gemini-2.5-pro': { label: 'Pro', icon: 'brain' },
  'grok-3': { label: 'Grok', icon: 'sparkles' },
  'claude-3.7-sonnet': { label: 'Sonnet', icon: 'code' },
  'gpt-4o': { label: 'GPT-4o', icon: 'globe' },
  'deepseek-r1': { label: 'DeepSeek', icon: 'logic' }
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
      <div className="relative rounded-[28px] border border-white/[.1] bg-[#18181b] p-3 sm:p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all focus-within:border-white/[.2]">
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
          className="w-full resize-none bg-transparent px-2 sm:px-3 pt-1 text-sm sm:text-base text-zinc-100 outline-none placeholder:text-zinc-400/90 max-h-36 font-normal tracking-[-0.01em]"
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
                    { id: 'gemini-2.5-flash', name: 'Fast (Gemini 2.5 Flash)', desc: 'Lightning fast & multimodal' },
                    { id: 'gemini-2.5-pro', name: 'Pro (Gemini 2.5 Pro)', desc: 'Complex reasoning & code' },
                    { id: 'grok-3', name: 'Grok 3 (xAI)', desc: 'Live web & direct intelligence' },
                    { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', desc: 'Superior programming & logic' },
                    { id: 'gpt-4o', name: 'GPT-4o (OpenAI)', desc: 'Omnimodal general assistant' },
                    { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'Open reasoning & logic' }
                  ].map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(m.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                          isSelected ? 'bg-white/[.1] text-white' : 'text-zinc-300 hover:bg-[#27272a]'
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
              className={`grid h-9 w-9 place-items-center rounded-full transition-colors shadow-sm ${
                isListening
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse'
                  : 'bg-[#27272a] hover:bg-[#323236] text-zinc-200 hover:text-white'
              }`}
              title={isListening ? 'Listening for speech...' : 'Dictate speech to text'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
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

const POPULAR_EMOJIS = [
  { emoji: '💡', label: 'Insightful' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🚀', label: 'Fast & High Quality' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🧠', label: 'Brilliant' },
  { emoji: '👏', label: 'Applaud' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '⚡', label: 'Lightning' }
];

function ChatMessageItem({
  message,
  onRegenerate,
  onUpdateReaction
}: {
  message: Message;
  onRegenerate?: () => void;
  onUpdateReaction?: (update: Partial<Message>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [liked, setLiked] = useState(message.liked || false);
  const [disliked, setDisliked] = useState(message.disliked || false);
  const [reactions, setReactions] = useState<Record<string, number>>(message.reactions || {});
  const [userReactions, setUserReactions] = useState<string[]>(message.userReactions || []);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLiked(message.liked || false);
    setDisliked(message.disliked || false);
    setReactions(message.reactions || {});
    setUserReactions(message.userReactions || []);
  }, [message.liked, message.disliked, message.reactions, message.userReactions]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

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

  const handleToggleEmoji = (emoji: string) => {
    const previousEmoji = userReactions[0];
    const alreadyReacted = previousEmoji === emoji;
    const nextReactions = { ...reactions };

    if (previousEmoji && nextReactions[previousEmoji]) {
      const count = nextReactions[previousEmoji];
      if (count <= 1) delete nextReactions[previousEmoji];
      else nextReactions[previousEmoji] = count - 1;
    }

    const nextUserReactions = alreadyReacted ? [] : [emoji];

    if (!alreadyReacted) {
      nextReactions[emoji] = (nextReactions[emoji] || 0) + 1;
    }

    setReactions(nextReactions);
    setUserReactions(nextUserReactions);
    setShowEmojiPicker(false);
    onUpdateReaction?.({ reactions: nextReactions, userReactions: nextUserReactions });
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

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-in fade-in duration-200">
        <div className="max-w-[85%] rounded-[20px] rounded-br-sm bg-[#18181c] px-4 py-2.5 text-xs sm:text-[13.5px] font-light text-zinc-200 ring-1 ring-white/[.08] whitespace-pre-wrap leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const activeEmojiList = Object.entries(reactions).filter(([, count]) => count > 0);

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
          <div className="mb-3 rounded-2xl border border-cyan-500/15 bg-cyan-500/[.035] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-cyan-400">
              <Globe size={12} />
              <span>Sources · {message.sources.length}</span>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {message.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/[.06] bg-[#0c0c0e] px-2.5 py-2 text-[11px] text-zinc-300 transition-colors hover:border-cyan-500/30 hover:text-white"
                >
                  <span className="truncate pr-2">{src.title}</span>
                  <ExternalLink size={11} className="shrink-0 text-zinc-600" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <MessageRenderer content={message.content} />
          {message.isStreaming && (
            <span className="ml-1 inline-block h-4 w-1.5 translate-y-[3px] rounded-full bg-amber-400 align-middle animate-pulse" />
          )}
        </div>

        {activeEmojiList.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {activeEmojiList.map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggleEmoji(emoji)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-all ${
                  userReactions.includes(emoji)
                    ? 'border-amber-400/35 bg-amber-400/10 text-amber-200'
                    : 'border-white/[.07] bg-[#141417] text-zinc-500 hover:text-zinc-200'
                }`}
              >
                <span>{emoji}</span><span>{count}</span>
              </button>
            ))}
          </div>
        )}

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
              className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${
                liked ? 'bg-emerald-500/10 text-emerald-300' : 'text-zinc-500 hover:bg-white/[.045] hover:text-zinc-200'
              }`}
              title="Like"
            >
              <ThumbsUp size={13} className={liked ? 'fill-emerald-400/20' : ''} />
            </button>

            <button
              type="button"
              onClick={handleDislike}
              className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${
                disliked ? 'bg-rose-500/10 text-rose-300' : 'text-zinc-500 hover:bg-white/[.045] hover:text-zinc-200'
              }`}
              title="Dislike"
            >
              <ThumbsDown size={13} className={disliked ? 'fill-rose-400/20' : ''} />
            </button>

            <div className="mx-1 h-4 w-px bg-white/[.07]" />

            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${
                  showEmojiPicker ? 'bg-white/[.06] text-zinc-200' : 'text-zinc-500 hover:bg-white/[.045] hover:text-zinc-200'
                }`}
                title="React"
              >
                <Smile size={13} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 z-50 mb-2 flex items-center gap-0.5 rounded-xl border border-white/[.1] bg-[#111114] p-1.5 shadow-2xl backdrop-blur-xl">
                  {POPULAR_EMOJIS.map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => handleToggleEmoji(item.emoji)}
                      className="grid h-7 w-7 place-items-center rounded-lg text-sm transition-transform hover:scale-110 hover:bg-white/[.06]"
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
  const [isListening, setIsListening] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; prompt: string; url: string; title: string }>>([]);

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
      prompt: 'A cinematic movie still shot on 35mm anamorphic lens with dramatic depth of field and atmospheric lighting',
      image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'anime',
      title: 'Anime Aesthetic',
      prompt: 'Studio Ghibli inspired vibrant anime landscape with fluffy clouds and lush green hills',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'isometric',
      title: '3D Isometric Room',
      prompt: 'Isometric 3D render of a futuristic cyberpunk workstation room with glowing screens and plants',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'oil',
      title: 'Oil Painting',
      prompt: 'Classic Renaissance impressionist oil painting with visible rich brushstrokes and textured canvas',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim() || generating) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToUse.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedImages((prev) => [
          {
            id: 'gen-' + Date.now(),
            title: textToUse.slice(0, 30),
            prompt: textToUse.trim(),
            url: data.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
          },
          ...prev
        ]);
      } else {
        setGeneratedImages((prev) => [
          {
            id: 'gen-' + Date.now(),
            title: textToUse.slice(0, 30),
            prompt: textToUse.trim(),
            url: `https://picsum.photos/seed/${encodeURIComponent(textToUse.slice(0, 10))}/600/600`
          },
          ...prev
        ]);
      }
    } catch {
      setGeneratedImages((prev) => [
        {
          id: 'gen-' + Date.now(),
          title: textToUse.slice(0, 30),
          prompt: textToUse.trim(),
          url: `https://picsum.photos/seed/${encodeURIComponent(textToUse.slice(0, 10))}/600/600`
        },
        ...prev
      ]);
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
                  <img src={img.url} alt={img.prompt} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5">
                    <p className="truncate text-xs font-medium text-white">{img.prompt}</p>
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
              className="group relative aspect-[4/5] w-full overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/[.06] bg-[#141417] cursor-pointer shadow-md transition-all hover:scale-[1.02] hover:border-white/[.2] active:scale-[0.98]"
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
            className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none font-normal"
          />

          {/* Dictate Button */}
          <button
            type="button"
            onClick={handleDictate}
            className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
              isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-zinc-300 hover:text-white'
            }`}
            title="Dictate prompt"
          >
            <Mic size={17} />
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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'images' | 'documents'>('all');
  const [items, setItems] = useState<LibraryItem[]>([
    {
      id: 'lib-1',
      file_name: 'ZenixMind_Architecture_Notes.md',
      mime_type: 'text/markdown',
      size_bytes: 14200,
      source: 'uploaded',
      created_at: new Date().toISOString()
    },
    {
      id: 'lib-2',
      file_name: 'Product_Roadmap_2026.pdf',
      mime_type: 'application/pdf',
      size_bytes: 84000,
      source: 'uploaded',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'lib-3',
      file_name: 'Neural_Workspace_Concept.png',
      mime_type: 'image/png',
      size_bytes: 1204000,
      source: 'generated',
      prompt: 'Minimalist dark neural interface diagram',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file: File) => {
    const newItem: LibraryItem = {
      id: 'lib-' + Date.now(),
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      source: 'uploaded',
      created_at: new Date().toISOString()
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchQuery =
        item.file_name.toLowerCase().includes(query.toLowerCase()) ||
        (item.prompt && item.prompt.toLowerCase().includes(query.toLowerCase()));
      if (filter === 'images') return matchQuery && item.mime_type?.startsWith('image/');
      if (filter === 'documents') return matchQuery && !item.mime_type?.startsWith('image/');
      return matchQuery;
    });
  }, [items, query, filter]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-white/[.06]">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Library</h1>
          <p className="text-xs text-zinc-500">Your documents, reference images, and generated artifacts.</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-black hover:bg-white transition-all shadow-sm"
          >
            <Paperclip size={13} />
            <span>Upload file</span>
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#0e0e11] p-1 rounded-xl border border-white/[.07]">
          {(['all', 'images', 'documents'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === tab ? 'bg-[#1e1e24] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-[#0e0e11] px-3 py-1.5 border border-white/[.07] w-full sm:w-64">
          <Search size={14} className="text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search library..."
            className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="mt-6 divide-y divide-white/[.05] rounded-2xl border border-white/[.07] bg-[#0c0c0e] overflow-hidden">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 hover:bg-[#121215] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#18181c] text-zinc-400">
                {item.mime_type?.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-zinc-200">{item.file_name}</div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                  <span>{formatSize(item.size_bytes)}</span>
                  <span>•</span>
                  <span className="capitalize">{item.source}</span>
                  <span>•</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setItems((prev) => prev.filter((x) => x.id !== item.id));
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                title="Delete item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {!filteredItems.length && (
          <div className="p-12 text-center text-xs text-zinc-600">
            No files found matching your filter.
          </div>
        )}
      </div>
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

function PrivateChatMark({ size = 118 }: { size?: number }) {
  return (
    <div aria-hidden="true" className="relative shrink-0" style={{ width: size, height: size * 0.82 }}>
      <div className="absolute left-[22%] top-[2%] h-[30%] w-[56%] rounded-t-[42%] rounded-b-[18%] bg-[#3d3d41]" />
      <div className="absolute left-[15%] top-[29%] h-[10%] w-[70%] rounded-sm bg-[#3d3d41]" />
      <div className="absolute left-[16%] top-[45%] h-[40%] w-[30%] rounded-full border-[7px] border-[#3d3d41]" />
      <div className="absolute right-[16%] top-[45%] h-[40%] w-[30%] rounded-full border-[7px] border-[#3d3d41]" />
      <div className="absolute left-[43%] top-[58%] h-[9%] w-[14%] rounded-full bg-[#3d3d41]" />
      <div className="absolute left-[8%] top-[57%] h-[8%] w-[12%] rounded-full bg-[#3d3d41]" />
      <div className="absolute right-[8%] top-[57%] h-[8%] w-[12%] rounded-full bg-[#3d3d41]" />
    </div>
  );
}

export function AssistantPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem('zenixmind_selected_model') || 'gemini-2.5-flash';
  });
  const [webSearch, setWebSearch] = useState(false);
  const [deepThink, setDeepThink] = useState(false);
  const [input, setInput] = useState('');
  const [privateChat, setPrivateChat] = useState(() => new URLSearchParams(window.location.search).get('private') === '1');
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

  const isAtBottomRef = useRef(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const generationControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const view = (searchParams.get('view') as 'chat' | 'images' | 'library' | 'automations') || 'chat';
  const urlConvId = searchParams.get('conversation');
  const urlQuery = searchParams.get('q');

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior
      });
    }
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
      if (isAtBottomRef.current || isStreaming || busy) {
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

  const handleStartNewChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setAttachedFile(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('conversation');
      return next;
    });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [setSearchParams]);

  const loadEmptyGreeting = useCallback(async () => { if (privateChat) return; setEmptyGreeting(''); try { const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; const response = await fetch('/api/greeting', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: user?.name || user?.email?.split('@')[0] || '', timezone, localTime: new Date().toISOString() }) }); if (response.ok) { const data = await response.json(); if (data.greeting) setEmptyGreeting(data.greeting); } } catch {} }, [privateChat, user?.name, user?.email]);

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
        setMessages(
          (d.messages || [])
            .filter((m: Message) => m.role === 'user' || m.role === 'assistant')
            .map((m: Message) => ({
              role: m.role,
              content: m.content,
              model_used: m.model_used,
              sources: m.sources,
              liked: m.liked,
              disliked: m.disliked,
              reactions: m.reactions,
              userReactions: m.userReactions
            }))
        );
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
    if (isAtBottomRef.current || isStreaming || busy) {
      scrollToBottom('smooth');
    }
  }, [messages, busy, isStreaming, scrollToBottom]);

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

    let fullPrompt = text;
    let attachmentPayload: any = null;
    if (attachedFile) {
      try {
        attachmentPayload = await prepareAttachment(attachedFile);
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
          conversationId: privateChat ? null : conversationId,
          privateChat,
          model: selectedModel,
          webSearch,
          deepThink,
          attachment: attachmentPayload,
          preferences: {
            memory: privateChat ? false : localStorage.getItem('zenixmind-memory') !== 'off',
            personality: privateChat ? 'Balanced' : localStorage.getItem('zenixmind-personality') || 'Balanced',
            responseLength: privateChat ? 'Adaptive' : localStorage.getItem('zenixmind-response-length') || 'Adaptive',
            customInstructions: privateChat ? '' : localStorage.getItem('zenixmind-custom-instructions') || ''
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
          if (event.conversationId && !privateChat) {
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
        const frames = buffer.split('\\n\\n');
        buffer = frames.pop() || '';

        for (const frame of frames) {
          const dataLine = frame.split('\\n').find((line) => line.startsWith('data:'));
          if (!dataLine) continue;
          applyEvent(JSON.parse(dataLine.slice(5).trim()));
        }
      }

      if (buffer.trim()) {
        const dataLine = buffer.split('\\n').find((line) => line.startsWith('data:'));
        if (dataLine) applyEvent(JSON.parse(dataLine.slice(5).trim()));
      }

      setBusy(false);
      setIsStreaming(false);
      setThinkingStatus(null);
      if (!privateChat) loadConversations();
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
        view === 'chat'
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
      privateChat={privateChat}
      headerAction={
        view !== 'chat'
          ? 'none'
          : messages.length === 0 && !input.trim()
          ? 'private'
          : 'new'
      }
      onNewChat={handleStartNewChat}
      onStartPrivateChat={() => {
        setMessages([]);
        setConversationId(null);
        setInput('');
        setAttachedFile(null);
        setPrivateChat(true);
        navigate('/assistant?private=1');
      }}
      onTogglePrivateChat={() => {
        setPrivateChat((current) => {
          const next = !current;
          if (next) {
            setMessages([]);
            setConversationId(null);
            navigate('/assistant?private=1');
          } else {
            navigate('/assistant');
            loadConversations();
          }
          return next;
        });
      }}
    >
      <div className="relative flex-1 flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-[#050506]">
        {view === 'images' && <ImagesView />}
        {view === 'library' && <LibraryView />}
        {view === 'automations' && <AutomationsView />}

        {view === 'chat' && (
          <div className="relative flex flex-1 flex-col h-full overflow-hidden">
            {/* Messages Scroll Area with auto-scroll tracking */}
            <div
              ref={chatScrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 pb-44 sm:pb-32 scroll-smooth"
            >
              {!messages.length ? (
                privateChat ? (
                  <div className="flex h-full flex-col items-center justify-center px-4 text-center max-w-xl mx-auto pb-24 sm:pb-12">
                    <PrivateChatMark size={118} />
                    <h1 className="mt-12 text-[30px] sm:text-[34px] font-light tracking-[-0.025em] text-zinc-200">Private Chat</h1>
                    <p className="mt-6 max-w-md text-[16px] sm:text-[18px] leading-relaxed font-light text-zinc-500">
                      This chat won't appear in your history<br className="hidden sm:block" /> and will not be used to train models.
                    </p>
                  </div>
                ) : (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto py-8"><div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-white/[.08] bg-[#0c0c0e] shadow-xl"><BrandMark size={32} /></div><h1 className="max-w-xl text-2xl sm:text-3xl font-light tracking-[-.03em] text-zinc-100 min-h-[42px]">{emptyGreeting || " "}</h1></div>
                )
              ) : (
                <div ref={messagesContainerRef} className="mx-auto max-w-3xl space-y-6">
                  {messages.map((m, idx) => (
                    <ChatMessageItem
                      key={idx}
                      message={m}
                      onUpdateReaction={(updates) => handleUpdateMessageReaction(idx, updates)}
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
                      <div className="relative grid h-7 w-7 place-items-center">
                        <span className="absolute inset-0 rounded-full bg-amber-400/10 blur-md animate-pulse" />
                        <BrandMark size={24} className="relative text-zinc-300" />
                      </div>
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
            <div className="absolute inset-x-0 bottom-0 pointer-events-none pb-4 pt-8 bg-gradient-to-t from-[#050506] via-[#050506]/90 to-transparent">
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