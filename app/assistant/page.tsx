"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { getSupabase } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; updated_at: string };
type LibraryItem = {
  id: string;
  file_name: string;
  mime_type: string | null;
  storage_path: string;
  size_bytes: number | null;
  source: "uploaded" | "generated";
  prompt: string | null;
  created_at: string;
  url?: string;
};

type DictationRecognition = {
  continuous: boolean; interimResults: boolean; maxAlternatives: number; lang: string; processLocally?: boolean;
  start: () => void; stop: () => void; abort: () => void;
  onstart: (() => void) | null; onend: (() => void) | null;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};
type DictationConstructor = new () => DictationRecognition;

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "menu") return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if (name === "chat") return <svg {...common}><path d="M5 5h14v10H8l-3 3V5Z"/></svg>;
  if (name === "mic") return <svg {...common}><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  if (name === "wave") return <svg {...common}><path d="M4 12h2M8 8v8M12 5v14M16 8v8M20 12h-2"/></svg>;
  if (name === "send") return <svg {...common}><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg>;
  if (name === "image") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>;
  if (name === "file") return <svg {...common}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/></svg>;
  if (name === "download") return <svg {...common}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>;
  if (name === "trash") return <svg {...common}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>;
  if (name === "upload") return <svg {...common}><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>;
  if (name === "back") return <svg {...common}><path d="m15 18-6-6 6-6"/></svg>;
  if (name === "close") return <svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>;
  if (name === "user") return <svg {...common}><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.4 3.2-5 7-5s6.2 1.6 7 5"/></svg>;
  if (name === "data") return <svg {...common}><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>;
  if (name === "bell") return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (name === "lock") return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (name === "info") return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>;
  if (name === "settings") return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4.3v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2H13v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z"/></svg>;
  if (name === "chevron") return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

function formatTime(value: string) {
  const date = new Date(value), diff = Date.now() - date.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + "m";
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + "h";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function makeDictationRecognition() {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & { SpeechRecognition?: DictationConstructor; webkitSpeechRecognition?: DictationConstructor };
  const Constructor = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.continuous = false; recognition.interimResults = true; recognition.maxAlternatives = 1; recognition.lang = "en-US";
  return recognition;
}

const templates = [
  { title: "Sketch", prompt: "Create a clean hand-drawn sketch from this idea.", tone: "from-zinc-500/30 via-zinc-800/20 to-black" },
  { title: "'80s flashback", prompt: "Create an authentic 1980s flashback visual with retro color, lighting, fashion, and film texture.", tone: "from-fuchsia-500/20 via-orange-400/15 to-black" },
  { title: "Stickers", prompt: "Create a playful sticker sheet with expressive characters, clean outlines, and a polished sticker finish.", tone: "from-cyan-400/20 via-pink-400/15 to-black" },
  { title: "Create a caricature", prompt: "Create a polished caricature portrait with expressive features and a playful editorial finish.", tone: "from-amber-300/20 via-rose-400/15 to-black" },
];

function Sidebar({ view, conversations, conversationId, loading, onNewChat, onClose, onSettings }: {
  view: string; conversations: Conversation[]; conversationId: string | null; loading: boolean; onNewChat: () => void; onClose: () => void; onSettings: () => void;
}) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = conversations.filter((chat) => chat.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-[286px] shrink-0 flex-col border-r border-white/[.055] bg-[#0d0d0e] px-3 py-3 lg:relative lg:z-auto lg:flex">
      <div className="flex items-center justify-between px-2 pb-4">
        <Link href="/assistant" onClick={onNewChat} className="flex items-center gap-2.5">
          <BrandMark size={31}/><span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span>
        </Link>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setSearching((v) => !v)} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-[#171719] hover:text-zinc-100" title="Search chats"><Icon name="search" size={19}/></button>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600 hover:bg-[#171719] hover:text-zinc-200 lg:hidden"><Icon name="menu" size={18}/></button>
        </div>
      </div>

      {searching && <div className="mb-2 px-1">
        <div className="flex h-10 items-center gap-2 rounded-xl bg-[#181819] px-3 ring-1 ring-white/[.06]">
          <Icon name="search" size={16}/>
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"/>
        </div>
      </div>}

      <button onClick={onNewChat} className="flex h-11 items-center gap-3 rounded-xl bg-[#1a1a1b] px-3.5 text-sm font-medium ring-1 ring-white/[.055] hover:bg-[#222223]"><Icon name="plus"/> New chat</button>

      <div className="mt-3 space-y-0.5">
        <Link href="/assistant" className={(view === "chat" ? "bg-[#1b1b1c] text-zinc-100 " : "text-zinc-500 ") + "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm hover:bg-[#171718] hover:text-zinc-200"}><Icon name="chat" size={18}/> Chat</Link>
        <Link href="/assistant?view=images" className={(view === "images" ? "bg-[#1b1b1c] text-zinc-100 " : "text-zinc-500 ") + "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm hover:bg-[#171718] hover:text-zinc-200"}><Icon name="image" size={18}/> Images</Link>
        <Link href="/assistant?view=library" className={(view === "library" ? "bg-[#1b1b1c] text-zinc-100 " : "text-zinc-500 ") + "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm hover:bg-[#171718] hover:text-zinc-200"}><Icon name="file" size={18}/> Library</Link>
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3">
          <span className="text-[11px] font-medium text-zinc-600">Chats</span>
          <span className="text-[10px] text-zinc-700">{filtered.length}</span>
        </div>
        <div className="mt-2 space-y-0.5">
          {view === "chat" && filtered.map((chat) => <Link key={chat.id} href={"/assistant?conversation=" + chat.id} className={(conversationId === chat.id ? "bg-[#1b1b1c] text-zinc-100 " : "text-zinc-400 ") + "flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[#171718] hover:text-zinc-100"}><Icon name="chat" size={16}/><span className="min-w-0 flex-1 truncate text-[12px]">{chat.title || "New conversation"}</span></Link>)}
          {view === "chat" && !filtered.length && !loading && <p className="px-3 py-4 text-xs leading-5 text-zinc-700">{query ? "No matching chats." : "No chats yet."}</p>}
          {view === "chat" && filtered.length > 0 && <button type="button" className="px-3 pt-3 text-xs text-zinc-600 hover:text-zinc-300">See all</button>}
        </div>
      </div>

      <div className="border-t border-white/[.055] pt-2">
        <button type="button" onClick={onSettings} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#171718]">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#29292b] text-sm font-semibold text-zinc-300">Z</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm text-zinc-200">ZenixMind</span><span className="block text-[10px] text-zinc-600">Profile & settings</span></span>
        </button>
      </div>
    </aside>
  );
}

function ImagesView() {
  const [tab, setTab] = useState<"trending" | "templates">("trending");
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabase();

  async function uploadReference(file: File) {
    setUploading(true); setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("Sign in to save images to your Library."); setUploading(false); return; }
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = user.id + "/" + crypto.randomUUID() + "-" + safe;
    const { error } = await supabase.storage.from("zenix-library").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { setNotice(error.message); setUploading(false); return; }
    const { error: rowError } = await supabase.from("library_items").insert({ user_id: user.id, file_name: file.name, mime_type: file.type, storage_path: path, size_bytes: file.size, source: "uploaded" });
    setNotice(rowError ? rowError.message : "Reference image saved to Library.");
    setUploading(false);
  }

  function chooseTemplate(value: string) { setPrompt(value); setNotice(""); }

  return (
    <div className="min-h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[980px] px-4 pb-36 pt-5 sm:px-7">
        <div className="flex items-center gap-3">
          <Link href="/assistant" className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 hover:bg-[#151517] hover:text-zinc-100" aria-label="Back"><Icon name="arrow" size={19}/></Link>
          <h1 className="text-xl font-light tracking-[-.03em]">Images</h1>
        </div>

        <div className="mt-5 rounded-2xl border border-white/[.06] bg-[#0b0b0d] px-4 py-3">
          <p className="text-xs text-zinc-300">Generated images are saved to Library.</p>
          <Link href="/assistant?view=library" className="mt-1 inline-block text-[11px] text-zinc-500 hover:text-zinc-200">Open Library</Link>
        </div>

        <div className="mt-6 flex gap-7 border-b border-white/[.06]">
          <button onClick={() => setTab("trending")} className={(tab === "trending" ? "border-b-2 border-zinc-200 text-zinc-100 " : "text-zinc-600 ") + "pb-3 text-sm font-light"}>Trending</button>
          <button onClick={() => setTab("templates")} className={(tab === "templates" ? "border-b-2 border-zinc-200 text-zinc-100 " : "text-zinc-600 ") + "pb-3 text-sm font-light"}>Templates</button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {templates.map((item) => <button key={item.title} onClick={() => chooseTemplate(item.prompt)} className="group overflow-hidden rounded-2xl border border-white/[.06] bg-[#0a0a0c] text-left hover:border-white/[.12]">
            <div className={"relative aspect-[4/5] bg-gradient-to-br " + item.tone}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.16),transparent_30%),linear-gradient(145deg,transparent_40%,rgba(255,255,255,.05))]"/>
              <div className="absolute inset-x-3 bottom-3"><p className="text-sm font-light tracking-[-.02em] text-zinc-100">{item.title}</p></div>
            </div>
          </button>)}
        </div>

        <div className="fixed bottom-5 left-1/2 z-30 w-[min(760px,calc(100%-32px))] -translate-x-1/2">
          <div className="flex items-end gap-2 rounded-[24px] border border-white/[.08] bg-[#0c0c0e]/95 p-2 shadow-[0_20px_70px_rgba(0,0,0,.55)] backdrop-blur-xl">
            <button type="button" onClick={() => fileRef.current?.click()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-[#171719] hover:text-zinc-100" title="Add image"><Icon name="image" size={18}/></button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadReference(file); e.currentTarget.value = ""; }}/>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the image you want..." rows={1} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"/>
            <button type="button" onClick={() => { if (!prompt.trim()) { setNotice("Describe the image first."); return; } setNotice("Image generation provider is not connected yet. The prompt is ready."); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#202023] text-zinc-200 hover:bg-[#29292d]" aria-label="Create image"><Icon name="arrow" size={19}/></button>
          </div>
          {notice && <p className="mt-2 text-center text-[10px] text-zinc-600">{uploading ? "Saving reference..." : notice}</p>}
        </div>
      </div>
    </div>
  );
