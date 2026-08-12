import { create } from 'zustand';
import api from '../lib/api';
import cloudRelay from '../lib/cloudRelay';
import { registerServerCodeGetter } from './useMessageStore';

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
  resetToSingleOfficialServer: () => void;
}

export const OFFICIAL_PROCHAT_SERVER: Server = {
  id: 'pro-chat-hq',
  name: 'Pro Chat HQ',
  iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ProChat',
  inviteCode: 'PRO-HD',
  channels: [
    { id: 'ch-general', name: 'general', type: 'TEXT', serverId: 'pro-chat-hq' },
    { id: 'ch-ai-bot', name: '🤖-sam-ai-assistant', type: 'TEXT', serverId: 'pro-chat-hq' },
    { id: 'ch-lounge', name: 'lounge', type: 'TEXT', serverId: 'pro-chat-hq' },
    { id: 'ch-voice-1', name: 'General Voice', type: 'VOICE', serverId: 'pro-chat-hq' },
  ]
};

const INITIAL_PUBLIC_SERVERS: Server[] = [
  OFFICIAL_PROCHAT_SERVER,
  {
    id: 'srv-gaming-hub',
    name: 'Gaming Hub Guild',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GamingHub',
    inviteCode: 'GAME-7799',
    channels: [
      { id: 'ch-gen-game', name: 'general', type: 'TEXT', serverId: 'srv-gaming-hub' },
      { id: 'ch-ai-game', name: '🤖-gaming-bot', type: 'TEXT', serverId: 'srv-gaming-hub' },
      { id: 'ch-voice-game', name: 'Squad Voice', type: 'VOICE', serverId: 'srv-gaming-hub' },
    ]
  },
  {
    id: 'srv-anime-realm',
    name: 'Anime & Manga Lounge',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AnimeRealm',
    inviteCode: 'ANIME-101',
    channels: [
      { id: 'ch-gen-anime', name: 'general', type: 'TEXT', serverId: 'srv-anime-realm' },
      { id: 'ch-ai-anime', name: '🤖-sam-assistant', type: 'TEXT', serverId: 'srv-anime-realm' },
      { id: 'ch-voice-anime', name: 'Watch Party', type: 'VOICE', serverId: 'srv-anime-realm' },
    ]
  }
];

function getCleanServers(): Server[] {
  try {
    const stored = localStorage.getItem('prochat_user_servers');
    if (!stored) {
      localStorage.setItem('prochat_user_servers', JSON.stringify([OFFICIAL_PROCHAT_SERVER]));
      return [OFFICIAL_PROCHAT_SERVER];
    }
    const parsed: Server[] = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('prochat_user_servers', JSON.stringify([OFFICIAL_PROCHAT_SERVER]));
      return [OFFICIAL_PROCHAT_SERVER];
    }

    const seen = new Set<string>();
    const cleanList: Server[] = [];

    // Ensure official Pro Chat HQ is included
    cleanList.push(OFFICIAL_PROCHAT_SERVER);
    seen.add(OFFICIAL_PROCHAT_SERVER.id);

    for (const s of parsed) {
      if (!s || !s.id) continue;
      const key = s.id.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        if (!s.channels || s.channels.length === 0) {
          s.channels = [
            { id: 'ch-gen-' + s.id, name: 'general', type: 'TEXT', serverId: s.id },
            { id: 'ch-voice-' + s.id, name: 'General Voice', type: 'VOICE', serverId: s.id },
          ];
        }
        cleanList.push(s);
      }
    }

    return cleanList;
  } catch {
    return [OFFICIAL_PROCHAT_SERVER];
  }
}

export const useServerStore = create<ServerState>((set, get) => {
  const savedServers = getCleanServers();

  // Register getter for active invite code
  registerServerCodeGetter(() => {
    const { servers, activeServerId } = get();
    const server = servers.find(s => s.id === activeServerId);
    return server?.inviteCode || 'PRO-HD';
  });

  // Listen for global public server announcements over cloud relay
  if (typeof window !== 'undefined') {
    cloudRelay.subscribe('prochat/v1/servers/directory', (_, data) => {
      if (data && data.server) {
        const incoming: Server = data.server;
        const cur = get().publicDirectory;
        if (!cur.find(s => s.id === incoming.id || s.inviteCode?.toUpperCase() === incoming.inviteCode?.toUpperCase())) {
          set({ publicDirectory: [incoming, ...cur] });
        }
      }
    });
  }

  return {
    servers: savedServers,
    publicDirectory: INITIAL_PUBLIC_SERVERS,
    activeServerId: savedServers[0]?.id || 'pro-chat-hq',
    activeChannelId: savedServers[0]?.channels[0]?.id || 'ch-general',
    isLoading: false,
    error: null,

    fetchServers: async () => {
      const clean = getCleanServers();
      const currentActiveId = get().activeServerId;
      const targetActive = clean.find(s => s.id === currentActiveId) ? currentActiveId : clean[0].id;
      const activeObj = clean.find(s => s.id === targetActive) || clean[0];
      const currentChId = get().activeChannelId;
      const targetCh = activeObj.channels.find(c => c.id === currentChId) ? currentChId : activeObj.channels[0]?.id || 'ch-general';

      set({ 
        servers: clean, 
        isLoading: false,
        activeServerId: targetActive,
        activeChannelId: targetCh,
      });
    },

    resetToSingleOfficialServer: () => {
      localStorage.setItem('prochat_user_servers', JSON.stringify([OFFICIAL_PROCHAT_SERVER]));
      set({
        servers: [OFFICIAL_PROCHAT_SERVER],
        activeServerId: OFFICIAL_PROCHAT_SERVER.id,
        activeChannelId: OFFICIAL_PROCHAT_SERVER.channels[0].id,
      });
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

      const cleanUpdated = getCleanServers().filter(s => s.id !== newServer.id);
      const updated = [...cleanUpdated, newServer];
      localStorage.setItem('prochat_user_servers', JSON.stringify(updated));

      cloudRelay.publish('prochat/v1/servers/directory', { server: newServer });

      set({
        servers: updated,
        activeServerId: newServer.id,
        activeChannelId: newServer.channels[0].id,
        publicDirectory: [newServer, ...get().publicDirectory]
      });

      try {
        await api.post('/servers', { name: cleanName });
      } catch (err) {}

      return newServer;
    },

    joinServerByCode: async (rawCodeOrName: string) => {
      let code = rawCodeOrName.trim();
      
      // Extract query param or path code
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

      const cleanCode = code.trim().toUpperCase().replace(/[\s_]+/g, '-').replace(/^JOIN-/, '');
      const state = get();

      // Normalize all aliases for the main server: PRO-HD, PRO-HQ, PROHD, PROHQ
      const isOfficialAlias = 
        cleanCode === 'PRO-HD' || 
        cleanCode === 'PRO-HQ' || 
        cleanCode === 'PROHD' || 
        cleanCode === 'PROHQ' || 
        cleanCode === 'PRO-HD-8821' || 
        cleanCode === 'PRO-HQ-8821' ||
        cleanCode === 'PROCHAT' ||
        cleanCode === 'PRO CHAT HQ';

      if (isOfficialAlias) {
        set({
          activeServerId: OFFICIAL_PROCHAT_SERVER.id,
          activeChannelId: OFFICIAL_PROCHAT_SERVER.channels[0].id,
        });
        return OFFICIAL_PROCHAT_SERVER;
      }

      // Check in public directory first to get canonical name & icon
      const inDirectory = state.publicDirectory.find(
        s => s.inviteCode?.toUpperCase() === cleanCode || 
             s.name.toUpperCase() === cleanCode ||
             s.id.toUpperCase() === cleanCode
      );

      // Check existing user servers
      const existingInUser = state.servers.find(
        s => s.inviteCode?.toUpperCase() === cleanCode || 
             s.name.toUpperCase() === cleanCode || 
             s.id.toUpperCase() === cleanCode
      );
      if (existingInUser) {
        set({
          activeServerId: existingInUser.id,
          activeChannelId: existingInUser.channels[0]?.id || null,
        });
        return existingInUser;
      }

      // Join new server
      const serverToJoin: Server = inDirectory || {
        id: 'srv-' + cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: cleanCode.includes('-') ? `Squad ${cleanCode}` : cleanCode,
        iconUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanCode)}`,
        inviteCode: cleanCode,
        channels: [
          { id: 'ch-gen-' + cleanCode.toLowerCase(), name: 'general', type: 'TEXT', serverId: 'srv-' + cleanCode.toLowerCase() },
          { id: 'ch-ai-' + cleanCode.toLowerCase(), name: '🤖-sam-ai', type: 'TEXT', serverId: 'srv-' + cleanCode.toLowerCase() },
          { id: 'ch-voice-' + cleanCode.toLowerCase(), name: 'General Voice', type: 'VOICE', serverId: 'srv-' + cleanCode.toLowerCase() },
        ]
      };

      const updated = [...state.servers.filter(s => s.id !== serverToJoin.id), serverToJoin];
      localStorage.setItem('prochat_user_servers', JSON.stringify(updated));

      // Broadcast so everyone's public directory has it
      cloudRelay.publish('prochat/v1/servers/directory', { server: serverToJoin });

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
      const nextList = filtered.length > 0 ? filtered : [OFFICIAL_PROCHAT_SERVER];
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
