import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const features = ["AI conversations", "Conversation history", "Voice experience", "Images workspace", "Personal library"];

export default function PricingPage() {
  return <main className="min-h-screen bg-[#050506] text-zinc-100">
    <header className="flex h-[72px] items-center justify-between border-b border-white/[.06] px-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3"><BrandMark size={34}/><span className="text-[15px] font-semibold">ZenixMind</span></Link>
      <Link href="/assistant" className="rounded-xl border border-white/[.08] px-4 py-2.5 text-xs text-zinc-400 hover:bg-white/[.04] hover:text-white">Open assistant</Link>
    </header>
    <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[.25em] text-zinc-600">Plans</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Built to grow with ZenixMind.</h1><p className="mt-5 text-sm leading-7 text-zinc-500 sm:text-base">The assistant is being built as one connected experience. Paid plans will be introduced when billing and usage limits are ready.</p></div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-[26px] border border-white/[.1] bg-[#0b0b0d] p-7 shadow-[0_25px_80px_rgba(0,0,0,.25)]">
          <div className="flex items-center justify-between"><h2 className="text-xl font-medium">Free</h2><span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[10px] text-zinc-500">Current</span></div>
          <p className="mt-3 text-sm text-zinc-600">Access the ZenixMind experience while the platform is in active development.</p>
          <div className="mt-7 space-y-3">{features.map(f=><div key={f} className="flex items-center gap-3 text-xs text-zinc-400"><span className="h-1.5 w-1.5 rounded-full bg-zinc-600"/>{f}</div>)}</div>
          <Link href="/signup" className="mt-8 block rounded-xl bg-[#ededed] py-3 text-center text-xs font-semibold text-black hover:bg-white">Create account</Link>
        </div>
        <div className="rounded-[26px] border border-dashed border-white/[.08] bg-[#08080a] p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-700">Coming later</p><h2 className="mt-3 text-xl font-medium text-zinc-300">ZenixMind Pro</h2><p className="mt-3 text-sm leading-6 text-zinc-600">Higher limits and additional capabilities will be announced when the billing system is live.</p>
          <div className="mt-8 rounded-2xl border border-white/[.05] bg-black/20 p-4 text-xs text-zinc-700">No payment is requested on this page.</div>
        </div>
      </div>
    </section>
  </main>;
}