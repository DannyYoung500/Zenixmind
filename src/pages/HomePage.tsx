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
  Search,
  Bell,
  Paperclip,
  Sparkles,
  Globe,
  AudioLines,
  X,
  Menu
} from 'lucide-react';

const capabilities = [
  ['Chat', 'Conversation, reasoning, writing and research.', MessageSquare],
  ['Voice', 'Talk naturally and keep the conversation moving.', AudioLines],
  ['Images', 'Create and organize visual work.', ImageIcon],
  ['Library', 'Keep your conversations and files together.', FolderOpen]
] as const;

function PublicHome() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4eff8] text-[#16131b] selection:bg-[#d7c2ee]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12rem] h-[42rem] w-[70rem] -translate-x-1/2 rounded-full bg-[#d8b9f2]/60 blur-[120px]" />
        <div className="absolute left-[8%] top-[35%] h-[28rem] w-[28rem] rounded-full bg-[#e5d8f4]/70 blur-[110px]" />
        <div className="absolute right-[-8%] top-[22%] h-[32rem] w-[32rem] rounded-full bg-[#d7c4f0]/55 blur-[120px]" />
      </div>

      <header className="relative z-20 mx-auto flex h-[82px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark size={38} />
          <span className="text-[17px] font-semibold tracking-[-.035em]">ZenixMind</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[12px] font-medium text-[#625b68] lg:flex">
          <a href="#product" className="transition hover:text-[#17131c]">Product</a>
          <a href="#capabilities" className="transition hover:text-[#17131c]">Capabilities</a>
          <Link to="/pricing" className="transition hover:text-[#17131c]">Plans</Link>
          <a href="#privacy" className="transition hover:text-[#17131c]">Privacy</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden rounded-full px-4 py-2.5 text-[12px] font-semibold text-[#403a45] transition hover:bg-white/50 sm:inline-flex">
            Sign in
          </Link>
          <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-[#18151c] px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_24px_rgba(33,24,44,.16)] transition hover:-translate-y-0.5 hover:bg-[#29232e]">
            Get started
            <ArrowRight size={13} />
          </Link>
          <button className="ml-1 grid h-9 w-9 place-items-center rounded-full border border-black/[.07] bg-white/45 text-[#514b57] lg:hidden" aria-label="Open menu">
            <Menu size={16} />
          </button>
        </div>
      </header>

      <section id="product" className="relative z-10 mx-auto max-w-[1320px] px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:px-10 lg:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/35 px-3.5 py-2 text-[10px] font-semibold tracking-[.02em] text-[#6d6372] shadow-[0_8px_30px_rgba(73,49,97,.05)] backdrop-blur-xl">
            <Sparkles size={12} />
            Your AI workspace
          </div>

          <h1 className="mt-7 text-[clamp(3.2rem,7vw,6.8rem)] font-semibold leading-[.91] tracking-[-.085em] text-[#19151d]">
            Think. Create.
            <span className="block bg-gradient-to-r from-[#27202f] via-[#73538f] to-[#b08ed0] bg-clip-text text-transparent">
              Get things done.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-7 text-[#716877] sm:text-[16px]">
            ZenixMind brings conversation, voice, images and your work into one calm AI workspace.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-[#19151d] px-5 py-3 text-[12px] font-semibold text-white shadow-[0_12px_30px_rgba(37,25,49,.18)] transition hover:-translate-y-0.5">
              Start with ZenixMind
              <ArrowRight size={14} />
            </Link>
            <Link to="/login" className="rounded-full border border-black/[.08] bg-white/45 px-5 py-3 text-[12px] font-semibold text-[#3e3745] backdrop-blur-xl transition hover:bg-white/65">
              Sign in
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-[1160px] sm:mt-20">
          <div className="absolute inset-x-[8%] top-[15%] h-[70%] rounded-full bg-[#caa8e8]/55 blur-[80px]" />

          <div className="relative overflow-hidden rounded-[30px] border border-white/75 bg-white/35 p-2 shadow-[0_40px_100px_rgba(70,45,92,.15)] backdrop-blur-2xl sm:p-3">
            <div className="overflow-hidden rounded-[25px] border border-white/70 bg-[#eee6f2]/55">
              <div className="flex h-14 items-center justify-between border-b border-white/65 px-4 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <BrandMark size={25} />
                  <span className="text-[11px] font-semibold text-[#252029]">ZenixMind</span>
                </div>
                <div className="hidden items-center gap-2 text-[9px] font-medium text-[#7d7481] sm:flex">
                  <span className="rounded-full border border-white/80 bg-white/45 px-3 py-1.5">Product preview</span>
                </div>
              </div>

              <div className="relative min-h-[390px] p-5 sm:min-h-[500px] sm:p-10">
                <div className="mx-auto flex max-w-3xl flex-col items-center pt-9 text-center sm:pt-14">
                  <BrandMark size={42} />
                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8d8293]">ZenixMind AI</p>
                  <h2 className="mt-3 text-[28px] font-semibold tracking-[-.055em] text-[#29232e] sm:text-[40px]">What can we work on?</h2>
                  <p className="mt-3 max-w-md text-[11px] leading-5 text-[#8b818e]">Ask a question, explore an idea, create something, or continue your work.</p>

                  <div className="mt-8 w-full max-w-2xl rounded-[23px] border border-white/90 bg-white/55 p-2 shadow-[0_18px_50px_rgba(75,54,93,.08)] backdrop-blur-xl">
                    <div className="px-3 py-4 text-left text-[11px] text-[#9a919d]">Message ZenixMind…</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button className="grid h-8 w-8 place-items-center rounded-full text-[#756b7b]" aria-label="Attach"><Paperclip size={14} /></button>
                        <button className="grid h-8 w-8 place-items-center rounded-full text-[#756b7b]" aria-label="Search"><Globe size={14} /></button>
                        <span className="rounded-full border border-white/80 bg-white/45 px-2.5 py-1.5 text-[9px] text-[#756b7b]">Deep research</span>
                      </div>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#8d5db6] text-white shadow-[0_6px_18px_rgba(112,70,150,.22)]">
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {['Fast', 'In-depth', 'Creative', 'Research'].map(label => (
                      <span key={label} className="rounded-full border border-white/80 bg-white/35 px-3 py-1.5 text-[9px] font-medium text-[#766d7a] backdrop-blur">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 w-[230px] rounded-[20px] border border-white/90 bg-white/85 p-3 shadow-[0_24px_60px_rgba(67,45,84,.18)] backdrop-blur-xl sm:bottom-7 sm:right-7 sm:w-[285px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BrandMark size={22} />
                      <div>
                        <p className="text-[9px] font-semibold text-[#29222f]">ZenixMind</p>
                        <p className="text-[7px] text-[#948b97]">AI assistant</p>
                      </div>
                    </div>
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-black text-white"><X size={11} /></span>
                  </div>
                  <div className="mt-3 rounded-xl bg-[#f1ebf5] px-3 py-3">
                    <p className="text-[9px] font-semibold text-[#4b4251]">Your workspace is ready.</p>
                    <p className="mt-1 text-[8px] leading-4 text-[#8b818e]">Start a conversation to bring your work into ZenixMind.</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[8px] text-[#827887]">
                    <MessageSquare size={11} /> Chat
                    <Mic size={11} className="ml-1" /> Voice
                  </div>
                </div>

                <span className="absolute bottom-5 left-5 hidden h-10 w-10 place-items-center rounded-full bg-black text-white shadow-xl sm:grid">
                  <Search size={15} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="relative z-10 mx-auto max-w-[1320px] px-5 pb-24 sm:px-8 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(([title, body, Icon]) => (
            <div key={title} className="rounded-[24px] border border-white/70 bg-white/35 p-5 shadow-[0_18px_50px_rgba(75,54,93,.05)] backdrop-blur-xl">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/80 bg-white/45 text-[#695d72]">
                <Icon size={17} />
              </div>
              <h3 className="mt-7 text-[14px] font-semibold tracking-[-.02em] text-[#28222d]">{title}</h3>
              <p className="mt-2 text-[11px] leading-5 text-[#7e7482]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="privacy" className="relative z-10 border-t border-white/60 bg-white/20">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#817688]">Built around your account</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-.055em] text-[#221c27] sm:text-4xl">A calmer way to use AI.</h2>
            <p className="mt-4 text-sm leading-6 text-[#776d7e]">
              Your ZenixMind account is authenticated through Supabase, with normal conversations kept separate from Private Chat.
            </p>
          </div>
          <Link to="/signup" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#19151d] px-5 py-3 text-[12px] font-semibold text-white shadow-lg">
            Create account <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/60">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark size={28} />
            <span className="text-xs font-semibold text-[#302936]">ZenixMind</span>
          </Link>
          <div className="flex flex-wrap gap-5 text-[11px] font-medium text-[#7c7181]">
            <Link to="/pricing" className="hover:text-[#2c2531]">Plans</Link>
            <Link to="/login" className="hover:text-[#2c2531]">Sign in</Link>
            <Link to="/signup" className="hover:text-[#2c2531]">Get started</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function AuthenticatedHome() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-[#f4eff8] text-[#17131b]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <BrandMark size={48} />
        <p className="mt-7 text-[10px] font-semibold uppercase tracking-[.24em] text-[#837789]">Your workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Welcome back, {user?.name || 'there'}.</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-[#786e7e]">Continue where you left off or start something new.</p>
        <Link to="/assistant" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#19151d] px-5 py-3 text-xs font-semibold text-white shadow-lg">
          Open workspace <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}

export function HomePage() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#f4eff8]" />;
  return user ? <AuthenticatedHome /> : <PublicHome />;
}
