"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { BrandMark } from "@/components/brand-mark";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const supabase = getSupabase();

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined
          }
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setMessage("Account created. Check your email to confirm your account, then log in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050506] text-white">
      <div className="hero-grid pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
        <section className="hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <Link href="/" className="flex items-center gap-3"><BrandMark size={42}/><span className="text-lg font-semibold tracking-tight">ZenixMind</span></Link>
          <div className="max-w-xl"><p className="text-sm font-medium text-zinc-500">YOUR AI, ALL IN ONE PLACE</p><h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-.045em]">One conversation for the things that matter.</h1><p className="mt-6 max-w-lg text-base leading-7 text-zinc-400">Think, create, research and get things done with ZenixMind.</p></div>
          <p className="text-sm text-zinc-600">© 2026 ZenixMind</p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden"><BrandMark size={40}/><span className="text-lg font-semibold">ZenixMind</span></div>
            <div className="rounded-[24px] border border-white/[.08] bg-[#0a0a0c]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-7">
              <div className="mb-7"><h2 className="text-2xl font-semibold tracking-tight">{isSignup ? "Create your account" : "Welcome back"}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{isSignup ? "Start your ZenixMind journey." : "Log in to continue to your assistant."}</p></div>
              <div className="mb-7 grid grid-cols-2 rounded-xl border border-white/8 bg-black/20 p-1">
                <Link href="/login" className={`rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${!isSignup ? "bg-[#171717] text-zinc-200 border border-white/10" : "text-zinc-500 hover:text-white"}`}>Log in</Link>
                <Link href="/signup" className={`rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${isSignup ? "bg-[#171717] text-zinc-200 border border-white/10" : "text-zinc-500 hover:text-white"}`}>Sign up</Link>
              </div>
              <form onSubmit={submit} className="space-y-4">
                {isSignup && <label className="block"><span className="mb-2 block text-sm text-zinc-300">Name</span><input value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name" required className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm outline-none placeholder:text-zinc-700 focus:border-white/25" placeholder="Your name"/></label>}
                <label className="block"><span className="mb-2 block text-sm text-zinc-300">Email</span><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email" required className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm outline-none placeholder:text-zinc-700 focus:border-white/25" placeholder="you@example.com"/></label>
                <label className="block"><span className="mb-2 block text-sm text-zinc-300">Password</span><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} minLength={6} required className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm outline-none placeholder:text-zinc-700 focus:border-white/25" placeholder={isSignup ? "At least 6 characters" : "Your password"}/></label>
                {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-300">{error}</div>}
                {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm leading-6 text-emerald-300">{message}</div>}
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#ededed] px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}</button>
              </form>
              <p className="mt-6 text-center text-xs leading-5 text-zinc-600">By continuing, you agree to ZenixMind&apos;s terms and privacy policy.</p>
            </div>
            <Link href="/" className="mt-6 block text-center text-sm text-zinc-600 hover:text-zinc-400">← Back to ZenixMind</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
