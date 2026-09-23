import React, { useRef, useEffect } from 'react';

export type VoiceState = 'listening' | 'thinking' | 'speaking' | 'muted' | 'reconnecting' | 'error';

interface VoiceSunOrbProps {
  state: VoiceState;
  audioLevel?: number; // 0 to 1
  size?: number; // diameter in px
  className?: string;
  onClick?: () => void;
}

/**
 * Distinctive ZenixMind Voice Orb inspired by a shining SUN 🌞:
 * - Bright central solar core with dynamic temperature & plasma shimmer
 * - Multi-layer radiant coronal glow
 * - Gentle rotating solar rays and corona filaments
 * - Realistic reactive state physics:
 *   - Listening: gentle breathing/pulse (solar calm, soft solar wind)
 *   - Thinking: slower intelligent rotation with undulating convective cells
 *   - Speaking: rhythmic dynamic solar radiance reacting to voice volume
 *   - Muted: dimmed, cool ember state
 *   - Error: calm warm crimson warning solar flare
 */
export function VoiceSunOrb({
  state,
  audioLevel = 0,
  size = 360,
  className = '',
  onClick
}: VoiceSunOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const rotationRef = useRef(0);
  const audioLevelSmoothed = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const coreBaseRadius = size * 0.22;

    const render = () => {
      timeRef.current += 0.018;
      const t = timeRef.current;

      // Smooth audio level response
      audioLevelSmoothed.current += (audioLevel - audioLevelSmoothed.current) * 0.2;
      const smoothedLevel = Math.max(0, Math.min(1, audioLevelSmoothed.current));

      // Rotation speed depends on state
      let rotSpeed = 0.004;
      if (state === 'thinking') rotSpeed = 0.009;
      if (state === 'speaking') rotSpeed = 0.006 + smoothedLevel * 0.012;
      if (state === 'muted') rotSpeed = 0.001;
      rotationRef.current += rotSpeed;
      const rot = rotationRef.current;

      ctx.clearRect(0, 0, size, size);

      // Color Palette based on State
      let primaryGlow = 'rgba(251, 191, 36, '; // Amber-400
      let secondaryGlow = 'rgba(245, 158, 11, '; // Amber-500
      let coreColor = '#fffbeb'; // Light solar core
      let coronaRaysColor = 'rgba(252, 211, 77, '; // Amber-300

      if (state === 'thinking') {
        // Deep intelligent golden-indigo fusion
        primaryGlow = 'rgba(245, 158, 11, ';
        secondaryGlow = 'rgba(217, 119, 6, ';
        coreColor = '#fef3c7';
        coronaRaysColor = 'rgba(251, 191, 36, ';
      } else if (state === 'speaking') {
        // High radiant warmth & brightness
        primaryGlow = 'rgba(251, 191, 36, ';
        secondaryGlow = 'rgba(249, 115, 22, '; // Orange-500
        coreColor = '#ffffff';
        coronaRaysColor = 'rgba(254, 240, 138, ';
      } else if (state === 'muted') {
        // Cool dormant ember
        primaryGlow = 'rgba(161, 161, 170, '; // Zinc-400
        secondaryGlow = 'rgba(113, 113, 122, ';
        coreColor = '#e4e4e7';
        coronaRaysColor = 'rgba(161, 161, 170, ';
      } else if (state === 'error') {
        // Calm warning crimson flare
        primaryGlow = 'rgba(239, 68, 68, ';
        secondaryGlow = 'rgba(185, 28, 28, ';
        coreColor = '#fee2e2';
        coronaRaysColor = 'rgba(248, 113, 113, ';
      }

      // Dynamic Pulse calculation
      let pulse = 1;
      if (state === 'listening') {
        // Gentle breathing pulse
        pulse = 1 + Math.sin(t * 1.8) * 0.035;
      } else if (state === 'thinking') {
        // Analytical undulating harmonic
        pulse = 1 + Math.sin(t * 3.2) * 0.02 + Math.cos(t * 1.4) * 0.015;
      } else if (state === 'speaking') {
        // Rhythmic solar flare radiance
        pulse = 1 + smoothedLevel * 0.18 + Math.sin(t * 8) * 0.02;
      } else if (state === 'muted') {
        pulse = 0.94;
      } else if (state === 'error') {
        pulse = 1 + Math.sin(t * 4) * 0.04;
      }

      const coreRadius = coreBaseRadius * pulse;

      // 1. Outermost Ambient Atmospheric Radiance (Soft outer haze)
      const outerAuraRadius = coreRadius * 2.8;
      const outerGrad = ctx.createRadialGradient(cx, cy, coreRadius * 0.8, cx, cy, outerAuraRadius);
      const outerAlpha = state === 'muted' ? 0.06 : state === 'speaking' ? 0.28 + smoothedLevel * 0.25 : 0.18;
      outerGrad.addColorStop(0, primaryGlow + outerAlpha + ')');
      outerGrad.addColorStop(0.4, secondaryGlow + (outerAlpha * 0.5) + ')');
      outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, outerAuraRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Rotating Corona Rays and Solar Flare Filaments
      const rayCount = 18;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      for (let i = 0; i < rayCount; i++) {
        const angle = (i * Math.PI * 2) / rayCount;
        const wave = Math.sin(t * 2.5 + i * 1.2);
        const rayLen =
          coreRadius * 0.35 +
          wave * (coreRadius * 0.15) +
          (state === 'speaking' ? smoothedLevel * coreRadius * 0.45 : 0);
        const rayAlpha = state === 'muted' ? 0.12 : 0.32 + (wave + 1) * 0.12;

        ctx.save();
        ctx.rotate(angle);
        ctx.strokeStyle = coronaRaysColor + rayAlpha + ')';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(coreRadius * 0.95, 0);
        ctx.lineTo(coreRadius * 0.95 + rayLen, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // 3. Counter-Rotating Inner Delicate Solar Prominences Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-rot * 0.65);
      const innerRayCount = 12;
      for (let i = 0; i < innerRayCount; i++) {
        const angle = (i * Math.PI * 2) / innerRayCount;
        const arcSpread = 0.18;
        const arcRadius = coreRadius * (1.18 + Math.sin(t * 2 + i) * 0.06);

        ctx.strokeStyle = primaryGlow + (state === 'muted' ? '0.15)' : '0.35)');
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, arcRadius, angle - arcSpread, angle + arcSpread);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Intermediate Solar Corona Gradient (Warm, Dense Light)
      const midGrad = ctx.createRadialGradient(cx, cy, coreRadius * 0.4, cx, cy, coreRadius * 1.5);
      const midAlpha = state === 'muted' ? 0.2 : 0.55 + smoothedLevel * 0.3;
      midGrad.addColorStop(0, primaryGlow + midAlpha + ')');
      midGrad.addColorStop(0.6, secondaryGlow + (midAlpha * 0.5) + ')');
      midGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = midGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Solid Luminous Solar Core (The Shining Sun)
      const coreGrad = ctx.createRadialGradient(
        cx - coreRadius * 0.15,
        cy - coreRadius * 0.15,
        coreRadius * 0.05,
        cx,
        cy,
        coreRadius
      );
      coreGrad.addColorStop(0, coreColor);
      coreGrad.addColorStop(0.35, primaryGlow + '0.98)');
      coreGrad.addColorStop(0.75, secondaryGlow + '0.92)');
      coreGrad.addColorStop(1, primaryGlow + '0.45)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // 6. Delicate Sun Surface Convection Granulation Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 0.92, 0, Math.PI * 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, audioLevel, size]);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      style={{ width: size, height: size }}
      title={`ZenixMind Sun Voice Orb (${state})`}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="pointer-events-none drop-shadow-[0_0_50px_rgba(245,158,11,0.25)]"
      />
    </div>
  );
}
