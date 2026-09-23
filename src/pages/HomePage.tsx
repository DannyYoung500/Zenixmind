import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { useAuth } from '../lib/auth-context';
import { ArrowRight, Plus, Paperclip, Mic, Zap, ChevronDown, Image as ImageIcon, MessageSquare, AudioLines, FolderOpen, LockKeyhole } from 'lucide-react';

function LandingComposer() {
  return (
    <div className="mx-auto w-full max-w-[860px] rounded-[26px] border border-white/[.09] bg-[#151517] p-3.5 shadow-[0_30px_100px_rgba(0,0,0,.55)]">
      <div className="min-h-[74px] px-2 pt-1 text-left text-[15px] text-zinc-500">Ask anything</div>
      <div className="flex items-center justify-between gap-3 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#27272a] text-zinc-200" aria-label="More"><Plus size={18} /></button>
          <button className="flex h-9 items-center gap-1.5 rounded-full bg-[#27272a] px-3.5 text-xs font-semibold text-zinc-100" aria-label="Selected model"><Zap size={13} className="fill-white" />Fast<ChevronDown size={13} className="text-zinc-500" /></button>
          <button className="hidden items-center gap-2 rounded-full px-2 text-[11px] text-zinc-500 transition hover:text-zinc-300 sm:flex"><Paperclip size={14} />Attach</button>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-full bg-[#27272a] text-zinc-300" aria-label="Voice input"><Mic size={16} /></button>
          <button className="flex h-9 items-center gap-2 rounded-full bg-zinc-200 px-4 text-xs font-semibold text-black" aria-label="Speak"><AudioLines size={14} />Speak</button>
        </div>
      </div>
    </div>
  );
}

const landingCapabilities = [
  [MessageSquare, 'Chat', 'Think through questions, ideas, writing, research, and code.'],
  [AudioLines, 'Voice', 'Talk naturally and continue the same conversation hands-free.'],
  [ImageIcon, 'Images', 'Create visual work without leaving your ZenixMind workspace.'],
  [FolderOpen, 'Library', 'Keep conversations and saved work organized in one place.']
];

function PublicHome() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-420px] h-[780px] w-[1100px] -translate-x-1/2 rounded-full bg-zinc-500/[.035] blur-[170px]" />
      </div>

      <header className="relative z-20 mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3"><BrandMark size={35} /><span className="text-[15px] font-semibold tracking-[-.025em]">ZenixMind</span></Link>
        <div className="flex items-center gap-1.5">
          <Link to="/login" className="rounded-xl px-4 py-2.5 text-xs font-medium text-zinc-500 transition hover:bg-white/[.04] hover:text-zinc-100">Sign in</Link>
          <Link to="/signup" className="rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-white">Get started</Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1240px] px-5 pb-28 pt-24 sm:px-8 sm:pt-32">
        <div className="mx-auto max-w-[980px] text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-zinc-600">ZenixMind</p>
          <h1 className="mt-6 text-[clamp(3.6rem,8vw,7.4rem)] font-semibold leading-[.9] tracking-[-.085em]">
            <span className="block text-zinc-100">Think.</span><span className="block text-zinc-500">Create.</span><span className="block text-zinc-300">Talk.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[620px] text-sm leading-7 text-zinc-500 sm:text-[15px]">Your AI assistant for conversation, voice, visual creation, and the work you want to keep.</p>
          <div className="mt-11"><LandingComposer /></div>
          <p className="mt-4 text-[10px] text-zinc-700">Start with a question, an idea, a file, or a conversation.</p>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/[.06]">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.26em] text-zinc-700">Workspace</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] text-zinc-100 sm:text-5xl">Everything starts with the conversation.</h2>
            <p className="mt-5 text-sm leading-7 text-zinc-500 sm:text-base">Move from a question to voice, visual creation, or saved work without turning the product into a complicated dashboard.</p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-white/[.07] bg-white/[.07] md:grid-cols-2 lg:grid-cols-4">
            {landingCapabilities.map(([Icon, title, body]) => {
              const CapabilityIcon = Icon as React.ComponentType<{ size?: number; strokeWidth?: number }>;
              return <div key={String(title)} className="bg-[#080808] p-6 sm:p-7">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.07] bg-white/[.025] text-zinc-500"><CapabilityIcon size={17} strokeWidth={1.7} /></div>
                <h3 className="mt-9 text-sm font-semibold text-zinc-200">{String(title)}</h3>
                <p className="mt-2.5 text-[11px] leading-5 text-zinc-600">{String(body)}</p>
              </div>;
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/[.06] bg-[#030303]">
        <div className="mx-auto grid max-w-[1240px] gap-14 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-[1fr_.8fr] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.26em] text-zinc-700">Private by design</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] text-zinc-100 sm:text-5xl">Your workspace stays yours.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-500">Your account is separated by real authentication. Private Chat gives you a separate session when you do not want a conversation added to normal saved chat history.</p>
            <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-black hover:bg-white">Open ZenixMind<ArrowRight size={14} /></Link>
          </div>
          <div className="rounded-[28px] border border-white/[.07] bg-[#080808] p-7">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[.07] bg-white/[.025]"><LockKeyhole size={19} className="text-zinc-500" /></div>
            <p className="mt-8 text-sm font-semibold text-zinc-200">Private Chat</p>
            <p className="mt-2 text-xs leading-6 text-zinc-600">Separate from your normal saved conversation history.</p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[.06]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5"><BrandMark size={27} /><span className="text-xs font-semibold">ZenixMind</span></div>
          <div className="flex items-center gap-5 text-[11px] text-zinc-700"><Link to="/pricing" className="transition hover:text-zinc-300">Plans</Link><Link to="/login" className="transition hover:text-zinc-300">Sign in</Link><Link to="/signup" className="transition hover:text-zinc-300">Create account</Link></div>
        </div>
      </footer>
    </main>
  );
}

function AuthenticatedHome() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-[#f6f1f8] text-[#211c25]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <BrandMark size={48} />
        <p className="mt-7 text-[10px] font-semibold uppercase tracking-[.24em] text-[#837789]">Your workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Welcome back, {user?.name || 'there'}.</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-[#786e7e]">Continue where you left off or start something new.</p>
        <Link to="/assistant" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#19151d] px-5 py-3 text-xs font-semibold text-white shadow-lg">
          Open workspace <ArrowUp size={14} />
        </Link>
      </div>
    </main>
  );
}

export function HomePage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#f6f1f8]" />;
  return user ? <AuthenticatedHome /> : <PublicHome />;
}
