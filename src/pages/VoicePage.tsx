import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { ArrowLeft, Mic, MicOff, X, Sparkles, Volume2 } from 'lucide-react';
import { VoiceSunOrb, VoiceState } from '../components/voice-sun-orb';

type VoicePersona = {
  id: string;
  name: string;
  description: string;
  pitch: number;
  rate: number;
};

const PERSONAS: VoicePersona[] = [
  { id: 'nova', name: 'Nova', description: 'Warm and natural.', pitch: 1.05, rate: 1.02 },
  { id: 'aria', name: 'Aria', description: 'Clear and calm.', pitch: 1.12, rate: 0.98 },
  { id: 'echo', name: 'Echo', description: 'Deeper and steady.', pitch: 0.88, rate: 0.94 },
  { id: 'sol', name: 'Sol', description: 'Bright and expressive.', pitch: 1.18, rate: 1.08 }
];

export function VoicePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceState>('idle');
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState('Tap the mic to start');
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [level, setLevel] = useState(0);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [settings, setSettings] = useState(false);

  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const lastFinalRef = useRef('');

  const stopMeter = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    setLevel(0);
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
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch {
      setError('Microphone access is required');
      setState('error');
      setStatus('Allow microphone access');
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window) || !text.trim()) {
        speakingRef.current = false;
        if (listeningRef.current && !muted) {
          setState('listening');
          setStatus('Listening');
        }
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = persona.pitch;
      u.rate = persona.rate;
      speakingRef.current = true;
      setState('speaking');
      setStatus('Speaking');
      u.onend = () => {
        speakingRef.current = false;
        if (listeningRef.current && !muted) {
          setState('listening');
          setStatus('Listening');
        }
      };
      u.onerror = () => {
        speakingRef.current = false;
        if (listeningRef.current && !muted) {
          setState('listening');
          setStatus('Listening');
        }
      };
      window.speechSynthesis.speak(u);
    },
    [persona, muted]
  );

  const sendToAI = useCallback(
    async (text: string) => {
      if (!text.trim() || processingRef.current) return;
      processingRef.current = true;
      setState('thinking');
      setStatus('Thinking');
      setHeard(text);
      try {
        const { data: sessionData } = await getSupabase().auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ messages: [{ role: 'user', content: text.trim() }] })
        });
        const data = await res.json().catch(() => ({}));
        const content =
          data?.message?.content ||
          data?.content ||
          (data?.code === 'AI_NOT_CONFIGURED'
            ? 'AI is not configured yet. Add GEMINI_API_KEY on the server.'
            : data?.error || 'Something went wrong.');
        setReply(String(content));
        speak(String(content));
      } catch {
        setError('Could not reach ZenixMind');
        setStatus('Connection error');
        setState('error');
      } finally {
        processingRef.current = false;
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
      setStatus('Browser not supported');
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
      const t = final.trim();
      if (t && t !== lastFinalRef.current) {
        lastFinalRef.current = t;
        void sendToAI(t);
      }
    };
    recognition.onerror = () => {};
    recognition.onend = () => {
      if (listeningRef.current && !muted && !processingRef.current && !speakingRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      listeningRef.current = true;
      setState('listening');
      setStatus('Listening');
    } catch {
      setState('error');
      setStatus('Could not start microphone');
    }
  }, [muted, sendToAI]);

  const stopRecognition = useCallback(() => {
    listeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  const toggle = async () => {
    if (!active) {
      setActive(true);
      setMuted(false);
      setError('');
      setHeard('');
      setReply('');
      await startMeter();
      startRecognition();
      return;
    }
    if (muted) {
      setMuted(false);
      setState('listening');
      setStatus('Listening');
      startRecognition();
    } else {
      setMuted(true);
      stopRecognition();
      setState('muted');
      setStatus('Microphone off');
    }
  };

  const end = () => {
    stopRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakingRef.current = false;
    processingRef.current = false;
    setActive(false);
    setMuted(false);
    setState('idle');
    setStatus('Tap the mic to start');
    stopAudio();
  };

  useEffect(() => {
    return () => {
      stopRecognition();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      stopAudio();
    };
  }, [stopAudio, stopRecognition]);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#050506] text-zinc-100">
      {/* Top bar — website chrome */}
      <header className="flex items-center justify-between border-b border-white/[.06] px-4 py-3 sm:px-6">
        <button
          onClick={() => navigate('/assistant')}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Chat</span>
        </button>
        <div className="text-center">
          <div className="text-sm font-medium text-white">Voice</div>
          <div className="text-[10px] text-zinc-500">{persona.name}</div>
        </div>
        <button
          onClick={() => setSettings(true)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/[.08] bg-white/[.03] text-zinc-400 hover:text-white transition-colors"
          aria-label="Voice settings"
        >
          <Sparkles size={15} />
        </button>
      </header>

      {/* Transcript-first layout (ChatGPT / Gemini pattern) */}
      <main className="flex flex-1 flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-xl space-y-5">
            {!active && !heard && !reply && (
              <div className="rounded-2xl border border-white/[.06] bg-[#0b0b0e] px-5 py-8 text-center">
                <p className="text-sm text-zinc-300">Talk with ZenixMind</p>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                  Start the mic, speak naturally, and read replies here while you listen.
                </p>
              </div>
            )}

            {heard && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md border border-white/[.08] bg-white/[.06] px-4 py-3 text-sm text-zinc-100 leading-relaxed">
                  {heard}
                </div>
              </div>
            )}

            {reply && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/[.06] bg-[#0b0b0e] px-4 py-3 text-sm text-zinc-200 leading-relaxed">
                  {reply}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Compact voice dock */}
        <div className="border-t border-white/[.06] bg-[#050506]/95 backdrop-blur px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  state === 'error'
                    ? 'bg-red-400'
                    : state === 'speaking'
                      ? 'bg-white'
                      : active && !muted
                        ? 'bg-emerald-400'
                        : 'bg-zinc-600'
                }`}
              />
              {status}
            </div>

            <VoiceSunOrb
              state={state}
              audioLevel={level}
              size={130}
              onClick={() => void toggle()}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void toggle()}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  active && !muted
                    ? 'bg-white text-black hover:bg-zinc-100'
                    : 'border border-white/[.1] bg-white/[.04] text-zinc-200 hover:bg-white/[.08]'
                }`}
              >
                {active && !muted ? (
                  <>
                    <Mic size={16} /> Mic on
                  </>
                ) : (
                  <>
                    <MicOff size={16} /> Start
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={active ? end : () => navigate('/assistant')}
                className="inline-flex items-center gap-2 rounded-full border border-white/[.1] bg-white/[.04] px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/[.08] hover:text-white transition-colors"
              >
                <X size={15} />
                {active ? 'End' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {settings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#0c0c0e] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Voice style</h2>
                <p className="mt-1 text-[11px] text-zinc-500">How ZenixMind sounds in this browser.</p>
              </div>
              <button
                onClick={() => setSettings(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                    persona.id === p.id
                      ? 'border-white/20 bg-white/[.06]'
                      : 'border-white/[.06] bg-transparent hover:bg-white/[.03]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-zinc-100">{p.name}</div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">{p.description}</div>
                  </div>
                  {persona.id === p.id && <Volume2 size={15} className="text-zinc-300" />}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSettings(false)}
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoicePage;
