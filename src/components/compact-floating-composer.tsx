import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Brain,
  ChevronDown,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  X,
  Zap
} from 'lucide-react';
import { getCommandSuggestions } from '../lib/chat-commands';

export interface CompactFloatingComposerProps {
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
  deepThink: boolean;
  setDeepThink: (fn: (v: boolean) => boolean) => void;
  onDictate: () => void;
  isListening: boolean;
  dictationError?: string;
  onAttachFile: (file: File) => void;
  attachmentName?: string;
  onClearAttachment: () => void;
}

const MODEL_SHORT_MAP: Record<string, { label: string; icon: 'zap' | 'brain' }> = {
  'zenix-auto': { label: 'Auto', icon: 'zap' },
  'zenix-lite': { label: 'Lite', icon: 'zap' },
  'zenix-4.6-fast': { label: 'Fast', icon: 'zap' },
  'zenix-4.6-pro': { label: 'Pro', icon: 'brain' },
  'zenix-4.6-reason': { label: 'Reason', icon: 'brain' },
  'zenix-4.6-build': { label: 'Build', icon: 'brain' }
};

const MODEL_OPTIONS = [
  { id: 'zenix-auto', label: 'Zenix Auto' },
  { id: 'zenix-lite', label: 'Zenix Lite' },
  { id: 'zenix-4.6-fast', label: 'Zenix Fast' },
  { id: 'zenix-4.6-pro', label: 'Zenix Pro' },
  { id: 'zenix-4.6-reason', label: 'Zenix Reason' },
  { id: 'zenix-4.6-build', label: 'Zenix Build' }
];

/**
 * Grok-inspired chat composer:
 * monochrome pill, stable auto-grow textarea, calm focus ring.
 */
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
    deepThink,
    setDeepThink,
    onDictate,
    isListening,
    dictationError = '',
    onAttachFile,
    attachmentName,
    onClearAttachment
  },
  textareaRef
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [activeCommandIndex, setActiveCommandIndex] = useState(-1);
  const commandSuggestions = getCommandSuggestions(value);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(t)) setModelOpen(false);
      if (plusRef.current && !plusRef.current.contains(t)) setPlusOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    setActiveCommandIndex(commandSuggestions.length ? 0 : -1);
  }, [value, commandSuggestions.length]);

  // Keep textarea height stable without layout thrash
  useEffect(() => {
    const el =
      typeof textareaRef === 'object' && textareaRef?.current
        ? textareaRef.current
        : null;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 152);
    el.style.height = `${Math.max(24, next)}px`;
  }, [value, textareaRef]);

  const chooseCommand = (trigger: string) => {
    setValue(trigger.endsWith(' ') ? trigger : `${trigger} `);
    setActiveCommandIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (commandSuggestions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveCommandIndex((i) => (i + 1) % commandSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveCommandIndex((i) => (i <= 0 ? commandSuggestions.length - 1 : i - 1));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && activeCommandIndex >= 0 && value.startsWith('/'))) {
        if (activeCommandIndex >= 0 && !e.shiftKey) {
          e.preventDefault();
          chooseCommand(commandSuggestions[activeCommandIndex].trigger);
          return;
        }
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !busy) onSend();
    }
  };

  const hasText = Boolean(value.trim());
  const meta = MODEL_SHORT_MAP[selectedModel] || { label: 'Fast', icon: 'zap' as const };

  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4">
      {attachmentName && (
        <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/[.08] bg-[#16181c] px-3 py-1.5 text-xs text-zinc-300">
          <Paperclip size={13} className="shrink-0 text-zinc-500" />
          <span className="truncate font-medium">{attachmentName}</span>
          <button
            type="button"
            onClick={onClearAttachment}
            className="text-zinc-500 hover:text-zinc-200"
            aria-label="Remove attachment"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="zenix-composer relative p-2.5 sm:p-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAttachFile(file);
            e.target.value = '';
          }}
        />

        {commandSuggestions.length > 0 && (
          <div
            className="absolute bottom-full left-2 right-2 z-40 mb-2 max-h-64 overflow-y-auto rounded-2xl border border-white/[.08] bg-[#111114] p-1.5 shadow-2xl"
            role="listbox"
            aria-label="Chat commands"
          >
            {commandSuggestions.map((command, index) => (
              <button
                key={command.id}
                type="button"
                role="option"
                aria-selected={activeCommandIndex === index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseCommand(command.trigger)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  activeCommandIndex === index ? 'bg-white/[.08] text-white' : 'text-zinc-400 hover:bg-white/[.04]'
                }`}
              >
                <span className="text-sm font-medium">{command.trigger}</span>
                <span className="text-[11px] text-zinc-500">{command.description}</span>
              </button>
            ))}
          </div>
        )}

        {dictationError && (
          <p role="status" aria-live="polite" className="mb-2 rounded-xl border border-rose-400/20 bg-rose-500/[.08] px-3 py-2 text-[11px] leading-4 text-rose-200">
            {dictationError}
          </p>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask anything"
          className="w-full resize-none bg-transparent px-2.5 pt-1 text-[16px] leading-6 text-[#e7e9ea] outline-none placeholder:text-[#71767b] sm:text-[15px]"
          style={{ maxHeight: 152 }}
          aria-label="Message"
        />

        <div className="mt-3 flex min-h-10 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <div className="relative" ref={plusRef}>
              <button
                type="button"
                onClick={() => setPlusOpen((v) => !v)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[.09] bg-white/[.035] text-zinc-300 transition-colors hover:bg-white/[.08] hover:text-white"
                aria-label="Attach file"
                title="Add"
              >
                <Plus size={18} />
              </button>
              {plusOpen && (
                <div className="absolute bottom-full left-0 z-50 mb-2 w-44 overflow-hidden rounded-xl border border-white/[.08] bg-[#16181c] py-1 shadow-xl">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/[.06]"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setPlusOpen(false);
                    }}
                  >
                    <Paperclip size={14} /> Attach file
                  </button>
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setModelOpen((v) => !v)}
                className="inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-xs text-zinc-400 transition-colors hover:bg-white/[.06] hover:text-zinc-100"
                aria-label="Model"
              >
                {meta.icon === 'brain' ? <Brain size={14} /> : <Zap size={14} />}
                <span className="hidden sm:inline">{meta.label}</span>
                <ChevronDown size={12} className="opacity-60" />
              </button>
              {modelOpen && (
                <div className="absolute bottom-full left-0 z-50 mb-2 w-44 overflow-hidden rounded-xl border border-white/[.08] bg-[#16181c] py-1 shadow-xl">
                  {MODEL_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onSelectModel(m.id);
                        setModelOpen(false);
                      }}
                      className={`flex w-full px-3 py-2 text-left text-xs ${
                        selectedModel === m.id
                          ? 'bg-white/[.08] text-white'
                          : 'text-zinc-400 hover:bg-white/[.05] hover:text-zinc-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDeepThink((v) => !v)}
              className={`inline-flex h-9 items-center gap-1 rounded-full px-2.5 text-xs transition-colors ${
                deepThink
                  ? 'bg-white/[.1] text-white'
                  : 'text-zinc-500 hover:bg-white/[.06] hover:text-zinc-200'
              }`}
              title="Deep think"
              aria-pressed={deepThink}
            >
              <Brain size={14} />
              <span className="hidden sm:inline">Think</span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 self-center">
            <button
              type="button"
              onClick={onDictate}
              className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${
                isListening
                  ? 'bg-white/15 text-white'
                  : 'text-zinc-500 hover:bg-white/[.06] hover:text-zinc-200'
              }`}
              title={isListening ? 'Stop dictation' : 'Dictate'}
              aria-label={isListening ? 'Stop dictation' : 'Dictate'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {busy ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2f3336] px-3.5 text-xs font-medium text-[#e7e9ea] transition-colors hover:bg-[#3e4144]"
              >
                <span className="h-2.5 w-2.5 rounded-[3px] bg-[#e7e9ea]" />
                Stop
              </button>
            ) : hasText ? (
              <button
                type="button"
                onClick={onSend}
                className="inline-flex h-9 items-center gap-1 rounded-full bg-[#e7e9ea] px-3.5 text-xs font-semibold text-black transition-colors hover:bg-white"
              >
                <ArrowUp size={16} strokeWidth={2.5} />
                Send
              </button>
            ) : voiceOpen ? (
              <button
                type="button"
                onClick={onCloseVoice}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#2f3336] text-[#e7e9ea] transition-colors hover:bg-[#3e4144]"
                aria-label="Cancel voice"
              >
                <X size={17} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenVoice}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-[#e7e9ea] px-3.5 text-xs font-semibold text-black transition-colors hover:bg-white"
                aria-label="Speak"
              >
                <span className="flex h-3.5 items-center gap-[2.5px]" aria-hidden>
                  <span className="h-2 w-[2px] rounded-full bg-black" />
                  <span className="h-3.5 w-[2px] rounded-full bg-black" />
                  <span className="h-2.5 w-[2px] rounded-full bg-black" />
                  <span className="h-3 w-[2px] rounded-full bg-black" />
                </span>
                Speak
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default CompactFloatingComposer;
