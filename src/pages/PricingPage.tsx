import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/brand-mark';
import { WorkspaceShell } from '../components/workspace-shell';
import { useAuth } from '../lib/auth-context';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

const freeFeatures = [
  'Unlimited conversations with ZenixMind AI Models',
  'Continuous conversation history & search',
  'Interactive Voice Orb speech dialogue',
  'Images studio concept generation',
  'Personal workspace library & attachments',
  'Custom AI personalization & memory'
];

const proFeatures = [
  'All Free workspace capabilities',
  'Priority access during peak loads',
  'Ultra-high fidelity image generation models',
  'Extended reasoning context windows',
  'Dedicated cloud sync across all devices',
  'Early access to experimental toolkits'
];

function PricingContent({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Plans & Access
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl text-zinc-100">
          Built to grow with ZenixMind.
        </h1>
        <p className="mt-3.5 text-xs sm:text-sm leading-6 text-zinc-400">
          The assistant is engineered as one unified ecosystem. Access core capabilities today while advanced tiers evolve.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Free Active Plan */}
        <div className="relative rounded-[26px] border border-white/[.12] bg-[#0c0c0e] p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,.35)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Free Workspace</h2>
                <div className="mt-1 text-2xl font-bold text-zinc-100">$0 <span className="text-xs font-normal text-zinc-500">/ forever</span></div>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
                {signedIn ? 'Active Now' : 'Available'}
              </span>
            </div>

            <p className="mt-4 text-xs leading-5 text-zinc-400">
              Complete access to ZenixMind assistant, speech, and library features in development.
            </p>

            <div className="mt-6 space-y-3 pt-6 border-t border-white/[.05]">
              {freeFeatures.map((f) => (
                <div key={f} className="flex items-start gap-2.5 text-xs text-zinc-300">
                  <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4">
            {signedIn ? (
              <Link
                to="/assistant"
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black hover:bg-zinc-200 transition-all w-full text-center"
              >
                <span>Go to Assistant</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                to="/signup"
                className="block rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black hover:bg-zinc-200 transition-all text-center"
              >
                Get Started Free
              </Link>
            )}
          </div>
        </div>

        {/* Pro Plan */}
        <div className="relative rounded-[26px] border border-dashed border-white/[.1] bg-[#08080a] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-zinc-200">ZenixMind Pro</h2>
                  <Sparkles size={16} className="text-amber-400" />
                </div>
                <div className="mt-1 text-xs text-zinc-500">Tier roadmap</div>
              </div>
              <span className="rounded-full border border-white/[.08] bg-[#141417] px-3 py-1 text-[10px] uppercase font-medium text-zinc-400">
                Coming Soon
              </span>
            </div>

            <p className="mt-4 text-xs leading-5 text-zinc-500">
              Elevated compute quotas and dedicated enterprise capability models.
            </p>

            <div className="mt-6 space-y-3 pt-6 border-t border-white/[.04]">
              {proFeatures.map((f) => (
                <div key={f} className="flex items-start gap-2.5 text-xs text-zinc-400">
                  <Check size={14} className="text-zinc-600 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4">
            <div className="rounded-xl border border-white/[.05] bg-black/40 p-3.5 text-center text-xs text-zinc-500">
              No payment required. All features unlocked in preview.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingPage() {
  const { user } = useAuth();

  if (user) {
    return (
      <WorkspaceShell active="plans" title="Plans">
        <PricingContent signedIn={true} />
      </WorkspaceShell>
    );
  }

  return (
    <main className="min-h-screen bg-[#050506] text-zinc-100">
      <header className="flex h-[72px] items-center justify-between border-b border-white/[.06] px-5 sm:px-8 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <BrandMark size={34} />
          <span className="text-[15px] font-semibold text-white">ZenixMind</span>
        </Link>
        <Link
          to="/login"
          className="rounded-xl border border-white/[.08] px-4 py-2 text-xs text-zinc-300 hover:bg-white/[.04] hover:text-white"
        >
          Sign in
        </Link>
      </header>
      <PricingContent signedIn={false} />
    </main>
  );
}
