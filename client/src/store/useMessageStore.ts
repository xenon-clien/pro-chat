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

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  fetchMessages: async (channelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/messages/${channelId}`);
      set({ messages: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch messages', isLoading: false });
    }
  },

  addMessage: (message: Message) => {
    const currentMessages = get().messages;
    // Prevent duplicates
    if (!currentMessages.find(m => m.id === message.id)) {
      set({ messages: [message, ...currentMessages] });
    }
  },

  sendMessage: async (channelId: string, content: string) => {
    try {
      await api.post(`/messages/${channelId}`, { content });
      // We don't add the message here, we wait for the Socket.io event to ensure everyone gets it
    } catch (err: any) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }
}));
