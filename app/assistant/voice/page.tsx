"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand-mark";

type VoiceState = "listening" | "thinking" | "speaking" | "muted" | "error";
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: { length: number; [index: number]: RecognitionResult } };
type RecognitionErrorEvent = { error: string };
type RecognitionLike = {
  continuous: boolean; interimResults: boolean; maxAlternatives: number; lang: string; processLocally?: boolean;
  start: () => void; stop: () => void; abort: () => void;
  onstart: (() => void) | null; onend: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null; onerror: ((event: RecognitionErrorEvent) => void) | null;
};
type RecognitionConstructor = new () => RecognitionLike;

declare global { interface Window { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor; } }

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "mic-off") return <svg {...common}><path d="m3 3 18 18"/><path d="M10 6.5A3 3 0 0 1 16 8v4M8 11a4 4 0 0 0 7 2.7M5 11a7 7 0 0 0 12 4.9M12 19v2M9 21h6"/></svg>;
  if (name === "mic") return <svg {...common}><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>;
  if (name === "phone") return <svg {...common}><path d="M8.5 4.5 6 6c-.7.4-.9 1.3-.6 2.1 2 5.2 5.3 8.5 10.5 10.5.8.3 1.7.1 2.1-.6l1.5-2.5-4-2-1.5 1.5a12.6 12.6 0 0 1-5.1-5.1L10.5 9l-2-4Z"/></svg>;
  if (name === "arrow") return <svg {...common}><path d="m15 6-6 6 6 6"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

function cleanForSpeech(text: string) {
  return text.split(String.fromCharCode(96).repeat(3)).join(" ").split(String.fromCharCode(96)).join("").replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_~>#]+/g, " ").replace(/https?:\/\/\S+/g, " ").replace(/\s+/g, " ").trim();
}

function makeRecognition() {
  if (typeof window === "undefined") return null;
  const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1; recognition.lang = "en-US";
  return recognition;
}

export default function VoicePage() {
  const [state, setState] = useState<VoiceState>("listening");
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState("Listening");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const stoppedRef = useRef(false);
  const mutedRef = useRef(false);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);

  function stopRecognition() {
    try { recognitionRef.current?.abort(); } catch {}
  }

  function startListening(allowInterrupt = false) {
    if (stoppedRef.current || mutedRef.current || processingRef.current || (speakingRef.current && !allowInterrupt)) return;
    const recognition = recognitionRef.current || makeRecognition();
    if (!recognition) { setState("error"); setNotice("Voice input is not supported by this browser"); return; }
    recognitionRef.current = recognition;
    recognition.onstart = () => { setState(speakingRef.current ? "speaking" : "listening"); if (!speakingRef.current) setNotice("Listening"); };
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) if (event.results[i].isFinal) text += event.results[i][0].transcript;
      if (text.trim()) {
        if (speakingRef.current) window.speechSynthesis?.cancel();
        void sendVoiceMessage(text.trim());
      }
    };
    recognition.onerror = (event) => {
      if (stoppedRef.current || mutedRef.current) return;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") { setState("error"); setNotice("Microphone permission is required for Voice"); return; }
      if (event.error === "no-speech") { window.setTimeout(() => startListening(speakingRef.current), 150); return; }
      setState("error"); setNotice("Voice input could not start");
    };
    recognition.onend = () => {
      if (!stoppedRef.current && !mutedRef.current && !processingRef.current) window.setTimeout(() => startListening(speakingRef.current), 150);
    };
    try { if ("processLocally" in recognition) recognition.processLocally = true; recognition.start(); }
    catch { try { recognition.abort(); recognition.start(); } catch { setState("error"); setNotice("Voice input could not start"); } }
  }

  function speak(text: string) {
    const clean = cleanForSpeech(text);
    if (!clean || !window.speechSynthesis) { setState("error"); setNotice("Voice output is unavailable on this browser"); return; }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    const voices = synth.getVoices();
    const preferred = voices.find((voice) => /^en(-|_)/i.test(voice.lang) && /natural|enhanced|premium|google|microsoft/i.test(voice.name)) || voices.find((voice) => /^en(-|_)/i.test(voice.lang)) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.lang = preferred?.lang || "en-US"; utterance.rate = 0.96; utterance.pitch = 1; utterance.volume = 1;
    utterance.onstart = () => {
      speakingRef.current = true; setState("speaking"); setNotice("Speaking");
      window.setTimeout(() => startListening(true), 250);
    };
    utterance.onend = () => {
      speakingRef.current = false;
      if (!stoppedRef.current && !mutedRef.current) { setState("listening"); setNotice("Listening"); window.setTimeout(() => startListening(false), 120); }
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      if (!stoppedRef.current && !mutedRef.current) { setState("listening"); setNotice("Listening"); window.setTimeout(() => startListening(false), 120); }
    };
    synth.speak(utterance);
  }

  async function sendVoiceMessage(text: string) {
    if (!text.trim() || processingRef.current || stoppedRef.current) return;
    processingRef.current = true; stopRecognition(); setTranscript(text.trim()); setState("thinking"); setNotice("Thinking");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: text.trim() }], model: "default", conversationId: null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reach ZenixMind.");
      if (!stoppedRef.current && !mutedRef.current) speak(data.message);
    } catch (error) { setState("error"); setNotice(error instanceof Error ? error.message : "Voice conversation failed"); }
    finally { processingRef.current = false; }
  }

  useEffect(() => {
    stoppedRef.current = false;
    startListening(false);
    return () => { stoppedRef.current = true; stopRecognition(); window.speechSynthesis?.cancel(); };
  }, []);

  function toggleMute() {
    if (mutedRef.current) {
      mutedRef.current = false; setMuted(false); setState("listening"); setNotice("Listening"); window.setTimeout(() => startListening(false), 80); return;
    }
    mutedRef.current = true; setMuted(true); stopRecognition(); window.speechSynthesis?.cancel(); speakingRef.current = false; setState("muted"); setNotice("Muted");
  }

  function endVoice() {
    stoppedRef.current = true; stopRecognition(); window.speechSynthesis?.cancel(); window.location.href = "/assistant";
  }

  const stateLabel = state === "error" ? notice : state === "muted" ? "Muted" : notice;

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#050506] text-zinc-100">
      <style>{'@keyframes zenixVoicePulse { 0%,100% { transform:scale(.98); opacity:.78 } 50% { transform:scale(1.035); opacity:1 } } @keyframes zenixVoiceRotate { from { transform:rotate(0deg) scale(.99) } to { transform:rotate(360deg) scale(1.01) } } @keyframes zenixVoiceSpeak { 0%,100% { transform:scale(.98); filter:brightness(1) } 50% { transform:scale(1.06); filter:brightness(1.28) } } .voice-orb-listening { animation:zenixVoicePulse 3.8s ease-in-out infinite } .voice-orb-thinking { animation:zenixVoiceRotate 5.5s linear infinite } .voice-orb-speaking { animation:zenixVoiceSpeak 1.65s ease-in-out infinite } .voice-orb-muted { opacity:.42; filter:saturate(.45) brightness(.72) } @media (prefers-reduced-motion:reduce) { .voice-orb-listening,.voice-orb-thinking,.voice-orb-speaking { animation:none } }'}</style>
      <div className="relative flex min-h-[100dvh] flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(245,170,36,.07),transparent_31%),radial-gradient(circle_at_50%_50%,rgba(255,255,255,.025),transparent_48%)]" />
        <header className="relative z-10 flex h-[72px] items-center justify-between px-4 sm:px-7">
          <Link href="/assistant" aria-label="Back to chat" className="flex items-center gap-3 text-zinc-300 hover:text-white"><Icon name="arrow" size={22}/><BrandMark size={28}/><span className="hidden text-sm font-semibold sm:inline">ZenixMind</span></Link>
          <div className="flex items-center gap-2 rounded-full border border-white/[.07] bg-[#0a0a0c]/80 px-3 py-1.5 text-[11px] text-zinc-400 backdrop-blur"><span className={state === "error" ? "h-1.5 w-1.5 rounded-full bg-red-400" : "h-1.5 w-1.5 rounded-full bg-amber-300"}/>{stateLabel}</div>
        </header>
        <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-28 pt-4 text-center">
          <div className={(state === "speaking" ? "voice-orb voice-orb-speaking " : state === "thinking" ? "voice-orb voice-orb-thinking " : state === "muted" ? "voice-orb voice-orb-muted " : "voice-orb voice-orb-listening ") + "relative grid h-[min(62vw,360px)] w-[min(62vw,360px)] place-items-center rounded-full"}>
            <div className="absolute inset-[17%] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff7cf_0%,#ffd45e_18%,#f6a51f_46%,#9b4f08_70%,transparent_72%)] shadow-[0_0_90px_rgba(245,166,35,.45),inset_0_0_45px_rgba(255,246,200,.55)]" />
            <div className="absolute inset-[11%] rounded-full border border-amber-300/30" /><div className="absolute inset-[5%] rounded-full border border-amber-300/15" /><div className="absolute inset-0 rounded-full border border-amber-200/10" /><div className="absolute -inset-[12%] rounded-full border border-amber-300/10" /><div className="absolute -inset-[24%] rounded-full border border-amber-300/[.055]" /><div className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,.9)]" />
          </div>
          <p className="mt-16 text-lg font-light tracking-[-.01em] text-zinc-200 sm:text-xl">{stateLabel}</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">{state === "listening" ? "I’m listening. Go ahead and speak." : state === "thinking" ? "Give me a moment." : state === "speaking" ? "Speak to interrupt." : state === "muted" ? "Your microphone is muted." : "Check microphone permission and try again."}</p>
          {transcript && state !== "listening" && <p className="mt-5 max-w-xl text-xs leading-5 text-zinc-700">“{transcript}”</p>}
        </section>
        <div className="relative z-10 px-4 pb-7 sm:pb-8">
          <div className="mx-auto flex max-w-md items-center justify-center gap-6 rounded-[30px] border border-white/[.08] bg-[#0b0b0d]/90 px-7 py-4 shadow-[0_25px_90px_rgba(0,0,0,.55)] backdrop-blur-xl">
            <button type="button" onClick={toggleMute} className="flex min-w-[72px] flex-col items-center gap-2 text-zinc-400 hover:text-zinc-100" aria-label={muted ? "Unmute microphone" : "Mute microphone"}><span className="grid h-12 w-12 place-items-center rounded-full border border-white/[.07] bg-[#111114]">{muted ? <Icon name="mic-off"/> : <Icon name="mic"/>}</span><span className="text-[11px]">{muted ? "Unmute" : "Mute"}</span></button>
            <button type="button" onClick={endVoice} className="flex min-w-[72px] flex-col items-center gap-2 text-zinc-400 hover:text-red-300" aria-label="End voice conversation"><span className="grid h-14 w-14 place-items-center rounded-full border border-red-400/30 bg-red-500/10 text-red-300"><Icon name="phone" size={21}/></span><span className="text-[11px]">End</span></button>
            <div className="flex min-w-[72px] flex-col items-center gap-2 text-amber-200"><span className="grid h-12 w-12 place-items-center rounded-full bg-amber-300/[.07]"><span className="flex items-end gap-0.5"><i className="h-3 w-0.5 rounded-full bg-amber-200"/><i className="h-5 w-0.5 rounded-full bg-amber-200"/><i className="h-7 w-0.5 rounded-full bg-amber-100"/><i className="h-4 w-0.5 rounded-full bg-amber-200"/></span></span><span className="text-[11px]">{state === "speaking" ? "Speaking" : state === "thinking" ? "Thinking" : stateLabel}</span></div>
          </div>
        </div>
      </div>
    </main>
  );
}
