import { create } from 'zustand';
import api from '../lib/api';
import cloudRelay from '../lib/cloudRelay';
import peerJSManager from '../lib/webRTCManager';
import { generateAiBotResponse, SAM_BOT_USER } from '../services/aiBotService';

// ── Global server invite code getter ──
let _getActiveServerInviteCode: (() => string | null) = () => null;
export function registerServerCodeGetter(fn: () => string | null) {
  _getActiveServerInviteCode = fn;
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
}

interface MessageState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  activeChannelId: string | null;
  fetchMessages: (channelId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  sendMessage: (channelId: string, content: string) => Promise<void>;
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

/**
 * Returns a globally-shared MQTT topic so all users in same server share messages in real time.
 */
function getSharedTopic(channelId: string): string {
  const inviteCode = _getActiveServerInviteCode() || 'PRO-HQ-8821';
  const cleanCode = inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '-');
  return `prochat/v2/s/${cleanCode}/text`;
}

let currentUnsub: (() => void) | null = null;

export const useMessageStore = create<MessageState>((set, get) => {
  return {
    messages: SEED_MESSAGES['ch-general'] || [],
    isLoading: false,
    error: null,
    activeChannelId: 'ch-general',

    fetchMessages: async (channelId: string) => {
      set({ isLoading: true, error: null, activeChannelId: channelId });

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

      const storageKey = `prochat_msgs_${topic.replace(/\//g, '_')}_${channelId}`;
      let localSaved: Message[] = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) localSaved = JSON.parse(raw);
      } catch (e) {}

      try {
        const response = await api.get(`/messages/${channelId}`);
        if (Array.isArray(response.data) && response.data.length > 0) {
          set({ messages: response.data, isLoading: false });
          return;
        }
      } catch (err: any) {}

      const seeds = SEED_MESSAGES[channelId] || [];
      const combined = [...localSaved, ...seeds];
      const uniqueMap = new Map<string, Message>();
      combined.forEach((m) => uniqueMap.set(m.id, m));

      set({ messages: Array.from(uniqueMap.values()), isLoading: false, error: null });
    },

    addMessage: (message: Message) => {
      const current = get().messages;
      if (!current.find((m) => m.id === message.id)) {
        set({ messages: [...current, message] });
        try {
          const topic = getSharedTopic(message.channelId);
          const storageKey = `prochat_msgs_${topic.replace(/\//g, '_')}_${message.channelId}`;
          const saved: Message[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
          if (!saved.find((m) => m.id === message.id)) {
            const trimmed = [message, ...saved].slice(0, 200);
            localStorage.setItem(storageKey, JSON.stringify(trimmed));
          }
        } catch (e) {}
      }
    },

    sendMessage: async (channelId: string, content: string) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
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
      };

      // Add locally (optimistic)
      get().addMessage(msg);

      // Broadcast to all users on same server via MQTT
      cloudRelay.publish(topic, msg);

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
