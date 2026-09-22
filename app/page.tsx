import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const capabilities = [
  ["01", "Think", "Ask, reason, research and keep the full context of your work in one conversation."],
  ["02", "Create", "Turn ideas into writing, plans, code and creative work without leaving the workspace."],
  ["03", "Expand", "Bring files, voice, image generation and connected AI services into the same workflow."],
];

function Arrow() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-white/[.10] bg-[#0b0b0d] shadow-[0_40px_140px_rgba(0,0,0,.55)]">
      <div className="flex h-12 items-center justify-between border-b border-white/[.07] px-4">
        <div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-white/20" /><i className="h-2.5 w-2.5 rounded-full bg-white/10" /><i className="h-2.5 w-2.5 rounded-full bg-white/[.06]" /></div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-white/75"><BrandMark size={15} /> ZenixMind</div>
        <span className="w-8" />
      </div>

      <div className="grid min-h-[570px] md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-white/[.07] bg-[#08080a] p-3 md:block">
          <div className="flex items-center gap-2 px-2 py-2.5"><BrandMark size={23} /><span className="text-xs font-semibold">ZenixMind</span></div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-black"><span className="text-base leading-none">+</span> New chat</div>
          <p className="mt-7 px-2 text-[9px] font-semibold uppercase tracking-[.18em] text-white/25">Recent</p>
          <div className="mt-2 space-y-1 text-[11px]">
            <div className="rounded-lg bg-white/[.06] px-3 py-2.5 text-white/80">Launch plan</div>
            <div className="px-3 py-2.5 text-white/35">Research notes</div>
            <div className="px-3 py-2.5 text-white/35">Website structure</div>
          </div>
          <p className="mt-7 px-2 text-[9px] font-semibold uppercase tracking-[.18em] text-white/25">Workspace</p>
          <div className="mt-2 space-y-1 text-[11px] text-white/35">
            <div className="px-3 py-2">Files</div>
            <div className="px-3 py-2">Connected tools</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col bg-[#0e0e10]">
          <div className="flex h-12 items-center justify-between border-b border-white/[.07] px-5">
            <span className="text-[11px] text-white/40">New conversation</span>
            <span className="rounded-lg border border-white/[.08] px-2.5 py-1.5 text-[10px] text-white/40">ZenixMind · Default</span>
          </div>
          <div className="flex-1 px-5 py-10 sm:px-10">
            <div className="mx-auto max-w-2xl">
              <div className="flex justify-end"><div className="max-w-[76%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-xs leading-5 text-black">Help me turn this idea into a real launch plan.</div></div>
              <div className="mt-9 flex gap-3">
                <BrandMark size={25} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs leading-6 text-white/75">Start with the product people can use today. Then make the next steps clear without promising what is not built yet.</p>
                  <div className="mt-5 rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                    <p className="text-[11px] font-medium text-white/80">Launch structure</p>
                    <div className="mt-3 space-y-2.5 text-[10px] text-white/40">
                      <div className="flex gap-2"><span className="text-white/20">01</span><span>Show the working workspace.</span></div>
                      <div className="flex gap-2"><span className="text-white/20">02</span><span>Demonstrate the conversation.</span></div>
                      <div className="flex gap-2"><span className="text-white/20">03</span><span>Let the product lead the story.</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 sm:px-6">
            <div className="mx-auto flex h-14 max-w-2xl items-center justify-between rounded-2xl border border-white/[.09] bg-[#111114] px-4">
              <span className="text-[11px] text-white/25">Message ZenixMind…</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-black"><Arrow /></span>
            </div>
            <p className="mt-2 text-center text-[9px] text-white/15">ZenixMind can make mistakes. Check important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050506] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[.07] bg-[#050506]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5"><BrandMark size={31} /><span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span></Link>
          <nav className="hidden items-center gap-9 text-[13px] text-white/45 md:flex">
            <Link href="#product" className="transition hover:text-white">Product</Link>
            <Link href="#capabilities" className="transition hover:text-white">Capabilities</Link>
            <Link href="/pricing" className="transition hover:text-white">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-3 py-2 text-[13px] text-white/50 transition hover:text-white sm:block">Log in</Link>
            <Link href="/assistant" className="rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition hover:bg-white/85">Start chatting</Link>
          </div>
        </div>
      </header>

      <section className="relative border-b border-white/[.07]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(255,255,255,.055),transparent_65%)]" />
        <div className="relative mx-auto max-w-[1280px] px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-32">
          <div className="mx-auto max-w-[930px] text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/[.10] bg-white/[.025] px-3.5 py-2 text-[11px] font-medium text-white/50"><BrandMark size={16} /> AI, in one place.</div>
            <h1 className="mt-7 text-[clamp(3.7rem,8vw,7.8rem)] font-semibold leading-[.88] tracking-[-.08em]">Think with AI.<span className="block text-white/35">Build with it.</span></h1>
            <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-white/50 sm:text-[17px]">ZenixMind is an AI workspace for asking, reasoning, creating and getting things done — with the conversation at the centre.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/assistant" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/85">Start chatting <Arrow /></Link>
              <Link href="#product" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[.10] bg-white/[.02] px-6 text-sm font-medium text-white/70 transition hover:bg-white/[.05] hover:text-white">See the workspace</Link>
            </div>
          </div>
          <div id="product" className="mt-16 sm:mt-20"><ProductPreview /></div>
        </div>
      </section>

      <section className="border-b border-white/[.07]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 divide-x divide-white/[.07] sm:grid-cols-4">
          {["Conversation first", "One workspace", "Built to expand", "Simple by design"].map((x) => <div key={x} className="px-5 py-5 text-center text-[10px] font-medium uppercase tracking-[.16em] text-white/30 sm:px-8">{x}</div>)}
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/30">The workspace</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-.06em] sm:text-6xl">Less switching.<br />More doing.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/45">A focused AI workspace where the conversation stays close to the work instead of sending you through a maze of separate tools.</p>
          </div>
          <div className="border-y border-white/[.09]">
            {capabilities.map(([index, title, text]) => <div key={index} className="grid gap-5 border-b border-white/[.09] py-9 last:border-0 sm:grid-cols-[70px_1fr]"><span className="text-[11px] text-white/20">{index}</span><div><h3 className="text-xl font-semibold tracking-[-.025em]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/45">{text}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[.07] bg-black">
        <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-end">
            <div><p className="text-[10px] uppercase tracking-[.2em] text-white/30">The direction</p><h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.06em] sm:text-6xl">One workspace.<br />More ways to create.</h2></div>
            <p className="max-w-lg text-sm leading-7 text-white/45">The foundation is the conversation. As ZenixMind grows, files, voice, image generation and connected AI services can become part of the same workflow.</p>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[.10] bg-white/[.10] sm:grid-cols-3">
            {["Conversation", "Creation", "Connected tools"].map((item, i) => <div key={item} className="bg-black p-7"><span className="text-[10px] text-white/20">0{i + 1}</span><h3 className="mt-14 text-base font-medium">{item}</h3><p className="mt-2 text-xs leading-5 text-white/35">{i === 0 ? "The core experience, available now." : "Designed to become part of the workspace."}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="rounded-[28px] border border-white/[.10] bg-[#09090b] px-6 py-16 text-center sm:px-12">
          <BrandMark size={42} className="mx-auto" />
          <h2 className="mx-auto mt-7 max-w-2xl text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Start with a conversation.</h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-white/40">Open ZenixMind and put the workspace to work.</p>
          <Link href="/assistant" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/85">Open ZenixMind <Arrow /></Link>
        </div>
      </section>

      <footer className="border-t border-white/[.07]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-5 py-9 text-[11px] text-white/25 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5"><BrandMark size={20} /><span>© 2026 ZenixMind</span></div>
          <div className="flex gap-6"><Link href="/pricing" className="hover:text-white">Pricing</Link><Link href="/login" className="hover:text-white">Log in</Link></div>
        </div>
      </footer>
    </main>
  );
}
