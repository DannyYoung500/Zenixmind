import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { WorkspaceShell } from '../components/workspace-shell';
import { CompactFloatingComposer } from './AssistantPage';
import { useAuth } from '../lib/auth-context';
import { ArrowRight, MessageSquare, Search, PenLine, Mic2 } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <WorkspaceShell active="home" title="ZenixMind">
      <div className="min-h-[calc(100vh-56px)] bg-[#050506] text-zinc-100">
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-10 sm:px-8 sm:py-16">
          <div className="mx-auto w-full max-w-3xl text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/[.08] bg-[#0c0c0e] shadow-xl">
              <BrandMark size={32} />
            </div>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.24em] text-zinc-500">Your workspace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Good to see you, {firstName}.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">Start with a question, an idea, a piece of work, or simply a conversation.</p>
          </div>

          <div className="mx-auto mt-10 w-full max-w-4xl">
            <CompactFloatingComposer
              value=""
              setValue={() => {}}
              onSend={() => { window.location.href = '/assistant'; }}
              onStop={() => {}}
              onOpenVoice={() => { window.location.href = '/assistant/voice'; }}
              busy={false}
              selectedModel="gemini-2.5-flash"
              onSelectModel={() => {}}
              webSearch={false}
              setWebSearch={() => {}}
              deepThink={false}
              setDeepThink={() => {}}
              onDictate={() => {}}
              isListening={false}
              onAttachFile={() => {}}
              attachmentName=""
              onClearAttachment={() => {}}
            />
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [MessageSquare, 'Conversation', 'Ask and follow up naturally.'],
              [Search, 'Research', 'Explore a topic and make sense of it.'],
              [PenLine, 'Create', 'Write, plan, code, and refine ideas.'],
              [Mic2, 'Voice', 'Continue by speaking when you prefer.']
            ].map(([Icon, title, text]) => (
              <Link key={title as string} to="/assistant" className="rounded-2xl border border-white/[.07] bg-[#0b0b0e] p-5 transition hover:border-white/[.14] hover:bg-[#0e0e11]">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#131316] text-zinc-300"><Icon size={15} /></div>
                <div className="mt-4 text-xs font-semibold">{title as string}</div>
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">{text as string}</p>
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-8 flex items-center justify-center gap-3 text-[11px] text-zinc-600">
            <span>Conversations are saved to your account.</span>
            <Link to="/assistant" className="inline-flex items-center gap-1 text-zinc-400 hover:text-white">Open assistant <ArrowRight size={12} /></Link>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
