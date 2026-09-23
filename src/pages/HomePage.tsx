import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { CompactFloatingComposer } from './AssistantPage';
import { useAuth } from '../lib/auth-context';
import { ArrowRight, Plus, Paperclip, Mic, Zap, ChevronDown, Image as ImageIcon, MessageSquare, AudioLines, FolderOpen, LockKeyhole } from 'lucide-react';

function LandingComposer() {
  const navigate = useNavigate();
  const [value, setValue] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState('gemini-2.5-flash');
  const [webSearch, setWebSearch] = React.useState(false);
  const [deepThink, setDeepThink] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [attachmentName, setAttachmentName] = React.useState('');
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null);

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
      onAttachFile={(file) => {
        setAttachmentFile(file);
        setAttachmentName(file.name);
      }}
      attachmentName={attachmentName}
      onClearAttachment={() => {
        setAttachmentFile(null);
        setAttachmentName('');
      }}
    />
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
    <main className="min-h-screen bg-[#050506] text-zinc-100">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3"><BrandMark size={36} /><span className="text-[16px] font-semibold">ZenixMind</span></Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-zinc-400 md:flex"><a href="#home">Home</a><a href="#features">Features</a><a href="#models">Models</a><Link to="/pricing">Pricing</Link><a href="#community">Community</a></nav>
        <div className="flex items-center gap-2"><Link to="/login" className="rounded-full px-4 py-2.5 text-[13px] text-zinc-300 hover:bg-white/[.06]">Sign in</Link><Link to="/signup" className="rounded-full bg-[#111114] px-5 py-2.5 text-[13px] font-semibold text-white">Get started</Link></div>
      </header>
      <section id="home" className="relative overflow-hidden px-5 pb-24 pt-20 sm:px-8 sm:pt-28"><div className="pointer-events-none absolute left-1/2 top-[-240px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#8b5cf6]/[.07] blur-[110px]" /><div className="relative mx-auto max-w-5xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-zinc-500">Your intelligent AI assistant</p>
        <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(3.2rem,8vw,6.9rem)] font-semibold leading-[.94] tracking-[-.075em] text-zinc-100">Hi, I am ZenixMind AI</h1>
        <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-zinc-400 sm:text-[17px]">A natural AI assistant for questions, ideas, learning, research, writing, code, and everyday conversations.</p>
        <div className="mx-auto mt-11 max-w-4xl"><LandingComposer /></div>
      </div></section>
      <section id="features" className="border-t border-white/[.07] bg-[#050506] px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto max-w-7xl"><p className="text-[11px] font-semibold uppercase tracking-[.25em] text-zinc-500">Features</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] sm:text-5xl">One assistant. Many ways to work.</h2><p className="mt-5 max-w-2xl text-[15px] leading-7 text-zinc-400">Move naturally between conversation, voice, visual work, and your saved library without cluttering the experience.</p><div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-white/[.08] bg-[#0b0b0e] p-6"><div className="text-sm font-semibold">Chat</div><p className="mt-3 text-[12px] leading-6 text-zinc-500">Think through questions, ideas, writing, research, and code.</p></div><div className="rounded-[24px] border border-white/[.08] bg-[#0b0b0e] p-6"><div className="text-sm font-semibold">Voice</div><p className="mt-3 text-[12px] leading-6 text-zinc-500">Talk naturally and continue the same conversation hands-free.</p></div><div className="rounded-[24px] border border-white/[.08] bg-[#0b0b0e] p-6"><div className="text-sm font-semibold">Images</div><p className="mt-3 text-[12px] leading-6 text-zinc-500">Create visual work without leaving your ZenixMind workspace.</p></div><div className="rounded-[24px] border border-white/[.08] bg-[#0b0b0e] p-6"><div className="text-sm font-semibold">Library</div><p className="mt-3 text-[12px] leading-6 text-zinc-500">Keep conversations and saved work organized in one place.</p></div>
      </div></div></section>
      <section id="models" className="border-t border-white/[.07] bg-[#08080b] px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1fr] lg:items-center"><div><p className="text-[11px] font-semibold uppercase tracking-[.25em] text-zinc-500">Intelligence</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.055em] sm:text-5xl">Let the assistant handle the complexity.</h2><p className="mt-5 text-[15px] leading-7 text-zinc-400">ZenixMind can route requests through the configured AI engine while keeping the experience centered on a single assistant.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-[22px] border border-white/[.08] bg-[#101012] p-5"><div className="text-sm font-semibold">Fast responses</div><p className="mt-2 text-xs text-zinc-500">Quick everyday answers.</p></div><div className="rounded-[22px] border border-white/[.08] bg-[#101012] p-5"><div className="text-sm font-semibold">Deep reasoning</div><p className="mt-2 text-xs text-zinc-500">More deliberate analysis when needed.</p></div><div className="rounded-[22px] border border-white/[.08] bg-[#101012] p-5"><div className="text-sm font-semibold">Multimodal</div><p className="mt-2 text-xs text-zinc-500">Text, files, images, and voice.</p></div><div className="rounded-[22px] border border-white/[.08] bg-[#101012] p-5"><div className="text-sm font-semibold">Personal</div><p className="mt-2 text-xs text-zinc-500">Your real account and workspace.</p></div></div></div></section>
      <section id="community" className="border-t border-white/[.07] bg-[#050506] px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto max-w-4xl rounded-[30px] bg-[#111114] px-7 py-14 text-center text-white sm:px-12"><h2 className="text-3xl font-semibold sm:text-5xl">Start with a thought.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-400">No starter cards. No clutter. Just you, your question, and ZenixMind.</p><Link to="/signup" className="mt-8 inline-flex rounded-full bg-[#1c1c21] px-6 py-3 text-xs font-semibold text-white">Get started</Link></div></section>
      <footer className="border-t border-white/[.07] bg-[#050506] px-5 py-9 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2.5"><BrandMark size={28} /><span className="text-xs font-semibold">ZenixMind</span></div><div className="text-[11px] text-zinc-500">Think · Create · Learn · Get Things Done</div></div></footer>
    </main>
  );
}

function AuthenticatedHome() {
  const { user } = useAuth();
  return (
    <main className="min-h-screen bg-[#050506] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <BrandMark size={48} />
        <p className="mt-7 text-[10px] font-semibold uppercase tracking-[.24em] text-zinc-500">Your workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Welcome back, {user?.name || 'there'}.</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-400">Continue where you left off or start something new.</p>
        <Link to="/assistant" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111114] px-5 py-3 text-xs font-semibold text-white shadow-lg">
          Open workspace <ArrowUp size={14} />
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
