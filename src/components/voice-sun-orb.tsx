import React, { useEffect, useMemo, useState } from 'react';

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'muted'
  | 'reconnecting'
  | 'error'
  | 'connecting';

interface VoiceSunOrbProps {
  state: VoiceState;
  audioLevel?: number;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * ZenixMind voice indicator — product waveform capsule.
 * Inspired by current ChatGPT / Gemini Live patterns:
 * compact status, readable motion, website-native (not a full-screen demo orb).
 */
export function VoiceSunOrb({
  state,
  audioLevel = 0,
  size = 120,
  className = '',
  onClick
}: VoiceSunOrbProps) {
  const level = Math.max(0, Math.min(1, audioLevel));
  const [tick, setTick] = useState(0);

  const visual =
    state === 'muted'
      ? 'muted'
      : state === 'idle'
        ? 'idle'
        : state === 'reconnecting' || state === 'connecting'
          ? 'thinking'
          : state;

  // Gentle internal clock for thinking / idle breath (not a shader loop)
  useEffect(() => {
    if (visual !== 'thinking' && visual !== 'idle' && visual !== 'connecting') return;
    const id = window.setInterval(() => setTick((t) => t + 1), 120);
    return () => window.clearInterval(id);
  }, [visual]);

  const barCount = 5;
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      const center = Math.abs(i - (barCount - 1) / 2);
      const base = 0.28 + (1 - center / 2) * 0.22;

      if (visual === 'muted' || visual === 'idle') {
        return 0.22 + (i === 2 ? 0.08 : 0);
      }
      if (visual === 'thinking') {
        const phase = (tick + i * 2) % 10;
        return 0.25 + (phase < 5 ? phase : 10 - phase) * 0.08;
      }
      if (visual === 'error') {
        return 0.35;
      }
      // listening / speaking — audio reactive with per-bar variation
      const wave = 0.35 + level * 0.65;
      const variance = 0.85 + ((i * 17 + Math.floor(level * 20)) % 5) * 0.04;
      return Math.min(1, base * wave * variance);
    });
  }, [visual, level, tick]);

  const accent =
    visual === 'error'
      ? 'bg-red-400/90'
      : visual === 'speaking'
        ? 'bg-white/90'
        : visual === 'listening'
          ? 'bg-zinc-100/85'
          : visual === 'thinking'
            ? 'bg-zinc-300/70'
            : 'bg-zinc-500/50';

  const ring =
    visual === 'error'
      ? 'border-red-400/30 bg-red-500/[.06]'
      : visual === 'speaking' || visual === 'listening'
        ? 'border-white/[.12] bg-white/[.04]'
        : visual === 'thinking'
          ? 'border-white/[.08] bg-white/[.03]'
          : 'border-white/[.06] bg-white/[.02]';

  const label =
    visual === 'listening'
      ? 'Listening'
      : visual === 'thinking'
        ? 'Thinking'
        : visual === 'speaking'
          ? 'Speaking'
          : visual === 'error'
            ? 'Error'
            : visual === 'muted'
              ? 'Muted'
              : 'Ready';

  // Capsule proportions — product control, not a hero sphere
  const width = Math.max(96, Math.round(size * 0.95));
  const height = Math.max(40, Math.round(size * 0.38));

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={`ZenixMind voice · ${label}`}
      className={`relative inline-flex items-center justify-center select-none transition-transform duration-200 ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${className}`}
      style={{ width, height }}
    >
      <div
        className={`flex h-full w-full items-center justify-center gap-[5px] rounded-full border px-5 transition-colors duration-300 ${ring}`}
      >
        {bars.map((h, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-[height,opacity] duration-100 ease-out ${accent}`}
            style={{
              height: `${Math.max(14, Math.round(h * (height * 0.55)))}px`,
              opacity: visual === 'idle' || visual === 'muted' ? 0.45 : 0.9
            }}
          />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default VoiceSunOrb;
