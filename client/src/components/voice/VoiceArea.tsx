import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, Mic, MicOff, Video, VideoOff, ScreenShare, 
  PhoneOff, Users, Maximize2, Minimize2, Activity,
  Radio, AlertCircle, Music2, Zap, Sparkles, Monitor
} from 'lucide-react';
import { useServerStore } from '../../store/useServerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { useSocket } from '../../hooks/useSocket';
import cloudRelay from '../../lib/cloudRelay';
import SoundboardPanel from './SoundboardPanel';

import { NitroModal } from '../modals/NitroModal';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

export const VoiceArea: React.FC = () => {
  const { servers, activeServerId, activeChannelId, setActiveChannel } = useServerStore();
  const { user } = useAuthStore();
  const { isNitro, nitroTier } = useNitroStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [incomingSound, setIncomingSound] = useState<any>(null);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'720p' | '1080p'>(isNitro ? '1080p' : '720p');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenContainerRef = useRef<HTMLDivElement | null>(null);

  const activeServer = servers.find(s => s.id === activeServerId);
  const activeChannel = activeServer?.channels.find(c => c.id === activeChannelId);

  const socket = useSocket(activeChannelId || '');

  // Handle Camera Feed
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
        })
        .catch((err) => {
          console.error('Camera error:', err);
          setStreamError('Could not access camera. Please check browser permissions.');
          setIsCameraOn(false);
        });
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOn]);

  // Handle Screen Share Stream
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      setIsScreenSharing(false);
      setIsFocusMode(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        screenStreamRef.current = displayStream;
        setIsScreenSharing(true);
        setStreamError(null);

        // Auto detect when user stops sharing via browser bar
        displayStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setIsFocusMode(false);
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
          }
        };
      } catch (err: any) {
        console.error('Screen share error:', err);
        if (err.name !== 'NotAllowedError') {
          setStreamError('Failed to start screen sharing: ' + (err.message || 'Permission denied'));
        }
      }
    }
  };

  // Toggle Native Browser Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      screenContainerRef.current?.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Listen for incoming soundboard events from other users globally
  useEffect(() => {
    if (!activeChannelId) return;

    // 1. Socket.io handler (if local/backend socket is connected)
    const handleIncomingSound = (data: any) => {
      setIncomingSound(data);
      setTimeout(() => setIncomingSound(null), 100);
    };
    if (socket) {
      socket.on('soundboard:incoming', handleIncomingSound);
    }

    // 2. Global Cloud Relay handler (works over public internet on Vercel)
    const voiceTopic = `prochat/v1/voice/${activeChannelId}`;
    const unsub = cloudRelay.subscribe(voiceTopic, (_, data) => {
      if (data && data.type === 'SOUNDBOARD' && data.sound) {
        setIncomingSound(data.sound);
        setTimeout(() => setIncomingSound(null), 100);
      }
    });

    return () => { 
      if (socket) socket.off('soundboard:incoming', handleIncomingSound);
      unsub();
    };
  }, [socket, activeChannelId]);

  // Broadcast soundboard sound via cloudRelay and socket
  const handlePlaySound = useCallback((sound: any) => {
    if (!activeChannelId) return;

    const payload = {
      channelId: activeChannelId,
      soundId: sound.id,
      soundName: sound.name,
      audioDataUrl: sound.audioDataUrl,
      volume: 0.7,
    };

    // Publish to global cloud relay
    cloudRelay.publish(`prochat/v1/voice/${activeChannelId}`, {
      type: 'SOUNDBOARD',
      sound: payload
    });

    // Also emit over socket if available
    if (socket) {
      socket.emit('soundboard:play', payload);
    }
  }, [socket, activeChannelId]);


  // Toggle Mic Track
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
      }
    }
  };

  // Disconnect from voice channel and return to text channel
  const handleDisconnect = () => {
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

  if (!activeChannel) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#0D0E12] h-full min-w-0 overflow-hidden select-none">
      {/* Voice Channel Top Header */}
      <div className="h-12 border-b border-[#171920] px-4 flex items-center justify-between shrink-0 bg-[#090A0D]">
        <div className="flex items-center">
          <Volume2 size={22} className="text-yellow-400 mr-2.5 shrink-0" />
          <span className="text-white font-black text-base tracking-tight">{activeChannel.name}</span>
          <div className="flex items-center space-x-2 ml-4 px-2.5 py-0.5 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400 text-xs font-extrabold">
            <Radio size={12} className="animate-pulse text-yellow-400" />
            <span>Voice Connected (RTC Live)</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold text-gray-400">
          {isScreenSharing && (
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={clsx(
                "px-2.5 py-1 rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer",
                isFocusMode ? "bg-yellow-400 text-black border-yellow-400 font-bold" : "bg-[#171920] border-gray-800 text-gray-300 hover:text-yellow-400"
              )}
              title="Toggle Full Focus Mode"
            >
              <Maximize2 size={13} />
              <span>{isFocusMode ? 'Show Members' : 'Focus Mode'}</span>
            </button>
          )}
          <div className="flex items-center text-emerald-400">
            <Activity size={14} className="mr-1" />
            <span>24ms / HD Audio</span>
          </div>
        </div>
      </div>

      {/* Main Video & Screen Share Area */}
      <div className="flex-1 p-3 md:p-4 flex flex-col items-center justify-center overflow-hidden relative">
        {streamError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl shadow-lg">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            <span>{streamError}</span>
          </div>
        )}

        {/* Max-Sized Screen Share Display (Cinema Mode) */}
        {isScreenSharing && (
          <div 
            ref={screenContainerRef}
            onDoubleClick={toggleFullscreen}
            className={clsx(
              "w-full bg-[#08090B] rounded-2xl border-2 border-yellow-400/50 overflow-hidden relative shadow-2xl flex flex-col group transition-all",
              isFullscreen ? "h-screen w-screen border-none rounded-none" : isFocusMode ? "h-full max-h-[86vh]" : "h-[70%] max-h-[76vh] mb-3"
            )}
          >
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
            />
            
            {/* Top Stream Overlay Info */}
            <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-yellow-400/30 text-xs font-bold text-yellow-400 shadow-lg">
              <ScreenShare size={14} />
              <span>{user?.name}'s Screen • 1080p 60fps HD</span>
            </div>

            {/* Top Right Maximize & Fullscreen Controls */}
            <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-90 group-hover:opacity-100 transition-opacity">
              <button
                onClick={toggleFullscreen}
                className="bg-black/80 hover:bg-yellow-400 hover:text-black text-yellow-400 backdrop-blur-md p-2 rounded-xl border border-yellow-400/30 transition-colors shadow-lg cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Maximize / Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>

            {/* Bottom Floating Stop Button */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={toggleScreenShare}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xl transition-transform active:scale-95 cursor-pointer"
              >
                Stop Sharing
              </button>
            </div>
          </div>
        )}

        {/* Member Video / Avatar Grid */}
        {(!isFocusMode || !isScreenSharing) && (
          <div className={clsx(
            "w-full grid gap-3 place-items-center transition-all",
            isScreenSharing ? "grid-cols-2 md:grid-cols-4 max-w-4xl h-[26%]" : "grid-cols-1 md:grid-cols-2 max-w-4xl h-[75%]"
          )}>
            {/* User's Video / Avatar Tile */}
            <div className={clsx(
              "w-full h-full min-h-[120px] bg-[#121418] rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden shadow-xl transition-all",
              isSpeaking ? "border-yellow-400 ring-2 ring-yellow-400/30" : "border-[#1e222a]"
            )}>
              {isCameraOn ? (
                <video 
                  ref={(el) => {
                    localVideoRef.current = el;
                    if (el && localStreamRef.current) {
                      el.srcObject = localStreamRef.current;
                      el.play().catch(e => console.error(e));
                    }
                  }}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Avatar" 
                      className={clsx(
                        "w-14 h-14 md:w-18 md:h-18 rounded-2xl object-cover border-2 border-yellow-400 shadow-xl transition-transform",
                        isSpeaking && "scale-110 shadow-yellow-400/30"
                      )}
                    />
                  ) : (
                    <div className={clsx(
                      "w-14 h-14 md:w-18 md:h-18 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-2xl shadow-xl transition-transform",
                      isSpeaking && "scale-110 shadow-yellow-400/30"
                    )}>
                      {user?.name?.substring(0, 2).toUpperCase() || 'GU'}
                    </div>
                  )}
                </div>
              )}

              {/* Tile Bottom Name Badge */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-gray-800 text-[11px] font-bold text-white">
                <span>{user?.name} (You)</span>
                {isMuted && <MicOff size={11} className="text-rose-400" />}
              </div>

              {/* Live Badge */}
              {isScreenSharing && (
                <div className="absolute top-2 right-2 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm">
                  Live
                </div>
              )}
            </div>

            {/* Connected Peers Mock Tile */}
            <div className="w-full h-full min-h-[120px] bg-[#121418] rounded-2xl border border-[#1e222a] flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
              <div className="flex flex-col items-center justify-center opacity-60">
                <div className="w-14 h-14 md:w-18 md:h-18 rounded-2xl bg-[#1e222a] text-gray-400 border border-gray-800 flex items-center justify-center font-black text-xl mb-1">
                  <Users size={24} />
                </div>
                <span className="text-[11px] text-gray-500 font-bold">Waiting for members</span>
              </div>
              <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-gray-800 text-[10px] font-bold text-gray-400">
                Open Channel
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Soundboard Panel (floats above action bar) */}
      <div className="relative">
        <SoundboardPanel
          isOpen={isSoundboardOpen}
          onClose={() => setIsSoundboardOpen(false)}
          onPlaySound={handlePlaySound}
          incomingSound={incomingSound}
        />

        {/* Bottom Voice Action Bar (Discord Style) */}
        <div className="h-20 bg-[#090A0D] border-t border-[#171920] px-6 flex items-center justify-center space-x-3 shrink-0 shadow-2xl">
          {/* Mic Button */}
          <button
            onClick={toggleMute}
            className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md cursor-pointer",
              isMuted ? "bg-rose-600 hover:bg-rose-500 text-white" : "bg-[#171920] hover:bg-yellow-400 hover:text-black text-yellow-400 border border-yellow-400/30"
            )}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Video / Camera Button */}
          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md cursor-pointer",
              isCameraOn ? "bg-yellow-400 text-black font-bold shadow-yellow-400/20" : "bg-[#171920] hover:bg-yellow-400 hover:text-black text-gray-300 border border-gray-800 hover:border-yellow-400"
            )}
            title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={toggleScreenShare}
            className={clsx(
              "h-12 px-4 rounded-2xl flex items-center space-x-2 transition-all shadow-lg font-black text-xs cursor-pointer",
              isScreenSharing 
                ? "bg-yellow-400 text-black shadow-yellow-400/30" 
                : "bg-[#171920] hover:bg-yellow-400 hover:text-black text-yellow-400 border border-yellow-400/30 hover:border-yellow-400"
            )}
            title="Share Your Screen"
          >
            <ScreenShare size={18} />
            <span className="hidden sm:inline">{isScreenSharing ? 'STOP' : 'SHARE'}</span>
          </button>

          {/* 🎵 Soundboard Button */}
          <button
            onClick={() => setIsSoundboardOpen(prev => !prev)}
            className={clsx(
              "h-12 px-4 rounded-2xl flex items-center space-x-2 transition-all shadow-md font-black text-xs cursor-pointer relative",
              isSoundboardOpen
                ? "bg-yellow-400 text-black shadow-yellow-400/30"
                : "bg-[#171920] hover:bg-yellow-400 hover:text-black text-yellow-400 border border-yellow-400/30 hover:border-yellow-400"
            )}
            title="Soundboard"
          >
            <Music2 size={18} />
            <span className="hidden sm:inline">SOUNDS</span>
            {/* Pulse indicator when open */}
            {isSoundboardOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-[#090A0D] animate-pulse" />
            )}
          </button>

          {/* 🌟 Nitro HD Streaming Quality Indicator */}
          <button
            onClick={() => {
              if (!isNitro) setIsNitroModalOpen(true);
              else setStreamQuality(prev => prev === '1080p' ? '720p' : '1080p');
            }}
            className={clsx(
              "h-12 px-3 rounded-2xl flex items-center space-x-1.5 transition-all shadow-md font-black text-xs cursor-pointer border",
              isNitro
                ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/20"
                : "bg-[#171920] text-gray-400 border-gray-800 hover:text-yellow-400 hover:border-yellow-400"
            )}
            title={isNitro ? `Current Quality: ${streamQuality} 60FPS (Nitro Active)` : "Unlock 1080p 60FPS Streaming with Nitro"}
          >
            <Zap size={15} className={clsx(isNitro && "fill-yellow-400 text-yellow-400")} />
            <span className="hidden md:inline">{isNitro ? `${streamQuality} 60FPS` : 'HD NITRO'}</span>
          </button>

          {/* Red Disconnect / End Call Button */}
          <button
            onClick={handleDisconnect}
            className="w-12 h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
            title="Disconnect from Voice"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      <NitroModal 
        isOpen={isNitroModalOpen}
        onClose={() => setIsNitroModalOpen(false)}
      />
    </div>
  );
};

