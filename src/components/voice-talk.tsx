import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VoiceSunOrb, VoiceState } from './voice-sun-orb';
import { Mic, MicOff, X, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VoiceTalkProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  /** Sends spoken text into the main chat; may resolve with the assistant reply for TTS. */
  onVoiceMessage?: (text: string) => void | Promise<string | undefined>;
}

/**
 * Inline voice for the assistant chat.
 * - Transcripts enter the main thread
 * - Assistant reply is spoken (TTS)
 * - Barge-in: speaking again cancels TTS and listens
 */
export function VoiceTalk({
  open,
  busy = false,
  onClose,
  onVoiceMessage
}: VoiceTalkProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceState>('idle');
  const [muted, setMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');
  const [interim, setInterim] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const mutedRef = useRef(false);
  const busyRef = useRef(false);
  const speakingRef = useRef(false);
  const sendingRef = useRef(false);
  const restartRef = useRef<number | null>(null);
  const lastFinalRef = useRef('');
  const bargeCooldownRef = useRef(0);
  const levelSmoothRef = useRef(0);

  mutedRef.current = muted;
  busyRef.current = busy;

  useEffect(() => {
    if (!open) return;
    if (busy && !speakingRef.current) {
      setState('thinking');
    } else if (!busy && !speakingRef.current && !muted && listeningRef.current) {
      setState('listening');
    }
  }, [busy, open, muted]);

  const stopMeter = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setAudioLevel(0);
    levelSmoothRef.current = 0;
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

  const cancelSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    speakingRef.current = false;
  }, []);

  const bargeIn = useCallback(() => {
    if (!speakingRef.current) return;
    const now = Date.now();
    if (now < bargeCooldownRef.current) return;
    bargeCooldownRef.current = now + 600;
    cancelSpeech();
    setState('listening');
  }, [cancelSpeech]);

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
        const rms = Math.min(1, Math.sqrt(sum / data.length) * 4);
        levelSmoothRef.current += (rms - levelSmoothRef.current) * 0.2;
        const level = levelSmoothRef.current;
        setAudioLevel(level);

        // Energy-based barge-in while TTS is playing
        if (speakingRef.current && level > 0.28) {
          bargeIn();
        }

        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setError('Microphone access is required');
      setState('error');
    }
  }, [bargeIn]);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const speakReply = useCallback(
    (text: string) => {
      if (!ttsEnabled || !('speechSynthesis' in window) || !text.trim()) {
        speakingRef.current = false;
        if (listeningRef.current && !mutedRef.current) setState('listening');
        return;
      }

      // Strip markdown noise for cleaner speech
      const cleaned = text
        .replace(/```[\s\S]*?```/g, ' code block ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleaned) {
        if (listeningRef.current && !mutedRef.current) setState('listening');
        return;
      }

      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleaned.slice(0, 1200));
      u.rate = 1.02;
      u.pitch = 1;
      speakingRef.current = true;
      setState('speaking');
      bargeCooldownRef.current = Date.now() + 900; // avoid self-barge from speaker bleed

      u.onend = () => {
        speakingRef.current = false;
        if (listeningRef.current && !mutedRef.current && !busyRef.current) {
          setState('listening');
        }
      };
      u.onerror = () => {
        speakingRef.current = false;
        if (listeningRef.current && !mutedRef.current) setState('listening');
      };

      window.speechSynthesis.speak(u);
    },
    [ttsEnabled]
  );

  const submitTranscript = useCallback(
    async (transcript: string) => {
      const text = transcript.trim();
      if (!text || sendingRef.current) return;
      if (text === lastFinalRef.current) return;

      // Barge-in path: user spoke a full phrase while TTS was on
      if (speakingRef.current) {
        cancelSpeech();
      }

      if (busyRef.current) return;

      lastFinalRef.current = text;
      sendingRef.current = true;
      setInterim('');
      setState('thinking');

      try {
        let reply: string | undefined;
        if (onVoiceMessage) {
          reply = (await onVoiceMessage(text)) || undefined;
        }
        if (reply && ttsEnabled) {
          speakReply(reply);
        } else if (listeningRef.current && !mutedRef.current) {
          setState(busyRef.current ? 'thinking' : 'listening');
        }
      } catch {
        setError('Could not send voice message');
        setState('error');
      } finally {
        sendingRef.current = false;
      }
    },
    [onVoiceMessage, speakReply, ttsEnabled, cancelSpeech]
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

      // Interim speech while speaking → barge-in
      if (speakingRef.current && (interimChunk.trim() || finalChunk.trim())) {
        bargeIn();
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
      if (listeningRef.current && !mutedRef.current) {
        restartRef.current = window.setTimeout(() => {
          if (listeningRef.current && !mutedRef.current) startRecognition();
        }, 400);
      }
    };

    recognition.onend = () => {
      if (listeningRef.current && !mutedRef.current) {
        restartRef.current = window.setTimeout(() => {
          if (listeningRef.current && !mutedRef.current) startRecognition();
        }, 220);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      listeningRef.current = true;
      if (!busyRef.current && !speakingRef.current && !sendingRef.current) {
        setState('listening');
      }
    } catch {
      setState('error');
      setError('Could not start speech recognition');
    }
  }, [submitTranscript, bargeIn]);

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
      cancelSpeech();
      stopAudio();
      setInterim('');
      setState('idle');
    };
  }, [open, startMeter, startRecognition, stopAudio, stopRecognition, cancelSpeech]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) {
      stopRecognition();
      cancelSpeech();
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
    cancelSpeech();
    stopAudio();
    setInterim('');
    onClose();
  };

  const openFullFocus = () => {
    endVoice();
    navigate('/assistant/voice');
  };

  if (!open) return null;

  const displayLevel =
    state === 'listening'
      ? audioLevel
      : state === 'thinking'
        ? 0.18
        : state === 'speaking'
          ? Math.max(audioLevel, 0.3)
          : 0;

  const status =
    error ||
    (state === 'listening'
      ? interim
        ? interim
        : 'Listening — speak anytime'
      : state === 'thinking'
        ? 'Thinking…'
        : state === 'speaking'
          ? 'Speaking — talk to interrupt'
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                Voice in chat
              </span>
              <button
                type="button"
                onClick={() => setTtsEnabled((v) => !v)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                  ttsEnabled
                    ? 'bg-white/[.08] text-zinc-200'
                    : 'bg-transparent text-zinc-600 line-through'
                }`}
                title="Toggle spoken replies"
              >
                TTS
              </button>
            </div>
            <p className="mt-0.5 truncate text-sm text-zinc-200">{status}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openFullFocus}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/[.08] bg-white/[.04] text-zinc-300 transition hover:bg-white/[.08] hover:text-white"
              aria-label="Open full voice mode"
              title="Full voice mode"
            >
              <Maximize2 size={15} />
            </button>
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
