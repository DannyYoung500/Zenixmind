import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Mic, MicOff, X, Sparkles, Volume2 } from 'lucide-react';
import { VoiceSunOrb, VoiceState } from '../components/voice-sun-orb';

export function VoicePage() {
  const navigate = useNavigate();
  const [voiceState, setVoiceState] = useState<VoiceState>('listening');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('Hey, what can I do for you today?');
  const [audioLevel, setAudioLevel] = useState(0.2);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Handle Speech Recognition
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
        setVoiceState('speaking');

        if ('speechSynthesis' in window) {
          synthRef.current = window.speechSynthesis;
          synthRef.current.cancel();
          const cleanText = reply.replace(/[*#_`~]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.05;
          utterance.pitch = 1.0;
          
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

          synthRef.current.speak(utterance);
        } else {
          setVoiceState('listening');
        }
      } else {
        setVoiceState('listening');
        setAssistantResponse("I couldn't reach the AI assistant. Please try again.");
      }
    } catch (err) {
      console.warn('Voice chat error:', err);
      setVoiceState('listening');
      setAssistantResponse('Network or server error encountered.');
    }
  }, []);

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

    // Ambient audio pulse simulation when listening
    const interval = setInterval(() => {
      if (voiceState === 'listening' && !isMuted) {
        setAudioLevel(0.15 + Math.sin(Date.now() / 300) * 0.1);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
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
          <h1 className="text-sm font-semibold text-zinc-200 tracking-tight">Voice Assistant</h1>
          <span className="sr-only" aria-live="polite">Current state: {voiceState}</span>
        </div>

        <button
          onClick={() => navigate('/assistant?view=settings')}
          className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] flex items-center justify-center text-zinc-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Open voice settings and preferences"
          title="Settings"
        >
          <Sparkles size={18} className="text-amber-400" aria-hidden="true" />
        </button>
      </header>

      {/* Main Center Stage: Voice Sun Orb & Conversational Output */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center -mt-6">
        <div className="my-2 cursor-pointer transition-transform hover:scale-105" onClick={toggleMute} title="Click to mute/unmute">
          <VoiceSunOrb 
            state={voiceState} 
            audioLevel={audioLevel} 
            size={300} 
          />
        </div>

        {/* Status Pill */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] shadow-lg text-xs font-medium text-amber-300 mt-6 backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
          <span>
            {voiceState === 'listening' && (isMuted ? 'Microphone muted' : 'Listening for your voice...')}
            {voiceState === 'thinking' && 'Analyzing request...'}
            {voiceState === 'speaking' && 'Assistant speaking...'}
            {voiceState === 'muted' && 'Paused / Muted'}
          </span>
        </div>

        {/* Assistant Spoken / Text Response */}
        <div className="mt-5 max-w-md px-4 min-h-[70px]">
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
