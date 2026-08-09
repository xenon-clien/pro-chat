import React, { useState, useEffect, useRef } from 'react';
import { 
  Hash, Search, Bell, BellOff, Pin, Users, Plus, Smile, 
  FileImage, Send, Sparkles, Zap, UserPlus, Volume2, 
  Gift, Heart, ArrowRight, MessageSquare
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
  const inputRef = useRef<HTMLInputElement>(null);
  
  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId) || activeServer?.channels[0];

  useSocket(activeChannelId || '');

  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
    }
  }, [activeChannelId, fetchMessages]);

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

  return (
    <div className="flex-1 flex h-full min-w-0 overflow-hidden relative bg-[#0B0E14] select-none">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col bg-[#0E121B] min-w-0 h-full border-r border-[#181D2A]">
        {/* Top Channel Header Bar */}
        <div className="h-14 border-b border-[#181D2A] flex items-center justify-between px-6 shrink-0 shadow-sm bg-[#0E121B] z-10">
          <div className="flex items-center space-x-2.5 truncate">
            <Hash size={22} className="text-cyan-400 shrink-0" />
            <span className="text-white font-black text-base truncate tracking-tight">{activeChannel.name}</span>
            <span className="hidden md:inline text-xs text-gray-400 border-l border-[#1D2538] pl-3">
              Welcome to #{activeChannel.name} • Hangout & Voice
            </span>
          </div>
          
          <div className="flex items-center space-x-2.5 text-gray-400">
            {/* Notification Toggle */}
            <button 
              onClick={() => setIsMutedNotifications(!isMutedNotifications)}
              className={clsx(
                "p-2 rounded-xl hover:bg-[#161B28] transition-colors cursor-pointer",
                isMutedNotifications ? "text-rose-400" : "text-gray-400 hover:text-cyan-400"
              )}
              title={isMutedNotifications ? "Unmute Channel" : "Mute Channel"}
            >
              {isMutedNotifications ? <BellOff size={17} /> : <Bell size={17} />}
            </button>

            {/* Pinned Messages Toggle */}
            <button 
              onClick={() => setIsPinnedOpen(!isPinnedOpen)}
              className={clsx(
                "p-2 rounded-xl hover:bg-[#161B28] transition-colors cursor-pointer",
                isPinnedOpen ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400 hover:text-cyan-400"
              )}
              title="Pinned Messages"
            >
              <Pin size={17} />
            </button>

            {/* Member List Toggle */}
            <button 
              onClick={() => setIsMemberListOpen(!isMemberListOpen)}
              className={clsx(
                "p-2 rounded-xl transition-colors cursor-pointer",
                isMemberListOpen ? "text-black bg-cyan-400 font-bold" : "text-gray-400 hover:bg-[#161B28] hover:text-cyan-400"
              )}
              title="Member List"
            >
              <Users size={17} />
            </button>
            
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="bg-[#111522] text-xs text-gray-200 placeholder-gray-500 rounded-xl px-3 py-1.5 w-32 md:w-44 focus:w-56 transition-all outline-none border border-[#1D2538] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
              />
              <Search size={14} className="absolute right-3 top-2.5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Pinned Messages Popover */}
        {isPinnedOpen && (
          <div className="bg-[#111522] border-b border-cyan-500/30 p-3 shadow-lg flex items-center justify-between text-xs text-gray-300 animate-fade-in">
            <div className="flex items-center space-x-2">
              <Pin size={16} className="text-cyan-400 shrink-0" />
              <span><strong>Pinned:</strong> Welcome to ProChat! Real-time messaging, Discord Nitro, and HD voice are active. ⚡</span>
            </div>
            <button onClick={() => setIsPinnedOpen(false)} className="text-gray-400 hover:text-cyan-400 font-bold p-1 cursor-pointer">✕</button>
          </div>
        )}

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col-reverse space-y-reverse space-y-2">
          {isLoading ? (
            <div className="text-cyan-400/60 text-center w-full py-4 text-xs font-bold">Loading messages...</div>
          ) : (
            <>
              {/* Message List Items */}
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="group hover:bg-[#111522] -mx-4 px-4 py-2.5 rounded-2xl transition-colors border border-transparent hover:border-cyan-500/15">
                  <div className="flex items-start">
                    <img 
                      src={msg.author.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.author.name}&backgroundColor=fbbf24`} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-2xl object-cover shrink-0 mt-0.5 border border-white/10 shadow-md"
                    />
                    <div className="ml-3.5 flex-1 min-w-0">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-white font-extrabold text-sm hover:text-cyan-300 cursor-pointer transition-colors">
                          {msg.author.name}
                        </span>
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
                        <p className="text-gray-200 text-sm mt-1 leading-relaxed whitespace-pre-wrap font-normal select-text">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* ──────── RENOVATED HERO WELCOME HUB ──────── */}
              <div className="flex flex-col items-center justify-center text-center my-8 p-8 bg-gradient-to-b from-[#111522]/80 to-transparent rounded-3xl border border-cyan-500/20 shadow-2xl relative overflow-hidden animate-fade-in">
                {/* Glowing Ambient Background Circles */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Hero Icon Emblem */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-pink-500 p-0.5 shadow-2xl shadow-cyan-500/20 flex items-center justify-center animate-character-float">
                    <div className="w-full h-full bg-[#0E121B] rounded-[22px] flex items-center justify-center">
                      <Hash size={40} className="text-cyan-400 stroke-[2.5]" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs shadow-md">
                    ✨
                  </div>
                </div>

                {/* Main Heading & Subtitle */}
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">
                  Welcome to <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">#{activeChannel.name}!</span> 👋
                </h1>
                <p className="text-gray-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
                  This is the very start of the <strong className="text-cyan-300">#{activeChannel.name}</strong> channel. 
                  Send a wave, hop into voice, or invite your friends to start chatting!
                </p>

                {/* Quick Starter Action Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 w-full max-w-2xl">
                  {/* Action 1: Send Wave */}
                  <button
                    onClick={handleSendWave}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-cyan-400 hover:text-black text-gray-200 border border-white/10 hover:border-cyan-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">👋</span>
                    <span className="text-xs font-black">Send a Wave</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">Say hello!</span>
                  </button>

                  {/* Action 2: Invite Friends */}
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-pink-500 hover:text-white text-gray-200 border border-white/10 hover:border-pink-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">👥</span>
                    <span className="text-xs font-black">Invite Friends</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-white/80">Server code</span>
                  </button>

                  {/* Action 3: Join Voice */}
                  <button
                    onClick={() => {
                      const voiceCh = activeServer?.channels.find(c => c.type === 'VOICE');
                      if (voiceCh) setActiveChannel(voiceCh.id);
                    }}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-cyan-400 hover:text-black text-gray-200 border border-white/10 hover:border-cyan-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">🎙️</span>
                    <span className="text-xs font-black">Join Voice</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">HD Talk & Video</span>
                  </button>

                  {/* Action 4: Nitro Perks */}
                  <button
                    onClick={() => setIsNitroModalOpen(true)}
                    className="p-3 rounded-2xl bg-[#141926] hover:bg-gradient-to-tr hover:from-pink-500 hover:to-yellow-400 hover:text-black text-gray-200 border border-white/10 hover:border-yellow-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">⚡</span>
                    <span className="text-xs font-black">Nitro & Gifts</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-black/80">Unlock perks</span>
                  </button>
                </div>
              </div>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={`Message #${activeChannel.name}...`} 
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none w-full text-sm font-semibold"
              autoComplete="off"
            />
            
            <div className="flex items-center space-x-1.5 text-gray-400 ml-2 shrink-0">
              {/* Nitro Gift / Perks Button */}
              <button
                type="button"
                onClick={() => setIsNitroModalOpen(true)}
                className={clsx(
                  "p-1.5 rounded-xl transition-all cursor-pointer",
                  isNitro
                    ? "text-pink-400 hover:bg-pink-500/10"
                    : "text-gray-400 hover:text-pink-400 hover:bg-[#161B28]"
                )}
                title="Nitro & Gifts"
              >
                <Zap size={18} className={clsx(isNitro && "fill-pink-400 text-pink-400")} />
              </button>

              {/* GIF Button */}
              <button
                type="button"
                onClick={() => {
                  setIsGifsOpen(!isGifsOpen);
                  setIsEmojiPickerOpen(false);
                }}
                className={clsx(
                  "p-1.5 rounded-xl hover:text-cyan-400 hover:bg-[#161B28] transition-colors cursor-pointer",
                  isGifsOpen ? "text-cyan-400 bg-cyan-500/10" : "text-gray-400"
                )}
                title="Send a GIF"
              >
                <FileImage size={18} />
              </button>

              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => {
                  setIsEmojiPickerOpen(!isEmojiPickerOpen);
                  setIsGifsOpen(false);
                }}
                className={clsx(
                  "p-1.5 rounded-xl hover:text-yellow-400 hover:bg-[#161B28] transition-colors cursor-pointer",
                  isEmojiPickerOpen ? "text-yellow-400 bg-yellow-400/10" : "text-gray-400"
                )}
                title="Select Emoji"
              >
                <Smile size={18} />
              </button>

              {/* Gradient Send Button */}
              <button
                type="submit"
                disabled={!content.trim()}
                className={clsx(
                  "p-2 px-4 rounded-xl transition-all flex items-center space-x-1.5 font-black text-xs shadow-md",
                  content.trim() 
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-cyan-500/25 cursor-pointer hover:scale-105 active:scale-95" 
                    : "bg-[#1A2030] text-gray-600 cursor-not-allowed opacity-40"
                )}
                title="Send Message"
              >
                <Send size={13} className="fill-current" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Member List Sidebar */}
      {isMemberListOpen && activeServer && (
        <MemberList serverId={activeServer.id} />
      )}

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        serverName={activeServer?.name || 'Pro Chat'}
        inviteCode={activeServer?.inviteCode || 'PRO-HQ-8821'}
      />

      <NitroModal 
        isOpen={isNitroModalOpen}
        onClose={() => setIsNitroModalOpen(false)}
      />
    </div>
  );
};

export default ChatArea;
