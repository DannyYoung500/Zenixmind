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
    <main className="min-h-screen bg-[#fbfbfd] text-[#17151c]">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3"><BrandMark size={36} /><span className="text-[16px] font-semibold">ZenixMind</span></Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-[#6f6877] md:flex"><a href="#home">Home</a><a href="#features">Features</a><a href="#models">Models</a><Link to="/pricing">Pricing</Link><a href="#community">Community</a></nav>
        <div className="flex items-center gap-2"><Link to="/login" className="rounded-full px-4 py-2.5 text-[13px] text-[#625b6a] hover:bg-black/[.04]">Sign in</Link><Link to="/signup" className="rounded-full bg-[#19161f] px-5 py-2.5 text-[13px] font-semibold text-white">Get started</Link></div>
      </header>
      <section id="home" className="relative overflow-hidden px-5 pb-24 pt-20 sm:px-8 sm:pt-28"><div className="pointer-events-none absolute left-1/2 top-[-240px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#8b5cf6]/[.07] blur-[110px]" /><div className="relative mx-auto max-w-5xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#8b7f91]">Your intelligent AI assistant</p>
        <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(3.2rem,8vw,6.9rem)] font-semibold leading-[.94] tracking-[-.075em] text-[#17151c]">Hi, I am ZenixMind AI</h1>
        <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-[#777080] sm:text-[17px]">A natural AI assistant for questions, ideas, learning, research, writing, code, and everyday conversations.</p>
        <div className="mx-auto mt-11 max-w-4xl rounded-[30px] border border-[#ded9e5] bg-white p-3 text-left shadow-[0_24px_70px_rgba(40,25,60,.10)]"><div className="min-h-[86px] rounded-[22px] px-4 pt-3 text-[15px] text-[#a19aa8]">Ask ZenixMind anything...</div><div className="flex items-center justify-between gap-3 px-1 pb-1"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f1eef5] text-[#645b6d]">+</span><span className="hidden rounded-full bg-[#f5f2f8] px-3.5 py-2 text-[11px] font-semibold text-[#62596b] sm:inline-flex">Fast</span><span className="hidden text-[11px] text-[#9a92a2] sm:inline">Attach files</span></div><Link to="/signup" className="rounded-full bg-[#19161f] px-5 py-2.5 text-[12px] font-semibold text-white">Start chatting</Link></div></div>
      </div></section>
      <section id="features" className="border-t border-[#ece8ef] bg-white px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#938a9d]">Features</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] sm:text-5xl">One assistant. Many ways to work.</h2><p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#7b7281]">Move naturally between conversation, voice, visual work, and your saved library without cluttering the experience.</p><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-[#e9e4ec] bg-[#fbfafd] p-6"><div className="text-sm font-semibold">Chat</div><p className="mt-3 text-[12px] leading-6 text-[#817887]">Think through questions, ideas, writing, research, and code.</p></div><div className="rounded-[24px] border border-[#e9e4ec] bg-[#fbfafd] p-6"><div className="text-sm font-semibold">Voice</div><p className="mt-3 text-[12px] leading-6 text-[#817887]">Talk naturally and continue the same conversation hands-free.</p></div><div className="rounded-[24px] border border-[#e9e4ec] bg-[#fbfafd] p-6"><div className="text-sm font-semibold">Images</div><p className="mt-3 text-[12px] leading-6 text-[#817887]">Create visual work without leaving your ZenixMind workspace.</p></div><div className="rounded-[24px] border border-[#e9e4ec] bg-[#fbfafd] p-6"><div className="text-sm font-semibold">Library</div><p className="mt-3 text-[12px] leading-6 text-[#817887]">Keep conversations and saved work organized in one place.</p></div>
      </div></div></section>
      <section id="models" className="border-t border-[#ece8ef] bg-[#f8f6fa] px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1fr] lg:items-center"><div><p className="text-[11px] font-semibold uppercase tracking-[.25em] text-[#938a9d]">Intelligence</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] sm:text-5xl">Let the assistant handle the complexity.</h2><p className="mt-5 text-[15px] leading-7 text-[#7b7281]">ZenixMind can route requests through the configured AI engine while keeping the experience centered on a single assistant.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-[22px] border border-[#e4dfe8] bg-white p-5"><div className="text-sm font-semibold">Fast responses</div><p className="mt-2 text-xs text-[#827989]">Quick everyday answers.</p></div><div className="rounded-[22px] border border-[#e4dfe8] bg-white p-5"><div className="text-sm font-semibold">Deep reasoning</div><p className="mt-2 text-xs text-[#827989]">More deliberate analysis when needed.</p></div><div className="rounded-[22px] border border-[#e4dfe8] bg-white p-5"><div className="text-sm font-semibold">Multimodal</div><p className="mt-2 text-xs text-[#827989]">Text, files, images, and voice.</p></div><div className="rounded-[22px] border border-[#e4dfe8] bg-white p-5"><div className="text-sm font-semibold">Personal</div><p className="mt-2 text-xs text-[#827989]">Your real account and workspace.</p></div></div></div></section>
      <section id="community" className="border-t border-[#ece8ef] bg-white px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto max-w-4xl rounded-[30px] bg-[#19161f] px-7 py-14 text-center text-white sm:px-12"><h2 className="text-3xl font-semibold sm:text-5xl">Start with a thought.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/60">No starter cards. No clutter. Just you, your question, and ZenixMind.</p><Link to="/signup" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-xs font-semibold text-[#19161f]">Get started</Link></div></section>
      <footer className="border-t border-[#ece8ef] bg-[#fbfbfd] px-5 py-9 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2.5"><BrandMark size={28} /><span className="text-xs font-semibold">ZenixMind</span></div><div className="text-[11px] text-[#8b8390]">Think · Create · Learn · Get Things Done</div></div></footer>
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
