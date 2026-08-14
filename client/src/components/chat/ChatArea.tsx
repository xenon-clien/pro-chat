import React, { useState, useEffect, useRef } from 'react';
import { 
  Hash, Search, Bell, BellOff, Pin, Users, Plus, Smile, 
  FileImage, Send, Sparkles, Zap, UserPlus, Volume2, 
  Gift, Heart, ArrowRight, MessageSquare, Bot, HelpCircle,
  FileUp, Download, Paperclip, FileText, Image as ImageIcon, Film, Music, Archive, Code, X
} from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useMessageStore, type FileAttachment } from '../../store/useMessageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { useSocket } from '../../hooks/useSocket';
import { EmojiPicker } from './EmojiPicker';
import { MemberList } from './MemberList';
import { InviteModal } from '../modals/InviteModal';
import { NitroModal } from '../modals/NitroModal';
import { AiAssistantModal } from '../modals/AiAssistantModal';
import { SendFileModal } from '../modals/SendFileModal';
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
  const [isSendFileModalOpen, setIsSendFileModalOpen] = useState(false);
  
  // File upload state in chat input
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFilePreview, setPendingFilePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const processPendingFile = (file: File) => {
    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPendingFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPendingFilePreview(null);
    }
  };

  const handleChatFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPendingFile(e.target.files[0]);
    }
  };

  const handleDragChat = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDropChat = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPendingFile(e.dataTransfer.files[0]);
    }
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="text-cyan-400" size={20} />;
    if (fileType.startsWith('video/')) return <Film className="text-pink-400" size={20} />;
    if (fileType.startsWith('audio/')) return <Music className="text-emerald-400" size={20} />;
    if (fileType.includes('zip') || fileType.includes('tar') || fileType.includes('rar')) return <Archive className="text-yellow-400" size={20} />;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.json') || fileName.endsWith('.html')) return <Code className="text-indigo-400" size={20} />;
    return <FileText className="text-cyan-400" size={20} />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = content.trim();
    if ((!textToSend && !pendingFile) || !activeChannelId) return;

    try {
      let attachment: FileAttachment | undefined = undefined;
      if (pendingFile) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(pendingFile);
        });

        attachment = {
          name: pendingFile.name,
          size: pendingFile.size,
          type: pendingFile.type || 'application/octet-stream',
          url: dataUrl || URL.createObjectURL(pendingFile),
        };
      }

      const finalContent = textToSend || (attachment ? `Shared a file: ${attachment.name}` : '');
      setContent('');
      setPendingFile(null);
      setPendingFilePreview(null);

      await sendMessage(activeChannelId, finalContent, attachment);
      setIsEmojiPickerOpen(false);
      setIsGifsOpen(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message', err);
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
      <div className="flex-1 flex flex-col bg-[#080B11] min-w-0 items-center justify-center text-gray-500 font-medium select-none">
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
    <div 
      className="flex-1 flex h-full bg-[#080B11] min-w-0 overflow-hidden select-none relative"
      onDragEnter={handleDragChat}
    >
      {/* Drag Over Overlay */}
      {dragActive && (
        <div 
          onDragOver={handleDragChat}
          onDragLeave={handleDragChat}
          onDrop={handleDropChat}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm border-2 border-dashed border-cyan-400 m-4 rounded-3xl flex flex-col items-center justify-center animate-fade-in"
        >
          <FileUp size={48} className="text-cyan-400 animate-bounce mb-3" />
          <div className="text-lg font-black text-white">Drop File to Send in #{activeChannel.name}</div>
          <p className="text-xs text-gray-400 mt-1">Images, Videos, PDFs, ZIPs, Docs & Code</p>
        </div>
      )}

      {/* ──────── CENTER CHAT COLUMN ──────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#080B11]">
        {/* Top Header Bar - compact on mobile like Discord */}
        <div className="h-12 md:h-14 border-b border-[#141A28] px-3 md:px-6 flex items-center justify-between shrink-0 bg-[#0B0E17]">
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
                ? '🤖 24/7 ProChat AI Support & Chatbot'
                : `Welcome to #${activeChannel.name} • Hangout & Voice`}
            </span>
          </div>

          {/* Header Action Icons */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Notification Bell */}
            <button
              onClick={() => setIsMutedNotifications(!isMutedNotifications)}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title={isMutedNotifications ? "Unmute Channel" : "Mute Channel"}
            >
              {isMutedNotifications ? <BellOff size={17} className="text-rose-400" /> : <Bell size={17} />}
            </button>

            {/* Pin */}
            <button
              onClick={() => setIsPinnedOpen(!isPinnedOpen)}
              className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Pinned Messages"
            >
              <Pin size={17} />
            </button>

            {/* Member List Toggle */}
            <button 
              onClick={() => setIsMemberListOpen(!isMemberListOpen)}
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
                isMemberListOpen 
                  ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/30" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
              title="Toggle Member List"
            >
              <Users size={16} />
            </button>

            {/* Search & Send File Box */}
            <div className="flex items-center space-x-1.5 ml-1">
              <div className="relative hidden md:block">
                <input 
                  type="text" 
                  placeholder="Search messages..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#121624] text-xs text-white rounded-xl pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-400 w-36 focus:w-44 transition-all border border-white/5 placeholder-gray-500"
                />
                <Search size={14} className="absolute right-2.5 top-2 text-gray-400" />
              </div>

              {/* Header Send File Button */}
              <button
                onClick={() => setIsSendFileModalOpen(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all shadow-md shadow-cyan-500/10 cursor-pointer active:scale-95"
                title="Send File to User or Channel"
              >
                <FileUp size={14} className="text-cyan-400" />
                <span className="hidden sm:inline">Send File</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Messages Stream with Welcome Hero at Top */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-6 py-4 space-y-3 flex flex-col justify-start">
          {/* ──────── HERO WELCOME HEADER ──────── */}
          <div className="text-center py-6 px-4 mb-2 flex flex-col items-center justify-center animate-fade-in shrink-0">
            {/* Glowing Rounded Hash/Bot Emblem with Sparkle Badge */}
            <div className="relative mb-4 animate-scale-up">
              <div className="w-20 h-20 rounded-3xl bg-[#0B101D] border-2 border-cyan-400 shadow-2xl shadow-cyan-500/25 flex items-center justify-center">
                {isAiChannel ? (
                  <Bot size={40} className="text-cyan-300" />
                ) : (
                  <Hash size={40} className="text-cyan-400 stroke-[2.5]" />
                )}
              </div>
              {/* Pink Sparkle/Star Badge on top right */}
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-pink-500 border-2 border-[#080B11] flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Sparkles size={12} className="text-white fill-white" />
              </div>
            </div>

            {/* Welcome Heading */}
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
              Welcome to <span className="text-cyan-400">#{activeChannel.name}!</span> 👋
            </h1>
            <p className="text-gray-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
              {isAiChannel ? (
                <>This is the 24/7 AI Chatbot channel with <strong className="text-cyan-300">Sam AI</strong>. Ask anything about screen sharing, voice channels, billing, or server invites!</>
              ) : (
                <>This is the very start of the <strong className="text-cyan-300">#{activeChannel.name}</strong> channel. Send a wave, hop into voice, or invite your friends to start chatting!</>
              )}
            </p>

            {/* 4 Action Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 w-full max-w-2xl">
              {isAiChannel ? (
                <>
                  <button
                    onClick={() => sendMessage(activeChannel.id, 'How do I fix blank screen sharing?')}
                    className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-cyan-500/10 border border-[#1C2538] hover:border-cyan-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group hover:scale-[1.02]"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">📺</span>
                    <span className="text-xs font-black text-white group-hover:text-cyan-300">Screen Share</span>
                    <span className="text-[10px] text-gray-400">Blank screen fix</span>
                  </button>

                  <button
                    onClick={() => sendMessage(activeChannel.id, 'How do I invite friends with server code?')}
                    className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-pink-500/10 border border-[#1C2538] hover:border-pink-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group hover:scale-[1.02]"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">👥</span>
                    <span className="text-xs font-black text-white group-hover:text-pink-300">Invite Friends</span>
                    <span className="text-[10px] text-gray-400">Server code</span>
                  </button>

                  <button
                    onClick={() => sendMessage(activeChannel.id, 'What are the Nitro subscription features?')}
                    className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-amber-500/10 border border-[#1C2538] hover:border-amber-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group hover:scale-[1.02]"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">⚡</span>
                    <span className="text-xs font-black text-white group-hover:text-amber-300">Nitro & Gifts</span>
                    <span className="text-[10px] text-gray-400">Unlock perks</span>
                  </button>

                  <button
                    onClick={() => sendMessage(activeChannel.id, 'How do I use HD Voice and Soundboard?')}
                    className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-cyan-500/10 border border-[#1C2538] hover:border-cyan-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group hover:scale-[1.02]"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">🎙️</span>
                    <span className="text-xs font-black text-white group-hover:text-cyan-300">Join Voice</span>
                    <span className="text-[10px] text-gray-400">HD Talk & Video</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSendWave}
                    className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-cyan-500/10 border border-[#1C2538] hover:border-cyan-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group hover:scale-[1.02]"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">👋</span>
                    <span className="text-xs font-black text-white group-hover:text-cyan-300">Send a Wave</span>
                    <span className="text-[10px] text-gray-400">Say hello!</span>
                  </button>

                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-pink-500/10 border border-[#1C2538] hover:border-pink-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group hover:scale-[1.02]"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">👥</span>
                    <span className="text-xs font-black text-white group-hover:text-pink-300">Invite Friends</span>
                    <span className="text-[10px] text-gray-400">Server code</span>
                  </button>

                  <button
                    onClick={() => {
                      const voiceCh = activeServer?.channels.find(c => c.type === 'VOICE');
                      if (voiceCh) setActiveChannel(voiceCh.id);
                    }}
                    className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-cyan-500/10 border border-[#1C2538] hover:border-cyan-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group hover:scale-[1.02]"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">🎙️</span>
                    <span className="text-xs font-black text-white group-hover:text-cyan-300">Join Voice</span>
                    <span className="text-[10px] text-gray-400">HD Talk & Video</span>
                  </button>

                  <button
                    onClick={() => setIsNitroModalOpen(true)}
                    className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-amber-500/10 border border-[#1C2538] hover:border-amber-400 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer shadow-md group hover:scale-[1.02]"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">⚡</span>
                    <span className="text-xs font-black text-white group-hover:text-amber-300">Nitro & Gifts</span>
                    <span className="text-[10px] text-gray-400">Unlock perks</span>
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
              {filteredMessages.map((msg) => {
                const isAuthorBot = msg.author.isBot || msg.author.id.includes('bot');

                return (
                  <div key={msg.id} className="group hover:bg-[#0D111A] -mx-4 px-4 py-2.5 rounded-2xl transition-colors border border-transparent hover:border-white/5">
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

                        {/* File Attachment Card / Image */}
                        {msg.file && (
                          <div className="mt-2.5 max-w-sm">
                            {msg.file.type.startsWith('image/') ? (
                              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl group/img relative max-h-72">
                                <img 
                                  src={msg.file.url} 
                                  alt={msg.file.name} 
                                  className="max-h-72 w-full object-cover rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform" 
                                  onClick={() => window.open(msg.file?.url, '_blank')}
                                />
                                <a 
                                  href={msg.file.url} 
                                  download={msg.file.name}
                                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-black/80 hover:bg-cyan-500 text-white hover:text-black font-bold text-xs flex items-center space-x-1 backdrop-blur-md border border-white/20 transition-all shadow-lg"
                                >
                                  <Download size={13} />
                                  <span>Download</span>
                                </a>
                              </div>
                            ) : (
                              <div className="p-3 bg-[#0D1220] border border-cyan-500/30 rounded-2xl flex items-center justify-between space-x-3 shadow-lg shadow-cyan-500/5">
                                <div className="flex items-center space-x-3 truncate">
                                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                                    {getFileIcon(msg.file.name, msg.file.type)}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-black text-white truncate">{msg.file.name}</div>
                                    <div className="text-[10px] text-cyan-400 font-mono font-bold">
                                      {formatFileSize(msg.file.size)} • {msg.file.type || 'File'}
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href={msg.file.url}
                                  download={msg.file.name}
                                  className="p-2 rounded-xl bg-cyan-400/20 hover:bg-cyan-400 text-cyan-300 hover:text-black font-bold text-xs flex items-center justify-center transition-all cursor-pointer shrink-0"
                                  title="Download File"
                                >
                                  <Download size={15} />
                                </a>
                              </div>
                            )}
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

        {/* Input Bar - sticks to bottom, extra padding on mobile for bottom nav */}
        <div className="px-3 md:px-6 pb-2 md:pb-4 pt-2 shrink-0 relative bg-[#080B11]">
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

          {/* Pending File Preview Banner before sending */}
          {pendingFile && (
            <div className="mb-2 p-2.5 bg-[#0e1322] border border-cyan-400/40 rounded-2xl flex items-center justify-between animate-scale-up">
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                  {getFileIcon(pendingFile.name, pendingFile.type)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{pendingFile.name}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">{formatFileSize(pendingFile.size)}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingFile(null);
                  setPendingFilePreview(null);
                }}
                className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-all cursor-pointer"
                title="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-[#0F1422] border border-[#1A2234] focus-within:border-cyan-400/70 focus-within:ring-2 focus-within:ring-cyan-400/20 rounded-2xl flex items-center px-4 py-3 shadow-xl transition-all">
            {/* Hidden native file input */}
            <input 
              ref={fileInputRef}
              type="file"
              onChange={handleChatFileSelected}
              className="hidden"
            />

            {/* Attachment Button */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="text-gray-400 hover:text-cyan-400 transition-colors p-1 mr-2 shrink-0 rounded-xl hover:bg-white/5 cursor-pointer"
              title="Add File Attachment"
            >
              <Plus size={18} />
            </button>
            
            <input 
              ref={inputRef}
              type="text" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAiChannel ? "Ask Sam AI Chatbot anything..." : `Message #${activeChannel.name}...`}
              className="bg-transparent flex-1 text-sm text-white placeholder-gray-500 focus:outline-none"
            />

            <div className="flex items-center space-x-2 ml-2">
              {/* Nitro Gift Bolt Button */}
              <button 
                type="button" 
                onClick={() => setIsNitroModalOpen(true)}
                className="text-pink-400 hover:text-pink-300 transition-colors p-1.5 rounded-xl hover:bg-white/5 cursor-pointer"
                title="Gift Nitro"
              >
                <Zap size={18} className="fill-pink-400 text-pink-400" />
              </button>

              {/* GIF Button */}
              <button 
                type="button" 
                onClick={() => setIsGifsOpen(!isGifsOpen)}
                className="text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-xl hover:bg-white/5 font-bold text-xs cursor-pointer"
                title="Send GIF"
              >
                <FileImage size={18} />
              </button>

              {/* Emoji Button */}
              <button 
                type="button" 
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className="text-gray-400 hover:text-yellow-400 transition-colors p-1.5 rounded-xl hover:bg-white/5 cursor-pointer"
                title="Add Emoji"
              >
                <Smile size={18} />
              </button>

              {/* Send Button */}
              <button 
                type="submit" 
                disabled={!content.trim() && !pendingFile}
                className={clsx(
                  "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer",
                  (content.trim() || pendingFile) 
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:scale-105 shadow-md shadow-cyan-400/20" 
                    : "text-gray-600 cursor-not-allowed"
                )}
                title="Send Message"
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ──────── RIGHT MEMBER LIST DRAWER ──────── */}
      {isMemberListOpen && (
        <div className="hidden lg:block h-full shrink-0">
          <MemberList serverId={activeServer.id} />
        </div>
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

      <SendFileModal
        isOpen={isSendFileModalOpen}
        onClose={() => setIsSendFileModalOpen(false)}
        defaultChannelId={activeChannel?.id}
      />
    </div>
  );
};

export default ChatArea;
