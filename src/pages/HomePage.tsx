import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { useAuth } from '../lib/auth-context';
import {
  ArrowRight,
  MessageSquare,
  Mic,
  Image as ImageIcon,
  FolderOpen,
  LockKeyhole,
  Sparkles,
  Command,
  Search,
  Paperclip,
  AudioLines,
  Plus
} from 'lucide-react';

const modes = [
  {
    icon: MessageSquare,
    eyebrow: 'CONVERSATION',
    title: 'Ask anything.',
    body: 'Write, reason, research, code, plan, and work through ideas in one focused conversation.'
  },
  {
    icon: Mic,
    eyebrow: 'VOICE',
    title: 'Talk naturally.',
    body: 'Switch from typing to voice when you want a hands-free conversation with the same assistant.'
  },
  {
    icon: ImageIcon,
    eyebrow: 'CREATION',
    title: 'Make visuals.',
    body: 'Create visual work in a dedicated image workspace and keep it with the rest of your work.'
  },
  {
    icon: FolderOpen,
    eyebrow: 'WORKSPACE',
    title: 'Keep the work.',
    body: 'Conversations, files, and generated work stay organized around your account.'
  }
];

function PublicHome() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050506] text-zinc-100 selection:bg-white/15">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-360px] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-white/[.035] blur-[150px]" />
        <div className="absolute inset-0 opacity-[.16] [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      </div>

      <header className="relative z-20 mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark size={34} />
          <span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[12px] text-zinc-500 md:flex">
          <a href="#product" className="transition-colors hover:text-zinc-200">Product</a>
          <a href="#workspace" className="transition-colors hover:text-zinc-200">Workspace</a>
          <a href="#privacy" className="transition-colors hover:text-zinc-200">Privacy</a>
          <Link to="/pricing" className="transition-colors hover:text-zinc-200">Plans</Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <Link to="/login" className="rounded-xl px-3.5 py-2.5 text-[12px] font-medium text-zinc-400 transition hover:bg-white/[.05] hover:text-white">
            Sign in
          </Link>
          <Link to="/signup" className="rounded-xl bg-white px-4 py-2.5 text-[12px] font-semibold text-black transition hover:bg-zinc-200">
            Get started
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1240px] px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-3 py-1.5 text-[10px] font-medium tracking-[.02em] text-zinc-400 backdrop-blur">
            <Sparkles size={12} className="text-zinc-300" />
            AI workspace for thinking, creating, and talking
          </div>

          <h1 className="mt-7 text-[clamp(3.4rem,8vw,7.6rem)] font-semibold leading-[.88] tracking-[-.085em]">
            <span className="block text-white">Your ideas.</span>
            <span className="block bg-gradient-to-b from-white via-zinc-300 to-zinc-600 bg-clip-text text-transparent">Made clearer.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-[14px] leading-7 text-zinc-500 sm:text-[16px]">
            ZenixMind is an AI assistant built around the way you actually work — conversation first, with voice, images, files, and a workspace that stays out of the way.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/signup" className="group inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[12px] font-semibold text-black transition hover:bg-zinc-200">
              Create your account
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/login" className="rounded-2xl border border-white/[.09] bg-white/[.025] px-5 py-3 text-[12px] font-medium text-zinc-300 transition hover:bg-white/[.06] hover:text-white">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl rounded-[30px] border border-white/[.09] bg-[#09090b]/90 p-2 shadow-[0_50px_140px_rgba(0,0,0,.55)] backdrop-blur-xl sm:mt-20">
          <div className="overflow-hidden rounded-[24px] border border-white/[.06] bg-[#0b0b0e]">
            <div className="flex h-12 items-center justify-between border-b border-white/[.06] px-4 sm:px-5">
              <div className="flex items-center gap-2.5">
                <BrandMark size={23} />
                <span className="text-[11px] font-semibold">ZenixMind</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                AI workspace
              </div>
            </div>

            <div className="grid min-h-[330px] md:grid-cols-[190px_1fr]">
              <aside className="hidden border-r border-white/[.06] p-3 md:block">
                <div className="mb-4 rounded-xl border border-white/[.06] bg-white/[.025] px-3 py-2 text-[10px] text-zinc-500">New chat</div>
                <div className="space-y-1">
                  <div className="rounded-xl bg-white/[.055] px-3 py-2 text-[10px] text-zinc-300">Chat</div>
                  <div className="px-3 py-2 text-[10px] text-zinc-600">Images</div>
                  <div className="px-3 py-2 text-[10px] text-zinc-600">Library</div>
                </div>
              </aside>

              <div className="flex flex-col justify-between p-5 sm:p-8">
                <div className="mx-auto w-full max-w-2xl pt-5 sm:pt-8">
                  <p className="text-center text-[9px] font-semibold uppercase tracking-[.22em] text-zinc-600">Conversation</p>
                  <h2 className="mt-3 text-center text-2xl font-semibold tracking-[-.045em] text-zinc-100 sm:text-3xl">
                    What are you working on?
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-center text-[11px] leading-5 text-zinc-600">
                    Start with a question, an idea, a file, or a problem.
                  </p>
                </div>

                <div className="mx-auto w-full max-w-2xl rounded-[20px] border border-white/[.08] bg-[#08080a] p-2 shadow-inner">
                  <div className="px-3 py-3 text-[11px] text-zinc-700">Message ZenixMind…</div>
                  <div className="flex items-center justify-between px-1 pb-1">
                    <div className="flex items-center gap-1">
                      <span className="grid h-7 w-7 place-items-center rounded-lg text-zinc-600"><Plus size={13} /></span>
                      <span className="grid h-7 w-7 place-items-center rounded-lg text-zinc-600"><Paperclip size={13} /></span>
                    </div>
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-black"><ArrowRight size={13} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="relative z-10 border-t border-white/[.06]">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-zinc-600">The assistant</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.055em] sm:text-5xl">One assistant. Different ways to work.</h2>
            <p className="mt-5 text-sm leading-7 text-zinc-500 sm:text-base">
              The interface stays simple while the work can move between conversation, voice, visual creation, and your files.
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modes.map(({ icon: Icon, eyebrow, title, body }) => (
              <div key={title} className="group rounded-[25px] border border-white/[.07] bg-[#08080a] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/[.13] hover:bg-[#0b0b0e]">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.07] bg-white/[.025] text-zinc-400 transition group-hover:text-white">
                    <Icon size={17} />
                  </div>
                  <span className="text-[8px] font-semibold tracking-[.18em] text-zinc-700">{eyebrow}</span>
                </div>
                <h3 className="mt-8 text-[15px] font-semibold tracking-[-.02em]">{title}</h3>
                <p className="mt-2.5 text-[11px] leading-5 text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workspace" className="relative z-10 border-y border-white/[.06] bg-white/[.012]">
        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-zinc-600">The workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.055em] sm:text-5xl">Less dashboard. More doing.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-500">
              ZenixMind keeps the useful controls close and lets the conversation stay central. Your work can grow without the interface becoming the work.
            </p>
            <Link to="/signup" className="mt-8 inline-flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-white">
              Open your workspace <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Chat', 'Focused conversation', MessageSquare],
              ['Voice', 'Hands-free conversation', AudioLines],
              ['Images', 'Visual creation space', ImageIcon],
              ['Library', 'Your saved work', FolderOpen]
            ].map(([name, body, Icon]) => (
              <div key={String(name)} className="rounded-[24px] border border-white/[.07] bg-[#08080a] p-5">
                <Icon size={18} className="text-zinc-500" />
                <p className="mt-9 text-xs font-semibold text-zinc-200">{String(name)}</p>
                <p className="mt-1 text-[10px] text-zinc-600">{String(body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="relative z-10 mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
        <div className="rounded-[28px] border border-white/[.08] bg-[#08080a] p-7 sm:p-10">
          <div className="flex flex-col gap-7 md:flex-row md:items-center">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/[.07] bg-white/[.025]">
              <LockKeyhole size={19} className="text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-600">Privacy</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-.03em]">Your account. Your workspace.</h2>
              <p className="mt-2 max-w-2xl text-xs leading-6 text-zinc-500">
                Authentication and account sessions are handled by Supabase. Private Chat is separate from your normal saved conversation history.
              </p>
            </div>
            <Link to="/signup" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 hover:text-white">
              Create account <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[.06]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark size={27} />
            <span className="text-xs font-semibold">ZenixMind</span>
          </div>
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
        <Link to="/assistant" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-semibold text-black hover:bg-zinc-200">
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
