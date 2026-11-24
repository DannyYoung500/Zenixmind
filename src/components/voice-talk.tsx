import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VoiceSunOrb, VoiceState } from './voice-sun-orb';
import { Mic, MicOff, X } from 'lucide-react';

interface VoiceTalkProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  /** Sends the spoken transcript into the main chat thread (ChatGPT-style). */
  onVoiceMessage?: (text: string) => void | Promise<string | undefined>;
}

/**
 * Inline voice session for the assistant page.
 * Transcripts go into the existing chat — not a separate voice-only conversation.
 */
export function VoiceTalk({
  open,
  busy = false,
  onClose,
  onVoiceMessage
}: VoiceTalkProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [muted, setMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');
  const [interim, setInterim] = useState('');

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const mutedRef = useRef(false);
  const busyRef = useRef(false);
  const sendingRef = useRef(false);
  const restartRef = useRef<number | null>(null);
  const lastFinalRef = useRef('');

  mutedRef.current = muted;
  busyRef.current = busy;

  // Reflect parent chat busy (streaming reply) in the indicator
  useEffect(() => {
    if (!open) return;
    if (busy) {
      setState('thinking');
      return;
    }
    if (!muted && listeningRef.current) {
      setState('listening');
    }
  }, [busy, open, muted]);

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
      } catch {
        /* ignore */
      }
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
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          /* ignore */
        }
      }
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
    } catch {
      /* ignore */
    }
  }, []);

  const submitTranscript = useCallback(
    async (transcript: string) => {
      const text = transcript.trim();
      if (!text || sendingRef.current || busyRef.current) return;
      if (text === lastFinalRef.current) return;
      lastFinalRef.current = text;
      sendingRef.current = true;
      setInterim('');
      setState('thinking');
      try {
        if (onVoiceMessage) {
          await onVoiceMessage(text);
        }
      } catch {
        setError('Could not send voice message');
        setState('error');
      } finally {
        sendingRef.current = false;
        // Parent `busy` will keep us in thinking until stream ends
        if (!busyRef.current && listeningRef.current && !mutedRef.current) {
          setState('listening');
        }
      }
    },
    [onVoiceMessage]
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
    } catch {
      /* ignore */
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event: any) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalChunk += piece;
        else interimChunk += piece;
      }
      if (interimChunk) setInterim(interimChunk.trim());
      if (finalChunk.trim()) void submitTranscript(finalChunk.trim());
    };

    recognition.onerror = (event: any) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setError('Microphone permission denied');
        setState('error');
        return;
      }
      if (listeningRef.current && !mutedRef.current && !busyRef.current) {
        restartRef.current = window.setTimeout(() => {
          if (listeningRef.current && !mutedRef.current) startRecognition();
        }, 400);
      }
    };

    recognition.onend = () => {
      if (listeningRef.current && !mutedRef.current && !busyRef.current && !sendingRef.current) {
        restartRef.current = window.setTimeout(() => {
          if (listeningRef.current && !mutedRef.current) startRecognition();
        }, 250);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      listeningRef.current = true;
      if (!busyRef.current && !sendingRef.current) setState('listening');
    } catch {
      setState('error');
      setError('Could not start speech recognition');
    }
  }, [submitTranscript]);

  useEffect(() => {
    if (!open) return;

    setMuted(false);
    setError('');
    setInterim('');
    lastFinalRef.current = '';
    void startMeter();
    startRecognition();

    return () => {
      listeningRef.current = false;
      stopRecognition();
      if (restartRef.current) window.clearTimeout(restartRef.current);
      stopAudio();
      setInterim('');
      setState('idle');
    };
  }, [open, startMeter, startRecognition, stopAudio, stopRecognition]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) {
      stopRecognition();
      setState('muted');
      setInterim('');
    } else {
      setState('listening');
      startRecognition();
    }
  };

  const endVoice = () => {
    listeningRef.current = false;
    stopRecognition();
    if (restartRef.current) window.clearTimeout(restartRef.current);
    stopAudio();
    setInterim('');
    onClose();
  };

  if (!open) return null;

  const displayLevel =
    state === 'listening'
      ? audioLevel
      : state === 'thinking'
        ? 0.18
        : state === 'speaking'
          ? Math.max(audioLevel, 0.25)
          : 0;

  const status =
    error ||
    (state === 'listening'
      ? interim
        ? interim
        : 'Listening…'
      : state === 'thinking'
        ? 'Sending to chat…'
        : state === 'muted'
          ? 'Microphone off'
          : state === 'error'
            ? 'Voice error'
            : 'Ready');

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[65] flex justify-center px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/[.1] bg-[#0c0c0f]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
          <VoiceSunOrb
            state={state === 'muted' ? 'muted' : state}
            audioLevel={displayLevel}
            size={96}
          />

          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              Voice in chat
            </div>
            <p className="mt-0.5 truncate text-sm text-zinc-200">{status}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/[.08] bg-white/[.04] text-zinc-300 transition hover:bg-white/[.08] hover:text-white"
              aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              type="button"
              onClick={endVoice}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/[.08] bg-white/[.04] text-zinc-300 transition hover:bg-white/[.08] hover:text-white"
              aria-label="End voice"
              title="End voice"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceTalk;
