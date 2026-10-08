'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, PhoneOff, Zap, Sparkles, ShieldAlert, Package, DollarSign, Wrench, Shield, UserCheck, HelpCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
}

type VoiceState =
  | 'connecting'
  | 'calibrating'
  | 'listening'
  | 'speech_detected'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'closed';

export default function VoiceModal({ isOpen, onClose, conversationId }: VoiceModalProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [captions, setCaptions] = useState<string>('Connecting to Voice Service...');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [activeTopic, setActiveTopic] = useState<string>('General Support');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startVoiceSession();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const stopAllAudio = () => {
    activeAudioSourcesRef.current.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Already stopped
      }
    });
    activeAudioSourcesRef.current.clear();
    nextPlayTimeRef.current = 0;
  };

  const cleanup = () => {
    stopAllAudio();
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignored
      }
      speechRecognitionRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (playbackAudioContextRef.current) {
      playbackAudioContextRef.current.close().catch(() => {});
      playbackAudioContextRef.current = null;
    }
    setVoiceState('closed');
  };

  const startVoiceSession = async () => {
    try {
      setVoiceState('connecting');
      setCaptions('Requesting voice session...');

      // 1. Get session from BFF
      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      const sessionData = await res.json();
      const wsUrl = sessionData.ws_url || `ws://localhost:8004/voice/v1/sessions/${sessionData.session_id}`;

      // 2. Open WebSocket
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        setVoiceState('calibrating');
        setCaptions('Calibrating audio stream & speech engine...');
        initBrowserSpeechRecognition(ws);
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);
            handleServerEvent(msg);
          } catch {
            // Ignored
          }
        } else if (event.data instanceof ArrayBuffer) {
          // Received binary audio response frame from TTS Engine
          playAudioChunk(event.data);
        }
      };

      ws.onerror = () => {
        setCaptions('Connection error with Voice Service');
      };

      ws.onclose = () => {
        setVoiceState('closed');
      };

      // 3. Initialize audio capture
      await initMicrophoneCapture(ws);
    } catch {
      setCaptions('Failed to initialize microphone or voice connection.');
    }
  };

  const initBrowserSpeechRecognition = (ws: WebSocket) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim();
        if (transcript && ws.readyState === WebSocket.OPEN && !isMuted) {
          stopAllAudio();
          setUserTranscript(transcript);
          setCaptions(`You: "${transcript}"`);
          ws.send(JSON.stringify({ type: 'input.text', text: transcript }));
        }
      };

      recognition.onend = () => {
        if (isOpen && !isMuted && speechRecognitionRef.current) {
          try { recognition.start(); } catch { /* ignore */ }
        }
      };

      try {
        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch {
        // Ignore if denied
      }
    }
  };

  const initMicrophoneCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const playbackCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      playbackAudioContextRef.current = playbackCtx;
      if (playbackCtx.state === 'suspended') {
        playbackCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(512, 1, 1);

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMuted || ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i] || 0));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        ws.send(pcm16.buffer);
      };
    } catch {
      setVoiceState('listening');
      setCaptions('Connected. Listening for voice commands or quick scenario buttons...');
    }
  };

  const handleServerEvent = (msg: {
    type: string;
    text?: string;
    content?: string;
    message?: string;
    reason?: string;
  }) => {
    switch (msg.type) {
      case 'session.ready':
        stopAllAudio();
        setVoiceState('listening');
        setCaptions('Assistant listening. Speak naturally or select a scenario below...');
        break;
      case 'input_audio.speech_started':
        stopAllAudio();
        setVoiceState('speech_detected');
        break;
      case 'input_audio.speech_stopped':
        setVoiceState('transcribing');
        setCaptions('Processing speech...');
        break;
      case 'transcript.final':
        setUserTranscript(msg.text || '');
        setCaptions(`You: "${msg.text}"`);
        setVoiceState('thinking');
        break;
      case 'response.text.delta':
        setCaptions((prev) => (prev.startsWith('AI: ') ? prev + (msg.content || '') : `AI: ${msg.content}`));
        break;
      case 'response.audio.started':
        setVoiceState('speaking');
        break;
      case 'response.cancelled':
        stopAllAudio();
        setVoiceState('listening');
        setCaptions('Interrupted via Barge-In. Ready for your next command...');
        break;
      case 'response.completed':
        setVoiceState('listening');
        break;
      case 'error':
        setCaptions(`Error: ${msg.message}`);
        break;
    }
  };

  const playAudioChunk = (buffer: ArrayBuffer) => {
    try {
      const audioCtx = playbackAudioContextRef.current || audioContextRef.current;
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const int16Array = new Int16Array(buffer);
      if (int16Array.length === 0) return;

      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        const sample = int16Array[i] || 0;
        float32Array[i] = sample < 0 ? sample / 0x8000 : sample / 0x7fff;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }

      activeAudioSourcesRef.current.add(source);
      source.onended = () => {
        activeAudioSourcesRef.current.delete(source);
      };

      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;
    } catch (e) {
      console.error('Error playing audio chunk:', e);
    }
  };

  const handleInterrupt = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'response.cancel' }));
      stopAllAudio();
      setVoiceState('listening');
      setCaptions('Assistant interrupted.');
    }
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    if (nextState && speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch { /* ignore */ }
    } else if (!nextState && speechRecognitionRef.current) {
      try { speechRecognitionRef.current.start(); } catch { /* ignore */ }
    }
  };

  const sendVoiceCommand = (text: string, topicName: string) => {
    stopAllAudio();
    setActiveTopic(topicName);
    setUserTranscript(text);
    setCaptions(`You: "${text}"`);
    setVoiceState('thinking');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input.text', text }));
    } else {
      setCaptions('Reconnecting voice socket...');
      startVoiceSession().then(() => {
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'input.text', text }));
          }
        }, 500);
      });
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const quickScenarios = [
    { label: 'Cancel Order ORD-1001', topic: 'Sensitive Operation -> Four-Eyes Handoff', text: 'Please cancel my order ORD-1001 immediately!', icon: ShieldAlert, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20' },
    { label: 'Track Order ORD-1001', topic: 'Order Tracking Tool', text: 'Where is my order ORD-1001 currently located?', icon: Package, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20' },
    { label: 'Pricing & Subscriptions', topic: 'Institutional Knowledge RAG', text: 'Can you explain your product pricing and subscription tiers?', icon: DollarSign, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20' },
    { label: 'Troubleshoot Network Error', topic: 'Technical Diagnostic RAG', text: 'I am experiencing WiFi connectivity errors, how do I troubleshoot?', icon: Wrench, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20' },
    { label: 'Hardware Warranty Policy', topic: 'Warranty & Returns RAG', text: 'What is your warranty and return policy on hardware devices?', icon: Shield, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20' },
    { label: 'Escalate to Human Supervisor', topic: 'Direct Human Transfer', text: 'Please transfer me directly to a human support supervisor!', icon: UserCheck, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20' },
  ];

  return createPortal(
    <div className="voice-modal-overlay !z-[99999]">
      <div className="voice-modal-card !max-w-2xl !p-6 flex flex-col justify-between max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">AI Voice Concierge & Multi-Topic RAG</h3>
              <p className="text-[11px] text-slate-400 font-medium">Active Topic: <strong className="text-indigo-400">{activeTopic}</strong> • 24kHz High-Fidelity Audio</p>
            </div>
          </div>
          <Badge variant="outline" className={`voice-status-badge ${voiceState} text-xs font-semibold gap-1.5 px-3 py-1 rounded-full border`}>
            <Sparkles size={12} />
            <span>{voiceState.replace('_', ' ')}</span>
          </Badge>
        </div>

        {/* Visualizer Wave */}
        <div className="voice-wave-container !my-6">
          <div className={`voice-wave-bar ${voiceState === 'speaking' || voiceState === 'speech_detected' ? 'active' : ''}`} />
          <div className={`voice-wave-bar ${voiceState === 'speaking' || voiceState === 'speech_detected' ? 'active' : ''}`} />
          <div className={`voice-wave-bar ${voiceState === 'speaking' || voiceState === 'speech_detected' ? 'active' : ''}`} />
          <div className={`voice-wave-bar ${voiceState === 'speaking' || voiceState === 'speech_detected' ? 'active' : ''}`} />
          <div className={`voice-wave-bar ${voiceState === 'speaking' || voiceState === 'speech_detected' ? 'active' : ''}`} />
        </div>

        {/* Live Captions Box */}
        <div className="voice-captions-box !min-h-[85px] !text-left !px-4 !py-3 !bg-slate-950/80 !border-white/10">
          <p className="text-xs font-mono leading-relaxed text-slate-200">{captions}</p>
          {userTranscript && voiceState === 'thinking' && (
            <p className="text-[11px] text-indigo-400 font-sans mt-1.5 animate-pulse flex items-center gap-1.5">
              <Sparkles size={12} /> Retrieving organizational knowledge & verifying business policies...
            </p>
          )}
        </div>

        {/* Interactive Voice Scenario Simulator */}
        <div className="mt-4 pt-3 space-y-2">
          <Separator className="bg-white/10 mb-3" />
          <label className="text-[11px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
            <HelpCircle size={13} className="text-indigo-400" />
            Live Topic Simulation & RAG Verification (Click to Test Voice Response):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickScenarios.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={idx}
                  variant="outline"
                  onClick={() => sendVoiceCommand(item.text, item.topic)}
                  className={`p-2.5 h-auto rounded-xl text-left flex flex-col items-start justify-between transition-all cursor-pointer shadow-sm active:scale-95 whitespace-normal ${item.color}`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <IconComponent size={14} className="shrink-0" />
                    <span className="line-clamp-1">{item.label}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1 line-clamp-1">{item.topic}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="w-12 h-12 rounded-full bg-slate-900 border-white/15 hover:bg-slate-800 text-slate-200 cursor-pointer shadow-lg"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff size={20} color="#ef4444" /> : <Mic size={20} />}
          </Button>

          {voiceState === 'speaking' && (
            <Button
              variant="destructive"
              onClick={handleInterrupt}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Zap size={16} />
              <span>Barge-in (Interrupt)</span>
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg"
            title="End Call"
          >
            <PhoneOff size={20} />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
