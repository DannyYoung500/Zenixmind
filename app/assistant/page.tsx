"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getSupabase } from "@/lib/supabase";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; updated_at: string };
type LibraryItem = { id: string; file_name: string; mime_type: string | null; storage_path: string; size_bytes: number | null; source: "uploaded" | "generated"; prompt: string | null; created_at: string; url?: string };

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "send") return <svg {...p}><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg>;
  if (name === "mic") return <svg {...p}><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  if (name === "image") return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>;
  if (name === "upload") return <svg {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>;
  if (name === "trash") return <svg {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>;
  if (name === "close") return <svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
  if (name === "download") return <svg {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
}

function Composer({ value, setValue, onSend, busy, onDictate }: { value: string; setValue: (value: string) => void; onSend: () => void; busy: boolean; onDictate: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }
  return <div className="w-full">
    <div className="rounded-[26px] border border-white/[.08] bg-[#111113] p-2 shadow-[0_24px_90px_rgba(0,0,0,.42)] transition focus-within:border-white/[.13]">
      <textarea ref={ref} value={value} rows={1} onChange={(e) => { setValue(e.target.value); requestAnimationFrame(resize); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} placeholder="Ask ZenixMind" className="max-h-40 min-h-[54px] w-full resize-none overflow-y-auto bg-transparent px-3 py-3 text-[15px] font-light leading-6 text-zinc-100 outline-none placeholder:text-zinc-600"/>
      <div className="flex items-center justify-between px-1 pb-1">
        <Link href="/assistant?view=images" className="grid h-10 w-10 place-items-center rounded-full bg-[#1b1b1d] text-zinc-500 hover:text-zinc-100" title="Images"><Icon name="image" size={18}/></Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onDictate} className="grid h-10 w-10 place-items-center rounded-full bg-[#1b1b1d] text-zinc-500 hover:text-zinc-100" title="Dictation"><Icon name="mic" size={18}/></button>
          <button type="button" disabled={busy || !value.trim()} onClick={onSend} className="grid h-10 w-10 place-items-center rounded-full bg-[#242427] text-zinc-100 hover:bg-[#2d2d30] disabled:opacity-30" title="Send"><Icon name="send" size={17}/></button>
        </div>
      </div>
    </div>
    <p className="mt-2 text-center text-[10px] font-light text-zinc-700">ZenixMind can make mistakes. Check important information.</p>
  </div>;
}

function ChatView({ messages, loading, input, setInput, send, busy, dictate }: { messages: Message[]; loading: boolean; input: string; setInput: (v: string) => void; send: () => void; busy: boolean; dictate: () => void }) {
  if (loading) return <div className="flex h-full items-center justify-center"><BrandMark size={34} className="animate-pulse opacity-35"/></div>;
  if (!messages.length) return <div className="flex h-full flex-col items-center justify-center px-5 pb-24 text-center">
    <BrandMark size={58}/>
    <h1 className="mt-7 text-[30px] font-light tracking-[-.045em] text-zinc-100 sm:text-[38px]">What can I help with?</h1>
    <p className="mt-3 max-w-md text-sm font-light leading-6 text-zinc-600">Ask anything, work through an idea, write, research, or solve a problem.</p>
    <div className="mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
      {["Help me plan something","Explain a difficult idea","Write something","Help me research"].map((item) => <button key={item} type="button" onClick={() => setInput(item)} className="rounded-full border border-white/[.07] bg-[#0b0b0d] px-4 py-2.5 text-xs font-light text-zinc-500 hover:border-white/[.12] hover:text-zinc-200">{item}</button>)}
    </div>
    <div className="mt-10 w-full max-w-[720px]"><Composer value={input} setValue={setInput} onSend={send} busy={busy} onDictate={dictate}/></div>
  </div>;

  return <div className="mx-auto flex h-full w-full max-w-[900px] flex-col px-4 sm:px-7">
    <div className="min-h-0 flex-1 overflow-y-auto py-8 pb-40">
      <div className="space-y-9">
        {messages.map((message, index) => message.role === "user"
          ? <div key={index} className="flex justify-end"><div className="max-w-[82%] rounded-[22px] rounded-br-md bg-[#171719] px-5 py-3.5 text-sm font-light leading-6 text-zinc-200 ring-1 ring-white/[.045]">{message.content}</div></div>
          : <div key={index} className="flex gap-3"><BrandMark size={25} className="mt-1 shrink-0"/><div className="max-w-[88%] whitespace-pre-wrap text-sm font-light leading-7 text-zinc-300">{message.content}</div></div>)}
        {busy && <div className="flex gap-3"><BrandMark size={25}/><div className="flex gap-1 pt-3"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-600"/><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-600 [animation-delay:150ms]"/><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-600 [animation-delay:300ms]"/></div></div>}
      </div>
    </div>
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#050506] via-[#050506]/96 to-transparent px-4 pb-4 pt-14 lg:left-[270px]"><div className="mx-auto max-w-[900px]"><Composer value={input} setValue={setInput} onSend={send} busy={busy} onDictate={dictate}/></div></div>
  </div>;
}

function ImagesView() {
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = useRef(getSupabase()).current;
  const templates = [
    ["Sketch","Create a clean hand-drawn sketch from this idea."],
    ["'80s flashback","Create an authentic 1980s flashback visual with retro color, lighting, fashion, and film texture."],
    ["Stickers","Create a playful sticker sheet with expressive characters, clean outlines, and a polished sticker finish."],
    ["Create a caricature","Create a polished caricature portrait with expressive features and a playful editorial finish."]
  ];
  async function upload(file: File) {
    setUploading(true); setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("Sign in to save images to Library."); setUploading(false); return; }
    const path = user.id + "/" + crypto.randomUUID() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const up = await supabase.storage.from("zenix-library").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setNotice(up.error.message); setUploading(false); return; }
    const row = await supabase.from("library_items").insert({ user_id: user.id, file_name: file.name, mime_type: file.type, storage_path: path, size_bytes: file.size, source: "uploaded" });
    setNotice(row.error ? row.error.message : "Reference image saved to Library.");
    setUploading(false);
  }
  return <div className="min-h-full overflow-y-auto"><div className="mx-auto max-w-[980px] px-4 pb-36 pt-6 sm:px-7">
    <div className="flex items-center gap-3"><Link href="/assistant" className="text-sm font-light text-zinc-500 hover:text-zinc-100">Back</Link><h1 className="text-xl font-light">Images</h1></div>
    <div className="mt-5 rounded-2xl border border-white/[.06] bg-[#0b0b0d] px-4 py-3"><p className="text-xs font-light text-zinc-300">Generated images are saved to Library.</p><Link href="/assistant?view=library" className="mt-1 inline-block text-[11px] font-light text-zinc-600 hover:text-zinc-200">Open Library</Link></div>
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{templates.map(([title, value]) => <button key={title} type="button" onClick={() => setPrompt(value)} className="aspect-[4/5] overflow-hidden rounded-2xl border border-white/[.06] bg-gradient-to-br from-zinc-700/20 via-zinc-900/40 to-black p-3 text-left hover:border-white/[.12]"><div className="flex h-full items-end"><span className="text-sm font-light text-zinc-100">{title}</span></div></button>)}</div>
    <div className="fixed bottom-5 left-1/2 z-30 w-[min(760px,calc(100%-32px))] -translate-x-1/2"><div className="flex items-end gap-2 rounded-[24px] border border-white/[.08] bg-[#0c0c0e]/95 p-2 shadow-2xl backdrop-blur-xl">
      <button type="button" onClick={() => fileRef.current?.click()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-[#171719] hover:text-zinc-100"><Icon name="image" size={18}/></button><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f=e.target.files?.[0]; if(f) void upload(f); e.currentTarget.value=""; }}/>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={1} placeholder="Describe the image you want..." className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm font-light text-zinc-100 outline-none placeholder:text-zinc-600"/>
      <button type="button" onClick={() => setNotice(prompt.trim() ? "Image generation provider is not connected yet." : "Describe the image first.")} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#202023] text-zinc-200"><Icon name="send" size={17}/></button>
    </div>{notice && <p className="mt-2 text-center text-[10px] font-light text-zinc-600">{uploading ? "Saving reference..." : notice}</p>}</div>
  </div></div>;
}

function LibraryView() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<"all"|"images"|"files">("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = useRef(getSupabase()).current;
  async function load() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("Sign in to use your Library."); setBusy(false); return; }
    const { data, error } = await supabase.from("library_items").select("id,file_name,mime_type,storage_path,size_bytes,source,prompt,created_at").eq("user_id", user.id).order("created_at", { ascending:false }).limit(100);
    if (error) { setNotice(error.message); setBusy(false); return; }
    const rows = (data || []) as LibraryItem[];
    setItems(await Promise.all(rows.map(async item => ({ ...item, url: (await supabase.storage.from("zenix-library").createSignedUrl(item.storage_path, 3600)).data?.signedUrl }))));
    setBusy(false);
  }
  useEffect(() => { void load(); }, []);
  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("Sign in to upload files."); return; }
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) { setNotice(file.name + " is larger than 20 MB."); continue; }
      const path=user.id+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
      const up=await supabase.storage.from("zenix-library").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
      if (up.error) { setNotice(up.error.message); continue; }
      await supabase.from("library_items").insert({user_id:user.id,file_name:file.name,mime_type:file.type||null,storage_path:path,size_bytes:file.size,source:"uploaded"});
    }
    await load();
  }
  async function remove(item: LibraryItem) {
    const result=await supabase.storage.from("zenix-library").remove([item.storage_path]);
    if(result.error){setNotice(result.error.message);return;}
    const row=await supabase.from("library_items").delete().eq("id",item.id);
    if(row.error){setNotice(row.error.message);return;}
    setItems(current=>current.filter(x=>x.id!==item.id));
  }
  const visible=items.filter(item => (filter==="all" || (filter==="images" ? item.mime_type?.startsWith("image/") : !item.mime_type?.startsWith("image/"))) && item.file_name.toLowerCase().includes(query.toLowerCase()));
  return <div className="min-h-full overflow-y-auto"><div className="mx-auto max-w-[1050px] px-4 py-6 sm:px-7">
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-xl font-light">Library</h1><p className="mt-1 text-xs font-light text-zinc-600">Your uploaded and generated files.</p></div><button type="button" onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-[#171719] px-3.5 py-2.5 text-xs font-light text-zinc-200"><Icon name="upload" size={16}/> Upload</button><input ref={fileRef} type="file" multiple className="hidden" onChange={e=>{void uploadFiles(e.target.files);e.currentTarget.value="";}}/></div>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-1 rounded-xl bg-[#0b0b0d] p-1">{(["all","images","files"] as const).map(k=><button key={k} onClick={()=>setFilter(k)} className={"rounded-lg px-3 py-2 text-xs font-light "+(filter===k?"bg-[#19191b] text-zinc-100":"text-zinc-600")}>{k}</button>)}</div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Library" className="h-9 rounded-xl border border-white/[.06] bg-[#0b0b0d] px-3 text-xs font-light text-zinc-200 outline-none placeholder:text-zinc-700 sm:w-64"/></div>
    {notice && <p className="mt-3 text-xs font-light text-zinc-600">{notice}</p>}
    {busy ? <div className="flex h-60 items-center justify-center"><BrandMark size={32} className="animate-pulse opacity-30"/></div> : !visible.length ? <div className="flex h-72 flex-col items-center justify-center text-center"><BrandMark size={42} className="opacity-50"/><p className="mt-4 text-sm font-light text-zinc-400">Your Library is empty.</p><p className="mt-1 text-xs font-light text-zinc-700">Upload files or images to keep them here.</p></div> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border border-white/[.06] bg-[#0b0b0d]">{item.mime_type?.startsWith("image/") && item.url ? <img src={item.url} alt="" className="aspect-square w-full object-cover"/> : <div className="grid aspect-square place-items-center bg-[#101012] text-xs font-light text-zinc-600">{item.mime_type || "File"}</div>}<div className="p-3"><p className="truncate text-xs font-light text-zinc-300">{item.file_name}</p><p className="mt-1 text-[10px] font-light text-zinc-700">{item.size_bytes ? Math.round(item.size_bytes/1024)+" KB" : "—"}</p><div className="mt-3 flex items-center gap-2">{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] font-light text-zinc-500 hover:text-zinc-100"><Icon name="download" size={14}/></a>}<button type="button" onClick={()=>void remove(item)} className="text-zinc-700 hover:text-red-300"><Icon name="trash" size={14}/></button></div></div></article>)}</div>}
  </div></div>;
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [memory,setMemory]=useState(localStorage.getItem("zenixmind-memory")!=="off");
  const [length,setLength]=useState(localStorage.getItem("zenixmind-response-length")||"Adaptive");
  const [style,setStyle]=useState(localStorage.getItem("zenixmind-personality")||"Balanced");
  const [notice,setNotice]=useState("");
  const save=(key:string,value:string)=>localStorage.setItem(key,value);
  async function exportData(){const r=await fetch("/api/chat?export=1");if(!r.ok){setNotice("Export failed.");return;}const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="zenixmind-data.json";a.click();URL.revokeObjectURL(url);}
  async function deleteAll(){if(!window.confirm("Delete all chats? This cannot be undone."))return;const r=await fetch("/api/chat",{method:"DELETE"});setNotice(r.ok?"All chats deleted.":"Delete failed.");}
  return <div className="fixed inset-0 z-[100] bg-black/80 p-3 backdrop-blur-sm sm:p-6"><section className="mx-auto flex h-full max-w-[820px] overflow-hidden rounded-3xl border border-white/[.08] bg-[#101012]"><aside className="hidden w-56 shrink-0 border-r border-white/[.06] bg-[#0b0b0d] p-3 sm:block"><div className="flex items-center justify-between px-2 py-2"><span className="text-sm font-light">Settings</span><button onClick={onClose}><Icon name="close" size={17}/></button></div><div className="mt-6 space-y-1">{["Account","General","Personalization","Voice","Privacy & data","Security","About & help"].map((x,i)=><div key={x} className={"rounded-xl px-3 py-2.5 text-xs font-light "+(i===0?"bg-[#19191b] text-zinc-100":"text-zinc-600")}>{x}</div>)}</div></aside><div className="min-w-0 flex-1 overflow-y-auto"><header className="flex items-center justify-between border-b border-white/[.06] px-5 py-4"><h2 className="text-base font-light">Settings</h2><button onClick={onClose} className="text-zinc-500"><Icon name="close"/></button></header><div className="mx-auto max-w-[620px] px-5 py-6"><p className="text-xs font-light text-zinc-600">Account</p><div className="mt-3 rounded-2xl border border-white/[.06] bg-[#0b0b0d] p-4"><p className="text-sm font-light text-zinc-200">ZenixMind account</p><p className="mt-1 text-xs font-light text-zinc-600">Your account and workspace settings.</p></div><div className="mt-6 divide-y divide-white/[.06] border-y border-white/[.06]">
      <label className="flex items-center justify-between gap-5 py-5"><span><span className="block text-sm font-light text-zinc-200">Memory</span><span className="mt-1 block text-xs font-light text-zinc-600">Use saved preferences when available.</span></span><input type="checkbox" checked={memory} onChange={e=>{setMemory(e.target.checked);save("zenixmind-memory",e.target.checked?"on":"off");}}/></label>
      <label className="flex items-center justify-between gap-5 py-5"><span><span className="block text-sm font-light text-zinc-200">Response length</span><span className="mt-1 block text-xs font-light text-zinc-600">Default detail level.</span></span><select value={length} onChange={e=>{setLength(e.target.value);save("zenixmind-response-length",e.target.value)}} className="rounded-xl border border-white/[.07] bg-[#171719] px-3 py-2 text-xs text-zinc-300"><option>Adaptive</option><option>Concise</option><option>Detailed</option><option>Thorough</option></select></label>
      <label className="flex items-center justify-between gap-5 py-5"><span><span className="block text-sm font-light text-zinc-200">Response style</span><span className="mt-1 block text-xs font-light text-zinc-600">Default personality.</span></span><select value={style} onChange={e=>{setStyle(e.target.value);save("zenixmind-personality",e.target.value)}} className="rounded-xl border border-white/[.07] bg-[#171719] px-3 py-2 text-xs text-zinc-300"><option>Balanced</option><option>Professional</option><option>Friendly</option><option>Direct</option><option>Creative</option></select></label>
      </div><div className="mt-7 space-y-2"><button onClick={()=>void exportData()} className="flex w-full items-center justify-between rounded-xl border border-white/[.07] px-4 py-3 text-xs font-light text-zinc-300">Export data <Icon name="download" size={15}/></button><button onClick={()=>void deleteAll()} className="w-full rounded-xl border border-red-400/30 px-4 py-3 text-left text-xs font-light text-red-300">Delete all chats</button></div>{notice&&<p className="mt-4 text-xs font-light text-zinc-600">{notice}</p>}</div></div></section></div>;
}

export default function AssistantPage() {
  const [messages,setMessages]=useState<Message[]>([]);
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [conversationId,setConversationId]=useState<string|null>(null);
  const [input,setInput]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState<"chat"|"images"|"library">("chat");
  const [settings,setSettings]=useState(false);
  const dictationRef=useRef<{start:()=>void;stop:()=>void;abort:()=>void;onresult:((e:any)=>void)|null;onend:(()=>void)|null;onerror:((e:any)=>void)|null}|null>(null);

  async function loadConversations(){const r=await fetch("/api/chat",{cache:"no-store"});if(r.ok){const d=await r.json();setConversations(d.conversations||[]);}}
  async function loadConversation(id:string){setLoading(true);const r=await fetch("/api/chat?conversation_id="+encodeURIComponent(id),{cache:"no-store"});if(!r.ok){setLoading(false);return;}const d=await r.json();setConversationId(d.conversation?.id||id);setMessages((d.messages||[]).filter((m:Message)=>m.role==="user"||m.role==="assistant").map((m:Message)=>({role:m.role,content:m.content})));setLoading(false);}
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const id=p.get("conversation");const v=p.get("view");setView(v==="images"||v==="library"?v:"chat");setSettings(p.get("settings")==="1");void loadConversations();if(id)void loadConversation(id);else setLoading(false);},[]);
  async function send(){const text=input.trim();if(!text||busy)return;const next=[...messages,{role:"user" as const,content:text}];setMessages(next);setInput("");setBusy(true);try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:next,model:"default",conversationId,preferences:{memory:localStorage.getItem("zenixmind-memory")!=="off",personality:localStorage.getItem("zenixmind-personality")||"Balanced",responseLength:localStorage.getItem("zenixmind-response-length")||"Adaptive",language:localStorage.getItem("zenixmind-language")||"English",customInstructions:localStorage.getItem("zenixmind-custom-instructions")||""}})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Chat request failed.");if(d.conversationId){setConversationId(d.conversationId);window.history.replaceState({}, "", "/assistant?conversation="+d.conversationId);}setMessages(current=>[...current,{role:"assistant",content:d.message}]);void loadConversations();}catch(e){setMessages(current=>[...current,{role:"assistant",content:e instanceof Error?e.message:"Unable to process the request."}]);}finally{setBusy(false);}}
  function dictate(){if(typeof window==="undefined")return;const w=window as any;const C=w.SpeechRecognition||w.webkitSpeechRecognition;if(!C)return;const r=new C();r.continuous=false;r.interimResults=true;r.lang="en-US";dictationRef.current=r;r.onresult=(e:any)=>{let t="";for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;setInput(t.trim());};r.onend=()=>{dictationRef.current=null;};r.onerror=()=>{dictationRef.current=null;};try{r.start();}catch{}}
  function newChat(){setMessages([]);setConversationId(null);setInput("");setView("chat");window.history.replaceState({}, "", "/assistant");}
  const active=view==="images"?"images":view==="library"?"library":"chat";
  return <WorkspaceShell active={active} title={view==="chat"?"ZenixMind":view==="images"?"Images":"Library"}>
    <div className="h-[calc(100dvh-58px)] bg-[#050506] text-zinc-100">
      {view==="chat" && <ChatView messages={messages} loading={loading} input={input} setInput={setInput} send={()=>void send()} busy={busy} dictate={dictate}/>}
      {view==="images" && <ImagesView/>}
      {view==="library" && <LibraryView/>}
      {settings && <SettingsPanel onClose={()=>{setSettings(false);window.history.replaceState({}, "", "/assistant");}}/>}
    </div>
  </WorkspaceShell>;
}
