import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseServer } from "@/lib/supabase-server";

function Arrow() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: conversations } = user
    ? await supabase.from("conversations").select("id,title,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(8)
    : { data: [] };

  const firstName = user?.user_metadata?.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[#060607] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-white/[.06] bg-[#09090b] p-3 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-2.5 px-2.5 py-2.5"><BrandMark size={31}/><span className="text-sm font-semibold">ZenixMind</span></Link>
          <Link href="/assistant" className="mt-5 flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200">+ New chat</Link>
          <div className="mt-7">
            <p className="px-2.5 text-[10px] font-medium uppercase tracking-[.18em] text-zinc-700">Recent chats</p>
            <div className="mt-2 space-y-0.5">
              {(conversations || []).map((chat) => (
                <Link key={chat.id} href={`/assistant?conversation=${chat.id}`} className="block truncate rounded-lg px-2.5 py-2.5 text-[12px] text-zinc-500 transition hover:bg-white/[.05] hover:text-zinc-200">{chat.title}</Link>
              ))}
              {!conversations?.length && <p className="px-2.5 py-3 text-xs text-zinc-700">Your chats will appear here.</p>}
            </div>
          </div>
          <div className="mt-auto space-y-1 border-t border-white/[.06] pt-3">
            <Link href="/assistant" className="block rounded-lg px-2.5 py-2.5 text-xs text-zinc-600 hover:bg-white/[.05] hover:text-white">Assistant</Link>
            <Link href="/owner" className="block rounded-lg px-2.5 py-2.5 text-xs text-zinc-600 hover:bg-white/[.05] hover:text-white">Owner console</Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[68px] items-center justify-between border-b border-white/[.06] px-5 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden"><BrandMark size={29}/><span className="text-sm font-semibold">ZenixMind</span></div>
            <div className="hidden text-xs text-zinc-600 lg:block">Workspace</div>
            <div className="flex items-center gap-2">
              <Link href="/assistant" className="rounded-lg border border-white/[.08] px-3 py-2 text-xs text-zinc-400 hover:bg-white/[.04] hover:text-white">Open assistant</Link>
              <div className="grid h-8 w-8 place-items-center rounded-full border border-white/[.08] bg-white/[.04] text-[11px] text-zinc-300">{firstName[0]?.toUpperCase()}</div>
            </div>
          </header>

          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs text-zinc-600">Your ZenixMind workspace</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Good to see you, {firstName}.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Pick up a conversation or start something new. Everything you do in the workspace starts here.</p>
              </div>
              <Link href="/assistant" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-200">New chat <Arrow /></Link>
            </div>

            <div className="mt-12 grid gap-3 md:grid-cols-3">
              <Link href="/assistant" className="group rounded-2xl border border-white/[.07] bg-white/[.025] p-5 transition hover:border-white/[.12] hover:bg-white/[.04]">
                <p className="text-xs text-zinc-500">Start</p>
                <h2 className="mt-3 text-sm font-medium">Ask ZenixMind anything</h2>
                <p className="mt-2 text-xs leading-5 text-zinc-700">Questions, ideas, writing, planning and more.</p>
                <span className="mt-5 block text-zinc-600 transition group-hover:translate-x-1"><Arrow /></span>
              </Link>
              <Link href="/assistant" className="group rounded-2xl border border-white/[.07] bg-white/[.025] p-5 transition hover:border-white/[.12] hover:bg-white/[.04]">
                <p className="text-xs text-zinc-500">Continue</p>
                <h2 className="mt-3 text-sm font-medium">Return to your chats</h2>
                <p className="mt-2 text-xs leading-5 text-zinc-700">Your recent conversations stay close at hand.</p>
                <span className="mt-5 block text-zinc-600 transition group-hover:translate-x-1"><Arrow /></span>
              </Link>
              <Link href="/pricing" className="group rounded-2xl border border-white/[.07] bg-white/[.025] p-5 transition hover:border-white/[.12] hover:bg-white/[.04]">
                <p className="text-xs text-zinc-500">ZenixMind</p>
                <h2 className="mt-3 text-sm font-medium">Explore plans</h2>
                <p className="mt-2 text-xs leading-5 text-zinc-700">See what is included as the product grows.</p>
                <span className="mt-5 block text-zinc-600 transition group-hover:translate-x-1"><Arrow /></span>
              </Link>
            </div>

            <section className="mt-12">
              <div className="flex items-end justify-between">
                <div><p className="text-[10px] font-medium uppercase tracking-[.18em] text-zinc-700">Recent activity</p><h2 className="mt-2 text-xl font-semibold tracking-[-.025em]">Your conversations</h2></div>
                <Link href="/assistant" className="text-xs text-zinc-600 hover:text-white">Open assistant</Link>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.018]">
                {(conversations || []).map((chat) => (
                  <Link key={chat.id} href={`/assistant?conversation=${chat.id}`} className="flex items-center justify-between gap-4 border-b border-white/[.05] px-5 py-4 last:border-0 hover:bg-white/[.03]">
                    <span className="truncate text-sm text-zinc-300">{chat.title}</span>
                    <span className="shrink-0 text-[10px] text-zinc-700">{new Date(chat.updated_at).toLocaleDateString()}</span>
                  </Link>
                ))}
                {!conversations?.length && <div className="px-5 py-10 text-center"><p className="text-sm text-zinc-500">No conversations yet.</p><p className="mt-1 text-xs text-zinc-700">Start a chat and it will appear here.</p></div>}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
