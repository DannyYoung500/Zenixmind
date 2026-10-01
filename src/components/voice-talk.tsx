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
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState('');

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
      analyser.smoothingTimeConstant = 0.88;
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
        setAudioLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
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
      setHeard(transcript.trim());
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
        const text =
          data?.message?.content ||
          data?.content ||
          (data?.code === 'AI_NOT_CONFIGURED'
            ? 'AI is not configured yet. Add GEMINI_API_KEY on the server.'
            : data?.error || 'I could not complete that request.');
        setReply(String(text));
        speak(String(text));
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
    setHeard('');
    setReply('');
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
      ? Math.max(audioLevel, 0.3)
      : state === 'thinking'
        ? 0.2
        : state === 'listening'
          ? audioLevel
          : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-[#050506]/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#0b0b0e] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[.06] px-4 py-3">
          <span className="text-sm font-medium text-white">Voice</span>
          <button
            type="button"
            onClick={endVoice}
            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-[140px] space-y-3 px-4 py-4">
          {heard && (
            <div className="flex justify-end">
              <div className="max-w-[90%] rounded-2xl rounded-br-md bg-white/[.06] px-3 py-2 text-xs text-zinc-200">
                {heard}
              </div>
            </div>
          )}
          {reply && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-white/[.06] bg-[#08080c] px-3 py-2 text-xs text-zinc-300 leading-relaxed">
                {reply}
              </div>
            </div>
          )}
          {!heard && !reply && (
            <p className="py-6 text-center text-xs text-zinc-500">Speak when you are ready.</p>
          )}
          {error && <p className="text-center text-xs text-red-300">{error}</p>}
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-white/[.06] px-4 py-5">
          <VoiceSunOrb state={state === 'muted' ? 'muted' : state} audioLevel={displayLevel} size={110} />
          <p className="text-[11px] text-zinc-500">
            {state === 'listening'
              ? 'Listening'
              : state === 'thinking'
                ? 'Thinking'
                : state === 'speaking'
                  ? 'Speaking'
                  : state === 'muted'
                    ? 'Muted'
                    : state === 'error'
                      ? 'Error'
                      : 'Ready'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-full border border-white/[.1] bg-white/[.04] px-4 py-2 text-xs text-zinc-300 hover:bg-white/[.08]"
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              onClick={endVoice}
              className="rounded-full border border-white/[.1] bg-white/[.04] px-4 py-2 text-xs text-zinc-300 hover:bg-white/[.08]"
            >
              End
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceTalk;
