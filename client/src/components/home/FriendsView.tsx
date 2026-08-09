import React, { useState } from 'react';
import { Users, UserPlus, MessageSquare, Phone, Video, Search, Sparkles, Zap, Shield, Volume2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import NitroBadge from '../ui/NitroBadge';
import { NitroModal } from '../modals/NitroModal';

import DiscordNotificationBadge from '../ui/DiscordNotificationBadge';
import clsx from 'clsx';

interface Friend {
  id: string;
  name: string;
  avatarUrl: string;
  status: 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';
  customStatus?: string;
  activity?: {
    type: 'PLAYING' | 'STREAMING' | 'LISTENING';
    name: string;
    details?: string;
  };
  isNitro?: boolean;
  nitroTier?: 'classic' | 'nitro';
  unreadCount?: number;
}

const MOCK_FRIENDS: Friend[] = [
  {
    id: 'fr-1',
    name: 'CyberNinja',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja',
    status: 'ONLINE',
    customStatus: 'Grinding Rank #1 in Valorant 🏆',
    activity: { type: 'PLAYING', name: 'Valorant', details: 'Competitive - Ascendant III' },
    isNitro: true,
    nitroTier: 'nitro',
    unreadCount: 4,
  },
  {
    id: 'fr-2',
    name: 'NeonAura',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonAura',
    status: 'ONLINE',
    customStatus: 'Streaming 1080p 60fps HD with Pro Nitro ⚡',
    activity: { type: 'STREAMING', name: 'Cyberpunk 2077', details: 'Ultra RTX ON' },
    isNitro: true,
    nitroTier: 'nitro',
    unreadCount: 9,
  },
  {
    id: 'fr-3',
    name: 'GlitchMaster',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=GlitchMaster',
    status: 'IDLE',
    customStatus: 'AFK eating pizza 🍕',
    activity: { type: 'LISTENING', name: 'Synthwave Beats', details: 'Spotify' },
    isNitro: true,
    nitroTier: 'classic',
  },
  {
    id: 'fr-4',
    name: 'ShadowBlade',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowBlade',
    status: 'DND',
    customStatus: 'Do Not Disturb - Coding Discord Clone 💻',
  },
  {
    id: 'fr-5',
    name: 'PixelQueen',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=PixelQueen',
    status: 'OFFLINE',
  },
];

export const FriendsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'blocked' | 'add'>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  const { user } = useAuthStore();
  const { isNitro, nitroTier } = useNitroStore();

  const filteredFriends = MOCK_FRIENDS.filter((friend) => {
    if (activeTab === 'online') return friend.status !== 'OFFLINE';
    return true;
  }).filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D0E12] overflow-hidden">
      {/* Top Discord Friends Header Bar */}
      <div className="h-12 border-b border-[#171920] px-4 flex items-center justify-between shrink-0 bg-[#090A0D]">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-white font-extrabold text-sm mr-2">
            <Users size={18} className="text-yellow-400 mr-2" />
            <span>Friends</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('online')}
              className={clsx(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                activeTab === 'online'
                  ? "bg-yellow-400 text-black shadow-md shadow-yellow-400/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              Online ({MOCK_FRIENDS.filter(f => f.status !== 'OFFLINE').length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={clsx(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                activeTab === 'all'
                  ? "bg-yellow-400 text-black shadow-md shadow-yellow-400/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              All ({MOCK_FRIENDS.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={clsx(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                activeTab === 'pending'
                  ? "bg-yellow-400 text-black shadow-md shadow-yellow-400/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span>Pending</span>
              <DiscordNotificationBadge count={2} size="sm" variant="red" />
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={clsx(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer font-extrabold flex items-center gap-1",
                activeTab === 'add'
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
              )}
            >
              <UserPlus size={14} />
              <span>Add Friend</span>
            </button>
          </div>
        </div>

        {/* Right Action / Nitro Perk Banner */}
        <button
          onClick={() => setIsNitroModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-yellow-400/20 transition-all hover:scale-105 cursor-pointer"
        >
          <Sparkles size={14} className="fill-black" />
          <span>Nitro Perks</span>
        </button>
      </div>

      {/* Friends Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Friends List */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          {/* Search bar */}
          <div className="relative mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full bg-[#121418] border border-white/5 focus:border-yellow-400 rounded-xl px-4 py-2.5 pl-10 text-xs text-white outline-none transition-all placeholder-gray-500"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          </div>

          <div className="text-[11px] font-black uppercase tracking-wider text-yellow-400/80 mb-3 px-1">
            {activeTab.toUpperCase()} — {filteredFriends.length}
          </div>

          {/* Friends Rows */}
          <div className="space-y-2">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#121418]/60 hover:bg-[#161820] border border-white/5 hover:border-yellow-400/30 transition-all group shadow-sm hover:scale-[1.005]"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="relative shrink-0">
                    <img
                      src={friend.avatarUrl}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    {/* Status Dot */}
                    <div
                      className={clsx(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0D0E12]",
                        friend.status === 'ONLINE' && "bg-emerald-500",
                        friend.status === 'IDLE' && "bg-amber-400",
                        friend.status === 'DND' && "bg-rose-500",
                        friend.status === 'OFFLINE' && "bg-gray-500"
                      )}
                    />
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-white text-sm group-hover:text-yellow-400 transition-colors">
                        {friend.name}
                      </span>
                      {friend.isNitro && <NitroBadge tier={friend.nitroTier || 'nitro'} size="sm" />}
                    </div>

                    <div className="text-xs text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                      {friend.activity ? (
                        <span className="text-yellow-400/90 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping inline-block" />
                          {friend.activity.type === 'PLAYING' && '🎮 Playing '}
                          {friend.activity.type === 'STREAMING' && '📡 Streaming '}
                          {friend.activity.type === 'LISTENING' && '🎵 Listening to '}
                          {friend.activity.name}
                        </span>
                      ) : (
                        <span>{friend.customStatus || (friend.status === 'ONLINE' ? 'Online' : 'Offline')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Friend Quick Actions & Badges */}
                <div className="flex items-center space-x-2">
                  {friend.unreadCount && (
                    <DiscordNotificationBadge count={friend.unreadCount} size="md" variant="red" />
                  )}

                  <div className="flex items-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-9 h-9 rounded-xl bg-[#1C1E26] hover:bg-yellow-400 hover:text-black text-gray-300 flex items-center justify-center transition-all cursor-pointer shadow"
                      title="Direct Message"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button
                      className="w-9 h-9 rounded-xl bg-[#1C1E26] hover:bg-emerald-500 hover:text-white text-gray-300 flex items-center justify-center transition-all cursor-pointer shadow"
                      title="Start Voice Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      className="w-9 h-9 rounded-xl bg-[#1C1E26] hover:bg-yellow-400 hover:text-black text-gray-300 flex items-center justify-center transition-all cursor-pointer shadow"
                      title="Start Video Call"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Now Sidebar (Discord Style) */}
        <div className="w-80 bg-[#090A0D] border-l border-[#171920] p-4 hidden lg:block overflow-y-auto custom-scrollbar">
          <h3 className="font-extrabold text-white text-sm tracking-tight mb-3">Active Now</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#121418] border border-white/5 hover:border-yellow-400/20 transition-all">
              <div className="flex items-center space-x-2.5 mb-2">
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=NeonAura"
                  alt="NeonAura"
                  className="w-8 h-8 rounded-full border border-yellow-400"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    NeonAura <NitroBadge tier="nitro" size="sm" />
                  </div>
                  <div className="text-[10px] text-yellow-400 font-semibold">Streaming in 1080p 60FPS</div>
                </div>
              </div>
              <div className="bg-[#08090B] p-2.5 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-white">Cyberpunk 2077: Phantom Liberty</div>
                <div className="text-[11px] text-gray-400">Night City Tour • 1h 42m</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#121418] border border-white/5 hover:border-yellow-400/20 transition-all">
              <div className="flex items-center space-x-2.5 mb-2">
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja"
                  alt="CyberNinja"
                  className="w-8 h-8 rounded-full border border-yellow-400"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    CyberNinja <NitroBadge tier="nitro" size="sm" />
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">In Voice Channel</div>
                </div>
              </div>
              <div className="bg-[#08090B] p-2.5 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-white">Pro Chat HQ / Gaming Room 🎮</div>
                <div className="text-[11px] text-gray-400">3 users connected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NitroModal isOpen={isNitroModalOpen} onClose={() => setIsNitroModalOpen(false)} />
    </div>
  );
};

export default FriendsView;
