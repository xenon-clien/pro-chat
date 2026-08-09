import { create } from 'zustand';
import cloudRelay from '../lib/cloudRelay';
import peerJSManager from '../lib/webRTCManager';

export interface VoicePeer {
  id: string;
  name: string;
  avatarUrl: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isCameraOn?: boolean;
  isScreenSharing?: boolean;
  isYou?: boolean;
  lastHeartbeat: number;
  remoteStream?: MediaStream;
  peerId?: string; // PeerJS ID
}

interface VoiceState {
  activeVoiceChannelId: string | null;
  peers: Record<string, VoicePeer>;
  myPeerId: string | null;
  isConnecting: boolean;
  joinVoiceChannel: (
    channelId: string,
    currentUser: { id: string; name: string; avatarUrl?: string },
    serverInviteCode?: string
  ) => void;
  leaveVoiceChannel: () => void;
  updateLocalState: (state: {
    isMuted?: boolean;
    isSpeaking?: boolean;
    isCameraOn?: boolean;
    isScreenSharing?: boolean;
  }) => void;
  startScreenShare: (serverInviteCode?: string) => Promise<void>;
  stopScreenShare: () => void;
}

let heartbeatTimer: any = null;
let pruneTimer: any = null;
let unsubPresence: (() => void) | null = null;
let currentTopic: string | null = null;
let _currentInviteCode: string = '';
let _micStream: MediaStream | null = null;
let _currentUserId: string = '';

function buildVoiceTopic(channelId: string, inviteCode?: string): string {
  if (inviteCode) {
    return `prochat/v1/voice/${inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;
  }
  return `prochat/v1/voice/ch-${channelId}`;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  activeVoiceChannelId: null,
  peers: {},
  myPeerId: null,
  isConnecting: false,

  joinVoiceChannel: (channelId, currentUser, serverInviteCode) => {
    get().leaveVoiceChannel();

    const userId = currentUser.id || 'u-' + Math.random().toString(36).substring(2, 8);
    _currentUserId = userId;
    _currentInviteCode = serverInviteCode || channelId;

    const me: VoicePeer = {
      id: userId,
      name: currentUser.name || 'Pro User',
      avatarUrl: currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      isMuted: true,
      isSpeaking: false,
      isYou: true,
      lastHeartbeat: Date.now(),
    };

    set({ activeVoiceChannelId: channelId, peers: { [userId]: me }, isConnecting: true });
    currentTopic = buildVoiceTopic(channelId, serverInviteCode);

    // ─── Get Mic ───────────────────────────────────────────────
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .catch(() => {
        // Mic denied — create silent stream so PeerJS still works
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();
        return dest.stream;
      })
      .then(async (micStream) => {
        _micStream = micStream;

        // ─── Init PeerJS ───────────────────────────────────────
        try {
          const myPeerId = await peerJSManager.init({
            inviteCode: serverInviteCode || channelId,
            userId,
            userName: me.name,
            userAvatar: me.avatarUrl,
            localStream: micStream,
            onRemoteStream: (remotePeerId, stream, meta) => {
              set((state) => ({
                peers: {
                  ...state.peers,
                  [remotePeerId]: {
                    id: remotePeerId,
                    name: meta.name || remotePeerId,
                    avatarUrl: meta.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${remotePeerId}`,
                    isMuted: false,
                    isSpeaking: true,
                    isYou: false,
                    lastHeartbeat: Date.now(),
                    remoteStream: stream,
                    peerId: remotePeerId,
                  },
                },
              }));
            },
            onPeerLeave: (remotePeerId) => {
              set((state) => {
                const next = { ...state.peers };
                // Remove by peerId match
                Object.keys(next).forEach((k) => {
                  if (next[k].peerId === remotePeerId || k === remotePeerId) delete next[k];
                });
                return { peers: next };
              });
            },
          });

          set((state) => ({
            myPeerId,
            isConnecting: false,
            peers: {
              ...state.peers,
              [userId]: { ...state.peers[userId], peerId: myPeerId },
            },
          }));

          // Announce presence with PeerJS ID via MQTT so others can call us
          cloudRelay.publish(currentTopic!, {
            type: 'VOICE_JOIN',
            peer: { ...me, peerId: myPeerId },
          });
        } catch (err) {
          console.warn('[Voice] PeerJS init failed:', err);
          set({ isConnecting: false });
        }
      });

    // ─── MQTT Presence subscription ────────────────────────────
    unsubPresence = cloudRelay.subscribe(currentTopic, (_, data) => {
      if (!data?.type) return;

      const { peers } = get();
      const myId = _currentUserId;

      if (data.type === 'VOICE_JOIN' || data.type === 'VOICE_HEARTBEAT') {
        const incoming: VoicePeer = data.peer;
        if (!incoming?.id || incoming.id === myId) return;

        // Add to presence list
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

        // If they just joined and we have a PeerJS ID, call them
        if (data.type === 'VOICE_JOIN' && incoming.peerId) {
          console.log('[Voice] New peer joined, calling via PeerJS:', incoming.peerId);
          const myState = get().peers[myId];
          // Reply with our presence
          if (myState && currentTopic) {
            cloudRelay.publish(currentTopic, {
              type: 'VOICE_HEARTBEAT',
              peer: { ...myState, peerId: peerJSManager.getMyPeerId() },
            });
          }
          // Call them via PeerJS
          peerJSManager.callPeer(_currentInviteCode, incoming.id);
        } else if (data.type === 'VOICE_HEARTBEAT' && incoming.peerId && !peers[incoming.id]?.remoteStream) {
          // Heartbeat from someone we don't have a stream from — try calling
          peerJSManager.callPeer(_currentInviteCode, incoming.id);
        }
      } else if (data.type === 'VOICE_UPDATE') {
        const p: VoicePeer = data.peer;
        if (p?.id && p.id !== myId && get().peers[p.id]) {
          set((state) => ({
            peers: {
              ...state.peers,
              [p.id]: { ...state.peers[p.id], ...p, isYou: false, lastHeartbeat: Date.now() },
            },
          }));
        }
      } else if (data.type === 'VOICE_LEAVE' && data.userId) {
        set((state) => {
          const next = { ...state.peers };
          delete next[data.userId];
          return { peers: next };
        });
      }
    });

    // Heartbeat every 4s
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      const myState = get().peers[_currentUserId];
      if (myState && currentTopic) {
        cloudRelay.publish(currentTopic, {
          type: 'VOICE_HEARTBEAT',
          peer: { ...myState, peerId: peerJSManager.getMyPeerId(), lastHeartbeat: Date.now() },
        });
      }
    }, 4000);

    // Prune stale peers (no heartbeat >15s)
    if (pruneTimer) clearInterval(pruneTimer);
    pruneTimer = setInterval(() => {
      const now = Date.now();
      const current = get().peers;
      let changed = false;
      const next: Record<string, VoicePeer> = {};
      Object.entries(current).forEach(([id, p]) => {
        if (p.isYou || now - p.lastHeartbeat < 15000) {
          next[id] = p;
        } else {
          changed = true;
        }
      });
      if (changed) set({ peers: next });
    }, 5000);
  },

  leaveVoiceChannel: () => {
    const { activeVoiceChannelId, peers } = get();
    if (!activeVoiceChannelId) return;

    const myPeer = Object.values(peers).find(p => p.isYou);
    if (myPeer && currentTopic) {
      cloudRelay.publish(currentTopic, { type: 'VOICE_LEAVE', userId: myPeer.id });
    }

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
    set({ activeVoiceChannelId: null, peers: {}, myPeerId: null, isConnecting: false });
  },

  startScreenShare: async () => {
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 30, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });

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
    } catch (err) {
      console.warn('[ScreenShare] Cancelled or denied:', err);
    }
  },

  stopScreenShare: () => {
    if (_micStream) {
      peerJSManager.replaceStream(_micStream).catch(() => {});
    }

    const { peers } = get();
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
    set({ peers: { ...peers, [myId]: updated } });

    if (currentTopic) {
      cloudRelay.publish(currentTopic, { type: 'VOICE_UPDATE', peer: updated });
    }
  },
}));
