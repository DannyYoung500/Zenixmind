import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Mic, MicOff, X, Sparkles, Sliders, Volume2, Check } from 'lucide-react';
import { VoiceSunOrb, VoiceState } from '../components/voice-sun-orb';

export interface VoicePersona {
  id: string;
  name: string;
  description: string;
  pitch: number;
  rate: number;
  accent: string;
}

const VOICE_PERSONAS: VoicePersona[] = [
  { id: 'nova', name: 'Nova (Warm & Friendly)', description: 'Balanced, conversational, and welcoming.', pitch: 1.1, rate: 1.05, accent: 'from-amber-400 to-orange-500' },
  { id: 'aria', name: 'Aria (Professional & Crisp)', description: 'Articulate, clear, and executive tone.', pitch: 1.2, rate: 1.0, accent: 'from-blue-400 to-indigo-500' },
  { id: 'echo', name: 'Echo (Deep & Authoritative)', description: 'Resonant, grounded, and deep presence.', pitch: 0.8, rate: 0.95, accent: 'from-purple-400 to-pink-500' },
  { id: 'sol', name: 'Sol (Energetic & Bright)', description: 'High-energy, expressive, and dynamic.', pitch: 1.3, rate: 1.15, accent: 'from-yellow-300 to-amber-500' }
];

export function VoicePage() {
  const navigate = useNavigate();
  const [voiceState, setVoiceState] = useState<VoiceState>('listening');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState("Hey, what can I do for you today?");
  const [audioLevel, setAudioLevel] = useState(0.2);
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>(VOICE_PERSONAS[0]);
  const [showSettings, setShowSettings] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Handle Speech Synthesis & Voice Persona
  const speakResponse = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    synthRef.current = window.speechSynthesis;
    synthRef.current.cancel();

    const cleanText = text.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = selectedPersona.rate;
    utterance.pitch = selectedPersona.pitch;

    // Try to pick a suitable voice based on browser voices
    const voices = synthRef.current.getVoices();
    if (voices && voices.length > 0) {
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }

    utterance.onboundary = () => {
      setAudioLevel(0.4 + Math.random() * 0.5);
    };
    utterance.onend = () => {
      setVoiceState('listening');
      setAudioLevel(0.2);
    };
    utterance.onerror = () => {
      setVoiceState('listening');
      setAudioLevel(0.2);
    };

    setVoiceState('speaking');
    synthRef.current.speak(utterance);
  }, [selectedPersona]);

  const handleVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setVoiceState('thinking');
    setTranscript(text);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          model: 'gemini-2.5-flash',
          preferences: { responseLength: 'Brief spoken conversational reply' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.message || "I'm here to assist you.";
        setAssistantResponse(reply);
        speakResponse(reply);
      } else {
        setVoiceState('listening');
        setAssistantResponse("I couldn't reach the AI assistant. Please try again.");
      }
    } catch (err) {
      console.warn('Voice chat error:', err);
      setVoiceState('listening');
      setAssistantResponse('Network or server error encountered.');
    }
  }, [speakResponse]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          if (isMuted) return;
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
          setAudioLevel(0.3 + Math.random() * 0.4);
          if (event.results[current].isFinal) {
            handleVoiceInput(text);
          }
        };

        recog.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
        };

        recognitionRef.current = recog;
        if (!isMuted) {
          recog.start();
        }
      } catch (err) {
        console.warn('Speech recognition setup error:', err);
      }
    }

    const interval = setInterval(() => {
      if (voiceState === 'listening' && !isMuted) {
        setAudioLevel(0.15 + Math.sin(Date.now() / 300) * 0.1);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isMuted, handleVoiceInput, voiceState]);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      setVoiceState('muted');
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setVoiceState('listening');
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch {}
      }
    }
  };

  return (
    <div 
      className="relative flex h-screen w-full flex-col justify-between overflow-hidden bg-black text-white select-none font-sans"
      role="region"
      aria-label="Voice Assistant Live Session"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar with ARIA labels */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        <button
          onClick={() => navigate('/assistant')}
          className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] flex items-center justify-center text-zinc-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Return to text chat assistant"
          title="Back to Chat"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-zinc-200 tracking-tight">Voice Assistant • {selectedPersona.name.split(' ')[0]}</h1>
          <span className="sr-only" aria-live="polite">Current state: {voiceState}</span>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            showSettings 
              ? 'bg-amber-400 text-black border-amber-400' 
              : 'bg-white/[0.08] hover:bg-white/[0.15] border-white/[0.12] text-zinc-200'
          }`}
          aria-label="Open AI voice persona and configuration settings"
          aria-expanded={showSettings}
          title="Voice Settings & Personas"
        >
          <Sliders size={18} aria-hidden="true" />
        </button>
      </header>

      {/* Main Center Stage: Voice Sun Orb & Conversational Output */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-6">
        <div className="my-2 cursor-pointer transition-transform hover:scale-105" onClick={toggleMute} title="Click to mute/unmute">
          <VoiceSunOrb 
            state={voiceState} 
            audioLevel={audioLevel} 
            size={280} 
          />
        </div>

        {/* Status Pill */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] shadow-lg text-xs font-medium text-amber-300 mt-5 backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
          <span>
            {voiceState === 'listening' && (isMuted ? 'Microphone muted' : 'Listening for your voice...')}
            {voiceState === 'thinking' && 'Analyzing request...'}
            {voiceState === 'speaking' && `Speaking (${selectedPersona.name.split(' ')[0]})...`}
            {voiceState === 'muted' && 'Paused / Muted'}
          </span>
        </div>

        {/* Assistant Spoken / Text Response */}
        <div className="mt-4 max-w-md px-4 min-h-[70px]">
          <p 
            className="text-lg sm:text-xl font-medium text-zinc-100 tracking-tight leading-snug"
            aria-live="polite"
          >
            "{assistantResponse}"
          </p>
          {transcript && (
            <p className="mt-2 text-xs text-amber-400/80 font-mono italic">
              Heard: "{transcript}"
            </p>
          )}
        </div>
      </main>

      {/* Voice Configuration & Personas Modal Overlay */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#121216] p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">AI Voice Personas</h2>
                  <p className="text-[11px] text-zinc-400">Customize tone, pitch, and voice characteristics</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center text-zinc-300 transition-colors"
                aria-label="Close voice settings"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 my-4">
              {VOICE_PERSONAS.map((persona) => {
                const isSelected = selectedPersona.id === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => {
                      setSelectedPersona(persona);
                      speakResponse(`Switched to ${persona.name.split(' ')[0]} persona.`);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                      isSelected
                        ? 'border-amber-400/50 bg-amber-400/10 text-white shadow-md'
                        : 'border-white/[0.08] bg-[#18181c] text-zinc-300 hover:bg-[#202025] hover:border-white/[0.15]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-100">{persona.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{persona.description}</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Pitch: {selectedPersona.pitch} | Rate: {selectedPersona.rate}</span>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition-colors"
              >
                Apply & Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar with full ARIA accessibility */}
      <footer className="relative z-10 pb-10 px-8 flex items-center justify-center gap-6 max-w-md mx-auto w-full">
        <button
          onClick={() => navigate('/assistant')}
          className="w-14 h-14 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] flex items-center justify-center text-zinc-200 transition-all active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Open text chat interface"
          title="Open Text Chat"
        >
          <MessageSquare size={22} aria-hidden="true" />
        </button>

        <button
          onClick={toggleMute}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-400 ${
            isMuted 
              ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' 
              : 'bg-amber-400 text-black hover:bg-amber-300'
          }`}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={isMuted}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff size={30} aria-hidden="true" /> : <Mic size={30} aria-hidden="true" />}
        </button>

        <button
          onClick={() => navigate('/assistant')}
          className="w-14 h-14 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] flex items-center justify-center text-zinc-200 transition-all active:scale-95 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Close voice assistant and return to dashboard"
          title="Close Voice Assistant"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </footer>

      {/* Bottom Home Indicator */}
      <div className="relative z-10 pb-2 flex justify-center">
        <span className="w-32 h-1 rounded-full bg-zinc-700/50" aria-hidden="true" />
      </div>
    </div>
  );
}

export default VoicePage;
