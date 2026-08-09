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

const INITIAL_MESSAGES: Record<string, Message[]> = {
  'ch-general': [
    {
      id: 'msg-1',
      content: 'Welcome to ProChat on Vercel! 🚀 Nitro, Soundboard, and HD Voice Channels are ready to use.',
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
      content: 'Try clicking the ⚡ Nitro button in the sidebar or bottom bar to unlock animated avatars and server boosts!',
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

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: INITIAL_MESSAGES['ch-general'] || [],
  isLoading: false,
  error: null,
  
  fetchMessages: async (channelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/messages/${channelId}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        set({ messages: response.data, isLoading: false });
      } else {
        set({ messages: INITIAL_MESSAGES[channelId] || [], isLoading: false });
      }
    } catch (err: any) {
      console.warn('Backend offline, using local messages for channel:', channelId);
      set({ messages: INITIAL_MESSAGES[channelId] || [], isLoading: false, error: null });
    }
  },

  addMessage: (message: Message) => {
    const currentMessages = get().messages;
    if (!currentMessages.find(m => m.id === message.id)) {
      set({ messages: [message, ...currentMessages] });
    }
  },

  sendMessage: async (channelId: string, content: string) => {
    // Add message locally first for instant snappy response
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const localMsg: Message = {
      id: 'msg-' + Date.now(),
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser.id || 'current-user',
        name: currentUser.name || 'Pro Member',
        avatarUrl: currentUser.avatarUrl,
      },
      channelId
    };
    
    get().addMessage(localMsg);

    try {
      await api.post(`/messages/${channelId}`, { content });
    } catch (err: any) {
      console.warn('Backend offline, message saved in local session:', err);
    }
  }
}));

