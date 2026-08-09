import { create } from 'zustand';
import api from '../lib/api';

// Server store - exports Channel, Server, ServerMember interfaces
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
  ownerId?: string;
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
  updateServer: (serverId: string, data: { name?: string; iconUrl?: string }) => Promise<Server>;
  deleteServer: (serverId: string) => Promise<void>;
  createChannel: (serverId: string, name: string, type?: string) => Promise<void>;
  setActiveServer: (id: string) => void;
  setActiveChannel: (id: string) => void;
}

const DEFAULT_SERVERS: Server[] = [
  {
    id: 'pro-chat-hq',
    name: 'Pro Chat HQ',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ProChat',
    channels: [
      { id: 'ch-general', name: 'general', type: 'TEXT', serverId: 'pro-chat-hq' },
      { id: 'ch-lounge', name: 'lounge', type: 'TEXT', serverId: 'pro-chat-hq' },
      { id: 'ch-nitro-chat', name: 'nitro-exclusive', type: 'TEXT', serverId: 'pro-chat-hq' },
      { id: 'ch-voice-1', name: 'General Voice', type: 'VOICE', serverId: 'pro-chat-hq' },
      { id: 'ch-voice-gaming', name: 'Gaming Room 🎮', type: 'VOICE', serverId: 'pro-chat-hq' },
    ]
  },
  {
    id: 'gaming-zone',
    name: 'Gaming Hub',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GamingZone',
    channels: [
      { id: 'ch-gaming-chat', name: 'chat', type: 'TEXT', serverId: 'gaming-zone' },
      { id: 'ch-gaming-voice', name: 'Squad Voice', type: 'VOICE', serverId: 'gaming-zone' },
    ]
  }
];

export const useServerStore = create<ServerState>((set, get) => ({
  servers: DEFAULT_SERVERS,
  activeServerId: 'pro-chat-hq',
  activeChannelId: 'ch-general',
  isLoading: false,
  error: null,

  fetchServers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/servers/init');
      const servers = response.data.map((member: ServerMember) => member.server);
      if (servers.length > 0) {
        set({ 
          servers, 
          isLoading: false,
          activeServerId: servers[0].id,
          activeChannelId: servers[0].channels.length > 0 ? servers[0].channels[0].id : null,
        });
      } else {
        set({ servers: DEFAULT_SERVERS, isLoading: false });
      }
    } catch (err: any) {
      console.warn('Backend server init failed, using default servers:', err);
      set({ 
        servers: DEFAULT_SERVERS, 
        activeServerId: 'pro-chat-hq',
        activeChannelId: 'ch-general',
        isLoading: false,
        error: null 
      });
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
      console.warn('Backend offline, creating local server:', err);
      const localId = 'server-' + Date.now();
      const newServer: Server = {
        id: localId,
        name,
        channels: [
          { id: 'ch-gen-' + localId, name: 'general', type: 'TEXT', serverId: localId },
          { id: 'ch-voice-' + localId, name: 'General Voice', type: 'VOICE', serverId: localId },
        ]
      };
      set((state) => ({
        servers: [...state.servers, newServer],
        activeServerId: newServer.id,
        activeChannelId: newServer.channels[0].id
      }));
    }
  },

  updateServer: async (serverId: string, data: { name?: string; iconUrl?: string }) => {
    try {
      const response = await api.patch(`/servers/${serverId}`, data);
      const updatedServer = response.data;
      set((state) => ({
        servers: state.servers.map(s => s.id === serverId ? { ...s, ...updatedServer } : s)
      }));
      return updatedServer;
    } catch (err: any) {
      console.warn('Backend offline, updating local server:', err);
      let updated: any = null;
      set((state) => ({
        servers: state.servers.map(s => {
          if (s.id === serverId) {
            updated = { ...s, ...data };
            return updated;
          }
          return s;
        })
      }));
      return updated;
    }
  },

  deleteServer: async (serverId: string) => {
    try {
      await api.delete(`/servers/${serverId}`);
    } catch (err: any) {
      console.warn('Backend offline, deleting local server:', err);
    }
    set((state) => {
      const remaining = state.servers.filter(s => s.id !== serverId);
      return {
        servers: remaining,
        activeServerId: remaining.length > 0 ? remaining[0].id : null,
        activeChannelId: remaining.length > 0 && remaining[0].channels.length > 0 ? remaining[0].channels[0].id : null
      };
    });
  },

  createChannel: async (serverId: string, name: string, type = 'TEXT') => {
    try {
      const response = await api.post(`/servers/${serverId}/channels`, { name, type });
      const newChannel = response.data;
      set((state) => ({
        servers: state.servers.map((server) => {
          if (server.id === serverId) {
            return {
              ...server,
              channels: [...server.channels, newChannel]
            };
          }
          return server;
        }),
        activeChannelId: newChannel.id
      }));
    } catch (err: any) {
      console.warn('Backend offline, creating local channel:', err);
      const newChannel: Channel = {
        id: 'ch-' + Date.now(),
        name,
        type,
        serverId
      };
      set((state) => ({
        servers: state.servers.map((server) => {
          if (server.id === serverId) {
            return {
              ...server,
              channels: [...server.channels, newChannel]
            };
          }
          return server;
        }),
        activeChannelId: newChannel.id
      }));
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

