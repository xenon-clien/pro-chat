import React, { useState } from 'react';
import { Search, Minus, Square, X, Bell, Shield, Sparkles, Download, Menu, Users } from 'lucide-react';
import { useNitroStore } from '../../store/useNitroStore';
import { NitroModal } from '../modals/NitroModal';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface DiscordTitleBarProps {
  notificationCount?: number | string;
  onToggleMobileMenu?: () => void;
  onToggleMemberList?: () => void;
}

export const DiscordTitleBar: React.FC<DiscordTitleBarProps> = ({ 
  notificationCount = '9+',
  onToggleMobileMenu,
  onToggleMemberList,
}) => {
  const { isNitro } = useNitroStore();
  const [isNitroOpen, setIsNitroOpen] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  return (
    <>
      <header className="h-9 md:h-7 w-full bg-[#06080C] border-b border-[#141824] flex items-center justify-between px-2.5 md:px-3 select-none z-50 text-xs shrink-0">
        {/* Left: Mobile Menu Toggle + App Brand & Window Name */}
        <div className="flex items-center space-x-2">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-[#111522] hover:bg-[#1A2035] text-cyan-400 border border-white/10 active:scale-95 transition-all"
              title="Toggle Channels"
            >
              <Menu size={16} />
            </button>
          )}

          <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-cyan-400 to-pink-400 flex items-center justify-center text-[10px] font-black text-black shadow-sm">
            P
          </div>
          <span className="font-extrabold text-gray-200 text-xs md:text-[11px] tracking-wide flex items-center gap-1.5">
            ProChat
            {notificationCount && (
              <span className="hidden md:inline-block bg-pink-500/20 text-pink-400 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                ({notificationCount})
              </span>
            )}
          </span>
        </div>

        {/* Center: Search Bar / Quick Switcher (Hidden on small mobile) */}
        <div className="hidden sm:flex items-center max-w-xs md:max-w-sm w-full mx-2 md:mx-4">
          <div className="bg-[#0D1018] hover:bg-[#131824] border border-white/5 hover:border-cyan-400/40 rounded-md px-2.5 py-0.5 flex items-center justify-between w-full text-[11px] text-gray-400 cursor-pointer transition-all shadow-inner">
            <div className="flex items-center space-x-1.5 truncate">
              <Search size={12} className="text-cyan-400/80 shrink-0" />
              <span className="truncate">Find or start a conversation</span>
            </div>
            <kbd className="hidden md:inline-block bg-white/5 text-[9px] font-mono px-1 py-0.2 rounded text-gray-400 border border-white/10 shrink-0">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Right: Install App, Nitro & Controls */}
        <div className="flex items-center space-x-1.5 md:space-x-2 text-gray-400">
          {/* 📱 PWA Download / Install App Button */}
          {!isInstalled && (
            <button
              onClick={promptInstall}
              className="flex items-center space-x-1 px-2 py-1 md:py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-extrabold text-[10px] border border-emerald-400/40 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
              title="Download & Install ProChat App"
            >
              <Download size={11} className="text-emerald-400 animate-bounce" />
              <span>Install App</span>
            </button>
          )}

          {/* Nitro Button */}
          <button
            onClick={() => setIsNitroOpen(true)}
            className="flex items-center space-x-1 px-1.5 py-1 md:py-0.5 rounded-md bg-gradient-to-r from-pink-500/20 to-cyan-500/20 hover:from-pink-500/30 hover:to-cyan-500/30 text-pink-300 font-bold text-[10px] border border-pink-400/30 transition-all cursor-pointer"
          >
            <Sparkles size={11} className="text-pink-400" />
            <span className="hidden xs:inline">Nitro</span>
          </button>

          {/* Mobile Member List Toggle */}
          {onToggleMemberList && (
            <button
              onClick={onToggleMemberList}
              className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg bg-[#111522] hover:bg-[#1A2035] text-gray-300 border border-white/10 active:scale-95 transition-all"
              title="Toggle Member List"
            >
              <Users size={15} />
            </button>
          )}

          {/* Desktop Window Controls */}
          <div className="hidden md:flex items-center space-x-1 pl-1">
            <button 
              className="w-6 h-5 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"
              title="Minimize"
            >
              <Minus size={11} />
            </button>
            <button 
              className="w-6 h-5 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white rounded transition-colors"
              title="Maximize"
            >
              <Square size={10} />
            </button>
            <button 
              className="w-6 h-5 flex items-center justify-center hover:bg-rose-500 text-gray-400 hover:text-white rounded transition-colors"
              title="Close"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </header>

      <NitroModal isOpen={isNitroOpen} onClose={() => setIsNitroOpen(false)} />
    </>
  );
};

export default DiscordTitleBar;
