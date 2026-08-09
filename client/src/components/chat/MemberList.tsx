import React, { useEffect, useState } from 'react';
import { Crown, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import NitroBadge from '../ui/NitroBadge';

interface Member {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    status: string;
    isNitro?: boolean;
    nitroTier?: 'classic' | 'nitro';
  };
}

interface MemberListProps {
  serverId: string;
}

export const MemberList: React.FC<MemberListProps> = ({ serverId }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const { user: currentUser } = useAuthStore();
  const { isNitro, nitroTier } = useNitroStore();

  const DEFAULT_MEMBERS: Member[] = [
    {
      id: 'mem-admin',
      role: 'OWNER',
      user: {
        id: 'bot-admin',
        name: 'ProChat System',
        email: 'system@prochat.io',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ProChatBot',
        status: 'ONLINE',
        isNitro: true,
        nitroTier: 'nitro',
      }
    },
    {
      id: 'mem-mod',
      role: 'MEMBER',
      user: {
        id: 'bot-mod',
        name: 'Neon Moderator',
        email: 'mod@prochat.io',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonGamer',
        status: 'ONLINE',
        isNitro: true,
        nitroTier: 'classic',
      }
    }
  ];

  useEffect(() => {
    if (!serverId) return;
    const fetchMembers = async () => {
      try {
        const res = await api.get(`/servers/${serverId}/members`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setMembers(res.data);
        } else {
          setMembers(DEFAULT_MEMBERS);
        }
      } catch (err) {
        setMembers(DEFAULT_MEMBERS);
      }
    };
    fetchMembers();
  }, [serverId]);

  const allDisplayMembers = members.length > 0 ? members : DEFAULT_MEMBERS;
  const onlineMembers = allDisplayMembers.filter(m => m.user.status !== 'OFFLINE' || m.user.id === currentUser?.id);
  const offlineMembers = allDisplayMembers.filter(m => m.user.status === 'OFFLINE' && m.user.id !== currentUser?.id);


  return (
    <div className="w-60 bg-[#090A0D] flex flex-col h-full shrink-0 p-3 overflow-y-auto custom-scrollbar border-l border-[#171920]">
      {/* Online Section */}
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-wider text-yellow-400/80 mb-2.5 px-1">
          Online — {onlineMembers.length || 1}
        </div>
        <div className="space-y-1">
          {onlineMembers.length > 0 ? (
            onlineMembers.map((member) => (
              <div 
                key={member.id}
                className="flex items-center px-2.5 py-2 rounded-xl hover:bg-[#161820] cursor-pointer group transition-all"
              >
                <div className="relative">
                  {member.user.avatarUrl ? (
                    <img 
                      src={member.user.avatarUrl} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-yellow-400 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-extrabold text-xs shadow-md border border-yellow-300">
                      {member.user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full border-2 border-[#090A0D]" />
                </div>
                <div className="ml-3 flex-1 truncate">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-white truncate group-hover:text-yellow-400 transition-colors">{member.user.name}</span>
                    {((member.user.id === currentUser?.id && isNitro) || member.user.isNitro) && (
                      <NitroBadge tier={(member.user.id === currentUser?.id ? nitroTier : member.user.nitroTier) || 'nitro'} size="sm" />
                    )}
                    {member.role === 'ADMIN' && (
                      <Crown size={14} className="text-yellow-400 ml-1 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    {member.role === 'ADMIN' ? 'Server Admin' : 'Member'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center px-2.5 py-2 rounded-xl">
              {currentUser?.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-yellow-400 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-extrabold text-xs shadow-md border border-yellow-300">
                  {currentUser?.name?.substring(0, 2).toUpperCase() || 'GU'}
                </div>
              )}
              <div className="ml-3">
                <div className="text-sm font-bold text-white flex items-center gap-1">
                  <span>{currentUser?.name}</span>
                  {isNitro && <NitroBadge tier={nitroTier} size="sm" />}
                </div>
                <div className="text-[11px] text-yellow-400 font-medium">Online</div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Offline Section */}
      {offlineMembers.length > 0 && (
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-gray-600 mb-2.5 px-1">
            Offline — {offlineMembers.length}
          </div>
          <div className="space-y-1 opacity-50">
            {offlineMembers.map((member) => (
              <div 
                key={member.id}
                className="flex items-center px-2.5 py-2 rounded-xl hover:bg-[#161820] cursor-pointer group transition-all"
              >
                <div className="relative">
                  {member.user.avatarUrl ? (
                    <img 
                      src={member.user.avatarUrl} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-xs">
                      {member.user.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-600 rounded-full border-2 border-[#090A0D]" />
                </div>
                <div className="ml-3 flex-1 truncate">
                  <span className="text-sm font-medium text-gray-400 truncate">{member.user.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
