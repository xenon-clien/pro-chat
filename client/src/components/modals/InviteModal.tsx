import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Link, Shield, Sparkles, Clock, Search, Send, KeyRound } from 'lucide-react';
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [search, setSearch] = useState('');
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});
  const { isNitro } = useNitroStore();

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://pro-chat-xenon-cliens-projects.vercel.app';
  const cleanCode = inviteCode.trim().toUpperCase();
  const fullInviteUrl = `${currentHost}/?join=${encodeURIComponent(cleanCode)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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
        className="relative w-full max-w-md bg-[#0E121B] text-[#dbdee1] rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/40 transform transition-all animate-scale-up"
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
        <div className="p-6 pb-4 text-left bg-[#0A0D14] border-b border-[#181D2A]">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-black uppercase tracking-wider mb-1">
            <UserPlus size={16} />
            <span>Invite Friends</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight truncate">
            Invite to <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">{serverName}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Share this short server code with your friend to join in 1 second!
          </p>
        </div>

        {/* 1. PRIMARY: LARGE PROMINENT SERVER CODE BANNER */}
        <div className="p-6 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
              <KeyRound size={14} />
              <span>Server Invite Code</span>
            </label>
            <span className="text-[10px] text-gray-400 font-bold">Copy & Send to Friends</span>
          </div>

          <div className="bg-[#07090E] p-3.5 rounded-2xl border-2 border-cyan-400/40 flex items-center justify-between shadow-lg shadow-cyan-500/10">
            <div className="font-mono text-xl font-black tracking-widest text-cyan-300 pl-2">
              {cleanCode}
            </div>

            <button
              onClick={handleCopyCode}
              className={clsx(
                "px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md",
                copiedCode
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-cyan-400/20 hover:scale-105 active:scale-95"
              )}
            >
              {copiedCode ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Copied Code!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 px-1 leading-relaxed">
            👉 Dost ko bolo: Left sidebar mein <strong className="text-cyan-300 font-black">+ (Add Server)</strong> dabaye, fir <strong className="text-pink-400 font-black">"Discover & Join"</strong> mein ye code daal kar <strong className="text-white">"Join"</strong> karein!
          </p>
        </div>

        {/* 2. SECONDARY: OPTIONAL FULL LINK */}
        <div className="px-6 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Or Share Direct Web Link</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#111522] border border-white/5">
            <span className="font-mono text-[11px] text-gray-400 truncate pr-2">{fullInviteUrl}</span>
            <button
              onClick={handleCopyLink}
              className="text-xs text-cyan-400 font-bold hover:underline shrink-0 px-2 py-1 cursor-pointer"
            >
              {copiedLink ? 'Copied Link!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* 3. Direct Online Friends List */}
        <div className="px-6 pb-6 pt-2 border-t border-[#181D2A]">
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
            Send Direct Invite in App
          </div>

          <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
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
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                      <div
                        className={clsx(
                          "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#090A0D]",
                          friend.status === 'ONLINE' && "bg-emerald-500",
                          friend.status === 'IDLE' && "bg-amber-400",
                          friend.status === 'DND' && "bg-rose-500",
                          friend.status === 'OFFLINE' && "bg-gray-500"
                        )}
                      />
                    </div>
                    <span className="font-bold text-white text-xs truncate">{friend.name}</span>
                  </div>

                  <button
                    onClick={() => handleSendInvite(friend.id)}
                    disabled={isInvited}
                    className={clsx(
                      "px-3 py-1 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center space-x-1 shrink-0",
                      isInvited
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-cyan-400 hover:bg-cyan-300 text-black shadow-md shadow-cyan-400/20 hover:scale-105 active:scale-95"
                    )}
                  >
                    {isInvited ? (
                      <>
                        <Check size={12} className="stroke-[3]" />
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
