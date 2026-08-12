import React, { useState } from 'react';
import { MessageSquare, Volume2, Bot, User, Menu } from 'lucide-react';
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
  const textChannels = activeServer?.channels?.filter(c => c.type === 'TEXT') || [];
  const firstTextChannel = textChannels[0];

  const isVoiceActive = activeChannelId === voiceChannel?.id;
  const isAiActive = activeChannelId === aiChannel?.id;
  const isTextActive = !isVoiceActive && !isAiActive;

  const handleVoiceTab = () => {
    if (voiceChannel) setActiveChannel(voiceChannel.id);
  };

  const handleAiTab = () => {
    if (aiChannel) setActiveChannel(aiChannel.id);
    else setIsAiModalOpen(true);
  };

  const handleChatTab = () => {
    if (firstTextChannel) setActiveChannel(firstTextChannel.id);
    else onToggleDrawer();
  };

  return (
    <>
      {/* ─── Mobile Bottom Tab Bar (Discord-style) ─── */}
      <nav className="md:hidden bg-[#06080C] border-t border-[#14181F] flex items-center justify-around z-40 select-none shrink-0"
           style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

        {/* 1. Channels Drawer */}
        <button
          onClick={onToggleDrawer}
          className={clsx(
            'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer',
            isDrawerOpen ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-200'
          )}
        >
          <div className={clsx(
            'w-10 h-6 rounded-xl flex items-center justify-center transition-all',
            isDrawerOpen ? 'bg-cyan-500/25' : ''
          )}>
            <Menu size={20} />
          </div>
          <span className="text-[10px] font-semibold">Channels</span>
        </button>

        {/* 2. Chat (first text channel) */}
        <button
          onClick={handleChatTab}
          className={clsx(
            'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer',
            isTextActive ? 'text-white' : 'text-gray-500 hover:text-gray-200'
          )}
        >
          <div className={clsx(
            'w-10 h-6 rounded-xl flex items-center justify-center transition-all relative',
            isTextActive ? 'bg-white/15' : ''
          )}>
            <MessageSquare size={20} />
          </div>
          <span className="text-[10px] font-semibold">Chat</span>
        </button>

        {/* 3. Voice Stage */}
        <button
          onClick={handleVoiceTab}
          className={clsx(
            'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer relative',
            isVoiceActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-200'
          )}
        >
          <div className={clsx(
            'w-10 h-6 rounded-xl flex items-center justify-center transition-all',
            isVoiceActive ? 'bg-emerald-500/25' : ''
          )}>
            <Volume2 size={20} />
          </div>
          <span className="text-[10px] font-semibold">Voice</span>
          {activeVoiceChannelId && (
            <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* 4. AI Bot */}
        <button
          onClick={handleAiTab}
          className={clsx(
            'flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-xl transition-all active:scale-90 cursor-pointer',
            isAiActive ? 'text-pink-400' : 'text-gray-500 hover:text-gray-200'
          )}
        >
          <div className={clsx(
            'w-10 h-6 rounded-xl flex items-center justify-center transition-all',
            isAiActive ? 'bg-pink-500/25' : ''
          )}>
            <Bot size={20} />
          </div>
          <span className="text-[10px] font-semibold">AI Bot</span>
        </button>

        {/* 5. Profile */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-xl text-gray-500 hover:text-gray-200 transition-all active:scale-90 cursor-pointer"
        >
          <div className="w-7 h-6 flex items-center justify-center">
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'user'}&backgroundColor=38bdf8`}
              alt={user?.name || 'User'}
              className="w-6 h-6 rounded-full object-cover border border-cyan-500/40"
            />
          </div>
          <span className="text-[10px] font-semibold truncate max-w-[52px]">You</span>
        </button>
      </nav>

      {/* Modals */}
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
