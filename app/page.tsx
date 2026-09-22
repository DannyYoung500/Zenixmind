import Link from "next/link";

const features = [
  ["Think", "Get clear answers, explanations, ideas and reasoning in one conversation."],
  ["Create", "Turn your ideas into writing, images, plans and polished work."],
  ["Research", "Bring together information and sources without jumping between tools."],
  ["Connect", "Use the AI services you already have through one assistant experience."]
];

function Mark({ small = false }: { small?: boolean }) {
  return (
    <div className={`logo-mark relative ${small ? "h-9 w-9" : "h-14 w-14"}`}>
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="g" x1="8" y1="8" x2="56" y2="56">
            <stop stopColor="#22d3ee"/><stop offset=".42" stopColor="#3b82f6"/>
            <stop offset=".72" stopColor="#8b5cf6"/><stop offset="1" stopColor="#d946ef"/>
          </linearGradient>
        </defs>
        <path d="M32 7c8 0 14 5 18 11 4 6 5 13 2 19-3 6-8 9-14 10l-5 1 8 7c3 3 3 6 0 8-3 2-7 1-10-1l-9-9c-5-5-7-11-5-17 2-6 7-10 13-11l5-1-8-7c-3-3-3-6 0-8 3-2 7-1 10 1l9 9c5 5 7 11 5 17-2 6-7 10-13 11l-5 1-8 8c-3 3-7 3-9 0-2-3-1-6 2-9l7-7-7-7c-5-5-7-11-5-17 2-6 8-10 14-10Z" fill="none" stroke="url(#g)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="hero-grid pointer-events-none fixed inset-0 opacity-60" />
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <Mark small />
          <span className="text-lg font-semibold tracking-tight">ZenixMind</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <Link href="#features" className="hover:text-white">Features</Link>
          <Link href="#how" className="hover:text-white">How it works</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm text-zinc-300 hover:text-white sm:block">Log in</Link>
          <Link href="/assistant" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200">Try ZenixMind</Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-20 text-center md:pb-32 md:pt-32">
        <div className="glow absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 -translate-y-1/4 blur-3xl" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center">
          <Mark />
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            One intelligent assistant. Many possibilities.
          </div>
          <h1 className="mt-7 text-5xl font-semibold tracking-[-.05em] text-white md:text-7xl">
            Think. Create. <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">Go further.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400 md:text-xl">
            ZenixMind is your AI assistant for everyday questions, deep thinking, research and creation — built to bring your tools together in one place.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/assistant" className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black shadow-2xl shadow-white/10">Start chatting</Link>
            <Link href="#features" className="rounded-full border border-white/10 bg-white/[.04] px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/[.07]">Explore ZenixMind</Link>
          </div>
        </div>

        <div className="relative mx-auto mt-20 max-w-4xl rounded-[28px] border border-white/10 bg-[#0b0b10]/90 p-3 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="rounded-[20px] border border-white/5 bg-[#101015]">
            <div className="flex items-center gap-2 border-b border-white/5 px-5 py-4 text-left">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70"/><span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70"/><span className="h-2.5 w-2.5 rounded-full bg-green-400/70"/>
              <span className="ml-3 text-xs text-zinc-500">ZenixMind</span>
            </div>
            <div className="min-h-[300px] p-7 text-left md:p-10">
              <div className="max-w-xl">
                <p className="text-sm text-zinc-500">You</p>
                <p className="mt-2 text-lg text-zinc-200">Help me turn this idea into something real.</p>
                <p className="mt-8 text-sm text-zinc-500">ZenixMind</p>
                <p className="mt-2 text-lg leading-8 text-zinc-200">Absolutely. Let&apos;s break it down, find the best approach, and build it step by step.</p>
              </div>
              <div className="mt-12 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-zinc-600">Message ZenixMind…</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-medium text-cyan-300">WHAT&apos;S INSIDE</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">An assistant designed around what you actually want to do.</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {features.map(([title, body], i) => (
              <div key={title} className="rounded-3xl border border-white/8 bg-white/[.025] p-7 hover:bg-white/[.04]">
                <span className="text-xs text-zinc-600">0{i + 1}</span>
                <h3 className="mt-8 text-xl font-semibold">{title}</h3>
                <p className="mt-3 max-w-md leading-7 text-zinc-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="relative z-10 border-t border-white/5 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-medium text-fuchsia-300">BUILT TO GROW</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">One assistant, connected to your world.</h2>
          </div>
          <div className="space-y-5 text-zinc-400">
            <p>Start with a conversation. As ZenixMind grows, users can connect the AI services they already use and let ZenixMind coordinate them around their goals.</p>
            <p>That means the assistant can eventually work with external image, video, voice and other AI services without pretending to be every model itself.</p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-6 text-sm text-zinc-500 md:flex-row">
          <span>© 2026 ZenixMind</span>
          <span>Intelligence, connected.</span>
        </div>
      </footer>
    </main>
  );
}
