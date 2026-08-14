import React, { useEffect, useRef } from 'react';
import { Crown, Sparkles, Bot } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useServerStore } from '../../store/useServerStore';
import cloudRelay from '../../lib/cloudRelay';
import { SAM_BOT_USER } from '../../services/aiBotService';
import { create } from 'zustand';
import clsx from 'clsx';

// ── Presence store ──────────────────────────────────────────────
export interface PresenceMember {
  id: string;
  name: string;
  avatarUrl?: string;
  isBot?: boolean;
  lastSeen: number; // timestamp ms
  type?: 'HEARTBEAT' | 'LEAVE';
}

interface PresenceState {
  members: Record<string, PresenceMember>;
  upsertMember: (m: PresenceMember) => void;
  removeStaleMember: (id: string) => void;
  clearMembers: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  members: {},
  upsertMember: (m) => {
    if (!m || !m.id) return;
    if (m.type === 'LEAVE') {
      const next = { ...get().members };
      delete next[m.id];
      set({ members: next });
      return;
    }
    const cur = get().members;
    set({ members: { ...cur, [m.id]: { ...cur[m.id], ...m, lastSeen: Date.now() } } });
  },
  removeStaleMember: (id) => {
    const next = { ...get().members };
    delete next[id];
    set({ members: next });
  },
  clearMembers: () => {
    set({ members: {} });
  },
}));

interface MemberListProps {
  serverId: string;
}

const HEARTBEAT_INTERVAL = 2500; // heartbeat every 2.5s
const MEMBER_TIMEOUT = 6000;      // prune stale members after 6s of inactivity

export const MemberList: React.FC<MemberListProps> = () => {
  const { user: currentUser } = useAuthStore();
  const { peers } = useVoiceStore();
  const { servers, activeServerId } = useServerStore();
  const { members, upsertMember, removeStaleMember, clearMembers } = usePresenceStore();

  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];
  const inviteCode = (activeServer?.inviteCode || 'PRO-HD').toUpperCase().replace(/[^A-Z0-9]/g, '-');
  const presenceTopic = `prochat/v3/presence/${inviteCode}`;

  const currentTopicRef = useRef<string>(presenceTopic);
  currentTopicRef.current = presenceTopic;

  // Clear stale cached members whenever the active server or user changes
  useEffect(() => {
    clearMembers();
  }, [activeServerId, currentUser?.id, clearMembers]);

  // ── Publish Presence & Listen ──
  useEffect(() => {
    if (!currentUser || !presenceTopic) return;

    const me: PresenceMember = {
      id: currentUser.id,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      lastSeen: Date.now(),
      type: 'HEARTBEAT',
    };

    // Broadcast immediately on mount / topic switch
    cloudRelay.publish(presenceTopic, me);

    // Subscribe to presence
    const unsub = cloudRelay.subscribe(presenceTopic, (_, data: PresenceMember) => {
      if (data?.id) {
        if (data.id === currentUser.id) return;
        if (data.type === 'LEAVE') {
          removeStaleMember(data.id);
          return;
        }
        upsertMember(data);
      }
    });

    // Heartbeat timer
    const heartbeat = setInterval(() => {
      cloudRelay.publish(presenceTopic, {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        lastSeen: Date.now(),
        type: 'HEARTBEAT',
      });
    }, HEARTBEAT_INTERVAL);

    // Fast prune timer - removes offline / logged-out users in real time
    const prune = setInterval(() => {
      const now = Date.now();
      const currentList = usePresenceStore.getState().members;
      Object.values(currentList).forEach(m => {
        if (now - m.lastSeen > MEMBER_TIMEOUT) {
          removeStaleMember(m.id);
        }
      });
    }, 2000);

    return () => {
      // Publish leave notification on unmount so peers remove us instantly
      cloudRelay.publish(presenceTopic, {
        id: currentUser.id,
        name: currentUser.name,
        type: 'LEAVE',
        lastSeen: Date.now(),
      });
      unsub();
      clearInterval(heartbeat);
      clearInterval(prune);
    };
  }, [presenceTopic, currentUser?.id, currentUser?.name, currentUser?.avatarUrl, upsertMember, removeStaleMember]);

  // ── Build clean, live member list ──
  const voicePeersList = Object.values(peers).filter(p => !p.isYou);
  const now = Date.now();
  const onlineOthers = Object.values(members).filter(
    m => m.id !== currentUser?.id && (now - m.lastSeen <= MEMBER_TIMEOUT)
  );

  // Me as first entry
  const me = {
    id: currentUser?.id || 'usr-me',
    name: currentUser?.name || 'You',
    avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.name || 'You'}&backgroundColor=fbbf24`,
    isYou: true,
  };

  // Bot Assistant entry
  const samBot = {
    id: SAM_BOT_USER.id,
    name: SAM_BOT_USER.name,
    avatarUrl: SAM_BOT_USER.avatarUrl,
    isBot: true,
    isYou: false,
  };

  // Everyone in this server (me + online others + bot + voice peers)
  const allIds = new Set<string>([me.id, samBot.id, ...onlineOthers.map(m => m.id), ...voicePeersList.map(p => p.id)]);
  const allMembers = Array.from(allIds).map(id => {
    if (id === me.id) return me;
    if (id === samBot.id) return samBot;
    const peer = voicePeersList.find(p => p.id === id);
    if (peer) return { ...peer, isYou: false };
    const presenceMember = onlineOthers.find(m => m.id === id);
    if (presenceMember) return { ...presenceMember, isYou: false };
    return null;
  }).filter(Boolean) as Array<{ id: string; name: string; avatarUrl?: string; isYou?: boolean; isBot?: boolean }>;

  return (
    <div className="w-60 bg-[#080A0F] border-l border-[#141A28] h-full flex flex-col p-4 select-none shrink-0 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>MEMBERS — {allMembers.length}</span>
      </div>

      <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-2">
        ONLINE — {allMembers.length}
      </div>

      {/* Members List */}
      <div className="space-y-1">
        {allMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center space-x-2.5 p-2 rounded-2xl hover:bg-[#121624] transition-colors cursor-pointer group"
          >
            {/* Avatar with Online indicator */}
            <div className="relative shrink-0">
              <img
                src={member.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.name}&backgroundColor=38bdf8`}
                alt={member.name}
                className={clsx(
                  "w-9 h-9 rounded-2xl object-cover shadow-sm",
                  member.isBot ? "border-2 border-cyan-400 shadow-cyan-500/20" : "border border-white/10"
                )}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#080A0F]" />
            </div>

            {/* Member Details */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                  {member.name}
                </span>

                {member.isYou && (
                  <span className="text-[9px] font-black text-pink-400 bg-pink-500/10 px-1 py-0.2 rounded uppercase">
                    YOU
                  </span>
                )}

                {member.isBot && (
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-0.5">
                    <Bot size={10} />
                    <span>BOT</span>
                  </span>
                )}
              </div>

              <span className="text-[10px] text-gray-500 group-hover:text-gray-400 truncate">
                {member.isBot ? 'ProChat Assistant' : 'Online'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemberList;
