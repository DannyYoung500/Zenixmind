import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const recentChats = [
  { title: "Help me plan my new project", time: "Today" },
  { title: "Explain quantum computing simply", time: "Yesterday" },
  { title: "Create a launch strategy", time: "Yesterday" },
  { title: "Review my business idea", time: "Sep 20" }
];

const tools = [
  { title: "Ask anything", body: "Get answers, explanations and ideas.", icon: "chat" },
  { title: "Write & create", body: "Draft, rewrite, brainstorm and create.", icon: "spark" },
  { title: "Research", body: "Explore a topic and make sense of it.", icon: "search" },
  { title: "Work with files", body: "Bring documents into your conversation.", icon: "file" }
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "chat") return <svg {...common}><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.7-.8L4 20l1.2-3.3A7.4 7.4 0 0 1 4 12a8 8 0 0 1 8-8 7.7 7.7 0 0 1 8 7.5Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>;
  if (name === "file") return <svg {...common}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
  if (name === "settings") return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8.1 15a1.7 1.7 0 0 0-1.5-1H6v-2.5h.6a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V6H15v.6a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V15h-.6a1.7 1.7 0 0 0-1 0Z"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[270px] shrink-0 border-r border-white/5 bg-[#08080b] p-4 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 px-2 py-2">
            <BrandMark size={34} />
            <span className="font-semibold tracking-tight">ZenixMind</span>
          </Link>

          <Link href="/assistant" className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
            <Icon name="plus" size={17} /> New chat
          </Link>

          <div className="mt-8">
            <p className="px-2 text-[11px] font-medium uppercase tracking-[.14em] text-zinc-600">Recent</p>
            <div className="mt-3 space-y-1">
              {recentChats.map((chat) => (
                <Link key={chat.title} href="/assistant" className="block rounded-xl px-3 py-3 text-sm text-zinc-400 transition hover:bg-white/[.05] hover:text-white">
                  <span className="block truncate">{chat.title}</span>
                  <span className="mt-1 block text-[11px] text-zinc-700">{chat.time}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-1 border-t border-white/5 pt-4">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-white/[.05] hover:text-white"><Icon name="settings" size={18}/> Settings</button>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-white/[.05] hover:text-white">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs text-zinc-300">D</span>
              <span className="min-w-0 flex-1 truncate text-left">Your account</span>
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[68px] items-center justify-between border-b border-white/5 px-5 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandMark size={32} />
              <span className="font-semibold">ZenixMind</span>
            </div>
            <div className="hidden text-sm text-zinc-500 lg:block">Dashboard</div>
            <div className="flex items-center gap-2">
              <Link href="/assistant" className="hidden rounded-lg border border-white/8 px-3 py-2 text-xs text-zinc-400 hover:bg-white/[.04] hover:text-white sm:block">Open assistant</Link>
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-white/8 text-zinc-500 hover:text-white lg:hidden"><Icon name="menu" size={18}/></button>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-medium text-zinc-300">D</div>
            </div>
          </header>

          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
            <div className="rounded-[28px] border border-white/8 bg-gradient-to-br from-white/[.055] to-white/[.018] p-7 sm:p-10">
              <p className="text-sm text-zinc-500">Good to see you.</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">What are you working on?</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Start a conversation with ZenixMind or choose a way to get moving.</p>
              <Link href="/assistant" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200">
                <Icon name="chat" size={17}/> Start a new chat
              </Link>
            </div>

            <div className="mt-10">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[.14em] text-zinc-600">Capabilities</p>
                  <h2 className="mt-2 text-xl font-semibold">What can ZenixMind help with?</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {tools.map((tool) => (
                  <Link key={tool.title} href="/assistant" className="group rounded-2xl border border-white/8 bg-white/[.025] p-5 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[.045]">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[.06] text-zinc-300 group-hover:text-white"><Icon name={tool.icon} size={19}/></span>
                    <h3 className="mt-5 font-medium">{tool.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-500">{tool.body}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[.14em] text-zinc-600">Recent conversations</p>
                  <h2 className="mt-2 text-xl font-semibold">Pick up where you left off</h2>
                </div>
                <Link href="/assistant" className="text-sm text-zinc-500 hover:text-white">View all</Link>
              </div>
              <div className="mt-4 divide-y divide-white/5 rounded-2xl border border-white/8 bg-white/[.018]">
                {recentChats.map((chat) => (
                  <Link key={chat.title} href="/assistant" className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[.03]">
                    <span className="truncate text-sm text-zinc-300">{chat.title}</span>
                    <span className="shrink-0 text-xs text-zinc-600">{chat.time}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
