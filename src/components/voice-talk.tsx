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
 * Only visual is the orb above the composer. Real mic level drives the orb.
 */
export function VoiceTalk({ open, busy, onClose, onVoiceMessage }: Props) {
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<VoiceState>('muted');
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef(false);
  const listeningRef = useRef(false);
  const busyRef = useRef(false);
  const lastFinalRef = useRef('');
  const restartRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const meterStartedRef = useRef(false);

  const stopMeter = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopAudio = useCallback(() => {
    stopMeter();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    meterStartedRef.current = false;
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
    }
    audioContextRef.current = null;
    analyserRef.current = null;
  }, [stopMeter]);

  const startMeter = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      meterStartedRef.current = true;
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) {
          const n = (v - 128) / 128;
          sum += n * n;
        }
        setAudioLevel(Math.min(1, Math.sqrt(sum / data.length) * 4.8));
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Meter is optional
    }
  }, []);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!text || !('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(
        text
          .replace(/[*#_`~]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\s+/g, ' ')
          .trim()
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

        // Keep recognition available while speech is playing so a user's
        // spoken interruption can cancel the current response.
        window.setTimeout(() => {
          if (listeningRef.current && !muted && !busyRef.current) {
            try {
              recognitionRef.current?.start();
            } catch {}
          }
        }, 220);
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
    },
    [muted]
  );

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
        if (answer) speak(answer);
        else setState('listening');
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
    recognition.lang = navigator.language?.startsWith('en') ? navigator.language : 'en-US';

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result?.isFinal) finalText += result[0]?.transcript || '';
      }

      const clean = finalText.trim();
      if (!clean) return;

      // A final transcript while ZenixMind is speaking is treated as an
      // interruption: stop the current voice response and process the user.
      if (speakingRef.current) {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        speakingRef.current = false;
        setState('thinking');
      }

      void handleFinal(clean);
    };

    recognition.onend = () => {
      if (listeningRef.current && !muted && !busyRef.current) {
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
    setState('thinking');
    lastFinalRef.current = '';
    let cancelled = false;

    const start = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const response = await fetch('/api/greeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: '',
            timezone,
            localTime: new Date().toISOString(),
            voice: true
          })
        });
        const data = response.ok ? await response.json() : null;
        if (!cancelled && data?.greeting) {
          void startMeter();
          speak(data.greeting);
          return;
        }
      } catch {}

      if (!cancelled) {
        void startMeter();
        startRecognition();
      };
    };

    void start();

    return () => {
      cancelled = true;
      stopAudio();
    };
  }, [open, startRecognition, startMeter, stopAudio, speak]);

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
      stopAudio();
    };
  }, [stopAudio]);

  if (!open) return null;

  const displayLevel =
    state === 'speaking'
      ? Math.max(audioLevel, 0.55)
      : state === 'thinking'
        ? Math.max(audioLevel * 0.4, 0.18)
        : state === 'listening'
          ? Math.max(audioLevel, 0.12)
          : 0.06;

  const toggleMute = () => {
    if (muted) {
      setMuted(false);
      listeningRef.current = true;
      setState('listening');
      void startMeter();
      startRecognition();
      return;
    }
    setMuted(true);
    listeningRef.current = false;
    stopRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakingRef.current = false;
    setState('muted');
  };

  const endVoice = () => {
    listeningRef.current = false;
    stopRecognition();
    if (restartRef.current) window.clearTimeout(restartRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakingRef.current = false;
    setActive(false);
    stopAudio();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
      <div className="flex w-full max-w-md flex-col items-center px-6 pb-8">
        <div className="relative grid h-[158px] w-[158px] place-items-center">
        <div className="absolute inset-[7px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,.20),rgba(139,92,246,.10)_42%,transparent_70%)] blur-xl" />
        <div className="absolute inset-[8px] rounded-full border border-cyan-300/15 [box-shadow:0_0_35px_rgba(59,130,246,.16),inset_0_0_28px_rgba(139,92,246,.10)]" />
        <div className="absolute inset-[2px] rounded-full border border-transparent bg-[conic-gradient(from_180deg,rgba(6,182,212,.55),rgba(139,92,246,.42),rgba(59,130,246,.08),rgba(6,182,212,.55))] [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude] opacity-80 animate-[spin_9s_linear_infinite]" />
        <div className="absolute inset-[18px] rounded-full bg-blue-500/10 blur-2xl animate-pulse" />
        <VoiceSunOrb
          state={state === 'muted' ? 'listening' : state}
          audioLevel={displayLevel}
          size={126}
          className="[filter:hue-rotate(168deg)_saturate(1.55)_brightness(1.12)_drop-shadow(0_0_22px_rgba(59,130,246,.28))]"
        />
      </div>

        <div className="mt-7 min-h-5 text-center text-xs text-zinc-400">
          {state === 'listening' && 'Listening…'}
          {state === 'thinking' && 'Thinking…'}
          {state === 'speaking' && 'ZenixMind is speaking…'}
          {state === 'muted' && 'Microphone muted'}
          {state === 'error' && 'Microphone access is required for voice conversation'}
        </div>

        <div className="pointer-events-auto mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-full border border-white/10 bg-white/[.06] px-5 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[.1]"
            aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={endVoice}
            className="rounded-full border border-white/10 bg-white/[.06] px-5 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[.1]"
            aria-label="End voice conversation"
          >
            End
          </button>
        </div>
      </div>
    </div>
  );
}
