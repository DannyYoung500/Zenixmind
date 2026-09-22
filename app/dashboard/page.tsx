import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getSupabaseServer } from "@/lib/supabase-server";

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = user?.user_metadata?.name?.split(" ")[0] || "there";

  return (
    <WorkspaceShell active="home" title="ZenixMind">
      <div className="flex min-h-[calc(100vh-64px)] flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 pb-20 pt-12 sm:px-8">
          <div className="mb-9 text-center">
            <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-white/[.08] bg-[#0b0b0d]"><BrandMark size={27} /></div>
            <h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">How can I help, {firstName}?</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600">Ask a question, explore an idea, write something, or work with ZenixMind.</p>
          </div>

          <Link href="/assistant" className="group rounded-[24px] border border-white/[.09] bg-[#0b0b0d] p-4 shadow-[0_20px_70px_rgba(0,0,0,.25)] transition hover:border-white/[.15] hover:bg-[#0e0e10]">
            <div className="min-h-[92px] px-2 pt-1 text-sm text-zinc-700">Ask ZenixMind anything…</div>
            <div className="flex items-center justify-between pt-4">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#151517] text-zinc-500"><Icon name="plus" /></span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#171719] text-zinc-500 transition group-hover:text-zinc-200">↑</span>
            </div>
          </Link>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["Write something", "Analyze a file", "Brainstorm ideas", "Learn something"].map((item) => (
              <Link key={item} href="/assistant" className="rounded-xl border border-white/[.06] bg-[#09090b] px-3 py-3 text-left text-[11px] text-zinc-500 hover:border-white/[.1] hover:bg-[#0d0d0f] hover:text-zinc-200">{item}</Link>
            ))}
          </div>
        </div>
        <p className="pb-5 text-center text-[10px] text-zinc-700">ZenixMind can make mistakes. Check important information.</p>
      </div>
    </WorkspaceShell>
  );
}
