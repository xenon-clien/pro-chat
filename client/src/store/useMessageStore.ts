import { create } from 'zustand';
import api from '../lib/api';
import cloudRelay from '../lib/cloudRelay';

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
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

// Initial seed messages
const SEED_MESSAGES: Record<string, Message[]> = {
  'ch-general': [
    {
      id: 'msg-1',
      content: 'Welcome to ProChat! 🚀 Global real-time messaging, Discord Nitro, Soundboard, and HD Voice Channels are ready.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      author: {
        id: 'bot-admin',
        name: 'ProChat System',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProChatBot',
      },
      channelId: 'ch-general'
    },
    {
      id: 'msg-2',
      content: 'Global internet sync is active! Send your link to any friend on any phone or laptop and start chatting in real time.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      author: {
        id: 'bot-moderator',
        name: 'Community Mod',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonGamer',
      },
      channelId: 'ch-general'
    }
  ]
};

// Play audio notification chime
const playNotificationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {
    // Ignore audio context errors
  }
};

let currentUnsub: (() => void) | null = null;

export const useMessageStore = create<MessageState>((set, get) => {
  return {
    messages: SEED_MESSAGES['ch-general'] || [],
    isLoading: false,
    error: null,
    activeChannelId: 'ch-general',
    
    fetchMessages: async (channelId: string) => {
      set({ isLoading: true, error: null, activeChannelId: channelId });

      // Unsubscribe from previous channel if any
      if (currentUnsub) {
        currentUnsub();
        currentUnsub = null;
      }

      // Subscribe to global real-time cloud relay for this channel
      const topic = `prochat/v1/channel/${channelId}`;
      currentUnsub = cloudRelay.subscribe(topic, (_, data) => {
        if (data && data.id) {
          const current = get().messages;
          if (!current.find((m) => m.id === data.id)) {
            set({ messages: [data, ...current] });
            playNotificationChime();
          }
        }
      });

      // Load persistent shared messages from localStorage
      const storedKey = `prochat_channel_msgs_${channelId}`;
      let localSaved: Message[] = [];
      try {
        const raw = localStorage.getItem(storedKey);
        if (raw) {
          localSaved = JSON.parse(raw);
        }
      } catch (e) {
        localSaved = [];
      }

      try {
        const response = await api.get(`/messages/${channelId}`);
        if (Array.isArray(response.data) && response.data.length > 0) {
          set({ messages: response.data, isLoading: false });
          return;
        }
      } catch (err: any) {
        // Backend offline fallback
      }

      const combined = [
        ...localSaved,
        ...(SEED_MESSAGES[channelId] || [])
      ];

      // Remove duplicates by ID
      const uniqueMap = new Map<string, Message>();
      combined.forEach((m) => uniqueMap.set(m.id, m));
      const uniqueMessages = Array.from(uniqueMap.values());

      set({ messages: uniqueMessages, isLoading: false, error: null });
    },

    addMessage: (message: Message) => {
      const currentMessages = get().messages;
      if (!currentMessages.find(m => m.id === message.id)) {
        const updated = [message, ...currentMessages];
        set({ messages: updated });

        // Persist to local storage for this channel
        try {
          const storedKey = `prochat_channel_msgs_${message.channelId}`;
          const current = JSON.parse(localStorage.getItem(storedKey) || '[]');
          if (!current.find((m: Message) => m.id === message.id)) {
            localStorage.setItem(storedKey, JSON.stringify([message, ...current]));
          }
        } catch (e) {
          // ignore
        }
      }
    },

    sendMessage: async (channelId: string, content: string) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const localMsg: Message = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        content,
        createdAt: new Date().toISOString(),
        author: {
          id: currentUser.id || 'current-user',
          name: currentUser.name || 'Pro Member',
          avatarUrl: currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=Pro',
        },
        channelId
      };
      
      // 1. Add locally
      get().addMessage(localMsg);

      // 2. Publish to Global Cloud Realtime Relay (reaches all friends globally on any phone/PC)
      const topic = `prochat/v1/channel/${channelId}`;
      cloudRelay.publish(topic, localMsg);

      // 3. Post to backend API if live
      try {
        await api.post(`/messages/${channelId}`, { content });
      } catch (err: any) {
        // Handled smoothly
      }
    }
  };
});
