import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
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

  return <WorkspaceShell active="owner" title="Owner console">
    <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
      <div><p className="text-xs font-medium uppercase tracking-[.16em] text-zinc-600">ZenixMind control center</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] sm:text-3xl">Welcome to ZenixMind.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Private control center for the ZenixMind platform, infrastructure and connected product systems.</p></div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-black/[.45] p-5"><p className="text-xs text-zinc-600">Authentication</p><p className="mt-3 text-lg font-medium">Supabase</p><p className="mt-1 text-xs text-emerald-300">Connected foundation</p></div>
        <div className="rounded-2xl border border-white/8 bg-black/[.45] p-5"><p className="text-xs text-zinc-600">Owner accounts</p><p className="mt-3 text-lg font-medium">{OWNER_EMAILS.length}</p><p className="mt-1 text-xs text-zinc-500">Authorized email addresses</p></div>
        <div className="rounded-2xl border border-white/8 bg-black/[.45] p-5"><p className="text-xs text-zinc-600">Environment</p><p className="mt-3 text-lg font-medium">Production-ready</p><p className="mt-1 text-xs text-zinc-500">Deployment foundation</p></div>
      </div>
      <section className="mt-8"><p className="text-xs font-medium uppercase tracking-[.16em] text-zinc-600">Platform</p><h2 className="mt-2 text-xl font-semibold">Management areas</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{sections.map(([title,body,status])=><div key={title} className="rounded-2xl border border-white/8 bg-black/[.45] p-5"><div className="flex items-start justify-between gap-4"><h3 className="font-medium">{title}</h3><span className="rounded-full border border-white/8 px-2.5 py-1 text-[10px] text-zinc-500">{status}</span></div><p className="mt-3 text-sm leading-6 text-zinc-500">{body}</p></div>)}</div></section>
      <section className="mt-10 rounded-2xl border border-white/8 bg-black/[.45] p-6"><p className="text-xs font-medium uppercase tracking-[.16em] text-zinc-600">Authorized owners</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{OWNER_EMAILS.map((email)=><div key={email} className="rounded-xl border border-white/6 bg-black/20 px-4 py-3 text-sm text-zinc-300">{email}</div>)}</div><p className="mt-4 text-xs leading-5 text-zinc-600">These addresses are allowlisted for the owner dashboard. They still must authenticate through Supabase before access is granted.</p></section>
    </div>
  </WorkspaceShell>;
}
