import { create } from 'zustand';
import cloudRelay from '../lib/cloudRelay';
import webRTCManager from '../lib/webRTCManager';

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
}

interface VoiceState {
  activeVoiceChannelId: string | null;
  peers: Record<string, VoicePeer>;
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
let unsubRelay: (() => void) | null = null;
let currentChannelTopic: string | null = null;
let _currentUserId: string = '';
let _localMicStream: MediaStream | null = null;

/** Build a shared voice presence topic using server invite code so all users match */
function buildVoiceTopic(channelId: string, serverInviteCode?: string): string {
  if (serverInviteCode) {
    return `prochat/v1/voice/${serverInviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;
  }
  return `prochat/v1/voice/presence/${channelId}`;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  activeVoiceChannelId: null,
  peers: {},

  joinVoiceChannel: (channelId, currentUser, serverInviteCode) => {
    // Leave previous channel
    get().leaveVoiceChannel();

    const userId = currentUser.id || 'user-' + Math.random().toString(36).substring(2, 6);
    _currentUserId = userId;

    const initialPeer: VoicePeer = {
      id: userId,
      name: currentUser.name || 'Pro User',
      avatarUrl:
        currentUser.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name || 'Pro'}`,
      isMuted: true,
      isSpeaking: false,
      isYou: true,
      lastHeartbeat: Date.now(),
    };

    set({
      activeVoiceChannelId: channelId,
      peers: { [userId]: initialPeer },
    });

    // Use invite-code-based topic so all users on same server match
    currentChannelTopic = buildVoiceTopic(channelId, serverInviteCode);

    // ── Get mic stream ──
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then(async (micStream) => {
        _localMicStream = micStream;

        // ── Start WebRTC room ──
        await webRTCManager.joinRoom({
          roomCode: serverInviteCode || channelId,
          userId,
          userName: initialPeer.name,
          userAvatar: initialPeer.avatarUrl,
          localStream: micStream,
          onRemoteStream: (peerId, stream, meta) => {
            set((state) => ({
              peers: {
                ...state.peers,
                [peerId]: {
                  id: peerId,
                  name: meta.name || peerId,
                  avatarUrl:
                    meta.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${peerId}`,
                  isMuted: false,
                  isSpeaking: true,
                  isYou: false,
                  lastHeartbeat: Date.now(),
                  remoteStream: stream,
                },
              },
            }));
          },
          onPeerLeave: (peerId) => {
            set((state) => {
              const next = { ...state.peers };
              delete next[peerId];
              return { peers: next };
            });
          },
        });
      })
      .catch((err) => {
        console.warn('[Voice] Mic access denied, using presence-only mode:', err);
        // Still do presence even without mic
        webRTCManager.cleanup();
      });

    // ── MQTT Presence (shows avatar in voice panel even without WebRTC) ──
    cloudRelay.publish(currentChannelTopic, {
      type: 'VOICE_JOIN',
      peer: initialPeer,
    });

    unsubRelay = cloudRelay.subscribe(currentChannelTopic, (_, data) => {
      if (!data || !data.type) return;

      if (
        data.type === 'VOICE_JOIN' ||
        data.type === 'VOICE_HEARTBEAT' ||
        data.type === 'VOICE_UPDATE'
      ) {
        const incoming: VoicePeer = data.peer;
        if (incoming?.id && incoming.id !== userId) {
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

          // Reply with our own presence so new joiner sees us
          if (data.type === 'VOICE_JOIN') {
            const myState = get().peers[userId];
            if (myState && currentChannelTopic) {
              cloudRelay.publish(currentChannelTopic, {
                type: 'VOICE_HEARTBEAT',
                peer: myState,
              });
            }
          }
        }
      } else if (data.type === 'VOICE_LEAVE' && data.userId) {
        set((state) => {
          const next = { ...state.peers };
          delete next[data.userId];
          return { peers: next };
        });
      }
    });

    // Heartbeat every 3s
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      const myState = get().peers[userId];
      if (myState && currentChannelTopic) {
        cloudRelay.publish(currentChannelTopic, {
          type: 'VOICE_HEARTBEAT',
          peer: { ...myState, lastHeartbeat: Date.now() },
        });
      }
    }, 3000);

    // Prune stale peers
    if (pruneTimer) clearInterval(pruneTimer);
    pruneTimer = setInterval(() => {
      const now = Date.now();
      const currentPeers = get().peers;
      let hasChanges = false;
      const nextPeers: Record<string, VoicePeer> = {};
      Object.entries(currentPeers).forEach(([id, p]) => {
        if (p.isYou || now - p.lastHeartbeat < 10000) {
          nextPeers[id] = p;
        } else {
          hasChanges = true;
        }
      });
      if (hasChanges) set({ peers: nextPeers });
    }, 4000);
  },

  leaveVoiceChannel: () => {
    const { activeVoiceChannelId, peers } = get();
    if (!activeVoiceChannelId) return;

    const myPeer = Object.values(peers).find((p) => p.isYou);
    if (myPeer && currentChannelTopic) {
      cloudRelay.publish(currentChannelTopic, {
        type: 'VOICE_LEAVE',
        userId: myPeer.id,
      });
    }

    webRTCManager.cleanup();
    _localMicStream?.getTracks().forEach((t) => t.stop());
    _localMicStream = null;

    unsubRelay?.();
    unsubRelay = null;
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    if (pruneTimer) { clearInterval(pruneTimer); pruneTimer = null; }

    currentChannelTopic = null;
    _currentUserId = '';
    set({ activeVoiceChannelId: null, peers: {} });
  },

  startScreenShare: async (serverInviteCode?: string) => {
    try {
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      // Replace local stream in all peer connections
      await webRTCManager.replaceLocalStream(screenStream);

      // Update own peer state
      const { peers } = get();
      const myEntry = Object.entries(peers).find(([, p]) => p.isYou);
      if (myEntry) {
        const [myId, myPeer] = myEntry;
        const updated = { ...myPeer, isScreenSharing: true, lastHeartbeat: Date.now() };
        set({ peers: { ...peers, [myId]: updated } });
        if (currentChannelTopic) {
          cloudRelay.publish(currentChannelTopic, { type: 'VOICE_UPDATE', peer: updated });
        }
      }

      // When screen share ends (user clicks browser "Stop sharing")
      screenStream.getVideoTracks()[0].onended = () => {
        get().stopScreenShare();
      };
    } catch (err) {
      console.warn('[ScreenShare] User cancelled or browser denied:', err);
    }
  },

  stopScreenShare: () => {
    // Revert to mic stream
    if (_localMicStream) {
      webRTCManager.replaceLocalStream(_localMicStream).catch(() => {});
    }

    const { peers } = get();
    const myEntry = Object.entries(peers).find(([, p]) => p.isYou);
    if (myEntry) {
      const [myId, myPeer] = myEntry;
      const updated = { ...myPeer, isScreenSharing: false, lastHeartbeat: Date.now() };
      set({ peers: { ...peers, [myId]: updated } });
      if (currentChannelTopic) {
        cloudRelay.publish(currentChannelTopic, { type: 'VOICE_UPDATE', peer: updated });
      }
    }
  },

  updateLocalState: (updates) => {
    const { peers } = get();
    const myEntry = Object.entries(peers).find(([, p]) => p.isYou);
    if (!myEntry) return;

    const [myId, myPeer] = myEntry;
    const updated: VoicePeer = { ...myPeer, ...updates, lastHeartbeat: Date.now() };

    set({ peers: { ...peers, [myId]: updated } });

    if (currentChannelTopic) {
      cloudRelay.publish(currentChannelTopic, { type: 'VOICE_UPDATE', peer: updated });
    }
  },
}));
