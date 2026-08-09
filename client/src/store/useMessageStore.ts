import { create } from 'zustand';
import api from '../lib/api';
import cloudRelay from '../lib/cloudRelay';
import { useServerStore } from './useServerStore';

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
      content: 'Welcome to ProChat! 🚀 Global real-time messaging is active. Send your invite code to friends and chat instantly!',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      author: {
        id: 'bot-admin',
        name: 'ProChat System',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProChatBot',
      },
      channelId: 'ch-general'
    },
  ]
};

// Play audio notification chime
const playNotificationChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (e) {}
};

/**
 * Returns a globally-shared MQTT topic based on the server's inviteCode.
 * This ensures User A (creator) and User B (joiner) always share the SAME topic,
 * regardless of their local channelId.
 */
function getSharedTopic(channelId: string): string {
  try {
    const { servers, activeServerId } = useServerStore.getState();
    const activeServer = servers.find(s => s.id === activeServerId);
    if (activeServer?.inviteCode) {
      const channelType = channelId.toLowerCase().includes('voice') ? 'voice' : 'text';
      return `prochat/v1/server/${activeServer.inviteCode.toUpperCase()}/${channelType}`;
    }
  } catch (e) {}
  return `prochat/v1/channel/${channelId}`;
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

      // Unsubscribe from previous channel
      if (currentUnsub) {
        currentUnsub();
        currentUnsub = null;
      }

      // Subscribe to the shared invite-code-based MQTT topic
      const topic = getSharedTopic(channelId);
      currentUnsub = cloudRelay.subscribe(topic, (_, data) => {
        if (data && data.id) {
          const current = get().messages;
          if (!current.find((m) => m.id === data.id)) {
            set({ messages: [...current, data] });
            playNotificationChime();
          }
        }
      });

      // Load persistent messages from localStorage using shared topic key
      const storedKey = `prochat_msgs_${topic.replace(/\//g, '_')}`;
      let localSaved: Message[] = [];
      try {
        const raw = localStorage.getItem(storedKey);
        if (raw) localSaved = JSON.parse(raw);
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
        // Backend offline — use local fallback
      }

      const seedForChannel = SEED_MESSAGES[channelId] || [];
      const combined = [...localSaved, ...seedForChannel];

      // Deduplicate by ID
      const uniqueMap = new Map<string, Message>();
      combined.forEach((m) => uniqueMap.set(m.id, m));

      set({ messages: Array.from(uniqueMap.values()), isLoading: false, error: null });
    },

    addMessage: (message: Message) => {
      const current = get().messages;
      if (!current.find(m => m.id === message.id)) {
        set({ messages: [...current, message] });

        // Persist with shared topic key
        try {
          const topic = getSharedTopic(message.channelId);
          const storedKey = `prochat_msgs_${topic.replace(/\//g, '_')}`;
          const saved = JSON.parse(localStorage.getItem(storedKey) || '[]');
          if (!saved.find((m: Message) => m.id === message.id)) {
            localStorage.setItem(storedKey, JSON.stringify([...saved, message]));
          }
        } catch (e) {}
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
        channelId,
      };

      // 1. Add locally
      get().addMessage(localMsg);

      // 2. Publish on shared MQTT topic — reaches ALL friends in same server
      const topic = getSharedTopic(channelId);
      cloudRelay.publish(topic, localMsg);

      // 3. Try backend
      try {
        await api.post(`/messages/${channelId}`, { content });
      } catch (err: any) {}
    },
  };
});
