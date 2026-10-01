import React from 'react';

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
 * Product voice indicator for ZenixMind.
 * Calm, website-quality presence — not a shader demo.
 */
export function VoiceSunOrb({
  state,
  audioLevel = 0,
  size = 180,
  className = '',
  onClick
}: VoiceSunOrbProps) {
  const level = Math.max(0, Math.min(1, audioLevel));
  const visual =
    state === 'muted' || state === 'idle'
      ? 'idle'
      : state === 'reconnecting' || state === 'connecting'
        ? 'thinking'
        : state;

  // Subtle scale only — never theatrical
  const scale =
    visual === 'speaking'
      ? 1 + level * 0.045
      : visual === 'listening'
        ? 1 + level * 0.035
        : visual === 'thinking'
          ? 1.015
          : 1;

  const ringOpacity =
    visual === 'listening'
      ? 0.35 + level * 0.35
      : visual === 'speaking'
        ? 0.4 + level * 0.3
        : visual === 'thinking'
          ? 0.28
          : visual === 'error'
            ? 0.45
            : 0.14;

  const coreGradient =
    visual === 'error'
      ? 'radial-gradient(circle at 35% 30%, #fecaca 0%, #f87171 28%, #7f1d1d 72%, #1c1917 100%)'
      : visual === 'speaking'
        ? 'radial-gradient(circle at 35% 30%, #f4f4f5 0%, #e4e4e7 18%, #a1a1aa 42%, #3f3f46 70%, #18181b 100%)'
        : visual === 'listening'
          ? 'radial-gradient(circle at 35% 30%, #fafafa 0%, #e4e4e7 20%, #a1a1aa 45%, #52525b 72%, #18181b 100%)'
          : visual === 'thinking'
            ? 'radial-gradient(circle at 35% 30%, #f4f4f5 0%, #d4d4d8 22%, #a1a1aa 48%, #52525b 74%, #18181b 100%)'
            : 'radial-gradient(circle at 35% 30%, #e4e4e7 0%, #a1a1aa 30%, #52525b 62%, #27272a 85%, #18181b 100%)';

  const glowColor =
    visual === 'error'
      ? 'rgba(248,113,113,0.25)'
      : visual === 'speaking'
        ? 'rgba(255,255,255,0.14)'
        : visual === 'listening'
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(255,255,255,0.06)';

  const label =
    visual === 'listening'
      ? 'Listening'
      : visual === 'thinking'
        ? 'Thinking'
        : visual === 'speaking'
          ? 'Speaking'
          : visual === 'error'
            ? 'Error'
            : 'Ready';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={`ZenixMind voice · ${label}`}
      className={`relative inline-flex items-center justify-center select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Soft ambient glow */}
      <div
        className="absolute rounded-full transition-opacity duration-500"
        style={{
          inset: '-8%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 68%)`,
          opacity: visual === 'idle' ? 0.5 : 1
        }}
      />

      {/* Thin outer ring */}
      <div
        className={`absolute rounded-full border transition-all duration-500 ${
          visual === 'thinking' ? 'animate-[pulse_2.4s_ease-in-out_infinite]' : ''
        }`}
        style={{
          inset: '6%',
          borderColor: `rgba(255,255,255,${ringOpacity})`,
          boxShadow:
            visual === 'idle'
              ? 'none'
              : `0 0 ${24 + level * 20}px rgba(255,255,255,${0.04 + level * 0.06})`
        }}
      />

      {/* Core sphere */}
      <div
        className="absolute rounded-full transition-transform duration-150 ease-out"
        style={{
          inset: '14%',
          background: coreGradient,
          transform: `scale(${scale})`,
          boxShadow:
            'inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -8px 20px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        {/* Soft highlight */}
        <div
          className="absolute rounded-full"
          style={{
            left: '18%',
            top: '14%',
            width: '42%',
            height: '28%',
            background:
              'radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, transparent 70%)',
            opacity: visual === 'idle' ? 0.35 : 0.55
          }}
        />
      </div>

      {/* Thinking: three soft dots under the sphere area via opacity on ring — keep minimal */}
      {visual === 'thinking' && (
        <div className="absolute bottom-[8%] left-1/2 flex -translate-x-1/2 gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full bg-white/50 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}

      <span className="sr-only">{label}</span>
    </div>
  );
}

export default VoiceSunOrb;
