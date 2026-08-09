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
  const [activeTab, setActiveTab] = useState<'tab' | 'window' | 'screen'>('screen');
  const [selectedScreenId, setSelectedScreenId] = useState<'screen-primary' | 'screen-secondary'>('screen-primary');
  const [selectedWindowId, setSelectedWindowId] = useState('win-vscode');
  const [selectedTabId, setSelectedTabId] = useState('tab-prochat');
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-xl bg-[#0E121B] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/40 transform transition-all animate-scale-up max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-6 pb-2 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Choose what to share with <span className="text-cyan-400 font-mono text-base">pro-chat.vercel.app</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            The site will be able to see the contents of your screen in real time.
          </p>
        </div>

        {/* Browser-Style Navigation Tabs */}
        <div className="flex border-b border-[#181D2A] px-6 gap-6 text-xs font-bold text-gray-400 shrink-0">
          <button
            onClick={() => setActiveTab('tab')}
            className={clsx(
              "py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'tab'
                ? "border-cyan-400 text-cyan-300 font-extrabold"
                : "border-transparent hover:text-white"
            )}
          >
            <Globe size={14} />
            <span>Browser Tab</span>
          </button>

          <button
            onClick={() => setActiveTab('window')}
            className={clsx(
              "py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'window'
                ? "border-pink-400 text-pink-400 font-extrabold"
                : "border-transparent hover:text-white"
            )}
          >
            <Layout size={14} />
            <span>Window</span>
          </button>

          <button
            onClick={() => setActiveTab('screen')}
            className={clsx(
              "py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === 'screen'
                ? "border-cyan-400 text-cyan-300 font-extrabold"
                : "border-transparent hover:text-white"
            )}
          >
            <Monitor size={14} />
            <span>Entire Screen</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* ──────── TAB 1: ENTIRE SCREEN ──────── */}
          {activeTab === 'screen' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Primary Screen Card (Matching Screenshot) */}
                <div
                  onClick={() => setSelectedScreenId('screen-primary')}
                  className={clsx(
                    "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-between text-center relative group",
                    selectedScreenId === 'screen-primary'
                      ? "border-cyan-400 bg-cyan-500/10 shadow-xl shadow-cyan-500/15"
                      : "border-[#1D2538] bg-[#111522] hover:border-white/20"
                  )}
                >
                  {/* Screen Thumbnail Preview Container */}
                  <div className="w-full h-36 bg-[#080A0F] rounded-xl border border-white/10 overflow-hidden relative flex flex-col items-center justify-center p-2 group-hover:border-cyan-400/50 transition-colors">
                    {/* Simulated Screen Content Preview */}
                    <div className="w-full h-full bg-[#0D1017] rounded-lg border border-cyan-500/20 p-1.5 flex flex-col justify-between relative shadow-inner">
                      <div className="h-2 w-full bg-[#181D2A] rounded flex items-center px-1 space-x-1">
                        <span className="w-1 h-1 rounded-full bg-red-400" />
                        <span className="w-1 h-1 rounded-full bg-yellow-400" />
                        <span className="w-1 h-1 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 flex items-center justify-center text-gray-500 text-[10px] font-mono">
                        🖥️ Display 1 (1920x1080)
                      </div>
                      <div className="h-2 w-16 bg-cyan-500/20 rounded mx-auto" />
                    </div>

                    {selectedScreenId === 'screen-primary' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-black shadow-md">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <span className="font-black text-sm text-white mt-2">Entire screen</span>
                </div>

                {/* Secondary Monitor Card */}
                <div
                  onClick={() => setSelectedScreenId('screen-secondary')}
                  className={clsx(
                    "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-between text-center relative group",
                    selectedScreenId === 'screen-secondary'
                      ? "border-cyan-400 bg-cyan-500/10 shadow-xl shadow-cyan-500/15"
                      : "border-[#1D2538] bg-[#111522] hover:border-white/20"
                  )}
                >
                  <div className="w-full h-36 bg-[#080A0F] rounded-xl border border-white/10 overflow-hidden relative flex flex-col items-center justify-center p-2 group-hover:border-cyan-400/50 transition-colors">
                    <div className="w-full h-full bg-[#0D1017] rounded-lg border border-white/10 p-1.5 flex flex-col justify-between">
                      <div className="h-2 w-full bg-[#181D2A] rounded" />
                      <div className="flex-1 flex items-center justify-center text-gray-500 text-[10px] font-mono">
                        💻 Screen 2 (External)
                      </div>
                    </div>
                  </div>
                  <span className="font-black text-sm text-white mt-2">Screen 2 (External)</span>
                </div>
              </div>
            </div>
          )}

          {/* ──────── TAB 2: WINDOWS ──────── */}
          {activeTab === 'window' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'win-vscode', name: 'Visual Studio Code', icon: '💻', desc: 'pro-chat - main' },
                { id: 'win-spotify', name: 'Spotify Music', icon: '🎵', desc: 'Playing Lo-Fi Chill' },
                { id: 'win-game', name: 'Steam Game / Valorant', icon: '🎮', desc: 'Gaming Window' },
                { id: 'win-terminal', name: 'PowerShell / Terminal', icon: '⚡', desc: 'npm run dev' },
              ].map((win) => (
                <div
                  key={win.id}
                  onClick={() => setSelectedWindowId(win.id)}
                  className={clsx(
                    "p-3 rounded-2xl border-2 cursor-pointer transition-all bg-[#111522] flex flex-col justify-between",
                    selectedWindowId === win.id
                      ? "border-pink-400 bg-pink-500/10 shadow-lg shadow-pink-500/10"
                      : "border-[#1D2538] hover:border-white/20"
                  )}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{win.icon}</span>
                    <span className="font-extrabold text-xs text-white truncate">{win.name}</span>
                  </div>
                  <div className="h-16 bg-[#080A0F] rounded-xl border border-white/5 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                    {win.desc}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ──────── TAB 3: BROWSER TABS ──────── */}
          {activeTab === 'tab' && (
            <div className="space-y-2">
              {[
                { id: 'tab-prochat', name: 'ProChat - Real-Time Discord', domain: 'pro-chat.vercel.app', icon: '💬' },
                { id: 'tab-youtube', name: 'YouTube - Lo-Fi Chill Hip Hop Radio', domain: 'youtube.com', icon: '▶️' },
                { id: 'tab-github', name: 'GitHub - xenon-clien/pro-chat', domain: 'github.com', icon: '🐙' },
              ].map((tb) => (
                <div
                  key={tb.id}
                  onClick={() => setSelectedTabId(tb.id)}
                  className={clsx(
                    "p-3 rounded-2xl border-2 cursor-pointer transition-all bg-[#111522] flex items-center justify-between",
                    selectedTabId === tb.id
                      ? "border-cyan-400 bg-cyan-500/10"
                      : "border-[#1D2538] hover:border-white/20"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{tb.icon}</span>
                    <div>
                      <div className="font-bold text-xs text-white">{tb.name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{tb.domain}</div>
                    </div>
                  </div>
                  {selectedTabId === tb.id && <Check size={16} className="text-cyan-400" />}
                </div>
              ))}
            </div>
          )}

          {/* ──────── AUDIO TOGGLE & QUALITY SETTINGS ──────── */}
          <div className="pt-2 border-t border-[#181D2A] space-y-3">
            {/* Also Share System Audio (Matching Screenshot Toggle Layout) */}
            <div 
              onClick={() => setShareAudio(!shareAudio)}
              className="flex items-center justify-between p-3 bg-[#111522] border border-[#181D2A] rounded-2xl cursor-pointer hover:border-cyan-400/40 transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <Volume2 size={18} className={clsx(shareAudio ? "text-cyan-400" : "text-gray-500")} />
                <div>
                  <span className="text-xs font-bold text-white">Also share system audio</span>
                  <p className="text-[10px] text-gray-500">Includes game audio, music, and tab sounds</p>
                </div>
              </div>

              {/* iOS / Windows Style Toggle Switch */}
              <div className={clsx(
                "w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5",
                shareAudio ? "bg-cyan-400" : "bg-gray-700"
              )}>
                <div className={clsx(
                  "w-5 h-5 rounded-full bg-white transition-transform shadow-md",
                  shareAudio ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            </div>

            {/* Stream Quality Selector */}
            <div className="flex items-center justify-between p-2.5 bg-[#080A0F] border border-white/5 rounded-2xl text-xs">
              <span className="font-bold text-gray-400 flex items-center gap-1">
                <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                Stream Quality:
              </span>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => setResolution('720p')}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all",
                    resolution === '720p' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  720p
                </button>
                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all",
                    resolution === '1080p' ? "bg-cyan-400 text-black shadow-sm" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  1080p 60FPS
                </button>
                <button
                  type="button"
                  onClick={() => setResolution('1440p')}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1",
                    resolution === '1440p' ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  <span>2K 60FPS</span>
                  <Sparkles size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Matching Screenshot Button Placement) */}
        <div className="p-6 py-4 bg-[#0A0D14] border-t border-[#181D2A] flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-xs transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-1.5"
          >
            <ScreenShare size={15} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenShareModal;
