"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; updated_at: string };
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

function makeDictationRecognition() {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & { SpeechRecognition?: DictationConstructor; webkitSpeechRecognition?: DictationConstructor };
  const Constructor = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.continuous = false; recognition.interimResults = true; recognition.maxAlternatives = 1; recognition.lang = "en-US";
  return recognition;
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
  const [dictating, setDictating] = useState(false);
  const [dictationNotice, setDictationNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
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
    const id = new URLSearchParams(window.location.search).get("conversation");
    void loadConversations(); if (id) void loadConversation(id); else setLoading(false);
  }, []);

  function stopDictation() {
    try { dictationRef.current?.stop(); } catch {}
  }

  function startDictation() {
    if (dictating) { stopDictation(); return; }
    const recognition = makeDictationRecognition();
    if (!recognition) { setDictationNotice("Speech dictation is not supported in this browser."); return; }
    dictationRef.current = recognition; dictationBaseRef.current = input.trim() ? input.trim() + " " : "";
    recognition.onstart = () => { setDictating(true); setDictationNotice("Listening for dictation"); };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript;
      setInput(dictationBaseRef.current + transcript.trim());
    };
    recognition.onend = () => { setDictating(false); setDictationNotice(""); };
    recognition.onerror = (event) => { setDictating(false); setDictationNotice(event.error === "not-allowed" ? "Microphone permission was denied." : "Dictation could not start."); };
    try { if ("processLocally" in recognition) recognition.processLocally = true; recognition.start(); }
    catch { try { recognition.abort(); recognition.start(); } catch { setDictating(false); setDictationNotice("Dictation could not start."); } }
  }

  useEffect(() => () => stopDictation(), []);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault(); const text = input.trim(); if (!text || busy) return;
    stopDictation(); const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, model, conversationId }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Chat request failed.");
      if (data.conversationId) { setConversationId(data.conversationId); window.history.replaceState({}, "", "/assistant?conversation=" + data.conversationId); }
      setMessages((current) => [...current, { role: "assistant", content: data.message }]); void loadConversations();
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Unable to process the request." }]);
    } finally { setBusy(false); }
  }

  function newChat() {
    stopDictation(); setConversationId(null); setMessages([]); setInput(""); window.history.replaceState({}, "", "/assistant"); setSidebarOpen(false);
  }

  const empty = messages.length === 0;

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#050506] text-zinc-100">
      <div className="flex h-full">
        {sidebarOpen && <button aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/70 lg:hidden"/>}
        <aside className={(sidebarOpen ? "fixed inset-y-0 left-0 z-50 flex " : "hidden ") + "h-full w-[270px] shrink-0 flex-col border-r border-white/[.055] bg-[#080809] px-3 py-4 lg:relative lg:flex"}>
          <div className="flex items-center justify-between px-2 pb-4">
            <Link href="/assistant" onClick={newChat} className="flex items-center gap-2.5"><BrandMark size={31}/><span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span></Link>
            <button onClick={() => setSidebarOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 hover:bg-[#111113] hover:text-zinc-200 lg:hidden"><Icon name="menu" size={18}/></button>
          </div>
          <button onClick={newChat} className="flex h-11 items-center gap-3 rounded-xl bg-[#111113] px-3.5 text-sm font-medium ring-1 ring-white/[.06] hover:bg-[#171719]"><Icon name="plus"/> New chat</button>
          <button className="mt-2 flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-sm text-zinc-500 hover:bg-[#101012] hover:text-zinc-200"><Icon name="search"/> Search chats</button>
          <div className="mt-6 min-h-0 flex-1 overflow-y-auto">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-700">Your conversations</div>
            <div className="mt-2 space-y-0.5">
              {conversations.map((chat) => <Link key={chat.id} href={"/assistant?conversation=" + chat.id} onClick={() => setSidebarOpen(false)} className={(conversationId === chat.id ? "bg-[#111113] text-zinc-100 " : "text-zinc-500 ") + "flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[#101012] hover:text-zinc-200"}><Icon name="chat" size={16}/><span className="min-w-0 flex-1 truncate text-[12px]">{chat.title || "New conversation"}</span><span className="shrink-0 text-[9px] text-zinc-700">{formatTime(chat.updated_at)}</span></Link>)}
              {!conversations.length && !loading && <p className="px-3 py-4 text-xs leading-5 text-zinc-700">No conversations yet. Start your first chat below.</p>}
            </div>
          </div>
          <div className="border-t border-white/[.055] pt-3">
            <Link href="/dashboard" className="block rounded-xl px-3 py-2.5 text-xs text-zinc-600 hover:bg-[#101012] hover:text-zinc-200">Workspace</Link>
            <Link href="/owner" className="mt-1 block rounded-xl border border-white/[.05] bg-[#0d0d0f] px-3 py-2.5 text-xs text-zinc-400 hover:bg-[#121214] hover:text-white">Owner console</Link>
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex h-[70px] shrink-0 items-center justify-between px-4 sm:px-7">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/[.06] bg-[#0d0d0f] text-zinc-400 hover:bg-[#151517] lg:hidden"><Icon name="menu" size={20}/></button>
              <Link href="/assistant" onClick={newChat} className="lg:hidden"><BrandMark size={27}/></Link>
              <div className="hidden items-center gap-2 lg:flex"><BrandMark size={25}/><span className="text-sm font-semibold">ZenixMind</span></div>
            </div>
            <div className="relative">
              <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Choose AI model" className="appearance-none rounded-xl border border-white/[.07] bg-[#0d0d0f] py-2 pl-3 pr-8 text-xs text-zinc-400 outline-none hover:bg-[#121214]">
                <option value="default">Default model</option><option value="fast">Fast model</option><option value="reasoning">Reasoning model</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600"><Icon name="chevron" size={14}/></span>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex min-h-full w-full max-w-[900px] flex-col px-4 pb-48 sm:px-7">
              {loading ? <div className="flex flex-1 items-center justify-center"><BrandMark size={38} className="animate-pulse opacity-40"/></div> : empty ? (
                <div className="flex flex-1 flex-col items-center justify-center pb-8 text-center">
                  <BrandMark size={54}/><h1 className="mt-7 text-3xl font-semibold tracking-[-.045em] sm:text-[38px]">How can I help?</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">Ask ZenixMind anything. Your conversations are saved to your account.</p>
                  <div className="mt-8 grid w-full max-w-2xl grid-cols-2 gap-2">
                    {["Help me plan a project", "Explain something simply", "Write something for me", "Help me research"].map((starter) => <button key={starter} onClick={() => setInput(starter)} className="rounded-2xl border border-white/[.06] bg-[#09090b] px-4 py-3 text-left text-xs text-zinc-500 hover:border-white/[.11] hover:bg-[#0d0d0f] hover:text-zinc-200">{starter}</button>)}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 py-8">
                  {messages.map((message, index) => <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>{message.role === "user" ? <div className="max-w-[85%] rounded-[22px] rounded-br-md bg-[#171719] px-5 py-3.5 text-sm leading-6 text-zinc-100 ring-1 ring-white/[.05]">{message.content}</div> : <div className="flex max-w-[90%] gap-3"><BrandMark size={27} className="mt-1 shrink-0"/><div className="whitespace-pre-wrap pt-1 text-sm leading-7 text-zinc-300">{message.content}</div></div>}</div>)}
                  {busy && <div className="flex gap-3"><BrandMark size={27} className="mt-1"/><div className="flex gap-1 pt-3"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:150ms]"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:300ms]"/></div></div>}
                </div>
              )}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050506] via-[#050506]/95 to-transparent pt-14">
            <div className="mx-auto max-w-[900px] px-4 pb-4 sm:px-7">
              <form onSubmit={sendMessage} className="rounded-[26px] border border-white/[.09] bg-[#151517] p-2 shadow-[0_20px_80px_rgba(0,0,0,.5)]">
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} rows={1} placeholder="Ask anything" className="max-h-36 min-h-[58px] w-full resize-none bg-transparent px-3 py-2.5 text-[17px] text-zinc-100 outline-none placeholder:text-zinc-500"/>
                <div className="flex items-center justify-between px-1 pb-1">
                  <div className="flex items-center gap-2">
                    <input ref={fileRef} type="file" className="hidden"/>
                    <button type="button" onClick={() => fileRef.current?.click()} className="grid h-10 w-10 place-items-center rounded-full bg-[#222225] text-zinc-300 hover:bg-[#2a2a2e]" title="Attach file"><Icon name="plus" size={21}/></button>
                    <Link href="/assistant/voice" className="flex h-10 items-center gap-2 rounded-full bg-[#222225] px-4 text-sm font-medium text-amber-200 hover:bg-[#2a2a2e]" title="Speak — AI voice conversation"><Icon name="wave" size={17}/> Speak</Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={startDictation} className={(dictating ? "bg-amber-300/10 text-amber-200 ring-1 ring-amber-300/20 " : "bg-[#222225] text-zinc-300 ") + "grid h-10 w-10 place-items-center rounded-full hover:bg-[#2a2a2e]"} title="Microphone — dictation only" aria-label="Microphone dictation"><Icon name="mic" size={19}/></button>
                    <button type="submit" disabled={!input.trim() || busy} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-black hover:bg-zinc-200 disabled:opacity-20" title="Send"><Icon name="send" size={17}/></button>
                  </div>
                </div>
                {dictationNotice && <p className="px-3 pb-1 text-[10px] text-zinc-600">{dictationNotice}</p>}
              </form>
              <p className="mt-2 text-center text-[10px] text-zinc-700">Microphone adds words to the composer. Speak starts a separate AI voice conversation.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
