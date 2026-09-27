import React from 'react';
import { BrandMark } from './brand-mark';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ZenixMind ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050506] text-zinc-100 grid place-items-center px-6">
          <div className="max-w-md w-full rounded-2xl border border-white/[.08] bg-[#0b0b0e] p-6 text-center shadow-xl">
            <div className="flex justify-center mb-4">
              <BrandMark size={48} className="logo-mark" />
            </div>
            <h1 className="text-base font-semibold text-white">Something went wrong</h1>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              ZenixMind hit an unexpected UI error. Your data is safe — reload to continue.
            </p>
            {this.state.message && (
              <p className="mt-3 rounded-lg border border-white/[.06] bg-black/40 px-3 py-2 text-[11px] font-mono text-zinc-500 break-words">
                {this.state.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="mt-5 w-full rounded-xl bg-white text-black text-sm font-semibold py-2.5 hover:bg-zinc-100 transition-colors"
            >
              Reload ZenixMind
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
