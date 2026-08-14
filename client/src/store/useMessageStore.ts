import { create } from 'zustand';
import api from '../lib/api';
import cloudRelay from '../lib/cloudRelay';
import peerJSManager from '../lib/webRTCManager';
import socketService from '../lib/socket';
import { useAuthStore } from './useAuthStore';
import { generateAiBotResponse, SAM_BOT_USER } from '../services/aiBotService';

// ── Global server invite code getter ──
let _getActiveServerInviteCode: (() => string | null) = () => null;
export function registerServerCodeGetter(fn: () => string | null) {
  _getActiveServerInviteCode = fn;
}

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    isBot?: boolean;
  };
  channelId: string;
  file?: FileAttachment;
}

interface MessageState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  activeChannelId: string | null;
  fetchMessages: (channelId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  sendMessage: (channelId: string, content: string, fileAttachment?: FileAttachment) => Promise<void>;
  clearMessages: () => void;
}

export function clearAllMessageCache() {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('prochat_msgs_')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('prochat_msgs_')) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

const SEED_MESSAGES: Record<string, Message[]> = {
  'ch-general': [
    {
      id: 'msg-seed-1',
      content: '🚀 ProChat is live! Send your server invite code to friends and start chatting in real time!',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      author: {
        id: 'bot-admin',
        name: 'ProChat System',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProChatBot',
        isBot: true,
      },
      channelId: 'ch-general',
    },
  ],
  'ch-ai-bot': [
    {
      id: 'msg-ai-welcome',
      content: "Hi there! Thanks for reaching out to ProChat support. I'm **Sam**—your dedicated ProChat AI Assistant! 🤖✨\n\nAsk me anything about:\n• 📺 **Screen Sharing & HD Video Streaming**\n• 👥 **Server Invites & Friends Auto-Join**\n• ⚡ **ProChat Nitro & Billing Support**\n• 🎙️ **HD Voice Channels & Soundboard**",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      author: {
        id: SAM_BOT_USER.id,
        name: SAM_BOT_USER.name,
        avatarUrl: SAM_BOT_USER.avatarUrl,
        isBot: true,
      },
      channelId: 'ch-ai-bot',
    },
  ],
};

const playNotificationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {}
};

function getSharedTopic(channelId: string): string {
  const inviteCode = _getActiveServerInviteCode() || 'PRO-HD';
  const cleanCode = inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  const cleanCh = channelId.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `prochat/v3/s/${cleanCode}/ch/${cleanCh}`;
}

let currentUnsub: (() => void) | null = null;

export const useMessageStore = create<MessageState>((set, get) => {
  return {
    messages: SEED_MESSAGES['ch-general'] || [],
    isLoading: false,
    error: null,
    activeChannelId: 'ch-general',

    clearMessages: () => {
      clearAllMessageCache();
      set({ messages: SEED_MESSAGES['ch-general'] || [] });
    },

    fetchMessages: async (channelId: string) => {
      set({ isLoading: false, error: null, activeChannelId: channelId });

      if (currentUnsub) {
        currentUnsub();
        currentUnsub = null;
      }

      const topic = getSharedTopic(channelId);

      currentUnsub = cloudRelay.subscribe(topic, (_, data: Message) => {
        if (data?.id) {
          const current = get().messages;
          if (!current.find((m) => m.id === data.id)) {
            set({ messages: [...current, data] });
            playNotificationChime();
          }
        }
      });

      // In-session seeds only (instant response)
      const seeds = SEED_MESSAGES[channelId] || [];
      const current = get().messages.filter(m => m.channelId === channelId);
      const combined = current.length > 0 ? current : seeds;
      const uniqueMap = new Map<string, Message>();
      combined.forEach((m) => uniqueMap.set(m.id, m));

      set({ messages: Array.from(uniqueMap.values()), isLoading: false, error: null });

      // Non-blocking background sync from API
      api.get(`/messages/${channelId}`).then((response) => {
        if (Array.isArray(response.data) && response.data.length > 0) {
          set({ messages: response.data, isLoading: false });
        }
      }).catch(() => {});
    },

    addMessage: (message: Message) => {
      const current = get().messages;
      if (!current.find((m) => m.id === message.id)) {
        set({ messages: [...current, message] });
      }
    },

    sendMessage: async (channelId: string, content: string, fileAttachment?: FileAttachment) => {
      const authUser = useAuthStore.getState().user;
      const currentUser = authUser || JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
      const topic = getSharedTopic(channelId);

      const msg: Message = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        content,
        createdAt: new Date().toISOString(),
        author: {
          id: currentUser.id || 'guest-' + Math.random().toString(36).substring(2, 6),
          name: currentUser.name || 'Pro Member',
          avatarUrl:
            currentUser.avatarUrl ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name || 'Pro'}`,
        },
        channelId,
        ...(fileAttachment ? { file: fileAttachment } : {}),
      };

      // Add locally (optimistic)
      get().addMessage(msg);

      // Broadcast to all users on same server via MQTT
      cloudRelay.publish(topic, msg);

      // Broadcast via Socket.io to backend room
      try {
        socketService.emitMessage(channelId, msg);
      } catch (e) {}

      // Also broadcast over P2P DataChannel (0ms direct peer-to-peer delivery)
      try {
        peerJSManager.broadcastData({ type: 'CHAT_MESSAGE', message: msg, channelId });
      } catch (e) {}

      // Backend API
      try {
        await api.post(`/messages/${channelId}`, { content });
      } catch (err: any) {}

      // 🤖 AI Bot "Sam" Response Trigger
      const isAiChannel = channelId === 'ch-ai-bot' || channelId.includes('ai');
      const mentionsSam = content.toLowerCase().includes('@sam') || 
                          content.toLowerCase().includes('@ai') || 
                          content.toLowerCase().includes('@bot');

      if (isAiChannel || mentionsSam) {
        setTimeout(async () => {
          const aiResponse = await generateAiBotResponse(content);
          const botMsg: Message = {
            id: 'msg-sam-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            content: aiResponse.content,
            createdAt: new Date().toISOString(),
            author: {
              id: SAM_BOT_USER.id,
              name: SAM_BOT_USER.name,
              avatarUrl: SAM_BOT_USER.avatarUrl,
              isBot: true,
            },
            channelId,
          };

          get().addMessage(botMsg);
          cloudRelay.publish(topic, botMsg);
          playNotificationChime();
        }, 500);
      }
    },
  };
});
