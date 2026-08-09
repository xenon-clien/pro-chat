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
  inviteCode?: string;
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
  joinServerByCode: (code: string) => Promise<Server>;
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
    inviteCode: 'PRO-HQ-8821',
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
    inviteCode: 'GAME-7799',
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

  joinServerByCode: async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase().replace(/^HTTPS?:\/\/[^/]+\/INVITE\//, '').replace(/^PROCHAT\.GG\//, '');
    const state = get();

    // Check if user is already in server with this invite code
    const existing = state.servers.find(s => s.inviteCode?.toUpperCase() === code || s.id.toUpperCase() === code);
    if (existing) {
      set({
        activeServerId: existing.id,
        activeChannelId: existing.channels.length > 0 ? existing.channels[0].id : null,
      });
      return existing;
    }

    try {
      const response = await api.post('/servers/join', { inviteCode: code });
      const joinedServer = response.data;
      set((s) => ({
        servers: [...s.servers, joinedServer],
        activeServerId: joinedServer.id,
        activeChannelId: joinedServer.channels.length > 0 ? joinedServer.channels[0].id : null,
      }));
      return joinedServer;
    } catch (err: any) {
      console.warn('Backend server join fallback active:', err);
      // Create joined server representation from code
      const serverId = 'joined-' + code.toLowerCase();
      const serverName = code.includes('HQ') ? 'Pro Chat Community' : `Guild [${code}]`;
      const newJoinedServer: Server = {
        id: serverId,
        name: serverName,
        iconUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${code}`,
        inviteCode: code,
        channels: [
          { id: 'ch-gen-' + serverId, name: 'general', type: 'TEXT', serverId },
          { id: 'ch-lounge-' + serverId, name: 'lounge', type: 'TEXT', serverId },
          { id: 'ch-voice-' + serverId, name: 'Voice Hangout', type: 'VOICE', serverId },
        ]
      };
      set((s) => ({
        servers: [...s.servers, newJoinedServer],
        activeServerId: newJoinedServer.id,
        activeChannelId: newJoinedServer.channels[0].id,
      }));
      return newJoinedServer;
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

