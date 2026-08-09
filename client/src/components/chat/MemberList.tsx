import React from 'react';
import { Crown } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useVoiceStore } from '../../store/useVoiceStore';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

interface MemberListProps {
  serverId: string;
}

export const MemberList: React.FC<MemberListProps> = () => {
  const { user: currentUser } = useAuthStore();
  const { peers } = useVoiceStore();

  const voicePeersList = Object.values(peers);

  // If peers exist in voice channel, show active connected peers; otherwise show current logged-in user
  const activeMembers = voicePeersList.length > 0
    ? voicePeersList
    : [
        {
          id: currentUser?.id || 'usr-me',
          name: currentUser?.name || 'shivam',
          avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.name || 'shivam'}&backgroundColor=fbbf24`,
          isYou: true,
        }
      ];

  return (
    <div className="w-60 bg-[#0B0E14] flex flex-col h-full shrink-0 p-4 overflow-y-auto custom-scrollbar border-l border-[#181D2A] select-none">
      {/* Top Header */}
      <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-3 px-1">
        MEMBERS — {activeMembers.length}
      </div>

      {/* ONLINE Section */}
      <div className="mb-4">
        <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-2 px-1">
          ONLINE — {activeMembers.length}
        </div>

        <div className="space-y-1">
          {activeMembers.map((member) => (
            <div 
              key={member.id}
              className="flex items-center px-2 py-1.5 rounded-xl hover:bg-[#141926] cursor-pointer group transition-all animate-fade-in"
            >
              {/* Avatar with Online Green Dot */}
              <div className="relative shrink-0">
                <img 
                  src={member.avatarUrl} 
                  alt={member.name} 
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B0E14]" />
              </div>

              {/* Name & Owner Crown */}
              <div className="ml-2.5 flex-1 truncate flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 transition-colors truncate">
                    {member.name}
                  </span>
                  {member.isYou && (
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 font-bold px-1.5 py-0.2 rounded">YOU</span>
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
