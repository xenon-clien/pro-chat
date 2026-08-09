import React, { useState } from 'react';
import { Hash, Volume2, ChevronDown, Settings, Mic, MicOff, Headphones, VolumeX, Plus, UserPlus, Shield, Crown, Zap } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { CreateChannelModal } from '../modals/CreateChannelModal';
import { UserSettingsModal } from '../modals/UserSettingsModal';
import { ServerSettingsModal } from '../modals/ServerSettingsModal';
import { NitroModal } from '../modals/NitroModal';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

const ChannelSidebar = () => {
  const { servers, activeServerId, activeChannelId, setActiveChannel } = useServerStore();
  const { user } = useAuthStore();
  const { isNitro, nitroTier } = useNitroStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  
  const activeServer = servers.find(s => s.id === activeServerId);
  const isOwner = activeServer?.ownerId === user?.id;
  
  if (!activeServer) return <div className="w-60 bg-gray-800 flex flex-col h-full shrink-0"></div>;

  const textChannels = activeServer.channels.filter(c => c.type === 'TEXT');
  const voiceChannels = activeServer.channels.filter(c => c.type === 'VOICE');

  return (
    <>
      <div className="w-60 bg-[#0D0E12] flex flex-col h-full shrink-0 relative border-r border-[#171920]">
        {/* Server Header */}
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="h-12 border-b border-[#1e222a] flex items-center justify-between px-4 hover:bg-[#161820] cursor-pointer transition-colors shrink-0 shadow-sm relative bg-[#0D0E12]"
        >
          <div className="flex items-center space-x-2 truncate">
            {activeServer.iconUrl && (
              <img src={activeServer.iconUrl} alt="icon" className="w-5 h-5 rounded-md object-cover" />
            )}
            <h1 className="font-extrabold text-white truncate text-sm tracking-tight">{activeServer.name}</h1>
          </div>
          <ChevronDown size={18} className={clsx("text-yellow-400 transition-transform duration-200 shrink-0", isDropdownOpen && "rotate-180")} />
        </div>

        {/* Server Actions Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-14 left-2 right-2 bg-[#121418] border border-yellow-400/30 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 animate-scale-up">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setIsChannelModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold transition-colors cursor-pointer"
            >
              <span>Create Channel</span>
              <Plus size={16} />
            </button>
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setIsServerSettingsOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#1c1e24] hover:text-yellow-400 font-bold transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <span>Server Settings</span>
                {isOwner && <Crown size={12} className="text-yellow-400 ml-1.5" />}
              </div>
              <Shield size={16} className="text-yellow-400" />
            </button>
          </div>
        )}

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
          {/* Text Channels */}
          <div>
            <div className="flex items-center justify-between text-gray-400 hover:text-yellow-400 text-xs font-extrabold uppercase tracking-wider mb-1.5 px-1 group">
              <div className="flex items-center cursor-pointer">
                <ChevronDown size={12} className="mr-1 text-yellow-400" />
                Text Channels
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChannelModalOpen(true);
                }}
                className="hover:text-yellow-400 hover:bg-[#1a1c22] p-1 rounded transition-colors"
                title="Create Channel"
              >
                <Plus size={15} />
              </button>
            </div>
            <div className="space-y-[2px]">
              {textChannels.map((channel) => (
                <div 
                  key={channel.id} 
                  onClick={() => setActiveChannel(channel.id)}
                  className={clsx(
                    "flex items-center px-2.5 py-2 rounded-lg cursor-pointer group transition-all text-sm font-semibold",
                    activeChannelId === channel.id 
                      ? "bg-yellow-400/15 text-yellow-300 border-l-2 border-yellow-400 shadow-sm" 
                      : "text-gray-400 hover:text-gray-200 hover:bg-[#171920]"
                  )}
                >
                  <Hash size={17} className={clsx("mr-2", activeChannelId === channel.id ? "text-yellow-400" : "text-gray-500 group-hover:text-gray-300")} />
                  <span className="truncate">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Channels */}
          <div>
            <div className="flex items-center justify-between text-gray-400 hover:text-yellow-400 text-xs font-extrabold uppercase tracking-wider mb-1.5 px-1 group">
              <div className="flex items-center cursor-pointer">
                <ChevronDown size={12} className="mr-1 text-yellow-400" />
                Voice Channels
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChannelModalOpen(true);
                }}
                className="hover:text-yellow-400 hover:bg-[#1a1c22] p-1 rounded transition-colors"
                title="Create Channel"
              >
                <Plus size={15} />
              </button>
            </div>
            <div className="space-y-[2px]">
              {voiceChannels.length > 0 ? (
                voiceChannels.map((channel) => (
                  <div 
                    key={channel.id} 
                    onClick={() => setActiveChannel(channel.id)}
                    className={clsx(
                      "flex items-center px-2.5 py-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#171920] cursor-pointer group transition-all text-sm font-semibold",
                      activeChannelId === channel.id && "bg-yellow-400/15 text-yellow-300 border-l-2 border-yellow-400"
                    )}
                  >
                    <Volume2 size={17} className="mr-2 text-gray-500 group-hover:text-gray-300" />
                    <span className="truncate">{channel.name}</span>
                  </div>
                ))
              ) : (
                <div 
                  onClick={() => setIsChannelModalOpen(true)}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-yellow-400 cursor-pointer flex items-center"
                >
                  <Plus size={12} className="mr-1" /> Add voice channel
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voice Connected Banner (Discord Style) */}
        {activeServer?.channels.find(c => c.id === activeChannelId)?.type === 'VOICE' && (
          <div className="bg-[#090A0D] border-t border-[#1e222a] px-3 py-2 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mr-2.5" />
              <div>
                <div className="text-emerald-400 text-xs font-black leading-tight tracking-tight">Voice Connected</div>
                <div className="text-gray-500 text-[10px] truncate max-w-[120px] font-semibold">
                  {activeServer.channels.find(c => c.id === activeChannelId)?.name} / RTC HD
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const textCh = activeServer.channels.find(c => c.type === 'TEXT');
                if (textCh) setActiveChannel(textCh.id);
              }}
              className="p-1.5 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 rounded-lg transition-colors"
              title="Disconnect"
            >
              <VolumeX size={16} />
            </button>
          </div>
        )}

        {/* User Controls Panel */}
        <div className="h-[54px] bg-[#090A0D] flex items-center px-2.5 justify-between shrink-0 border-t border-[#1e222a]">
          <div 
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center hover:bg-[#171920] p-1 rounded-lg cursor-pointer max-w-[125px] transition-colors"
            title="User Profile & Settings"
          >
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-yellow-400 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center shrink-0 shadow-sm font-black text-xs border border-yellow-300">
                {user?.name?.substring(0, 2).toUpperCase() || 'GU'}
              </div>
            )}
            <div className="ml-2 truncate flex-1">
              <div className="text-white text-xs font-bold truncate leading-tight flex items-center gap-1">
                <span className="truncate">{user?.name || 'Guest'}</span>
                {isNitro && <NitroBadge tier={nitroTier} size="sm" />}
              </div>
              <div className="text-yellow-400 text-[10px] truncate leading-tight font-medium flex items-center">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1 inline-block" /> Online
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-gray-400 space-x-0.5">
            {/* Nitro Button */}
            <button
              onClick={() => setIsNitroModalOpen(true)}
              className={clsx(
                "p-1.5 rounded-lg transition-all",
                isNitro
                  ? "text-yellow-400 hover:bg-yellow-400/10"
                  : "text-gray-400 hover:text-yellow-400 hover:bg-[#171920]"
              )}
              title={isNitro ? "ProChat Nitro Active" : "Get ProChat Nitro"}
            >
              <Zap size={17} className={clsx(isNitro && "fill-yellow-400")} />
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                isMuted ? "text-rose-400 hover:bg-rose-500/10" : "hover:bg-[#171920] hover:text-yellow-400"
              )}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <button 
              onClick={() => setIsDeafened(!isDeafened)}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                isDeafened ? "text-rose-400 hover:bg-rose-500/10" : "hover:bg-[#171920] hover:text-yellow-400"
              )}
              title={isDeafened ? "Undeafen" : "Deafen"}
            >
              {isDeafened ? <VolumeX size={17} /> : <Headphones size={17} />}
            </button>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 hover:bg-[#171920] hover:text-yellow-400 rounded-lg transition-colors"
              title="User Settings"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>
      </div>

      <CreateChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        serverId={activeServer.id}
      />

      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <ServerSettingsModal
        isOpen={isServerSettingsOpen}
        onClose={() => setIsServerSettingsOpen(false)}
        server={activeServer}
      />

      <NitroModal
        isOpen={isNitroModalOpen}
        onClose={() => setIsNitroModalOpen(false)}
      />
    </>
  );
};

export default ChannelSidebar;

