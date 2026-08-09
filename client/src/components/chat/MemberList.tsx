import React from 'react';
import { Crown, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

interface MemberListProps {
  serverId: string;
}

export const MemberList: React.FC<MemberListProps> = () => {
  const { user: currentUser } = useAuthStore();
  const { isNitro, nitroTier } = useNitroStore();

  const membersList = [
    {
      id: 'mem-wanzx',
      name: 'wanzxplays',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=wanzxplays&backgroundColor=38bdf8',
      status: 'ONLINE',
      role: 'OWNER',
      isOwner: true,
      color: '#38BDF8',
    },
    {
      id: 'mem-kartik',
      name: 'kartikrawat',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=kartikrawat&backgroundColor=a855f7',
      status: 'ONLINE',
      role: 'MEMBER',
      color: '#A855F7',
    },
    {
      id: currentUser?.id || 'mem-shivam',
      name: currentUser?.name || 'shivam',
      avatarUrl: currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=shivam&backgroundColor=fbbf24',
      status: 'ONLINE',
      role: 'MEMBER',
      color: '#F59E0B',
    }
  ];

  return (
    <div className="w-60 bg-[#0B0E14] flex flex-col h-full shrink-0 p-4 overflow-y-auto custom-scrollbar border-l border-[#181D2A] select-none">
      {/* Top Header: MEMBERS — 3 */}
      <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-3 px-1">
        MEMBERS — {membersList.length}
      </div>

      {/* ONLINE Section */}
      <div className="mb-4">
        <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-2 px-1">
          ONLINE — {membersList.length}
        </div>

        <div className="space-y-1">
          {membersList.map((member) => (
            <div 
              key={member.id}
              className="flex items-center px-2 py-1.5 rounded-xl hover:bg-[#141926] cursor-pointer group transition-all"
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
                  {member.isOwner && (
                    <Crown size={13} className="text-amber-400 fill-amber-400 shrink-0 ml-0.5" />
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
