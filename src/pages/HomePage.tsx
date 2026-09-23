import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { useAuth } from '../lib/auth-context';
import {
  ArrowRight,
  Brain,
  Mic,
  Image as ImageIcon,
  FolderClosed,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  WandSparkles,
  LockKeyhole
} from 'lucide-react';

function PublicHome() {
  const capabilities = [
    { icon: MessageSquare, title: 'Ask', body: 'Reason through questions, writing, code, research, and everyday work.', href: '/login' },
    { icon: Mic, title: 'Talk', body: 'Move from typing to natural voice conversations when you are ready.', href: '/login' },
    { icon: ImageIcon, title: 'Imagine', body: 'Create and explore visual work in a dedicated image workspace.', href: '/login' },
    { icon: FolderClosed, title: 'Keep', body: 'Organize conversations, files, and generated work in one place.', href: '/login' }
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050506] text-zinc-100 selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-320px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-white/[.045] blur-[120px]" />
        <div className="absolute left-[-260px] top-[42%] h-[420px] w-[420px] rounded-full bg-white/[.025] blur-[100px]" />
        <div className="hero-grid absolute inset-0 opacity-25" />
      </div>

      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark size={34} />
          <span className="text-[16px] font-semibold tracking-tight">ZenixMind</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] text-zinc-500 md:flex">
          <a href="#capabilities" className="hover:text-zinc-200 transition-colors">Capabilities</a>
          <a href="#workspace" className="hover:text-zinc-200 transition-colors">Workspace</a>
          <a href="#privacy" className="hover:text-zinc-200 transition-colors">Privacy</a>
          <Link to="/pricing" className="hover:text-zinc-200 transition-colors">Plans</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-xl px-3.5 py-2 text-xs font-medium text-zinc-400 hover:bg-white/[.05] hover:text-white transition-colors">
            Sign in
          </Link>
          <Link to="/signup" className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors">
            Get started
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-28">
        <div className="mb-7 flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-3.5 py-2 text-[11px] text-zinc-400 backdrop-blur">
          <Sparkles size={13} className="text-zinc-200" />
          <span>One workspace for thinking, creating, and talking</span>
        </div>

        <h1 className="max-w-5xl text-[clamp(3.1rem,8vw,7rem)] font-semibold leading-[.92] tracking-[-.075em]">
          <span className="block text-white">Think clearly.</span>
          <span className="block bg-gradient-to-b from-white via-zinc-300 to-zinc-600 bg-clip-text text-transparent">Create freely.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
          ZenixMind brings AI conversation, reasoning, voice, images, files, and your workspace together without turning the experience into a maze.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/signup" className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-semibold text-black hover:bg-zinc-200 transition-colors">
            Start with ZenixMind
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link to="/login" className="rounded-2xl border border-white/[.09] bg-white/[.025] px-5 py-3 text-xs font-medium text-zinc-300 hover:bg-white/[.06] transition-colors">
            Sign in
          </Link>
        </div>

        <div className="mt-16 w-full max-w-5xl rounded-[32px] border border-white/[.08] bg-[#0a0a0c]/90 p-2 shadow-[0_40px_120px_rgba(0,0,0,.5)] backdrop-blur-xl">
          <div className="rounded-[25px] border border-white/[.06] bg-[#0d0d10] p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/[.06] pb-5">
              <div className="flex items-center gap-2">
                <BrandMark size={24} />
                <span className="text-xs font-semibold">ZenixMind</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                Workspace
              </div>
            </div>
            <div className="grid gap-8 py-12 text-left md:grid-cols-[1fr_1.25fr] md:items-center">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[.2em] text-zinc-600">Your AI workspace</p>
                <h2 className="mt-3 max-w-md text-2xl font-semibold tracking-[-.04em] text-zinc-100 sm:text-3xl">
                  Start with a question. Build from there.
                </h2>
                <p className="mt-3 max-w-md text-xs leading-6 text-zinc-500">
                  One focused surface for conversations and the work that grows from them.
                </p>
              </div>
              <div className="rounded-3xl border border-white/[.07] bg-[#08080a] p-4">
                <div className="flex items-center gap-3 border-b border-white/[.05] pb-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.06]"><Brain size={17} /></div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Ask ZenixMind</div>
                    <div className="text-[10px] text-zinc-600">Conversation workspace</div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-white/[.06] bg-white/[.025] p-4 text-xs text-zinc-600">
                  What are you working on?
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="h-7 w-7 rounded-lg bg-white/[.05]" />
                    <span className="h-7 w-16 rounded-lg bg-white/[.05]" />
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-black"><ArrowRight size={14} /></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-zinc-600">Capabilities</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Everything starts with the conversation.</h2>
          <p className="mt-4 text-sm leading-6 text-zinc-500">Move between modes without leaving the workspace you are already using.</p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} to={item.href} className="group rounded-[24px] border border-white/[.07] bg-[#09090b] p-5 transition-all hover:-translate-y-0.5 hover:border-white/[.14] hover:bg-[#0d0d10]">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.06] bg-white/[.03] text-zinc-400 group-hover:text-white">
                  <Icon size={17} />
                </div>
                <h3 className="mt-7 text-sm font-semibold">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{item.body}</p>
                <ArrowRight size={14} className="mt-6 text-zinc-700 transition-transform group-hover:translate-x-1 group-hover:text-zinc-300" />
              </Link>
            );
          })}
        </div>
      </section>

      <section id="workspace" className="relative z-10 border-y border-white/[.06] bg-white/[.015]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-zinc-600">The workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">A place for the work after the answer.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-500">
              Conversations can lead into voice, images, files, and your library. ZenixMind keeps those pieces close instead of scattering them across separate tools.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] text-zinc-400">
              {['Chat', 'Voice', 'Images', 'Library'].map((label) => (
                <span key={label} className="rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5">{label}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['Ask', Brain], ['Talk', Mic], ['Imagine', WandSparkles], ['Keep', FolderClosed]].map(([label, Icon]) => (
              <div key={String(label)} className="rounded-[24px] border border-white/[.07] bg-[#09090b] p-5">
                <Icon size={18} className="text-zinc-500" />
                <p className="mt-10 text-xs font-medium">{String(label)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="rounded-[30px] border border-white/[.08] bg-[#09090b] p-7 sm:p-10">
          <div className="grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[.07] bg-white/[.03]"><LockKeyhole size={22} /></div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-600">Privacy</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-.03em]">Your account is yours.</h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-500">Private Chat is designed for conversations that should stay out of your normal chat history.</p>
            </div>
            <ShieldCheck size={22} className="text-zinc-500" />
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[.06] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5"><BrandMark size={27} /><span className="text-xs font-semibold">ZenixMind</span></div>
          <div className="flex flex-wrap gap-5 text-[11px] text-zinc-600">
            <Link to="/pricing" className="hover:text-zinc-300">Plans</Link>
            <Link to="/login" className="hover:text-zinc-300">Sign in</Link>
            <Link to="/signup" className="hover:text-zinc-300">Create account</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function AuthenticatedHome() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-[#050506] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <BrandMark size={44} />
        <p className="mt-7 text-[10px] uppercase tracking-[.24em] text-zinc-600">Your workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Welcome back, {user?.name || 'there'}.</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-500">Continue where you left off or start something new.</p>
        <Link to="/assistant" className="mt-8 flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-semibold text-black hover:bg-zinc-200">
          Open workspace <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}

export function HomePage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#050506]" />;
  return user ? <AuthenticatedHome /> : <PublicHome />;
}
