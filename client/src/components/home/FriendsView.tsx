import React, { useState } from 'react';
import { 
  Users, UserPlus, MessageSquare, Phone, Video, Search, Sparkles, 
  Zap, Shield, Volume2, KeyRound, Check, Copy, Bot, ArrowRight, FileUp 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNitroStore } from '../../store/useNitroStore';
import { useServerStore } from '../../store/useServerStore';
import NitroBadge from '../ui/NitroBadge';
import { NitroModal } from '../modals/NitroModal';
import { AiAssistantModal } from '../modals/AiAssistantModal';
import { SendFileModal } from '../modals/SendFileModal';
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
  const [addInput, setAddInput] = useState('');
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isNitroModalOpen, setIsNitroModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSendFileOpen, setIsSendFileOpen] = useState(false);
  const [selectedFriendForFile, setSelectedFriendForFile] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { isNitro, nitroTier } = useNitroStore();
  const { joinServerByCode, servers } = useServerStore();

  const filteredFriends = MOCK_FRIENDS.filter((friend) => {
    if (activeTab === 'online') return friend.status !== 'OFFLINE';
    return true;
  }).filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInput.trim()) return;

    try {
      const joined = await joinServerByCode(addInput.trim());
      setAddSuccessMsg(`Successfully joined ${joined.name || addInput}! 🎉`);
      setAddInput('');
      setTimeout(() => setAddSuccessMsg(null), 4000);
    } catch {
      setAddSuccessMsg(`Friend request / server join sent for "${addInput}"! ✨`);
      setAddInput('');
      setTimeout(() => setAddSuccessMsg(null), 4000);
    }
  };

  const primaryServerCode = servers[0]?.inviteCode || 'PRO-HQ-8821';
  const myInviteLink = typeof window !== 'undefined' ? `${window.location.origin}/?join=${primaryServerCode}` : '';

  const handleCopyMyLink = () => {
    navigator.clipboard.writeText(myInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D0E12] overflow-hidden select-none">
      {/* Top Discord Friends Header Bar */}
      <div className="h-12 border-b border-[#171920] px-4 flex items-center justify-between shrink-0 bg-[#090A0D]">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-white font-extrabold text-sm mr-2">
            <Users size={18} className="text-cyan-400 mr-2" />
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
                  ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/20 font-black"
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
                  ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/20 font-black"
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
                  ? "bg-cyan-400 text-black shadow-md shadow-cyan-400/20 font-black"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span>Pending</span>
              <DiscordNotificationBadge count={2} size="sm" variant="red" />
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={clsx(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer font-black flex items-center gap-1",
                activeTab === 'add'
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
              )}
            >
              <UserPlus size={14} />
              <span>Add Friend / Join</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Ask AI & Nitro */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <Bot size={14} />
            <span>Ask Sam AI</span>
          </button>

          <button
            onClick={() => setIsNitroModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-yellow-400 text-black font-black text-xs rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles size={14} className="fill-black" />
            <span>Nitro Perks</span>
          </button>
        </div>
      </div>

      {/* Friends Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Friends List / Add Friend Screen */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          {activeTab === 'add' ? (
            /* ──────── ADD FRIEND & JOIN SERVER TAB ──────── */
            <div className="max-w-2xl mx-auto py-6 space-y-6 animate-scale-up">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  ADD FRIEND OR JOIN A SERVER
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Enter a friend's server invite code (e.g. <strong className="text-cyan-400">PRO-HQ-8821</strong>, <strong className="text-pink-400">GAME-7799</strong>) or username to connect instantly!
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div className="bg-[#121418] p-3 rounded-2xl border-2 border-cyan-400/40 flex items-center justify-between shadow-xl">
                  <input
                    type="text"
                    value={addInput}
                    onChange={(e) => setAddInput(e.target.value)}
                    placeholder="Enter Server Code or Invite Link..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none px-2 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!addInput.trim()}
                    className={clsx(
                      "px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center space-x-1.5 cursor-pointer",
                      addInput.trim()
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md hover:scale-105 active:scale-95"
                        : "bg-white/5 text-gray-500 cursor-not-allowed"
                    )}
                  >
                    <span>Join Server</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {addSuccessMsg && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center space-x-2 animate-fade-in">
                    <Check size={16} className="stroke-[3]" />
                    <span>{addSuccessMsg}</span>
                  </div>
                )}
              </form>

              {/* Share Your Own Code Banner */}
              <div className="p-5 rounded-3xl bg-[#0E121C] border border-pink-500/30 space-y-3 shadow-xl">
                <div className="flex items-center space-x-2 text-pink-400 font-black text-xs uppercase tracking-wider">
                  <KeyRound size={16} />
                  <span>Share Your 1-Click Server Link With Friends</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#080A0F] rounded-2xl border border-white/10">
                  <span className="font-mono text-xs text-cyan-300 truncate pr-3">{myInviteLink}</span>
                  <button
                    onClick={handleCopyMyLink}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 flex items-center space-x-1"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  👉 Send this link to anyone on WhatsApp, Telegram, or Discord — they can click and join your ProChat server in 1 second!
                </p>
              </div>
            </div>
          ) : (
            /* ──────── REGULAR FRIENDS LIST ──────── */
            <>
              {/* Search bar & Send File */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends by username..."
                    className="w-full bg-[#121418] border border-white/5 focus:border-cyan-400 rounded-xl px-4 py-2.5 pl-10 text-xs text-white outline-none transition-all placeholder-gray-500"
                  />
                  <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                </div>

                <button
                  onClick={() => setIsSendFileOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all shadow-md shadow-cyan-500/10 cursor-pointer active:scale-95 shrink-0"
                  title="Send File to Friend or Channel"
                >
                  <FileUp size={15} className="text-cyan-400" />
                  <span className="hidden sm:inline">Send File</span>
                </button>
              </div>

              <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-3 px-1">
                {activeTab.toUpperCase()} — {filteredFriends.length}
              </div>

              {/* Friends Rows */}
              <div className="space-y-2">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#121418]/60 hover:bg-[#161820] border border-white/5 hover:border-cyan-400/30 transition-all group shadow-sm hover:scale-[1.005]"
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
                          <span className="font-extrabold text-white text-sm group-hover:text-cyan-300 transition-colors">
                            {friend.name}
                          </span>
                          {friend.isNitro && <NitroBadge tier={friend.nitroTier || 'nitro'} size="sm" />}
                        </div>

                        <div className="text-xs text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                          {friend.activity ? (
                            <span className="text-cyan-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
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
                          onClick={() => {
                            setSelectedFriendForFile(friend.name);
                            setIsSendFileOpen(true);
                          }}
                          className="w-9 h-9 rounded-xl bg-[#1C1E26] hover:bg-cyan-400 hover:text-black text-gray-300 flex items-center justify-center transition-all cursor-pointer shadow"
                          title="Send File to User"
                        >
                          <FileUp size={16} />
                        </button>
                        <button
                          className="w-9 h-9 rounded-xl bg-[#1C1E26] hover:bg-cyan-400 hover:text-black text-gray-300 flex items-center justify-center transition-all cursor-pointer shadow"
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
                          className="w-9 h-9 rounded-xl bg-[#1C1E26] hover:bg-cyan-400 hover:text-black text-gray-300 flex items-center justify-center transition-all cursor-pointer shadow"
                          title="Start Video Call"
                        >
                          <Video size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Active Now Sidebar (Discord Style) */}
        <div className="w-80 bg-[#090A0D] border-l border-[#171920] p-4 hidden lg:block overflow-y-auto custom-scrollbar">
          <h3 className="font-extrabold text-white text-sm tracking-tight mb-3">Active Now</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#121418] border border-white/5 hover:border-cyan-400/20 transition-all">
              <div className="flex items-center space-x-2.5 mb-2">
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=NeonAura"
                  alt="NeonAura"
                  className="w-8 h-8 rounded-full border border-cyan-400"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    NeonAura <NitroBadge tier="nitro" size="sm" />
                  </div>
                  <div className="text-[10px] text-cyan-400 font-semibold">Streaming in 1080p 60FPS</div>
                </div>
              </div>
              <div className="bg-[#08090B] p-2.5 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-white">Cyberpunk 2077: Phantom Liberty</div>
                <div className="text-[11px] text-gray-400">Night City Tour • 1h 42m</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#121418] border border-white/5 hover:border-cyan-400/20 transition-all">
              <div className="flex items-center space-x-2.5 mb-2">
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja"
                  alt="CyberNinja"
                  className="w-8 h-8 rounded-full border border-cyan-400"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    CyberNinja <NitroBadge tier="nitro" size="sm" />
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold">In Voice Channel</div>
                </div>
              </div>
              <div className="bg-[#08090B] p-2.5 rounded-xl border border-white/5">
                <div className="text-xs font-bold text-white">Pro Chat HQ / General Voice</div>
                <div className="text-[11px] text-gray-400">Connected in HD Call</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NitroModal isOpen={isNitroModalOpen} onClose={() => setIsNitroModalOpen(false)} />
      <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <SendFileModal 
        isOpen={isSendFileOpen} 
        onClose={() => {
          setIsSendFileOpen(false);
          setSelectedFriendForFile(null);
        }} 
        defaultRecipientName={selectedFriendForFile || undefined} 
      />
    </div>
  );
};

export default FriendsView;
