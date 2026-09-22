import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const recent = ["Website redesign", "Build a mobile app", "Research Nigeria", "Create a launch plan", "Explain quantum computing"];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "menu") return <svg {...p}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
  if (name === "plus") return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "search") return <svg {...p}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>;
  if (name === "send") return <svg {...p}><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg>;
  if (name === "file") return <svg {...p}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>;
  if (name === "mic") return <svg {...p}><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] text-[#e8eaed]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[272px] shrink-0 flex-col bg-[#171717] px-3 py-3 lg:flex">
          <div className="flex items-center justify-between px-2">
            <button className="grid h-10 w-10 place-items-center rounded-full text-[#c4c7c5] hover:bg-white/10"><Icon name="menu"/></button>
            <BrandMark size={29}/>
          </div>
          <Link href="/assistant" className="mt-5 flex h-12 items-center gap-3 rounded-full bg-[#202124] px-5 text-sm font-medium text-[#e8eaed] hover:bg-[#292a2d]"><Icon name="plus" size={19}/> New chat</Link>
          <div className="mt-7 px-3 text-xs font-medium text-[#9aa0a6]">Recent</div>
          <div className="mt-2 space-y-0.5">{recent.map((item, i) => <Link key={item} href="/assistant" className={`flex items-center rounded-full px-4 py-2.5 text-[13px] text-[#c4c7c5] hover:bg-white/10 ${i === 0 ? "bg-white/[.07]" : ""}`}>{item}</Link>)}</div>
          <div className="mt-auto space-y-1">
            <Link href="/dashboard" className="block rounded-full px-4 py-3 text-sm text-[#c4c7c5] hover:bg-white/10">Your chats</Link>
            <Link href="/pricing" className="block rounded-full px-4 py-3 text-sm text-[#c4c7c5] hover:bg-white/10">Upgrade</Link>
            <Link href="/login" className="block rounded-full px-4 py-3 text-sm text-[#c4c7c5] hover:bg-white/10">Account</Link>
          </div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col bg-[#0b0b0b]">
          <header className="flex h-16 items-center justify-between px-4 sm:px-7">
            <div className="flex items-center gap-3 lg:hidden"><button className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10"><Icon name="menu"/></button><BrandMark size={28}/></div>
            <div className="hidden items-center gap-2 lg:flex"><span className="text-[17px] font-medium">ZenixMind</span><span className="rounded-md bg-white/[.07] px-2 py-1 text-[11px] text-[#9aa0a6]">AI</span></div>
            <div className="flex items-center gap-1"><button className="grid h-10 w-10 place-items-center rounded-full text-[#9aa0a6] hover:bg-white/10"><Icon name="search"/></button><Link href="/login" className="grid h-10 min-w-10 place-items-center rounded-full bg-[#a8c7fa] px-4 text-sm font-medium text-[#111]">Sign in</Link></div>
          </header>
          <div className="flex flex-1 flex-col items-center px-4">
            <div className="flex w-full max-w-[850px] flex-1 flex-col justify-center pb-24 pt-8">
              <div className="mb-12 flex flex-col items-center text-center"><BrandMark size={52}/><h1 className="mt-7 text-[clamp(2.6rem,5vw,4.2rem)] font-normal tracking-[-.045em] text-[#e8eaed]">Hello, how can I help?</h1></div>
              <div className="mx-auto w-full max-w-[760px]">
                <div className="rounded-[28px] border border-[#3c4043] bg-[#202124] p-3 shadow-[0_2px_12px_rgba(0,0,0,.25)]">
                  <textarea placeholder="Ask ZenixMind" rows={2} className="w-full resize-none bg-transparent px-3 py-2 text-[16px] text-[#e8eaed] outline-none placeholder:text-[#9aa0a6]"/>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1"><button className="grid h-10 w-10 place-items-center rounded-full text-[#bdc1c6] hover:bg-white/10"><Icon name="plus"/></button><button className="grid h-10 w-10 place-items-center rounded-full text-[#bdc1c6] hover:bg-white/10"><Icon name="file"/></button><button className="grid h-10 w-10 place-items-center rounded-full text-[#bdc1c6] hover:bg-white/10"><Icon name="mic"/></button></div>
                    <Link href="/assistant" className="grid h-10 w-10 place-items-center rounded-full bg-[#a8c7fa] text-[#111] hover:bg-[#b8d2ff]"><Icon name="send" size={18}/></Link>
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] text-[#777b80]">ZenixMind may make mistakes. Check important information.</p>
              </div>
              <div className="mt-9 grid grid-cols-2 gap-2 sm:grid-cols-4">{["Write", "Learn", "Create", "Plan"].map(x => <Link key={x} href="/assistant" className="rounded-2xl border border-[#303134] bg-[#171717] px-4 py-4 text-center text-sm text-[#c4c7c5] hover:bg-[#202124]">{x}</Link>)}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
