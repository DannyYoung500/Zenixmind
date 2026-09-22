import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getSupabaseServer } from "@/lib/supabase-server";
import { OWNER_EMAILS, isOwnerEmail } from "@/lib/owners";

const areas = [
  { title: "AI control", description: "Model, provider and response configuration for the assistant.", href: "/assistant" },
  { title: "Conversations", description: "Open the live assistant workspace and inspect the conversation experience.", href: "/assistant" },
  { title: "Images & Library", description: "Review the real image workspace and user file library experience.", href: "/assistant?view=images" },
  { title: "Account & access", description: "Owner access is authenticated through Supabase and restricted to the allowlist.", href: "/assistant?settings=1" },
];

export default async function OwnerDashboard() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isOwnerEmail(user.email)) redirect("/dashboard");

  const [{ count: conversations }, { count: messages }, { count: libraryItems }] = await Promise.all([
    supabase.from("conversations").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
    supabase.from("library_items").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    ["Conversations", conversations ?? 0, "Live database count"],
    ["Messages", messages ?? 0, "Live database count"],
    ["Library items", libraryItems ?? 0, "Live database count"],
    ["Owner access", OWNER_EMAILS.length, "Allowlisted accounts"],
  ];

  return (
    <WorkspaceShell active="owner" title="Owner">
      <div className="min-h-full bg-[#050506]">
        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
          <header className="flex flex-col gap-5 border-b border-white/[.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-light uppercase tracking-[.18em] text-zinc-600">ZenixMind / Owner</p>
              <h1 className="mt-2 text-[28px] font-light tracking-[-.04em] text-zinc-100 sm:text-[34px]">Control center</h1>
              <p className="mt-2 max-w-2xl text-sm font-light leading-6 text-zinc-600">A private workspace for the systems that power ZenixMind.</p>
            </div>
            <div className="rounded-full border border-emerald-400/15 bg-emerald-400/[.04] px-3 py-1.5 text-[11px] font-light text-emerald-300">Authenticated owner</div>
          </header>

          <section className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[.06] bg-white/[.06] lg:grid-cols-4">
            {stats.map(([label, value, note]) => (
              <div key={String(label)} className="bg-[#0b0b0d] px-5 py-5 sm:px-6">
                <p className="text-[11px] font-light text-zinc-600">{label}</p>
                <p className="mt-2 text-2xl font-light tracking-[-.03em] text-zinc-100">{String(value)}</p>
                <p className="mt-1 text-[10px] font-light text-zinc-700">{note}</p>
              </div>
            ))}
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-light uppercase tracking-[.16em] text-zinc-600">Platform</p>
                  <h2 className="mt-2 text-lg font-light text-zinc-100">Management areas</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {areas.map((area, index) => (
                  <a key={area.title} href={area.href} className="group flex items-center gap-4 rounded-2xl border border-white/[.06] bg-[#0b0b0d] px-5 py-4 transition hover:border-white/[.1] hover:bg-[#0e0e10]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#151517] text-xs font-light text-zinc-500">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-light text-zinc-200">{area.title}</span>
                      <span className="mt-1 block text-xs font-light leading-5 text-zinc-600">{area.description}</span>
                    </span>
                    <span className="text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-300">→</span>
                  </a>
                ))}
              </div>
            </section>

            <aside className="space-y-3">
              <div className="rounded-2xl border border-white/[.06] bg-[#0b0b0d] p-5">
                <p className="text-[11px] font-light uppercase tracking-[.16em] text-zinc-600">Current session</p>
                <p className="mt-4 truncate text-sm font-light text-zinc-200">{user.email}</p>
                <p className="mt-1 text-xs font-light text-zinc-700">Authenticated with Supabase</p>
              </div>
              <div className="rounded-2xl border border-white/[.06] bg-[#0b0b0d] p-5">
                <p className="text-[11px] font-light uppercase tracking-[.16em] text-zinc-600">Infrastructure</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs"><span className="font-light text-zinc-600">Database</span><span className="font-light text-zinc-300">Supabase</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="font-light text-zinc-600">App</span><span className="font-light text-zinc-300">Next.js</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="font-light text-zinc-600">Deployment</span><span className="font-light text-zinc-300">Vercel</span></div>
                </div>
              </div>
            </aside>
          </div>

          <section className="mt-8">
            <div className="mb-4">
              <p className="text-[11px] font-light uppercase tracking-[.16em] text-zinc-600">Access</p>
              <h2 className="mt-2 text-lg font-light text-zinc-100">Authorized owners</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {OWNER_EMAILS.map((email) => (
                <div key={email} className={"rounded-2xl border px-4 py-3.5 text-xs font-light " + (email.toLowerCase() === user.email?.toLowerCase() ? "border-white/[.1] bg-[#111113] text-zinc-200" : "border-white/[.05] bg-[#0a0a0c] text-zinc-600")}>
                  {email}
                  {email.toLowerCase() === user.email?.toLowerCase() && <span className="ml-2 text-[10px] text-zinc-700">current</span>}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </WorkspaceShell>
  );
}
