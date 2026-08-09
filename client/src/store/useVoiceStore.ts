import { create } from 'zustand';
import cloudRelay from '../lib/cloudRelay';

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
}

interface VoiceState {
  activeVoiceChannelId: string | null;
  peers: Record<string, VoicePeer>;
  joinVoiceChannel: (channelId: string, currentUser: { id: string; name: string; avatarUrl?: string }) => void;
  leaveVoiceChannel: () => void;
  updateLocalState: (state: { isMuted?: boolean; isSpeaking?: boolean; isCameraOn?: boolean; isScreenSharing?: boolean }) => void;
}

let heartbeatTimer: any = null;
let pruneTimer: any = null;
let unsubRelay: (() => void) | null = null;
let currentChannelTopic: string | null = null;

export const useVoiceStore = create<VoiceState>((set, get) => ({
  activeVoiceChannelId: null,
  peers: {},

  joinVoiceChannel: (channelId: string, currentUser: { id: string; name: string; avatarUrl?: string }) => {
    // Leave previous channel if any
    get().leaveVoiceChannel();

    const userId = currentUser.id || 'user-' + Math.random().toString(36).substring(2, 6);
    const initialPeer: VoicePeer = {
      id: userId,
      name: currentUser.name || 'Pro User',
      avatarUrl: currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name || 'Pro'}`,
      isMuted: true,
      isSpeaking: false,
      isYou: true,
      lastHeartbeat: Date.now(),
    };

    set({
      activeVoiceChannelId: channelId,
      peers: { [userId]: initialPeer },
    });

    currentChannelTopic = `prochat/v1/voice/presence/${channelId}`;

    // Announce JOIN to all connected devices on this channel
    cloudRelay.publish(currentChannelTopic, {
      type: 'VOICE_JOIN',
      peer: initialPeer,
    });

    // Listen for remote peer join / leave / heartbeat
    unsubRelay = cloudRelay.subscribe(currentChannelTopic, (_, data) => {
      if (!data || !data.type) return;

      if (data.type === 'VOICE_JOIN' || data.type === 'VOICE_HEARTBEAT' || data.type === 'VOICE_UPDATE') {
        const incoming: VoicePeer = data.peer;
        if (incoming && incoming.id && incoming.id !== userId) {
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

          // If it was a join event, reply with our own presence so the new joiner sees us immediately
          if (data.type === 'VOICE_JOIN') {
            const myState = get().peers[userId];
            if (myState) {
              cloudRelay.publish(currentChannelTopic!, {
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

    // Send heartbeat every 3 seconds to keep presence alive across all devices
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

    // Prune stale peers who haven't sent a heartbeat in 8 seconds
    if (pruneTimer) clearInterval(pruneTimer);
    pruneTimer = setInterval(() => {
      const now = Date.now();
      const currentPeers = get().peers;
      let hasChanges = false;
      const nextPeers: Record<string, VoicePeer> = {};

      Object.entries(currentPeers).forEach(([id, p]) => {
        if (p.isYou || now - p.lastHeartbeat < 8000) {
          nextPeers[id] = p;
        } else {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        set({ peers: nextPeers });
      }
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

    if (unsubRelay) {
      unsubRelay();
      unsubRelay = null;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (pruneTimer) {
      clearInterval(pruneTimer);
      pruneTimer = null;
    }

    currentChannelTopic = null;
    set({ activeVoiceChannelId: null, peers: {} });
  },

  updateLocalState: (updates) => {
    const { peers } = get();
    const myEntry = Object.entries(peers).find(([_, p]) => p.isYou);
    if (!myEntry) return;

    const [myId, myPeer] = myEntry;
    const updated: VoicePeer = {
      ...myPeer,
      ...updates,
      lastHeartbeat: Date.now(),
    };

    set({
      peers: {
        ...peers,
        [myId]: updated,
      },
    });

    if (currentChannelTopic) {
      cloudRelay.publish(currentChannelTopic, {
        type: 'VOICE_UPDATE',
        peer: updated,
      });
    }
  },
}));
