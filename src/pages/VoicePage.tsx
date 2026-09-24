import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { ArrowLeft, MessageSquare, Mic, MicOff, X, Sparkles, Sliders, Volume2 } from 'lucide-react';
import { VoiceSunOrb, VoiceState } from '../components/voice-sun-orb';

type VoicePersona = {
  id: string;
  name: string;
  description: string;
  pitch: number;
  rate: number;
};

const PERSONAS: VoicePersona[] = [
  { id: 'nova', name: 'Nova', description: 'Warm, natural and conversational.', pitch: 1.05, rate: 1.02 },
  { id: 'aria', name: 'Aria', description: 'Clear, calm and articulate.', pitch: 1.12, rate: 0.98 },
  { id: 'echo', name: 'Echo', description: 'Deeper, slower and grounded.', pitch: 0.88, rate: 0.94 },
  { id: 'sol', name: 'Sol', description: 'Bright, expressive and energetic.', pitch: 1.18, rate: 1.08 }
];

export function VoicePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceState>('muted');
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState('Tap the microphone to talk');
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
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
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
      analyser.smoothingTimeConstant = 0.8;
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
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4.5));
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Speech recognition may still work without the visual meter.
    }
  }, []);

  const stopRecognition = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  const startRecognition = useCallback(() => {
    if (!listeningRef.current || muted || processingRef.current || speakingRef.current) return;
    try {
      recognitionRef.current?.start();
      setState('listening');
      setStatus('Listening…');
      setError('');
    } catch {
      // Already running.
    }
  }, [muted]);

  const speak = useCallback((text: string) => {
    const clean = text
      .replace(/[*#_\`~]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean || !('speechSynthesis' in window)) {
      speakingRef.current = false;
      processingRef.current = false;
      startRecognition();
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = persona.rate;
    utterance.pitch = persona.pitch;
    utterance.volume = 1;

    const voices = synth.getVoices();
    const voice = voices.find(v => /^en[-_]/i.test(v.lang) && /natural|neural|google|microsoft|siri|daniel/i.test(v.name))
      || voices.find(v => /^en[-_]/i.test(v.lang));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      speakingRef.current = true;
      processingRef.current = false;
      setState('speaking');
      setStatus('ZenixMind is speaking');
    };
    utterance.onend = () => {
      speakingRef.current = false;
      processingRef.current = false;
      if (listeningRef.current && !muted) {
        setState('listening');
        setStatus('Listening…');
        window.setTimeout(startRecognition, 250);
      }
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      processingRef.current = false;
      if (listeningRef.current && !muted) window.setTimeout(startRecognition, 250);
    };

    speakingRef.current = true;
    setState('speaking');
    synth.speak(utterance);
  }, [muted, persona, startRecognition]);

  const sendToAI = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || processingRef.current) return;

    processingRef.current = true;
    stopRecognition();
    setHeard(clean);
    setReply('');
    setState('thinking');
    setStatus('Thinking…');
    setError('');

    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session?.access_token) throw new Error('Your session expired. Please sign in again.');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: clean }],
          model: 'gemini-2.5-flash',
          preferences: {
            voiceMode: true,
            responseLength: 'Brief spoken conversational reply'
          }
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || 'I could not reach ZenixMind.');

      const answer = String(data?.message || '').trim();
      setReply(answer);
      speak(answer);
    } catch (err: any) {
      processingRef.current = false;
      setState('error');
      setStatus('Something went wrong');
      setError(err?.message || 'Voice chat could not connect.');
      if (listeningRef.current && !muted) window.setTimeout(startRecognition, 900);
    }
  }, [muted, speak, startRecognition, stopRecognition]);

  const begin = useCallback(async () => {
    if (!supported) return;
    setActive(true);
    setMuted(false);
    listeningRef.current = true;
    setError('');
    await startMeter();
    startRecognition();
  }, [supported, startMeter, startRecognition]);

  const end = useCallback(() => {
    listeningRef.current = false;
    processingRef.current = false;
    speakingRef.current = false;
    stopRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopAudio();
    setActive(false);
    setMuted(false);
    setState('muted');
    setStatus('Tap the microphone to talk');
  }, [stopAudio, stopRecognition]);

  const toggle = useCallback(() => {
    if (!active) {
      begin();
      return;
    }
    if (muted) {
      setMuted(false);
      listeningRef.current = true;
      startRecognition();
      return;
    }
    setMuted(true);
    stopRecognition();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakingRef.current = false;
    setState('muted');
    setStatus('Microphone muted');
  }, [active, begin, muted, startRecognition, stopRecognition]);

  useEffect(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      setStatus('Voice input is not supported in this browser');
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = navigator.language?.startsWith('en') ? navigator.language : 'en-US';

    recognition.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      const value = text.trim();
      if (value) setHeard(value);

      const last = event.results[event.results.length - 1];
      if (last?.isFinal) {
        const finalText = value || last[0].transcript.trim();
        if (finalText && finalText !== lastFinalRef.current) {
          lastFinalRef.current = finalText;
          sendToAI(finalText);
        }
      }
    };

    recognition.onend = () => {
      if (listeningRef.current && !muted && !processingRef.current && !speakingRef.current) {
        window.setTimeout(startRecognition, 180);
      }
    };

    recognition.onerror = (event: any) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        listeningRef.current = false;
        setError('Microphone permission is blocked. Allow microphone access and try again.');
        setState('error');
        setStatus('Microphone permission needed');
      }
    };

    recognitionRef.current = recognition;
    return () => {
      listeningRef.current = false;
      try { recognition.stop(); } catch {}
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      stopAudio();
    };
  }, [muted, sendToAI, startRecognition, stopAudio]);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black text-white select-none">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.07] blur-[150px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-7">
        <button onClick={() => navigate('/assistant')} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 hover:bg-white/10" aria-label="Return to text chat">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-zinc-100">ZenixMind Voice</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-zinc-500">{persona.name} · {active ? 'Live' : 'Ready'}</div>
        </div>
        <button onClick={() => setSettings(true)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 hover:bg-white/10" aria-label="Voice settings">
          <Sliders size={18} />
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-5 text-center">
        <button onClick={toggle} className="rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400/70" aria-label={active && !muted ? 'Mute microphone' : 'Start voice conversation'}>
          <VoiceSunOrb state={state} audioLevel={level} size={280} />
        </button>

        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-zinc-300">
          <span className={`h-2 w-2 rounded-full ${state === 'error' ? 'bg-red-400' : state === 'speaking' ? 'bg-amber-300' : active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
          {status}
        </div>

        <div className="mt-5 min-h-[112px] w-full max-w-xl px-4">
          {reply ? <p className="text-lg font-medium leading-snug text-zinc-100 sm:text-xl">“{reply}”</p> :
            heard ? <p className="text-sm leading-relaxed text-zinc-400">“{heard}”</p> :
            <p className="text-sm leading-relaxed text-zinc-600">{active ? 'I’m listening.' : 'Talk naturally with ZenixMind. It listens, thinks, answers, then listens again.'}</p>}
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        </div>

        {!active && supported && (
          <button onClick={begin} className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-300">
            <Mic size={17} /> Start talking
          </button>
        )}
      </main>

      <footer className="relative z-10 flex items-center justify-center gap-5 px-6 pb-7">
        <button onClick={() => navigate('/assistant')} className="grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 hover:bg-white/10" aria-label="Open text chat">
          <MessageSquare size={21} />
        </button>
        <button onClick={active ? toggle : begin} disabled={!supported} className={`grid h-[76px] w-[76px] place-items-center rounded-full transition active:scale-95 disabled:opacity-40 ${active && !muted ? 'bg-amber-400 text-black' : 'border border-white/10 bg-white/[0.08] text-zinc-200'}`} aria-label={active && !muted ? 'Mute microphone' : 'Start voice conversation'}>
          {active && !muted ? <Mic size={29} /> : <MicOff size={27} />}
        </button>
        <button onClick={active ? end : () => navigate('/assistant')} className="grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 hover:bg-white/10" aria-label={active ? 'End voice conversation' : 'Close voice assistant'}>
          <X size={21} />
        </button>
      </footer>

      {settings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#101012] p-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300"><Sparkles size={18} /></div>
                <div><h2 className="text-sm font-semibold text-white">Voice style</h2><p className="mt-1 text-[11px] text-zinc-500">Choose how ZenixMind sounds in this browser.</p></div>
              </div>
              <button onClick={() => setSettings(false)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white" aria-label="Close settings"><X size={16} /></button>
            </div>
            <div className="mt-5 space-y-2">
              {PERSONAS.map(p => (
                <button key={p.id} onClick={() => { setPersona(p); if ('speechSynthesis' in window && active) speak(`Voice style changed to ${p.name}.`); }} className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${persona.id === p.id ? 'border-amber-400/40 bg-amber-400/10' : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                  <div><div className="text-xs font-semibold text-zinc-100">{p.name}</div><div className="mt-1 text-[11px] text-zinc-500">{p.description}</div></div>
                  {persona.id === p.id && <Volume2 size={16} className="text-amber-300" />}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end"><button onClick={() => setSettings(false)} className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300">Done</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoicePage;
