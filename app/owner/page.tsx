import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { getSupabaseServer } from "@/lib/supabase-server";
import { OWNER_EMAILS, isOwnerEmail } from "@/lib/owners";

const sections = [
  ["Users", "Manage accounts and authentication as the user system grows.", "Coming next"],
  ["Conversations", "Monitor the assistant's conversation infrastructure.", "Coming next"],
  ["AI providers", "Connect and manage the models that power ZenixMind.", "Ready for integration"],
  ["Connected tools", "Manage services such as image and video providers.", "Ready for integration"],
  ["Supabase", "Your database and authentication foundation.", "Connected"],
  ["Deployment", "The production application deployment pipeline.", "Vercel-ready"]
];

export default async function OwnerDashboard() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isOwnerEmail(user.email)) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[270px] shrink-0 border-r border-white/5 bg-[#08080b] p-4 lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 px-2 py-2">
            <BrandMark size={34} />
            <span className="font-semibold tracking-tight">ZenixMind</span>
          </Link>
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/[.035] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-zinc-600">Workspace</p>
            <p className="mt-2 text-sm font-medium">Owner Dashboard</p>
            <p className="mt-1 truncate text-xs text-zinc-600">{user.email}</p>
          </div>
          <nav className="mt-6 space-y-1 text-sm">
            <Link href="/owner" className="block rounded-xl bg-white/[.07] px-3 py-3 text-white">Overview</Link>
            <Link href="/dashboard" className="block rounded-xl px-3 py-3 text-zinc-500 hover:bg-white/[.04] hover:text-white">User dashboard</Link>
            <Link href="/assistant" className="block rounded-xl px-3 py-3 text-zinc-500 hover:bg-white/[.04] hover:text-white">Assistant</Link>
          </nav>
          <div className="mt-auto border-t border-white/5 pt-4">
            <p className="px-2 text-xs text-zinc-600">Owner access is restricted by email.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex min-h-[68px] items-center justify-between border-b border-white/5 px-5 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandMark size={31} />
              <span className="font-semibold">ZenixMind</span>
            </div>
            <div className="hidden text-sm text-zinc-500 lg:block">Owner Dashboard</div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300 sm:block">Owner verified</span>
              <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white">Dashboard</Link>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-medium text-zinc-300">D</span>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
            <div>
              <p className="text-xs font-medium uppercase tracking-[.16em] text-zinc-600">ZenixMind control center</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] sm:text-4xl">Welcome, Daniel.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">This is the private owner area for managing the ZenixMind platform. Core data controls will be connected as each product system is built.</p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><p className="text-xs text-zinc-600">Authentication</p><p className="mt-3 text-lg font-medium">Supabase</p><p className="mt-1 text-xs text-emerald-300">Connected foundation</p></div>
              <div className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><p className="text-xs text-zinc-600">Owner accounts</p><p className="mt-3 text-lg font-medium">{OWNER_EMAILS.length}</p><p className="mt-1 text-xs text-zinc-500">Authorized email addresses</p></div>
              <div className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><p className="text-xs text-zinc-600">Environment</p><p className="mt-3 text-lg font-medium">Production-ready</p><p className="mt-1 text-xs text-zinc-500">Deployment foundation</p></div>
            </div>

            <section className="mt-10">
              <p className="text-xs font-medium uppercase tracking-[.16em] text-zinc-600">Platform</p>
              <h2 className="mt-2 text-xl font-semibold">Management areas</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {sections.map(([title, body, status]) => (
                  <div key={title} className="rounded-2xl border border-white/8 bg-white/[.02] p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-medium">{title}</h3>
                      <span className="rounded-full border border-white/8 px-2.5 py-1 text-[10px] text-zinc-500">{status}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-zinc-500">{body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10 rounded-2xl border border-white/8 bg-white/[.02] p-6">
              <p className="text-xs font-medium uppercase tracking-[.16em] text-zinc-600">Authorized owners</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {OWNER_EMAILS.map((email) => (
                  <div key={email} className="rounded-xl border border-white/6 bg-black/20 px-4 py-3 text-sm text-zinc-300">{email}</div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-zinc-600">These addresses are allowlisted for the owner dashboard. They still must authenticate through Supabase before access is granted.</p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
