'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Sparkles,
  Zap,
  Lock,
  MessageSquare,
  StickyNote,
} from 'lucide-react';

export interface MessageItem {
  id: string;
  role: 'customer' | 'assistant' | 'agent' | 'system';
  content: string;
  channel?: string;
  createdAt: string;
}

interface TranscriptViewProps {
  caseId: string;
  conversationId: string;
  customerName?: string;
  messages: MessageItem[];
  onSendMessage: (content: string, role: 'agent' | 'system') => Promise<void>;
}

const CANNED_MACROS = [
  {
    label: 'Apologize & Replace',
    text: 'I sincerely apologize for the damaged item. I have authorized an immediate expedited replacement order for you at no charge and emailed a pre-paid return label.',
  },
  {
    label: 'Request Photo',
    text: 'Could you please share a quick photo of the damaged package so our logistics team can file a courier claim and expedite your resolution?',
  },
  {
    label: 'Customs Delay Update',
    text: 'I have checked directly with our international freight dispatcher. Your shipment is currently passing standard EU customs clearance and will be released for delivery within 24-48 hours.',
  },
  {
    label: 'Issue Resolved',
    text: 'Is there anything else I can assist you with today? Thank you for reaching out to our Customer Success team!',
  },
];

export function TranscriptView({
  conversationId,
  customerName = 'Customer',
  messages,
  onSendMessage,
}: TranscriptViewProps) {
  const [inputText, setInputText] = useState('');
  const [sendMode, setSendMode] = useState<'agent' | 'system'>('agent');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await onSendMessage(textToSend, sendMode);
    } catch {
      // Revert if error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b1120] relative min-w-0">
      {/* Transcript Header */}
      <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs border border-white/10">
            {customerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
              <span>{customerName}</span>
              <span className="text-[10px] text-slate-400 font-normal font-mono">
                ({conversationId})
              </span>
            </h2>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Escalated Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-0.5 bg-slate-800 rounded text-[11px] border border-white/5">
            {messages.length} Messages
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          const isAgent = msg.role === 'agent';
          const isInternal = msg.role === 'system';

          if (isInternal) {
            return (
              <div
                key={msg.id || index}
                className="mx-auto max-w-xl p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-2.5"
              >
                <StickyNote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] text-amber-400/80 mb-0.5">
                    <span className="font-semibold uppercase tracking-wide">Internal Agent Note</span>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </div>
            );
          }

          if (isAgent) {
            return (
              <div key={msg.id || index} className="flex justify-end">
                <div className="max-w-xl space-y-1">
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-indigo-300">
                    <span className="font-semibold">You (Support Agent)</span>
                    <span>•</span>
                    <span>{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className="p-3.5 bg-indigo-600 text-white rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-lg shadow-indigo-950/50">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id || index} className="flex items-start gap-3 max-w-xl">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold mt-1 ${
                  isAssistant
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'bg-slate-800 text-slate-300 border border-white/10'
                }`}
              >
                {isAssistant ? <Sparkles className="w-3.5 h-3.5 text-purple-400" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {isAssistant ? 'AI Service Bot' : customerName}
                  </span>
                  <span>•</span>
                  <span>{formatTime(msg.createdAt)}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    isAssistant
                      ? 'bg-purple-950/20 text-purple-100 border-purple-500/20 rounded-tl-sm'
                      : 'bg-slate-900 text-slate-100 border-white/10 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer Section */}
      <div className="p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-lg space-y-2.5">
        {/* Quick Canned Macros Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          <span className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1 shrink-0">
            <Zap className="w-3 h-3 text-amber-400" /> Macros:
          </span>
          {CANNED_MACROS.map((macro, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(macro.text)}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-white/5 whitespace-nowrap transition-colors"
            >
              {macro.label}
            </button>
          ))}
        </div>

        {/* Input Box & Mode Selection */}
        <div className="bg-slate-900 border border-white/10 rounded-xl p-2.5 focus-within:border-indigo-500 transition-colors">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setSendMode('agent')}
                className={`px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1 transition-all ${
                  sendMode === 'agent'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3 h-3" /> Reply to Customer
              </button>
              <button
                onClick={() => setSendMode('system')}
                className={`px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1 transition-all ${
                  sendMode === 'system'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3 h-3" /> Internal Agent Note
              </button>
            </div>
            <span className="text-[10px] text-slate-500">Cmd + Enter to send</span>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder={
              sendMode === 'agent'
                ? `Type your message to ${customerName}...`
                : 'Write an internal note (only visible to support agents)...'
            }
            className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none"
          />

          <div className="flex items-center justify-end mt-1">
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-md transition-all ${
                sendMode === 'agent'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sendMode === 'agent' ? 'Send Reply' : 'Save Note'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
