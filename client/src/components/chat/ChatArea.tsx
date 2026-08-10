import React, { useState, useEffect, useRef } from 'react';
import { 
  Hash, Search, Bell, BellOff, Pin, Users, Plus, Smile, 
  FileImage, Send, Sparkles, Zap, UserPlus, Volume2, 
  Gift, Heart, ArrowRight, MessageSquare, Bot, HelpCircle
} from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useMessageStore } from '../../store/useMessageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { useSocket } from '../../hooks/useSocket';
import { EmojiPicker } from './EmojiPicker';
import { MemberList } from './MemberList';
import { InviteModal } from '../modals/InviteModal';
import { NitroModal } from '../modals/NitroModal';
import { AiAssistantModal } from '../modals/AiAssistantModal';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

export const ChatArea: React.FC = () => {
  const { activeServerId, activeChannelId, servers, setActiveChannel } = useServerStore();
  const { messages, fetchMessages, sendMessage, isLoading } = useMessageStore();
  const { user } = useAuthStore();
  const { isNitro, nitroTier } = useNitroStore();
  
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isMemberListOpen, setIsMemberListOpen] = useState(true);
  const [isMutedNotifications, setIsMutedNotifications] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isGifsOpen, setIsGifsOpen] = useState(false);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId) || activeServer?.channels[0];

  useSocket(activeChannelId || '');

  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
    }
  }, [activeChannelId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = content.trim();
    if (!textToSend || !activeChannelId) return;

    try {
      setContent('');
      await sendMessage(activeChannelId, textToSend);
      setIsEmojiPickerOpen(false);
      setIsGifsOpen(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message');
    }
  };

  const handleSendWave = async () => {
    if (!activeChannelId) return;
    await sendMessage(activeChannelId, `👋 ${user?.name || 'Hey everyone'} waves hello to the channel!`);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!activeChannelId) return;
    try {
      await sendMessage(activeChannelId, gifUrl);
      setIsGifsOpen(false);
    } catch (err) {
      console.error('Failed to send GIF');
    }
  };

  if (!activeChannel) {
    return (
      <div className="flex-1 flex flex-col bg-[#0B0E14] min-w-0 items-center justify-center text-gray-500 font-medium select-none">
        <Hash size={48} className="text-cyan-400/30 mb-2" />
        <span>Select a channel to start chatting</span>
      </div>
    );
  }

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAiChannel = activeChannel.id === 'ch-ai-bot' || activeChannel.name.includes('ai') || activeChannel.name.includes('bot');

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0E14] min-w-0 overflow-hidden select-none">
      {/* Channel Header Bar */}
      <div className="h-14 border-b border-[#181D2A] px-6 flex items-center justify-between shrink-0 bg-[#0E121B]">
        <div className="flex items-center space-x-3 min-w-0">
          {isAiChannel ? (
            <Bot size={22} className="text-cyan-400 shrink-0" />
          ) : (
            <Hash size={22} className="text-cyan-400 shrink-0" />
          )}
          <span className="font-black text-white text-base tracking-tight truncate">
            {activeChannel.name}
          </span>
          <div className="h-4 w-[1px] bg-white/10 mx-1 shrink-0" />
          <span className="text-xs text-gray-400 truncate hidden sm:inline">
            {isAiChannel 
              ? '🤖 24/7 ProChat AI Support & Help Assistant'
              : `Welcome to #${activeChannel.name} of ${activeServer.name}`}
          </span>
        </div>

        {/* Action Icons */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* AI Assistant Quick Launcher */}
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Ask Sam AI Assistant"
          >
            <Bot size={15} />
            <span>Ask Sam AI</span>
          </button>

          {/* Invite Friends Button */}
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#161B28] hover:bg-pink-500/20 border border-pink-400/30 text-pink-300 font-black text-xs rounded-xl transition-all cursor-pointer"
            title="Invite Friends"
          >
            <UserPlus size={14} />
            <span className="hidden md:inline">Invite</span>
          </button>

          {/* Search Box */}
          <div className="relative hidden md:block">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141824] text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 w-36 focus:w-48 transition-all border border-white/5"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
          </div>

          <button 
            onClick={() => setIsMemberListOpen(!isMemberListOpen)}
            className={clsx(
              "p-2 rounded-xl transition-colors cursor-pointer",
              isMemberListOpen ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
            title="Toggle Member List"
          >
            <Users size={18} />
          </button>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 flex flex-col justify-start">
          {/* Hero Welcome Header */}
          <div className="text-center py-6 px-4 mb-2 bg-[#0E121C] rounded-3xl border border-cyan-500/20 shadow-xl flex flex-col items-center justify-center animate-fade-in shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20 animate-scale-up">
              {isAiChannel ? (
                <Bot size={34} className="text-black" />
              ) : (
                <Hash size={34} className="text-black stroke-[2.5]" />
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
              Welcome to <span className="bg-gradient-to-r from-cyan-300 via-pink-400 to-yellow-300 bg-clip-text text-transparent">#{activeChannel.name}</span>!
            </h1>
            <p className="text-gray-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
              {isAiChannel ? (
                <>This is the 24/7 AI Assistant channel with <strong className="text-cyan-300">Sam</strong>. Ask any question about screen sharing, voice channels, billing, or server invites!</>
              ) : (
                <>This is the start of the <strong className="text-cyan-300">#{activeChannel.name}</strong> channel. Send a wave, hop into voice, or invite your friends!</>
              )}
            </p>

            {/* Quick Starter Action Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 w-full max-w-2xl">
              {isAiChannel ? (
                <>
                  <button
                    onClick={() => sendMessage(activeChannel.id, 'How do I fix blank screen sharing?')}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-cyan-400 hover:text-black text-gray-200 border border-white/10 hover:border-cyan-400 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">📺</span>
                    <span className="text-xs font-black">Screen Share</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">Blank screen fix</span>
                  </button>

                  <button
                    onClick={() => sendMessage(activeChannel.id, 'How do I invite friends with server code?')}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-pink-500 hover:text-white text-gray-200 border border-white/10 hover:border-pink-400 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">👥</span>
                    <span className="text-xs font-black">Invite Friends</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-white/80">1-click join guide</span>
                  </button>

                  <button
                    onClick={() => sendMessage(activeChannel.id, 'What are the Nitro subscription features?')}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-yellow-400 hover:text-black text-gray-200 border border-white/10 hover:border-yellow-400 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">⚡</span>
                    <span className="text-xs font-black">Nitro & Perks</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">Badges & 60FPS</span>
                  </button>

                  <button
                    onClick={() => sendMessage(activeChannel.id, 'How do I use HD Voice and Soundboard?')}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-cyan-400 hover:text-black text-gray-200 border border-white/10 hover:border-cyan-400 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">🎙️</span>
                    <span className="text-xs font-black">HD Voice Call</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">Soundboard guide</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSendWave}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-cyan-400 hover:text-black text-gray-200 border border-white/10 hover:border-cyan-400 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">👋</span>
                    <span className="text-xs font-black">Send a Wave</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">Say hello!</span>
                  </button>

                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-pink-500 hover:text-white text-gray-200 border border-white/10 hover:border-pink-400 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">👥</span>
                    <span className="text-xs font-black">Invite Friends</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-white/80">Server code</span>
                  </button>

                  <button
                    onClick={() => {
                      const voiceCh = activeServer?.channels.find(c => c.type === 'VOICE');
                      if (voiceCh) setActiveChannel(voiceCh.id);
                    }}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-cyan-400 hover:text-black text-gray-200 border border-white/10 hover:border-cyan-400 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">🎙️</span>
                    <span className="text-xs font-black">Join Voice</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">HD Talk & Video</span>
                  </button>

                  <button
                    onClick={() => setIsNitroModalOpen(true)}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-gradient-to-tr hover:from-pink-500 hover:to-yellow-400 hover:text-black text-gray-200 border border-white/10 hover:border-yellow-400 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">⚡</span>
                    <span className="text-xs font-black">Nitro & Gifts</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">Unlock perks</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-cyan-400/60 text-center w-full py-4 text-xs font-bold">Loading messages...</div>
          ) : (
            <>
              {/* Message List Items */}
              {filteredMessages.slice().reverse().map((msg) => {
                const isAuthorBot = msg.author.isBot || msg.author.id.includes('bot');

                return (
                  <div key={msg.id} className="group hover:bg-[#111522] -mx-4 px-4 py-2.5 rounded-2xl transition-colors border border-transparent hover:border-cyan-500/15">
                    <div className="flex items-start">
                      <img 
                        src={msg.author.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.author.name}&backgroundColor=fbbf24`} 
                        alt="Avatar" 
                        className={clsx(
                          "w-10 h-10 rounded-2xl object-cover shrink-0 mt-0.5 shadow-md",
                          isAuthorBot ? "border-2 border-cyan-400 shadow-cyan-500/20" : "border border-white/10"
                        )}
                      />
                      <div className="ml-3.5 flex-1 min-w-0">
                        <div className="flex items-baseline space-x-2">
                          <span className={clsx(
                            "font-extrabold text-sm hover:text-cyan-300 cursor-pointer transition-colors",
                            isAuthorBot ? "text-cyan-300" : "text-white"
                          )}>
                            {msg.author.name}
                          </span>

                          {/* Discord [BOT] Badge */}
                          {isAuthorBot && (
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded uppercase tracking-wider shadow-sm">
                              BOT
                            </span>
                          )}

                          {((msg.author.id === user?.id && isNitro) || (msg.author as any).isNitro) && (
                            <NitroBadge tier={(msg.author.id === user?.id ? nitroTier : (msg.author as any).nitroTier) || 'nitro'} size="sm" />
                          )}
                          <span className="text-gray-500 text-[10px] font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {msg.content.startsWith('http') && (msg.content.includes('.gif') || msg.content.includes('giphy') || msg.content.includes('tenor')) ? (
                          <img src={msg.content} alt="GIF" className="max-w-xs rounded-2xl mt-2 shadow-xl border border-white/10" />
                        ) : (
                          <div className="text-gray-200 text-sm mt-1 leading-relaxed whitespace-pre-wrap font-normal select-text">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="px-6 pb-6 pt-2 shrink-0 relative bg-[#0E121B]">
          {/* Emoji Picker Popover */}
          <EmojiPicker 
            isOpen={isEmojiPickerOpen} 
            onSelect={handleEmojiSelect} 
            onClose={() => setIsEmojiPickerOpen(false)} 
          />

          {/* Quick GIF Popover */}
          {isGifsOpen && (
            <div className="absolute bottom-20 right-6 z-40 w-72 bg-[#111522] border border-cyan-500/30 rounded-2xl shadow-2xl p-3 animate-scale-up">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Popular GIFs</span>
                <button onClick={() => setIsGifsOpen(false)} className="text-gray-400 hover:text-white text-xs cursor-pointer">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar">
                {[
                  'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
                  'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif',
                  'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
                  'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif'
                ].map((gif, idx) => (
                  <img
                    key={idx}
                    src={gif}
                    alt="gif"
                    onClick={() => handleSendGif(gif)}
                    className="rounded-xl cursor-pointer hover:opacity-80 transition-opacity h-20 w-full object-cover border border-white/10"
                  />
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-[#111522] border border-[#1D2538] focus-within:border-cyan-400/70 focus-within:ring-2 focus-within:ring-cyan-400/20 rounded-2xl flex items-center px-4 py-3 shadow-xl transition-all">
            {/* Attachment Button */}
            <button 
              type="button" 
              onClick={() => handleEmojiSelect(' 📎 ')} 
              className="text-gray-400 hover:text-cyan-400 transition-colors p-1 mr-2 shrink-0 rounded-xl hover:bg-[#161B28] cursor-pointer"
              title="Add Attachment"
            >
              <Plus size={18} />
            </button>
            
            <input 
              ref={inputRef}
              type="text" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAiChannel ? "Ask Sam anything (or type @Sam in any channel)..." : `Message #${activeChannel.name}...`}
              className="bg-transparent flex-1 text-sm text-white placeholder-gray-500 focus:outline-none"
            />

            <div className="flex items-center space-x-1.5 ml-2">
              {/* Nitro Gift Button */}
              <button 
                type="button" 
                onClick={() => setIsNitroModalOpen(true)}
                className="text-pink-400 hover:text-pink-300 transition-colors p-1.5 rounded-xl hover:bg-[#161B28] cursor-pointer"
                title="Gift Nitro"
              >
                <Gift size={18} />
              </button>

              {/* GIF Button */}
              <button 
                type="button" 
                onClick={() => setIsGifsOpen(!isGifsOpen)}
                className="text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-xl hover:bg-[#161B28] font-bold text-xs cursor-pointer"
                title="Send GIF"
              >
                GIF
              </button>

              {/* Emoji Button */}
              <button 
                type="button" 
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className="text-gray-400 hover:text-yellow-400 transition-colors p-1.5 rounded-xl hover:bg-[#161B28] cursor-pointer"
                title="Add Emoji"
              >
                <Smile size={18} />
              </button>

              {/* Send Button */}
              <button 
                type="submit" 
                disabled={!content.trim()}
                className={clsx(
                  "p-2 rounded-xl transition-all cursor-pointer",
                  content.trim() 
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-105 shadow-md shadow-cyan-400/20" 
                    : "text-gray-600 cursor-not-allowed"
                )}
                title="Send Message"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Member List Drawer */}
      {isMemberListOpen && (
        <MemberList serverId={activeServer.id} />
      )}

      {/* Modals */}
      <InviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        serverName={activeServer.name}
        inviteCode={activeServer.inviteCode || 'PRO-HQ-8821'}
      />

      <NitroModal
        isOpen={isNitroModalOpen}
        onClose={() => setIsNitroModalOpen(false)}
      />

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onOpenNitro={() => setIsNitroModalOpen(true)}
        onOpenInvite={() => setIsInviteModalOpen(true)}
      />
    </div>
  );
};

export default ChatArea;
