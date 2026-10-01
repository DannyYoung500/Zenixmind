import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VoiceSunOrb, VoiceState } from './voice-sun-orb';
import { getSupabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface VoiceTalkProps {
  open: boolean;
  onClose: () => void;
}

export function VoiceTalk({ open, onClose }: VoiceTalkProps) {
  const [state, setState] = useState<VoiceState>('muted');
  const [muted, setMuted] = useState(false);
  const [active, setActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const busyRef = useRef(false);
  const speakingRef = useRef(false);
  const mutedRef = useRef(false);
  const restartRef = useRef<number | null>(null);

  mutedRef.current = muted;
  busyRef.current = busy;

  const stopMeter = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopAudio = useCallback(() => {
    stopMeter();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
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
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setAudioLevel(Math.min(1, rms * 4));
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setError('Microphone access is required');
      setState('error');
    }
  }, []);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text.trim()) {
      speakingRef.current = false;
      if (listeningRef.current && !mutedRef.current) setState('listening');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    speakingRef.current = true;
    setState('speaking');
    u.onend = () => {
      speakingRef.current = false;
      if (listeningRef.current && !mutedRef.current) setState('listening');
    };
    u.onerror = () => {
      speakingRef.current = false;
      if (listeningRef.current && !mutedRef.current) setState('listening');
    };
    window.speechSynthesis.speak(u);
  }, []);

  const handleFinal = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || busyRef.current) return;
      setBusy(true);
      setState('thinking');
      try {
        const { data: sessionData } = await getSupabase().auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: transcript.trim() }]
          })
        });
        const data = await res.json().catch(() => ({}));
        const reply =
          data?.message?.content ||
          data?.content ||
          (data?.code === 'AI_NOT_CONFIGURED'
            ? 'AI is not configured yet. Add GEMINI_API_KEY on the server.'
            : data?.error || 'I could not complete that request.');
        speak(String(reply));
      } catch {
        setState('error');
        setError('Could not reach ZenixMind');
      } finally {
        setBusy(false);
      }
    },
    [speak]
  );

  const startRecognition = useCallback(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition is not supported in this browser');
      setState('error');
      return;
    }
    try {
      recognitionRef.current?.stop();
    } catch {}
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if (final.trim()) void handleFinal(final.trim());
    };
    recognition.onerror = () => {
      if (listeningRef.current && !mutedRef.current && !busyRef.current) {
        restartRef.current = window.setTimeout(() => {
          if (listeningRef.current && !mutedRef.current) startRecognition();
        }, 400);
      }
    };
    recognition.onend = () => {
      if (listeningRef.current && !mutedRef.current && !busyRef.current && !speakingRef.current) {
        restartRef.current = window.setTimeout(() => {
          if (listeningRef.current && !mutedRef.current) startRecognition();
        }, 250);
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      listeningRef.current = true;
      if (!busyRef.current && !speakingRef.current) setState('listening');
    } catch {
      setState('error');
    }
  }, [handleFinal]);

  useEffect(() => {
    if (!open) return;
    setActive(true);
    setMuted(false);
    setError('');
    void startMeter();
    startRecognition();
    return () => {
      listeningRef.current = false;
      stopRecognition();
      if (restartRef.current) window.clearTimeout(restartRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      speakingRef.current = false;
      stopAudio();
      setActive(false);
    };
  }, [open, startMeter, startRecognition, stopAudio, stopRecognition]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) {
      stopRecognition();
      setState('muted');
    } else if (active) {
      setState('listening');
      startRecognition();
    }
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

  if (!open) return null;

  const displayLevel =
    state === 'speaking'
      ? Math.max(audioLevel, 0.25)
      : state === 'thinking'
        ? Math.max(audioLevel * 0.3, 0.08)
        : state === 'listening'
          ? audioLevel
          : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#050506]/92 backdrop-blur-md">
      <div className="flex w-full max-w-sm flex-col items-center px-6 pb-10">
        <VoiceSunOrb
          state={state === 'muted' ? 'idle' : state}
          audioLevel={displayLevel}
          size={160}
        />

        <p className="mt-8 text-center text-sm text-zinc-400 tracking-wide">
          {error
            ? error
            : state === 'listening'
              ? 'Listening'
              : state === 'thinking'
                ? 'Thinking'
                : state === 'speaking'
                  ? 'Speaking'
                  : state === 'muted'
                    ? 'Microphone off'
                    : 'Ready'}
        </p>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-full border border-white/[.08] bg-white/[.04] px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[.08] hover:text-white"
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button
            type="button"
            onClick={endVoice}
            className="inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-white/[.04] px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[.08] hover:text-white"
          >
            <X size={14} />
            End
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceTalk;
