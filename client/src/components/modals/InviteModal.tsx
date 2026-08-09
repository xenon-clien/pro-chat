import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Link, Shield, Sparkles, Clock, Search, Send, ArrowRight } from 'lucide-react';
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
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja&backgroundColor=38bdf8',
    status: 'ONLINE',
    isNitro: true,
    nitroTier: 'nitro' as const,
  },
  {
    id: 'inv-2',
    name: 'NeonAura',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonAura&backgroundColor=f472b6',
    status: 'ONLINE',
    isNitro: true,
    nitroTier: 'nitro' as const,
  },
  {
    id: 'inv-3',
    name: 'GlitchMaster',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=GlitchMaster&backgroundColor=fbbf24',
    status: 'IDLE',
    isNitro: true,
    nitroTier: 'classic' as const,
  },
  {
    id: 'inv-4',
    name: 'ShadowBlade',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowBlade&backgroundColor=818cf8',
    status: 'DND',
  },
];

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  serverName,
  inviteCode = 'PRO-HQ-8821',
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [search, setSearch] = useState('');
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});
  const { isNitro } = useNitroStore();

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://pro-chat-xenon-cliens-projects.vercel.app';
  // Generates universal direct join link that auto-joins on page load
  const fullInviteUrl = `${currentHost}/?join=${encodeURIComponent(inviteCode)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSendInvite = (friendId: string) => {
    setInvitedMap((prev) => ({ ...prev, [friendId]: true }));
  };

  const filteredFriends = INVITE_FRIENDS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-[#0E121B] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/40 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors p-1.5 rounded-full hover:bg-white/5 cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-3 text-left bg-[#0A0D14] border-b border-[#181D2A]">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-black uppercase tracking-wider mb-1">
            <UserPlus size={16} />
            <span>Invite Friends</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight truncate">
            Invite friends to <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">{serverName}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Share this 1-click invite link or server code with your friends to join instantly.
          </p>
        </div>

        {/* 1. Direct Server Invite Link */}
        <div className="p-6 pb-3 space-y-3">
          <label className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>Direct 1-Click Invite Link</span>
            <span className="text-emerald-400 font-bold normal-case text-[10px]">✨ Auto-joins on click</span>
          </label>

          <div className="flex items-center space-x-2 bg-[#07090E] p-2 rounded-2xl border border-[#1D2538] focus-within:border-cyan-400 transition-colors shadow-inner">
            <input
              type="text"
              readOnly
              value={fullInviteUrl}
              className="bg-transparent text-white px-2 py-1 text-xs w-full outline-none font-mono selection:bg-cyan-400 selection:text-black font-semibold truncate"
            />
            <button
              onClick={handleCopyLink}
              className={clsx(
                "px-5 py-2 rounded-xl font-black text-xs transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-md",
                copiedLink
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-cyan-400/20 hover:scale-105 active:scale-95"
              )}
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Standalone Server Code Card */}
          <div className="bg-[#111522] p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Or Share Server Code</div>
              <div className="text-base font-black text-pink-400 font-mono tracking-wider mt-0.5">{inviteCode}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className={clsx(
                "px-4 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border",
                copiedCode
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  : "bg-[#1A2030] hover:bg-pink-500 hover:text-white border-white/10 text-gray-200"
              )}
            >
              {copiedCode ? 'Copied Code!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* 3. Direct Online Friends List */}
        <div className="px-6 pb-6 pt-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
            Send Direct Invite in App
          </div>

          <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
            {filteredFriends.map((friend) => {
              const isInvited = invitedMap[friend.id];
              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2 rounded-2xl bg-[#111522] hover:bg-[#161B28] border border-white/5 transition-all"
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
                      "px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center space-x-1 shrink-0",
                      isInvited
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-cyan-400 hover:bg-cyan-300 text-black shadow-md shadow-cyan-400/20 hover:scale-105 active:scale-95"
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
      </div>
    </div>
  );
};

export default InviteModal;
