import React, { useEffect, useRef } from 'react';
import { Crown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import { useServerStore } from '../../store/useServerStore';
import cloudRelay from '../../lib/cloudRelay';
import { create } from 'zustand';
import clsx from 'clsx';

// ── Presence store ──────────────────────────────────────────────
interface PresenceMember {
  id: string;
  name: string;
  avatarUrl?: string;
  lastSeen: number; // timestamp ms
}

interface PresenceState {
  members: Record<string, PresenceMember>;
  upsertMember: (m: PresenceMember) => void;
  removeStaleMember: (id: string) => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  members: {},
  upsertMember: (m) => set({ members: { ...get().members, [m.id]: m } }),
  removeStaleMember: (id) => {
    const next = { ...get().members };
    delete next[id];
    set({ members: next });
  },
}));

// ── MemberList Component ────────────────────────────────────────
interface MemberListProps {
  serverId: string;
}

const HEARTBEAT_INTERVAL = 10000; // every 10s
const MEMBER_TIMEOUT = 25000;     // remove if silent for 25s

export const MemberList: React.FC<MemberListProps> = () => {
  const { user: currentUser } = useAuthStore();
  const { peers } = useVoiceStore();
  const { servers, activeServerId } = useServerStore();
  const { members, upsertMember, removeStaleMember } = usePresenceStore();

  const activeServer = servers.find(s => s.id === activeServerId);
  const inviteCode = activeServer?.inviteCode?.toUpperCase();
  const presenceTopic = inviteCode ? `prochat/v1/presence/${inviteCode}` : null;

  // ── Publish MY presence heartbeat ──
  useEffect(() => {
    if (!currentUser || !presenceTopic) return;

    const me: PresenceMember = {
      id: currentUser.id,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      lastSeen: Date.now(),
    };

    // Announce immediately on join
    cloudRelay.publish(presenceTopic, me);

    // Heartbeat every 10s
    const heartbeat = setInterval(() => {
      cloudRelay.publish(presenceTopic, { ...me, lastSeen: Date.now() });
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(heartbeat);
  }, [currentUser, presenceTopic]);

  // ── Subscribe to others' presence ──
  useEffect(() => {
    if (!presenceTopic) return;

    const unsub = cloudRelay.subscribe(presenceTopic, (_, data: PresenceMember) => {
      if (data?.id && data.id !== currentUser?.id) {
        upsertMember({ ...data, lastSeen: Date.now() });
      }
    });

    // Cleanup stale members every 15s
    const staleCheck = setInterval(() => {
      const now = Date.now();
      Object.values(usePresenceStore.getState().members).forEach(m => {
        if (now - m.lastSeen > MEMBER_TIMEOUT) {
          removeStaleMember(m.id);
        }
      });
    }, 15000);

    return () => {
      unsub();
      clearInterval(staleCheck);
    };
  }, [presenceTopic, currentUser?.id]);

  // ── Build final member list ──
  const voicePeersList = Object.values(peers);
  const onlineOthers = Object.values(members);

  // Me as first entry
  const me = {
    id: currentUser?.id || 'usr-me',
    name: currentUser?.name || 'You',
    avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.name || 'You'}&backgroundColor=fbbf24`,
    isYou: true,
  };

  // Everyone in this server (me + online others via presence + voice peers)
  const allIds = new Set<string>([me.id, ...onlineOthers.map(m => m.id), ...voicePeersList.map(p => p.id)]);
  const allMembers = Array.from(allIds).map(id => {
    if (id === me.id) return me;
    const peer = voicePeersList.find(p => p.id === id);
    if (peer) return { ...peer, isYou: false };
    const presenceMember = onlineOthers.find(m => m.id === id);
    if (presenceMember) return { ...presenceMember, isYou: false };
    return null;
  }).filter(Boolean) as Array<{ id: string; name: string; avatarUrl?: string; isYou: boolean }>;

  return (
    <div className="w-60 bg-[#0B0E14] flex flex-col h-full shrink-0 p-4 overflow-y-auto custom-scrollbar border-l border-[#181D2A] select-none">
      {/* Header */}
      <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-3 px-1">
        MEMBERS — {allMembers.length}
      </div>

      {/* Online Section */}
      <div className="mb-4">
        <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-2 px-1">
          ONLINE — {allMembers.length}
        </div>

        <div className="space-y-1">
          {allMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center px-2 py-1.5 rounded-xl hover:bg-[#141926] cursor-pointer group transition-all animate-fade-in"
            >
              {/* Avatar with Green dot */}
              <div className="relative shrink-0">
                <img
                  src={member.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.name}`}
                  alt={member.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B0E14]" />
              </div>

              {/* Name */}
              <div className="ml-2.5 flex-1 truncate flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 transition-colors truncate">
                    {member.name}
                  </span>
                  {member.isYou && (
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 font-bold px-1.5 rounded shrink-0">YOU</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemberList;
