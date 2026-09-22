import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const nav = [
  { label: "Product", href: "#product" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Pricing", href: "/pricing" },
];

const capabilities = [
  {
    index: "01",
    title: "Think with context",
    text: "Keep the conversation, instructions and working context together instead of rebuilding the prompt every time.",
  },
  {
    index: "02",
    title: "Create from the same workspace",
    text: "Move from an idea to writing, code, plans and other creative work without leaving the conversation.",
  },
  {
    index: "03",
    title: "Connect more as you grow",
    text: "ZenixMind is being built to sit above the AI services and tools you choose, so the workspace can grow with you.",
  },
];

function MiniIcon({ type }: { type: "spark" | "file" | "image" | "arrow" }) {
  const common = {
    width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  if (type === "file") return <svg {...common}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>;
  if (type === "image") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m20 15-4-4-6 6" /></svg>;
  if (type === "arrow") return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
  return <svg {...common}><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></svg>;
}

function ProductPreview() {
  return (
    <div className="zenix-window">
      <div className="zenix-windowbar">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <BrandMark size={15} />
          ZenixMind
        </div>
        <span className="w-8" />
      </div>

      <div className="grid min-h-[560px] md:grid-cols-[224px_1fr]">
        <aside className="hidden border-r border-white/[0.06] bg-[#0b0b0d] p-3 md:block">
          <div className="flex items-center gap-2 px-2 py-2.5">
            <BrandMark size={23} />
            <span className="text-xs font-semibold">ZenixMind</span>
          </div>
          <div className="mt-5 rounded-xl bg-white px-3 py-2.5 text-xs font-medium text-black">+ New chat</div>
          <div className="mt-7">
            <p className="px-2 text-[10px] font-medium uppercase tracking-[.16em] text-zinc-700">Recent</p>
            <div className="mt-2 space-y-0.5">
              <div className="rounded-lg bg-white/[.055] px-3 py-2.5 text-[11px] text-zinc-300">Launch plan for ZenixMind</div>
              <div className="px-3 py-2.5 text-[11px] text-zinc-600">Research notes</div>
              <div className="px-3 py-2.5 text-[11px] text-zinc-600">Website structure</div>
            </div>
          </div>
          <div className="mt-7 border-t border-white/[.05] pt-5">
            <p className="px-2 text-[10px] uppercase tracking-[.16em] text-zinc-700">Workspace</p>
            <div className="mt-2 space-y-0.5 text-[11px] text-zinc-600">
              <div className="px-3 py-2">Files</div>
              <div className="px-3 py-2">Connected tools</div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col bg-[#0e0e11]">
          <div className="flex h-12 items-center justify-between border-b border-white/[.05] px-4 sm:px-6">
            <span className="text-[11px] text-zinc-500">New conversation</span>
            <span className="rounded-lg border border-white/[.07] px-2.5 py-1.5 text-[10px] text-zinc-500">ZenixMind · Default</span>
          </div>

          <div className="flex flex-1 flex-col px-5 py-8 sm:px-10">
            <div className="mx-auto w-full max-w-2xl">
              <div className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-xs leading-5 text-black">
                  Help me turn ZenixMind into a real product launch plan.
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <BrandMark size={25} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs leading-6 text-zinc-300">
                    Absolutely. I&apos;d structure the launch around the product people can use today, then make the roadmap visible without making promises the product cannot keep.
                  </p>
                  <div className="mt-4 rounded-xl border border-white/[.06] bg-white/[.025] p-4">
                    <p className="text-[11px] font-medium text-zinc-300">A simple launch structure</p>
                    <div className="mt-3 space-y-2.5 text-[10px] text-zinc-500">
                      <div className="flex gap-2"><span className="text-zinc-700">01</span><span>Lead with the working AI workspace.</span></div>
                      <div className="flex gap-2"><span className="text-zinc-700">02</span><span>Show the conversation experience before the roadmap.</span></div>
                      <div className="flex gap-2"><span className="text-zinc-700">03</span><span>Let users start immediately, then expand capabilities.</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 sm:px-6">
            <div className="mx-auto max-w-2xl rounded-2xl border border-white/[.09] bg-[#111114] p-2">
              <div className="px-3 py-2 text-[11px] text-zinc-700">Message ZenixMind…</div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <span className="grid h-7 w-7 place-items-center rounded-full text-zinc-600"><MiniIcon type="file" /></span>
                  <span className="grid h-7 w-7 place-items-center rounded-full text-zinc-600"><MiniIcon type="image" /></span>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-black"><MiniIcon type="arrow" /></span>
              </div>
            </div>
            <p className="mt-2 text-center text-[9px] text-zinc-800">ZenixMind can make mistakes. Check important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#060607] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[.06] bg-[#060607]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={31} />
            <span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span>
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] text-zinc-500 md:flex">
            {nav.map((item) => <Link key={item.label} href={item.href} className="transition hover:text-white">{item.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-[13px] text-zinc-400 transition hover:text-white sm:block">Log in</Link>
            <Link href="/assistant" className="rounded-lg bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition hover:bg-zinc-200">Start chatting</Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[900px] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.07),transparent_62%)]" />
        <div className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-32">
          <div className="mx-auto max-w-[850px] text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.025] px-3.5 py-2 text-[11px] text-zinc-500">
              <BrandMark size={16} />
              An AI workspace built around conversation
            </div>
            <h1 className="mt-7 text-[clamp(3.4rem,7.5vw,6.8rem)] font-semibold leading-[.92] tracking-[-.065em]">
              Think with AI.
              <span className="block text-zinc-500">Build with it.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-[15px] leading-7 text-zinc-400 sm:text-[17px]">
              ZenixMind gives you one focused place to ask, reason, write, plan and work with AI — with the workspace designed to grow as your tools do.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/assistant" className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition hover:bg-zinc-200">Start chatting <span className="ml-2">↗</span></Link>
              <Link href="#product" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[.09] bg-white/[.02] px-6 text-sm font-medium text-zinc-300 transition hover:bg-white/[.05] hover:text-white">See the workspace</Link>
            </div>
          </div>

          <div id="product" className="mt-16 sm:mt-20">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-white/[.06]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-5 text-center text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left">
          <span>ONE WORKSPACE</span>
          <span>CONVERSATION · CREATION · RESEARCH · TOOLS</span>
          <span>BUILT TO EXPAND</span>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[.2em] text-zinc-600">The product</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.03] tracking-[-.045em] sm:text-5xl">
              Less switching.<br />More doing.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-zinc-500">
              The point is not another collection of features. It is a place where the next action is obvious and your conversation stays at the centre of the work.
            </p>
          </div>
          <div className="border-y border-white/[.07]">
            {capabilities.map((item) => (
              <div key={item.index} className="grid gap-5 border-b border-white/[.07] py-8 last:border-b-0 sm:grid-cols-[70px_1fr]">
                <span className="text-[11px] text-zinc-700">{item.index}</span>
                <div>
                  <h3 className="text-lg font-medium tracking-[-.02em]">{item.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[.06]">
        <div className="mx-auto grid max-w-[1240px] gap-4 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-7">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.05] text-zinc-300"><MiniIcon type="spark" /></span>
            <h3 className="mt-8 text-lg font-medium">A better starting point</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Open the workspace and begin with a prompt instead of a maze of settings.</p>
          </div>
          <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-7">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.05] text-zinc-300"><MiniIcon type="file" /></span>
            <h3 className="mt-8 text-lg font-medium">Work that remembers</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Conversations become a working record, with your recent chats kept close at hand.</p>
          </div>
          <div className="rounded-2xl border border-white/[.07] bg-[#0b0b0d] p-7">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.05] text-zinc-300"><MiniIcon type="image" /></span>
            <h3 className="mt-8 text-lg font-medium">Built for what comes next</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Files, voice, image and connected AI services can become part of the same workflow as they are added.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[.06]">
        <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
          <div className="overflow-hidden rounded-[28px] border border-white/[.08] bg-[#0b0b0d] px-6 py-16 text-center sm:px-12">
            <BrandMark size={45} className="mx-auto" />
            <p className="mt-7 text-[11px] uppercase tracking-[.2em] text-zinc-600">ZenixMind</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Your next conversation can start here.</h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-zinc-500">Open the workspace and see the product for yourself.</p>
            <Link href="/assistant" className="mt-8 inline-flex h-12 items-center rounded-xl bg-white px-6 text-sm font-semibold text-black hover:bg-zinc-200">Open ZenixMind ↗</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[.06]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-9 text-[11px] text-zinc-700 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5"><BrandMark size={20} /><span>© 2026 ZenixMind</span></div>
          <div className="flex gap-6"><Link href="/pricing" className="hover:text-zinc-400">Pricing</Link><Link href="/login" className="hover:text-zinc-400">Log in</Link></div>
        </div>
      </footer>
    </main>
  );
}
