import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { useAuth } from '../lib/auth-context';
import {
  ArrowUp,
  Bell,
  Bot,
  FolderOpen,
  Image as ImageIcon,
  Menu,
  MessageSquare,
  Mic,
  Paperclip,
  Search,
  Sparkles,
  X
} from 'lucide-react';

const features = [
  { title: 'Chat', text: 'Reason, write, research, code and plan.', icon: MessageSquare },
  { title: 'Voice', text: 'Talk naturally with your assistant.', icon: Mic },
  { title: 'Images', text: 'Create visual work in one workspace.', icon: ImageIcon },
  { title: 'Library', text: 'Keep your work organized and accessible.', icon: FolderOpen }
];

function PublicHome() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f1f8] text-[#211c25] selection:bg-[#d8bfe9]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-24rem] h-[58rem] w-[80rem] -translate-x-1/2 rounded-full bg-[#d8b6ed]/55 blur-[125px]" />
        <div className="absolute left-[-8rem] top-[35%] h-[30rem] w-[30rem] rounded-full bg-[#eadff1]/90 blur-[110px]" />
        <div className="absolute right-[-10rem] top-[18%] h-[36rem] w-[36rem] rounded-full bg-[#d7c4ef]/65 blur-[120px]" />
      </div>

      <section className="relative z-10 mx-auto px-3 py-3 sm:px-5 sm:py-5">
        <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[1370px] overflow-hidden rounded-[30px] border border-white/85 bg-white/25 shadow-[0_30px_100px_rgba(70,48,91,.13)] backdrop-blur-2xl sm:min-h-[calc(100vh-40px)] sm:rounded-[34px]">
          <header className="flex h-[72px] items-center justify-between border-b border-white/55 px-5 sm:h-[82px] sm:px-8 lg:px-10">
            <Link to="/" className="flex items-center gap-3">
              <BrandMark size={39} />
              <span className="text-[18px] font-semibold tracking-[-.04em]">ZenixMind</span>
            </Link>

            <nav className="hidden items-center gap-7 text-[12px] font-medium text-[#6c6471] lg:flex">
              <a href="#workspace" className="hover:text-[#211c25]">Workspace</a>
              <a href="#capabilities" className="hover:text-[#211c25]">Capabilities</a>
              <Link to="/pricing" className="hover:text-[#211c25]">Plans</Link>
            </nav>

            <div className="flex items-center gap-2">
              <div className="hidden h-10 w-[190px] items-center gap-2 rounded-full border border-white/75 bg-white/45 px-3.5 text-[11px] text-[#8a818d] shadow-[0_8px_25px_rgba(65,44,83,.04)] sm:flex">
                <Search size={14} />
                Search
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/40 text-[#6e6572]" aria-label="Notifications">
                <Bell size={15} />
              </button>
              <Link to="/login" className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/75 bg-white/50 text-[11px] font-semibold text-[#4f4754] sm:flex">
                ZM
              </Link>
              <button className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/40 text-[#6e6572] lg:hidden" aria-label="Menu">
                <Menu size={16} />
              </button>
            </div>
          </header>

          <div id="workspace" className="relative flex min-h-[calc(100vh-108px)] items-center justify-center px-5 py-16 sm:px-10 sm:py-20">
            <div className="pointer-events-none absolute left-1/2 top-[36%] h-[22rem] w-[55rem] -translate-x-1/2 rounded-full bg-[#cba4e7]/35 blur-[90px]" />

            <div className="relative w-full max-w-[940px] text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/50 shadow-[0_10px_30px_rgba(65,44,83,.08)]">
                <BrandMark size={42} />
              </div>

              <h1 className="mt-5 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-[-.07em] text-[#332a39]">
                Hi, I&apos;m ZenixMind
              </h1>
              <p className="mt-3 text-[13px] text-[#8b818e] sm:text-[15px]">How can I help you today?</p>

              <div className="mx-auto mt-9 w-full max-w-[820px] rounded-[24px] border border-white/90 bg-white/48 p-2 shadow-[0_24px_70px_rgba(69,48,88,.10)] backdrop-blur-xl">
                <div className="min-h-[92px] px-4 py-4 text-left text-[12px] text-[#9b919e] sm:min-h-[112px] sm:px-5">
                  Ask anything...
                </div>
                <div className="flex items-center justify-between gap-2 px-1 pb-1">
                  <div className="flex items-center gap-1.5">
                    <button className="grid h-9 w-9 place-items-center rounded-full text-[#766c7a] hover:bg-white/60" aria-label="Attach file">
                      <Paperclip size={15} />
                    </button>
                    <button className="flex h-9 items-center gap-1.5 rounded-full border border-white/80 bg-white/35 px-3 text-[10px] font-medium text-[#756b79]">
                      <Sparkles size={12} /> Deep research
                    </button>
                    <button className="flex h-9 items-center gap-1.5 rounded-full border border-white/80 bg-white/35 px-3 text-[10px] font-medium text-[#756b79]">
                      <Search size={12} /> Search
                    </button>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#9b59c7] text-white shadow-[0_8px_22px_rgba(120,67,158,.24)]">
                    <ArrowUp size={15} />
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {['Fast', 'In-depth', 'Creative', 'Research'].map(label => (
                  <span key={label} className="rounded-full border border-white/85 bg-white/35 px-4 py-2 text-[10px] font-medium text-[#776d7b] backdrop-blur-xl">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute bottom-7 right-5 w-[255px] rounded-[22px] border border-white/90 bg-white/82 p-3.5 text-left shadow-[0_28px_70px_rgba(63,43,80,.18)] backdrop-blur-xl sm:bottom-10 sm:right-8 sm:w-[300px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BrandMark size={23} />
                  <div>
                    <p className="text-[10px] font-semibold text-[#332a38]">ZenixMind</p>
                    <p className="text-[8px] text-[#958b99]">Your AI assistant</p>
                  </div>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-black text-white">
                  <X size={12} />
                </span>
              </div>
              <div className="mt-3 rounded-[14px] bg-[#f2ebf5] p-3">
                <div className="flex items-center gap-2">
                  <Bot size={13} className="text-[#85629b]" />
                  <span className="text-[9px] font-semibold text-[#4d4452]">Ready when you are</span>
                </div>
                <p className="mt-1.5 text-[8px] leading-4 text-[#8a808e]">
                  Start a conversation in your ZenixMind workspace.
                </p>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[8px] text-[#817685]">
                <span className="inline-flex items-center gap-1"><MessageSquare size={10} /> Chat</span>
                <span className="inline-flex items-center gap-1"><Mic size={10} /> Voice</span>
              </div>
            </div>

            <span className="absolute bottom-8 left-7 hidden h-11 w-11 place-items-center rounded-full bg-black text-white shadow-xl sm:grid">
              <Search size={15} />
            </span>
          </div>
        </div>
      </section>

      <section id="capabilities" className="relative z-10 mx-auto max-w-[1370px] px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#83778a]">ZenixMind workspace</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.06em] text-[#2b2430] sm:text-5xl">Everything stays in one place.</h2>
          <p className="mt-4 text-sm leading-6 text-[#7d7281]">A focused AI workspace for conversation and creation without unnecessary clutter.</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, text, icon: Icon }) => (
            <div key={title} className="rounded-[24px] border border-white/80 bg-white/40 p-5 shadow-[0_16px_45px_rgba(71,49,91,.06)] backdrop-blur-xl">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/55 text-[#6e6077]">
                <Icon size={17} />
              </div>
              <h3 className="mt-7 text-[14px] font-semibold text-[#2b2430]">{title}</h3>
              <p className="mt-2 text-[11px] leading-5 text-[#7e7482]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/70 bg-white/15">
        <div className="mx-auto flex max-w-[1370px] flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-2.5">
            <BrandMark size={28} />
            <span className="text-xs font-semibold text-[#302936]">ZenixMind</span>
          </div>
          <div className="flex gap-5 text-[11px] text-[#7c7181]">
            <Link to="/pricing">Plans</Link>
            <Link to="/login">Sign in</Link>
            <Link to="/signup">Get started</Link>
          </div>
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
