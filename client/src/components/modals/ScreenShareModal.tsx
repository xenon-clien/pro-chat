import React, { useState } from 'react';
import { 
  X, ScreenShare, Monitor, Layout, Globe, Volume2, 
  Zap, Sparkles, Check, ChevronRight, Settings, Radio, 
  Maximize2, Shield, Eye
} from 'lucide-react';
import { useNitroStore } from '../../store/useNitroStore';
import clsx from 'clsx';

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStream: (options: { resolution: string; fps: string; shareAudio: boolean }) => void;
}

export const ScreenShareModal: React.FC<ScreenShareModalProps> = ({
  isOpen,
  onClose,
  onStartStream,
}) => {
  const { isNitro } = useNitroStore();
  const [activeTab, setActiveTab] = useState<'tab' | 'window' | 'screen'>('window');
  const [selectedItemId, setSelectedItemId] = useState('win-prochat');
  const [shareAudio, setShareAudio] = useState(true);
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p'>('1080p');
  const [fps, setFps] = useState<'30' | '60'>('60');

  if (!isOpen) return null;

  const handleShare = () => {
    onStartStream({
      resolution,
      fps,
      shareAudio,
    });
    onClose();
  };

  const WINDOW_ITEMS = [
    { 
      id: 'win-edge', 
      title: 'ProChat and 7 more pages', 
      app: 'Microsoft Edge',
      icon: '🌐',
      bgColor: 'from-blue-600/20 to-cyan-500/10',
      badgeColor: 'text-cyan-400 border-cyan-400/30'
    },
    { 
      id: 'win-prochat', 
      title: 'ProChat Application Hub', 
      app: 'ProChat Client (Active)',
      icon: '💬',
      bgColor: 'from-pink-500/20 to-purple-600/10',
      badgeColor: 'text-pink-400 border-pink-400/30'
    },
    { 
      id: 'win-chrome', 
      title: 'Vite React App - Google Chrome', 
      app: 'Google Chrome',
      icon: '🌐',
      bgColor: 'from-amber-500/20 to-orange-500/10',
      badgeColor: 'text-amber-400 border-amber-400/30'
    },
    { 
      id: 'win-voice', 
      title: 'General Voice & Screen Stage', 
      app: 'ProChat Voice',
      icon: '🎙️',
      bgColor: 'from-cyan-500/20 to-blue-600/10',
      badgeColor: 'text-cyan-300 border-cyan-400/30'
    },
    { 
      id: 'win-vscode', 
      title: 'Visual Studio Code - main', 
      app: 'VS Code Editor',
      icon: '💻',
      bgColor: 'from-blue-500/20 to-indigo-600/10',
      badgeColor: 'text-blue-400 border-blue-400/30'
    },
    { 
      id: 'win-spotify', 
      title: 'Spotify - Lo-Fi Chill Beats', 
      app: 'Spotify Audio',
      icon: '🎵',
      bgColor: 'from-emerald-500/20 to-teal-600/10',
      badgeColor: 'text-emerald-400 border-emerald-400/30'
    },
  ];

  const TAB_ITEMS = [
    { id: 'tab-1', title: 'ProChat - Real-Time Discord', domain: 'pro-chat-xenon-cliens-projects.vercel.app', icon: '💬' },
    { id: 'tab-2', title: 'YouTube - 24/7 Lo-Fi Chill Music', domain: 'youtube.com', icon: '▶️' },
    { id: 'tab-3', title: 'GitHub - xenon-clien / pro-chat', domain: 'github.com', icon: '🐙' },
  ];

  const SCREEN_ITEMS = [
    { id: 'screen-1', title: 'Entire Screen 1 (Primary Display)', res: '1920x1080 • 60Hz', icon: '🖥️' },
    { id: 'screen-2', title: 'Entire Screen 2 (External 2K Display)', res: '2560x1440 • 144Hz', icon: '💻' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-2xl bg-[#0B0E17] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/40 transform transition-all animate-scale-up max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-6 pb-2 shrink-0 bg-[#07090F] border-b border-[#141926]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          <h2 className="text-xl font-black text-white tracking-tight">
            Choose what to share with <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">ProChat</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            The site will stream your screen in high definition (1080p 60FPS) with low latency.
          </p>

          {/* Navigation Tabs (Pink & Cyan Combinations) */}
          <div className="flex border-b border-[#1A2030] mt-4 gap-8 text-xs font-black tracking-wide">
            <button
              onClick={() => { setActiveTab('tab'); setSelectedItemId('tab-1'); }}
              className={clsx(
                "pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'tab'
                  ? "border-cyan-400 text-cyan-300 scale-105"
                  : "border-transparent text-gray-400 hover:text-white"
              )}
            >
              <Globe size={15} />
              <span>Microsoft Edge Tab</span>
            </button>

            <button
              onClick={() => { setActiveTab('window'); setSelectedItemId('win-prochat'); }}
              className={clsx(
                "pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'window'
                  ? "border-pink-400 text-pink-400 scale-105"
                  : "border-transparent text-gray-400 hover:text-white"
              )}
            >
              <Layout size={15} />
              <span>Window</span>
            </button>

            <button
              onClick={() => { setActiveTab('screen'); setSelectedItemId('screen-1'); }}
              className={clsx(
                "pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'screen'
                  ? "border-cyan-400 text-cyan-300 scale-105"
                  : "border-transparent text-gray-400 hover:text-white"
              )}
            >
              <Monitor size={15} />
              <span>Entire Screen</span>
            </button>
          </div>
        </div>

        {/* Content Body: Rich Grid of Cards */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* ──────── WINDOWS 6-GRID ──────── */}
          {activeTab === 'window' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {WINDOW_ITEMS.map((win) => {
                const isSelected = selectedItemId === win.id;

                return (
                  <div
                    key={win.id}
                    onClick={() => setSelectedItemId(win.id)}
                    className={clsx(
                      "p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative group",
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/10 shadow-xl shadow-cyan-500/20 scale-[1.02]"
                        : "border-[#1A2234] bg-[#0E121E] hover:border-pink-400/40 hover:bg-[#121727]"
                    )}
                  >
                    {/* Simulated Application Window Mockup */}
                    <div className={clsx(
                      "w-full h-24 rounded-xl border border-white/10 overflow-hidden relative p-2 flex flex-col justify-between bg-gradient-to-br",
                      win.bgColor
                    )}>
                      {/* Window titlebar dots */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">{win.app}</span>
                      </div>

                      {/* Center App Icon */}
                      <div className="flex items-center justify-center my-auto">
                        <span className="text-2xl filter drop-shadow-md group-hover:scale-125 transition-transform">
                          {win.icon}
                        </span>
                      </div>

                      {/* Selected Check Badge */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-black shadow-lg">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Window Title & Tag */}
                    <div className="mt-2.5">
                      <div className="font-extrabold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">
                        {win.title}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>{win.app}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ──────── ENTIRE SCREEN ──────── */}
          {activeTab === 'screen' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SCREEN_ITEMS.map((scr) => {
                const isSelected = selectedItemId === scr.id;
                return (
                  <div
                    key={scr.id}
                    onClick={() => setSelectedItemId(scr.id)}
                    className={clsx(
                      "p-4 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center justify-between text-center relative group",
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/10 shadow-xl shadow-cyan-500/20 scale-[1.02]"
                        : "border-[#1A2234] bg-[#0E121E] hover:border-pink-400/40"
                    )}
                  >
                    <div className="w-full h-36 bg-[#07090F] rounded-2xl border border-white/10 overflow-hidden relative flex flex-col items-center justify-center p-3">
                      <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{scr.icon}</span>
                      <span className="text-xs font-mono text-cyan-300 font-bold">{scr.res}</span>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-black shadow-lg">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <span className="font-black text-sm text-white mt-3">{scr.title}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ──────── BROWSER TABS ──────── */}
          {activeTab === 'tab' && (
            <div className="space-y-2.5">
              {TAB_ITEMS.map((tb) => {
                const isSelected = selectedItemId === tb.id;
                return (
                  <div
                    key={tb.id}
                    onClick={() => setSelectedItemId(tb.id)}
                    className={clsx(
                      "p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                      isSelected
                        ? "border-pink-400 bg-pink-500/10 shadow-lg shadow-pink-500/15"
                        : "border-[#1A2234] bg-[#0E121E] hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <span className="text-2xl">{tb.icon}</span>
                      <div className="truncate">
                        <div className="font-extrabold text-xs text-white truncate">{tb.title}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{tb.domain}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 bg-pink-400 rounded-full flex items-center justify-center text-black shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ──────── AUDIO & STREAM QUALITY BAR ──────── */}
          <div className="pt-3 border-t border-[#181D2A] space-y-3">
            {/* Share System Audio Toggle (Matching Screenshot Design) */}
            <div 
              onClick={() => setShareAudio(!shareAudio)}
              className="flex items-center justify-between p-3.5 bg-[#0E121E] border border-[#1A2234] hover:border-cyan-400/40 rounded-2xl cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className={clsx("p-2 rounded-xl", shareAudio ? "bg-cyan-400/10 text-cyan-400" : "bg-white/5 text-gray-400")}>
                  <Volume2 size={18} />
                </div>
                <div>
                  <span className="text-xs font-black text-white">Also share system audio</span>
                  <p className="text-[10px] text-gray-400">Stream in-game audio, music, and voice sounds</p>
                </div>
              </div>

              {/* Sleek Cyan / Pink Toggle */}
              <div className={clsx(
                "w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5",
                shareAudio ? "bg-gradient-to-r from-cyan-400 to-pink-500" : "bg-gray-700"
              )}>
                <div className={clsx(
                  "w-5 h-5 rounded-full bg-white transition-transform shadow-md",
                  shareAudio ? "translate-x-6" : "translate-x-0"
                )} />
              </div>
            </div>

            {/* Quality Badges */}
            <div className="flex items-center justify-between p-2.5 bg-[#07090F] border border-white/5 rounded-2xl text-xs">
              <span className="font-bold text-gray-400 flex items-center gap-1 text-[11px]">
                <Zap size={14} className="text-cyan-400 fill-cyan-400" />
                Stream Resolution:
              </span>
              <div className="flex space-x-1.5">
                {['720p', '1080p', '1440p'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setResolution(q as any)}
                    className={clsx(
                      "px-3 py-1 rounded-xl font-black text-[10px] transition-all cursor-pointer",
                      resolution === q
                        ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/20"
                        : "text-gray-400 hover:text-white bg-white/5"
                    )}
                  >
                    {q} {q === '1080p' && '60FPS ⚡'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-6 py-4 bg-[#07090F] border-t border-[#141926] flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="px-7 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-pink-500 hover:from-cyan-300 hover:to-pink-400 text-black font-black text-xs transition-all shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-2"
          >
            <ScreenShare size={15} />
            <span>Share Screen 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenShareModal;
