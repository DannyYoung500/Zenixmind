import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { WorkspaceShell } from '../components/workspace-shell';
import { useAuth } from '../lib/auth-context';
import {
  MessageSquare,
  Mic,
  ArrowRight,
  Plus,
  Image as ImageIcon,
  FolderClosed,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';

function PublicHome() {
  return (
    <main className="min-h-screen bg-[#050506] text-zinc-100 selection:bg-zinc-700 selection:text-white relative overflow-hidden">
      <div className="zenix-ambient pointer-events-none fixed inset-0" />
      <div className="hero-grid pointer-events-none fixed inset-0 opacity-40" />

      {/* Header */}
      <header className="relative z-10 flex h-[72px] items-center justify-between border-b border-white/[.06] px-5 sm:px-8 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark size={34} />
          <span className="text-[16px] font-semibold tracking-[-0.02em] text-white">
            ZenixMind
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-zinc-400 md:flex">
          <Link to="/assistant" className="hover:text-white transition-colors">Assistant</Link>
          <Link to="/pricing" className="hover:text-white transition-colors">Plans</Link>
          <Link to="/assistant?view=images" className="hover:text-white transition-colors">Images</Link>
          <Link to="/assistant?view=library" className="hover:text-white transition-colors">Library</Link>
          <Link to="/assistant/voice" className="flex items-center gap-1.5 text-amber-300/90 hover:text-amber-200">
            <Sparkles size={13} />
            <span>Voice Mode</span>
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[.05] hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-xl border border-white/[.1] bg-[#f2f2f2] px-4 py-2 text-xs font-semibold text-black hover:bg-white transition-all shadow-sm"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-[26px] border border-white/[.1] bg-[#0c0c0e] shadow-[0_0_80px_rgba(255,255,255,.07)]">
          <BrandMark size={46} />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Your Intelligent Workspace
        </p>

        <h1 className="mt-4 max-w-4xl text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-zinc-100">
          Think with ZenixMind.
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
          A focused AI assistant for deep conversation, research, writing, voice dialogue, and your personal digital library.
        </p>

        {/* Interactive Prompt Trigger */}
        <div className="mt-9 w-full max-w-2xl">
          <Link
            to="/assistant"
            className="group block rounded-[28px] border border-white/[.1] bg-[#0b0b0d]/90 p-4 text-left shadow-[0_30px_100px_rgba(0,0,0,.45)] hover:border-white/[.2] transition-all"
          >
            <div className="min-h-[58px] px-3 py-2 text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
              Ask anything, research topics, brainstorm ideas, draft content, or analyze data…
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#141416] text-zinc-400">
                  <Plus size={16} />
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#141416] text-zinc-400">
                  <Mic size={16} />
                </span>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1e1e22] text-zinc-200 group-hover:bg-white group-hover:text-black transition-all">
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
          <p className="mt-3 text-[11px] text-zinc-600">
            Start a live conversation. Your workspace and chats are saved in your account.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { title: 'Chat', body: 'Ask, reason and work through complex ideas.', href: '/assistant', icon: MessageSquare },
            { title: 'Voice', body: 'Talk naturally with animated voice feedback.', href: '/assistant/voice', icon: Mic },
            { title: 'Images', body: 'Visual studio and generative creation workspace.', href: '/assistant?view=images', icon: ImageIcon },
            { title: 'Library', body: 'Store uploaded and generated assets.', href: '/assistant?view=library', icon: FolderClosed }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.href}
                className="group rounded-2xl border border-white/[.06] bg-[#09090b] p-4 text-left hover:border-white/[.15] hover:bg-[#0e0e11] transition-all"
              >
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#141417] text-zinc-400 group-hover:text-white transition-colors mb-3">
                  <Icon size={14} />
                </div>
                <p className="text-xs font-medium text-zinc-200">{item.title}</p>
                <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">{item.body}</p>
              </Link>
            );
          })}
        </div>

        {/* Highlights */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 border-t border-white/[.05] pt-8 w-full max-w-3xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>ZenixMind AI Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            <span>Voice recognition & speech</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-400" />
            <span>Multi-user & Owner security</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthenticatedHome() {
  const { user } = useAuth();
  return (
    <WorkspaceShell active="home" title="ZenixMind">
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-5 text-center max-w-3xl mx-auto">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-white/[.08] bg-[#0d0d10] shadow-[0_0_60px_rgba(255,255,255,.05)]">
          <BrandMark size={38} />
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl text-zinc-100">
          Welcome back, {user?.name || user?.email?.split('@')[0] || 'Danny'}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
          Your workspace is active. Continue your chats, launch the Voice Orb, or manage your library assets.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/assistant"
            className="rounded-xl bg-[#ededed] px-5 py-2.5 text-xs font-semibold text-black hover:bg-white transition-all shadow-sm"
          >
            Start a conversation
          </Link>
          <Link
            to="/assistant/voice"
            className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition-all"
          >
            <Sparkles size={14} />
            <span>Voice Assistant</span>
          </Link>
        </div>
      </div>
    </WorkspaceShell>
  );
}

export function HomePage() {
  const { user } = useAuth();
  return user ? <AuthenticatedHome /> : <PublicHome />;
}
