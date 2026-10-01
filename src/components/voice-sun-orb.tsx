import React, { useEffect, useRef } from 'react';

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
 * ZenixMind Voice Orb
 *
 * Production-grade fluid orb inspired by ChatGPT Voice Mode / VoiceOrbs plasma patterns:
 * - Canvas 2D organic blob (no Three.js — mobile-safe)
 * - States: idle · listening · thinking · speaking · muted · error
 * - Smoothed Web Audio level drives scale, glow, and distortion
 * - prefers-reduced-motion + pause when off-screen
 */
export function VoiceSunOrb({
  state,
  audioLevel = 0,
  size = 200,
  className = '',
  onClick
}: VoiceSunOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const levelSmooth = useRef(0);
  const stateRef = useRef(state);
  const levelRef = useRef(audioLevel);
  const rafRef = useRef(0);
  const t0 = useRef(performance.now());
  const visibleRef = useRef(true);

  stateRef.current = state;
  levelRef.current = audioLevel;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = size;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(w * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${w}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(wrap);

    const paletteFor = (s: VoiceState) => {
      switch (s) {
        case 'listening':
          return { core: [56, 189, 248], mid: [99, 102, 241], rim: [167, 139, 250] };
        case 'thinking':
          return { core: [167, 139, 250], mid: [129, 140, 248], rim: [56, 189, 248] };
        case 'speaking':
          return { core: [45, 212, 191], mid: [56, 189, 248], rim: [129, 140, 248] };
        case 'error':
          return { core: [248, 113, 113], mid: [251, 146, 60], rim: [244, 63, 94] };
        case 'reconnecting':
        case 'connecting':
          return { core: [129, 140, 248], mid: [99, 102, 241], rim: [56, 189, 248] };
        case 'muted':
          return { core: [113, 113, 122], mid: [82, 82, 91], rim: [63, 63, 70] };
        default:
          return { core: [99, 102, 241], mid: [56, 189, 248], rim: [167, 139, 250] };
      }
    };

    const drawBlob = (
      cx: number,
      cy: number,
      radius: number,
      t: number,
      energy: number,
      points: number,
      noiseAmp: number
    ) => {
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const a = (i / points) * Math.PI * 2;
        // Layered organic displacement (simplex-like via sines)
        const n =
          Math.sin(a * 3 + t * 1.4) * 0.35 +
          Math.sin(a * 5 - t * 0.9) * 0.22 +
          Math.sin(a * 7 + t * 1.1) * 0.12 +
          Math.cos(a * 2 - t * 0.6) * 0.18;
        const r = radius * (1 + n * noiseAmp * (0.55 + energy * 0.9));
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);
      if (!visibleRef.current && document.visibilityState === 'hidden') return;

      const s = stateRef.current;
      const targetLevel = Math.max(0, Math.min(1, levelRef.current));
      // Smooth amplitude — critical for non-jittery orb (VoiceOrbs / industry best practice)
      levelSmooth.current += (targetLevel - levelSmooth.current) * 0.14;
      const level = levelSmooth.current;

      const t = (now - t0.current) / 1000;
      const w = size;
      const cx = w / 2;
      const cy = w / 2;

      ctx.clearRect(0, 0, w, w);

      if (reduced) {
        const p = paletteFor(s);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.38);
        g.addColorStop(0, `rgba(${p.core[0]},${p.core[1]},${p.core[2]},0.95)`);
        g.addColorStop(0.55, `rgba(${p.mid[0]},${p.mid[1]},${p.mid[2]},0.45)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.32, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      // State energy baselines
      let baseEnergy = 0.12;
      let noiseAmp = 0.12;
      let spin = 0.35;
      if (s === 'listening') {
        baseEnergy = 0.28 + level * 0.7;
        noiseAmp = 0.18 + level * 0.22;
        spin = 0.9 + level * 0.8;
      } else if (s === 'thinking') {
        baseEnergy = 0.35;
        noiseAmp = 0.16;
        spin = 1.4;
      } else if (s === 'speaking') {
        baseEnergy = 0.45 + level * 0.55;
        noiseAmp = 0.2 + level * 0.28;
        spin = 1.1 + level;
      } else if (s === 'error') {
        baseEnergy = 0.4;
        noiseAmp = 0.22;
        spin = 0.5;
      } else if (s === 'muted') {
        baseEnergy = 0.06;
        noiseAmp = 0.06;
        spin = 0.15;
      } else if (s === 'connecting' || s === 'reconnecting') {
        baseEnergy = 0.25;
        noiseAmp = 0.14;
        spin = 1.8;
      }

      const energy = Math.min(1, baseEnergy);
      const p = paletteFor(s);
      const breath = 1 + Math.sin(t * (0.9 + spin * 0.3)) * (0.02 + energy * 0.04);
      const radius = w * 0.28 * breath * (1 + level * 0.08);

      // Outer bloom
      const bloom = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 2.1);
      bloom.addColorStop(
        0,
        `rgba(${p.core[0]},${p.core[1]},${p.core[2]},${0.35 + energy * 0.35})`
      );
      bloom.addColorStop(
        0.45,
        `rgba(${p.mid[0]},${p.mid[1]},${p.mid[2]},${0.12 + energy * 0.15})`
      );
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 2.1, 0, Math.PI * 2);
      ctx.fill();

      // Soft halo ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.25 * spin);
      ctx.translate(-cx, -cy);
      const ringGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
      ringGrad.addColorStop(0, `rgba(${p.rim[0]},${p.rim[1]},${p.rim[2]},0)`);
      ringGrad.addColorStop(0.5, `rgba(${p.rim[0]},${p.rim[1]},${p.rim[2]},${0.35 + energy * 0.3})`);
      ringGrad.addColorStop(1, `rgba(${p.core[0]},${p.core[1]},${p.core[2]},0)`);
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 1.5 + energy * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Thinking: orbiting particles
      if (s === 'thinking' || s === 'connecting' || s === 'reconnecting') {
        for (let i = 0; i < 7; i++) {
          const ang = t * 1.3 + (i / 7) * Math.PI * 2;
          const rr = radius * 1.45 + Math.sin(t * 2 + i) * 4;
          const px = cx + Math.cos(ang) * rr;
          const py = cy + Math.sin(ang) * rr;
          ctx.beginPath();
          ctx.fillStyle = `rgba(${p.rim[0]},${p.rim[1]},${p.rim[2]},${0.45 + (i % 3) * 0.15})`;
          ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Fluid body (outer soft blob)
      ctx.save();
      drawBlob(cx, cy, radius * 1.08, t * spin, energy, 64, noiseAmp * 1.15);
      const bodyOuter = ctx.createRadialGradient(
        cx - radius * 0.25,
        cy - radius * 0.3,
        0,
        cx,
        cy,
        radius * 1.2
      );
      bodyOuter.addColorStop(0, `rgba(${p.core[0]},${p.core[1]},${p.core[2]},0.55)`);
      bodyOuter.addColorStop(0.55, `rgba(${p.mid[0]},${p.mid[1]},${p.mid[2]},0.28)`);
      bodyOuter.addColorStop(1, `rgba(${p.rim[0]},${p.rim[1]},${p.rim[2]},0.05)`);
      ctx.fillStyle = bodyOuter;
      ctx.fill();
      ctx.restore();

      // Core blob
      ctx.save();
      drawBlob(cx, cy, radius * 0.72, t * spin * 1.15 + 1.2, energy, 48, noiseAmp);
      const core = ctx.createRadialGradient(
        cx - radius * 0.15,
        cy - radius * 0.2,
        0,
        cx,
        cy,
        radius * 0.85
      );
      core.addColorStop(0, `rgba(255,255,255,${0.55 + energy * 0.25})`);
      core.addColorStop(0.25, `rgba(${p.core[0]},${p.core[1]},${p.core[2]},0.9)`);
      core.addColorStop(0.7, `rgba(${p.mid[0]},${p.mid[1]},${p.mid[2]},0.55)`);
      core.addColorStop(1, `rgba(${p.rim[0]},${p.rim[1]},${p.rim[2]},0.12)`);
      ctx.fillStyle = core;
      ctx.shadowColor = `rgba(${p.core[0]},${p.core[1]},${p.core[2]},0.65)`;
      ctx.shadowBlur = 18 + energy * 28;
      ctx.fill();
      ctx.restore();

      // Specular highlight
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.18 + energy * 0.12})`;
      ctx.ellipse(
        cx - radius * 0.22,
        cy - radius * 0.28,
        radius * 0.22,
        radius * 0.12,
        -0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Listening / speaking: reactive arc ticks
      if ((s === 'listening' || s === 'speaking') && level > 0.04) {
        const bars = 12;
        for (let i = 0; i < bars; i++) {
          const a = (i / bars) * Math.PI * 2 + t * (s === 'speaking' ? 0.8 : -0.5);
          const h = (4 + level * 18) * (0.5 + 0.5 * Math.sin(t * 4 + i));
          const x0 = cx + Math.cos(a) * (radius * 1.22);
          const y0 = cy + Math.sin(a) * (radius * 1.22);
          const x1 = cx + Math.cos(a) * (radius * 1.22 + h);
          const y1 = cy + Math.sin(a) * (radius * 1.22 + h);
          ctx.strokeStyle = `rgba(${p.core[0]},${p.core[1]},${p.core[2]},${0.25 + level * 0.5})`;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }
    };

    rafRef.current = requestAnimationFrame(frame);

    const onVis = () => {
      /* loop continues; visibility gated inside frame */
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [size]);

  const label =
    state === 'listening'
      ? 'Listening'
      : state === 'thinking'
        ? 'Thinking'
        : state === 'speaking'
          ? 'Speaking'
          : state === 'muted'
            ? 'Muted'
            : state === 'error'
              ? 'Error'
              : state === 'connecting' || state === 'reconnecting'
                ? 'Connecting'
                : 'Ready';

  return (
    <div
      ref={wrapRef}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={`ZenixMind voice · ${label}`}
      className={`relative inline-flex items-center justify-center select-none ${
        onClick ? 'cursor-pointer' : 'pointer-events-none'
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas ref={canvasRef} className="block rounded-full" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default VoiceSunOrb;
