"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";

type Message = { role: "user" | "assistant"; content: string };

const starters = [
  "Help me plan a new project",
  "Explain something difficult simply",
  "Write or improve something for me",
  "Research a topic with me",
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "send") return <svg {...common}><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "file") return <svg {...common}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>;
  if (name === "mic") return <svg {...common}><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  if (name === "chevron") return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("default");
  const [busy, setBusy] = useState(false);
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, model }),
      });
      const data = await response.json();
      setMessages((current) => [...current, {
        role: "assistant",
        content: data.message || data.error || "I couldn't complete that request.",
      }]);
    } catch {
      setMessages((current) => [...current, {
        role: "assistant",
        content: "ZenixMind could not reach the AI service. Check the server configuration and try again.",
      }]);
    } finally {
      setBusy(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-white/5 bg-[#08080b] p-4 lg:flex lg:flex-col">
          <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2">
            <BrandMark size={32} />
            <span className="font-semibold tracking-tight">ZenixMind</span>
          </Link>
          <button onClick={() => setMessages([])} className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-3 text-sm font-semibold text-black hover:bg-[#222]">
            <Icon name="plus" size={17} /> New chat
          </button>
          <div className="mt-8 px-2">
            <p className="text-[11px] font-medium uppercase tracking-[.14em] text-zinc-600">Workspace</p>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Your conversations, files and future connected tools will live here.</p>
          </div>
          <div className="mt-auto border-t border-white/5 pt-4">
            <Link href="/dashboard" className="block rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-black/[.45] hover:text-white">Dashboard</Link>
            <Link href="/owner" className="block rounded-xl px-3 py-3 text-sm text-zinc-500 hover:bg-black/[.45] hover:text-white">Owner console</Link>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[64px] items-center justify-between border-b border-white/5 px-4 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandMark size={29} />
              <span className="font-semibold">ZenixMind</span>
            </div>
            <div className="hidden text-sm text-zinc-400 lg:block">New conversation</div>
            <div className="relative">
              <select value={model} onChange={(e) => setModel(e.target.value)} className="appearance-none rounded-xl border border-white/8 bg-black/[.45] py-2 pl-3 pr-9 text-xs text-zinc-300 outline-none hover:bg-black/[.45]">
                <option value="default">ZenixMind · Default</option>
                <option value="fast">ZenixMind · Fast</option>
                <option value="reasoning">ZenixMind · Reasoning</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600"><Icon name="chevron" size={14}/></span>
            </div>
          </header>

          <div className="flex flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-36 pt-8 sm:px-6">
              {empty ? (
                <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
                  <BrandMark size={52} />
                  <h1 className="mt-7 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">What can I help you with?</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Ask ZenixMind anything. This workspace is ready for model connections, files, voice and creative tools.</p>
                  <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                    {starters.map((starter) => (
                      <button key={starter} onClick={() => setInput(starter)} className="rounded-2xl border border-white/8 bg-black/[.45] px-4 py-3 text-left text-sm text-zinc-400 transition hover:border-white/15 hover:bg-white/[.045] hover:text-white">
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-7 pb-8">
                  {messages.map((message, index) => (
                    <div key={index} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                      {message.role === "user" ? (
                        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-[#171717] px-5 py-3.5 text-sm leading-6 text-black">{message.content}</div>
                      ) : (
                        <div className="flex max-w-[90%] gap-3">
                          <BrandMark size={27} className="mt-1 shrink-0" />
                          <div className="whitespace-pre-wrap pt-1 text-sm leading-7 text-zinc-300">{message.content}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {busy && <div className="flex gap-3"><BrandMark size={27} className="mt-1"/><div className="flex gap-1 pt-3"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:150ms]"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 [animation-delay:300ms]"/></div></div>}
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 lg:left-[248px]">
              <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
                <form onSubmit={sendMessage} className="rounded-[24px] border border-white/10 bg-[#101014]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} rows={1} placeholder="Message ZenixMind…" className="max-h-36 min-h-[48px] w-full resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600" />
                  <div className="flex items-center justify-between px-1 pb-1">
                    <div className="flex items-center gap-1">
                      <input ref={fileRef} type="file" className="hidden" onChange={() => fileRef.current?.blur()} />
                      <button type="button" onClick={() => fileRef.current?.click()} className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 hover:bg-[#1a1a1a] hover:text-white" title="Attach file"><Icon name="file" size={18}/></button>
                      <button type="button" disabled className="grid h-9 w-9 place-items-center rounded-full text-zinc-700" title="Voice input coming soon"><Icon name="mic" size={18}/></button>
                    </div>
                    <button type="submit" disabled={!input.trim() || busy} className="grid h-9 w-9 place-items-center rounded-full bg-[#171717] text-zinc-200 border border-white/10 transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-30" title="Send"><Icon name="send" size={17}/></button>
                  </div>
                </form>
                <p className="mt-2 text-center text-[11px] text-zinc-700">ZenixMind can make mistakes. Check important information.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
