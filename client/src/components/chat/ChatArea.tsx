import React, { useState, useEffect, useRef } from 'react';
import { Hash, Search, Bell, BellOff, Pin, Users, Plus, Smile, FileImage, Send, Sparkles, Zap } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useMessageStore } from '../../store/useMessageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { useSocket } from '../../hooks/useSocket';
import { EmojiPicker } from './EmojiPicker';
import { MemberList } from './MemberList';
import NitroBadge from '../ui/NitroBadge';
import { NitroModal } from '../modals/NitroModal';
import clsx from 'clsx';

const ChatArea = () => {
  const { activeServerId, activeChannelId, servers } = useServerStore();
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
  const inputRef = useRef<HTMLInputElement>(null);
  
  const activeServer = servers.find(s => s.id === activeServerId);
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId);

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
      <div className="flex-1 flex flex-col bg-[#0d0e12] min-w-0 items-center justify-center text-gray-500 font-medium">
        <Hash size={48} className="text-yellow-400/30 mb-2" />
        <span>Select a channel to start chatting</span>
      </div>
    );
  }

  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex h-full min-w-0 overflow-hidden relative bg-[#0d0e12]">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col bg-[#121418] min-w-0 h-full border-r border-[#1e222a]/50">
        {/* Header */}
        <div className="h-12 border-b border-[#1e222a] flex items-center justify-between px-4 shrink-0 shadow-sm bg-[#0d0e12] z-10">
          <div className="flex items-center truncate">
            <Hash size={22} className="text-yellow-400 mr-2 shrink-0" />
            <span className="text-white font-bold text-base truncate tracking-tight">{activeChannel.name}</span>
            <span className="hidden md:inline text-xs text-gray-400 ml-3 border-l border-gray-800 pl-3">
              Welcome to #{activeChannel.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-3 text-gray-400">
            {/* Notification Toggle */}
            <button 
              onClick={() => setIsMutedNotifications(!isMutedNotifications)}
              className={clsx(
                "p-1.5 rounded-lg hover:bg-[#1f222b] transition-colors",
                isMutedNotifications ? "text-rose-400" : "text-gray-400 hover:text-yellow-400"
              )}
              title={isMutedNotifications ? "Unmute Channel" : "Mute Channel"}
            >
              {isMutedNotifications ? <BellOff size={18} /> : <Bell size={18} />}
            </button>

            {/* Pinned Messages Toggle */}
            <button 
              onClick={() => setIsPinnedOpen(!isPinnedOpen)}
              className={clsx(
                "p-1.5 rounded-lg hover:bg-[#1f222b] transition-colors",
                isPinnedOpen ? "text-yellow-400 bg-yellow-400/10" : "text-gray-400 hover:text-yellow-400"
              )}
              title="Pinned Messages"
            >
              <Pin size={18} />
            </button>

            {/* Member List Toggle */}
            <button 
              onClick={() => setIsMemberListOpen(!isMemberListOpen)}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                isMemberListOpen ? "text-black bg-yellow-400 font-bold" : "text-gray-400 hover:bg-[#1f222b] hover:text-yellow-400"
              )}
              title="Member List"
            >
              <Users size={18} />
            </button>
            
            {/* Search Input */}
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="bg-[#171920] text-xs text-gray-200 placeholder-gray-500 rounded-lg px-2.5 py-1.5 w-32 md:w-44 focus:w-56 transition-all outline-none border border-[#252833] focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30"
              />
              <Search size={14} className="absolute right-2.5 top-2 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Pinned Messages Popover */}
        {isPinnedOpen && (
          <div className="bg-[#171920] border-b border-yellow-400/30 p-3 shadow-lg flex items-center justify-between text-xs text-gray-300 animate-fade-in">
            <div className="flex items-center">
              <Pin size={16} className="text-yellow-400 mr-2 shrink-0" />
              <span><strong>Pinned:</strong> Welcome to the Black & Yellow ProChat with Supabase! ⚡</span>
            </div>
            <button onClick={() => setIsPinnedOpen(false)} className="text-gray-400 hover:text-yellow-400 ml-3 font-bold">✕</button>
          </div>
        )}

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col-reverse space-y-reverse space-y-1">
          {isLoading ? (
            <div className="text-yellow-400/60 text-center w-full py-4 text-sm font-medium">Loading messages...</div>
          ) : (
            <>
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="mt-3 group hover:bg-[#171920]/80 -mx-4 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-yellow-400/10">
                  <div className="flex items-start">
                    {msg.author.avatarUrl ? (
                      <img 
                        src={msg.author.avatarUrl} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-xl object-cover shrink-0 mt-0.5 border border-yellow-400/60 shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center shrink-0 mt-0.5 cursor-pointer shadow-md font-extrabold text-sm border border-yellow-300">
                        {msg.author.name.substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-3.5 flex-1">
                      <div className="flex items-baseline">
                        <span className="text-yellow-400 font-bold text-sm hover:underline cursor-pointer mr-1.5">{msg.author.name}</span>
                        {/* Show Nitro Badge if author is current user and has Nitro, or if author object has nitro */}
                        {((msg.author.id === user?.id && isNitro) || (msg.author as any).isNitro) && (
                          <NitroBadge tier={(msg.author.id === user?.id ? nitroTier : (msg.author as any).nitroTier) || 'nitro'} size="sm" className="mr-2" />
                        )}
                        <span className="text-gray-500 text-xs">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {msg.content.startsWith('http') && (msg.content.includes('.gif') || msg.content.includes('giphy') || msg.content.includes('tenor')) ? (
                        <img src={msg.content} alt="GIF" className="max-w-xs rounded-xl mt-2 shadow-xl border border-gray-800" />
                      ) : (
                        <p className="text-[#E5E7EB] text-sm mt-1 leading-relaxed whitespace-pre-wrap font-normal">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col items-center justify-center text-center mt-12 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#171920] border border-yellow-400/30 flex items-center justify-center mb-4 shadow-lg shadow-yellow-400/5">
                  <Hash size={36} className="text-yellow-400" />
                </div>
                <h1 className="text-white font-black text-2xl md:text-3xl mb-1.5 tracking-tight">Welcome to #{activeChannel.name}!</h1>
                <p className="text-gray-400 text-sm">This is the start of the #{activeChannel.name} channel.</p>
              </div>
            </>
          )}
        </div>


        {/* Input Area */}
        <div className="px-4 pb-6 pt-2 shrink-0 relative bg-[#121418]">
          {/* Emoji Picker Popover */}
          <EmojiPicker 
            isOpen={isEmojiPickerOpen} 
            onSelect={handleEmojiSelect} 
            onClose={() => setIsEmojiPickerOpen(false)} 
          />

          {/* Quick GIF Popover */}
          {isGifsOpen && (
            <div className="absolute bottom-16 right-4 z-40 w-72 bg-[#171920] border border-yellow-400/30 rounded-2xl shadow-2xl p-3 animate-scale-up">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
                <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-400">Popular GIFs</span>
                <button onClick={() => setIsGifsOpen(false)} className="text-gray-400 hover:text-white text-xs">✕</button>
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
                    className="rounded-lg cursor-pointer hover:opacity-80 transition-opacity h-20 w-full object-cover border border-gray-800"
                  />
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-[#171920] border border-[#252833] focus-within:border-yellow-400/60 rounded-xl flex items-center px-3.5 py-2.5 shadow-lg transition-all">
            {/* Attachment Button */}
            <button 
              type="button" 
              onClick={() => handleEmojiSelect(' 📎 ')} 
              className="text-gray-400 hover:text-yellow-400 transition-colors p-1 mr-2 shrink-0 rounded-lg hover:bg-[#1f222b]"
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
              placeholder={`Message #${activeChannel.name}`} 
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none w-full text-sm font-medium"
              autoComplete="off"
            />
            
            <div className="flex items-center space-x-1.5 text-gray-400 ml-2 shrink-0">
              {/* Nitro Gift / Perks Button */}
              <button
                type="button"
                onClick={() => setIsNitroModalOpen(true)}
                className={clsx(
                  "p-1.5 rounded-lg transition-all",
                  isNitro
                    ? "text-yellow-400 hover:bg-yellow-400/10"
                    : "text-gray-400 hover:text-yellow-400 hover:bg-[#1f222b]"
                )}
                title={isNitro ? "ProChat Nitro Active" : "Get ProChat Nitro"}
              >
                <Zap size={18} className={clsx(isNitro && "fill-yellow-400")} />
              </button>

              {/* GIF Button */}
              <button
                type="button"
                onClick={() => {
                  setIsGifsOpen(!isGifsOpen);
                  setIsEmojiPickerOpen(false);
                }}
                className={clsx(
                  "p-1.5 rounded-lg hover:text-yellow-400 hover:bg-[#1f222b] transition-colors",
                  isGifsOpen ? "text-yellow-400 bg-yellow-400/10" : "text-gray-400"
                )}
                title="Send a GIF"
              >
                <FileImage size={19} />
              </button>

              {/* Emoji Picker Button */}
              <button
                type="button"
                onClick={() => {
                  setIsEmojiPickerOpen(!isEmojiPickerOpen);
                  setIsGifsOpen(false);
                }}
                className={clsx(
                  "p-1.5 rounded-lg hover:text-yellow-400 hover:bg-[#1f222b] transition-colors",
                  isEmojiPickerOpen ? "text-yellow-400 bg-yellow-400/10" : "text-gray-400"
                )}
                title="Select Emoji"
              >
                <Smile size={19} />
              </button>

              {/* Instant Yellow Send Button */}
              <button
                type="submit"
                disabled={!content.trim()}
                className={clsx(
                  "p-1.5 px-3 rounded-lg transition-all flex items-center space-x-1 font-bold text-xs shadow-md",
                  content.trim() 
                    ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-yellow-400/20 cursor-pointer" 
                    : "bg-[#252833] text-gray-600 cursor-not-allowed opacity-50"
                )}
                title="Send Message"
              >
                <Send size={14} className="fill-current" />
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

      <NitroModal 
        isOpen={isNitroModalOpen}
        onClose={() => setIsNitroModalOpen(false)}
      />
    </div>
  );
};

export default ChatArea;

