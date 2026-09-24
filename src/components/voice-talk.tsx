import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { VoiceSunOrb, VoiceState } from './voice-sun-orb';

interface Props {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onVoiceMessage: (text: string) => Promise<string | undefined>;
}

export function VoiceTalk({ open, busy, onClose, onVoiceMessage }: Props) {
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<VoiceState>('muted');
  const [heard, setHeard] = useState('');
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('Tap the microphone to talk');
  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef(false);
  const listeningRef = useRef(false);
  const busyRef = useRef(false);
  const lastFinalRef = useRef('');
  const restartRef = useRef<number | null>(null);

  const stopRecognition = useCallback(() => { try { recognitionRef.current?.stop(); } catch {} }, []);

  const speak = useCallback((text: string) => {
    if (!text || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*#_\`~]/g, '').replace(/\s+/g, ' ').trim());
    u.rate = 1.02; u.pitch = 1.05;
    const voices = synth.getVoices();
    const v = voices.find(x => /^en[-_]/i.test(x.lang) && /natural|neural|google|microsoft|siri|daniel/i.test(x.name)) || voices.find(x => /^en[-_]/i.test(x.lang));
    if (v) u.voice = v;
    u.onstart = () => { speakingRef.current = true; setState('speaking'); setStatus('ZenixMind is speaking'); };
    u.onend = () => {
      speakingRef.current = false;
      if (listeningRef.current && !muted) {
        setState('listening'); setStatus('Listening…');
        restartRef.current = window.setTimeout(() => { try { recognitionRef.current?.start(); } catch {} }, 220);
      }
    };
    u.onerror = () => { speakingRef.current = false; if (listeningRef.current && !muted) { setState('listening'); setStatus('Listening…'); } };
    speakingRef.current = true; setState('speaking'); setStatus('ZenixMind is speaking'); synth.speak(u);
  }, [muted]);

  const handleFinal = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || busyRef.current || speakingRef.current || clean === lastFinalRef.current) return;
    lastFinalRef.current = clean;
    busyRef.current = true;
    stopRecognition();
    setHeard(clean); setReply(''); setState('thinking'); setStatus('Thinking…');
    try {
      const answer = await onVoiceMessage(clean);
      if (answer) { setReply(answer); speak(answer); }
      else { setState('listening'); setStatus('Listening…'); }
    } catch { setState('error'); setStatus('Voice response failed'); }
    finally { busyRef.current = false; }
  }, [onVoiceMessage, speak, stopRecognition]);

  const startRecognition = useCallback(() => {
    if (!active || muted || busyRef.current || speakingRef.current) return;
    try { recognitionRef.current?.start(); setState('listening'); setStatus('Listening…'); } catch {}
  }, [active, muted]);

  useEffect(() => {
    if (!open) return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) { setState('error'); setStatus('Voice input is not supported in this browser'); return; }
    const r = new Ctor();
    r.continuous = true; r.interimResults = true; r.maxAlternatives = 1; r.lang = 'en-US';
    r.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) text += event.results[i][0].transcript;
      text = text.trim();
      if (text) setHeard(text);
      const last = event.results[event.results.length - 1];
      if (last?.isFinal && text) handleFinal(text);
    };
    r.onend = () => {
      if (listeningRef.current && !muted && !busyRef.current && !speakingRef.current) {
        restartRef.current = window.setTimeout(startRecognition, 180);
      }
    };
    r.onerror = (e: any) => {
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        setState('error'); setStatus('Microphone permission required');
      }
    };
    recognitionRef.current = r;
    return () => { if (restartRef.current) window.clearTimeout(restartRef.current); try { r.stop(); } catch {} };
  }, [open, muted, handleFinal, startRecognition]);

  useEffect(() => {
    if (open && active && !muted && !busy) startRecognition();
  }, [open, active, muted, busy, startRecognition]);

  useEffect(() => () => {
    listeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [open]);

  const begin = () => {
    listeningRef.current = true; setActive(true); setMuted(false); setReply(''); setHeard('');
    setState('listening'); setStatus('Listening…'); setTimeout(startRecognition, 60);
  };

  const toggle = () => {
    if (!active) return begin();
    if (muted) { setMuted(false); listeningRef.current = true; setState('listening'); setStatus('Listening…'); setTimeout(startRecognition, 60); return; }
    setMuted(true); stopRecognition(); if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakingRef.current = false; setState('muted'); setStatus('Microphone muted');
  };

  const close = () => {
    listeningRef.current = false; setActive(false); setMuted(false); stopRecognition();
    if (restartRef.current) window.clearTimeout(restartRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    onClose();
  };

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[80] flex items-end justify-center bg-black/45 backdrop-blur-[2px]">
      <div className="w-full border-t border-white/[.08] bg-[#08080a]/95 px-4 pb-5 pt-3 shadow-[0_-20px_70px_rgba(0,0,0,.65)] backdrop-blur-xl sm:rounded-t-[28px] sm:px-6 sm:pb-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div><div className="text-sm font-medium text-zinc-100">Voice Talk</div><div className="mt-0.5 text-[11px] text-zinc-500">{status}</div></div>
          <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-white/[.06] text-zinc-400 hover:text-white" aria-label="Close Voice Talk"><X size={16}/></button>
        </div>
        <div className="mx-auto mt-1 flex max-w-3xl flex-col items-center">
          <button onClick={toggle} className="rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400/70" aria-label="Toggle Voice Talk">
            <VoiceSunOrb state={state} audioLevel={state === 'listening' ? 0.35 : state === 'speaking' ? 0.7 : 0.12} size={150}/>
          </button>
          <div className="min-h-[58px] w-full max-w-xl text-center">
            {reply ? <p className="text-sm leading-relaxed text-zinc-100">“{reply}”</p> : heard ? <p className="text-sm leading-relaxed text-zinc-400">“{heard}”</p> : <p className="text-xs text-zinc-600">Talk naturally. ZenixMind will answer and keep listening.</p>}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <button onClick={toggle} className={`grid h-12 w-12 place-items-center rounded-full border ${active && !muted ? 'border-amber-400/40 bg-amber-400 text-black' : 'border-white/10 bg-white/[.06] text-zinc-300'}`} aria-label={active && !muted ? 'Mute' : 'Start'}>{active && !muted ? <Mic size={20}/> : <MicOff size={20}/>}</button>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[.07] bg-white/[.03] px-3 py-2 text-[10px] uppercase tracking-[.16em] text-zinc-500"><Volume2 size={13}/>{state === 'speaking' ? 'Speaking' : state === 'thinking' ? 'Thinking' : state === 'muted' ? 'Paused' : 'Listening'}</div>
            <button onClick={close} className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[.06] text-zinc-300 hover:text-white" aria-label="End Voice Talk"><X size={20}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
