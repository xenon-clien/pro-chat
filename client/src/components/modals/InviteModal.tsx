import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Link, Shield, Sparkles, Clock, Search, Send } from 'lucide-react';
import { useNitroStore } from '../../store/useNitroStore';
import NitroBadge from '../ui/NitroBadge';
import clsx from 'clsx';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverName: string;
  inviteCode?: string;
}

const INVITE_FRIENDS = [
  {
    id: 'inv-1',
    name: 'CyberNinja',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja',
    status: 'ONLINE',
    isNitro: true,
    nitroTier: 'nitro' as const,
  },
  {
    id: 'inv-2',
    name: 'NeonAura',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonAura',
    status: 'ONLINE',
    isNitro: true,
    nitroTier: 'nitro' as const,
  },
  {
    id: 'inv-3',
    name: 'GlitchMaster',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=GlitchMaster',
    status: 'IDLE',
    isNitro: true,
    nitroTier: 'classic' as const,
  },
  {
    id: 'inv-4',
    name: 'ShadowBlade',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowBlade',
    status: 'DND',
  },
  {
    id: 'inv-5',
    name: 'PixelQueen',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=PixelQueen',
    status: 'OFFLINE',
  },
];

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  serverName,
  inviteCode = 'PRO-HQ-8821',
}) => {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});
  const [expireOption, setExpireOption] = useState<'7days' | 'never'>('never');
  const { isNitro } = useNitroStore();

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://pro-chat.vercel.app';
  const fullInviteUrl = `${currentHost}/invite/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInvite = (friendId: string) => {
    setInvitedMap((prev) => ({ ...prev, [friendId]: true }));
  };

  const filteredFriends = INVITE_FRIENDS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-md bg-[#121418] text-[#dbdee1] rounded-2xl shadow-2xl overflow-hidden border border-yellow-400/30 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-yellow-400 transition-colors p-1.5 rounded-full hover:bg-gray-800 cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-3 text-left">
          <div className="flex items-center space-x-2 text-yellow-400 text-xs font-black uppercase tracking-wider mb-1">
            <UserPlus size={16} />
            <span>Invite Friends</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight truncate">
            Invite friends to <span className="text-yellow-400">{serverName}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Share this server's invite code or send direct invites to your friends.
          </p>
        </div>

        {/* Friends Direct Invite List */}
        <div className="px-6 py-2">
          {/* Search Box */}
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search friends to invite..."
              className="w-full bg-[#090A0D] text-white px-3.5 py-2 pl-9 rounded-xl border border-gray-800 focus:border-yellow-400 outline-none text-xs transition-colors"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          </div>

          <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
            {filteredFriends.map((friend) => {
              const isInvited = invitedMap[friend.id];
              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#090A0D]/70 hover:bg-[#181a20] border border-white/5 transition-all"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="relative shrink-0">
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                      <div
                        className={clsx(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#090A0D]",
                          friend.status === 'ONLINE' && "bg-emerald-500",
                          friend.status === 'IDLE' && "bg-amber-400",
                          friend.status === 'DND' && "bg-rose-500",
                          friend.status === 'OFFLINE' && "bg-gray-500"
                        )}
                      />
                    </div>
                    <div className="truncate flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs truncate">{friend.name}</span>
                      {friend.isNitro && <NitroBadge tier={friend.nitroTier} size="sm" />}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendInvite(friend.id)}
                    disabled={isInvited}
                    className={clsx(
                      "px-3 py-1 rounded-lg font-extrabold text-xs transition-all cursor-pointer flex items-center space-x-1 shrink-0",
                      isInvited
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-400/20 hover:scale-105 active:scale-95"
                    )}
                  >
                    {isInvited ? (
                      <>
                        <Check size={13} className="stroke-[3]" />
                        <span>Sent</span>
                      </>
                    ) : (
                      <span>Invite</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Server Code & Link Section */}
        <div className="p-6 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-yellow-400">
              Or Send a Server Invite Link
            </label>
            <div className="flex items-center space-x-1.5 text-[10px] text-gray-400">
              <Clock size={11} />
              <span>Link expires in {expireOption === 'never' ? 'Never' : '7 Days'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-[#090A0D] p-1.5 rounded-xl border border-gray-800 focus-within:border-yellow-400 transition-colors">
            <input
              type="text"
              readOnly
              value={fullInviteUrl}
              className="bg-transparent text-white px-2 py-1 text-xs w-full outline-none font-mono selection:bg-yellow-400 selection:text-black"
            />
            <button
              onClick={handleCopy}
              className={clsx(
                "px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-md",
                copied
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-yellow-400 hover:bg-yellow-300 text-black shadow-yellow-400/20 hover:scale-105 active:scale-95"
              )}
            >
              {copied ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Invite Code Banner */}
          <div className="bg-[#090A0D] p-3 rounded-xl border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Server Code</div>
              <div className="text-sm font-black text-yellow-400 font-mono tracking-widest">{inviteCode}</div>
            </div>
            <span className="text-[11px] text-gray-400">Friends can enter this code in "Join Server"</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#090A0D] px-6 py-3 border-t border-[#1e222a] flex items-center justify-between text-xs text-gray-500">
          <span>Need custom invite codes?</span>
          <span className="text-yellow-400 font-semibold cursor-pointer hover:underline">
            Server Boost Perks
          </span>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
