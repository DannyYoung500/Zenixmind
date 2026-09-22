import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const capabilities = [
  ["01", "Think", "Ask questions, work through ideas, reason with context and keep the conversation moving."],
  ["02", "Create", "Write, plan, code and turn rough ideas into work you can actually use."],
  ["03", "Connect", "Bring more AI services and tools into the same workspace as ZenixMind grows."],
];

function Icon({ type }: { type: "plus" | "arrow" | "spark" }) {
  if (type === "plus") return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 5v14M5 12h14" /></svg>;
  if (type === "spark") return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" /></svg>;
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-black/[.12] bg-white shadow-[0_30px_100px_rgba(0,0,0,.12)]">
      <div className="flex h-12 items-center justify-between border-b border-black/[.08] px-4">
        <div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-black" /><i className="h-2.5 w-2.5 rounded-full bg-black/30" /><i className="h-2.5 w-2.5 rounded-full bg-black/10" /></div>
        <div className="flex items-center gap-2 text-[11px] font-medium"><BrandMark size={15} /> ZenixMind</div>
        <span className="w-8" />
      </div>

      <div className="grid min-h-[520px] md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-black/[.08] p-3 md:block">
          <div className="flex items-center gap-2 px-2 py-2.5"><BrandMark size={23} /><span className="text-xs font-semibold">ZenixMind</span></div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-black px-3 py-2.5 text-xs font-medium text-white"><Icon type="plus" /> New chat</div>
          <p className="mt-7 px-2 text-[9px] font-semibold uppercase tracking-[.18em] text-black/35">Recent</p>
          <div className="mt-2 space-y-1 text-[11px]">
            <div className="rounded-lg bg-black/[.05] px-3 py-2.5">Launch plan</div>
            <div className="px-3 py-2.5 text-black/45">Research notes</div>
            <div className="px-3 py-2.5 text-black/45">Website structure</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex h-12 items-center justify-between border-b border-black/[.08] px-5">
            <span className="text-[11px] text-black/45">New conversation</span>
            <span className="rounded-lg border border-black/[.1] px-2.5 py-1.5 text-[10px] text-black/50">ZenixMind · Default</span>
          </div>
          <div className="flex-1 px-5 py-9 sm:px-10">
            <div className="mx-auto max-w-2xl">
              <div className="flex justify-end"><div className="max-w-[76%] rounded-2xl rounded-br-md bg-black px-4 py-3 text-xs leading-5 text-white">Help me turn this idea into a real launch plan.</div></div>
              <div className="mt-8 flex gap-3">
                <BrandMark size={25} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs leading-6">Start with the product people can use today. Then make the next steps clear without promising what is not built yet.</p>
                  <div className="mt-4 border-l-2 border-black pl-4 text-[11px] leading-6 text-black/55">
                    <p className="font-semibold text-black">Launch structure</p>
                    <p>01 — Show the working workspace.</p>
                    <p>02 — Demonstrate the conversation.</p>
                    <p>03 — Let the product lead the story.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 sm:px-6">
            <div className="mx-auto flex h-14 max-w-2xl items-center justify-between rounded-2xl border border-black/[.12] px-4">
              <span className="text-[11px] text-black/35">Message ZenixMind…</span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black text-white"><Icon type="arrow" /></span>
            </div>
            <p className="mt-2 text-center text-[9px] text-black/25">ZenixMind can make mistakes. Check important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b border-black/[.08] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5"><BrandMark size={30} /><span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span></Link>
          <nav className="hidden items-center gap-8 text-[13px] text-black/55 md:flex">
            <Link href="#product" className="hover:text-black">Product</Link>
            <Link href="#capabilities" className="hover:text-black">Capabilities</Link>
            <Link href="/pricing" className="hover:text-black">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-3 py-2 text-[13px] text-black/60 hover:text-black sm:block">Log in</Link>
            <Link href="/assistant" className="rounded-lg bg-black px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-black/85">Start chatting</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-black/[.08]">
        <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-32">
          <div className="mx-auto max-w-[880px] text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/[.12] px-3.5 py-2 text-[11px] font-medium text-black/55"><BrandMark size={16} /> AI, in one place.</div>
            <h1 className="mt-7 text-[clamp(3.5rem,8vw,7.4rem)] font-semibold leading-[.9] tracking-[-.075em]">Think with AI.<span className="block text-black/35">Build with it.</span></h1>
            <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-black/60 sm:text-[17px]">ZenixMind is an AI workspace for asking, reasoning, creating and getting things done — with your conversation at the centre.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/assistant" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white hover:bg-black/85">Start chatting <Icon type="arrow" /></Link>
              <Link href="#product" className="inline-flex h-12 items-center justify-center rounded-xl border border-black/[.13] px-6 text-sm font-medium hover:bg-black/[.04]">See the workspace</Link>
            </div>
          </div>
          <div id="product" className="mt-16 sm:mt-20"><ProductPreview /></div>
        </div>
      </section>

      <section className="border-b border-black/[.08]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-x divide-black/[.08] sm:grid-cols-4">
          {["Conversation first", "One workspace", "Built to expand", "Simple by design"].map((x) => <div key={x} className="px-5 py-5 text-center text-[10px] font-medium uppercase tracking-[.16em] text-black/40 sm:px-8">{x}</div>)}
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-black/40">The workspace</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1] tracking-[-.055em] sm:text-6xl">Less switching.<br />More doing.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-black/55">A focused AI workspace where the conversation stays close to the work instead of sending you through a maze of separate tools.</p>
          </div>
          <div className="border-y border-black/[.1]">
            {capabilities.map(([index, title, text]) => <div key={index} className="grid gap-5 border-b border-black/[.1] py-9 last:border-0 sm:grid-cols-[70px_1fr]"><span className="text-[11px] text-black/30">{index}</span><div><h3 className="text-xl font-semibold tracking-[-.025em]">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-black/55">{text}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[.08] bg-black text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-end">
            <div><p className="text-[10px] uppercase tracking-[.2em] text-white/40">What comes next</p><h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1] tracking-[-.05em] sm:text-6xl">One workspace.<br />More ways to create.</h2></div>
            <p className="max-w-lg text-sm leading-7 text-white/55">The foundation is the conversation. As ZenixMind grows, files, voice, image generation and connected AI services can become part of the same workflow.</p>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 sm:grid-cols-3">
            {["Conversation", "Creation", "Connected tools"].map((item, i) => <div key={item} className="bg-black p-6"><span className="text-[10px] text-white/35">0{i + 1}</span><h3 className="mt-12 text-base font-medium">{item}</h3><p className="mt-2 text-xs leading-5 text-white/40">{i === 0 ? "The core experience, available now." : "Designed to expand the workspace."}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="rounded-[28px] border border-black/[.12] px-6 py-16 text-center sm:px-12">
          <BrandMark size={42} className="mx-auto" />
          <h2 className="mx-auto mt-7 max-w-2xl text-4xl font-semibold tracking-[-.055em] sm:text-5xl">Start with a conversation.</h2>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-6 text-black/55">Open ZenixMind and put the workspace to work.</p>
          <Link href="/assistant" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white hover:bg-black/85">Open ZenixMind <Icon type="arrow" /></Link>
        </div>
      </section>

      <footer className="border-t border-black/[.08]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-9 text-[11px] text-black/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5"><BrandMark size={20} /><span>© 2026 ZenixMind</span></div>
          <div className="flex gap-6"><Link href="/pricing" className="hover:text-black">Pricing</Link><Link href="/login" className="hover:text-black">Log in</Link></div>
        </div>
      </footer>
    </main>
  );
}
