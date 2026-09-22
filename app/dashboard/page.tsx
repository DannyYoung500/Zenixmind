import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseServer } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: conversations } = user
    ? await supabase.from("conversations").select("id,title,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(8)
    : { data: [] };

  const firstName = user?.user_metadata?.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[270px] shrink-0 border-r border-white/5 bg-[#08080b] p-4 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 px-2 py-2"><BrandMark size={34}/><span className="font-semibold tracking-tight">ZenixMind</span></Link>
          <Link href="/assistant" className="mt-7 flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200">+ New chat</Link>
          <div className="mt-8"><p className="px-2 text-[11px] uppercase tracking-[.14em] text-zinc-600">Recent</p><div className="mt-3 space-y-1">
            {(conversations || []).map((chat) => <Link key={chat.id} href={`/assistant?conversation=${chat.id}`} className="block truncate rounded-xl px-3 py-3 text-sm text-zinc-400 hover:bg-white/[.05] hover:text-white">{chat.title}</Link>)}
            {!conversations?.length && <p className="px-3 py-3 text-sm text-zinc-700">No conversations yet.</p>}
          </div></div>
          <div className="mt-auto border-t border-white/5 pt-4"><Link href="/owner" className="block rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-white/[.05] hover:text-white">Owner console</Link></div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[68px] items-center justify-between border-b border-white/5 px-5 sm:px-8"><div className="flex items-center gap-3 lg:hidden"><BrandMark size={32}/><span className="font-semibold">ZenixMind</span></div><div className="hidden text-sm text-zinc-500 lg:block">Dashboard</div><div className="flex items-center gap-2"><Link href="/assistant" className="rounded-lg border border-white/8 px-3 py-2 text-xs text-zinc-400 hover:bg-white/[.04] hover:text-white">Open assistant</Link><div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs text-zinc-300">{firstName[0]?.toUpperCase()}</div></div></header>
          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
            <div className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[.055] to-white/[.018] p-7 sm:p-10"><p className="text-sm text-zinc-500">Good to see you, {firstName}.</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">What are you working on?</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Your ZenixMind workspace is connected to your account.</p><Link href="/assistant" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200">Start a new chat</Link></div>
            <div className="mt-10"><p className="text-xs uppercase tracking-[.14em] text-zinc-600">Recent conversations</p><h2 className="mt-2 text-xl font-semibold">Pick up where you left off</h2><div className="mt-4 divide-y divide-white/5 rounded-2xl border border-white/8 bg-white/[.018]">
              {(conversations || []).map((chat) => <Link key={chat.id} href={`/assistant?conversation=${chat.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[.03]"><span className="truncate text-sm text-zinc-300">{chat.title}</span><span className="text-xs text-zinc-600">{new Date(chat.updated_at).toLocaleDateString()}</span></Link>)}
              {!conversations?.length && <div className="px-5 py-8 text-sm text-zinc-600">Start your first conversation.</div>}
            </div></div>
          </div>
        </section>
      </div>
    </main>
  );
}
