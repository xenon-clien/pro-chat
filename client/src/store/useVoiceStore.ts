import { create } from 'zustand';
import cloudRelay from '../lib/cloudRelay';
import peerJSManager from '../lib/webRTCManager';
import { useMessageStore } from './useMessageStore';

export interface VoicePeer {
  id: string;
  name: string;
  avatarUrl?: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
  isCameraOn?: boolean;
  isYou?: boolean;
  lastHeartbeat?: number;
  remoteStream?: MediaStream;
  peerId?: string;
}

interface VoiceState {
  activeVoiceChannelId: string | null;
  peers: Record<string, VoicePeer>;
  myPeerId: string | null;
  isConnecting: boolean;
  localScreenStream: MediaStream | null;
  joinVoiceChannel: (channelId: string, user: { id: string; name: string; avatarUrl?: string }, serverInviteCode?: string) => Promise<void>;
  leaveVoiceChannel: () => void;
  startScreenShare: (serverInviteCode?: string) => Promise<MediaStream | null>;
  stopScreenShare: () => void;
  updateLocalState: (updates: Partial<VoicePeer>) => void;
}

let unsubPresence: (() => void) | null = null;
let heartbeatTimer: any = null;
let pruneTimer: any = null;
let currentTopic: string | null = null;
let _micStream: MediaStream | null = null;
let _currentUserId = '';
let _currentInviteCode = '';
let _audioCtx: AudioContext | null = null;
let _micAnimFrame: any = null;

function buildVoiceTopic(channelId: string, serverInviteCode?: string): string {
  const code = (serverInviteCode || channelId).toUpperCase().replace(/[^A-Z0-9]/g, '-');
  return `prochat/v2/voice/${code}`;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  activeVoiceChannelId: null,
  peers: {},
  myPeerId: null,
  isConnecting: false,
  localScreenStream: null,

  joinVoiceChannel: async (channelId: string, user: { id: string; name: string; avatarUrl?: string }, serverInviteCode?: string) => {
    const prev = get().activeVoiceChannelId;
    if (prev === channelId && get().myPeerId) return;

    if (prev) {
      get().leaveVoiceChannel();
    }

    const userId = user.id;
    _currentUserId = userId;
    _currentInviteCode = serverInviteCode || 'PRO-HD';

    const me: VoicePeer = {
      id: userId,
      name: user.name,
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}&backgroundColor=fbbf24`,
      isMuted: false,
      isSpeaking: false,
      isScreenSharing: false,
      isCameraOn: false,
      isYou: true,
      lastHeartbeat: Date.now(),
    };

    set({ activeVoiceChannelId: channelId, peers: { [userId]: me }, isConnecting: true });
    currentTopic = buildVoiceTopic(channelId, serverInviteCode);

    // ─── 1. Get Real Microphone Stream ──────────────────────────
    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      micStream.getAudioTracks().forEach(t => { t.enabled = true; });
    } catch {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dest = ctx.createMediaStreamDestination();
        micStream = dest.stream;
      } catch {
        micStream = new MediaStream();
      }
    }
    _micStream = micStream;

    // ─── 2. Voice Activity Detection (Speaking Radar Glow) ───────
    try {
      if (micStream.getAudioTracks().length > 0) {
        _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = _audioCtx.createMediaStreamSource(micStream);
        const analyser = _audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let wasSpeaking = false;

        const checkSpeaking = () => {
          if (!_micStream) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const isNowSpeaking = avg > 15;

          if (isNowSpeaking !== wasSpeaking) {
            wasSpeaking = isNowSpeaking;
            get().updateLocalState({ isSpeaking: isNowSpeaking });
          }
          _micAnimFrame = requestAnimationFrame(checkSpeaking);
        };
        _micAnimFrame = requestAnimationFrame(checkSpeaking);
      }
    } catch (e) {}

    // ─── 3. Init PeerJS with STUN/TURN & P2P WebRTC ─────────────
    try {
      const myPeerId = await peerJSManager.init({
        inviteCode: serverInviteCode || 'PRO-HD',
        userId,
        userName: me.name,
        userAvatar: me.avatarUrl || '',
        localStream: micStream,
        onRemoteStream: (remotePeerId, stream, meta) => {
          console.log('[VoiceStore] Remote stream received from:', remotePeerId, 'tracks:', stream.getTracks());
          const hasVideo = stream.getVideoTracks().length > 0;

          // Ensure audio tracks are active
          stream.getAudioTracks().forEach(t => { t.enabled = true; });

          set((state) => {
            const nextPeers = { ...state.peers };
            const existingKey = Object.keys(nextPeers).find(
              k => nextPeers[k].peerId === remotePeerId || k === remotePeerId || remotePeerId.includes(k)
            );

            if (existingKey) {
              nextPeers[existingKey] = {
                ...nextPeers[existingKey],
                remoteStream: stream,
                isScreenSharing: hasVideo ? true : nextPeers[existingKey].isScreenSharing,
                lastHeartbeat: Date.now(),
              };
            } else {
              nextPeers[remotePeerId] = {
                id: remotePeerId,
                name: meta.name || remotePeerId,
                avatarUrl: meta.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${remotePeerId}`,
                isMuted: false,
                isSpeaking: false,
                isScreenSharing: hasVideo,
                isYou: false,
                lastHeartbeat: Date.now(),
                remoteStream: stream,
                peerId: remotePeerId,
              };
            }
            return { peers: nextPeers };
          });
        },
        onPeerLeave: (remotePeerId) => {
          set((state) => {
            const next = { ...state.peers };
            Object.keys(next).forEach((k) => {
              if (next[k].peerId === remotePeerId || k === remotePeerId) delete next[k];
            });
            return { peers: next };
          });
        },
        onDataMessage: (data) => {
          if (data?.type === 'CHAT_MESSAGE' && data.message) {
            useMessageStore.getState().addMessage(data.message);
          }
        }
      });

      set((state) => ({
        myPeerId,
        isConnecting: false,
        peers: {
          ...state.peers,
          [userId]: { ...state.peers[userId], peerId: myPeerId },
        },
      }));

      // Announce presence so remote peers call us
      if (currentTopic) {
        cloudRelay.publish(currentTopic, {
          type: 'VOICE_JOIN',
          peer: { ...me, peerId: myPeerId },
        });
      }
    } catch (err) {
      console.warn('[Voice] PeerJS init warning:', err);
      set({ isConnecting: false });
    }

    // ─── 4. Presence Handshakes & Auto-Calling ───────────────────
    unsubPresence = cloudRelay.subscribe(currentTopic, (_, data) => {
      if (!data?.type) return;

      const { peers } = get();
      const myId = _currentUserId;

      if (data.type === 'VOICE_JOIN' || data.type === 'VOICE_HEARTBEAT') {
        const incoming: VoicePeer = data.peer;
        if (!incoming?.id || incoming.id === myId) return;

        set((state) => ({
          peers: {
            ...state.peers,
            [incoming.id]: {
              ...incoming,
              isYou: false,
              lastHeartbeat: Date.now(),
            },
          },
        }));

        if (data.type === 'VOICE_JOIN' && incoming.peerId) {
          const myState = get().peers[myId];
          if (myState && currentTopic) {
            cloudRelay.publish(currentTopic, {
              type: 'VOICE_HEARTBEAT',
              peer: { ...myState, peerId: peerJSManager.getMyPeerId() },
            });
          }
          peerJSManager.callPeerDirect(incoming.peerId);
        } else if (data.type === 'VOICE_HEARTBEAT' && incoming.peerId && !peers[incoming.id]?.remoteStream) {
          peerJSManager.callPeerDirect(incoming.peerId);
        }
      } else if (data.type === 'VOICE_UPDATE') {
        const p: VoicePeer = data.peer;
        if (p?.id && p.id !== myId && get().peers[p.id]) {
          set((state) => ({
            peers: {
              ...state.peers,
              [p.id]: { ...state.peers[p.id], ...p },
            },
          }));
        }
      } else if (data.type === 'VOICE_LEAVE') {
        const leaveId = data.userId;
        if (leaveId && leaveId !== myId) {
          set((state) => {
            const next = { ...state.peers };
            delete next[leaveId];
            return { peers: next };
          });
        }
      }
    });

    // Heartbeat every 3s
    heartbeatTimer = setInterval(() => {
      const myState = get().peers[_currentUserId];
      if (myState && currentTopic) {
        cloudRelay.publish(currentTopic, {
          type: 'VOICE_HEARTBEAT',
          peer: { ...myState, peerId: peerJSManager.getMyPeerId(), lastHeartbeat: Date.now() },
        });
      }
    }, 3000);

    // Prune inactive peers
    pruneTimer = setInterval(() => {
      const now = Date.now();
      const { peers } = get();
      let changed = false;
      const next = { ...peers };

      Object.entries(peers).forEach(([id, p]) => {
        if (!p.isYou && p.lastHeartbeat && now - p.lastHeartbeat > 15000) {
          delete next[id];
          changed = true;
        }
      });

      if (changed) set({ peers: next });
    }, 4000);
  },

  leaveVoiceChannel: () => {
    const { activeVoiceChannelId, peers, localScreenStream } = get();
    if (!activeVoiceChannelId) return;

    const myPeer = Object.values(peers).find(p => p.isYou);
    if (myPeer && currentTopic) {
      cloudRelay.publish(currentTopic, { type: 'VOICE_LEAVE', userId: myPeer.id });
    }

    if (localScreenStream) {
      localScreenStream.getTracks().forEach(t => t.stop());
    }

    if (_micAnimFrame) {
      cancelAnimationFrame(_micAnimFrame);
      _micAnimFrame = null;
    }
    try { _audioCtx?.close(); } catch (e) {}
    _audioCtx = null;

    peerJSManager.cleanup();
    _micStream?.getTracks().forEach(t => t.stop());
    _micStream = null;
    unsubPresence?.();
    unsubPresence = null;
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (pruneTimer) { clearInterval(pruneTimer); pruneTimer = null; }

    currentTopic = null;
    _currentUserId = '';
    _currentInviteCode = '';
    set({ 
      activeVoiceChannelId: null, 
      peers: {}, 
      myPeerId: null, 
      isConnecting: false, 
      localScreenStream: null 
    });
  },

  startScreenShare: async () => {
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { 
          frameRate: 60, 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        },
        audio: true,
      });

      set({ localScreenStream: screenStream });

      // Transmit screen video over WebRTC
      await peerJSManager.replaceStream(screenStream);

      const { peers } = get();
      const myEntry = Object.entries(peers).find(([, p]) => p.isYou);
      if (myEntry) {
        const [myId, myPeer] = myEntry;
        const updated = { ...myPeer, isScreenSharing: true, lastHeartbeat: Date.now() };
        set({ peers: { ...peers, [myId]: updated } });
        if (currentTopic) cloudRelay.publish(currentTopic, { type: 'VOICE_UPDATE', peer: updated });
      }

      screenStream.getVideoTracks()[0].onended = () => get().stopScreenShare();
      return screenStream;
    } catch (err) {
      console.warn('[ScreenShare] Cancelled or denied:', err);
      return null;
    }
  },

  stopScreenShare: () => {
    const { localScreenStream, peers } = get();
    if (localScreenStream) {
      localScreenStream.getTracks().forEach(t => t.stop());
      set({ localScreenStream: null });
    }

    if (_micStream) {
      peerJSManager.replaceStream(_micStream).catch(() => {});
    }

    const myEntry = Object.entries(peers).find(([, p]) => p.isYou);
    if (myEntry) {
      const [myId, myPeer] = myEntry;
      const updated = { ...myPeer, isScreenSharing: false, lastHeartbeat: Date.now() };
      set({ peers: { ...peers, [myId]: updated } });
      if (currentTopic) cloudRelay.publish(currentTopic, { type: 'VOICE_UPDATE', peer: updated });
    }
  },

  updateLocalState: (updates) => {
    const { peers } = get();
    const myEntry = Object.entries(peers).find(([, p]) => p.isYou);
    if (!myEntry) return;

    const [myId, myPeer] = myEntry;
    const updated: VoicePeer = { ...myPeer, ...updates, lastHeartbeat: Date.now() };

    // Toggle actual hardware mic track
    if (updates.isMuted !== undefined && _micStream) {
      _micStream.getAudioTracks().forEach((track) => {
        track.enabled = !updates.isMuted;
      });
    }

    set({ peers: { ...peers, [myId]: updated } });

    if (currentTopic) {
      cloudRelay.publish(currentTopic, { type: 'VOICE_UPDATE', peer: updated });
    }
  },
}));
