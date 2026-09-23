import React from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { CompactFloatingComposer } from './AssistantPage';
import { useAuth } from '../lib/auth-context';
import { MessageSquare, Search, PenLine, Mic2, ShieldCheck, ArrowRight } from 'lucide-react';

function LandingComposer() {
  const navigate = useNavigate();
  const [value, setValue] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState('gemini-2.5-flash');
  const [webSearch, setWebSearch] = React.useState(false);
  const [deepThink, setDeepThink] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [attachmentName, setAttachmentName] = React.useState('');

  const goToChat = React.useCallback(() => {
    const prompt = value.trim();
    if (!prompt) {
      navigate('/assistant');
      return;
    }
    const params = new URLSearchParams({ q: prompt });
    if (selectedModel) params.set('model', selectedModel);
    if (webSearch) params.set('webSearch', '1');
    if (deepThink) params.set('deepThink', '1');
    navigate(`/assistant?${params.toString()}`);
  }, [value, selectedModel, webSearch, deepThink, navigate]);

  return (
    <CompactFloatingComposer
      value={value}
      setValue={setValue}
      onSend={goToChat}
      onStop={() => {}}
      onOpenVoice={() => navigate('/assistant')}
      busy={false}
      selectedModel={selectedModel}
      onSelectModel={setSelectedModel}
      webSearch={webSearch}
      setWebSearch={setWebSearch}
      deepThink={deepThink}
      setDeepThink={setDeepThink}
      onDictate={() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert('Speech recognition is not supported in this browser.');
          return;
        }
        if (isListening) {
          setIsListening(false);
          return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
          setValue(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        try { recognition.start(); } catch { setIsListening(false); }
      }}
      isListening={isListening}
      onAttachFile={(file) => setAttachmentName(file.name)}
      attachmentName={attachmentName}
      onClearAttachment={() => setAttachmentName('')}
    />
  );
}

const capabilities = [
  [MessageSquare, 'Conversation', 'Ask questions, think through decisions, and keep the conversation flowing.'],
  [Search, 'Research', 'Explore information and turn complex questions into clear next steps.'],
  [PenLine, 'Create', 'Draft, rewrite, plan, code, and shape ideas with an assistant that stays focused.'],
  [Mic2, 'Voice', 'Switch from typing to natural speech when talking is easier.']
] as const;

function PublicHome() {
  return (
    <main className="min-h-screen bg-[#050506] text-zinc-100">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark size={36} />
          <span className="text-[16px] font-semibold">ZenixMind</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-zinc-400 md:flex">
          <a href="#home" className="hover:text-white">Home</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#experience" className="hover:text-white">Experience</a>
          <Link to="/pricing" className="hover:text-white">Pricing</Link>
          <a href="#community" className="hover:text-white">Community</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-full px-4 py-2.5 text-[13px] text-zinc-300 hover:bg-white/[.06]">Sign in</Link>
          <Link to="/signup" className="rounded-full bg-[#111114] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#18181d]">Get started</Link>
        </div>
      </header>

      <section id="home" className="relative overflow-hidden px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#8b5cf6]/[.07] blur-[110px]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-zinc-500">Your intelligent AI assistant</p>
          <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(3.2rem,8vw,6.9rem)] font-semibold leading-[.94] tracking-[-.075em] text-zinc-100">Hi, I am ZenixMind AI</h1>
          <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-zinc-400 sm:text-[17px]">A natural AI assistant for questions, ideas, learning, research, writing, code, and everyday conversations.</p>
          <div className="mx-auto mt-11 max-w-4xl"><LandingComposer /></div>
        </div>
      </section>

      <section id="features" className="border-t border-white/[.07] bg-[#050506] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-[11px] font-semibold uppercase tracking-[.25em] text-zinc-500">A focused assistant</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] sm:text-5xl">Everything starts with a conversation.</h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-zinc-400">No cluttered catalog. No distracting product maze. ZenixMind keeps the experience centered on what you are trying to accomplish.</p>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(([Icon, title, description]) => (
              <div key={title} className="rounded-[24px] border border-white/[.08] bg-[#0b0b0e] p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#121216] text-zinc-300"><Icon size={17} /></div>
                <div className="mt-5 text-sm font-semibold">{title}</div>
                <p className="mt-3 text-[12px] leading-6 text-zinc-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="experience" className="border-t border-white/[.07] bg-[#08080b] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.25em] text-zinc-500">The experience</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] sm:text-5xl">Simple on the surface. Powerful when you need it.</h2>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-zinc-400">Start with one thought and let ZenixMind adapt to the task. Search, deeper reasoning, files, and voice stay close to the conversation instead of taking over the page.</p>
            <div className="mt-8 flex items-center gap-3 text-xs text-zinc-300"><ShieldCheck size={16} className="text-cyan-400" />Your account and conversations stay tied to your real workspace.</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/[.08] bg-[#101012] p-5"><div className="text-sm font-semibold">Stay in flow</div><p className="mt-2 text-xs leading-6 text-zinc-500">Ask follow-ups without restarting your context.</p></div>
            <div className="rounded-[22px] border border-white/[.08] bg-[#101012] p-5"><div className="text-sm font-semibold">Work naturally</div><p className="mt-2 text-xs leading-6 text-zinc-500">Write, research, reason, plan, and code from the same place.</p></div>
            <div className="rounded-[22px] border border-white/[.08] bg-[#101012] p-5"><div className="text-sm font-semibold">Use your voice</div><p className="mt-2 text-xs leading-6 text-zinc-500">Talk when typing is not the best way to think.</p></div>
            <div className="rounded-[22px] border border-white/[.08] bg-[#101012] p-5"><div className="text-sm font-semibold">Keep control</div><p className="mt-2 text-xs leading-6 text-zinc-500">Your workspace stays organized around conversations and actions.</p></div>
          </div>
        </div>
      </section>

      <section id="community" className="border-t border-white/[.07] bg-[#050506] px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl rounded-[30px] bg-[#111114] px-7 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-semibold sm:text-5xl">Start with a thought.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400">Open a real conversation and let ZenixMind help you move from question to action.</p>
          <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1c1c21] px-6 py-3 text-xs font-semibold text-white hover:bg-[#25252b]">Get started <ArrowRight size={14} /></Link>
        </div>
      </section>

      <footer className="border-t border-white/[.07] bg-[#050506] px-5 py-9 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5"><BrandMark size={28} /><span className="text-xs font-semibold">ZenixMind</span></div>
          <div className="text-[11px] text-zinc-500">Think · Create · Learn · Get Things Done</div>
        </div>
      </footer>
    </main>
  );
}

export function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#050506]" />;
  }

  // The public root is the marketing landing page. Once authenticated,
  // never show a second "welcome back" page: go directly to the real workspace.
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PublicHome />;
}
