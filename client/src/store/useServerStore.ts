import { create } from 'zustand';
import api from '../lib/api';

export interface Channel {
  id: string;
  name: string;
  type: string;
  serverId: string;
}

export interface Server {
  id: string;
  name: string;
  iconUrl?: string;
  channels: Channel[];
}

export interface ServerMember {
  id: string;
  role: string;
  server: Server;
}

interface ServerState {
  servers: Server[];
  activeServerId: string | null;
  activeChannelId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchServers: () => Promise<void>;
  createServer: (name: string) => Promise<void>;
  setActiveServer: (id: string) => void;
  setActiveChannel: (id: string) => void;
}

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  activeServerId: null,
  activeChannelId: null,
  isLoading: false,
  error: null,

  fetchServers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/servers/init');
      // The API returns members which include the server
      const servers = response.data.map((member: ServerMember) => member.server);
      
      set({ 
        servers, 
        isLoading: false,
        activeServerId: servers.length > 0 ? servers[0].id : null,
        activeChannelId: servers.length > 0 && servers[0].channels.length > 0 ? servers[0].channels[0].id : null,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to fetch servers', isLoading: false });
    }
  },

  createServer: async (name: string) => {
    try {
      const response = await api.post('/servers', { name });
      const newServer = response.data;
      set((state) => ({
        servers: [...state.servers, newServer],
        activeServerId: newServer.id,
        activeChannelId: newServer.channels[0].id
      }));
    } catch (err: any) {
      console.error('Failed to create server', err);
    }
  },

  setActiveServer: (id: string) => {
    const state = get();
    const server = state.servers.find(s => s.id === id);
    set({ 
      activeServerId: id,
      activeChannelId: server?.channels?.length ? server.channels[0].id : null
    });
  },
  setActiveChannel: (id: string) => set({ activeChannelId: id }),
}));
