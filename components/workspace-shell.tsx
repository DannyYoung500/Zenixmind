"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { getSupabase } from "@/lib/supabase";

type Conversation = { id: string; title: string; updated_at: string };

const OWNER_EMAILS = new Set([
  "danielngozi924@gmail.com",
  "dannyyoungofficial1@gmail.com",
  "zenixmindai@gmail.com",
  "dannyyoungofficail2@gmail.com",
]);

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "plus") return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "search") return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if (name === "chat") return <svg {...p}><path d="M5 5h14v10H8l-3 3V5Z"/></svg>;
  if (name === "image") return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>;
  if (name === "file") return <svg {...p}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/></svg>;
  if (name === "settings") return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4.3v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2H13v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z"/></svg>;
  if (name === "close") return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
}

export function WorkspaceShell({ active = "home", children, title }: { active?: "home" | "chat" | "images" | "library" | "plans" | "owner"; children: React.ReactNode; title?: string }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.user?.email || "");
      setReady(Boolean(data.user));
    });
    void fetch("/api/chat", { cache: "no-store" }).then(async (response) => {
      if (!mounted || !response.ok) return;
      const data = await response.json();
      if (mounted) setConversations(data.conversations || []);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => conversations.filter((chat) => chat.title.toLowerCase().includes(query.trim().toLowerCase())), [conversations, query]);
  if (!ready) return <>{children}</>;

  const initials = (userEmail || "Z").slice(0, 1).toUpperCase();

  return (
    <main className="min-h-screen bg-[#050506] text-zinc-100">
      <div className="flex min-h-screen">
        {open && <button aria-label="Close sidebar" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-black/75 lg:hidden" />}
        <aside className={(open ? "fixed inset-y-0 left-0 z-50 flex " : "hidden ") + "w-[270px] shrink-0 flex-col border-r border-white/[.055] bg-[#0d0d0e] px-2.5 py-3 lg:relative lg:z-auto lg:flex"}>
          <div className="flex items-center justify-between px-2 pb-4">
            <Link href="/assistant" onClick={() => setOpen(false)} className="flex items-center gap-2.5"><BrandMark size={31}/><span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span></Link>
            <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-[#171719] hover:text-zinc-200 lg:hidden"><Icon name="close" size={18}/></button>
          </div>

          {searching && <div className="mb-2 px-1"><div className="flex h-10 items-center gap-2 rounded-xl bg-[#181819] px-3 ring-1 ring-white/[.06]"><Icon name="search" size={16}/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"/></div></div>}

          <div className="flex gap-2">
            <Link href="/assistant" onClick={() => setOpen(false)} className="flex h-11 flex-1 items-center gap-3 rounded-xl bg-[#1a1a1b] px-3.5 text-sm font-medium ring-1 ring-white/[.055] hover:bg-[#222223]"><Icon name="plus"/> New chat</Link>
            <button type="button" onClick={() => setSearching((value) => !value)} className="grid h-11 w-11 place-items-center rounded-xl bg-[#151517] text-zinc-500 hover:bg-[#1d1d1f] hover:text-zinc-100" title="Search chats"><Icon name="search"/></button>
          </div>

          <nav className="mt-3 space-y-0.5">
            {[
              ["chat", "Chat", "/assistant"],
              ["image", "Images", "/assistant?view=images"],
              ["file", "Library", "/assistant?view=library"],
            ].map(([icon, label, href]) => (
              <Link key={label} href={href} onClick={() => setOpen(false)} className={(active === label.toLowerCase() ? "bg-[#1b1b1c] text-zinc-100 " : "text-zinc-500 ") + "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] hover:bg-[#171718] hover:text-zinc-200"}><Icon name={icon}/>{label}</Link>
            ))}
            <Link href="/pricing" onClick={() => setOpen(false)} className={(active === "plans" ? "bg-[#1b1b1c] text-zinc-100 " : "text-zinc-500 ") + "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm hover:bg-[#171718] hover:text-zinc-200"}>Plans</Link>
          </nav>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-3"><span className="text-[11px] font-medium text-zinc-600">Chats</span><span className="text-[10px] text-zinc-700">{filtered.length}</span></div>
            <div className="mt-2 space-y-0.5">
              {filtered.map((chat) => <Link key={chat.id} href={"/assistant?conversation=" + chat.id} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-zinc-400 hover:bg-[#171718] hover:text-zinc-100"><Icon name="chat" size={16}/><span className="min-w-0 flex-1 truncate text-[12px]">{chat.title || "New conversation"}</span></Link>)}
              {!filtered.length && <p className="px-3 py-4 text-xs leading-5 text-zinc-700">{query ? "No matching chats." : "No chats yet."}</p>}
            </div>
          </div>

          <div className="border-t border-white/[.055] pt-2">
            {OWNER_EMAILS.has(userEmail.toLowerCase()) && <Link href="/owner" onClick={() => setOpen(false)} className={(active === "owner" ? "bg-[#1b1b1c] text-zinc-100 " : "text-zinc-500 ") + "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs hover:bg-[#171718] hover:text-zinc-200"}>Owner console</Link>}
            <Link href="/assistant?settings=1" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#171718]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#29292b] text-sm font-semibold text-zinc-300">{initials}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm text-zinc-200">{userEmail || "ZenixMind"}</span><span className="block text-[10px] text-zinc-600">Profile & settings</span></span><Icon name="settings" size={16}/>
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex min-h-[58px] items-center gap-3 border-b border-white/[.05] px-4 sm:px-7">
            <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/[.06] bg-[#0d0d0f] text-zinc-400 hover:bg-[#151517] lg:hidden"><span className="text-lg">☰</span></button>
            {title && <div className="text-[13px] font-medium text-zinc-200">{title}</div>}
          </header>
          <div className="min-h-[calc(100vh-58px)]">{children}</div>
        </section>
      </div>
    </main>
  );
}
