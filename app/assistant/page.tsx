import Link from "next/link";

export default function AssistantPage() {
  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <Link href="/" className="font-semibold">ZenixMind</Link>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">Back home</Link>
      </header>
      <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-3xl flex-col justify-between px-5 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">What can I help you with?</h1>
          <p className="mt-3 text-zinc-500">The ZenixMind assistant is the next build stage.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[.03] p-2">
          <div className="flex items-center gap-3 px-4 py-3 text-zinc-600">
            <span className="flex-1">Message ZenixMind…</span>
            <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Send</button>
          </div>
        </div>
      </section>
    </main>
  );
}
