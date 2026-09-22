import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseServer } from "@/lib/supabase-server";

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "chat") return <svg {...common}><path d="M5 5h14v10H8l-3 3V5Z" /></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: conversations } = user
    ? await supabase.from("conversations").select("id,title,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20)
    : { data: [] };

  const firstName = user?.user_metadata?.name?.split(" ")[0] || "there";
  const initials = (user?.user_metadata?.name || user?.email || "Z")[0].toUpperCase();

  return (
    <main className="min-h-screen bg-[#050506] text-zinc-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[272px] shrink-0 flex-col border-r border-white/[.06] bg-[#080809] px-3 py-3 lg:flex">
          <div className="flex items-center gap-2 px-2 py-2.5">
            <BrandMark size={29} />
            <span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span>
          </div>

          <Link href="/assistant" className="mt-3 flex h-11 items-center gap-3 rounded-xl bg-[#111113] px-3.5 text-sm font-medium text-zinc-100 ring-1 ring-white/[.06] transition hover:bg-[#171719]">
            <Icon name="plus" /> New chat
          </Link>

          <button className="mt-2 flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-sm text-zinc-500 transition hover:bg-[#101012] hover:text-zinc-200">
            <Icon name="search" /> Search chats <span className="ml-auto text-[10px] text-zinc-700">⌘ K</span>
          </button>

          <nav className="mt-5 space-y-0.5">
            <Link href="/assistant" className="flex items-center gap-3 rounded-xl bg-[#111113] px-3.5 py-2.5 text-sm text-zinc-200"><Icon name="chat" /> Chat</Link>
            <Link href="/pricing" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-zinc-500 hover:bg-[#101012] hover:text-zinc-200"><Icon name="spark" /> Plans</Link>
          </nav>

          <div className="mt-7 min-h-0 flex-1 overflow-hidden">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-700">Recent</div>
            <div className="mt-2 space-y-0.5 overflow-y-auto">
              {(conversations || []).map((chat) => (
                <Link key={chat.id} href={`/assistant?conversation=${chat.id}`} className="block truncate rounded-lg px-3 py-2.5 text-[12px] text-zinc-500 hover:bg-[#101012] hover:text-zinc-200">{chat.title}</Link>
              ))}
              {!conversations?.length && <p className="px-3 py-3 text-xs text-zinc-700">Your conversations will appear here.</p>}
            </div>
          </div>

          <div className="border-t border-white/[.06] pt-3">
            <Link href="/owner" className="mb-1 block rounded-lg px-3 py-2 text-xs text-zinc-600 hover:bg-[#101012] hover:text-zinc-200">Owner console</Link>
            <div className="flex items-center gap-3 rounded-xl px-2.5 py-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#171719] text-xs font-medium text-zinc-300">{initials}</div>
              <div className="min-w-0"><p className="truncate text-xs text-zinc-300">{user?.user_metadata?.name || "ZenixMind user"}</p><p className="truncate text-[10px] text-zinc-700">{user?.email}</p></div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/[.06] px-4 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden"><BrandMark size={28} /><span className="text-sm font-semibold">ZenixMind</span></div>
            <div className="hidden items-center gap-2 lg:flex">
              <span className="text-sm font-medium">Chat</span>
              <span className="text-zinc-700">/</span>
              <span className="text-xs text-zinc-600">Workspace</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/assistant" className="rounded-lg border border-white/[.08] bg-[#0b0b0d] px-3 py-2 text-xs text-zinc-400 hover:bg-[#111113] hover:text-zinc-100">Open chat</Link>
              <div className="grid h-8 w-8 place-items-center rounded-full border border-white/[.08] bg-[#111113] text-[11px] text-zinc-300">{initials}</div>
            </div>
          </header>

          <div className="flex flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 pb-20 pt-12 sm:px-8">
              <div className="mb-9 text-center">
                <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-white/[.08] bg-[#0b0b0d]"><BrandMark size={27} /></div>
                <h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">How can I help, {firstName}?</h1>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600">Ask a question, explore an idea, write something, or build with ZenixMind.</p>
              </div>

              <Link href="/assistant" className="group rounded-[24px] border border-white/[.09] bg-[#0b0b0d] p-4 shadow-[0_20px_70px_rgba(0,0,0,.25)] transition hover:border-white/[.15] hover:bg-[#0e0e10]">
                <div className="min-h-[92px] px-2 pt-1 text-sm text-zinc-700">Message ZenixMind...</div>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#151517] text-zinc-500"><Icon name="plus" /></span>
                    <span className="hidden rounded-xl bg-[#151517] px-3 text-[11px] text-zinc-500 sm:flex sm:items-center">Attach</span>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#171719] text-zinc-500 transition group-hover:text-zinc-200">↑</span>
                </div>
              </Link>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {["Write something", "Analyze a file", "Brainstorm ideas", "Learn something"].map((item) => (
                  <Link key={item} href="/assistant" className="rounded-xl border border-white/[.06] bg-[#09090b] px-3 py-3 text-left text-[11px] text-zinc-500 hover:border-white/[.1] hover:bg-[#0d0d0f] hover:text-zinc-200">{item}</Link>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-4xl px-5 pb-5 text-center sm:px-8">
              <p className="text-[10px] text-zinc-700">ZenixMind can make mistakes. Check important information.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
