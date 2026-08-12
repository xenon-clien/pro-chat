import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, Mic, MicOff, Video, VideoOff, ScreenShare, 
  PhoneOff, Phone, Users, Maximize2, Minimize2, Activity,
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
  const { 
    peers, 
    localScreenStream, 
    joinVoiceChannel, 
    leaveVoiceChannel, 
    updateLocalState, 
    startScreenShare, 
    stopScreenShare 
  } = useVoiceStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
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

  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId) || activeServer?.channels[0];

  // Join voice channel with server invite code so all users share same MQTT topic
  useEffect(() => {
    if (activeChannelId && user?.id) {
      joinVoiceChannel(
        activeChannelId,
        {
          id: user.id,
          name: user.name || 'Pro User',
          avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}&backgroundColor=fbbf24`,
        },
        activeServer?.inviteCode
      );
    }
  }, [activeChannelId, user?.id, activeServer?.inviteCode]);

  // Connected peers list from real-time presence
  const connectedList = Object.values(peers);

  // Active Screen Sharer (either local user or remote peer)
  const activeScreenPeer = connectedList.find(p => p.isScreenSharing);
  const isLocalScreenSharing = !!localScreenStream;
  const isAnyScreenSharing = isLocalScreenSharing || !!activeScreenPeer;
  const currentScreenStream = isLocalScreenSharing 
    ? localScreenStream 
    : (activeScreenPeer?.remoteStream || null);

  // Bind screen stream to video element only when stream object reference actually changes
  useEffect(() => {
    const vid = screenVideoRef.current;
    if (vid && currentScreenStream) {
      if (vid.srcObject !== currentScreenStream) {
        vid.srcObject = currentScreenStream;
      }
      vid.play().catch(() => {});
    }
  }, [currentScreenStream]);

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

  // Native Screen sharing — captures screen AND updates WebRTC stream
  const handleStartStream = async (options: { resolution: string; fps: string; shareAudio: boolean }) => {
    try {
      setStreamQuality({ res: options.resolution, fps: options.fps });
      const stream = await startScreenShare(activeServer?.inviteCode);
      if (stream) {
        setStreamError(null);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play().catch(() => {});
        }
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setStreamError('Failed to start screen share: ' + (err.message || 'Permission denied'));
      }
    }
  };

  const handleStopStream = () => {
    stopScreenShare();
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
          {isAnyScreenSharing && (
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
        {isAnyScreenSharing ? (
          <div 
            ref={screenContainerRef}
            className={clsx(
              "w-full max-w-5xl bg-[#07090E] rounded-3xl border-2 border-cyan-400/60 overflow-hidden relative shadow-2xl flex flex-col group transition-all",
              isFullscreen ? "h-screen w-screen border-none rounded-none" : "h-[74vh] mb-2"
            )}
          >
            {/* Screen Video Stream (Plays local or remote live feed) */}
            <video 
              ref={screenVideoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-contain bg-black cursor-pointer"
              onDoubleClick={toggleFullscreen}
              onLoadedMetadata={(e) => {
                const vid = e.target as HTMLVideoElement;
                vid.play().catch(() => {});
              }}
            />

            {/* If stream is loading or initializing, show Standby High-Tech Preview */}
            {!currentScreenStream && (
              <div className="absolute inset-0 bg-[#0A0D15] flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 animate-pulse">
                  <Monitor size={32} />
                </div>
                <div className="text-white font-black text-sm">Initializing Screen Stream...</div>
                <div className="text-xs text-gray-400">Capturing display window at {streamQuality.res} @ {streamQuality.fps}fps</div>
              </div>
            )}

            {/* Top Stream Header Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
              {/* Streamer Badge */}
              <div className="flex items-center space-x-2.5 bg-black/85 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-cyan-400/30 shadow-xl text-xs font-bold text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{activeScreenPeer?.name || user?.name}'s Screen</span>
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

                {isLocalScreenSharing && (
                  <button
                    onClick={handleStopStream}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    Stop Sharing
                  </button>
                )}
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

                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className={clsx(
                      "w-28 h-28 rounded-3xl object-cover transition-all duration-300 shadow-2xl relative z-10 border-2",
                      member.isSpeaking 
                        ? "border-cyan-400 scale-105 ring-4 ring-cyan-400/20 animate-bounce-subtle" 
                        : "border-white/10"
                    )}
                  />

                  {/* Mute Overlay Icon */}
                  {member.isMuted && (
                    <div className="absolute -bottom-1 -right-1 z-20 w-7 h-7 rounded-full bg-rose-600 border-2 border-[#111522] flex items-center justify-center text-white shadow-lg">
                      <MicOff size={14} />
                    </div>
                  )}
                </div>

                {/* Member Display Name */}
                <div className="w-full text-center mt-2">
                  <div className="font-black text-white text-base tracking-tight truncate flex items-center justify-center gap-1.5">
                    <span>{member.name}</span>
                    {member.isYou && isNitro && (
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">PRO</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {member.isSpeaking ? 'Speaking...' : member.isMuted ? 'Muted' : 'Listening'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Soundboard Tray */}
      {isSoundboardOpen && (
        <div className="p-4 bg-[#0A0D14] border-t border-[#181D2A] animate-slide-up">
          <SoundboardPanel
            isOpen={isSoundboardOpen}
            onClose={() => setIsSoundboardOpen(false)}
            onPlaySound={handlePlaySound}
            incomingSound={incomingSound}
          />
        </div>
      )}

      {/* ──────── BOTTOM VOICE CONTROL TOOLBAR ──────── */}
      <div className="h-20 bg-[#090B10] border-t border-[#181D2A] px-6 flex items-center justify-between shrink-0">
        {/* Left: Device Controls (Mute, Deafen) */}
        <div className="flex items-center space-x-3">
          {/* Mic Mute / Unmute */}
          <button
            onClick={toggleMute}
            className={clsx(
              "h-12 px-4 rounded-2xl flex items-center space-x-2 font-bold text-xs transition-all shadow-md cursor-pointer",
              isMuted
                ? "bg-[#1A1F2E] text-rose-400 hover:bg-[#23293D] border border-rose-500/30"
                : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20"
            )}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Deafen Toggle */}
          <button
            onClick={() => setIsDeafened(!isDeafened)}
            className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md cursor-pointer",
              isDeafened
                ? "bg-rose-600/20 border border-rose-500 text-rose-400"
                : "bg-[#141824] hover:bg-[#1C2234] border border-white/5 text-gray-300"
            )}
            title={isDeafened ? "Undeafen" : "Deafen"}
          >
            {isDeafened ? <VolumeX size={18} /> : <Headphones size={18} />}
          </button>
        </div>

        {/* Center: Stage Actions (Soundboard, Disconnect) */}
        <div className="flex items-center space-x-3">
          {/* Soundboard Button */}
          <button
            onClick={() => setIsSoundboardOpen(!isSoundboardOpen)}
            className={clsx(
              "h-12 px-5 rounded-2xl font-black text-xs flex items-center space-x-2 transition-all shadow-lg cursor-pointer",
              isSoundboardOpen
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/25"
                : "bg-[#141824] hover:bg-[#1C2234] border border-white/10 text-gray-300"
            )}
          >
            <Radio size={16} className="animate-pulse" />
            <span>Soundboard</span>
          </button>

          {/* 🔴 Clean Solid Red Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="h-12 px-5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs rounded-2xl flex items-center space-x-2 transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
            title="Disconnect / Leave Call"
          >
            <Phone size={16} className="rotate-[135deg] fill-white" />
            <span>Leave</span>
          </button>
        </div>

        {/* Right: Share Screen Button */}
        <div className="flex items-center space-x-3">
          {isLocalScreenSharing ? (
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

      {/* Hidden audio elements to play remote peer streams via WebRTC */}
      {connectedList.filter(p => !p.isYou && p.remoteStream).map(peer => (
        <RemoteAudio key={peer.id} stream={peer.remoteStream} />
      ))}
    </div>
  );
};

const RemoteAudio: React.FC<{ stream?: MediaStream }> = ({ stream }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!stream || !audioRef.current) return;
    const el = audioRef.current;
    el.srcObject = stream;
    el.volume = 1.0;
    el.play().catch(() => {});

    const tryPlay = () => {
      el.play().catch(() => {});
    };

    window.addEventListener('click', tryPlay, { once: true });
    return () => {
      window.removeEventListener('click', tryPlay);
    };
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
};

export default VoiceArea;
