import React, { useState } from 'react';
import { Search, Minus, Square, X, Bell, Shield, Sparkles } from 'lucide-react';
import { useNitroStore } from '../../store/useNitroStore';
import { NitroModal } from '../modals/NitroModal';

interface DiscordTitleBarProps {
  notificationCount?: number | string;
}

export const DiscordTitleBar: React.FC<DiscordTitleBarProps> = ({ notificationCount = '9+' }) => {
  const { isNitro } = useNitroStore();
  const [isNitroOpen, setIsNitroOpen] = useState(false);

  return (
    <>
      <header className="h-7 w-full bg-[#06080C] border-b border-[#141824] flex items-center justify-between px-3 select-none z-50 text-xs shrink-0">
        {/* Left: App Brand & Window Name */}
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 rounded bg-gradient-to-tr from-cyan-400 to-pink-400 flex items-center justify-center text-[9px] font-black text-black shadow-sm">
            P
          </div>
          <span className="font-bold text-gray-300 text-[11px] tracking-wide flex items-center gap-1.5">
            ProChat
            {notificationCount && (
              <span className="bg-pink-500/20 text-pink-400 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                ({notificationCount})
              </span>
            )}
          </span>
        </div>

        {/* Center: Search Bar / Quick Switcher */}
        <div className="flex items-center max-w-sm w-full mx-4">
          <div className="bg-[#0D1018] hover:bg-[#131824] border border-white/5 hover:border-cyan-400/40 rounded-md px-2.5 py-0.5 flex items-center justify-between w-full text-[11px] text-gray-400 cursor-pointer transition-all shadow-inner">
            <div className="flex items-center space-x-1.5 truncate">
              <Search size={12} className="text-cyan-400/80 shrink-0" />
              <span className="truncate">Find or start a conversation</span>
            </div>
            <kbd className="bg-white/5 text-[9px] font-mono px-1 py-0.2 rounded text-gray-400 border border-white/10 shrink-0">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Right: Quick Perks & Window Controls */}
        <div className="flex items-center space-x-2 text-gray-400">
          <button
            onClick={() => setIsNitroOpen(true)}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-pink-500/20 to-cyan-500/20 hover:from-pink-500/30 hover:to-cyan-500/30 text-pink-300 font-bold text-[10px] border border-pink-400/30 transition-all cursor-pointer"
          >
            <Sparkles size={11} className="text-pink-400" />
            <span>Nitro</span>
          </button>

          <div className="flex items-center space-x-1 pl-2">
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
