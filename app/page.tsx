import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getSupabaseServer } from "@/lib/supabase-server";

function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "plus") return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "mic") return <svg {...p}><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  if (name === "arrow") return <svg {...p}><path d="m5 12 6-6M5 12l6 6M5 12h14"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
}

function PublicHome() {
  return <main className="min-h-screen bg-[#050506] text-zinc-100">
    <div className="zenix-ambient pointer-events-none fixed inset-0" />
    <header className="relative z-10 flex h-[72px] items-center justify-between border-b border-white/[.06] px-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3"><BrandMark size={34}/><span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span></Link>
      <nav className="hidden items-center gap-7 text-[13px] text-zinc-500 md:flex"><Link href="/assistant">Assistant</Link><Link href="/pricing">Plans</Link><Link href="/assistant?view=images">Images</Link><Link href="/assistant?view=library">Library</Link></nav>
      <div className="flex items-center gap-2"><Link href="/login" className="rounded-xl px-3.5 py-2 text-xs text-zinc-400 hover:bg-white/[.04] hover:text-white">Sign in</Link><Link href="/signup" className="rounded-xl border border-white/[.1] bg-[#f2f2f2] px-4 py-2.5 text-xs font-semibold text-black hover:bg-white">Get started</Link></div>
    </header>
    <section className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      <div className="mb-8 grid h-20 w-20 place-items-center rounded-[26px] border border-white/[.1] bg-[#0c0c0e] shadow-[0_0_80px_rgba(255,255,255,.06)]"><BrandMark size={48}/></div>
      <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-zinc-600">Your intelligent workspace</p>
      <h1 className="mt-5 max-w-4xl text-[clamp(2.35rem,5.5vw,4.6rem)] font-semibold leading-[.95] tracking-[-.065em]">Think with ZenixMind.</h1>
      <p className="mt-6 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">A focused AI assistant for conversation, research, writing, creation, voice and your personal library.</p>
      <div className="mt-8 w-full max-w-2xl"><Link href="/assistant" className="group block rounded-[28px] border border-white/[.1] bg-[#0b0b0d] p-4 text-left shadow-[0_30px_100px_rgba(0,0,0,.35)] hover:border-white/[.18]"><div className="min-h-[62px] px-3 py-2 text-sm text-zinc-600">Ask ZenixMind anything…</div><div className="flex items-center justify-between"><div className="flex items-center gap-1"><span className="grid h-10 w-10 place-items-center rounded-xl text-zinc-500"><Icon name="plus"/></span><span className="grid h-10 w-10 place-items-center rounded-xl text-zinc-500"><Icon name="mic"/></span></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#171719] text-zinc-400 group-hover:text-white"><Icon name="arrow"/></span></div></Link><p className="mt-3 text-[10px] text-zinc-700">Start a real conversation. Your chats are saved to your account.</p></div>
      <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">{[["Chat","Ask, reason and work through ideas."],["Voice","Talk naturally with ZenixMind."],["Images","Create visual work when image generation is connected."],["Library","Keep your uploaded and generated files together."]].map(([title,body])=><Link key={title} href={title==="Chat"?"/assistant":title==="Voice"?"/assistant/voice":title==="Images"?"/assistant?view=images":"/assistant?view=library"} className="rounded-2xl border border-white/[.06] bg-[#09090b] p-4 text-left hover:border-white/[.12]"><p className="text-xs font-medium text-zinc-200">{title}</p><p className="mt-2 text-[10px] leading-5 text-zinc-600">{body}</p></Link>)}</div>
    </section>
  </main>;
}

function AuthenticatedHome() {
  return <WorkspaceShell active="home" title="ZenixMind">
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-5 text-center">
      <BrandMark size={54}/><h1 className="mt-7 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Think with ZenixMind.</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600">Your workspace is ready. Continue with a conversation, explore Images, or open your Library from the sidebar.</p>
      <Link href="/assistant" className="mt-8 rounded-xl bg-[#ededed] px-5 py-3 text-xs font-semibold text-black hover:bg-white">Start a conversation</Link>
    </div>
  </WorkspaceShell>;
}

export default async function Home() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? <AuthenticatedHome/> : <PublicHome/>;
}
