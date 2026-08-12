import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, Sparkles, Zap, MessageSquare, 
  HelpCircle, CheckCircle2, User, ChevronRight, RefreshCw,
  Copy, Check, Volume2, ScreenShare, Shield, KeyRound
} from 'lucide-react';
import { generateAiBotResponse, SAM_BOT_USER, type AiBotResponse } from '../../services/aiBotService';
import { useAuthStore } from '../../store/useAuthStore';
import { useServerStore } from '../../store/useServerStore';
import clsx from 'clsx';

interface AiMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
  quickReplies?: string[];
  actionType?: string;
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNitro?: () => void;
  onOpenInvite?: () => void;
  onOpenSettings?: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onOpenNitro,
  onOpenInvite,
  onOpenSettings,
}) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      content: "Hi there! Thanks for reaching out to ProChat support. I'm **Sam**—how can I help you today? 🤖✨",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickReplies: [
        '📺 Screen Sharing Blank Fix',
        '👥 How to Invite Friends',
        '⚡ Nitro & Billing',
        '🎙️ HD Voice & Soundboard',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: AiMessage = {
      id: 'msg-usr-' + Date.now(),
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate realistic AI typing delay
    setTimeout(async () => {
      const response: AiBotResponse = await generateAiBotResponse(query);
      const botMsg: AiMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'bot',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickReplies: response.quickReplies,
        actionType: response.actionType,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleActionClick = (actionType?: string) => {
    if (actionType === 'nitro') {
      onClose();
      onOpenNitro?.();
    } else if (actionType === 'invite') {
      onClose();
      onOpenInvite?.();
    } else if (actionType === 'settings') {
      onClose();
      onOpenSettings?.();
    } else if (actionType === 'voice' || actionType === 'screenshare') {
      onClose();
      const hq = useServerStore.getState().servers.find(s => s.id === 'pro-chat-hq') || useServerStore.getState().servers[0];
      const voiceCh = hq?.channels.find(c => c.type === 'VOICE');
      if (voiceCh) {
        useServerStore.getState().setActiveChannel(voiceCh.id);
      }
    } else if (actionType === 'fix_profile') {
      useServerStore.getState().resetToSingleOfficialServer();
      setMessages(prev => [
        ...prev,
        {
          id: 'msg-bot-reset-' + Date.now(),
          sender: 'bot',
          content: '✅ **Done!** All cluttered profiles have been removed. You are now cleanly connected to **Pro Chat HQ** with code `PRO-HD`! 🎉',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-lg h-[80vh] max-h-[680px] bg-[#0E121B] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/40 flex flex-col transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-[#0A0D14] border-b border-[#181D2A] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={SAM_BOT_USER.avatarUrl} 
                alt="Sam AI" 
                className="w-10 h-10 rounded-2xl border-2 border-cyan-400/50 shadow-md shadow-cyan-500/20"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0A0D14]" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-black text-sm">{SAM_BOT_USER.name}</span>
                <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider shadow-sm">
                  BOT
                </span>
                <span className="text-[11px] text-cyan-400 font-bold">ProChat AI</span>
              </div>
              <p className="text-[11px] text-gray-400">Online • 24/7 Professional Assistant</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cyan-400 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4 bg-[#080A0F]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                "flex flex-col",
                msg.sender === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className="flex items-end space-x-2 max-w-[88%]">
                {msg.sender === 'bot' && (
                  <img
                    src={SAM_BOT_USER.avatarUrl}
                    alt="Sam"
                    className="w-7 h-7 rounded-xl shrink-0 border border-cyan-400/30 mb-1"
                  />
                )}

                <div
                  className={clsx(
                    "p-3.5 rounded-2xl text-xs leading-relaxed shadow-lg whitespace-pre-line",
                    msg.sender === 'user'
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-none"
                      : "bg-[#111522] border border-cyan-500/20 text-gray-200 rounded-bl-none"
                  )}
                >
                  {/* Format markdown-style bold text */}
                  {msg.content.split('\n').map((line, idx) => (
                    <div key={idx} className={clsx(line.startsWith('•') && "pl-1 my-0.5")}>
                      {line}
                    </div>
                  ))}

                  <div className={clsx(
                    "text-[9px] mt-1.5 font-bold flex justify-end",
                    msg.sender === 'user' ? "text-cyan-200" : "text-gray-500"
                  )}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>

              {/* Quick Reply Chips */}
              {msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-9">
                  {msg.quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(reply)}
                      className="px-2.5 py-1 rounded-xl bg-[#141926] hover:bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 font-bold text-[11px] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-1"
                    >
                      <Sparkles size={11} />
                      <span>{reply}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-gray-400 pl-2">
              <img
                src={SAM_BOT_USER.avatarUrl}
                alt="Sam"
                className="w-6 h-6 rounded-lg border border-cyan-400/30 animate-pulse"
              />
              <span className="font-bold text-cyan-400">Sam is typing</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#0A0D14] border-t border-[#181D2A] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2 bg-[#111522] border border-cyan-500/30 rounded-2xl px-3 py-1.5 focus-within:border-cyan-400 transition-all shadow-inner"
          >
            <Bot size={18} className="text-cyan-400 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sam anything (e.g. screen sharing, billing, server invites)..."
              className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 outline-none py-1.5"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={clsx(
                "p-2 rounded-xl transition-all cursor-pointer",
                input.trim() && !isTyping
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-105 shadow-md shadow-cyan-400/20"
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              )}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;
