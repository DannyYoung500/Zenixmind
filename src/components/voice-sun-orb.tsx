import React from 'react';

export type VoiceState = 'listening' | 'thinking' | 'speaking' | 'muted' | 'reconnecting' | 'error';

interface VoiceSunOrbProps {
  state: VoiceState;
  audioLevel?: number;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * ZenixMind Aurora Core.
 *
 * A completely new voice visual: no sun, no yellow, no fake controls.
 * The orb is a passive state visualization that lives above the composer.
 */
export function VoiceSunOrb({
  state,
  audioLevel = 0,
  size = 160,
  className = '',
  onClick
}: VoiceSunOrbProps) {
  const level = Math.max(0, Math.min(1, audioLevel));
  const visualState = state === 'muted' ? 'listening' : state;
  const palettes: Record<string, { a: string; b: string; c: string }> = {
    listening: { a: '#3b82f6', b: '#06b6d4', c: '#8b5cf6' },
    thinking: { a: '#8b5cf6', b: '#3b82f6', c: '#06b6d4' },
    speaking: { a: '#06b6d4', b: '#8b5cf6', c: '#3b82f6' },
    reconnecting: { a: '#3b82f6', b: '#6366f1', c: '#8b5cf6' },
    error: { a: '#ef4444', b: '#f97316', c: '#fb7185' }
  };
  const palette = palettes[visualState] || palettes.listening;
  const scale = 1 + level * 0.06;
  const glow = 0.32 + level * 0.42;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? 'ZenixMind voice ' + visualState : undefined}
      className={'relative inline-flex items-center justify-center select-none voice-orb-aurora ' + (onClick ? 'cursor-pointer' : 'pointer-events-none') + ' ' + className}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute -inset-[4%] rounded-full animate-pulse"
        style={{
          background:
            'radial-gradient(circle at 30% 28%, ' + palette.a + ' 0%, transparent 42%), ' +
            'radial-gradient(circle at 72% 66%, ' + palette.b + ' 0%, transparent 44%), ' +
            'radial-gradient(circle at 34% 76%, ' + palette.c + ' 0%, transparent 46%)',
          filter: 'blur(24px)',
          opacity: glow
        }}
      />

      <div
        className={'absolute inset-[7%] rounded-full border animate-spin ' + (visualState === 'thinking' ? 'duration-[5s]' : 'duration-[10s]')}
        style={{
          borderColor: palette.a + '55',
          boxShadow: '0 0 30px ' + palette.a + '22, inset 0 0 32px ' + palette.c + '18'
        }}
      />

      <div
        className="absolute inset-[15%] rounded-full border animate-[spin_12s_linear_infinite_reverse]"
        style={{ borderColor: palette.b + '3d' }}
      />

      {visualState === 'listening' && [0, 1].map((ring) => (
        <span
          key={ring}
          className="absolute rounded-full border animate-ping"
          style={{
            inset: (19 + ring * 7) + '%',
            borderColor: palette.b + (ring ? '24' : '42'),
            animationDelay: (ring * 650) + 'ms',
            animationDuration: (ring ? '2.8s' : '2.2s')
          }}
        />
      ))}

      <div
        className="relative overflow-hidden rounded-full transition-transform duration-200"
        style={{
          width: '54%',
          height: '54%',
          transform: 'scale(' + scale + ')',
          background:
            'radial-gradient(circle at 32% 28%, rgba(255,255,255,.96) 0%, ' +
            palette.a + ' 12%, ' + palette.c + ' 42%, #080812 76%, #020204 100%)',
          boxShadow:
            '0 0 ' + (34 + level * 42) + 'px ' + palette.a + '88, inset 0 0 28px rgba(255,255,255,.12)'
        }}
      >
        <div
          className="absolute -inset-[40%] animate-[spin_5s_linear_infinite]"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0 25%, ' + palette.b + '88 38%, transparent 51%, ' +
              palette.a + '66 68%, transparent 82%)'
          }}
        />
        <div
          className="absolute inset-[17%] rounded-full blur-[5px]"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.95), ' + palette.b + 'cc 24%, transparent 70%)'
          }}
        />
        <div className="absolute inset-[31%] rounded-full bg-white/80 blur-[3px]" />
      </div>

      {visualState === 'speaking' && (
        <div
          className="absolute rounded-full border animate-ping"
          style={{
            inset: (5 - level * 2) + '%',
            borderColor: palette.b + '55',
            animationDuration: '1.25s'
          }}
        />
      )}

      {visualState === 'thinking' && (
        <div
          className="absolute h-2.5 w-2.5 rounded-full blur-[1px] animate-ping"
          style={{ background: palette.b, boxShadow: '0 0 18px ' + palette.b }}
        />
      )}
    </div>
  );
}
