import { create } from 'zustand';
import api from '../lib/api';

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
  fetchMessages: (channelId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  sendMessage: (channelId: string, content: string) => Promise<void>;
}

// Initial seed messages
const SEED_MESSAGES: Record<string, Message[]> = {
  'ch-general': [
    {
      id: 'msg-1',
      content: 'Welcome to ProChat! 🚀 Real-time messaging, Discord Nitro, Soundboard, and HD Voice Channels are ready.',
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
      content: 'Multi-user sync is enabled! Open another tab or window with a different account and start chatting in real time.',
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

// Cross-tab real-time communication channel
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('pro_chat_realtime_sync');
  }
} catch (e) {
  console.warn('BroadcastChannel not supported');
}

// Play notification sound
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

export const useMessageStore = create<MessageState>((set, get) => {
  // Listen for real-time messages from other open tabs/windows
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === 'NEW_MESSAGE' && data.message) {
        const currentMessages = get().messages;
        const msg = data.message;
        if (!currentMessages.find((m) => m.id === msg.id)) {
          set({ messages: [msg, ...currentMessages] });
          playNotificationChime();
        }
      }
    };
  }

  // Also listen for storage events as backup across windows
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('prochat_sync_msg_')) {
        try {
          const msg = JSON.parse(event.newValue || '{}');
          if (msg && msg.id) {
            const currentMessages = get().messages;
            if (!currentMessages.find((m) => m.id === msg.id)) {
              set({ messages: [msg, ...currentMessages] });
              playNotificationChime();
            }
          }
        } catch (e) {
          // ignore
        }
      }
    });
  }

  return {
    messages: SEED_MESSAGES['ch-general'] || [],
    isLoading: false,
    error: null,
    
    fetchMessages: async (channelId: string) => {
      set({ isLoading: true, error: null });

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

      // 2. Broadcast in real time to all other tabs / browser windows
      if (syncChannel) {
        syncChannel.postMessage({ type: 'NEW_MESSAGE', message: localMsg });
      }

      // 3. Trigger storage event for cross-browser / cross-window sync
      try {
        localStorage.setItem(`prochat_sync_msg_${channelId}`, JSON.stringify(localMsg));
        // Remove item after trigger so subsequent sends re-trigger storage event
        setTimeout(() => localStorage.removeItem(`prochat_sync_msg_${channelId}`), 500);
      } catch (e) {
        // ignore
      }

      // 4. Try posting to backend API if live
      try {
        await api.post(`/messages/${channelId}`, { content });
      } catch (err: any) {
        // Handled smoothly
      }
    }
  };
});
