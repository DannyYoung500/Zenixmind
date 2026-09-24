import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VoiceSunOrb, VoiceState } from './voice-sun-orb';

interface Props {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onVoiceMessage: (text: string) => Promise<string | undefined>;
}

/**
 * Hands-free voice layer for the normal ZenixMind chat.
 *
 * The chat stays visible. There is no voice screen, title, prompt, button,
 * status label, or control bar. The only voice-mode visual is the small orb
 * floating above the existing composer, matching the reference interaction.
 */
export function VoiceTalk({ open, busy, onClose, onVoiceMessage }: Props) {
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<VoiceState>('muted');
  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef(false);
  const listeningRef = useRef(false);
  const busyRef = useRef(false);
  const lastFinalRef = useRef('');
  const restartRef = useRef<number | null>(null);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  const speak = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(
      text.replace(/[*#_\`~]/g, '').replace(/\s+/g, ' ').trim()
    );
    utterance.rate = 1.02;
    utterance.pitch = 1.05;

    const voices = synth.getVoices();
    const preferred = voices.find(
      (voice) =>
        /^en[-_]/i.test(voice.lang) &&
        /natural|neural|google|microsoft|siri|daniel/i.test(voice.name)
    );
    const english = voices.find((voice) => /^en[-_]/i.test(voice.lang));
    if (preferred || english) utterance.voice = preferred || english;

    utterance.onstart = () => {
      speakingRef.current = true;
      setState('speaking');
    };
    utterance.onend = () => {
      speakingRef.current = false;
      if (listeningRef.current && !muted) {
        setState('listening');
        restartRef.current = window.setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch {}
        }, 180);
      }
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      if (listeningRef.current && !muted) setState('listening');
    };

    speakingRef.current = true;
    setState('speaking');
    synth.speak(utterance);
  }, [muted]);

  const handleFinal = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || busyRef.current || speakingRef.current || clean === lastFinalRef.current) return;

      lastFinalRef.current = clean;
      busyRef.current = true;
      stopRecognition();
      setState('thinking');

      try {
        const answer = await onVoiceMessage(clean);
        if (answer) {
          speak(answer);
        } else {
          setState('listening');
        }
      } catch {
        setState('error');
      } finally {
        busyRef.current = false;
        lastFinalRef.current = '';
      }
    },
    [onVoiceMessage, speak, stopRecognition]
  );

  const startRecognition = useCallback(() => {
    if (!active || muted || busyRef.current || speakingRef.current) return;
    try {
      recognitionRef.current?.start();
      setState('listening');
    } catch {}
  }, [active, muted]);

  useEffect(() => {
    if (!open) return;

    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setState('error');
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result?.isFinal) finalText += result[0]?.transcript || '';
      }
      if (finalText.trim()) void handleFinal(finalText);
    };

    recognition.onend = () => {
      if (listeningRef.current && !muted && !busyRef.current && !speakingRef.current) {
        restartRef.current = window.setTimeout(startRecognition, 160);
      }
    };

    recognition.onerror = (event: any) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setState('error');
        listeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartRef.current) window.clearTimeout(restartRef.current);
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, [open, muted, handleFinal, startRecognition]);

  useEffect(() => {
    if (!open) return;

    listeningRef.current = true;
    setActive(true);
    setMuted(false);
    setState('listening');
    lastFinalRef.current = '';

    const timer = window.setTimeout(() => startRecognition(), 120);
    return () => window.clearTimeout(timer);
  }, [open, startRecognition]);

  useEffect(() => {
    if (open && active && !muted && !busy) startRecognition();
  }, [open, active, muted, busy, startRecognition]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {}
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (restartRef.current) window.clearTimeout(restartRef.current);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-[132px] left-1/2 z-[70] -translate-x-1/2 sm:bottom-[148px]"
    >
      <VoiceSunOrb
        state={state === 'muted' ? 'listening' : state}
        audioLevel={state === 'listening' ? 0.32 : state === 'speaking' ? 0.68 : state === 'thinking' ? 0.18 : 0.08}
        size={128}
        className="[filter:hue-rotate(165deg)_saturate(1.35)_brightness(1.08)]"
      />
    </div>
  );
}
