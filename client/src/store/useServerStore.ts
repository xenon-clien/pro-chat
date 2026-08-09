import { create } from 'zustand';
import api from '../lib/api';
import cloudRelay from '../lib/cloudRelay';
import { registerServerCodeGetter } from './useMessageStore';

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
  publicDirectory: Server[];
  activeServerId: string | null;
  activeChannelId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchServers: () => Promise<void>;
  createServer: (name: string) => Promise<Server>;
  joinServerByCode: (codeOrName: string) => Promise<Server>;
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
      { id: 'ch-voice-1', name: 'General Voice', type: 'VOICE', serverId: 'pro-chat-hq' },
    ]
  },
  {
    id: 'gaming-zone',
    name: 'Gaming Hub',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GamingZone',
    inviteCode: 'GAME-7799',
    channels: [
      { id: 'ch-gaming-chat', name: 'general', type: 'TEXT', serverId: 'gaming-zone' },
      { id: 'ch-gaming-voice', name: 'Squad Voice', type: 'VOICE', serverId: 'gaming-zone' },
    ]
  },
  {
    id: 'anime-lounge',
    name: 'Anime & Manga Lounge',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AnimeLounge',
    inviteCode: 'ANIME-101',
    channels: [
      { id: 'ch-anime-general', name: 'general', type: 'TEXT', serverId: 'anime-lounge' },
      { id: 'ch-anime-voice', name: 'Watch Party', type: 'VOICE', serverId: 'anime-lounge' },
    ]
  }
];

export const useServerStore = create<ServerState>((set, get) => {
  // Load saved servers from localStorage
  const savedServers = (() => {
    try {
      const stored = localStorage.getItem('prochat_user_servers');
      return stored ? JSON.parse(stored) : DEFAULT_SERVERS;
    } catch {
      return DEFAULT_SERVERS;
    }
  })();

  // Register getter so useMessageStore can find the active server's inviteCode for shared MQTT topics
  registerServerCodeGetter(() => {
    const { servers, activeServerId } = get();
    const server = servers.find(s => s.id === activeServerId);
    return server?.inviteCode || null;
  });

  // Listen for global public server announcements over cloud relay
  if (typeof window !== 'undefined') {
    cloudRelay.subscribe('prochat/v1/servers/directory', (_, data) => {
      if (data && data.server) {
        const incomingServer: Server = data.server;
        const currentDir = get().publicDirectory;
        if (!currentDir.find(s => s.id === incomingServer.id || s.name.toLowerCase() === incomingServer.name.toLowerCase())) {
          set({ publicDirectory: [incomingServer, ...currentDir] });
        }
      }
    });
  }

  return {
    servers: savedServers,
    publicDirectory: DEFAULT_SERVERS,
    activeServerId: savedServers[0]?.id || 'pro-chat-hq',
    activeChannelId: savedServers[0]?.channels[0]?.id || 'ch-general',
    isLoading: false,
    error: null,

    fetchServers: async () => {
      try {
        const response = await api.get('/servers/init');
        const servers = response.data.map((member: ServerMember) => member.server);
        if (servers.length > 0) {
          localStorage.setItem('prochat_user_servers', JSON.stringify(servers));
          set({ 
            servers, 
            isLoading: false,
            activeServerId: servers[0].id,
            activeChannelId: servers[0].channels.length > 0 ? servers[0].channels[0].id : null,
          });
        }
      } catch (err: any) {
        // Handled locally
      }
    },

    createServer: async (name: string) => {
      const cleanName = name.trim();
      const serverId = 'server-' + Date.now();
      const code = cleanName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'PRO') + '-' + Math.floor(1000 + Math.random() * 9000);
      
      const newServer: Server = {
        id: serverId,
        name: cleanName,
        iconUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`,
        inviteCode: code,
        channels: [
          { id: 'ch-gen-' + serverId, name: 'general', type: 'TEXT', serverId },
          { id: 'ch-voice-' + serverId, name: 'General Voice', type: 'VOICE', serverId },
        ]
      };

      const updated = [...get().servers, newServer];
      localStorage.setItem('prochat_user_servers', JSON.stringify(updated));

      // Announce server to global directory so anyone across the world can discover and join it!
      cloudRelay.publish('prochat/v1/servers/directory', {
        server: newServer,
      });

      set((state) => ({
        servers: updated,
        publicDirectory: [newServer, ...state.publicDirectory],
        activeServerId: newServer.id,
        activeChannelId: newServer.channels[0].id
      }));

      try {
        await api.post('/servers', { name: cleanName });
      } catch (err) {
        // Handled
      }

      return newServer;
    },

    joinServerByCode: async (rawCodeOrName: string) => {
      let code = rawCodeOrName.trim();
      
      // Extract code if user pasted a full URL
      try {
        if (code.includes('http://') || code.includes('https://') || code.includes('?join=') || code.includes('?invite=')) {
          const urlObj = new URL(code.startsWith('http') ? code : `https://${code}`);
          const paramCode = urlObj.searchParams.get('join') || urlObj.searchParams.get('invite');
          if (paramCode) {
            code = paramCode;
          } else {
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
              code = pathParts[pathParts.length - 1];
            }
          }
        }
      } catch (e) {
        // use raw
      }

      // Clean query string
      const cleanCode = code.trim().toUpperCase().replace(/^JOIN-/, '');
      const state = get();

      // 1. Check if user already joined this server
      const existingInUser = state.servers.find(
        s => s.inviteCode?.toUpperCase() === cleanCode || 
             s.name.toUpperCase() === cleanCode || 
             s.id.toUpperCase() === cleanCode
      );
      if (existingInUser) {
        set({
          activeServerId: existingInUser.id,
          activeChannelId: existingInUser.channels.length > 0 ? existingInUser.channels[0].id : null,
        });
        return existingInUser;
      }

      // 2. Check in public directory (servers created by others)
      const inDirectory = state.publicDirectory.find(
        s => s.inviteCode?.toUpperCase() === cleanCode || 
             s.name.toUpperCase() === cleanCode ||
             s.name.toUpperCase().includes(cleanCode) ||
             cleanCode.includes(s.name.toUpperCase())
      );

      const serverToJoin: Server = inDirectory || {
        id: 'joined-' + cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: cleanCode.includes('-') ? `Squad ${cleanCode}` : cleanCode,
        iconUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanCode)}`,
        inviteCode: cleanCode,
        channels: [
          { id: 'ch-gen-' + cleanCode.toLowerCase(), name: 'general', type: 'TEXT', serverId: 'joined-' + cleanCode.toLowerCase() },
          { id: 'ch-voice-' + cleanCode.toLowerCase(), name: 'General Voice', type: 'VOICE', serverId: 'joined-' + cleanCode.toLowerCase() },
        ]
      };

      const updated = [...state.servers, serverToJoin];
      localStorage.setItem('prochat_user_servers', JSON.stringify(updated));

      set({
        servers: updated,
        activeServerId: serverToJoin.id,
        activeChannelId: serverToJoin.channels[0].id,
      });


      try {
        await api.post('/servers/join', { inviteCode: cleanCode });
      } catch (err) {
        // Handled
      }

      return serverToJoin;
    },

    updateServer: async (serverId: string, data: { name?: string; iconUrl?: string }) => {
      let updated: any = null;
      set((state) => {
        const next = state.servers.map(s => {
          if (s.id === serverId) {
            updated = { ...s, ...data };
            return updated;
          }
          return s;
        });
        localStorage.setItem('prochat_user_servers', JSON.stringify(next));
        return { servers: next };
      });
      return updated;
    },

    deleteServer: async (serverId: string) => {
      set((state) => {
        const remaining = state.servers.filter(s => s.id !== serverId);
        localStorage.setItem('prochat_user_servers', JSON.stringify(remaining));
        return {
          servers: remaining,
          activeServerId: remaining.length > 0 ? remaining[0].id : null,
          activeChannelId: remaining.length > 0 && remaining[0].channels.length > 0 ? remaining[0].channels[0].id : null
        };
      });
    },

    createChannel: async (serverId: string, name: string, type = 'TEXT') => {
      const newChannel: Channel = {
        id: 'ch-' + Date.now(),
        name,
        type,
        serverId
      };
      set((state) => {
        const next = state.servers.map((server) => {
          if (server.id === serverId) {
            return {
              ...server,
              channels: [...server.channels, newChannel]
            };
          }
          return server;
        });
        localStorage.setItem('prochat_user_servers', JSON.stringify(next));
        return { servers: next, activeChannelId: newChannel.id };
      });
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
  };
});
