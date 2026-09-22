import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const capabilities = [
  { number: "01", title: "Ask anything", text: "A focused space for questions, ideas, explanations, writing, coding and problem solving." },
  { number: "02", title: "Create with AI", text: "Move from a thought to something usable — text, images, and creative work in one workflow." },
  { number: "03", title: "Bring your tools", text: "Connect the services you already use and let ZenixMind become the place you direct the work." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070707]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={30} />
            <span className="text-[15px] font-semibold tracking-[-0.02em]">ZenixMind</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] text-zinc-400 md:flex">
            <Link href="#product" className="transition hover:text-white">Product</Link>
            <Link href="#capabilities" className="transition hover:text-white">Capabilities</Link>
            <Link href="/pricing" className="transition hover:text-white">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-3 py-2 text-[13px] text-zinc-300 hover:text-white sm:block">Log in</Link>
            <Link href="/assistant" className="rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-zinc-200">Open ZenixMind</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-[150px] h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/[0.07] blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-8 sm:pb-32 sm:pt-32">
          <div className="max-w-4xl">
            <div className="mb-8 flex items-center gap-3 text-[13px] text-zinc-400">
              <BrandMark size={25} />
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span>AI, in one place.</span>
            </div>
            <h1 className="max-w-4xl text-[clamp(3.4rem,8vw,7.8rem)] font-semibold leading-[0.91] tracking-[-0.065em]">
              One place for
              <span className="block text-zinc-500">your intelligence.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              ZenixMind is an AI workspace for thinking, creating and getting things done. Start with a conversation and bring more of your AI tools into the same place.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/assistant" className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-zinc-200">
                Start with ZenixMind
              </Link>
              <Link href="#product" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] px-6 text-sm font-medium text-white transition hover:bg-white/[0.06]">
                See the product
              </Link>
            </div>
          </div>

          <div id="product" className="mt-20 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0f] shadow-[0_40px_120px_rgba(0,0,0,.45)]">
            <div className="flex h-11 items-center border-b border-white/[0.07] px-4">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" /><span className="h-2 w-2 rounded-full bg-white/20" />
              </div>
              <div className="mx-auto flex items-center gap-2 text-[11px] text-zinc-500">
                <BrandMark size={16} /> ZenixMind
              </div>
              <div className="w-8" />
            </div>
            <div className="grid min-h-[430px] md:grid-cols-[210px_1fr]">
              <aside className="hidden border-r border-white/[0.06] p-3 md:block">
                <div className="mb-5 flex items-center gap-2 px-2 py-2 text-xs font-medium"><BrandMark size={18} /> ZenixMind</div>
                <div className="rounded-lg bg-white/[0.07] px-3 py-2 text-xs text-zinc-300">+ New chat</div>
                <div className="mt-5 space-y-1 text-[11px] text-zinc-600">
                  <div className="px-3 py-2">Recent conversations</div>
                  <div className="rounded-lg px-3 py-2 text-zinc-400">Build my next idea</div>
                  <div className="rounded-lg px-3 py-2">Product research</div>
                </div>
              </aside>
              <div className="relative flex flex-col">
                <div className="flex flex-1 items-center justify-center px-6 py-14">
                  <div className="w-full max-w-2xl">
                    <div className="mb-10 text-center">
                      <BrandMark size={38} className="mx-auto" />
                      <h2 className="mt-5 text-2xl font-medium tracking-tight">What can I help you build?</h2>
                      <p className="mt-2 text-sm text-zinc-600">Ask a question, explore an idea, or start something new.</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/[0.07] p-4 text-left"><p className="text-xs text-zinc-300">Think through an idea</p><p className="mt-1 text-[11px] text-zinc-600">Turn a rough thought into a clear plan.</p></div>
                      <div className="rounded-xl border border-white/[0.07] p-4 text-left"><p className="text-xs text-zinc-300">Write something</p><p className="mt-1 text-[11px] text-zinc-600">Draft, rewrite, explain or refine.</p></div>
                    </div>
                  </div>
                </div>
                <div className="mx-5 mb-5 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-zinc-600">Message ZenixMind…</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="border-t border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-14 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">The workspace</p>
              <h2 className="mt-5 max-w-lg text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                Start simple.<br />Go wherever the work takes you.
              </h2>
            </div>
            <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {capabilities.map((item) => (
                <div key={item.number} className="grid gap-5 py-7 sm:grid-cols-[70px_1fr]">
                  <span className="text-xs text-zinc-600">{item.number}</span>
                  <div>
                    <h3 className="text-lg font-medium">{item.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] px-6 py-16 text-center sm:px-10">
            <BrandMark size={42} className="mx-auto" />
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em]">Ready when you are.</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-zinc-500">Open the workspace and start a conversation with ZenixMind.</p>
            <Link href="/assistant" className="mt-8 inline-flex h-11 items-center rounded-xl bg-white px-6 text-sm font-semibold text-black hover:bg-zinc-200">Open ZenixMind</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2"><BrandMark size={18} /><span>© 2026 ZenixMind</span></div>
          <div className="flex gap-5"><Link href="/pricing" className="hover:text-zinc-300">Pricing</Link><Link href="/login" className="hover:text-zinc-300">Log in</Link></div>
        </div>
      </footer>
    </main>
  );
}
