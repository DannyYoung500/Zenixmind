import React, { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, Check, Sparkles, Zap, Brain, Terminal, Shield } from 'lucide-react';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'Google' | 'xAI' | 'Anthropic' | 'OpenAI' | 'DeepSeek';
  tag: string;
  badge: string;
  description: string;
  badgeColor: string;
}

export const AI_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    tag: '⚡ Ultra Fast',
    badge: 'Gemini',
    description: 'High-speed multimodal reasoning and generation',
    badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    tag: '🧠 Deep Logic',
    badge: 'Gemini',
    description: 'Complex logic, deep analysis, and code synthesis',
    badgeColor: 'text-amber-300 bg-amber-300/10 border-amber-300/20'
  },
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xAI',
    tag: '🚀 Real-time & Bold',
    badge: 'xAI',
    description: 'Direct, uncensored insight with real-time knowledge',
    badgeColor: 'text-zinc-100 bg-white/10 border-white/20'
  },
  {
    id: 'claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    tag: '🖋️ Master Coder',
    badge: 'Claude',
    description: 'Nuanced writing, reasoning, and system architecture',
    badgeColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tag: '🌐 Omnimodal',
    badge: 'OpenAI',
    description: 'Omnimodal reasoning, vision, and problem solving',
    badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    tag: '🔬 Reasoning',
    badge: 'DeepSeek',
    description: 'Open-weight chain-of-thought deep reasoning',
    badgeColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  className?: string;
  direction?: 'up' | 'down';
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  className = '',
  direction = 'up'
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-full border border-white/[.08] bg-[#121215]/90 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:border-white/[.18] hover:bg-[#18181d] hover:text-white transition-all shadow-sm"
        title="Select AI Model"
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
          current.provider === 'Google' ? 'bg-amber-400' :
          current.provider === 'xAI' ? 'bg-zinc-100' :
          current.provider === 'Anthropic' ? 'bg-orange-400' :
          current.provider === 'OpenAI' ? 'bg-emerald-400' : 'bg-cyan-400'
        }`} />
        <span className="truncate max-w-[110px] sm:max-w-[140px]">{current.name}</span>
        <ChevronDown size={11} className={`text-zinc-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 w-72 rounded-2xl border border-white/[.12] bg-[#0d0d10]/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl ${
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-white/[.06] mb-1">
            <span>Select AI Intelligence</span>
            <span className="text-[9px] text-zinc-600 font-mono">6 Models</span>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
            {AI_MODELS.map((model) => {
              const isSelected = model.id === current.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all ${
                    isSelected
                      ? 'bg-[#1e1e24] text-white shadow-sm ring-1 ring-white/[.1]'
                      : 'text-zinc-400 hover:bg-[#151518] hover:text-zinc-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-zinc-200">{model.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${model.badgeColor}`}>
                        {model.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">{model.description}</div>
                  </div>
                  {isSelected && <Check size={13} className="text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
