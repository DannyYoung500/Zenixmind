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
    if (!open) return;
    listeningRef.current = true;
    setActive(true);
    setMuted(false);
    setReply('');
    setHeard('');
    setState('listening');
    setStatus('Listening…');
    const timer = window.setTimeout(() => startRecognition(), 120);
    return () => window.clearTimeout(timer);
  }, [open, startRecognition]);

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
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
        <VoiceSunOrb
          state={state === 'muted' ? 'listening' : state}
          audioLevel={state === 'listening' ? 0.38 : state === 'speaking' ? 0.72 : state === 'thinking' ? 0.2 : 0.12}
          size={260}
        />
        <div className="mt-10">
          <p className="text-xl font-light tracking-[0.08em] text-white">Listening...</p>
          <p className="mt-2 text-sm text-zinc-500">I’m listening. Go ahead, speak.</p>
        </div>
      </div>
    </div>
  );
}
