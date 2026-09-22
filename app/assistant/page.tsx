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
  { title: "Sketch", prompt: "Turn this idea into a clean hand-drawn sketch with simple lines and a white paper background.", tone: "from-zinc-700/30 via-zinc-500/10 to-zinc-900" },
  { title: "Product photo", prompt: "Create a premium studio product photograph with soft directional lighting, realistic materials, and a clean background.", tone: "from-slate-600/30 via-zinc-700/10 to-black" },
  { title: "Poster", prompt: "Create a polished modern poster with strong typography, clear hierarchy, cinematic lighting, and a refined editorial layout.", tone: "from-zinc-600/25 via-zinc-800/20 to-black" },
  { title: "Portrait", prompt: "Create a natural editorial portrait with realistic skin, soft cinematic light, shallow depth of field, and premium photography.", tone: "from-neutral-600/25 via-zinc-800/20 to-black" },
  { title: "Logo", prompt: "Create a minimal, memorable brand mark with a clean silhouette, balanced geometry, and a monochrome presentation.", tone: "from-zinc-500/20 via-zinc-900/30 to-black" },
  { title: "Illustration", prompt: "Create a polished editorial illustration with expressive shapes, controlled texture, and a sophisticated visual system.", tone: "from-zinc-700/30 via-zinc-900/20 to-black" },
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
      <div className="mx-auto w-full max-w-[1050px] px-4 pb-36 pt-7 sm:px-7">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Images</h1><p className="mt-1 text-xs text-zinc-600">Create, refine, and keep your visual work in one place.</p></div>
          <Link href="/assistant?view=library" className="hidden rounded-xl border border-white/[.07] bg-[#0d0d0f] px-3.5 py-2 text-xs text-zinc-400 hover:bg-[#121214] hover:text-zinc-100 sm:block">Open Library</Link>
        </div>
        <div className="mt-7 rounded-[26px] border border-white/[.07] bg-[#0b0b0d] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-medium">Create something new</p><p className="mt-1 text-xs leading-5 text-zinc-600">Describe the image you want, or start from a template.</p></div>
            <button type="button" onClick={() => fileRef.current?.click()} className="grid h-10 w-10 place-items-center rounded-full bg-[#171719] text-zinc-400 hover:bg-[#202023] hover:text-zinc-100" title="Add reference image"><Icon name="image"/></button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadReference(file); e.currentTarget.value = ""; }}/>
          </div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe an image..." rows={3} className="mt-5 w-full resize-none rounded-2xl border border-white/[.06] bg-[#070708] px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-white/[.12]"/>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[10px] text-zinc-700">{uploading ? "Saving reference..." : notice || "Reference uploads are saved to your Library."}</p>
            <button type="button" onClick={() => { if (!prompt.trim()) { setNotice("Describe the image first."); return; } setNotice("Image generation provider is not connected yet. The prompt is ready to use when the image provider is connected."); }} className="rounded-full bg-[#222225] px-5 py-2.5 text-xs font-medium text-zinc-100 hover:bg-[#2a2a2e]">Create image</button>
          </div>
        </div>
        <div className="mt-8 flex gap-7 border-b border-white/[.06]">
          <button onClick={() => setTab("trending")} className={(tab === "trending" ? "border-b-2 border-zinc-200 text-zinc-100 " : "text-zinc-600 ") + "pb-3 text-sm font-medium"}>Trending</button>
          <button onClick={() => setTab("templates")} className={(tab === "templates" ? "border-b-2 border-zinc-200 text-zinc-100 " : "text-zinc-600 ") + "pb-3 text-sm font-medium"}>Templates</button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {templates.map((item, index) => <button key={item.title} onClick={() => chooseTemplate(item.prompt)} className="group overflow-hidden rounded-[22px] border border-white/[.06] bg-[#0a0a0c] text-left hover:border-white/[.12]">
            <div className={"relative aspect-[4/5] bg-gradient-to-br " + item.tone}>
              <div className="absolute inset-0 opacity-70" style={{ background: index % 2 === 0 ? "radial-gradient(circle at 50% 35%, rgba(255,255,255,.13), transparent 34%), linear-gradient(145deg, transparent 45%, rgba(255,255,255,.04))" : "radial-gradient(circle at 60% 45%, rgba(255,255,255,.1), transparent 28%), linear-gradient(125deg, rgba(255,255,255,.03), transparent 55%)" }}/>
              <div className="absolute inset-x-4 bottom-4"><p className="text-lg font-medium tracking-[-.03em] text-zinc-100">{item.title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-500">{item.prompt}</p></div>
            </div>
          </button>)}
        </div>
        {tab === "templates" && <p className="mt-5 text-center text-[10px] text-zinc-700">Choose a template to place its prompt in the creator above.</p>}
      </div>
    </div>
  );
}

function LibraryView() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "images" | "files">("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(getSupabase());
  const supabase = supabaseRef.current;

  const load = useCallback(async () => {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); setNotice("Sign in to use your Library."); return; }
    const { data, error } = await supabase.from("library_items").select("id,file_name,mime_type,storage_path,size_bytes,source,prompt,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (error) { setNotice(error.message); setBusy(false); return; }
    const rows = (data || []) as LibraryItem[];
    const withUrls = await Promise.all(rows.map(async (item) => {
      const signed = await supabase.storage.from("zenix-library").createSignedUrl(item.storage_path, 3600);
      return { ...item, url: signed.data?.signedUrl };
    }));
    setItems(withUrls); setBusy(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("Sign in to upload files."); return; }
    setNotice("");
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) { setNotice(file.name + " is larger than 20 MB."); continue; }
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = user.id + "/" + crypto.randomUUID() + "-" + safe;
      const upload = await supabase.storage.from("zenix-library").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upload.error) { setNotice(upload.error.message); continue; }
      const row = await supabase.from("library_items").insert({ user_id: user.id, file_name: file.name, mime_type: file.type || null, storage_path: path, size_bytes: file.size, source: "uploaded" });
      if (row.error) setNotice(row.error.message);
    }
    await load();
  }

  async function remove(item: LibraryItem) {
    const result = await supabase.storage.from("zenix-library").remove([item.storage_path]);
    if (result.error) { setNotice(result.error.message); return; }
    const { error } = await supabase.from("library_items").delete().eq("id", item.id);
    if (error) { setNotice(error.message); return; }
    setItems((current) => current.filter((x) => x.id !== item.id));
  }

  const visible = items.filter((item) => {
    const matchesType = filter === "all" || (filter === "images" ? item.mime_type?.startsWith("image/") : !item.mime_type?.startsWith("image/"));
    return matchesType && item.file_name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="min-h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-20 pt-7 sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Library</h1><p className="mt-1 text-xs text-zinc-600">Your uploaded and generated files, kept ready to reuse.</p></div>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-[#171719] px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-[#202023]"><Icon name="upload" size={16}/> Upload</button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { void uploadFiles(e.target.files); e.currentTarget.value = ""; }}/>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-[#0b0b0d] p-1 ring-1 ring-white/[.05]">
            {(["all", "images", "files"] as const).map((key) => <button key={key} onClick={() => setFilter(key)} className={(filter === key ? "bg-[#171719] text-zinc-100 " : "text-zinc-600 ") + "rounded-lg px-3 py-2 text-xs capitalize hover:text-zinc-200"}>{key}</button>)}
          </div>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-white/[.06] bg-[#0b0b0d] px-3 text-zinc-600 sm:w-72"><Icon name="search" size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search library" className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-700"/></div>
        </div>
        {notice && <p className="mt-4 text-xs text-zinc-500">{notice}</p>}
        {busy ? <div className="py-24 text-center text-xs text-zinc-700">Loading your Library…</div> : !visible.length ? <div className="rounded-[24px] border border-dashed border-white/[.07] bg-[#09090b] py-24 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#111113] text-zinc-600"><Icon name="file"/></div><p className="mt-4 text-sm text-zinc-400">{query ? "No matching files." : "Your Library is empty."}</p><p className="mt-1 text-xs text-zinc-700">Upload an image, document, PDF, or other file to start building it.</p></div> : <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((item) => <article key={item.id} className="group overflow-hidden rounded-[20px] border border-white/[.06] bg-[#0a0a0c]">
            {item.mime_type?.startsWith("image/") && item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="block aspect-square bg-[#111113]"><img src={item.url} alt={item.file_name} className="h-full w-full object-cover transition group-hover:scale-[1.02]"/></a> : <div className="grid aspect-square place-items-center bg-[#0d0d0f] text-zinc-600"><Icon name="file" size={34}/></div>}
            <div className="p-3"><p className="truncate text-xs text-zinc-300">{item.file_name}</p><div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-zinc-700"><span>{formatSize(item.size_bytes)}</span><span>{formatTime(item.created_at)}</span></div><div className="mt-3 flex gap-1.5"><a href={item.url} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg bg-[#151517] text-zinc-500 hover:text-zinc-100" title="Open"><Icon name="download" size={14}/></a><button onClick={() => void remove(item)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#151517] text-zinc-500 hover:text-red-300" title="Delete"><Icon name="trash" size={14}/></button></div></div>
          </article>)}
        </div>}
      </div>
    </div>
  );
}

function SettingsPanel({ onClose, onNewChat }: { onClose: () => void; onNewChat: () => void }) {
  type Section = "account" | "general" | "personalization" | "voice" | "notifications" | "privacy" | "security" | "about";
  const [section, setSection] = useState<Section>("account");
  const [email, setEmail] = useState("");
  const [improve, setImprove] = useState(true);
  const [memory, setMemory] = useState(true);
  const [temporary, setTemporary] = useState(false);
  const [voiceAutoStart, setVoiceAutoStart] = useState(false);
  const [voiceRate, setVoiceRate] = useState("0.96");
  const [language, setLanguage] = useState("English");
  const [personality, setPersonality] = useState("Balanced");
  const [responseLength, setResponseLength] = useState("Adaptive");
  const [customInstructions, setCustomInstructions] = useState("");
  const [notifyProduct, setNotifyProduct] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setImprove(localStorage.getItem("zenixmind-improve-service") !== "off");
    setMemory(localStorage.getItem("zenixmind-memory") !== "off");
    setTemporary(localStorage.getItem("zenixmind-temporary-chat") === "on");
    setVoiceAutoStart(localStorage.getItem("zenixmind-voice-auto") === "on");
    setVoiceRate(localStorage.getItem("zenixmind-voice-rate") || "0.96");
    setLanguage(localStorage.getItem("zenixmind-language") || "English");
    setPersonality(localStorage.getItem("zenixmind-personality") || "Balanced");
    setResponseLength(localStorage.getItem("zenixmind-response-length") || "Adaptive");
    setCustomInstructions(localStorage.getItem("zenixmind-custom-instructions") || "");
    setNotifyProduct(localStorage.getItem("zenixmind-notify-product") !== "off");
    setNotifySecurity(localStorage.getItem("zenixmind-notify-security") !== "off");
    void (async () => {
      const { data: { user } } = await getSupabase().auth.getUser();
      if (user?.email) setEmail(user.email);
    })();
  }, []);

  function save(key: string, value: string) {
    localStorage.setItem(key, value);
    setNotice("Saved");
    window.setTimeout(() => setNotice(""), 1200);
  }

  function toggle(key: string, value: boolean, setter: (v: boolean) => void) {
    setter(value);
    save(key, value ? "on" : "off");
  }

  async function exportData() {
    setNotice("Preparing export…");
    const response = await fetch("/api/chat?export=1", { cache: "no-store" });
    if (!response.ok) { setNotice("Unable to export your data."); return; }
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "zenixmind-data-export.json"; a.click(); URL.revokeObjectURL(url);
    setNotice("Export downloaded.");
  }

  async function deleteAll() {
    if (!window.confirm("Delete all of your chats and messages? This cannot be undone.")) return;
    setNotice("Deleting chats…");
    const response = await fetch("/api/chat", { method: "DELETE" });
    if (!response.ok) { setNotice("Unable to delete chats."); return; }
    setNotice("All chats deleted.");
    onNewChat();
  }

  async function signOut() {
    await getSupabase().auth.signOut();
    window.location.href = "/login";
  }

  const sections: { id: Section; label: string; icon: string; group: string }[] = [
    { id: "account", label: "Account", icon: "user", group: "Account" },
    { id: "general", label: "General", icon: "settings", group: "Preferences" },
    { id: "personalization", label: "Personalization", icon: "spark", group: "Preferences" },
    { id: "voice", label: "Voice", icon: "wave", group: "Preferences" },
    { id: "notifications", label: "Notifications", icon: "bell", group: "Preferences" },
    { id: "privacy", label: "Privacy & data", icon: "shield", group: "Privacy" },
    { id: "security", label: "Security", icon: "lock", group: "Privacy" },
    { id: "about", label: "About & help", icon: "info", group: "Support" },
  ];

  function Switch({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
    return <button type="button" aria-pressed={value} onClick={() => onChange(!value)} className={"relative h-7 w-12 rounded-full transition " + (value ? "bg-zinc-200" : "bg-zinc-700")}><span className={"absolute top-1 h-5 w-5 rounded-full bg-[#111113] shadow transition " + (value ? "left-6" : "left-1")}/></button>;
  }

  function Row({ title, description, children, onClick }: { title: string; description?: string; children?: React.ReactNode; onClick?: () => void }) {
    return <div onClick={onClick} className={"flex items-center justify-between gap-5 border-b border-white/[.07] py-5 " + (onClick ? "cursor-pointer hover:bg-white/[.02]" : "")}><div className="min-w-0"><p className="text-[15px] font-medium text-zinc-100">{title}</p>{description && <p className="mt-1 max-w-xl text-[12px] leading-5 text-zinc-500">{description}</p>}</div><div className="shrink-0">{children}</div></div>;
  }

  function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
    return <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-white/[.09] bg-[#151517] px-3 py-2 text-xs text-zinc-200 outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select>;
  }

  const content = {
    account: <div>
      <div className="mb-7"><h3 className="text-[24px] font-medium tracking-[-.025em]">Account</h3><p className="mt-1 text-sm text-zinc-500">Manage your ZenixMind account.</p></div>
      <div className="rounded-2xl border border-white/[.07] bg-[#111113] p-4"><div className="grid h-12 w-12 place-items-center rounded-full bg-[#242426] text-lg text-zinc-300">Z</div><p className="mt-4 text-sm font-medium text-zinc-100">ZenixMind account</p><p className="mt-1 text-xs text-zinc-500">{email || "Loading…"}</p></div>
      <Row title="Plan" description="Your current ZenixMind plan and usage will appear here as billing is connected."><span className="rounded-full bg-[#18181a] px-3 py-1.5 text-xs text-zinc-500">Free</span></Row>
      <Row title="Sign out" description="Sign out of this device."><button onClick={() => void signOut()} className="rounded-xl border border-white/[.1] px-4 py-2 text-xs text-zinc-200 hover:bg-white/[.05]">Sign out</button></Row>
    </div>,
    general: <div>
      <div className="mb-7"><h3 className="text-[24px] font-medium tracking-[-.025em]">General</h3><p className="mt-1 text-sm text-zinc-500">Control the way ZenixMind looks and behaves on this device.</p></div>
      <Row title="Appearance" description="ZenixMind is currently optimized for a dark interface."><span className="rounded-xl border border-white/[.09] bg-[#151517] px-3 py-2 text-xs text-zinc-300">Dark</span></Row>
      <Row title="Language" description="Language used for the interface and preferred responses."><Select value={language} options={["English", "French", "Spanish", "Portuguese", "Arabic"]} onChange={(v) => { setLanguage(v); save("zenixmind-language", v); }}/></Row>
      <Row title="Response length" description="Choose how much detail ZenixMind normally uses."><Select value={responseLength} options={["Adaptive", "Concise", "Detailed", "Thorough"]} onChange={(v) => { setResponseLength(v); save("zenixmind-response-length", v); }}/></Row>
    </div>,
    personalization: <div>
      <div className="mb-7"><h3 className="text-[24px] font-medium tracking-[-.025em]">Personalization</h3><p className="mt-1 text-sm text-zinc-500">Tell ZenixMind how you want your conversations to feel.</p></div>
      <Row title="Response style" description="Sets the default tone of ZenixMind responses."><Select value={personality} options={["Balanced", "Professional", "Friendly", "Direct", "Creative"]} onChange={(v) => { setPersonality(v); save("zenixmind-personality", v); }}/></Row>
      <div className="border-b border-white/[.07] py-5"><p className="text-[15px] font-medium text-zinc-100">Custom instructions</p><p className="mt-1 text-xs leading-5 text-zinc-500">Add preferences ZenixMind should consider when responding.</p><textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} onBlur={() => save("zenixmind-custom-instructions", customInstructions)} placeholder="For example: Keep technical explanations practical and show examples." rows={5} className="mt-4 w-full resize-none rounded-2xl border border-white/[.08] bg-[#111113] px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-white/[.16]"/></div>
      <Row title="Memory" description="Use information you explicitly choose to keep for future conversations."><Switch value={memory} onChange={(v) => toggle("zenixmind-memory", v, setMemory)}/></Row>
    </div>,
    voice: <div>
      <div className="mb-7"><h3 className="text-[24px] font-medium tracking-[-.025em]">Voice</h3><p className="mt-1 text-sm text-zinc-500">Control ZenixMind's voice conversation behavior.</p></div>
      <Row title="Start voice automatically" description="Open the dedicated Voice experience and begin listening immediately."><Switch value={voiceAutoStart} onChange={(v) => toggle("zenixmind-voice-auto", v, setVoiceAutoStart)}/></Row>
      <Row title="Speech rate" description="Playback speed for browser voice output."><Select value={voiceRate} options={["0.85", "0.96", "1.05", "1.15"]} onChange={(v) => { setVoiceRate(v); save("zenixmind-voice-rate", v); }}/></Row>
      <Row title="Voice language" description="Preferred language for speech recognition."><Select value={language} options={["English", "French", "Spanish", "Portuguese"]} onChange={(v) => { setLanguage(v); save("zenixmind-language", v); }}/></Row>
    </div>,
    notifications: <div>
      <div className="mb-7"><h3 className="text-[24px] font-medium tracking-[-.025em]">Notifications</h3><p className="mt-1 text-sm text-zinc-500">Choose which ZenixMind notifications you want on this device.</p></div>
      <Row title="Product updates" description="News about new ZenixMind features and improvements."><Switch value={notifyProduct} onChange={(v) => toggle("zenixmind-notify-product", v, setNotifyProduct)}/></Row>
      <Row title="Security alerts" description="Important account and security notices."><Switch value={notifySecurity} onChange={(v) => toggle("zenixmind-notify-security", v, setNotifySecurity)}/></Row>
    </div>,
    privacy: <div>
      <div className="mb-7"><h3 className="text-[24px] font-medium tracking-[-.025em]">Privacy & data</h3><p className="mt-1 text-sm text-zinc-500">Control how your ZenixMind activity is stored and used.</p></div>
      <Row title="Improve ZenixMind" description="Allow anonymized usage data to help improve the service."><Switch value={improve} onChange={(v) => toggle("zenixmind-improve-service", v, setImprove)}/></Row>
      <Row title="Temporary chats" description="Keep a conversation out of your normal chat history when this is enabled for a new chat."><Switch value={temporary} onChange={(v) => toggle("zenixmind-temporary-chat", v, setTemporary)}/></Row>
      <Row title="Export data" description="Download your conversations and account data as JSON."><button onClick={() => void exportData()} className="rounded-xl border border-white/[.1] px-4 py-2 text-xs text-zinc-200 hover:bg-white/[.05]">Export</button></Row>
      <Row title="Delete all chats" description="Permanently delete every conversation and message in your account."><button onClick={() => void deleteAll()} className="rounded-xl border border-red-400/70 px-4 py-2 text-xs text-red-300 hover:bg-red-400/10">Delete all</button></Row>
    </div>,
    security: <div>
      <div className="mb-7"><h3 className="text-[24px] font-medium tracking-[-.025em]">Security</h3><p className="mt-1 text-sm text-zinc-500">Protect access to your ZenixMind account.</p></div>
      <Row title="Current session" description="This browser is signed in to your ZenixMind account."><span className="rounded-full bg-[#171719] px-3 py-1.5 text-xs text-zinc-500">Active</span></Row>
      <Row title="Sign out" description="End this session on the current device."><button onClick={() => void signOut()} className="rounded-xl border border-white/[.1] px-4 py-2 text-xs text-zinc-200 hover:bg-white/[.05]">Sign out</button></Row>
    </div>,
    about: <div>
      <div className="mb-7"><h3 className="text-[24px] font-medium tracking-[-.025em]">About & help</h3><p className="mt-1 text-sm text-zinc-500">Information and support for ZenixMind.</p></div>
      <Row title="ZenixMind" description="Your AI assistant for thinking, creating, researching and getting things done."><span className="text-xs text-zinc-600">2026</span></Row>
      <Row title="AI provider" description="Configured by the ZenixMind service. Provider details are not exposed as a user setting."><span className="text-xs text-zinc-600">Managed</span></Row>
      <Row title="Help & support" description="Support links will be added when the support system is connected."><span className="text-xs text-zinc-700">Coming later</span></Row>
    </div>,
  }[section];

  return <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm sm:p-5">
    <section className="mx-auto flex h-full w-full max-w-[1040px] overflow-hidden bg-[#111113] text-zinc-100 sm:h-[min(760px,calc(100vh-40px))] sm:rounded-[24px] sm:border sm:border-white/[.08] sm:shadow-2xl">
      <aside className="hidden w-[245px] shrink-0 border-r border-white/[.07] bg-[#0d0d0f] p-3 sm:block">
        <div className="flex items-center justify-between px-2 pb-5 pt-1"><p className="text-sm font-medium text-zinc-100">Settings</p><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/[.05] hover:text-zinc-100"><Icon name="close" size={18}/></button></div>
        <nav className="space-y-5 overflow-y-auto">
          {["Account", "Preferences", "Privacy", "Support"].map((group) => <div key={group}><p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-[.14em] text-zinc-700">{group}</p>{sections.filter((item) => item.group === group).map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs " + (section === item.id ? "bg-[#1c1c1f] text-zinc-100" : "text-zinc-500 hover:bg-[#151517] hover:text-zinc-200")}><Icon name={item.icon} size={17}/><span>{item.label}</span></button>)}</div>)}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/[.07] px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3"><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-white/[.05] sm:hidden"><Icon name="close" size={20}/></button><h2 className="text-[18px] font-medium tracking-[-.02em]">{sections.find((item) => item.id === section)?.label}</h2></div>
          <div className="hidden text-[11px] text-zinc-600 sm:block">ZenixMind Settings</div>
        </header>
        <div className="border-b border-white/[.07] px-4 py-3 sm:hidden"><select value={section} onChange={(e) => setSection(e.target.value as Section)} className="w-full rounded-xl border border-white/[.08] bg-[#18181a] px-3 py-2.5 text-sm text-zinc-200 outline-none">{sections.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
        <div className="min-h-0 flex-1 overflow-y-auto"><div className="mx-auto max-w-[680px] px-5 py-7 sm:px-9 sm:py-9">{content}</div></div>
        {notice && <div className="border-t border-white/[.06] px-5 py-2 text-center text-[10px] text-zinc-500">{notice}</div>}
      </div>
    </section>
  </div>;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("default");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dictating, setDictating] = useState(false);
  const [dictationNotice, setDictationNotice] = useState("");
  const [view, setView] = useState("chat");
  const dictationRef = useRef<DictationRecognition | null>(null);
  const dictationBaseRef = useRef("");

  async function loadConversations() {
    const response = await fetch("/api/chat", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json(); setConversations(data.conversations || []);
  }

  async function loadConversation(id: string) {
    setLoading(true);
    const response = await fetch("/api/chat?conversation_id=" + encodeURIComponent(id), { cache: "no-store" });
    if (!response.ok) { setConversationId(null); setMessages([]); setLoading(false); return; }
    const data = await response.json();
    setConversationId(data.conversation?.id || id); setModel(data.conversation?.model || "default");
    setMessages((data.messages || []).filter((m: Message) => m.role === "user" || m.role === "assistant").map((m: Message) => ({ role: m.role, content: m.content })));
    setLoading(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("conversation");
    const requestedView = params.get("view");
    setView(requestedView === "images" || requestedView === "library" ? requestedView : "chat");
    if (params.get("settings") === "1") setSettingsOpen(true);
    void loadConversations();
    if (id) void loadConversation(id); else setLoading(false);
  }, []);

  function stopDictation() { try { dictationRef.current?.stop(); } catch {} }

  function startDictation() {
    if (dictating) { stopDictation(); return; }
    const recognition = makeDictationRecognition();
    if (!recognition) { setDictationNotice("Speech dictation is not supported in this browser."); return; }
    dictationRef.current = recognition; dictationBaseRef.current = input.trim() ? input.trim() + " " : "";
    recognition.onstart = () => { setDictating(true); setDictationNotice("Listening for dictation"); };
    recognition.onresult = (event) => { let transcript = ""; for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript; setInput(dictationBaseRef.current + transcript.trim()); };
    recognition.onend = () => { setDictating(false); setDictationNotice(""); };
    recognition.onerror = (event) => { setDictating(false); setDictationNotice(event.error === "not-allowed" ? "Microphone permission was denied." : "Dictation could not start."); };
    try { if ("processLocally" in recognition) recognition.processLocally = true; recognition.start(); } catch { try { recognition.abort(); recognition.start(); } catch { setDictating(false); setDictationNotice("Dictation could not start."); } }
  }

  useEffect(() => () => stopDictation(), []);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault(); const text = input.trim(); if (!text || busy) return;
    stopDictation(); const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, model, conversationId, preferences: { memory: localStorage.getItem("zenixmind-memory") !== "off", personality: localStorage.getItem("zenixmind-personality") || "Balanced", responseLength: localStorage.getItem("zenixmind-response-length") || "Adaptive", language: localStorage.getItem("zenixmind-language") || "English", customInstructions: localStorage.getItem("zenixmind-custom-instructions") || "" } }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Chat request failed.");
      if (data.conversationId) { setConversationId(data.conversationId); window.history.replaceState({}, "", "/assistant?conversation=" + data.conversationId); }
      setMessages((current) => [...current, { role: "assistant", content: data.message }]); void loadConversations();
    } catch (error) { setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Unable to process the request." }]); }
    finally { setBusy(false); }
  }

  function newChat() { stopDictation(); setView("chat"); setConversationId(null); setMessages([]); setInput(""); window.history.replaceState({}, "", "/assistant"); setSidebarOpen(false); }

  const empty = messages.length === 0;

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#050506] text-zinc-100">
      <div className="flex h-full">
        {sidebarOpen && <button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/70 lg:hidden"/>}
        <div className={(sidebarOpen ? "fixed inset-y-0 left-0 z-50 flex " : "hidden ") + "lg:relative lg:flex"}><Sidebar view={view} conversations={conversations} conversationId={conversationId} loading={loading} onNewChat={newChat} onClose={() => setSidebarOpen(false)} onSettings={() => { setSettingsOpen(true); setSidebarOpen(false); }}/></div>
        <section className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex h-[70px] shrink-0 items-center justify-between px-4 sm:px-7">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/[.06] bg-[#0d0d0f] text-zinc-400 hover:bg-[#151517] lg:hidden"><Icon name="menu" size={20}/></button>
              <Link href="/assistant" onClick={newChat} className="lg:hidden"><BrandMark size={27}/></Link>
              <div className="hidden items-center gap-2 lg:flex"><BrandMark size={25}/><span className="text-sm font-semibold">{view === "images" ? "Images" : view === "library" ? "Library" : "ZenixMind"}</span></div>
            </div>
            {view === "chat" && <div className="text-[11px] text-zinc-700">AI assistant</div>}
          </header>
          <div className="min-h-0 flex-1">
            {view === "images" ? <ImagesView/> : view === "library" ? <LibraryView/> : <div className="h-full overflow-y-auto">
              <div className="mx-auto flex min-h-full w-full max-w-[900px] flex-col px-4 pb-48 sm:px-7">
                {loading ? <div className="flex flex-1 items-center justify-center"><BrandMark size={38} className="animate-pulse opacity-40"/></div> : empty ? (
                  <div className="flex flex-1 flex-col items-center justify-center pb-8 text-center">
                    <BrandMark size={54}/><h1 className="mt-7 text-3xl font-semibold tracking-[-.045em] sm:text-[38px]">How can I help?</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">Ask ZenixMind anything. Your conversations are saved to your account.</p>
                    <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-2">{["Help me plan a project", "Explain something simply", "Write something for me", "Help me research"].map((starter) => <button key={starter} onClick={() => setInput(starter)} className="rounded-2xl border border-white/[.06] bg-[#09090b] px-4 py-3 text-left text-xs text-zinc-500 hover:border-white/[.11] hover:bg-[#0d0d0f] hover:text-zinc-200">{starter}</button>)}</div>
                  </div>
                ) : <div className="space-y-8 py-8">
                  {messages.map((message, index) => <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>{message.role === "user" ? <div className="max-w-[85%] rounded-[22px] rounded-br-md bg-[#171719] px-5 py-3.5 text-sm leading-6 text-zinc-100 ring-1 ring-white/[.05]">{message.content}</div> : <div className="flex max-w-[90%] gap-3"><BrandMark size={27} className="mt-1 shrink-0"/><div className="whitespace-pre-wrap pt-1 text-sm leading-7 text-zinc-300">{message.content}</div></div>}</div>)}
                  {busy && <div className="flex gap-3"><BrandMark size={27} className="mt-1"/><div className="flex gap-1 pt-3"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:150ms]"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:300ms]"/></div></div>}
                </div>}
              </div>
            </div>}
          </div>
          {view === "chat" && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050506] via-[#050506]/95 to-transparent pt-14">
            <div className="mx-auto max-w-[900px] px-4 pb-4 sm:px-7">
              <form onSubmit={sendMessage} className="rounded-[26px] border border-white/[.09] bg-[#151517] p-2 shadow-[0_20px_80px_rgba(0,0,0,.5)]">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} rows={1} placeholder="Ask anything" className="max-h-36 min-h-[58px] w-full resize-none bg-transparent px-3 py-2.5 text-[17px] text-zinc-100 outline-none placeholder:text-zinc-500"/>
                <div className="flex items-center justify-between px-1 pb-1">
                  <div className="flex items-center gap-2"><Link href="/assistant?view=images" className="grid h-10 w-10 place-items-center rounded-full bg-[#222225] text-zinc-300 hover:bg-[#2a2a2e]" title="Images"><Icon name="image" size={19}/></Link></div>
                  <div className="flex items-center gap-2"><button type="button" onClick={startDictation} className={(dictating ? "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20 " : "bg-[#222225] text-zinc-300 ") + "grid h-10 w-10 place-items-center rounded-full hover:bg-[#2a2a2e]"} title="Microphone — dictation only"><Icon name="mic" size={19}/></button>{input.trim() ? <button type="submit" disabled={busy} className="grid h-10 w-10 place-items-center rounded-full bg-[#222225] text-zinc-100 hover:bg-[#2a2a2e] disabled:opacity-40" title="Send"><Icon name="send" size={17}/></button> : <Link href="/assistant/voice" className="flex h-10 items-center gap-2 rounded-full bg-[#222225] px-4 text-sm font-medium text-zinc-100 hover:bg-[#2a2a2e]" title="Speak — AI voice conversation"><Icon name="wave" size={17}/> Speak</Link>}</div>
                </div>
                {dictationNotice && <p className="px-3 pb-1 text-[10px] text-zinc-600">{dictationNotice}</p>}
              </form>
              <p className="mt-2 text-center text-[10px] text-zinc-700">Microphone adds words to the composer. Speak starts a separate AI voice conversation.</p>
            </div>
          </div>}
        </section>
      </div>
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} onNewChat={() => { newChat(); setSettingsOpen(false); }} />}
    </main>
  );
}
