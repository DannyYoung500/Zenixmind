import React, { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, Check, Sparkles, Zap, Brain, Terminal, Shield } from 'lucide-react';
import { getSupabase } from '../lib/supabase';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'Groq' | 'Google' | 'xAI' | 'Anthropic' | 'OpenAI' | 'DeepSeek';
  tag: string;
  badge: string;
  description: string;
  badgeColor: string;
}

export const AI_MODELS: ModelOption[] = [
  { id: 'zenix-auto', name: 'Zenix Auto', provider: 'Google', tag: 'Adaptive', badge: 'ZenixMind', description: 'Automatically selects the best currently available engine', badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { id: 'zenix-lite', name: 'Zenix Lite', provider: 'Google', tag: 'Lightweight', badge: 'ZenixMind', description: 'A lightweight assistant for everyday tasks', badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { id: 'zenix-4.6-fast', name: 'Zenix 4.6 Fast', provider: 'Google', tag: 'Fast', badge: 'ZenixMind', description: 'Fast responses for everyday work and building', badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { id: 'zenix-4.6-pro', name: 'Zenix 4.6 Pro', provider: 'Google', tag: 'Pro', badge: 'Coming soon', description: 'Premium model — billing and provider setup pending', badgeColor: 'text-zinc-400 bg-white/5 border-white/10' },
  { id: 'zenix-4.6-reason', name: 'Zenix 4.6 Reason', provider: 'Google', tag: 'Reasoning', badge: 'Coming soon', description: 'Premium reasoning model — not yet enabled', badgeColor: 'text-zinc-400 bg-white/5 border-white/10' },
  { id: 'zenix-4.6-build', name: 'Zenix 4.6 Build', provider: 'Google', tag: 'Build', badge: 'Coming soon', description: 'Premium coding model — not yet enabled', badgeColor: 'text-zinc-400 bg-white/5 border-white/10' }
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
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const onSelectModelRef = useRef(onSelectModel);
  const selectedModelRef = useRef(selectedModel);
  onSelectModelRef.current = onSelectModel;
  selectedModelRef.current = selectedModel;

  useEffect(() => {
    let cancelled = false;
    const loadModels = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch('/api/models', {
          headers: { Authorization: 'Bearer ' + session.access_token },
          cache: 'no-store'
        });
        if (!res.ok) return;
        const data = await res.json();
        const live = Array.isArray(data.models) ? data.models.filter((m: any) => m.available === true) : [];
        const mapped = live.map((m: any) => ({
          id: m.id,
          name: m.name,
          provider: m.provider === 'groq' ? 'Groq' : m.provider === 'google' ? 'Google' : m.provider === 'xai' ? 'xAI' : m.provider === 'anthropic' ? 'Anthropic' : m.provider === 'openai' ? 'OpenAI' : 'DeepSeek',
          tag: m.tag,
          badge: m.badge || 'ZenixMind',
          description: m.description,
          badgeColor: m.provider === 'groq' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : m.provider === 'google' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' : m.provider === 'xai' ? 'text-zinc-100 bg-white/10 border-white/20' : m.provider === 'anthropic' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' : m.provider === 'openai' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
        }));
        if (cancelled) return;
        setAvailableModels(mapped);
        setCatalogLoaded(true);
        if (mapped.length && !mapped.some((m: ModelOption) => m.id === selectedModelRef.current)) onSelectModelRef.current(mapped[0].id);
      } catch {
        if (!cancelled) setCatalogLoaded(false);
      }
    };
    loadModels();
    return () => { cancelled = true; };
  }, []);

  const current = availableModels.find((m) => m.id === selectedModel) || availableModels[0];

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
          current?.provider === 'Groq' ? 'bg-emerald-400' :
          current?.provider === 'Google' ? 'bg-amber-400' :
          current?.provider === 'xAI' ? 'bg-zinc-100' :
          current?.provider === 'Anthropic' ? 'bg-orange-400' :
          current?.provider === 'OpenAI' ? 'bg-emerald-400' : 'bg-cyan-400'
        }`} />
        <span className="truncate max-w-[110px] sm:max-w-[140px]">{current?.name || (catalogLoaded ? 'No models available' : 'Loading models…')}</span>
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
            <span className="text-[9px] text-zinc-600 font-mono">{availableModels.length} available</span>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
            {availableModels.map((model) => {
              const isSelected = model.id === current?.id;
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
