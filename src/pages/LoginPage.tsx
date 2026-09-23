import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { useAuth } from '../lib/auth-context';
import { ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, setUserDirect } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/assistant');
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoginAsOwner = () => {
    setUserDirect({
      id: 'usr_danny',
      email: 'dannyyoungofficial1@gmail.com',
      name: 'Danny Young',
      isOwner: true
    });
    navigate('/assistant');
  };

  return (
    <main className="min-h-screen bg-[#050506] text-white flex flex-col justify-between selection:bg-zinc-700">
      <div className="hero-grid pointer-events-none fixed inset-0 opacity-40" />

      <header className="relative z-10 p-5 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-xs font-medium">Back to ZenixMind</span>
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3">
            <BrandMark size={42} />
            <span className="text-xl font-semibold tracking-tight">ZenixMind</span>
          </div>

          <div className="rounded-[28px] border border-white/[.08] bg-[#0c0c0e]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center sm:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
              <p className="mt-1.5 text-xs text-zinc-500">
                Log in to continue to your AI workspace.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/[.08] bg-black/30 p-1">
              <span className="rounded-lg bg-[#1a1a1d] py-2 text-center text-xs font-medium text-white border border-white/[.1]">
                Log in
              </span>
              <Link
                to="/signup"
                className="rounded-lg py-2 text-center text-xs font-medium text-zinc-500 hover:text-white transition-colors"
              >
                Sign up
              </Link>
            </div>

            {/* Quick Demo Login Option */}
            <button
              type="button"
              onClick={handleQuickLoginAsOwner}
              className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 py-2.5 text-xs font-medium text-amber-300 hover:bg-amber-400/20 transition-all"
            >
              <ShieldCheck size={14} />
              <span>Quick Login as Danny Young (Owner)</span>
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-white/[.08] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-white/[.25]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/[.08] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-white/[.25]"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white py-3 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-sm mt-2"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[11px] text-zinc-600">
            By signing in you agree to ZenixMind terms of service & privacy policy.
          </p>
        </div>
      </div>

      <div className="p-4" />
    </main>
  );
}

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, name);
      navigate('/assistant');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050506] text-white flex flex-col justify-between selection:bg-zinc-700">
      <div className="hero-grid pointer-events-none fixed inset-0 opacity-40" />

      <header className="relative z-10 p-5 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2.5 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span className="text-xs font-medium">Back to ZenixMind</span>
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3">
            <BrandMark size={42} />
            <span className="text-xl font-semibold tracking-tight">ZenixMind</span>
          </div>

          <div className="rounded-[28px] border border-white/[.08] bg-[#0c0c0e]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 text-center sm:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Create your account</h1>
              <p className="mt-1.5 text-xs text-zinc-500">
                Join ZenixMind to start thinking and creating.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/[.08] bg-black/30 p-1">
              <Link
                to="/login"
                className="rounded-lg py-2 text-center text-xs font-medium text-zinc-500 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <span className="rounded-lg bg-[#1a1a1d] py-2 text-center text-xs font-medium text-white border border-white/[.1]">
                Sign up
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Danny Young"
                  required
                  className="w-full rounded-xl border border-white/[.08] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-white/[.25]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-white/[.08] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-white/[.25]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  className="w-full rounded-xl border border-white/[.08] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-white/[.25]"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white py-3 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-sm mt-2"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[11px] text-zinc-600">
            By signing up you agree to ZenixMind terms of service & privacy policy.
          </p>
        </div>
      </div>

      <div className="p-4" />
    </main>
  );
}
