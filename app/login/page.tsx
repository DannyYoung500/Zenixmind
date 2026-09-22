import Link from "next/link";

export default function LoginPage() {
  return <main className="grid min-h-screen place-items-center bg-[#050507] px-6 text-white"><div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[.03] p-8"><Link href="/" className="text-sm text-zinc-500">← Home</Link><h1 className="mt-10 text-2xl font-semibold">Welcome to ZenixMind</h1><p className="mt-2 text-sm text-zinc-500">Authentication will connect to Supabase in the next stage.</p><button className="mt-8 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black">Continue</button></div></main>;
}
