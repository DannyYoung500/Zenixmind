import React, { useEffect, useState } from 'react';
import { X, Megaphone } from 'lucide-react';

interface Banner {
  id: string;
  title?: string;
  message: string;
  type?: string;
  dismissible?: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

const DISMISS_KEY = 'zenixmind_dismissed_broadcasts';

function loadDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDismissed(ids: string[]) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(ids.slice(-50)));
  } catch {}
}

export function BroadcastBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/broadcasts/active');
        if (!res.ok) return;
        const data = await res.json();
        const list: Banner[] = Array.isArray(data.activeBanners)
          ? data.activeBanners
          : data.activeAnnouncement
            ? [data.activeAnnouncement]
            : [];
        const dismissed = new Set(loadDismissed());
        const next = list.find((b) => b && b.id && !dismissed.has(b.id) && (b as any).active !== false);
        if (!cancelled && next) setBanner(next);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!banner) return null;

  const tone =
    banner.type === 'critical'
      ? 'border-red-400/30 bg-red-500/15 text-red-100'
      : banner.type === 'warning'
        ? 'border-amber-400/30 bg-amber-500/15 text-amber-100'
        : banner.type === 'success'
          ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
          : 'border-sky-400/30 bg-sky-500/15 text-sky-100';

  const dismiss = () => {
    const ids = loadDismissed();
    ids.push(banner.id);
    saveDismissed(ids);
    setBanner(null);
  };

  return (
    <div className={`border-b ${tone} px-4 py-2.5`}>
      <div className="mx-auto max-w-5xl flex items-start gap-3">
        <Megaphone size={16} className="mt-0.5 shrink-0 opacity-80" />
        <div className="flex-1 min-w-0 text-xs leading-relaxed">
          {banner.title && <span className="font-semibold mr-1.5">{banner.title}</span>}
          <span className="opacity-90">{banner.message}</span>
          {banner.actionUrl && banner.actionLabel && (
            <a href={banner.actionUrl} className="ml-2 underline font-semibold hover:opacity-100 opacity-90">
              {banner.actionLabel}
            </a>
          )}
        </div>
        {(banner.dismissible !== false) && (
          <button type="button" onClick={dismiss} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
