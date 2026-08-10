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
      { id: 'ch-ai-bot', name: '🤖-sam-ai-assistant', type: 'TEXT', serverId: 'pro-chat-hq' },
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
      { id: 'ch-gaming-ai', name: '🤖-gaming-bot', type: 'TEXT', serverId: 'gaming-zone' },
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
      { id: 'ch-anime-ai', name: '🤖-sam-assistant', type: 'TEXT', serverId: 'anime-lounge' },
      { id: 'ch-anime-voice', name: 'Watch Party', type: 'VOICE', serverId: 'anime-lounge' },
    ]
  }
];

function getCleanServers(): Server[] {
  try {
    const stored = localStorage.getItem('prochat_user_servers');
    if (!stored) return DEFAULT_SERVERS;
    const parsed: Server[] = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SERVERS;

    const seen = new Set<string>();
    const cleanList: Server[] = [];

    for (const s of parsed) {
      if (!s || !s.id) continue;
      const key = s.id.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        // Ensure valid channels
        if (!s.channels || s.channels.length === 0) {
          s.channels = [
            { id: 'ch-gen-' + s.id, name: 'general', type: 'TEXT', serverId: s.id },
            { id: 'ch-voice-' + s.id, name: 'General Voice', type: 'VOICE', serverId: s.id },
          ];
        }
        cleanList.push(s);
      }
    }

    // If too many corrupted duplicates accumulated in old localStorage, keep clean default + joined
    return cleanList.length > 0 ? cleanList.slice(0, 6) : DEFAULT_SERVERS;
  } catch {
    return DEFAULT_SERVERS;
  }
}

export const useServerStore = create<ServerState>((set, get) => {
  const savedServers = getCleanServers();

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
      const cleanName = name.trim() || 'New Gaming Server';
      const serverId = 'srv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      const code = cleanName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'PRO') + '-' + Math.floor(1000 + Math.random() * 9000);
      
      const newServer: Server = {
        id: serverId,
        name: cleanName,
        iconUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`,
        inviteCode: code,
        channels: [
          { id: 'ch-gen-' + serverId, name: 'general', type: 'TEXT', serverId },
          { id: 'ch-ai-' + serverId, name: '🤖-sam-ai', type: 'TEXT', serverId },
          { id: 'ch-voice-' + serverId, name: 'General Voice', type: 'VOICE', serverId },
        ]
      };

      const updated = [newServer, ...get().servers];
      const cleanUpdated = getCleanServers();
      localStorage.setItem('prochat_user_servers', JSON.stringify([newServer, ...cleanUpdated]));

      // Announce server to global directory
      cloudRelay.publish('prochat/v1/servers/directory', {
        server: newServer,
      });

      set((state) => ({
        servers: [newServer, ...state.servers.filter(s => s.id !== newServer.id)],
        publicDirectory: [newServer, ...state.publicDirectory],
        activeServerId: newServer.id,
        activeChannelId: newServer.channels[0].id
      }));

      try {
        await api.post('/servers', { name: cleanName });
      } catch (err) {}

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
      } catch (e) {}

      const cleanCode = code.trim().toUpperCase().replace(/^JOIN-/, '');
      const state = get();

      // 1. Check if user already has this server
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

      // 2. Check in public directory
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
          { id: 'ch-ai-' + cleanCode.toLowerCase(), name: '🤖-sam-ai', type: 'TEXT', serverId: 'joined-' + cleanCode.toLowerCase() },
          { id: 'ch-voice-' + cleanCode.toLowerCase(), name: 'General Voice', type: 'VOICE', serverId: 'joined-' + cleanCode.toLowerCase() },
        ]
      };

      const updated = [...state.servers.filter(s => s.id !== serverToJoin.id), serverToJoin];
      localStorage.setItem('prochat_user_servers', JSON.stringify(updated));

      set({
        servers: updated,
        activeServerId: serverToJoin.id,
        activeChannelId: serverToJoin.channels[0]?.id || null,
      });

      return serverToJoin;
    },

    updateServer: async (serverId: string, data: { name?: string; iconUrl?: string }) => {
      const state = get();
      const updated = state.servers.map(s => {
        if (s.id === serverId) {
          return {
            ...s,
            name: data.name || s.name,
            iconUrl: data.iconUrl || s.iconUrl,
          };
        }
        return s;
      });

      localStorage.setItem('prochat_user_servers', JSON.stringify(updated));
      set({ servers: updated });
      return updated.find(s => s.id === serverId)!;
    },

    deleteServer: async (serverId: string) => {
      const current = get().servers;
      const filtered = current.filter(s => s.id !== serverId);
      const nextList = filtered.length > 0 ? filtered : DEFAULT_SERVERS;
      localStorage.setItem('prochat_user_servers', JSON.stringify(nextList));
      set({
        servers: nextList,
        activeServerId: nextList[0]?.id || 'pro-chat-hq',
        activeChannelId: nextList[0]?.channels[0]?.id || 'ch-general',
      });
    },

    createChannel: async (serverId: string, name: string, type: string = 'TEXT') => {
      const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
      const channelId = 'ch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
      
      const newChannel: Channel = {
        id: channelId,
        name: cleanName,
        type,
        serverId
      };

      const state = get();
      const updated = state.servers.map(s => {
        if (s.id === serverId) {
          return {
            ...s,
            channels: [...s.channels, newChannel]
          };
        }
        return s;
      });

      localStorage.setItem('prochat_user_servers', JSON.stringify(updated));
      set({
        servers: updated,
        activeChannelId: channelId
      });

      try {
        await api.post(`/channels/${serverId}`, { name: cleanName, type });
      } catch (err) {}
    },

    setActiveServer: (id: string) => {
      const state = get();
      const target = state.servers.find(s => s.id === id);
      set({
        activeServerId: id,
        activeChannelId: target?.channels[0]?.id || 'ch-general'
      });
    },

    setActiveChannel: (id: string) => {
      set({ activeChannelId: id });
    }
  };
});
