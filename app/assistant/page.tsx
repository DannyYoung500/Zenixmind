"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";

type Message = { role: "user" | "assistant"; content: string };

function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "menu") return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === "chat") return <svg {...common}><path d="M5 5h14v10H8l-3 3V5Z" /></svg>;
  if (name === "grid") return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z" /></svg>;
  if (name === "file") return <svg {...common}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>;
  if (name === "mic") return <svg {...common}><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  if (name === "wave") return <svg {...common}><path d="M5 10v4M9 7v10M13 4v16M17 8v8M21 10v4"/></svg>;
  if (name === "chevron") return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6"/></svg>;
  if (name === "settings") return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2H15V5a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2V14H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("fast");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, model }) });
      const data = await response.json();
      setMessages((current) => [...current, { role: "assistant", content: data.message || data.error || "I couldn't complete that request." }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "ZenixMind could not reach the AI service. Check the server configuration and try again." }]);
    } finally {
      setBusy(false);
    }
  }

  const empty = messages.length === 0;

  const sidebar = (
    <aside className="flex h-full w-[278px] shrink-0 flex-col border-r border-white/[.055] bg-[#080809] px-3 py-4">
      <div className="flex items-center justify-between px-2 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5"><BrandMark size={31}/><span className="text-[15px] font-semibold tracking-[-.02em]">ZenixMind</span></Link>
        <button onClick={() => setSidebarOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 hover:bg-[#111113] hover:text-zinc-200 lg:hidden"><Icon name="menu" size={18}/></button>
      </div>
      <Link href="/assistant" onClick={() => setMessages([])} className="flex h-11 items-center gap-3 rounded-xl bg-[#111113] px-3.5 text-sm font-medium text-zinc-100 ring-1 ring-white/[.06] transition hover:bg-[#171719]"><Icon name="plus"/> New chat</Link>
      <button className="mt-2 flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-sm text-zinc-500 hover:bg-[#101012] hover:text-zinc-200"><Icon name="search"/> Search chats <span className="ml-auto rounded-md border border-white/[.05] px-1.5 py-0.5 text-[9px] text-zinc-700">⌘K</span></button>
      <nav className="mt-5 space-y-1">
        <Link href="/assistant" className="flex items-center gap-3 rounded-xl bg-[#111113] px-3.5 py-2.5 text-sm text-zinc-100"><Icon name="chat" size={18}/> Chat</Link>
        <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-zinc-500 hover:bg-[#101012] hover:text-zinc-200"><Icon name="grid" size={18}/> Workspace</Link>
        <Link href="/pricing" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-zinc-500 hover:bg-[#101012] hover:text-zinc-200"><Icon name="spark" size={18}/> Plans</Link>
      </nav>
      <div className="mt-7 min-h-0 flex-1 overflow-hidden">
        <div className="px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-700">Recent</div>
        <div className="mt-2 space-y-0.5 overflow-y-auto">
          {["Build a modern website", "Create a business plan", "Explain a difficult idea", "Generate an image", "Research AI tools", "Plan my next project"].map((title, i) => (
            <button key={title} onClick={() => setInput(title)} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#101012]">
              <span className="text-zinc-700"><Icon name="chat" size={16}/></span><span className="min-w-0 flex-1 truncate text-[12px] text-zinc-500 group-hover:text-zinc-200">{title}</span><span className="text-[9px] text-zinc-700">{i < 2 ? "2m" : (i + 1) + "h"}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-white/[.055] pt-3">
        <Link href="/owner" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-zinc-600 hover:bg-[#101012] hover:text-zinc-200"><Icon name="settings" size={17}/> Settings & account</Link>
        <Link href="/dashboard" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-zinc-600 hover:bg-[#101012] hover:text-zinc-200"><Icon name="arrow" size={17}/> Back to workspace</Link>
      </div>
    </aside>
  );

  return (
    <main className="h-[100dvh] overflow-hidden bg-[#050506] text-zinc-100">
      <div className="flex h-full">
        <div className={sidebarOpen ? "fixed inset-0 z-50 bg-black/70 lg:hidden" : "hidden"}><div className="h-full w-[84%] max-w-[310px] shadow-2xl">{sidebar}</div></div>
        <div className="hidden lg:flex">{sidebar}</div>

        <section className="relative flex min-w-0 flex-1 flex-col bg-[#050506]">
          <header className="flex h-[76px] shrink-0 items-center justify-between px-4 sm:px-7">
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="grid h-11 w-11 place-items-center rounded-full border border-white/[.06] bg-[#0d0d0f] text-zinc-400 hover:bg-[#151517] hover:text-white lg:hidden"><Icon name="menu" size={21}/></button>
              <div className="hidden items-center gap-8 pl-2 sm:flex">
                <button className="relative py-2 text-[15px] font-semibold text-zinc-100 after:absolute after:-bottom-2 after:left-1/2 after:h-1 after:w-8 after:-translate-x-1/2 after:rounded-full after:bg-zinc-300">Ask</button>
                <button className="py-2 text-[15px] font-semibold text-zinc-600 hover:text-zinc-300">Imagine</button>
                <button className="py-2 text-[15px] font-semibold text-zinc-600 hover:text-zinc-300">Build</button>
              </div>
              <div className="sm:hidden text-sm font-semibold text-zinc-100">Ask</div>
            </div>
            <button className="grid h-11 w-11 place-items-center rounded-full border border-white/[.06] bg-[#0d0d0f] text-zinc-400 hover:bg-[#151517]" title="Private session"><span className="text-base">◉</span></button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col px-4 pb-48 sm:px-7">
              {empty ? (
                <div className="relative flex flex-1 flex-col items-center justify-center pb-8">
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center"><BrandMark size={118} className="opacity-[.075]"/></div>
                  <div className="relative z-10 text-center"><BrandMark size={48} className="mx-auto opacity-80"/><h1 className="mt-6 text-[30px] font-semibold tracking-[-.045em] sm:text-[38px]">How can ZenixMind help?</h1><p className="mt-3 text-sm text-zinc-600">Ask, create, research, or build — all from one intelligent workspace.</p></div>
                </div>
              ) : (
                <div className="space-y-8 py-8">
                  {messages.map((message, index) => <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>{message.role === "user" ? <div className="max-w-[85%] rounded-[22px] rounded-br-md bg-[#161618] px-5 py-3.5 text-sm leading-6 text-zinc-100 ring-1 ring-white/[.05]">{message.content}</div> : <div className="flex max-w-[90%] gap-3"><BrandMark size={27} className="mt-1 shrink-0"/><div className="whitespace-pre-wrap pt-1 text-sm leading-7 text-zinc-300">{message.content}</div></div>}</div>)}
                  {busy && <div className="flex gap-3"><BrandMark size={27} className="mt-1"/><div className="flex gap-1 pt-3"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:150ms]"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:300ms]"/></div></div>}
                </div>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050506] via-[#050506]/95 to-transparent pt-16">
              <div className="mx-auto max-w-[900px] px-4 pb-4 sm:px-7">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  <button onClick={() => setInput("Help me get started with a new project")} className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/[.06] bg-[#101012] px-4 text-xs font-medium text-zinc-300 hover:bg-[#171719]"><Icon name="spark" size={16}/> Zenix Start</button>
                  <button onClick={() => setInput("Help me build an app")} className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/[.06] bg-[#101012] px-4 text-xs font-medium text-zinc-300 hover:bg-[#171719]"><Icon name="grid" size={16}/> Build with Zenix</button>
                </div>
                <form onSubmit={sendMessage} className="rounded-[27px] border border-white/[.09] bg-[#171719] p-2 shadow-[0_20px_80px_rgba(0,0,0,.55)]">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} rows={1} placeholder="Ask anything" className="max-h-36 min-h-[62px] w-full resize-none bg-transparent px-3 py-2.5 text-[17px] text-zinc-100 outline-none placeholder:text-zinc-500"/>
                  <div className="flex items-center justify-between px-1 pb-1">
                    <div className="flex items-center gap-2">
                      <input ref={fileRef} type="file" className="hidden" onChange={() => fileRef.current?.blur()}/>
                      <button type="button" onClick={() => fileRef.current?.click()} className="grid h-10 w-10 place-items-center rounded-full bg-[#222225] text-zinc-300 hover:bg-[#2a2a2e]"><Icon name="plus" size={21}/></button>
                      <button type="button" onClick={() => setModel(model === "fast" ? "default" : "fast")} className="flex h-10 items-center gap-2 rounded-full bg-[#222225] px-4 text-sm font-medium text-zinc-200 hover:bg-[#2a2a2e]"><span className="text-base">ϟ</span>{model === "fast" ? "Fast" : "Default"}<Icon name="chevron" size={15}/></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled className="grid h-10 w-10 place-items-center rounded-full bg-[#222225] text-zinc-500" title="Voice input coming soon"><Icon name="mic" size={19}/></button>
                      <button type="button" onClick={() => setInput((value) => value || "Speak with ZenixMind")} className="flex h-10 items-center gap-2 rounded-full bg-zinc-100 px-5 text-sm font-semibold text-[#0a0a0b] hover:bg-zinc-200"><Icon name="wave" size={18}/> Speak</button>
                      <button type="submit" disabled={!input.trim() || busy} className="hidden h-10 w-10 place-items-center rounded-full bg-[#e8e8ea] text-black disabled:opacity-20 sm:grid" title="Send"><Icon name="arrow" size={18}/></button>
                    </div>
                  </div>
                </form>
                <div className="mt-2 text-center text-[10px] text-zinc-700">ZenixMind can make mistakes. Check important information.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
