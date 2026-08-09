import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, Mic, MicOff, Video, VideoOff, ScreenShare, 
  PhoneOff, Users, Maximize2, Minimize2, Activity,
  Radio, AlertCircle, Music2, Zap, Sparkles, Monitor,
  Headphones, VolumeX, Shield, Crown, Settings, RefreshCw
} from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import cloudRelay from '../../lib/cloudRelay';
import SoundboardPanel from './SoundboardPanel';
import { NitroModal } from '../modals/NitroModal';
import { ScreenShareModal } from '../modals/ScreenShareModal';
import clsx from 'clsx';

export const VoiceArea: React.FC = () => {
  const { servers, activeServerId, activeChannelId, setActiveChannel } = useServerStore();
  const { user } = useAuthStore();
  const { isNitro } = useNitroStore();
  const { peers, joinVoiceChannel, leaveVoiceChannel, updateLocalState } = useVoiceStore();

  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false);
  const [streamQuality, setStreamQuality] = useState({ res: '1080p', fps: '60' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [incomingSound, setIncomingSound] = useState<any>(null);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenContainerRef = useRef<HTMLDivElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId) || activeServer?.channels[0];

  // Join voice channel presence when entering
  useEffect(() => {
    if (activeChannelId) {
      joinVoiceChannel(activeChannelId, {
        id: user?.id || 'usr-' + Date.now(),
        name: user?.name || 'shivam',
        avatarUrl: user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'shivam'}&backgroundColor=fbbf24`,
      });
    }

    return () => {
      leaveVoiceChannel();
    };
  }, [activeChannelId, user?.id, user?.name, user?.avatarUrl, joinVoiceChannel, leaveVoiceChannel]);

  // Actual connected members list from real-time presence (NO FAKE / DUMMY IMAGES)
  const connectedList = Object.values(peers);

  // Camera handling
  useEffect(() => {
    if (isCameraOn) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(e => console.error(e));
          }
          setStreamError(null);
          updateLocalState({ isCameraOn: true });
        })
        .catch((err) => {
          console.error('Camera error:', err);
          setStreamError('Could not access camera. Please check permissions.');
          setIsCameraOn(false);
          updateLocalState({ isCameraOn: false });
        });
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      updateLocalState({ isCameraOn: false });
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  // Native Screen sharing execution after picker modal
  const handleStartStream = async (options: { resolution: string; fps: string; shareAudio: boolean }) => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: options.fps === '60' ? 60 : 30,
        },
        audio: options.shareAudio,
      });

      screenStreamRef.current = displayStream;
      setStreamQuality({ res: options.resolution, fps: options.fps });
      setIsScreenSharing(true);
      setStreamError(null);
      updateLocalState({ isScreenSharing: true });

      displayStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        updateLocalState({ isScreenSharing: false });
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
      };
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setStreamError('Failed to start screen share: ' + (err.message || 'Permission denied'));
      }
    }
  };

  const handleStopStream = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
    updateLocalState({ isScreenSharing: false });
  };

  // Toggle Fullscreen on Screen Share
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      screenContainerRef.current?.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Soundboard handling
  useEffect(() => {
    if (!activeChannelId) return;

    const voiceTopic = `prochat/v1/voice/${activeChannelId}`;
    const unsub = cloudRelay.subscribe(voiceTopic, (_, data) => {
      if (data && data.type === 'SOUNDBOARD' && data.sound) {
        setIncomingSound(data.sound);
        setTimeout(() => setIncomingSound(null), 100);
      }
    });

    return () => { unsub(); };
  }, [activeChannelId]);

  const handlePlaySound = useCallback((sound: any) => {
    if (!activeChannelId) return;
    const payload = {
      channelId: activeChannelId,
      soundId: sound.id,
      soundName: sound.name,
      audioDataUrl: sound.audioDataUrl,
      volume: 0.7,
    };
    cloudRelay.publish(`prochat/v1/voice/${activeChannelId}`, {
      type: 'SOUNDBOARD',
      sound: payload
    });
  }, [activeChannelId]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    updateLocalState({ isMuted: nextMuted, isSpeaking: !nextMuted });

    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !nextMuted;
      }
    }
  };

  const handleDisconnect = () => {
    leaveVoiceChannel();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    const textChannel = activeServer?.channels.find(c => c.type === 'TEXT');
    if (textChannel) {
      setActiveChannel(textChannel.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E14] h-full min-w-0 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-[#181D2A] px-6 flex items-center justify-between shrink-0 bg-[#0E121B]">
        {/* Left: Channel Name & Dynamic Connected Count */}
        <div className="flex items-center space-x-3">
          <Volume2 size={20} className="text-cyan-400 shrink-0" />
          <span className="text-white font-black text-base tracking-tight">{activeChannel?.name || 'General Voice'}</span>
          <div className="flex items-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold shadow-sm">
            <span>{connectedList.length} Connected</span>
          </div>
        </div>

        {/* Right: Target Quality Badge & Live Indicator */}
        <div className="flex items-center space-x-3">
          {isScreenSharing && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 text-xs font-black shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>LIVE STREAM</span>
            </div>
          )}
          <div className="flex items-center space-x-1.5 px-3.5 py-1 bg-[#131826] border border-cyan-500/30 rounded-xl text-cyan-400 text-xs font-black shadow-lg shadow-cyan-500/10">
            <Zap size={14} className="fill-cyan-400 text-cyan-400" />
            <span>{streamQuality.res} @ {streamQuality.fps}fps Target</span>
          </div>
        </div>
      </div>

      {/* Main Voice & Screen Stage */}
      <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar relative">
        {streamError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl shadow-lg">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            <span>{streamError}</span>
          </div>
        )}

        {/* ──────── ENHANCED CINEMA ENTIRE SCREEN PLAYER ──────── */}
        {isScreenSharing ? (
          <div 
            ref={screenContainerRef}
            className={clsx(
              "w-full max-w-5xl bg-[#07090E] rounded-3xl border-2 border-cyan-400/60 overflow-hidden relative shadow-2xl flex flex-col group transition-all",
              isFullscreen ? "h-screen w-screen border-none rounded-none" : "h-[74vh] mb-2"
            )}
          >
            {/* Screen Video Stream */}
            <video 
              ref={(el) => {
                screenVideoRef.current = el;
                if (el && screenStreamRef.current) {
                  el.srcObject = screenStreamRef.current;
                  el.play().catch(e => console.error(e));
                }
              }}
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-contain bg-black cursor-pointer"
              onDoubleClick={toggleFullscreen}
            />

            {/* Top Stream Header Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
              {/* Streamer Badge */}
              <div className="flex items-center space-x-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-cyan-400/30 shadow-xl text-xs font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{user?.name}'s Screen</span>
                <span className="bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-md font-mono text-[10px] font-black">
                  {streamQuality.res} {streamQuality.fps}FPS
                </span>
              </div>

              {/* Stream Controls: Fullscreen, Settings, Stop */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsScreenModalOpen(true)}
                  className="bg-black/80 hover:bg-[#161B28] text-cyan-300 p-2 rounded-xl border border-white/10 transition-colors shadow-lg cursor-pointer"
                  title="Stream Settings & Quality"
                >
                  <Settings size={15} />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="bg-black/80 hover:bg-[#161B28] text-white p-2 rounded-xl border border-white/10 transition-colors shadow-lg cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>

                <button
                  onClick={handleStopStream}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  Stop Sharing
                </button>
              </div>
            </div>

            {/* Speaker PiP Overlay (Bottom Left) */}
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl">
              {connectedList.map((m) => (
                <div key={m.id} className="relative group" title={`${m.name} ${m.isSpeaking ? '(Speaking)' : ''}`}>
                  <img
                    src={m.avatarUrl}
                    alt={m.name}
                    className={clsx(
                      "w-8 h-8 rounded-full object-cover transition-all",
                      m.isSpeaking ? "ring-2 ring-cyan-400 scale-105" : "opacity-80"
                    )}
                  />
                  {m.isMuted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 flex items-center justify-center text-white text-[8px]">
                      <MicOff size={8} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ──────── VOICE CHARACTER CARDS GRID ──────── */
          <div className={clsx(
            "w-full max-w-5xl grid gap-6 place-items-stretch",
            connectedList.length === 1 ? "grid-cols-1 max-w-md" : connectedList.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}>
            {connectedList.map((member) => (
              <div
                key={member.id}
                className={clsx(
                  "h-64 bg-[#111522] rounded-3xl border p-6 flex flex-col items-center justify-between relative shadow-xl transition-all duration-300 group animate-scale-up",
                  member.isSpeaking
                    ? "border-cyan-400/80 ring-2 ring-cyan-400/30 shadow-cyan-500/10 scale-[1.01]"
                    : "border-[#1D2538] hover:border-pink-400/40"
                )}
              >
                <div className="w-full flex justify-end">
                  {member.isYou && (
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 font-bold px-2 py-0.5 rounded-full uppercase">
                      YOU
                    </span>
                  )}
                </div>

                {/* Central Big Animated Character */}
                <div className="relative flex items-center justify-center my-auto">
                  {/* Speaking Wave Ripple */}
                  {member.isSpeaking && (
                    <>
                      <div className="absolute w-36 h-36 rounded-full border-2 border-cyan-400/40 animate-radar-wave pointer-events-none" />
                      <div className="absolute w-44 h-44 rounded-full border border-pink-400/30 animate-radar-wave pointer-events-none delay-300" />
                    </>
                  )}

                  {/* Main Avatar Container */}
                  <div 
                    className={clsx(
                      "w-28 h-28 rounded-full bg-[#0A0D14] flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-2xl animate-character-float",
                      member.isSpeaking
                        ? "ring-4 ring-cyan-400 ring-offset-4 ring-offset-[#111522] shadow-cyan-400/40"
                        : "ring-2 ring-white/10"
                    )}
                  >
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-24 h-24 object-contain transition-transform duration-300 group-hover:scale-110 select-none pointer-events-none"
                    />
                  </div>

                  {/* Muted Microphone Badge */}
                  {member.isMuted && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-rose-600 border-2 border-[#111522] flex items-center justify-center text-white shadow-lg animate-scale-up">
                      <MicOff size={15} />
                    </div>
                  )}
                </div>

                {/* Bottom Member Name */}
                <div className="flex items-center space-x-2">
                  <span className="text-white font-extrabold text-sm tracking-tight">{member.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Soundboard Drawer */}
      <div className="relative">
        <SoundboardPanel
          isOpen={isSoundboardOpen}
          onClose={() => setIsSoundboardOpen(false)}
          onPlaySound={handlePlaySound}
          incomingSound={incomingSound}
        />

        {/* Bottom Action Bar */}
        <div className="h-22 bg-[#0E121B] border-t border-[#181D2A] px-8 flex items-center justify-between shrink-0 shadow-2xl">
          {/* Left / Center Control Buttons */}
          <div className="flex items-center space-x-3.5">
            {/* 🔴 Mute / Unmute Button */}
            <button
              onClick={toggleMute}
              className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md cursor-pointer border",
                isMuted
                  ? "bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white"
                  : "bg-[#161B28] border-cyan-400/40 text-cyan-400 hover:bg-cyan-400 hover:text-black"
              )}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* 🎧 Headphones / Deafen Button */}
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md cursor-pointer border",
                isDeafened
                  ? "bg-rose-600/20 border-rose-500/40 text-rose-400 hover:bg-rose-600 hover:text-white"
                  : "bg-[#161B28] border-white/10 text-gray-300 hover:border-cyan-400 hover:text-cyan-400"
              )}
              title={isDeafened ? "Undeafen" : "Deafen"}
            >
              {isDeafened ? <VolumeX size={20} /> : <Headphones size={20} />}
            </button>

            {/* 🎙️ Soundboard Button */}
            <button
              onClick={() => setIsSoundboardOpen(prev => !prev)}
              className={clsx(
                "h-12 px-5 rounded-2xl flex items-center space-x-2 transition-all shadow-md font-extrabold text-xs cursor-pointer border",
                isSoundboardOpen
                  ? "bg-cyan-400 text-black border-cyan-300 shadow-cyan-400/30"
                  : "bg-[#161B28] hover:bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-400"
              )}
            >
              <Radio size={16} className="animate-pulse" />
              <span>Soundboard</span>
            </button>

            {/* 🔴 Disconnect / Leave Button */}
            <button
              onClick={handleDisconnect}
              className="w-12 h-12 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-400 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-md cursor-pointer"
              title="Disconnect from Voice"
            >
              <PhoneOff size={20} />
            </button>
          </div>

          {/* Right: Share Screen Button */}
          <div className="flex items-center space-x-3">
            {isScreenSharing ? (
              <button
                onClick={handleStopStream}
                className="h-12 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 transition-all cursor-pointer flex items-center space-x-2"
              >
                <ScreenShare size={18} />
                <span>Stop Sharing</span>
              </button>
            ) : (
              <button
                onClick={() => setIsScreenModalOpen(true)}
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-pink-500 hover:from-blue-500 hover:via-cyan-400 hover:to-pink-400 text-white font-black text-xs tracking-wide shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-2.5"
              >
                <ScreenShare size={18} />
                <span>Share Screen</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Screen Share Setup Modal */}
      <ScreenShareModal
        isOpen={isScreenModalOpen}
        onClose={() => setIsScreenModalOpen(false)}
        onStartStream={handleStartStream}
      />

      <NitroModal 
        isOpen={isNitroModalOpen}
        onClose={() => setIsNitroModalOpen(false)}
      />
    </div>
  );
};

export default VoiceArea;
