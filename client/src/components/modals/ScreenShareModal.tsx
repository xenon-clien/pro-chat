import React, { useState } from 'react';
import { 
  X, ScreenShare, Monitor, Layout, Volume2, Zap, 
  Sparkles, Check, ChevronRight, Settings, Radio, 
  Maximize2, Shield, Eye
} from 'lucide-react';
import { useNitroStore } from '../../store/useNitroStore';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStream: (options: { resolution: string; fps: string; shareAudio: boolean }) => void;
}

const MOCK_SCREENS = [
  { id: 'screen-1', name: 'Entire Screen 1 (Primary Display)', res: '1920x1080', icon: '🖥️' },
  { id: 'screen-2', name: 'Entire Screen 2 (External Monitor)', res: '2560x1440', icon: '💻' },
];

const MOCK_APPS = [
  { id: 'app-chrome', name: 'Google Chrome', icon: '🌐', category: 'Browser' },
  { id: 'app-vscode', name: 'Visual Studio Code', icon: '💻', category: 'Development' },
  { id: 'app-discord', name: 'ProChat Client', icon: '💬', category: 'App' },
  { id: 'app-spotify', name: 'Spotify Music', icon: '🎵', category: 'Audio' },
  { id: 'app-game', name: 'Valorant / Steam Game', icon: '🎮', category: 'Game' },
];

export const ScreenShareModal: React.FC<ScreenShareModalProps> = ({
  isOpen,
  onClose,
  onStartStream,
}) => {
  const { isNitro } = useNitroStore();
  const [sourceType, setSourceType] = useState<'screens' | 'apps'>('screens');
  const [selectedSource, setSelectedSource] = useState<string>('screen-1');
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p'>('1080p');
  const [fps, setFps] = useState<'30' | '60'>('60');
  const [shareAudio, setShareAudio] = useState(true);

  if (!isOpen) return null;

  const handleGoLive = () => {
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
        className="relative w-full max-w-xl bg-[#0E121B] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/30 transform transition-all animate-scale-up max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-[#181D2A] bg-[#0A0D14] shrink-0">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-black uppercase tracking-wider mb-1">
            <ScreenShare size={16} />
            <span>Screen Share & Stream Settings</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Share Your Entire Screen
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Choose what you want to share with everyone in the voice channel.
          </p>

          {/* Screen vs Applications Tabs */}
          <div className="flex space-x-2 mt-4 bg-[#111522] p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => { setSourceType('screens'); setSelectedSource('screen-1'); }}
              className={clsx(
                "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5",
                sourceType === 'screens'
                  ? "bg-cyan-400 text-black shadow-lg shadow-cyan-400/20"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Monitor size={14} />
              <span>Entire Screens</span>
            </button>
            <button
              onClick={() => { setSourceType('apps'); setSelectedSource('app-chrome'); }}
              className={clsx(
                "flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5",
                sourceType === 'apps'
                  ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Layout size={14} />
              <span>Applications & Windows</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* 1. Source Picker Grid */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
              Select Source to Stream
            </label>

            {sourceType === 'screens' ? (
              <div className="grid grid-cols-2 gap-3">
                {MOCK_SCREENS.map((scr) => (
                  <div
                    key={scr.id}
                    onClick={() => setSelectedSource(scr.id)}
                    className={clsx(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all bg-[#111522] relative group flex flex-col items-center justify-center text-center",
                      selectedSource === scr.id
                        ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                        : "border-[#1D2538] hover:border-white/20"
                    )}
                  >
                    {/* Screen Monitor Mockup */}
                    <div className="w-full h-24 bg-[#080A0F] rounded-xl border border-white/10 flex flex-col items-center justify-center mb-2.5 relative overflow-hidden group-hover:border-cyan-400/50 transition-colors">
                      <span className="text-3xl mb-1">{scr.icon}</span>
                      <span className="text-[10px] font-mono text-cyan-300 font-bold">{scr.res}</span>
                      {selectedSource === scr.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-black">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="font-extrabold text-xs text-white truncate w-full">{scr.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MOCK_APPS.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedSource(app.id)}
                    className={clsx(
                      "p-3 rounded-2xl border-2 cursor-pointer transition-all bg-[#111522] flex flex-col items-center text-center relative",
                      selectedSource === app.id
                        ? "border-pink-400 bg-pink-500/10 shadow-lg shadow-pink-500/10"
                        : "border-[#1D2538] hover:border-white/20"
                    )}
                  >
                    <span className="text-2xl mb-1">{app.icon}</span>
                    <span className="font-extrabold text-xs text-white truncate w-full">{app.name}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{app.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Stream Quality & Resolution */}
          <div className="p-4 bg-[#111522] border border-[#181D2A] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Zap size={14} className="fill-cyan-400" />
                <span>Stream Resolution</span>
              </div>
              <span className="text-[10px] text-gray-400">Target Quality</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '720p', label: '720p HD', desc: 'Standard' },
                { id: '1080p', label: '1080p FHD', desc: 'Crystal Clear' },
                { id: '1440p', label: '1440p 2K', desc: 'Ultra HD 🌟' },
              ].map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => setResolution(res.id as any)}
                  className={clsx(
                    "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                    resolution === res.id
                      ? "border-cyan-400 bg-cyan-400 text-black font-black shadow-md shadow-cyan-400/20"
                      : "border-white/5 bg-[#0A0D14] text-gray-300 hover:border-white/20"
                  )}
                >
                  <div className="text-xs font-black">{res.label}</div>
                  <div className={clsx("text-[9px]", resolution === res.id ? "text-black/80 font-bold" : "text-gray-500")}>
                    {res.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Frame Rate & Audio Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Frame Rate */}
            <div className="p-3.5 bg-[#111522] border border-[#181D2A] rounded-2xl">
              <div className="text-[11px] font-black uppercase tracking-wider text-pink-400 mb-2">
                Frame Rate
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['30', '60'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFps(val as any)}
                    className={clsx(
                      "py-2 rounded-xl text-xs font-black transition-all cursor-pointer text-center",
                      fps === val
                        ? "bg-pink-500 text-white shadow-md shadow-pink-500/20"
                        : "bg-[#0A0D14] text-gray-400 hover:text-white border border-white/5"
                    )}
                  >
                    {val} FPS {val === '60' && '⚡'}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Toggle */}
            <div 
              onClick={() => setShareAudio(!shareAudio)}
              className={clsx(
                "p-3.5 bg-[#111522] border rounded-2xl cursor-pointer transition-all flex items-center justify-between",
                shareAudio ? "border-cyan-400/50 bg-cyan-500/5" : "border-[#181D2A]"
              )}
            >
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <Volume2 size={15} className="text-cyan-400" />
                  <span>Share System Audio</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">Stream game & music sounds</div>
              </div>
              <div className={clsx(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                shareAudio ? "bg-cyan-400 border-cyan-400 text-black" : "border-gray-600"
              )}>
                {shareAudio && <Check size={12} strokeWidth={3} />}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="p-6 py-4 bg-[#0A0D14] border-t border-[#181D2A] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGoLive}
            className="bg-gradient-to-r from-blue-600 via-cyan-500 to-pink-500 hover:from-blue-500 hover:via-cyan-400 hover:to-pink-400 text-white font-black text-xs px-8 py-3 rounded-2xl transition-all shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 flex items-center space-x-2 cursor-pointer"
          >
            <ScreenShare size={16} />
            <span>Go Live & Share Screen 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenShareModal;
