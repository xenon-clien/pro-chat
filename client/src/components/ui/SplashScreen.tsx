import React, { useEffect, useState } from 'react';
import { Sparkles, Radio, Zap } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(65), 300);
    const timer2 = setTimeout(() => setProgress(100), 800);
    const timer3 = setTimeout(() => {
      setIsVisible(false);
      onFinish?.();
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#06080C] flex flex-col items-center justify-center select-none animate-fade-in">
      {/* Background Ambient Cyber Glows */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-[90px] pointer-events-none -top-10" />
      <div className="absolute w-72 h-72 rounded-full bg-pink-500/15 blur-[90px] pointer-events-none -bottom-10" />

      {/* Center Animated App Icon */}
      <div className="relative flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-pink-500 p-1 shadow-2xl shadow-cyan-500/30 animate-pulse">
            <div className="w-full h-full bg-[#090C14] rounded-[22px] flex items-center justify-center overflow-hidden">
              <img 
                src="https://api.dicebear.com/7.x/bottts/svg?seed=ProChat&backgroundColor=38bdf8" 
                alt="ProChat Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          {/* Sparkle Badge */}
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/50">
            <Sparkles size={14} className="animate-spin" />
          </div>
        </div>

        {/* App Title & Slogan */}
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 mb-1">
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-pink-400 bg-clip-text text-transparent">
            ProChat
          </span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            v2.0 HD
          </span>
        </h1>
        <p className="text-xs text-gray-400 font-medium tracking-wide mb-8">
          Next-Gen Voice, 60FPS Screen Share & AI
        </p>

        {/* Progress Bar */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Connection Status Text */}
        <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Connecting to ProChat Cloud...</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
