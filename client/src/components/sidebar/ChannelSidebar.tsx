import React, { useState } from 'react';
import { 
  Hash, Volume2, ChevronDown, ChevronUp, Settings, Mic, MicOff, 
  Headphones, VolumeX, Plus, UserPlus, Shield, Crown, Zap, 
  Users, MessageSquare, ScreenShare, LogOut, Sparkles, Check, Edit
} from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { useVoiceStore } from '../../store/useVoiceStore';

import { CreateChannelModal } from '../modals/CreateChannelModal';
import { UserSettingsModal } from '../modals/UserSettingsModal';
import { ServerSettingsModal } from '../modals/ServerSettingsModal';
import { InviteModal } from '../modals/InviteModal';
import { NitroModal } from '../modals/NitroModal';
import NitroBadge from '../ui/NitroBadge';
import DiscordNotificationBadge from '../ui/DiscordNotificationBadge';
import clsx from 'clsx';

type UserStatus = 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';

export const ChannelSidebar: React.FC = () => {
  const { servers, activeServerId, activeChannelId, setActiveChannel } = useServerStore();
  const { user, logout } = useAuthStore();
  const { isNitro, nitroTier } = useNitroStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(true); // Open by default matching screenshot
  const [userStatus, setUserStatus] = useState<UserStatus>('ONLINE');

  const isHome = activeServerId === 'home';
  const activeServer = isHome ? null : servers.find(s => s.id === activeServerId) || servers[0];
  const isOwner = activeServer?.ownerId === user?.id;

  const textChannels = activeServer?.channels?.filter(c => c.type === 'TEXT') || [];
  const voiceChannels = activeServer?.channels?.filter(c => c.type === 'VOICE') || [];

  const { peers } = useVoiceStore();

  // Connected voice participants for Active Voice Channel (only actual connected peers)
  const voiceMembers = Object.values(peers);


  return (
    <>
      <div className="w-60 bg-[#0B0E14] flex flex-col h-full shrink-0 relative border-r border-[#181D2A] select-none">
        {/* Server Header Bar */}
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="h-14 border-b border-[#181D2A] flex items-center justify-between px-4 hover:bg-[#111522] cursor-pointer transition-colors shrink-0 shadow-sm relative bg-[#0B0E14]"
        >
          <div className="flex items-center space-x-2 truncate">
            <h1 className="font-extrabold text-white truncate text-sm tracking-tight flex items-center gap-1.5">
              {activeServer?.name || 'hello'}
              <Sparkles size={14} className="text-cyan-400 fill-cyan-400/20" />
            </h1>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsInviteModalOpen(true);
              }}
              className="text-cyan-400 hover:bg-cyan-400/20 p-1 rounded-md transition-colors"
              title="Invite People"
            >
              <UserPlus size={15} />
            </button>
            <ChevronDown size={17} className={clsx("text-gray-400 transition-transform duration-200 shrink-0", isDropdownOpen && "rotate-180")} />
          </div>
        </div>

        {/* Server Actions Dropdown */}
        {isDropdownOpen && activeServer && (
          <div className="absolute top-16 left-2 right-2 bg-[#111522] border border-cyan-500/30 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 animate-scale-up">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setIsInviteModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-cyan-500/10 hover:bg-cyan-400 text-cyan-300 hover:text-black font-extrabold transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <UserPlus size={15} />
                <span>Invite Friends</span>
              </div>
              <span className="text-[9px] bg-cyan-400 text-black px-1.5 py-0.2 rounded font-black">CODE</span>
            </button>

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setIsChannelModalOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#1A2030] hover:text-cyan-400 font-bold transition-colors cursor-pointer"
            >
              <span>Create Channel</span>
              <Plus size={15} />
            </button>

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setIsServerSettingsOpen(true);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#1A2030] hover:text-cyan-400 font-bold transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <span>Server Settings</span>
                {isOwner && <Crown size={12} className="text-yellow-400" />}
              </div>
              <Shield size={15} className="text-cyan-400" />
            </button>
          </div>
        )}

        {/* Channels Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-4">
          {/* TEXT CHANNELS */}
          <div>
            <div className="flex items-center justify-between text-gray-400 hover:text-cyan-300 text-[11px] font-black uppercase tracking-wider mb-1.5 px-1 group">
              <div className="flex items-center cursor-pointer">
                <ChevronDown size={12} className="mr-1 text-cyan-400" />
                TEXT CHANNELS
              </div>
              <button 
                onClick={() => setIsChannelModalOpen(true)}
                className="hover:text-cyan-400 p-0.5 rounded transition-colors"
                title="Create Channel"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {textChannels.map((channel) => (
                <div 
                  key={channel.id} 
                  onClick={() => setActiveChannel(channel.id)}
                  className={clsx(
                    "flex items-center px-2.5 py-2 rounded-xl cursor-pointer group transition-all text-xs font-bold",
                    activeChannelId === channel.id 
                      ? "bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400 shadow-sm" 
                      : "text-gray-400 hover:text-white hover:bg-[#141926]"
                  )}
                >
                  <Hash size={16} className={clsx("mr-2 shrink-0", activeChannelId === channel.id ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300")} />
                  <span className="truncate">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* VOICE CHANNELS */}
          <div>
            <div className="flex items-center justify-between text-gray-400 hover:text-cyan-300 text-[11px] font-black uppercase tracking-wider mb-1.5 px-1 group">
              <div className="flex items-center cursor-pointer">
                <ChevronDown size={12} className="mr-1 text-cyan-400" />
                VOICE CHANNELS
              </div>
              <button 
                onClick={() => setIsChannelModalOpen(true)}
                className="hover:text-cyan-400 p-0.5 rounded transition-colors"
                title="Create Channel"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-1">
              {voiceChannels.map((channel) => {
                const isActive = activeChannelId === channel.id;
                return (
                  <div key={channel.id} className="space-y-1">
                    {/* Active Voice Channel Pill (Matching Cyan Border in Screenshot) */}
                    <div 
                      onClick={() => setActiveChannel(channel.id)}
                      className={clsx(
                        "flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer group transition-all text-xs font-extrabold border",
                        isActive
                          ? "bg-cyan-500/10 border-cyan-400/80 text-cyan-300 shadow-lg shadow-cyan-500/10"
                          : "border-transparent text-gray-400 hover:text-white hover:bg-[#141926]"
                      )}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Volume2 size={16} className={clsx(isActive ? "text-cyan-400 animate-pulse" : "text-gray-500")} />
                        <span className="truncate">{channel.name}</span>
                      </div>
                    </div>

                    {/* Connected Users List under Voice Channel (Matching Screenshot) */}
                    {isActive && (
                      <div className="pl-4 pr-1 py-1 space-y-1.5">
                        {voiceMembers.map((member, i) => (
                          <div 
                            key={i}
                            className="flex items-center space-x-2.5 py-1 px-2 rounded-xl hover:bg-white/5 transition-colors"
                          >
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-5 h-5 rounded-full object-cover border border-white/10"
                            />
                            <span className="text-xs text-gray-300 font-semibold truncate">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SET STATUS Panel (Matching Screenshot Bottom Left) */}
        {isStatusMenuOpen && (
          <div className="mx-2 mb-2 p-3 bg-[#111522] border border-[#1D2538] rounded-2xl shadow-2xl space-y-2 animate-scale-up">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-1">
              SET STATUS
            </div>
            <div className="space-y-1 text-xs font-bold">
              <div 
                onClick={() => setUserStatus('ONLINE')}
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-[#1A2030] cursor-pointer text-gray-200 hover:text-white transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Online</span>
                {userStatus === 'ONLINE' && <Check size={13} className="text-cyan-400 ml-auto" />}
              </div>

              <div 
                onClick={() => setUserStatus('IDLE')}
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-[#1A2030] cursor-pointer text-gray-200 hover:text-white transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span>Idle</span>
                {userStatus === 'IDLE' && <Check size={13} className="text-cyan-400 ml-auto" />}
              </div>

              <div 
                onClick={() => setUserStatus('DND')}
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-[#1A2030] cursor-pointer text-gray-200 hover:text-white transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Do Not Disturb</span>
                {userStatus === 'DND' && <Check size={13} className="text-cyan-400 ml-auto" />}
              </div>

              <div 
                onClick={() => setUserStatus('OFFLINE')}
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-[#1A2030] cursor-pointer text-gray-200 hover:text-white transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500 shrink-0" />
                <span>Invisible / Offline</span>
                {userStatus === 'OFFLINE' && <Check size={13} className="text-cyan-400 ml-auto" />}
              </div>

              <div className="h-[1px] bg-white/5 my-1" />

              {/* Edit Profile & PFP */}
              <div 
                onClick={() => {
                  setIsStatusMenuOpen(false);
                  setIsSettingsModalOpen(true);
                }}
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-cyan-500/10 cursor-pointer text-cyan-400 font-extrabold transition-colors"
              >
                <Edit size={14} />
                <span>Edit Profile & PFP</span>
              </div>

              {/* Log Out */}
              <div 
                onClick={logout}
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-rose-500/10 cursor-pointer text-rose-400 font-extrabold transition-colors"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom User Controls Bar (Matching Screenshot) */}
        <div className="h-16 bg-[#0E121B] border-t border-[#181D2A] px-3 flex items-center justify-between shrink-0">
          {/* User Avatar + Name + Status Toggle */}
          <div 
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center space-x-2 hover:bg-[#161B28] p-1.5 rounded-xl cursor-pointer transition-colors max-w-[125px] group"
            title="Click to Edit Profile & PFP"
          >
            <div className="relative shrink-0">
              <img 
                src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=shivam&backgroundColor=fbbf24'} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full object-cover border border-cyan-400/50 group-hover:ring-2 group-hover:ring-cyan-400 transition-all"
              />
              <span className={clsx(
                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0E121B]",
                userStatus === 'ONLINE' && "bg-emerald-500",
                userStatus === 'IDLE' && "bg-amber-400",
                userStatus === 'DND' && "bg-rose-500",
                userStatus === 'OFFLINE' && "bg-gray-500"
              )} />
            </div>
            <div className="truncate">
              <div className="text-white text-xs font-black truncate group-hover:text-cyan-300 transition-colors">{user?.name || 'shivam'}</div>
              <div className="text-gray-400 text-[10px] leading-tight truncate">@{user?.name?.toLowerCase().replace(/\s+/g, '_') || 'shivam'}</div>
            </div>
          </div>


          {/* Quick Action Icons: ScreenShare, Mic, Deafen, Settings */}
          <div className="flex items-center space-x-0.5 text-gray-400">
            <button
              onClick={() => setActiveChannel(voiceChannels[0]?.id || '')}
              className="p-1.5 hover:bg-[#161B28] hover:text-cyan-400 rounded-lg transition-colors text-cyan-400"
              title="Voice Connected"
            >
              <ScreenShare size={16} />
            </button>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={clsx("p-1.5 rounded-lg transition-colors", isMuted ? "text-rose-400" : "hover:bg-[#161B28] hover:text-cyan-400")}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button 
              onClick={() => setIsDeafened(!isDeafened)}
              className={clsx("p-1.5 rounded-lg transition-colors", isDeafened ? "text-rose-400" : "hover:bg-[#161B28] hover:text-cyan-400")}
              title={isDeafened ? "Undeafen" : "Deafen"}
            >
              {isDeafened ? <VolumeX size={16} /> : <Headphones size={16} />}
            </button>

            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 hover:bg-[#161B28] hover:text-cyan-400 rounded-lg transition-colors"
              title="User Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      <CreateChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        serverId={activeServer?.id || 'pro-chat-hq'}
      />

      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {activeServer && (
        <ServerSettingsModal
          isOpen={isServerSettingsOpen}
          onClose={() => setIsServerSettingsOpen(false)}
          server={activeServer}
        />
      )}

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        serverName={activeServer?.name || 'hello'}
        inviteCode={activeServer?.inviteCode || 'PRO-HQ-8821'}
      />

      <NitroModal
        isOpen={isNitroModalOpen}
        onClose={() => setIsNitroModalOpen(false)}
      />
    </>
  );
};

export default ChannelSidebar;
