import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { WorkspaceShell } from '../components/workspace-shell';
import { useAuth } from '../lib/auth-context';
import { Plus, ArrowUp, Sparkles, FileText, Code2, Lightbulb, Compass, Mic } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Danny';

  const promptSuggestions = [
    { label: 'Write something', prompt: 'Help me draft an engaging introduction for my project', icon: FileText },
    { label: 'Analyze a file', prompt: 'What are the key best practices for modern AI interfaces?', icon: Code2 },
    { label: 'Brainstorm ideas', prompt: 'Brainstorm 5 innovative startup concepts combining AI and workflows', icon: Lightbulb },
    { label: 'Learn something', prompt: 'Explain quantum computing in simple, practical terms', icon: Compass }
  ];

  return (
    <WorkspaceShell active="home" title="ZenixMind Dashboard">
      <div className="flex min-h-[calc(100vh-56px)] flex-col justify-between">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-white/[.08] bg-[#0c0c0e] shadow-lg">
              <BrandMark size={32} />
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl text-zinc-100">
              How can I help you today, {firstName}?
            </h1>
            <p className="mx-auto mt-2.5 max-w-md text-xs sm:text-sm leading-6 text-zinc-500">
              Ask anything, explore ideas, generate code, or talk directly with ZenixMind.
            </p>
          </div>

          {/* Large Prompt Card */}
          <Link
            to="/assistant"
            className="group rounded-[24px] border border-white/[.09] bg-[#0b0b0d] p-4 shadow-[0_20px_70px_rgba(0,0,0,.35)] transition-all hover:border-white/[.18] hover:bg-[#0e0e11]"
          >
            <div className="min-h-[70px] px-3 pt-2 text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
              Ask ZenixMind anything...
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/[.04]">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#151518] text-zinc-400">
                  <Plus size={15} />
                </span>
                <span className="text-[11px] text-zinc-500">New Conversation</span>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#18181b] text-zinc-400 transition-colors group-hover:bg-white group-hover:text-black">
                <ArrowUp size={15} />
              </span>
            </div>
          </Link>

          {/* Quick Prompts Grid */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {promptSuggestions.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={`/assistant?q=${encodeURIComponent(item.prompt)}`}
                  className="rounded-xl border border-white/[.06] bg-[#09090b] p-3.5 text-left transition-all hover:border-white/[.12] hover:bg-[#0f0f12] group"
                >
                  <Icon size={14} className="text-zinc-500 group-hover:text-zinc-300 transition-colors mb-2" />
                  <div className="text-[12px] font-medium text-zinc-300 group-hover:text-white">
                    {item.label}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[10px] text-zinc-500">
                    {item.prompt}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Voice Orb Banner */}
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-400/[.05] via-[#0d0d10] to-[#0d0d10] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <Mic size={18} />
              </div>
              <div>
                <div className="text-xs font-medium text-amber-200">Interactive Voice Mode</div>
                <div className="text-[11px] text-zinc-400">Speak naturally with real-time speech and pulsing orb.</div>
              </div>
            </div>
            <Link
              to="/assistant/voice"
              className="rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs px-3.5 py-2 font-medium border border-amber-400/20 transition-colors shrink-0"
            >
              Open Voice
            </Link>
          </div>
        </div>

        <p className="pb-5 text-center text-[11px] text-zinc-600">
          ZenixMind can make mistakes. Verify important information.
        </p>
      </div>
    </WorkspaceShell>
  );
}
