import React, { useState } from 'react';
import { MessageSquare, Volume2, Bot, User, Sparkles, Plus, Radio, Users } from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { UserSettingsModal } from '../modals/UserSettingsModal';
import { AiAssistantModal } from '../modals/AiAssistantModal';
import { NitroModal } from '../modals/NitroModal';
import clsx from 'clsx';

interface MobileNavBarProps {
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ onToggleDrawer, isDrawerOpen }) => {
  const { servers, activeServerId, activeChannelId, setActiveChannel } = useServerStore();
  const { user } = useAuthStore();
  const { activeVoiceChannelId } = useVoiceStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);

  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];
  const voiceChannel = activeServer?.channels?.find(c => c.type === 'VOICE');
  const aiChannel = activeServer?.channels?.find(c => c.id === 'sam-ai-assistant');

  const isVoiceActive = activeChannelId === voiceChannel?.id;
  const isAiActive = activeChannelId === aiChannel?.id;

  const handleVoiceTab = () => {
    if (voiceChannel) {
      setActiveChannel(voiceChannel.id);
    }
  };

  const handleAiTab = () => {
    if (aiChannel) {
      setActiveChannel(aiChannel.id);
    } else {
      setIsAiModalOpen(true);
    }
  };

  return (
    <>
      <nav className="md:hidden h-14 bg-[#06080C] border-t border-[#141824] px-4 flex items-center justify-around z-40 select-none shrink-0 safe-bottom">
        {/* 1. Channels / Chat Drawer */}
        <button
          onClick={onToggleDrawer}
          className={clsx(
            "flex flex-col items-center justify-center space-y-0.5 w-16 py-1 rounded-xl transition-all cursor-pointer",
            isDrawerOpen
              ? "text-cyan-400 font-extrabold"
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          <div className={clsx(
            "w-8 h-7 rounded-xl flex items-center justify-center transition-all",
            isDrawerOpen ? "bg-cyan-500/20 shadow-md shadow-cyan-500/20" : ""
          )}>
            <MessageSquare size={19} />
          </div>
          <span className="text-[10px] font-bold">Channels</span>
        </button>

        {/* 2. Voice & Screen Share Room */}
        <button
          onClick={handleVoiceTab}
          className={clsx(
            "flex flex-col items-center justify-center space-y-0.5 w-16 py-1 rounded-xl transition-all cursor-pointer relative",
            isVoiceActive
              ? "text-emerald-400 font-extrabold"
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          <div className={clsx(
            "w-8 h-7 rounded-xl flex items-center justify-center transition-all",
            isVoiceActive ? "bg-emerald-500/20 shadow-md shadow-emerald-500/20" : ""
          )}>
            <Volume2 size={19} />
          </div>
          <span className="text-[10px] font-bold">Voice Stage</span>
          {activeVoiceChannelId && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        {/* 3. AI Assistant */}
        <button
          onClick={handleAiTab}
          className={clsx(
            "flex flex-col items-center justify-center space-y-0.5 w-16 py-1 rounded-xl transition-all cursor-pointer",
            isAiActive
              ? "text-pink-400 font-extrabold"
              : "text-gray-400 hover:text-gray-200"
          )}
        >
          <div className={clsx(
            "w-8 h-7 rounded-xl flex items-center justify-center transition-all",
            isAiActive ? "bg-pink-500/20 shadow-md shadow-pink-500/20" : ""
          )}>
            <Bot size={19} />
          </div>
          <span className="text-[10px] font-bold">AI Bot</span>
        </button>

        {/* 4. You / User Profile & Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center justify-center space-y-0.5 w-16 py-1 rounded-xl text-gray-400 hover:text-gray-200 transition-all cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border border-cyan-400/50 p-0.5">
            <img 
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'user'}&backgroundColor=38bdf8`} 
              alt={user?.name || 'User'} 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <span className="text-[10px] font-bold truncate max-w-[50px]">{user?.name || 'You'}</span>
        </button>
      </nav>

      {/* Modals triggered from Mobile Nav */}
      <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AiAssistantModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onOpenNitro={() => setIsNitroModalOpen(true)}
        onOpenInvite={() => {}}
      />
      <NitroModal isOpen={isNitroModalOpen} onClose={() => setIsNitroModalOpen(false)} />
    </>
  );
};

export default MobileNavBar;
